"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";
import { weekRange, toISODate, cad, prettyDate } from "@/lib/week";

interface Driver {
  id: string;
  name: string;
  phone: string | null;
  per_mile_rate_cad: number;
}

interface Trip {
  id: string;
  driver_id: string;
  trip_date: string;
  miles: number;
}

interface Expense {
  id: string;
  driver_id: string;
  expense_date: string;
  category: string;
  amount_cad: number;
  receipt_path: string | null;
}

export default function OwnerDashboard() {
  const { t } = useLang();
  const [weekOffset, setWeekOffset] = useState(0);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptLoading, setReceiptLoading] = useState<string | null>(null);

  const range = weekRange(weekOffset);
  const startISO = toISODate(range.start);
  const endISO = toISODate(range.end);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const [dRes, tRes, eRes] = await Promise.all([
        supabase.from("drivers").select("id,name,phone,per_mile_rate_cad").order("name"),
        supabase
          .from("trips")
          .select("id,driver_id,trip_date,miles")
          .gte("trip_date", startISO)
          .lte("trip_date", endISO),
        supabase
          .from("expenses")
          .select("id,driver_id,expense_date,category,amount_cad,receipt_path")
          .gte("expense_date", startISO)
          .lte("expense_date", endISO)
          .order("expense_date", { ascending: false }),
      ]);
      if (dRes.error) throw dRes.error;
      if (tRes.error) throw tRes.error;
      if (eRes.error) throw eRes.error;
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

  const summary = drivers.map((d) => {
    const dTrips = trips.filter((x) => x.driver_id === d.id);
    const dExp = expenses.filter((x) => x.driver_id === d.id);
    const miles = dTrips.reduce((s, x) => s + Number(x.miles), 0);
    const expTotal = dExp.reduce((s, x) => s + Number(x.amount_cad), 0);
    return {
      driver: d,
      tripCount: dTrips.length,
      miles,
      pay: miles * Number(d.per_mile_rate_cad),
      expTotal,
    };
  });

  const totMiles = summary.reduce((s, x) => s + x.miles, 0);
  const totPay = summary.reduce((s, x) => s + x.pay, 0);
  const totExp = summary.reduce((s, x) => s + x.expTotal, 0);

  return (
    <>
      <div className="card">
        <h1>{t("dashboardTitle")}</h1>
        <div className="week-nav">
          <button
            type="button"
            className="btn-ghost btn"
            onClick={() => setWeekOffset((o) => o - 1)}
          >
            {t("prevWeek")}
          </button>
          <span className="week-label">{range.label}</span>
          <button
            type="button"
            className="btn-ghost btn"
            onClick={() => setWeekOffset((o) => o + 1)}
            disabled={weekOffset >= 0}
          >
            {t("nextWeek")}
          </button>
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
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>{t("driver")}</th>
                  <th className="num">{t("miles")}</th>
                  <th className="num">
                    {t("payOwed")} ({t("rate")})
                  </th>
                  <th className="num">{t("expenses")}</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.driver.id}>
                    <td>
                      <strong>{s.driver.name}</strong>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {s.tripCount} {t("tripsCount")} ·{" "}
                        {cad(Number(s.driver.per_mile_rate_cad))}/mi
                      </div>
                    </td>
                    <td className="num">{s.miles.toLocaleString()}</td>
                    <td className="num">{cad(s.pay)}</td>
                    <td className="num">{cad(s.expTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>{t("total")}</td>
                  <td className="num">{totMiles.toLocaleString()}</td>
                  <td className="num">{cad(totPay)}</td>
                  <td className="num">{cad(totExp)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="btn-row" style={{ marginTop: 16 }}>
          <Link href="/owner/drivers" className="btn btn-secondary">
            {t("manageDrivers")}
          </Link>
          <Link href="/owner/trucks" className="btn btn-secondary">
            {t("manageTrucks")}
          </Link>
        </div>
      </div>

      {expenses.length > 0 && (
        <div className="card">
          <h2>
            {t("expenses")} · {range.label}
          </h2>
          {expenses.map((e) => {
            const d = drivers.find((x) => x.id === e.driver_id);
            return (
              <div key={e.id} className="list-item">
                <div className="row">
                  <strong>{d?.name ?? "—"}</strong>
                  <strong>{cad(Number(e.amount_cad))}</strong>
                </div>
                <div className="sub">
                  {prettyDate(e.expense_date)} · {e.category}
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
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}X

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
