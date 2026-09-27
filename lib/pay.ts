import { mondayOf, weekRange, type WeekRange } from "./week";

/** Company pay period setting. */
export type PayPeriod = "weekly" | "biweekly" | "monthly";

export type PeriodRange = WeekRange;

/**
 * Anchor Monday for bi-weekly periods. Jan 5, 2026 was a Monday;
 * every 14-day block starts on a Monday from here.
 */
const BIWEEK_ANCHOR = mondayOf(new Date(2026, 0, 5));

function fmtShort(d: Date): string {
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

/**
 * Pay-period range `offset` periods from the current one (0 = current).
 * weekly  -> Monday..Sunday
 * biweekly -> 14-day Monday-anchored blocks
 * monthly -> calendar month
 */
export function payPeriodRange(period: PayPeriod, offset: number): PeriodRange {
  if (period === "weekly") return weekRange(offset);

  if (period === "monthly") {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
    last.setHours(23, 59, 59, 999);
    const label = first.toLocaleDateString("en-CA", {
      month: "long",
      year: "numeric",
    });
    return { start: first, end: last, label };
  }

  // biweekly
  const thisMonday = mondayOf(new Date());
  const daysSince = Math.round(
    (thisMonday.getTime() - BIWEEK_ANCHOR.getTime()) / 86400000
  );
  const idx = Math.floor(daysSince / 14) + offset;
  const start = new Date(BIWEEK_ANCHOR);
  start.setDate(start.getDate() + idx * 14);
  const end = new Date(start);
  end.setDate(end.getDate() + 13);
  end.setHours(23, 59, 59, 999);
  return { start, end, label: `${fmtShort(start)} – ${fmtShort(end)}` };
}

/** Estimated pay for one driver over a set of trips. */
export function driverPay(
  payType: string,
  perMileRate: number,
  hourlyRate: number | null,
  miles: number,
  hours: number
): number {
  if (payType === "hourly") return hours * (hourlyRate ?? 0);
  return miles * perMileRate;
}
