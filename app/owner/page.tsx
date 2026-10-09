"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";
import { toISODate, cad, prettyDate } from "@/lib/week";
import { payPeriodRange, driverPay, type PayPeriod } from "@/lib/pay";

interface Driver {
  id: string;
  name: string;
  phone: string | null;
  per_mile_rate_cad: number;
  pay_type: string;
  hourly_rate_cad: number | null;
}

interface Trip {
  id: string;
  driver_id: string;
  trip_date: string;
  trip_number: string | null;
  from_location: string;
  to_location: string;
  miles: number;
  hours: number | null;
  status: string;
}

interface Expense {
  id: string;
  driver_id: string;
  expense_date: string;
  category: string;
  amount_cad: number;
  receipt_path: string | null;
  approved: boolean | null;
}

export default function OwnerDashboard() {
  const { t } = useLang();
  const [periodOffset, setPeriodOffset] = useState(0);
  const [payPeriod, setPayPeriod] = useState<PayPeriod>("weekly");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptLoading, setReceiptLoading] = useState<string | null>(null);
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);

  const range = payPeriodRange(payPeriod, periodOffset);
  const startISO = toISODate(range.start);
  const endISO = toISODate(range.end);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const [pRes, dRes, tRes, eRes] = await Promise.all([
        user
          ? supabase
              .from("profiles")
              .select("pay_period")
              .eq("user_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase
          .from("drivers")
          .select("id,name,phone,per_mile_rate_cad,pay_type,hourly_rate_cad")
          .order("name"),
        supabase
          .from("trips")
          .select("id,driver_id,trip_date,trip_number,from_location,to_location,miles,hours,status")
          .gte("trip_date", startISO)
          .lte("trip_date", endISO),
        supabase
          .from("expenses")
          .select("id,driver_id,expense_date,category,amount_cad,receipt_path,approved")
          .gte("expense_date", startISO)
          .lte("expense_date", endISO)
          .order("expense_date", { ascending: false }),
      ]);
      if (pRes.error) throw pRes.error;
      if (dRes.error) throw dRes.error;
      if (tRes.error) throw tRes.error;
      if (eRes.error) throw eRes.error;
      if (pRes.data?.pay_period) setPayPeriod(pRes.data.pay_period as PayPeriod);
      setDrivers(dRes.data ?? []);
      setTrips(tRes.data ?? []);
      setExpenses(eRes.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }, [startISO, endISO, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function openReceipt(path: string, id: string) {
    setReceiptLoading(id);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("receipts")
        .createSignedUrl(path, 300);
      if (error) throw error;
      setReceiptUrl(data.signedUrl);
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setReceiptLoading(null);
    }
  }

  async function setApproval(id: string, value: boolean) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("expenses")
        .update({ approved: value })
        .eq("id", id);
      if (error) throw error;
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, approved: value } : e))
      );
    } catch {
      setError(t("errorGeneric"));
    }
  }

  const summary = drivers.map((d) => {
    const dTrips = trips.filter(
      (x) => x.driver_id === d.id && x.status !== "pending"
    );
    const dPending = trips.filter(
      (x) => x.driver_id === d.id && x.status === "pending"
    );
    const dExp = expenses.filter(
      (x) => x.driver_id === d.id && x.approved !== false
    );
    const miles = dTrips.reduce((s, x) => s + Number(x.miles), 0);
    const hours = dTrips.reduce((s, x) => s + Number(x.hours ?? 0), 0);
    const expTotal = dExp.reduce((s, x) => s + Number(x.amount_cad), 0);
    return {
      driver: d,
      tripCount: dTrips.length,
      pendingCount: dPending.length,
      miles,
      hours,
      pay: driverPay(
        d.pay_type,
        Number(d.per_mile_rate_cad),
        d.hourly_rate_cad == null ? null : Number(d.hourly_rate_cad),
        miles,
        hours
      ),
      expTotal,
    };
  });

  const totMiles = summary.reduce((s, x) => s + x.miles, 0);
  const totPay = summary.reduce((s, x) => s + x.pay, 0);
  const totExp = summary.reduce((s, x) => s + x.expTotal, 0);

  function rateLabel(d: Driver): string {
    return d.pay_type === "hourly"
      ? `${cad(Number(d.hourly_rate_cad ?? 0))}/hr`
      : `${cad(Number(d.per_mile_rate_cad))}/mi`;
  }

  function avatarColor(name: string): string {
    const palette = ["#8ab6f0", "#a78bfa", "#f0a6b8", "#7fd6a4", "#f5c66b", "#7fc4d6"];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
    return palette[h % palette.length];
  }

  return (
    <>
      {/* Period navigator */}
      <div className="fd-period-card">
        <button
          type="button"
          className="fd-period-arrow"
          onClick={() => setPeriodOffset((o) => o - 1)}
          aria-label={t("prevPeriod")}
        >
          ‹
        </button>
        <span className="fd-period-label">{range.label}</span>
        <button
          type="button"
          className="fd-period-arrow"
          onClick={() => setPeriodOffset((o) => o + 1)}
          disabled={periodOffset >= 0}
          aria-label={t("nextPeriod")}
        >
          ›
        </button>
        <a
          className="fd-csv-btn"
          href={`/api/payroll-csv?period=${payPeriod}&offset=${periodOffset}`}
          download
        >
          ⬇ {t("payrollCsv")}
        </a>
      </div>

      {/* KPI summary */}
      <div className="fd-kpi-grid">
        <div className="fd-kpi">
          <span className="fd-kpi-icon" aria-hidden="true">📍</span>
          <span className="fd-kpi-num">{trips.length}</span>
          <span className="fd-kpi-label">{t("tripsCount")}</span>
        </div>
        <div className="fd-kpi">
          <span className="fd-kpi-icon" aria-hidden="true">🗺️</span>
          <span className="fd-kpi-num">{totMiles.toLocaleString()}</span>
          <span className="fd-kpi-label">{t("miles")}</span>
        </div>
        <div className="fd-kpi">
          <span className="fd-kpi-icon" aria-hidden="true">💰</span>
          <span className="fd-kpi-num fd-kpi-green">{cad(totPay)}</span>
          <span className="fd-kpi-label">{t("payOwed")}</span>
        </div>
        <div className="fd-kpi">
          <span className="fd-kpi-icon" aria-hidden="true">🧾</span>
          <span className="fd-kpi-num">{cad(totExp)}</span>
          <span className="fd-kpi-label">{t("expenses")}</span>
        </div>
      </div>

      {loading ? (
        <p className="muted">{t("loading")}</p>
      ) : error ? (
        <div className="error-box">
          {error}{" "}
          <button type="button" className="link" onClick={load}>
            {t("retry")}
          </button>
        </div>
      ) : drivers.length === 0 ? (
        <p className="muted">{t("noDrivers")}</p>
      ) : (
        <>
          <h2 className="fd-section-title">{t("drivers")}</h2>
          <div className="fd-card">
            {summary.map((s) => {
              const dTrips = trips
                .filter((x) => x.driver_id === s.driver.id)
                .sort((a, b) => {
                  if (a.status === "pending" && b.status !== "pending")
                    return -1;
                  if (a.status !== "pending" && b.status === "pending") return 1;
                  return a.trip_date < b.trip_date ? 1 : -1;
                });
              const isOpen = expandedDriver === s.driver.id;
              return (
                <Fragment key={s.driver.id}>
                  <button
                    type="button"
                    className="fd-driver-row"
                    onClick={() => setExpandedDriver(isOpen ? null : s.driver.id)}
                    aria-expanded={isOpen}
                  >
                    <span
                      className="fd-avatar"
                      style={{ background: avatarColor(s.driver.name) }}
                      aria-hidden="true"
                    >
                      {s.driver.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="fd-driver-info">
                      <strong>{s.driver.name}</strong>
                      <span className="muted">
                        {s.miles.toLocaleString()} {t("miles").toLowerCase()} ·{" "}
                        {rateLabel(s.driver)}
                        {s.pendingCount > 0 &&
                          ` · ⏳ ${s.pendingCount} ${t("pending")}`}
                      </span>
                    </span>
                    <span className="fd-driver-pay">{cad(s.pay)}</span>
                    <span className="fd-chev" aria-hidden="true">
                      {isOpen ? "▾" : "›"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="fd-driver-detail">
                      <a
                        className="btn btn-secondary"
                        style={{
                          display: "inline-block",
                          marginBottom: 10,
                          fontSize: 14,
                          padding: "8px 14px",
                          textDecoration: "none",
                        }}
                        href={`/api/paystub?driverId=${s.driver.id}&period=${payPeriod}&offset=${periodOffset}`}
                        download
                      >
                        📄 {t("paystubPdf")}
                      </a>
                      {dTrips.length === 0 ? (
                        <p className="muted">{t("noTripsYet")}</p>
                      ) : (
                        dTrips.map((tr) => (
                          <Link
                            key={tr.id}
                            href={`/owner/trips/${tr.id}`}
                            className="list-item"
                            style={{
                              display: "block",
                              textDecoration: "none",
                              color: "inherit",
                            }}
                          >
                            <div className="row">
                              <strong>
                                {tr.from_location} → {tr.to_location}
                              </strong>
                              <span
                                className={
                                  tr.status === "pending"
                                    ? "badge badge-pending"
                                    : tr.status === "accepted"
                                      ? "badge badge-delivered"
                                      : "badge badge-completed"
                                }
                              >
                                {tr.status === "pending"
                                  ? `⏳ ${t("pending")}`
                                  : tr.status === "accepted"
                                    ? `✓ ${t("accepted")}`
                                    : `🏁 ${t("completed")}`}
                              </span>
                              <span>{Number(tr.miles).toLocaleString()} mi</span>
                            </div>
                            <div className="sub">
                              {prettyDate(tr.trip_date)}
                              {tr.trip_number
                                ? ` · ${t("tripNumber")}: ${tr.trip_number}`
                                : ""}
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
        </>
      )}

      {/* Quick actions — Manage links already live in the bottom nav */}
      <div className="btn-row" style={{ marginTop: 16 }}>
        <Link href="/owner/trips/new" className="btn">
          ➕ {t("addTrip")}
        </Link>
      </div>

      {expenses.length > 0 && (
        <>
          <h2 className="fd-section-title">
            {t("expenses")} · {range.label}
          </h2>
          <div className="fd-card">
            {(() => {
              const byCat: Record<string, number> = {};
              expenses.forEach((e) => {
                byCat[e.category] =
                  (byCat[e.category] ?? 0) + Number(e.amount_cad);
              });
              const missing = expenses.filter((e) => !e.receipt_path).length;
              return (
                <>
                  <div className="exp-breakdown">
                    {Object.entries(byCat).map(([c, amt]) => (
                      <span key={c} className="exp-chip">
                        {c}: <b>{cad(amt)}</b>
                      </span>
                    ))}
                  </div>
                  {missing > 0 && (
                    <p className="warn-line">
                      🧾 {missing} {t("missingReceipts")}
                    </p>
                  )}
                </>
              );
            })()}
            {expenses.map((e) => {
              const d = drivers.find((x) => x.id === e.driver_id);
              return (
                <div key={e.id} className="fd-exp-row">
                  <div className="row">
                    <strong>
                      {e.category} <span className="muted">· {d?.name ?? "—"}</span>
                    </strong>
                    <strong>{cad(Number(e.amount_cad))}</strong>
                  </div>
                  <div className="sub">
                    {prettyDate(e.expense_date)}
                    {e.receipt_path && (
                      <>
                        {" · "}
                        <button
                          type="button"
                          className="link"
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                          onClick={() => openReceipt(e.receipt_path!, e.id)}
                          disabled={receiptLoading === e.id}
                        >
                          {receiptLoading === e.id
                            ? t("loading")
                            : `🧾 ${t("viewReceipt")}`}
                        </button>
                      </>
                    )}{" "}
                    {e.approved === true ? (
                      <span className="badge badge-delivered">
                        ✓ {t("approved")}
                      </span>
                    ) : e.approved === false ? (
                      <span className="badge badge-rejected">
                        ✗ {t("rejected")}
                      </span>
                    ) : (
                      <span className="badge">⏳ {t("pending")}</span>
                    )}
                  </div>
                  {e.approved === null && (
                    <div className="row" style={{ marginTop: 8, gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: 14, padding: "8px 14px" }}
                        onClick={() => setApproval(e.id, true)}
                      >
                        ✓ {t("approve")}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: 14, padding: "8px 14px" }}
                        onClick={() => setApproval(e.id, false)}
                      >
                        ✗ {t("reject")}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {receiptUrl && (
        <div className="card">
          <h2>🧾 {t("viewReceipt")}</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={receiptUrl}
            alt="Receipt"
            style={{ width: "100%", borderRadius: 8 }}
          />
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn-ghost btn"
              onClick={() => setReceiptUrl(null)}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
