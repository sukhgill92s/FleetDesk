"use client";

import Link from "next/link";
import { useState } from "react";

/* ---------------- line icons ---------------- */

function CardIcon({ children }: { children: React.ReactNode }) {
  return <div className="fleet-card-icon">{children}</div>;
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="18" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function DriverIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20c.8-3.4 3.1-5.2 7-5.2s6.2 1.8 7 5.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
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

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 7h15M15 12h5v4h-5a2 2 0 1 1 0-4z" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function InviteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 7l9 6 9-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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
    { icon: <DriverIcon />, title: "Drivers", text: "Driver profiles, documents and status in one place." },
    { icon: <TruckIcon />, title: "Trucks", text: "Your whole fleet — units, plates and details." },
    { icon: <RouteIcon />, title: "Trips", text: "Log trips and see where every load stands." },
    { icon: <ReceiptIcon />, title: "Expenses", text: "Fuel, repairs, tolls — every cost tracked." },
    { icon: <WalletIcon />, title: "Payroll", text: "Hourly or per-mile pay, calculated per period." },
    { icon: <InviteIcon />, title: "Driver Invites", text: "Invite drivers by email — they set up in minutes." },
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
        <h1>
          Your Fleet. Your Drivers.
          <br />
          Your Numbers. <span className="fleet-accent">All in One Place.</span>
        </h1>
        <p className="fleet-sub">
          Manage drivers, trucks, trips, expenses and payroll from one
          simple fleet platform.
        </p>
        <div className="fleet-hero-btns">
          <Link href="/signup" className="fleet-cta">Start Free</Link>
          <a href="#how-it-works" className="fleet-cta-ghost">See How It Works</a>
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

      {/* ---------- Features ---------- */}
      <section className="fleet-section" id="features">
        <h2>Everything in one place</h2>
        <p className="fleet-kicker">One app replaces the paperwork</p>
        <div className="fleet-grid fleet-grid-3">
          {features.map(({ icon, title, text }) => (
            <div className="fleet-card" key={title}>
              <CardIcon>{icon}</CardIcon>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
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
      <section className="fleet-section">
        <div className="fleet-cta-banner">
          <div>
            <h3>Ready to take control of your fleet?</h3>
            <p>Start managing your drivers, trucks and expenses in one place.</p>
          </div>
          <Link href="/signup" className="fleet-cta">Get Started Free</Link>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="fleet-footer">
        <span className="fleet-brand-text">FleetDesk</span>
        <small>© 2026 FleetDesk. All rights reserved.</small>
      </footer>
    </div>
  );
}
