"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";
import { LanguageToggle } from "@/components/Header";
import AuthHero from "@/components/AuthHero";

type Role = "owner" | "driver";

export default function OnboardingPage() {
  const { t } = useLang();
  const router = useRouter();
  const [role, setRole] = useState<Role>("owner");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (role === "owner" && !companyName.trim()) {
      setError(t("companyNameRequired"));
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("errorGeneric"));

      const { error } = await supabase.from("profiles").insert({
        user_id: user.id,
        role,
        company_name: role === "owner" ? companyName.trim() : null,
      });
      if (error) throw error;

      router.push(role === "owner" ? "/owner" : "/driver");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <AuthHero />
      <div className="auth-form-wrap">
        <div className="auth-topbar">
          <LanguageToggle />
        </div>
        <div className="card auth-card">
          <h1>{t("chooseRole")}</h1>
          <form onSubmit={handleSubmit}>
            {error && <div className="error-box">{error}</div>}

            <div className="role-cards">
              <button
                type="button"
                className={`role-card ${role === "owner" ? "selected" : ""}`}
                onClick={() => setRole("owner")}
              >
                <div className="title">🚛 {t("iAmOwner")}</div>
                <div className="desc">{t("ownerNote")}</div>
              </button>
              <button
                type="button"
                className={`role-card ${role === "driver" ? "selected" : ""}`}
                onClick={() => setRole("driver")}
              >
                <div className="title">🧑‍✈️ {t("iAmDriver")}</div>
                <div className="desc">{t("driverNote")}</div>
              </button>
            </div>

            {role === "owner" && (
              <div className="field">
                <label htmlFor="company">{t("companyName")}</label>
                <input
                  id="company"
                  type="text"
                  required
                  placeholder={t("companyNamePh")}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            )}

            <button type="submit" className="btn" disabled={loading}>
              {loading ? t("continuing") : t("continue")}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
