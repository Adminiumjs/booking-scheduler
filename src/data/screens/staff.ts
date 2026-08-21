/*
 * Page-local seed for the specialists directory.
 *
 * `data.getStaff()` owns the operational facts — id, role, category, tint and
 * the availability windows the slot engine reads. Everything here is
 * profile-page dressing (the long bio, the "known for" tags, the headline
 * rating) that only this screen renders, so it stays out of the shared seam.
 *
 * Keyed by staff id. The comp's colour specialist is `selma`; the shipped
 * catalogue renamed her `elin` under the 2026-07-27 de-branding, and
 * "Selma Okonjo" is now the studio *owner* on the admin half — so her bio says
 * "joined the studio", not the comp's "opened the studio", which would give the
 * app two founders.
 */

import type { MessageKey, TFunction } from "../../i18n/index.tsx";
import { minutesToTime, weekdayName } from "../../lib/format.ts";

/** What the next-slot line says when the profile carries no day and time. */
export const NEXT_THIS_WEEK_KEY: MessageKey = "data.staff.nextThisWeek";

export interface StaffProfile {
  /** Year they started — a number, so `Intl` picks the digits. */
  since: number;
  /** Fake filename shown in the placeholder tile's corner chip. */
  fname: string;
  /** Lucide icon for the placeholder tile. */
  icon: string;
  /** Headline rating. A number: `'4.9'` has a full stop in it, and half the
   *  bundle writes that separator as a comma. */
  rating: number;
  reviews: number;
  /**
   * Next free slot — marketing copy rather than a computed time, but still a
   * day and a clock, so it is stored as `Date.getDay()` plus minutes from
   * midnight and spelled with `weekdayName()` and `minutesToTime()`. Both
   * `null` means "this week", which `data.staff.nextThisWeek` says.
   */
  nextDay: number | null;
  nextMinute: number | null;
  /** "Known for" — the list card shows the first three. */
  tags: readonly string[];
  long: string;
}

export const STAFF_PROFILES: Readonly<Record<string, StaffProfile>> = {
  elin: {
    since: 2016,
    fname: "elin_at_station.jpg",
    icon: "palette",
    rating: 4.9,
    reviews: 212,
    nextDay: 2,
    nextMinute: 840,
    tags: ["Balayage", "Lived-in color", "Curly cuts", "Color correction"],
    long: "Elin joined the studio in 2016 after a decade behind other people’s chairs. She works slowly and asks a lot of questions before she picks up a brush, which is why her color tends to grow out without a hard line. Bring a blurry screenshot — she prefers it to a perfect one.",
  },
  noor: {
    since: 2019,
    fname: "noor_treatment_room.jpg",
    icon: "flower-2",
    rating: 5,
    reviews: 164,
    nextDay: 3,
    nextMinute: 570,
    tags: ["Facials", "Deep-tissue", "Barrier repair", "Pregnancy-safe"],
    long: "Noor trained in clinical skincare before moving into spa work, and it shows: she will tell you plainly when a product you love is the thing making your skin angry. Mornings only, always calm, never rushed.",
  },
  ivy: {
    since: 2021,
    fname: "ivy_nail_bar.jpg",
    icon: "sparkles",
    rating: 4.9,
    reviews: 198,
    nextDay: 4,
    nextMinute: 660,
    tags: ["Gel", "Structured manicure", "Nail repair", "Minimal art"],
    long: "Ivy is the reason people book three weeks out. Her prep work is obsessive — cuticles, shaping, and a cure that actually lasts — and she keeps a quiet chair for anyone who would rather not chat.",
  },
  marco: {
    since: 2022,
    fname: "marco_reformer.jpg",
    icon: "activity",
    rating: 4.8,
    reviews: 96,
    nextDay: 2,
    nextMinute: 1020,
    tags: ["Reformer", "Rehab-friendly", "Beginners", "Private yoga"],
    long: "Marco came to Pilates through physio and still teaches like it. He will adjust a whole session around how your back feels that morning, and beginners always get their own hour before joining anything shared.",
  },
};

/** Fallback so an unseeded specialist still renders a complete profile. */
export const FALLBACK_PROFILE: StaffProfile = {
  since: 2016,
  fname: "specialist.jpg",
  icon: "sparkles",
  rating: 4.9,
  reviews: 0,
  nextDay: null,
  nextMinute: null,
  tags: [],
  long: "",
};

export function staffProfile(id: string): StaffProfile {
  return STAFF_PROFILES[id] ?? FALLBACK_PROFILE;
}

/**
 * `'Thursday 2:00 PM'`, or `'this week'` when the profile names no slot.
 *
 * Stored as a weekday index and minutes from midnight rather than a phrase,
 * so the day is spelled by `Intl` and the clock is the reader's own — a seeded
 * `'Thu 2pm'` was legible in one language out of eight.
 */
export function nextFreeLabel(t: TFunction, p: StaffProfile): string {
  if (p.nextDay === null || p.nextMinute === null) return t(NEXT_THIS_WEEK_KEY);
  return `${weekdayName(p.nextDay)} ${minutesToTime(p.nextMinute)}`;
}
