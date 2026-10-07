"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";
import { prettyDate, cad } from "@/lib/week";

interface TripDetail {
  id: string;
  trip_date: string;
  trip_number: string | null;
  from_location: string;
  to_location: string;
  miles: number;
  hours: number | null;
  fuel_litres: number | null;
  fuel_cost_cad: number | null;
  status: string;
  trucks: { unit_number: string } | null;
}

export default function DriverTripDetailPage() {
  const { t } = useLang();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [ready, setReady] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [completing, setCompleting] = useState(false);

  async function handleAccept() {
    if (!trip) return;
    setAccepting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("trips")
        .update({ status: "accepted" })
        .eq("id", trip.id);
      if (error) throw error;
      setTrip({ ...trip, status: "accepted" });
    } finally {
      setAccepting(false);
    }
  }

  async function handleComplete() {
    if (!trip) return;
    setCompleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("trips")
        .update({ status: "completed" })
        .eq("id", trip.id);
      if (error) throw error;
      setTrip({ ...trip, status: "completed" });
    } finally {
      setCompleting(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || !id) {
          setNotFound(true);
          return;
        }
        const { data: dRow } = await supabase
          .from("drivers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!dRow) {
          setNotFound(true);
          return;
        }
        const { data, error } = await supabase
          .from("trips")
          .select(
            "id,trip_date,trip_number,from_location,to_location,miles,hours,fuel_litres,fuel_cost_cad,status,trucks(unit_number)"
          )
          .eq("id", id)
          .eq("driver_id", dRow.id)
          .maybeSingle();
        if (error) throw error;
        if (!data) setNotFound(true);
        else setTrip(data as unknown as TripDetail);
      } catch {
        setNotFound(true);
      } finally {
        setReady(true);
      }
    })();
  }, [id]);

  if (!ready) {
    return (
      <div className="card">
        <p className="muted">{t("loading")}</p>
      </div>
    );
  }

  if (notFound || !trip) {
    return (
      <div className="card">
        <p className="muted">{t("errorGeneric")}</p>
        <Link href="/driver" className="btn btn-ghost">
          {t("myWeek")}
        </Link>
      </div>
    );
  }

  const rows: [string, string][] = [
    [
      "Status",
      trip.status === "pending"
        ? `⏳ ${t("pending")}`
        : trip.status === "accepted"
          ? `✓ ${t("accepted")}`
          : `🏁 ${t("completed")}`,
    ] as [string, string],
    ...(trip.trip_number ? [[t("tripNumber"), trip.trip_number] as [string, string]] : []),
    [t("date"), prettyDate(trip.trip_date)],
    [t("from"), trip.from_location],
    [t("to"), trip.to_location],
    [t("miles"), Number(trip.miles).toLocaleString()],
    ...(trip.hours != null ? [[`${t("hours")}`, String(trip.hours)] as [string, string]] : []),
    ...(trip.fuel_litres != null
      ? [[t("fuelLitres"), String(trip.fuel_litres)] as [string, string]]
      : []),
    ...(trip.fuel_cost_cad != null
      ? [[t("fuelCost"), cad(Number(trip.fuel_cost_cad))] as [string, string]]
      : []),
    ...(trip.trucks ? [[t("truck"), trip.trucks.unit_number] as [string, string]] : []),
  ];

  return (
    <div className="card">
      <h1>{t("tripDetails")}</h1>
      <div className="detail-list">
        {rows.map(([label, value]) => (
          <div key={label} className="detail-row">
            <span className="muted">{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="btn-row" style={{ marginTop: 16 }}>
        <Link href="/driver" className="btn btn-ghost">
          {t("myWeek")}
        </Link>
        {trip.status === "pending" && (
          <button
            type="button"
            className="btn"
            disabled={accepting}
            onClick={handleAccept}
          >
            ✓ {t("accept")}
          </button>
        )}
        {trip.status === "accepted" && (
          <button
            type="button"
            className="btn"
            disabled={completing}
            onClick={handleComplete}
          >
            🏁 {t("markComplete")}
          </button>
        )}
      </div>
    </div>
  );
}
