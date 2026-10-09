"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang, type Lang } from "@/lib/i18n";
import { createClient } from "@/lib/supabaseClient";

export function LanguageToggle() {
  const { lang, setLang } = useLang();
  const opts: { code: Lang; label: string }[] = [
    { code: "en", label: "EN" },
    { code: "pa", label: "ਪੰਜਾਬੀ" },
  ];
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      {opts.map((o) => (
        <button
          key={o.code}
          type="button"
          className={lang === o.code ? "active" : ""}
          onClick={() => setLang(o.code)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function Header({ homeHref = "/" }: { homeHref?: string }) {
  const { t } = useLang();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="header">
      <Link href={homeHref} className="brand">
        <span className="brand-logo" aria-hidden="true">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zm-12-8h11l3 5v5h-2a3 3 0 01-6 0H10a3 3 0 01-6 0H3V9l3-4h8v4H6z" />
          </svg>
        </span>
        <span className="brand-text">
          Fleet<span>Desk</span>
        </span>
      </Link>
      <div className="header-actions">
        <LanguageToggle />
        <button
          type="button"
          className="signout-icon"
          onClick={signOut}
          title={t("signOut")}
          aria-label={t("signOut")}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  );
}
