"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { toISODate } from "@/lib/week";
import { parseDispatchMessage } from "@/lib/parseDispatch";

interface Truck {
  id: string;
  unit_number: string;
}

const EXAMPLE =
  "Hi, load available: Brampton ON → Montreal QC, Oct 20, 7:00 AM, 16,900 kg groceries, $1,790 CAD, Ref NG-5521";

export default function DriverImportTripPage() {
  const router = useRouter();

  const [driverId, setDriverId] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [payType, setPayType] = useState<string>("per_mile");
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [ready, setReady] = useState(false);

  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState(false);

  const [date, setDate] = useState(toISODate(new Date()));
  const [tripNo, setTripNo] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [miles, setMiles] = useState("");
  const [hours, setHours] = useState("");
  const [rate, setRate] = useState("");
  const [weight, setWeight] = useState("");
  const [commodity, setCommodity] = useState("");
  const [truckId, setTruckId] = useState("");
  const [trailerNo, setTrailerNo] = useState("");
  const [dispatchNotes, setDispatchNotes] = useState("");

  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const hourly = payType === "hourly";

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
          .select("id,owner_id,pay_type")
          .eq("user_id", user.id)
          .maybeSingle();
        if (dErr) throw dErr;
        if (!dRow) {
          router.push("/driver");
          return;
        }
        setDriverId(dRow.id);
        setOwnerId(dRow.owner_id);
        setPayType(dRow.pay_type ?? "per_mile");

        const { data: trks } = await supabase
          .from("trucks")
          .select("id,unit_number")
          .eq("owner_id", dRow.owner_id)
          .order("unit_number");
        setTrucks(trks ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setReady(true);
      }
    })();
  }, [router]);

  function handleParse() {
    const p = parseDispatchMessage(raw);
    setFrom(p.from);
    setTo(p.to);
    if (p.date) setDate(p.date);
    setMiles(p.miles);
    setTripNo(p.tripNo);
    setRate(p.rate);
    setWeight(p.weight);
    setCommodity(p.commodity);
    if (p.truckNo) {
      const match = trucks.find(
        (t) =>
          t.unit_number.trim().toLowerCase() === p.truckNo.trim().toLowerCase()
      );
      if (match) setTruckId(match.id);
    }
    setTrailerNo(p.trailerNo);
    setDispatchNotes(p.notes);
    setParsed(true);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const milesNum = parseFloat(miles);
    const hoursNum = parseFloat(hours);
    if (
      !driverId ||
      !ownerId ||
      !date ||
      !from.trim() ||
      !to.trim() ||
      isNaN(milesNum) ||
      milesNum <= 0 ||
      (hourly && (isNaN(hoursNum) || hoursNum <= 0))
    ) {
      setError("Please check the highlighted fields and try again.");
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
        status: "accepted",
        from_location: from.trim(),
        to_location: to.trim(),
        miles: milesNum,
        hours: hourly ? hoursNum : null,
        truck_id: truckId || null,
        rate_cad: rate.trim() ? parseFloat(rate) : null,
        weight_kg: weight.trim() ? parseFloat(weight) : null,
        commodity: commodity.trim() || null,
      });
      if (error) throw error;
      setSaved(true);
      setTimeout(() => router.push("/driver"), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <div className="card">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h1>📥 Import from WhatsApp</h1>

      {saved ? (
        <div className="success-box">Trip created!</div>
      ) : !parsed ? (
        <>
          <p className="muted">
            Copy the company&apos;s dispatch message from WhatsApp and paste it
            below. We&apos;ll pull out the route, date, rate and reference —
            you review before the trip is created.
          </p>
          {error && <div className="error-box">{error}</div>}
          <div className="field">
            <label htmlFor="wa-msg">Dispatch message</label>
            <textarea
              id="wa-msg"
              rows={6}
              placeholder={EXAMPLE}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn"
            disabled={!raw.trim()}
            onClick={handleParse}
          >
            Parse message →
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <div className="error-box">{error}</div>}
          <details className="muted" style={{ marginBottom: 12 }}>
            <summary>View pasted message</summary>
            <p style={{ whiteSpace: "pre-wrap" }}>{raw}</p>
          </details>

          {(trailerNo || dispatchNotes) && (
            <div
              style={{
                border: "1px solid #ddd6c2",
                background: "#fbf8ef",
                borderRadius: 8,
                padding: "10px 12px",
                marginBottom: 12,
              }}
            >
              <strong>From the dispatch message</strong>
              {trailerNo && <div>🚛 Trailer: {trailerNo}</div>}
              {dispatchNotes && <div>📝 {dispatchNotes}</div>}
            </div>
          )}

          <div className="field">
            <label htmlFor="i-from">From</label>
            <input
              id="i-from"
              type="text"
              required
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="i-to">To</label>
            <input
              id="i-to"
              type="text"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="i-date">Date</label>
            <input
              id="i-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="i-miles">Miles</label>
            <input
              id="i-miles"
              type="number"
              min="0"
              step="0.1"
              required
              placeholder="Enter miles"
              value={miles}
              onChange={(e) => setMiles(e.target.value)}
            />
          </div>

          {hourly && (
            <div className="field">
              <label htmlFor="i-hours">Hours</label>
              <input
                id="i-hours"
                type="number"
                min="0"
                step="0.1"
                required
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="i-num">Trip / load #</label>
            <input
              id="i-num"
              type="text"
              value={tripNo}
              onChange={(e) => setTripNo(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="i-rate">Rate (CAD)</label>
            <input
              id="i-rate"
              type="number"
              min="0"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="i-weight">Weight (kg)</label>
            <input
              id="i-weight"
              type="number"
              min="0"
              step="1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="i-commodity">Commodity</label>
            <input
              id="i-commodity"
              type="text"
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="i-truck">Truck (optional)</label>
            <select
              id="i-truck"
              value={truckId}
              onChange={(e) => setTruckId(e.target.value)}
            >
              <option value="">—</option>
              {trucks.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.unit_number}
                </option>
              ))}
            </select>
          </div>

          <div className="btn-row">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? "Creating…" : "Create Trip"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setParsed(false)}
            >
              ← Paste another
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
