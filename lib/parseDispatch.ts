// lib/parseDispatch.ts
// Parses a pasted broker/dispatch WhatsApp message into trip fields.
// Everything is best-effort: the review screen lets the user fix anything
// the parser misses before the trip is created.

export interface ParsedDispatch {
  from: string;
  to: string;
  date: string; // yyyy-mm-dd or ""
  miles: string;
  tripNo: string;
  rate: string; // CAD, digits only
  weight: string; // kg, digits only
  commodity: string;
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function cleanPlace(s: string): string {
  return s
    .replace(/[.,;:!?]+$/g, "")
    .replace(/^[.,;:!?()\[\]"]+/g, "")
    .trim();
}

function toISODate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const CITY = "[A-Za-z][A-Za-z .'\u2019\\-]{1,42}?";

export function parseDispatchMessage(raw: string): ParsedDispatch {
  const out: ParsedDispatch = {
    from: "",
    to: "",
    date: "",
    miles: "",
    tripNo: "",
    rate: "",
    weight: "",
    commodity: "",
  };
  if (!raw || !raw.trim()) return out;
  const text = raw.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();

  // ---- route: "Brampton ON → Montreal QC" / "Brampton, ON to Montreal, QC" ----
  const arrowRe = new RegExp(
    `(${CITY}),?\\s+([A-Z]{2})\\s*(?:\u2192|->|\u2013|\u2014|\\bto\\b)\\s*(${CITY}),?\\s+([A-Z]{2})`
  );
  const arrow = text.match(arrowRe);
  if (arrow) {
    const stripDay = (s: string) => s.replace(/^(today|tomorrow|tonight)\b\s*/i, "");
    out.from = cleanPlace(stripDay(`${arrow[1].trim()}, ${arrow[2]}`));
    out.to = cleanPlace(stripDay(`${arrow[3].trim()}, ${arrow[4]}`));
  } else {
    // labeled pickup / delivery lines
    const pu = text.match(
      /pick\s*-?\s*up\s*:?\s*([^\n;]+?)(?=\s*(?:deliver|drop|unload|consignee|pick\b)|$)/i
    );
    const del = text.match(
      /(?:deliver(?:y)?|drop(?:\s*-?\s*off)?|unload|consignee)\s*:?\s*([^\n;]+?)(?=\s+(?:rate|\$|weight|ref\b|p\.?\s*o\.?|date)\b|[;\n]|$)/i
    );
    if (pu) out.from = cleanPlace(pu[1].replace(/^(today|tomorrow|tonight)\b\s*/i, ""));
    if (del) out.to = cleanPlace(del[1].replace(/^(today|tomorrow|tonight)\b\s*/i, ""));
  }

  // ---- rate: $1,790 ----
  const rate = text.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/);
  if (rate) out.rate = rate[1].replace(/,/g, "");

  // ---- weight: 16,900 kg / 37,000 lbs ----
  const wt = text.match(/([\d,]+(?:\.\d+)?)\s*(kg|kilograms?|kgs|lb|lbs|pounds?)\b/i);
  if (wt) {
    let kg = parseFloat(wt[1].replace(/,/g, ""));
    if (/^lb/i.test(wt[2])) kg = kg * 0.453592;
    if (isFinite(kg)) out.weight = String(Math.round(kg));
  }

  // ---- reference / load number ----
  const ref = text.match(
    /(?:\bref(?:erence)?|load\s*(?:no\.?|#)|p\.?\s*o\.?|order\s*(?:no\.?|#)|trip\s*(?:no\.?|#))\s*#?\s*:?\s*([A-Za-z0-9][A-Za-z0-9\-/]{1,24})/i
  );
  if (ref) out.tripNo = ref[1].replace(/[.,;:]+$/g, "");

  // ---- distance: 542 km / 340 miles ----
  const dist = text.match(/([\d,]+(?:\.\d+)?)\s*(km|kilometers?|kilometres?|miles?|mi)\b/i);
  if (dist) {
    let mi = parseFloat(dist[1].replace(/,/g, ""));
    if (/^km/i.test(dist[2])) mi = mi * 0.621371;
    if (isFinite(mi) && mi > 0) out.miles = String(Math.round(mi));
  }

  // ---- pallets / commodity ----
  const pal = text.match(/(\d+)\s*(pallets?|plts?|skids?)\b/i);
  if (pal) out.commodity = `${pal[1]} ${/skid/i.test(pal[2]) ? "skids" : "pallets"}`;
  const com = text.match(/commodity\s*:?\s*([^\n;]+)/i);
  if (com) out.commodity = cleanPlace(com[1]);

  // ---- date ----
  const now = new Date();
  const md = text.match(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\b/i
  );
  if (md) {
    const m = MONTHS[md[1].toLowerCase().slice(0, 3)];
    const d = parseInt(md[2], 10);
    let y = now.getFullYear();
    const cand = new Date(y, m, d);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (cand.getTime() < today.getTime() - 2 * 864e5) y += 1; // probably next year
    if (m !== undefined && d >= 1 && d <= 31) out.date = toISODate(y, m, d);
  } else {
    const sl = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
    if (sl) {
      let y = sl[3] ? parseInt(sl[3], 10) : now.getFullYear();
      if (y < 100) y += 2000;
      out.date = toISODate(y, parseInt(sl[1], 10) - 1, parseInt(sl[2], 10));
    } else if (/\btomorrow\b/i.test(text)) {
      const t = new Date(now.getTime() + 864e5);
      out.date = toISODate(t.getFullYear(), t.getMonth(), t.getDate());
    } else if (/\btoday\b/i.test(text)) {
      out.date = toISODate(now.getFullYear(), now.getMonth(), now.getDate());
    }
  }

  return out;
}
