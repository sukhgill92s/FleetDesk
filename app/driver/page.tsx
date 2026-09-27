"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";
import { weekRange, toISODate, cad, prettyDate } from "@/lib/week";

interface DriverRow {
  id: string;
  name: string;
  per_mile_rate_cad: number;
}

interface Trip {
  id: string;
  trip_date: string;
  trip_number: string | null;
  from_location: string;
  to_location: string;
  miles: number;
}

interface Expense {
  id: string;
  expense_date: string;
  category: string;
  amount_cad: number;
}

export default function DriverHome() {
  const { t } = useLang();
  const [status, setStatus] = useState<"loading" | "unlinked" | "ready" | "error">("loading");
  const [email, setEmail] = useState("");
  const [driver, setDriver] = useState<DriverRow | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [error, setError] = useState("");

  const range = weekRange(0);
  const startISO = toISODate(range.start);
  const endISO = toISODate(range.end);

  const load = useCallback(async () => {
    setStatus("loading");
    setError("");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("errorGeneric"));
      setEmail(user.email ?? "");

      // 1. Find my driver record.
      let { data: dRow, error: dErr } = await supabase
        .from("drivers")
        .select("id,name,per_mile_rate_cad")
        .eq("user_id", user.id)
        .maybeSingle();
      if (dErr) throw dErr;

      // 2. Not linked yet? Try to claim the record the owner created
      // with my login email (secure function — only sets user_id).
      if (!dRow && user.email) {
        const { error: claimErr } = await supabase.rpc("claim_driver_record");
        if (claimErr) throw claimErr;

        const retry = await supabase
          .from("drivers")
          .select("id,name,per_mile_rate_cad")
          .eq("user_id", user.id)
          .maybeSingle();
        if (retry.error) throw retry.error;
        dRow = retry.data;
      }

      if (!dRow) {
        setStatus("unlinked");
        return;
      }
      setDriver(dRow);

      // 3. This week's trips + expenses.
      const [tRes, eRes] = await Promise.all([
        supabase
          .from("trips")
          .select("id,trip_date,trip_number,from_location,to_location,miles")
          .eq("driver_id", dRow.id)
          .gte("trip_date", startISO)
          .lte("trip_date", endISO)
          .order("trip_date", { ascending: false }),
        supabase
          .from("expenses")
          .select("id,expense_date,category,amount_cad")
          .eq("driver_id", dRow.id)
          .gte("expense_date", startISO)
          .lte("expense_date", endISO)
          .order("expense_date", { ascending: false }),
      ]);
      if (tRes.error) throw tRes.error;
      if (eRes.error) throw eRes.error;
      setTrips(tRes.data ?? []);
      setExpenses(eRes.data ?? []);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
      setStatus("error");
    }
  }, [startISO, endISO, t]);

  useEffect(() => {
    load();
  }, [load]);

  if (status === "loading") {
    return (
      <div className="card">
        <p className="muted">{t("loading")}</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="card">
        <div className="error-box">
          {error}{" "}
          <button type="button" className="link" onClick={load}>
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }

  if (status === "unlinked") {
    return (
      <div className="card">
        <h1>{t("myWeek")}</h1>
        <p>{t("notLinked")}</p>
        <p className="muted">
          {t("notLinkedHelp")}
          <br />
          <strong>{email}</strong>
        </p>
        <button type="button" className="btn" onClick={load}>
          {t("retry")}
        </button>
      </div>
    );
  }

  const miles = trips.reduce((s, x) => s + Number(x.miles), 0);
  const pay = miles * Number(driver?.per_mile_rate_cad ?? 0);
  const expTotal = expenses.reduce((s, x) => s + Number(x.amount_cad), 0);

  return (
    <>
      <div className="card">
        <h1>
          {t("myWeek")} · {range.label}
        </h1>
        <div className="stats">
          <div className="stat">
            <div className="value">{miles.toLocaleString()}</div>
            <div className="label">{t("myMiles")}</div>
          </div>
          <div className="stat">
            <div className="value">{cad(pay)}</div>
            <div className="label">{t("myPay")}</div>
          </div>
          <div className="stat">
            <div className="value">{cad(expTotal)}</div>
            <div className="label">{t("myExpenses")}</div>
          </div>
        </div>
        <div className="btn-row">
          <Link href="/driver/trips/new" className="btn">
            ➕ {t("logTrip")}
          </Link>
          <Link href="/driver/expenses/new" className="btn btn-secondary">
            🧾 {t("logExpense")}
          </Link>
        </div>
      </div>

      <div className="card">
        <h2>{t("recentTrips")}</h2>
        {trips.length === 0 ? (
          <p className="muted">{t("noTripsYet")}</p>
        ) : (
          trips.map((tr) => (
            <Link
              key={tr.id}
              href={`/driver/trips/${tr.id}`}
              className="list-item"
              style={{ display: "block", textDecoration: "none", color: "inherit" }}
            >
              <div className="row">
                <strong>
                  {tr.from_location} → {tr.to_location}
                </strong>
                <span>{Number(tr.miles).toLocaleString()} mi</span>
              </div>
              <div className="sub">
                {prettyDate(tr.trip_date)}
                {tr.trip_number ? ` · ${t("tripNumber")}: ${tr.trip_number}` : ""}
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="card">
        <h2>{t("recentExpenses")}</h2>
        {expenses.length === 0 ? (
          <p className="muted">{t("noExpensesYet")}</p>
        ) : (
          expenses.map((e) => (
            <div key={e.id} className="list-item">
              <div className="row">
                <strong>{e.category}</strong>
                <span>{cad(Number(e.amount_cad))}</span>
              </div>
              <div className="sub">{prettyDate(e.expense_date)}</div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
