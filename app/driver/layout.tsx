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
  addTrip:
    "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z",
  receipt:
    "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z",
};

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLang();
  const pathname = usePathname();

  const tabs = [
    { href: "/driver", label: t("myWeek"), icon: ICONS.dashboard, exact: true },
    { href: "/driver/trips/new", label: t("logTrip"), icon: ICONS.addTrip, exact: false },
    { href: "/driver/expenses/new", label: t("logExpense"), icon: ICONS.receipt, exact: false },
  ];

  return (
    <main className="container">
      <Header homeHref="/driver" />
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
