"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";
import { toISODate } from "@/lib/week";

interface Truck {
  id: string;
  unit_number: string;
}

export default function NewTripPage() {
  const { t } = useLang();
  const router = useRouter();

  const [driverId, setDriverId] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [ready, setReady] = useState(false);

  const [date, setDate] = useState(toISODate(new Date()));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [miles, setMiles] = useState("");
  const [fuelLitres, setFuelLitres] = useState("");
  const [fuelCost, setFuelCost] = useState("");
  const [truckId, setTruckId] = useState("");

  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: dRow, error: dErr } = await supabase
          .from("drivers")
          .select("id,owner_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (dErr) throw dErr;
        if (!dRow) {
          router.push("/driver");
          return;
        }
        setDriverId(dRow.id);
        setOwnerId(dRow.owner_id);

        const { data: trks } = await supabase
          .from("trucks")
          .select("id,unit_number")
          .eq("owner_id", dRow.owner_id)
          .order("unit_number");
        // RLS lets drivers read (not change) their company's trucks.
        setTrucks(trks ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("errorGeneric"));
      } finally {
        setReady(true);
      }
    })();
  }, [router, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const milesNum = parseFloat(miles);
    if (!driverId || !ownerId || !date || !from.trim() || !to.trim() || isNaN(milesNum) || milesNum <= 0) {
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
        from_location: from.trim(),
        to_location: to.trim(),
        miles: milesNum,
        fuel_litres: fuelLitres ? parseFloat(fuelLitres) : null,
        fuel_cost_cad: fuelCost ? parseFloat(fuelCost) : null,
        truck_id: truckId || null,
      });
      if (error) throw error;
      setSaved(true);
      setTimeout(() => router.push("/driver"), 1200);
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

  return (
    <div className="card">
      <h1>{t("newTrip")}</h1>
      {saved ? (
        <div className="success-box">{t("tripSaved")}</div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <div className="error-box">{error}</div>}
          <div className="field">
            <label htmlFor="tdate">{t("date")}</label>
            <input
              id="tdate"
              type="date"
              required
              value={date}
              max={toISODate(new Date())}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="tfrom">{t("from")}</label>
            <input
              id="tfrom"
              type="text"
              required
              placeholder={t("fromPh")}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="tto">{t("to")}</label>
            <input
              id="tto"
              type="text"
              required
              placeholder={t("toPh")}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="tmiles">{t("miles")}</label>
            <input
              id="tmiles"
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
          <div className="field">
            <label htmlFor="tfuel">{t("fuelLitres")}</label>
            <input
              id="tfuel"
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={fuelLitres}
              onChange={(e) => setFuelLitres(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="tfuelcost">{t("fuelCost")}</label>
            <input
              id="tfuelcost"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={fuelCost}
              onChange={(e) => setFuelCost(e.target.value)}
            />
          </div>
          {trucks.length > 0 && (
            <div className="field">
              <label htmlFor="ttruck">{t("truck")}</label>
              <select
                id="ttruck"
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
            <Link href="/driver" className="btn btn-ghost">
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
