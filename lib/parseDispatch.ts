// lib/parseDispatch.ts
// Parses a pasted broker/dispatch WhatsApp message into trip fields.
// v2: full street addresses from Pick/Drop blocks (not just city).
// Everything is best-effort: the review screen lets the user fix anything
// the parser misses before the trip is created.
//
// Handles two message shapes:
//  1. Broker style: "Brampton ON → Montreal QC, Oct 20, 16,900 kg, $1,790, Ref NG-5521"
//  2. Carrier dispatch style (driver messages):
//       Trip# 14484
//       Truck# 1332 Trailer# FZ2078
//       Pick #1
//       2600 North Park DR BRAMPTON ON (Yard)
//       Drop #1
//       LOU-MAX
//       88 Rte de Sainte-Hedwidge
//       ROBERVAL QC G8H 2M9
//       Date 10-22-26 Time 8AM
//       Notes : **...**

export interface ParsedDispatch {
  from: string;
  to: string;
  date: string; // yyyy-mm-dd or ""
  miles: string;
  tripNo: string;
  rate: string; // CAD, digits only
  weight: string; // kg, digits only
  commodity: string;
  truckNo: string; // unit number as written in the message, e.g. "1332"
  trailerNo: string; // e.g. "FZ2078"
  notes: string; // free-text notes line(s) from the message
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const PROVINCES = new Set([
  "ON", "QC", "MB", "SK", "AB", "BC", "NB", "NS", "PE", "NL", "YT", "NT", "NU",
]);
const US_STATES = new Set([
  "AL", "AZ", "AR", "CO", "CT", "DE", "FL", "GA", "ID", "IL", "IN", "IA", "KS",
  "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN",
  "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
]);
const STREET_SUFFIXES = new Set([
  "DR", "ST", "AV", "AVE", "RD", "BLVD", "LN", "CT", "CRT", "CRES", "HWY",
  "RTE", "PKWY", "TRL", "WAY", "RUE", "CHEMIN", "ROUTE", "DRIVE", "STREET",
  "AVENUE", "ROAD", "LANE", "COURT", "CRESCENT", "HIGHWAY", "PARKWAY", "TRAIL",
]);

function cleanPlace(s: string): string {
  return s
    .replace(/[.,;:!?]+$/g, "")
    .replace(/^[.,;:!?()\[\]"]+/g, "")
    .trim();
}

function toISODate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Numeric date like 10-22-26 or 10/22/2026 (North American month-first;
// swaps when the first number can only be a day).
function numericDate(a: number, b: number, yRaw: number, now: Date): string {
  let mo = a;
  let d = b;
  if (a > 12 && b >= 1 && b <= 12) {
    mo = b;
    d = a;
  }
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return "";
  let y = yRaw;
  if (y < 100) y += 2000;
  return toISODate(y, mo - 1, d);
}

// Finds "CITY, XX" on one address line by walking back from a province/state
// code, skipping street suffixes ("2600 North Park DR BRAMPTON ON" -> "Brampton, ON").
function cityFromLine(line: string, regions: Set<string>): string {
  const parts = cityPartsFromLine(line, regions);
  return parts ? `${parts.city}, ${parts.prov}` : "";
}

interface CityParts {
  city: string;
  prov: string;
  before: string[]; // words on the line before the city (street portion)
  postal: string;
  paren: string; // "(Yard)" style note on the line
}

function cityPartsFromLine(line: string, regions: Set<string>): CityParts | null {
  const parenMatch = line.match(/\(([^)]+)\)/);
  const paren = parenMatch ? parenMatch[1].trim() : "";
  const postalMatch = line.match(/\b([A-Z]\d[A-Z])\s?(\d[A-Z]\d)\b/i);
  const postal = postalMatch
    ? `${postalMatch[1].toUpperCase()} ${postalMatch[2].toUpperCase()}`
    : "";
  const words = line.replace(/[(),]/g, " ").split(/\s+/).filter(Boolean);
  for (let i = 1; i < words.length; i++) {
    const w = words[i].toUpperCase().replace(/\.$/, "");
    if (!regions.has(w)) continue;
    const cityWords: string[] = [];
    for (let j = i - 1; j >= 0 && cityWords.length < 3; j--) {
      const prev = words[j].toUpperCase().replace(/\.$/, "");
      if (STREET_SUFFIXES.has(prev)) break;
      if (/^\d+$/.test(prev)) break;
      if (/^[A-Z]\d[A-Z]$/i.test(prev)) break; // postal code fragment
      if (!/^[A-Za-z'’-]+$/.test(words[j])) break;
      cityWords.unshift(words[j]);
    }
    if (cityWords.length) {
      const city = cityWords
        .join(" ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        city,
        prov: w,
        before: words.slice(0, i - cityWords.length),
        postal,
        paren,
      };
    }
  }
  return null;
}

function cityFromBlock(block: string): string {
  if (!block) return "";
  const lines = block.split("\n");
  let found = "";
  for (const l of lines) {
    const c = cityFromLine(l, PROVINCES) || cityFromLine(l, US_STATES);
    if (c) found = c; // last matching line wins (address line follows name line)
  }
  return found;
}

// Full postal address from a Pick/Drop block: company and street lines above
// the city line, plus the street portion of the city line itself.
//   "2600 North Park DR BRAMPTON ON (Yard)" -> "2600 North Park DR, Brampton, ON (Yard)"
//   "LOU-MAX / 88 Rte de Sainte-Hedwidge / ROBERVAL QC G8H 2M9"
//     -> "LOU-MAX, 88 Rte de Sainte-Hedwidge, Roberval, QC G8H 2M9"
function addressFromBlock(block: string): string {
  if (!block) return "";
  const rawLines = block
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^(date|time)\b/i.test(l));
  let cityIdx = -1;
  let parts: CityParts | null = null;
  rawLines.forEach((l, idx) => {
    const p = cityPartsFromLine(l, PROVINCES) || cityPartsFromLine(l, US_STATES);
    if (p) {
      parts = p;
      cityIdx = idx;
    }
  });
  if (!parts || cityIdx < 0) return "";
  const found: CityParts = parts;
  const head = rawLines.slice(0, cityIdx);
  const streetLine = found.before.join(" ").trim();
  const streetParts = [...head, ...(streetLine ? [streetLine] : [])]
    .map((s) => s.replace(/,+$/, "").trim())
    .filter(Boolean);
  let addr = [...streetParts, `${found.city}, ${found.prov}`].join(", ");
  if (found.postal) addr += ` ${found.postal}`;
  if (found.paren) addr += ` (${found.paren})`;
  return addr;
}

// Returns the text of the block that follows a "Pick #1" / "Drop #1" style
// header line, up to the next section header. Any text on the header line
// itself (after the header token) is included as the first block line.
function blockAfter(text: string, headerRes: RegExp[]): string {
  const lines = text.split("\n");
  for (const re of headerRes) {
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(re);
      if (!m) continue;
      const out: string[] = [];
      if (m[1] && m[1].trim()) out.push(m[1].trim());
      for (let k = i + 1; k < lines.length; k++) {
        if (
          /^\s*(pick|pickup|drop|deliver|delivery|notes?|trip|truck|trailer)\b/i.test(
            lines[k]
          ) &&
          lines[k].trim().length > 0
        ) {
          break;
        }
        out.push(lines[k]);
      }
      return out.join("\n");
    }
  }
  return "";
}

const CITY = "[A-Za-z][A-Za-z .'\\u2019\\-]{1,42}?";

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
    truckNo: "",
    trailerNo: "",
    notes: "",
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
  }

  // ---- carrier dispatch blocks: "Pick #1 ... Drop #1 ..." ----
  if (!out.from || !out.to) {
    const pickBlock = blockAfter(text, [
      /^\s*pick\s*#?\s*\d*\s*:?\s*(.*)$/i,
      /^\s*pick\s*-?\s*up\b\s*:?\s*(.*)$/i,
    ]);
    const dropBlock = blockAfter(text, [
      /^\s*drop\s*#?\s*\d*\s*:?\s*(.*)$/i,
      /^\s*deliver(?:y)?\b\s*:?\s*(.*)$/i,
    ]);
    if (!out.from && pickBlock)
      out.from = addressFromBlock(pickBlock) || cityFromBlock(pickBlock);
    if (!out.to && dropBlock)
      out.to = addressFromBlock(dropBlock) || cityFromBlock(dropBlock);
  }

  // ---- labeled pickup / delivery lines (fallback) ----
  if (!out.from || !out.to) {
    const pu = text.match(
      /pick\s*-?\s*up\s*:?\s*([^\n;]+?)(?=\s*(?:deliver|drop|unload|consignee|pick\b)|$)/i
    );
    const del = text.match(
      /(?:deliver(?:y)?|drop(?:\s*-?\s*off)?|unload|consignee)\s*:?\s*([^\n;]+?)(?=\s+(?:rate|\$|weight|ref\b|p\.?\s*o\.?|date)\b|[;\n]|$)/i
    );
    if (!out.from && pu)
      out.from = cleanPlace(pu[1].replace(/^(today|tomorrow|tonight)\b\s*/i, ""));
    if (!out.to && del) {
      const v = cleanPlace(del[1].replace(/^(today|tomorrow|tonight)\b\s*/i, ""));
      if (!/^#\d+$/.test(v)) out.to = v; // "Drop #1" header is not a place
    }
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

  // ---- truck / trailer unit numbers ----
  const truck = text.match(
    /\b(?:truck|unit)\s*#\s*:?\s*([A-Za-z0-9][A-Za-z0-9-]{0,11})/i
  );
  if (truck) out.truckNo = truck[1].replace(/[.,;:]+$/g, "");
  const trailer = text.match(
    /\btrailer\s*#\s*:?\s*([A-Za-z0-9][A-Za-z0-9-]{0,11})/i
  );
  if (trailer) out.trailerNo = trailer[1].replace(/[.,;:]+$/g, "");

  // ---- notes (to end of message) ----
  const notes = text.match(/\bnotes?\s*:\s*([\s\S]+)$/i);
  if (notes) {
    out.notes = notes[1].replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
  }

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
  // "Date 10-22-26" (labelled, dash or slash, 2- or 4-digit year)
  const labeled = text.match(
    /\bdate\s*:?\s*(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})\b/i
  );
  if (labeled) {
    out.date = numericDate(
      parseInt(labeled[1], 10),
      parseInt(labeled[2], 10),
      parseInt(labeled[3], 10),
      now
    );
  }
  // any other dash date: 10-22-26
  if (!out.date) {
    const dash = text.match(/\b(\d{1,2})-(\d{1,2})-(\d{2,4})\b/);
    if (dash) {
      out.date = numericDate(
        parseInt(dash[1], 10),
        parseInt(dash[2], 10),
        parseInt(dash[3], 10),
        now
      );
    }
  }
  if (!out.date) {
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
  }

  return out;
}
