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

export interface StaffProfile {
  /** Year they started, as a string — rendered and used for the "N yrs" stat. */
  since: string;
  /** Fake filename shown in the placeholder tile's corner chip. */
  fname: string;
  /** Lucide icon for the placeholder tile. */
  icon: string;
  /** Headline rating, pre-formatted. */
  rating: string;
  reviews: number;
  /** Next free slot, as marketing copy rather than a computed time. */
  next: string;
  /** "Known for" — the list card shows the first three. */
  tags: readonly string[];
  long: string;
}

export const STAFF_PROFILES: Readonly<Record<string, StaffProfile>> = {
  elin: {
    since: "2016",
    fname: "elin_at_station.jpg",
    icon: "palette",
    rating: "4.9",
    reviews: 212,
    next: "Tue · 2:00 PM",
    tags: ["Balayage", "Lived-in color", "Curly cuts", "Color correction"],
    long: "Elin joined the studio in 2016 after a decade behind other people’s chairs. She works slowly and asks a lot of questions before she picks up a brush, which is why her color tends to grow out without a hard line. Bring a blurry screenshot — she prefers it to a perfect one.",
  },
  noor: {
    since: "2019",
    fname: "noor_treatment_room.jpg",
    icon: "flower-2",
    rating: "5.0",
    reviews: 164,
    next: "Wed · 9:30 AM",
    tags: ["Facials", "Deep-tissue", "Barrier repair", "Pregnancy-safe"],
    long: "Noor trained in clinical skincare before moving into spa work, and it shows: she will tell you plainly when a product you love is the thing making your skin angry. Mornings only, always calm, never rushed.",
  },
  ivy: {
    since: "2021",
    fname: "ivy_nail_bar.jpg",
    icon: "sparkles",
    rating: "4.9",
    reviews: 198,
    next: "Thu · 11:00 AM",
    tags: ["Gel", "Structured manicure", "Nail repair", "Minimal art"],
    long: "Ivy is the reason people book three weeks out. Her prep work is obsessive — cuticles, shaping, and a cure that actually lasts — and she keeps a quiet chair for anyone who would rather not chat.",
  },
  marco: {
    since: "2022",
    fname: "marco_reformer.jpg",
    icon: "activity",
    rating: "4.8",
    reviews: 96,
    next: "Tue · 5:00 PM",
    tags: ["Reformer", "Rehab-friendly", "Beginners", "Private yoga"],
    long: "Marco came to Pilates through physio and still teaches like it. He will adjust a whole session around how your back feels that morning, and beginners always get their own hour before joining anything shared.",
  },
};

/** Fallback so an unseeded specialist still renders a complete profile. */
export const FALLBACK_PROFILE: StaffProfile = {
  since: "2016",
  fname: "specialist.jpg",
  icon: "sparkles",
  rating: "4.9",
  reviews: 0,
  next: "this week",
  tags: [],
  long: "",
};

export function staffProfile(id: string): StaffProfile {
  return STAFF_PROFILES[id] ?? FALLBACK_PROFILE;
}
