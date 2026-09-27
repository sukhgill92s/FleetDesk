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
        🚛 Fleet <span>Desk</span>
      </Link>
      <div className="header-actions">
        <LanguageToggle />
        <button type="button" className="btn-ghost btn" onClick={signOut}>
          {t("signOut")}
        </button>
      </div>
    </div>
  );
}
