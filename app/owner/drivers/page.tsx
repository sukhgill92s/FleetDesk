"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";

interface Driver {
  id: string;
  name: string;
  phone: string | null;
  login_email: string | null;
  per_mile_rate_cad: number;
  user_id: string | null;
}

export default function DriversPage() {
  const { t } = useLang();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [rate, setRate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("drivers")
        .select("id,name,phone,login_email,per_mile_rate_cad,user_id")
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
    if (!name.trim() || isNaN(rateNum) || rateNum <= 0) {
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
        per_mile_rate_cad: rateNum,
      });
      if (error) throw error;

      setName("");
      setPhone("");
      setLoginEmail("");
      setRate("");
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
                <span>{Number(d.per_mile_rate_cad).toFixed(2)}/mi</span>
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
          <button type="submit" className="btn" disabled={saving}>
            {saving ? t("adding") : t("addDriver")}
          </button>
        </form>
      </div>
    </>
  );
}
