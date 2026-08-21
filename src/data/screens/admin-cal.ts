/*
 * Calendar-only seed: the rooms view, and the little the appointment panel
 * knows about a guest.
 *
 * The day's book, the diary geometry and the status vocabulary are shared
 * with Today and live in `admin-today.ts`.
 */

import type { MessageKey } from "../../i18n/index.tsx";

export interface StudioRoom {
  id: string;
  /** Message key — a room is a column heading on the rooms view. */
  nameKey: MessageKey;
  /** Fills `{n}` where a room is one of a numbered pair. */
  n?: number;
  /**
   * Column-header initials. Left as the comp authored them rather than sliced
   * off the translated name: two letters cut out of `Farbraum` or `غرفة الصبغة`
   * are not what those languages abbreviate to, and the glyph only has to be
   * stable, not meaningful.
   */
  initials: string;
  tint: string;
  /** Service ids performed in this room. */
  svcs: readonly string[];
}

/** Five treatment spaces. A booking lands in the room its service needs. */
export const ROOMS: readonly StudioRoom[] = [
  {
    id: "colour1",
    nameKey: "data.room.colour",
    n: 1,
    initials: "CO",
    tint: "#b07d9a",
    svcs: ["balayage", "gloss"],
  },
  {
    id: "colour2",
    nameKey: "data.room.colour",
    n: 2,
    initials: "CO",
    tint: "#9a7fb0",
    svcs: ["cut"],
  },
  {
    id: "treat",
    nameKey: "data.room.treatment",
    initials: "TR",
    tint: "#6f8bb0",
    svcs: ["facial", "deep"],
  },
  {
    id: "nail",
    nameKey: "data.room.nailBar",
    initials: "NA",
    tint: "#c08a6a",
    svcs: ["gel", "pedi"],
  },
  {
    id: "loft",
    nameKey: "data.room.loft",
    initials: "ST",
    tint: "#7d9166",
    svcs: ["reformer"],
  },
];

/** What the studio has on file for a guest, keyed by the name on the booking. */
export interface ClientLedger {
  visits: number;
  /** Lifetime spend, whole dollars. */
  spend: number;
}

export const CLIENT_LEDGER: Record<string, ClientLedger> = {
  "Ava Reyes": { visits: 12, spend: 973 },
  "Priya Sharma": { visits: 8, spend: 1240 },
  "Marcus Lund": { visits: 6, spend: 690 },
  "Dana Rivas": { visits: 14, spend: 812 },
  "Jonah Pike": { visits: 1, spend: 78 },
  "Lucia Moss": { visits: 4, spend: 288 },
  "Theo Kim": { visits: 22, spend: 940 },
  "Sam Doyle": { visits: 2, spend: 120 },
  "Hannah Wills": { visits: 9, spend: 1105 },
  "Robin Alvarez": { visits: 3, spend: 210 },
};

export interface VisitRow {
  svc: string;
  /** `YYYY-MM-DD`; render through `formatMediumISO()`. */
  dateISO: string;
  /** Whole dollars. */
  amount: number;
}

/**
 * The "Recent visits" sample in the appointment panel.
 *
 * The comp showed these rows under every guest, including first-timers. The
 * port keeps the sample but only draws it for a returning guest — see
 * `AdminCal.tsx`.
 */
export const RECENT_VISITS: readonly VisitRow[] = [
  { svc: "Gloss & Tone", dateISO: "2026-07-14", amount: 60 },
  { svc: "Signature Facial", dateISO: "2026-06-30", amount: 110 },
  { svc: "Gel Manicure", dateISO: "2026-06-02", amount: 58 },
  { svc: "Balayage", dateISO: "2026-05-12", amount: 190 },
];

/**
 * The comp's string hash. It decides which bookings a *different* day carries,
 * so the diary looks lived-in without a second seeded week — and, being pure,
 * gives the same answer every time you page back to a day.
 */
export function hash(s: string): number {
  let n = 0;
  const str = String(s);
  for (let i = 0; i < str.length; i += 1) n = (n * 31 + str.charCodeAt(i)) >>> 0;
  return n;
}
