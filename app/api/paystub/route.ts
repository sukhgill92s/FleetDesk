import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { createClient } from "@/lib/supabaseServer";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { payPeriodRange, driverPay, type PayPeriod } from "@/lib/pay";

const VALID_PERIODS: PayPeriod[] = ["weekly", "biweekly", "monthly"];

function cad(n: number): string {
  return n.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  });
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * GET /api/paystub?driverId=UUID&period=weekly&offset=0
 * Owner-only. Generates a gross-pay PDF paystub for one driver for one
 * pay period and streams it back as application/pdf.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("driverId") ?? "";
    const periodParam = searchParams.get("period") ?? "weekly";
    const offset = Number.parseInt(searchParams.get("offset") ?? "0", 10) || 0;
    if (!driverId) {
      return NextResponse.json({ error: "Missing driverId" }, { status: 400 });
    }
    const period: PayPeriod = VALID_PERIODS.includes(periodParam as PayPeriod)
      ? (periodParam as PayPeriod)
      : "weekly";

    // Caller must be a signed-in owner.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, company_name")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile || profile.role !== "owner") {
      return NextResponse.json({ error: "Owner access only" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: driver } = await admin
      .from("drivers")
      .select("id,name,phone,per_mile_rate_cad,pay_type,hourly_rate_cad")
      .eq("id", driverId)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    const range = payPeriodRange(period, offset);
    const startISO = toISODate(range.start);
    const endISO = toISODate(range.end);

    const [{ data: trips }, { data: expenses }] = await Promise.all([
      admin
        .from("trips")
        .select("miles,hours,trip_date,trip_number,from_location,to_location")
        .eq("driver_id", driverId)
        .eq("owner_id", user.id)
        .neq("status", "pending")
        .gte("trip_date", startISO)
        .lte("trip_date", endISO)
        .order("trip_date"),
      admin
        .from("expenses")
        .select("category,amount_cad,expense_date")
        .eq("driver_id", driverId)
        .eq("owner_id", user.id)
        .gte("expense_date", startISO)
        .lte("expense_date", endISO)
        .order("expense_date"),
    ]);

    const tripRows = trips ?? [];
    const expRows = expenses ?? [];
    const miles = tripRows.reduce((s, t) => s + Number(t.miles ?? 0), 0);
    const hours = tripRows.reduce((s, t) => s + Number(t.hours ?? 0), 0);
    const expTotal = expRows.reduce((s, e) => s + Number(e.amount_cad ?? 0), 0);
    const pay = driverPay(
      driver.pay_type,
      Number(driver.per_mile_rate_cad ?? 0),
      driver.hourly_rate_cad == null ? null : Number(driver.hourly_rate_cad),
      miles,
      hours
    );
    const gross = pay + expTotal;

    // Year-to-date (Jan 1 → end of this period).
    const yearStart = `${range.end.getFullYear()}-01-01`;
    const { data: ytdTrips } = await admin
      .from("trips")
      .select("miles,hours")
      .eq("driver_id", driverId)
      .eq("owner_id", user.id)
      .neq("status", "pending")
      .gte("trip_date", yearStart)
      .lte("trip_date", endISO);
    const ytdRows = ytdTrips ?? [];
    const ytdMiles = ytdRows.reduce((s, t) => s + Number(t.miles ?? 0), 0);
    const ytdPay = driverPay(
      driver.pay_type,
      Number(driver.per_mile_rate_cad ?? 0),
      driver.hourly_rate_cad == null ? null : Number(driver.hourly_rate_cad),
      ytdMiles,
      ytdRows.reduce((s, t) => s + Number(t.hours ?? 0), 0)
    );

    const payDate = new Date();
    const periodLabel =
      period === "monthly"
        ? range.label
        : `${range.start.toLocaleDateString("en-CA", { month: "short", day: "numeric" })} – ${range.end.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}`;

    // ---- Build PDF ----
    const doc = new PDFDocument({ size: "LETTER", margin: 54 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) =>
      doc.on("end", () => resolve(Buffer.concat(chunks)))
    );

    const NAVY = "#0b1e46";
    const BLUE = "#1d4ed8";
    const GREY = "#64748b";
    const pageW = 612 - 108;

    const kv = (label: string, value: string, bold = false) => {
      doc
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(11)
        .fillColor(bold ? NAVY : GREY)
        .text(label, { continued: true })
        .font("Helvetica-Bold")
        .fillColor(NAVY)
        .text(`  ${value}`, { align: "right" });
      doc.moveDown(0.35);
    };

    const section = (title: string) => {
      doc.moveDown(0.6);
      doc.font("Helvetica-Bold").fontSize(13).fillColor(NAVY).text(title);
      doc.moveDown(0.15);
      doc.strokeColor("#e2e8f0").lineWidth(1);
      const sx = doc.x;
      doc.moveTo(sx, doc.y).lineTo(sx + pageW, doc.y).stroke();
      doc.moveDown(0.5);
    };

    // Header
    doc.font("Helvetica-Bold").fontSize(22).fillColor(NAVY).text("FleetDesk");
    doc.font("Helvetica").fontSize(11).fillColor(GREY);
    doc.text(`${profile.company_name ?? "Fleet company"}`);
    doc.moveDown(0.8);
    doc.font("Helvetica-Bold").fontSize(18).fillColor(NAVY).text("PAY STUB");
    doc.font("Helvetica").fontSize(10).fillColor(GREY).text("Gross pay only (V1)");
    doc.moveDown(0.8);

    kv("Driver:", String(driver.name), true);
    kv(
      `Pay period (${period}):`,
      periodLabel
    );
    kv("Pay date:", payDate.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }));
    doc.moveDown(0.4);

    section("Earnings");
    if (driver.pay_type === "hourly") {
      kv("Hours worked:", `${hours.toLocaleString()} hrs`);
      kv("Hourly rate:", `${cad(Number(driver.hourly_rate_cad ?? 0))} / hr`);
      kv(`Hourly pay (${hours.toLocaleString()} x ${cad(Number(driver.hourly_rate_cad ?? 0))}):`, cad(pay), true);
    } else {
      kv("Miles driven:", `${miles.toLocaleString()} mi`);
      kv("Per-mile rate:", `${cad(Number(driver.per_mile_rate_cad ?? 0))} / mi`);
      kv(`Mileage pay (${miles.toLocaleString()} x ${cad(Number(driver.per_mile_rate_cad ?? 0))}):`, cad(pay), true);
    }
    doc.moveDown(0.2);
    kv("Approved expenses reimbursed:", cad(expTotal));
    doc.moveDown(0.3);
    doc.font("Helvetica-Bold").fontSize(13).fillColor(BLUE);
    doc.text(`GROSS PAY:  ${cad(gross)}`);
    doc.moveDown(0.4);

    section("Deductions");
    doc.font("Helvetica-Oblique").fontSize(10).fillColor(GREY);
    doc.text("Not calculated in this version (CPP / EI / income tax come in V2).");
    doc.moveDown(0.6);

    section("Year to date");
    kv("YTD gross pay:", cad(ytdPay));
    kv("YTD miles:", `${ytdMiles.toLocaleString()} mi`);
    doc.moveDown(0.8);

    doc.font("Helvetica-Oblique").fontSize(8.5).fillColor(GREY);
    doc.text(
      "Gross pay only — deductions (CPP, EI, income tax) are not calculated. " +
        "This is not a legal payroll document and is not tax advice. " +
        "Consult your accountant before using paystubs for official payroll."
    );

    doc.end();
    const pdf = await done;

    const safeName = String(driver.name).replace(/[^a-z0-9]+/gi, "-");
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="paystub-${safeName}-${startISO}.pdf"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not generate paystub" },
      { status: 500 }
    );
  }
}
