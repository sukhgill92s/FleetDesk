"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import { useLang } from "@/lib/i18n";

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLang();
  const pathname = usePathname();

  const tabs = [
    { href: "/driver", label: `📊 ${t("myWeek")}`, exact: true },
    { href: "/driver/trips/new", label: `➕ ${t("logTrip")}`, exact: false },
    { href: "/driver/expenses/new", label: `🧾 ${t("logExpense")}`, exact: false },
  ];

  return (
    <main className="container">
      <Header homeHref="/driver" />
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
