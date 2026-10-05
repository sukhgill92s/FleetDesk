import Link from "next/link";

/**
 * Public marketing landing page — shown at "/" for logged-out visitors.
 * Logged-in users never see this (they route to /owner or /driver).
 */
export default function FleetLandingPage() {
  return (
    <div className="fleet-landing">
      {/* ---------- Navbar ---------- */}
      <header className="fleet-nav">
        <Link href="/" className="fleet-brand">
          <span className="fleet-logo" aria-hidden="true">
            🚚
          </span>
          <span className="fleet-brand-text">FleetDesk</span>
        </Link>
        <Link href="/login" className="fleet-signin">
          Sign In
        </Link>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="fleet-hero">
        <h1>
          Run your entire fleet
          <br />
          from your phone.
        </h1>
        <p className="fleet-sub">
          Drivers, trucks, trips, pay and expenses — everything a small
          fleet owner needs, in one place.
        </p>
        <Link href="/signup" className="fleet-cta">
          Get Started <span aria-hidden="true">→</span>
        </Link>
      </section>

      {/* ---------- Features ---------- */}
      <section className="fleet-section">
        <h2>Everything in one place</h2>
        <div className="fleet-grid">
          {[
            ["👨‍✈️", "Drivers", "Add drivers, track their trips and pay."],
            ["🚚", "Trucks", "Manage your trucks in one list."],
            ["⚙️", "Pay Settings", "Hourly or per-mile, weekly or monthly."],
            ["🧾", "Expenses", "Fuel, repairs and costs tracked."],
          ].map(([icon, title, text]) => (
            <div className="fleet-card" key={title}>
              <div className="fleet-card-icon">{icon}</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="fleet-section">
        <div className="fleet-cta-banner">
          <div>
            <h3>Stop running your fleet on paper</h3>
            <p>
              One app for your drivers, trucks, trips and pay. Set up in
              minutes.
            </p>
          </div>
          <Link href="/signup" className="fleet-cta">
            Get Started <span aria-hidden="true">→</span>
          </Link>
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
