"use client";

import Link from "next/link";
import { useState } from "react";

/* ---------------- line icons ---------------- */

function CardIcon({ children }: { children: React.ReactNode }) {
  return <div className="fleet-card-icon">{children}</div>;
}

function RouteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="18" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="6" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 18h2.2c3.4 0 2.8-5.8 6.8-7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6M9 16h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h9l4 4v14H6z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M15 3v4h4M9 12h7M9 16h7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20V10M10 20V4M16 20v-8M21 20H3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------------- page ---------------- */

/**
 * Public marketing landing page — shown at "/" for logged-out visitors.
 * Logged-in users never see this (they route to /owner or /driver).
 */
export default function FleetLandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const features = [
    { icon: <RouteIcon />, title: "Trip Tracking", text: "Log trips and see where every load stands." },
    { icon: <DocIcon />, title: "One-Click Paystubs", text: "Download driver paystubs as PDF, per pay period." },
    { icon: <ReceiptIcon />, title: "Expense Approvals", text: "Review and approve driver expenses with receipts." },
    { icon: <ChartIcon />, title: "Driver Pay Reports", text: "Export payroll to CSV — hourly or per-mile." },
  ];

  const checklist = [
    "See every driver, truck and trip in one dashboard",
    "Drivers log trips from their own phone",
    "Pay by the hour or by the mile",
    "Weekly, bi-weekly or monthly pay periods",
    "Track fuel, repairs and tolls",
    "Invite drivers by email in seconds",
  ];

  return (
    <div className="fleet-landing">
      {/* ---------- Navbar ---------- */}
      <header className="fleet-nav">
        <Link href="/" className="fleet-brand">
          <span className="fleet-logo" aria-hidden="true">🚚</span>
          <span className="fleet-brand-text">FleetDesk</span>
        </Link>
        <nav className="fleet-nav-links" aria-label="Primary">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="fleet-nav-actions">
          <Link href="/login" className="fleet-signin">Sign In</Link>
          <Link href="/signup" className="fleet-cta fleet-cta-sm">Get Started</Link>
          <button
            className="fleet-hamburger"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>
      {menuOpen && (
        <nav className="fleet-mobile-menu" aria-label="Mobile">
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
          <Link href="/login" onClick={() => setMenuOpen(false)}>Sign In</Link>
        </nav>
      )}

      {/* ---------- Hero ---------- */}
      <section className="fleet-hero">
        <h1>Run Your Fleet Like a Pro</h1>
        <p className="fleet-sub">
          Trips, payroll, and expenses for small trucking
          companies — in English and Punjabi.
        </p>
        <div className="fleet-hero-btns">
          <Link href="/signup" className="fleet-cta">Start Free</Link>
          <a href="#how-it-works" className="fleet-cta-ghost">See How It Works</a>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="fleet-section" id="features">
        <h2>Everything in one place</h2>
        <div className="fleet-grid fleet-grid-2">
          {features.map(({ icon, title, text }) => (
            <div className="fleet-card" key={title}>
              <CardIcon>{icon}</CardIcon>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Dashboard preview ---------- */}
      <section className="fleet-section fleet-preview-section">
        <div className="fleet-dashboard">
          <div className="fleet-dashboard-head">
            <span className="fleet-sample-badge">Sample data</span>
            <h3>Fleet Overview</h3>
          </div>
          <div className="fleet-stats">
            <div className="fleet-stat"><b>8</b><span>Trucks</span></div>
            <div className="fleet-stat"><b>12</b><span>Drivers</span></div>
            <div className="fleet-stat"><b>46</b><span>Trips</span></div>
            <div className="fleet-stat"><b>$38,420</b><span>Revenue</span></div>
          </div>
          <div className="fleet-dash-cols">
            <div className="fleet-dash-col">
              <h4>Active Trucks</h4>
              <ul>
                <li><span className="fleet-dot" />Toronto → Chicago</li>
                <li><span className="fleet-dot" />Detroit → Brampton</li>
                <li><span className="fleet-dot" />Calgary → Toronto</li>
              </ul>
            </div>
            <div className="fleet-dash-col">
              <h4>Recent Expenses</h4>
              <ul>
                <li>Fuel <b>$8,420</b></li>
                <li>Maintenance <b>$2,140</b></li>
                <li>Tolls <b>$1,280</b></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="fleet-section" id="how-it-works">
        <h2>How it works</h2>
        <p className="fleet-kicker">Live in three steps</p>
        <div className="fleet-steps">
          {[
            ["1", "Add your fleet", "Drivers and trucks — set up in minutes."],
            ["2", "Invite drivers", "They log trips and expenses from their phone."],
            ["3", "See pay & costs", "Trips, pay periods and expenses — all calculated."],
          ].map(([n, title, text]) => (
            <div className="fleet-step" key={n}>
              <span className="fleet-step-num">{n}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Built for small fleets ---------- */}
      <section className="fleet-section">
        <h2>Built for small fleets</h2>
        <p className="fleet-kicker">Everything an owner-operator needs, nothing they don&apos;t</p>
        <ul className="fleet-checklist">
          {checklist.map((item) => (
            <li key={item}>
              <span className="fleet-check"><CheckIcon /></span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- Pricing ---------- */}
      <section className="fleet-section" id="pricing">
        <h2>Simple pricing</h2>
        <p className="fleet-kicker">No per-driver fees. No surprises.</p>
        <div className="fleet-pricing">
          <h3>One flat monthly price</h3>
          <p>Every feature included — drivers, trucks, trips, payroll and expenses.</p>
          <Link href="/signup" className="fleet-cta">Get Started</Link>
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="fleet-cta-band">
        <h2>Ready to simplify payroll?</h2>
        <Link href="/signup" className="fleet-cta-light">Get Started Free →</Link>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="fleet-footer">
        <span className="fleet-brand-text">FleetDesk</span>
        <small>© 2026 FleetDesk. All rights reserved.</small>
      </footer>
    </div>
  );
}
