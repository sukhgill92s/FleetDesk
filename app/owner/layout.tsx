"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import { useLang } from "@/lib/i18n";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLang();
  const pathname = usePathname();

  const tabs = [
    { href: "/owner", label: `📊 ${t("navDashboard")}`, exact: true },
    { href: "/owner/drivers", label: `🧑‍✈️ ${t("navDrivers")}`, exact: false },
    { href: "/owner/trips/new", label: `➕ ${t("addTrip")}`, exact: false },
    { href: "/owner/trucks", label: `🚛 ${t("navTrucks")}`, exact: false },
    { href: "/owner/settings", label: `⚙️ ${t("navSettings")}`, exact: false },
  ];

  return (
    <main className="container">
      <Header homeHref="/owner" />
      {children}
      <nav className="bottom-nav">
        {tabs.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={active ? "active" : ""}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
