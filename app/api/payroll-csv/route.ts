import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { payPeriodRange, driverPay, type PayPeriod } from "@/lib/pay";

const VALID_PERIODS: PayPeriod[] = ["weekly", "biweekly", "monthly"];

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * GET /api/payroll-csv?period=weekly&offset=0
 * Owner-only. Streams a per-driver payroll CSV for one pay period
 * (for the accountant). Gross pay only — no deductions.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get("period") ?? "weekly";
    const offset = Number.parseInt(searchParams.get("offset") ?? "0", 10) || 0;
    const period: PayPeriod = VALID_PERIODS.includes(periodParam as PayPeriod)
      ? (periodParam as PayPeriod)
      : "weekly";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile || profile.role !== "owner") {
      return NextResponse.json({ error: "Owner access only" }, { status: 403 });
    }

    const admin = createAdminClient();
    const range = payPeriodRange(period, offset);
    const startISO = toISODate(range.start);
    const endISO = toISODate(range.end);

    const [{ data: drivers }, { data: trips }, { data: expenses }] =
      await Promise.all([
        admin
          .from("drivers")
          .select("id,name,pay_type,per_mile_rate_cad,hourly_rate_cad")
          .eq("owner_id", user.id)
          .order("name"),
        admin
          .from("trips")
          .select("driver_id,miles,hours")
          .eq("owner_id", user.id)
          .neq("status", "pending")
          .gte("trip_date", startISO)
          .lte("trip_date", endISO),
        admin
          .from("expenses")
          .select("driver_id,amount_cad")
          .eq("owner_id", user.id)
          .gte("expense_date", startISO)
          .lte("expense_date", endISO),
      ]);

    const rows: string[][] = [
      [
        "Driver",
        "Pay type",
        "Rate (CAD)",
        "Miles",
        "Hours",
        "Gross pay (CAD)",
        "Expenses (CAD)",
        "Total (CAD)",
        "Period",
      ],
    ];
    for (const d of drivers ?? []) {
      const dTrips = (trips ?? []).filter((t) => t.driver_id === d.id);
      const dExp = (expenses ?? []).filter((e) => e.driver_id === d.id);
      const miles = dTrips.reduce((s, t) => s + Number(t.miles ?? 0), 0);
      const hours = dTrips.reduce((s, t) => s + Number(t.hours ?? 0), 0);
      const pay = driverPay(
        d.pay_type,
        Number(d.per_mile_rate_cad ?? 0),
        d.hourly_rate_cad == null ? null : Number(d.hourly_rate_cad),
        miles,
        hours
      );
      const expTotal = dExp.reduce((s, e) => s + Number(e.amount_cad ?? 0), 0);
      const rate =
        d.pay_type === "hourly"
          ? Number(d.hourly_rate_cad ?? 0).toFixed(2)
          : Number(d.per_mile_rate_cad ?? 0).toFixed(2);
      rows.push([
        d.name,
        d.pay_type,
        rate,
        miles.toLocaleString("en-CA"),
        hours.toLocaleString("en-CA"),
        pay.toFixed(2),
        expTotal.toFixed(2),
        (pay + expTotal).toFixed(2),
        `${startISO} to ${endISO}`,
      ]);
    }

    const csv = rows.map((r) => r.map(csvCell).join(",")).join("\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="payroll-${startISO}.csv"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not generate CSV" },
      { status: 500 }
    );
  }
}
