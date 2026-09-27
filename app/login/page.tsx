"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { useLang } from "@/lib/i18n";
import { LanguageToggle } from "@/components/Header";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    searchParams.get("error") === "link"
      ? "That link was invalid or expired. Please try again."
      : ""
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <div className="header">
        <div className="brand">
          🚛 Fleet <span>Desk</span>
        </div>
        <LanguageToggle />
      </div>

      <div className="card">
        <h1>{t("welcomeBack")}</h1>
        <p className="muted">{t("signInSub")}</p>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-box">{error}</div>}
          <div className="field">
            <label htmlFor="email">{t("email")}</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">{t("password")}</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? t("signingIn") : t("signIn")}
          </button>
        </form>
        <div className="auth-links">
          {t("noAccount")}{" "}
          <Link href="/signup">{t("createOne")}</Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="container">
          <p className="muted">Loading…</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
