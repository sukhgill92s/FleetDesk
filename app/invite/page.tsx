"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";
import { LanguageToggle } from "@/components/Header";
import AuthHero from "@/components/AuthHero";

/**
 * Landing page for invited drivers.
 * The invite email link goes: Supabase verify -> /auth/callback?next=/invite.
 * The driver sets a password here, then continues to onboarding,
 * where picking "driver" links them to the record their owner created.
 */
export default function InvitePage() {
  const { t } = useLang();
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setEmail(user.email ?? "");
      setCompany(user.user_metadata?.invited_by_company ?? "");
      setChecking(false);
    })();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("passwordMismatch"));
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.replace("/onboarding");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    } finally {
      setSaving(false);
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
          {checking ? (
            <p className="muted">{t("loading")}</p>
          ) : (
            <>
              <h1>{t("inviteTitle")}</h1>
              <p className="muted">
                {company
                  ? `${t("inviteWelcome")} ${company}`
                  : t("inviteWelcomeGeneric")}
              </p>
              {email && <p className="muted">{email}</p>}
              <form onSubmit={handleSubmit}>
                {error && <div className="error-box">{error}</div>}
                <div className="field">
                  <label htmlFor="ipw">{t("newPassword")}</label>
                  <input
                    id="ipw"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="icpw">{t("confirmPassword")}</label>
                  <input
                    id="icpw"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn" disabled={saving}>
                  {saving ? t("saving") : t("setPasswordContinue")}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
