"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";
import { cad } from "@/lib/week";

interface Driver {
  id: string;
  name: string;
  phone: string | null;
  login_email: string | null;
  per_mile_rate_cad: number;
  pay_type: string;
  hourly_rate_cad: number | null;
  user_id: string | null;
}

type PayType = "per_mile" | "hourly";

export default function DriversPage() {
  const { t } = useLang();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [payType, setPayType] = useState<PayType>("per_mile");
  const [rate, setRate] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("drivers")
        .select(
          "id,name,phone,login_email,per_mile_rate_cad,pay_type,hourly_rate_cad,user_id"
        )
        .order("name");
      if (error) throw error;
      setDrivers(data ?? []);
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
    const rateNum = parseFloat(rate);
    const hourlyNum = parseFloat(hourlyRate);
    const valid =
      name.trim() &&
      (payType === "per_mile"
        ? !isNaN(rateNum) && rateNum > 0
        : !isNaN(hourlyNum) && hourlyNum > 0);
    if (!valid) {
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

      const { error } = await supabase.from("drivers").insert({
        owner_id: user.id,
        name: name.trim(),
        phone: phone.trim() || null,
        login_email: loginEmail.trim().toLowerCase() || null,
        pay_type: payType,
        per_mile_rate_cad: payType === "per_mile" ? rateNum : 0,
        hourly_rate_cad: payType === "hourly" ? hourlyNum : null,
      });
      if (error) throw error;

      setName("");
      setPhone("");
      setLoginEmail("");
      setRate("");
      setHourlyRate("");
      setPayType("per_mile");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    } finally {
      setSaving(false);
    }
  }

  function rateLabel(d: Driver): string {
    return d.pay_type === "hourly"
      ? `${cad(Number(d.hourly_rate_cad ?? 0))}/hr`
      : `${cad(Number(d.per_mile_rate_cad))}/mi`;
  }

  return (
    <>
      <div className="card">
        <h1>{t("driversTitle")}</h1>
        {loading ? (
          <p className="muted">{t("loading")}</p>
        ) : drivers.length === 0 ? (
          <p className="muted">{t("noDriversYet")}</p>
        ) : (
          drivers.map((d) => (
            <div key={d.id} className="list-item">
              <div className="row">
                <strong>{d.name}</strong>
                <span>{rateLabel(d)}</span>
              </div>
              <div className="sub">
                {[d.phone, d.login_email].filter(Boolean).join(" · ")}
                {!d.user_id && (
                  <>
                    {" · "}
                    <span className="badge">not signed up</span>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h2>{t("addDriver")}</h2>
        <form onSubmit={handleAdd}>
          {error && <div className="error-box">{error}</div>}
          <div className="field">
            <label htmlFor="dname">{t("name")}</label>
            <input
              id="dname"
              type="text"
              required
              placeholder={t("namePh")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="dphone">{t("phone")}</label>
            <input
              id="dphone"
              type="tel"
              placeholder={t("phonePh")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="demail">{t("loginEmail")}</label>
            <input
              id="demail"
              type="email"
              placeholder="driver@example.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
            <div className="hint">{t("loginEmailHelp")}</div>
          </div>

          <div className="field">
            <label>{t("payType")}</label>
            <div className="role-cards">
              <button
                type="button"
                className={`role-card ${payType === "per_mile" ? "selected" : ""}`}
                onClick={() => setPayType("per_mile")}
              >
                <div className="title">🛣️ {t("payPerMile")}</div>
              </button>
              <button
                type="button"
                className={`role-card ${payType === "hourly" ? "selected" : ""}`}
                onClick={() => setPayType("hourly")}
              >
                <div className="title">⏰ {t("payHourly")}</div>
              </button>
            </div>
          </div>

          {payType === "per_mile" ? (
            <div className="field">
              <label htmlFor="drate">{t("perMileRate")}</label>
              <input
                id="drate"
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="0.55"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>
          ) : (
            <div className="field">
              <label htmlFor="dhrate">{t("hourlyRate")}</label>
              <input
                id="dhrate"
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="25.00"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
              />
            </div>
          )}

          <button type="submit" className="btn" disabled={saving}>
            {saving ? t("adding") : t("addDriver")}
          </button>
        </form>
      </div>
    </>
  );
}
