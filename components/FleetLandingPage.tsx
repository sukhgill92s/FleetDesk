import Link from "next/link";

function Icon({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="fleet-card-icon">{children}</div>;
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="18" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="18" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function DriverIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 20c.8-3.4 3.1-5.2 7-5.2s6.2 1.8 7 5.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="6" cy="18" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="6" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.5 18h2.2c3.4 0 2.8-5.8 6.8-7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 8h6M9 12h6M9 16h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19v16H6.5A2.5 2.5 0 0 1 4 17.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4 7h15M15 12h5v4h-5a2 2 0 1 1 0-4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

/**
 * Public marketing landing page — shown at "/" for logged-out visitors.
 * Logged-in users never see this (they route to /owner or /driver).
 */
export default function FleetLandingPage() {
  const features = [
    { icon: <DriverIcon />, title: "Drivers", text: "Add drivers, track their trips and pay." },
    { icon: <TruckIcon />, title: "Trucks", text: "Manage your trucks in one list." },
    { icon: <WalletIcon />, title: "Pay Settings", text: "Hourly or per-mile, weekly or monthly." },
    { icon: <ReceiptIcon />, title: "Expenses", text: "Fuel, repairs and costs tracked." },
  ];

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
          {features.map(({ icon, title, text }) => (
            <div className="fleet-card" key={title}>
              <Icon>{icon}</Icon>
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

// Keep RouteIcon referenced so the icon set stays complete for future cards.
export { RouteIcon };
