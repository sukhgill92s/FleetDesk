"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import { useLang } from "@/lib/i18n";

function TabIcon({ d }: { d: string }) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d} />
    </svg>
  );
}

const ICONS = {
  dashboard:
    "M4 6a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z",
  drivers:
    "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  addTrip:
    "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z",
  trucks:
    "M8 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zm-12-8h11l3 5v5h-2a3 3 0 01-6 0H10a3 3 0 01-6 0H3V9l3-4h8v4H6z",
  settings:
    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLang();
  const pathname = usePathname();

  const tabs = [
    { href: "/owner", label: t("navDashboard"), icon: ICONS.dashboard, exact: true },
    { href: "/owner/drivers", label: t("navDrivers"), icon: ICONS.drivers, exact: false },
    { href: "/owner/trips/new", label: t("addTrip"), icon: ICONS.addTrip, exact: false },
    { href: "/owner/trucks", label: t("navTrucks"), icon: ICONS.trucks, exact: false },
    { href: "/owner/settings", label: t("navSettings"), icon: ICONS.settings, exact: false },
  ];

  return (
    <main className="container">
      <Header homeHref="/owner" />
      {children}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
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
                <TabIcon d={tab.icon} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
