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

  function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }


  return (
    <div className="fdash">
      {/* Date range & export bar */}
      <div className="fdash-bar">
        <div className="fdash-nav">
          <button
            type="button"
            className="fdash-arrow"
            onClick={() => setPeriodOffset((o) => o - 1)}
            aria-label={t("prevPeriod")}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="fdash-range">{range.label}</span>
          <button
            type="button"
            className="fdash-arrow"
            onClick={() => setPeriodOffset((o) => o + 1)}
            disabled={periodOffset >= 0}
            aria-label={t("nextPeriod")}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <a
          className="fdash-csv"
          href={`/api/payroll-csv?period=${payPeriod}&offset=${periodOffset}`}
          download
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {t("payrollCsv")}
        </a>
      </div>

      {/* Metric cards */}
      <div className="fdash-grid">
        <div className="fdash-metric">
          <div className="fdash-metric-top">
            <span className="fdash-metric-label">{t("tripsCount")}</span>
            <span className="fdash-metric-icon mi-indigo" aria-hidden="true">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
          </div>
          <span className="fdash-metric-val">{trips.length}</span>
        </div>
        <div className="fdash-metric">
          <div className="fdash-metric-top">
            <span className="fdash-metric-label">{t("miles")}</span>
            <span className="fdash-metric-icon mi-blue" aria-hidden="true">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </span>
          </div>
          <span className="fdash-metric-val">{totMiles.toLocaleString()}</span>
        </div>
        <div className="fdash-metric">
          <div className="fdash-metric-top">
            <span className="fdash-metric-label">{t("payOwed")}</span>
            <span className="fdash-metric-icon mi-emerald" aria-hidden="true">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <span className="fdash-metric-val green">{cad(totPay)}</span>
        </div>
        <div className="fdash-metric">
          <div className="fdash-metric-top">
            <span className="fdash-metric-label">{t("expenses")}</span>
            <span className="fdash-metric-icon mi-amber" aria-hidden="true">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </span>
          </div>
          <span className="fdash-metric-val">{cad(totExp)}</span>
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
          <h2 className="fdash-section">{t("driversSummary")}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
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
                    className={`fdash-driver${isOpen ? " open" : ""}`}
                    onClick={() => setExpandedDriver(isOpen ? null : s.driver.id)}
                    aria-expanded={isOpen}
                  >
                    <span className="fdash-driver-main">
                      <span className="fdash-avatar" aria-hidden="true">
                        {initials(s.driver.name)}
                      </span>
                      <span className="fdash-dinfo">
                        <strong>{s.driver.name}</strong>
                        <span>
                          {s.miles.toLocaleString()} {t("miles").toLowerCase()}{" "}
                          <span style={{ color: "#cbd5e1" }}>·</span>{" "}
                          <span className="fdash-rate">{rateLabel(s.driver)}</span>
                          {s.pendingCount > 0 &&
                            ` · ⏳ ${s.pendingCount} ${t("pending")}`}
                        </span>
                      </span>
                    </span>
                    <span className="fdash-driver-right">
                      <span className="fdash-pay">{cad(s.pay)}</span>
                      <span className="fdash-chev" aria-hidden="true">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="fdash-detail">
                      <a
                        className="btn btn-secondary"
                        style={{
                          display: "inline-block",
                          marginBottom: 10,
                          fontSize: 13,
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
                                    ? "pill pill-pending"
                                    : tr.status === "accepted"
                                      ? "pill pill-info"
                                      : "pill pill-approved"
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

      <div style={{ paddingTop: 8, marginBottom: 16 }}>
        <Link href="/owner/trips/new" className="fdash-addtrip">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>{t("addTrip")}</span>
        </Link>
      </div>

      {expenses.length > 0 && (
        <>
          <h2 className="fdash-section">
            {t("expenses")} · {range.label}
          </h2>
          <div className="fdash-card">
            {(() => {
              const byCat: Record<string, number> = {};
              expenses.forEach((e) => {
                byCat[e.category] =
                  (byCat[e.category] ?? 0) + Number(e.amount_cad);
              });
              const missing = expenses.filter((e) => !e.receipt_path).length;
              return (
                <>
                  <div className="exp-breakdown" style={{ padding: "12px 16px 0" }}>
                    {Object.entries(byCat).map(([c, amt]) => (
                      <span key={c} className="exp-chip">
                        {c}: <b>{cad(amt)}</b>
                      </span>
                    ))}
                  </div>
                  {missing > 0 && (
                    <p className="warn-line" style={{ padding: "0 16px" }}>
                      🧾 {missing} {t("missingReceipts")}
                    </p>
                  )}
                </>
              );
            })()}
            {expenses.map((e, i) => {
              const d = drivers.find((x) => x.id === e.driver_id);
              return (
                <div
                  key={e.id}
                  className={`fdash-exp${i === expenses.length - 1 ? " last" : ""}`}
                >
                  <div className="row">
                    <strong>
                      {e.category}{" "}
                      <span style={{ fontWeight: 400, color: "#64748b", fontSize: 13 }}>
                        · {d?.name ?? "—"}
                      </span>
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
                      <span className="pill pill-approved">✓ {t("approved")}</span>
                    ) : e.approved === false ? (
                      <span className="pill pill-rejected">✗ {t("rejected")}</span>
                    ) : (
                      <span className="pill pill-pending">⏳ {t("pending")}</span>
                    )}
                  </div>
                  {e.approved === null && (
                    <div className="row" style={{ marginTop: 8, gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: 13, padding: "7px 12px" }}
                        onClick={() => setApproval(e.id, true)}
                      >
                        ✓ {t("approve")}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: 13, padding: "7px 12px" }}
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
    </div>
  );
}
