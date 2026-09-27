"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { useLang, type StringKey } from "@/lib/i18n";
import { toISODate } from "@/lib/week";

const CATEGORIES: { value: string; labelKey: StringKey }[] = [
  { value: "fuel", labelKey: "catFuel" },
  { value: "repair", labelKey: "catRepair" },
  { value: "food", labelKey: "catFood" },
  { value: "toll", labelKey: "catToll" },
  { value: "other", labelKey: "catOther" },
];

export default function NewExpensePage() {
  const { t } = useLang();
  const router = useRouter();

  const [driverId, setDriverId] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const [date, setDate] = useState(toISODate(new Date()));
  const [category, setCategory] = useState("fuel");
  const [amount, setAmount] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

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
    const amountNum = parseFloat(amount);
    if (!driverId || !ownerId || !date || isNaN(amountNum) || amountNum <= 0) {
      setError(t("errorGeneric"));
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      let receiptPath: string | null = null;

      if (photo) {
        const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${ownerId}/${driverId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("receipts")
          .upload(path, photo, { contentType: photo.type || "image/jpeg" });
        if (upErr) throw upErr;
        receiptPath = path;
      }

      const { error } = await supabase.from("expenses").insert({
        owner_id: ownerId,
        driver_id: driverId,
        expense_date: date,
        category,
        amount_cad: amountNum,
        receipt_path: receiptPath,
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
      <h1>{t("newExpense")}</h1>
      {saved ? (
        <div className="success-box">{t("expenseSaved")}</div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && <div className="error-box">{error}</div>}
          <div className="field">
            <label htmlFor="edate">{t("date")}</label>
            <input
              id="edate"
              type="date"
              required
              value={date}
              max={toISODate(new Date())}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="ecat">{t("category")}</label>
            <select
              id="ecat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {t(c.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="eamount">{t("amount")}</label>
            <input
              id="eamount"
              type="number"
              required
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="25.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="ephoto">{t("receipt")}</label>
            <input
              id="ephoto"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
            {photo && (
              <div className="hint">
                📎 {photo.name} ({Math.round(photo.size / 1024)} KB)
              </div>
            )}
          </div>
          <div className="btn-row">
            <Link href="/driver" className="btn btn-ghost">
              {t("cancel")}
            </Link>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? t("saving") : t("saveExpense")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
