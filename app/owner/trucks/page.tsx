"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";

interface Truck {
  id: string;
  unit_number: string;
  plate: string | null;
}

export default function TrucksPage() {
  const { t } = useLang();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [unitNumber, setUnitNumber] = useState("");
  const [plate, setPlate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("trucks")
        .select("id,unit_number,plate")
        .order("unit_number");
      if (error) throw error;
      setTrucks(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!unitNumber.trim()) {
      setError(t("errorGeneric"));
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("errorGeneric"));

      const { error } = await supabase.from("trucks").insert({
        owner_id: user.id,
        unit_number: unitNumber.trim(),
        plate: plate.trim() || null,
      });
      if (error) throw error;

      setUnitNumber("");
      setPlate("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="card">
        <h1>{t("trucksTitle")}</h1>
        {loading ? (
          <p className="muted">{t("loading")}</p>
        ) : trucks.length === 0 ? (
          <p className="muted">{t("noTrucksYet")}</p>
        ) : (
          trucks.map((tr) => (
            <div key={tr.id} className="list-item">
              <div className="row">
                <strong>
                  🚛 {tr.unit_number}
                </strong>
                <span className="muted">{tr.plate ?? "—"}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h2>{t("addTruck")}</h2>
        <form onSubmit={handleAdd}>
          {error && <div className="error-box">{error}</div>}
          <div className="field">
            <label htmlFor="unit">{t("unitNumber")}</label>
            <input
              id="unit"
              type="text"
              required
              placeholder={t("unitNumberPh")}
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="plate">{t("plate")}</label>
            <input
              id="plate"
              type="text"
              placeholder={t("platePh")}
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
            />
          </div>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? t("addingTruck") : t("addTruck")}
          </button>
        </form>
      </div>
    </>
  );
}
