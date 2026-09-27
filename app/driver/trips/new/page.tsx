"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";
import type { PayPeriod } from "@/lib/pay";

const OPTIONS: { value: PayPeriod; labelKey: "payPeriodWeekly" | "payPeriodBiweekly" | "payPeriodMonthly"; desc: string }[] = [
  { value: "weekly", labelKey: "payPeriodWeekly", desc: "Mon – Sun" },
  { value: "biweekly", labelKey: "payPeriodBiweekly", desc: "14 days" },
  { value: "monthly", labelKey: "payPeriodMonthly", desc: "1st – month end" },
];

export default function SettingsPage() {
  const { t } = useLang();
  const [period, setPeriod] = useState<PayPeriod>("weekly");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from("profiles")
          .select("pay_period")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (data?.pay_period) setPeriod(data.pay_period as PayPeriod);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("errorGeneric"));
      } finally {
        setReady(true);
      }
    })();
  }, [t]);

  async function handleSave() {
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("errorGeneric"));
      const { error } = await supabase
        .from("profiles")
        .update({ pay_period: period })
        .eq("user_id", user.id);
      if (error) throw error;
      setSaved(true);
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
      <h1>{t("settingsTitle")}</h1>
      {error && <div className="error-box">{error}</div>}
      {saved && <div className="success-box">{t("settingsSaved")}</div>}

      <div className="field">
        <label>{t("payPeriod")}</label>
        <div className="role-cards">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`role-card ${period === o.value ? "selected" : ""}`}
              onClick={() => {
                setPeriod(o.value);
                setSaved(false);
              }}
            >
              <div className="title">{t(o.labelKey)}</div>
              <div className="desc">{o.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="btn" onClick={handleSave} disabled={saving}>
        {saving ? t("saving") : t("save")}
      </button>
    </div>
  );
}
