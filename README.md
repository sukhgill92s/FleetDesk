# FleetDesk

Simple fleet management for small trucking companies (5–20 trucks). Pilot MVP.

- **Owners** add drivers (name, phone, per-mile pay rate) and trucks (unit number, plate), then see a per-driver weekly dashboard: miles, pay owed, expenses — plus receipt photos.
- **Drivers** (mobile-first) log trips (date, from → to, miles, fuel) and expenses (category, amount, receipt photo), and see their own weekly miles + estimated pay.
- **Bilingual UI**: English + Roman Punjabi toggle in the header (persisted in localStorage).

Stack: Next.js 15 (App Router) + TypeScript + Supabase (Auth, Postgres, Storage). No CSS framework — plain mobile-first CSS.

> **Renaming later is a one-line change**: the display name lives in `app/layout.tsx` (`metadata.title`), `components/Header.tsx`, `app/login/page.tsx`, `app/signup/page.tsx`, and `app/onboarding/page.tsx` (the `🚛 Fleet <span>Desk</span>` brand blocks).

## Setup

### 1. Create the Supabase project

1. Go to https://supabase.com/dashboard → **New project**.
2. Name it `FleetDesk` (any region; `ca-central-1` keeps data in Canada).
3. Save the database password somewhere safe.

### 2. Run the database migration

1. In the Supabase dashboard, open **SQL Editor**.
2. Open `supabase/migrations/0001_fleetdesk.sql` from this repo, copy the **entire** file.
3. Paste it into the SQL Editor and press **Run**.

This creates:

| Table | Purpose |
|---|---|
| `profiles` | One row per login: `role` = `owner`/`driver`, `company_name` for owners |
| `drivers` | Driver records created by the owner: name, phone, login email, per-mile rate |
| `trucks` | Unit number + plate per company |
| `trips` | Driver trip logs: date, from/to, miles, fuel |
| `expenses` | Expense logs: date, category, amount, receipt photo path |

It also creates the private **`receipts`** storage bucket and all Row Level Security policies:

- Owners read/write everything scoped to their own `owner_id`.
- Drivers read/write only rows linked to their own driver record (linked by "claiming" with the login email the owner entered, via `claim_driver_record()`).
- Receipt photos are stored at `receipts/{owner_id}/{driver_id}/{file}` — owners see their company's, drivers see their own company's.

### 3. Configure Auth

1. **Authentication → Providers → Email**: enabled by default.
2. **Authentication → URL Configuration**:
   - Site URL: your deployed URL (e.g. `https://fleetdesk.vercel.app`)
   - Add to **Redirect URLs**: `https://fleetdesk.vercel.app/auth/callback` (and `http://localhost:3000/auth/callback` for local dev).

### 4. Environment variables

```bash
cp .env.example .env.local
```

Fill in from **Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
```

Never commit `.env.local`.

### 5. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### 6. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. https://vercel.com → **Add New → Project** → import the repo.
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in **Settings → Environment Variables**.
4. **Deploy**. Then update the Supabase Site URL / Redirect URLs (step 3) to the Vercel domain.

## Pilot walkthrough

1. **Owner**: sign up → choose *"I own a trucking company"* → enter company name.
2. **Owner → Drivers**: add each driver with the **exact email they will sign up with** + per-mile rate.
3. **Owner → Trucks**: add unit numbers + plates (optional).
4. **Driver**: sign up with that same email → choose *"I'm a driver"* → the app auto-links them to their driver record on first visit.
5. **Driver**: log trips + expenses (receipt photo optional).
6. **Owner → Dashboard**: pick the week, see per-driver miles, pay owed, expenses; tap 🧾 to view receipt photos.

## What's intentionally left out (MVP)

- No multi-company / dispatcher roles — one company per owner account.
- No trip editing or deleting in the UI (owners can edit via the Supabase Table Editor).
- No payroll export / PDF / IFTA reports yet.
- No push notifications or reminders.
- Drivers can't change their pay rate (owner-only).
- No App Store / Play Store wrapper yet — use it as a mobile web app (Add to Home Screen).
