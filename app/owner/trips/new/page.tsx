"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";
import { toISODate } from "@/lib/week";

interface Driver {
  id: string;
  name: string;
  pay_type: string | null;
}

interface Truck {
  id: string;
  unit_number: string;
}

export default function OwnerAddTripPage() {
  const { t } = useLang();
  const router = useRouter();

  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [ready, setReady] = useState(false);

  const [driverId, setDriverId] = useState("");
  const [date, setDate] = useState(toISODate(new Date()));
  const [tripNo, setTripNo] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [miles, setMiles] = useState("");
  const [hours, setHours] = useState("");
  const [truckId, setTruckId] = useState("");

  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedDriver = drivers.find((d) => d.id === driverId) ?? null;
  const hourly = selectedDriver?.pay_type === "hourly";

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        setOwnerId(user.id);

        const [dRes, tRes] = await Promise.all([
          supabase
            .from("drivers")
            .select("id,name,pay_type")
            .eq("owner_id", user.id)
            .order("name"),
          supabase
            .from("trucks")
            .select("id,unit_number")
            .eq("owner_id", user.id)
            .order("unit_number"),
        ]);
        if (dRes.error) throw dRes.error;
        if (tRes.error) throw tRes.error;
        setDrivers(dRes.data ?? []);
        setTrucks(tRes.data ?? []);
        if (dRes.data && dRes.data.length > 0) setDriverId(dRes.data[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("errorGeneric"));
      } finally {
        setReady(true);
      }
    })();
  }, [t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const milesNum = parseFloat(miles);
    const hoursNum = parseFloat(hours);
    if (
      !ownerId ||
      !driverId ||
      !date ||
      !from.trim() ||
      !to.trim() ||
      isNaN(milesNum) ||
      milesNum <= 0 ||
      (hourly && (isNaN(hoursNum) || hoursNum <= 0))
    ) {
      setError(t("errorGeneric"));
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("trips").insert({
        owner_id: ownerId,
        driver_id: driverId,
        trip_date: date,
        trip_number: tripNo.trim() || null,
        from_location: from.trim(),
        to_location: to.trim(),
        miles: milesNum,
        hours: hourly ? hoursNum : null,
        truck_id: truckId || null,
      });
      if (error) throw error;
      setSaved(true);
      setTimeout(() => router.push("/owner"), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <div className="card">
        <p className="muted">{t("loading")}</p>
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <div className="card">
        <h1>{t("addTrip")}</h1>
        <p className="muted">{t("addDriverFirst")}</p>
        <Link href="/owner/drivers" className="btn">
          {t("navDrivers")}
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <h1>{t("addTrip")}</h1>
      {saved ? (
        <div className="success-box">{t("tripSaved")}</div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <div className="error-box">{error}</div>}
          <div className="field">
            <label htmlFor="odriver">{t("selectDriver")}</label>
            <select
              id="odriver"
              required
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="odate">{t("date")}</label>
            <input
              id="odate"
              type="date"
              required
              value={date}
              max={toISODate(new Date())}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="onum">{t("tripNumber")}</label>
            <input
              id="onum"
              type="text"
              placeholder={t("tripNumberPh")}
              value={tripNo}
              onChange={(e) => setTripNo(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="ofrom">{t("from")}</label>
            <input
              id="ofrom"
              type="text"
              required
              placeholder={t("fromPh")}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="oto">{t("to")}</label>
            <input
              id="oto"
              type="text"
              required
              placeholder={t("toPh")}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="omiles">{t("miles")}</label>
            <input
              id="omiles"
              type="number"
              required
              min="0"
              step="0.1"
              inputMode="decimal"
              placeholder={t("milesPh")}
              value={miles}
              onChange={(e) => setMiles(e.target.value)}
            />
          </div>
          {hourly && (
            <div className="field">
              <label htmlFor="ohours">⏰ {t("hours")}</label>
              <input
                id="ohours"
                type="number"
                required
                min="0"
                step="0.1"
                inputMode="decimal"
                placeholder={t("hoursPh")}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
          )}
          {trucks.length > 0 && (
            <div className="field">
              <label htmlFor="otruck">{t("truck")}</label>
              <select
                id="otruck"
                value={truckId}
                onChange={(e) => setTruckId(e.target.value)}
              >
                <option value="">{t("noTruck")}</option>
                {trucks.map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tr.unit_number}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="btn-row">
            <Link href="/owner" className="btn btn-ghost">
              {t("cancel")}
            </Link>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? t("saving") : t("saveTrip")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
