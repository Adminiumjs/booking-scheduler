/*
 * The seeded demo dataset (port spec §5), transcribed verbatim except where
 * an orchestrator ruling says otherwise:
 *
 *   R4 — LMN-1041 is seeded into the appointment list as well as the booking
 *        list, so the slot grid and the displayed booking agree.
 *   R5 — the *published* weekly hours are widened to cover the staff windows
 *        as authored (Marco 08:00–20:00, Ivy to 19:00); staff availability is
 *        never clamped.
 *   R6 — the review average is computed from the ratings, not hardcoded.
 *
 * Nothing outside `source.ts` should import this file.
 */

import { hash } from "../lib/codes.ts";
import { initialsOf, isoOf } from "../lib/format.ts";
import type {
  Appointment,
  Booking,
  Category,
  GiftCard,
  GiftTheme,
  IntakeOption,
  LoyaltyHistoryRow,
  LoyaltyReward,
  MembershipPlan,
  ReferralData,
  Review,
  Service,
  StaffMember,
  StudioHoursRow,
  StudioLocation,
  WaitlistEntry,
  Weekday,
} from "./types.ts";

/* ------------------------------------------------------------------ *
 * 5.1 Categories
 * ------------------------------------------------------------------ */

export const CATEGORIES: readonly Category[] = [
  { slug: "hair", name: "Hair", icon: "scissors" },
  { slug: "spa", name: "Spa", icon: "flower-2" },
  { slug: "nails", name: "Nails", icon: "hand" },
  { slug: "move", name: "Movement", icon: "activity" },
];

/* ------------------------------------------------------------------ *
 * 5.2 Services (12)
 * ------------------------------------------------------------------ */

export const SERVICES: readonly Service[] = [
  {
    id: "cut",
    name: "Cut & Style",
    cat: "hair",
    dur: 60,
    price: 78,
    staff: ["elin"],
    icon: "scissors",
    tint: "#b07d9a",
    blurb: "A precision cut and a finish you can actually redo at home.",
    fname: "cut_style.jpg",
  },
  {
    id: "root",
    name: "Root Color",
    cat: "hair",
    dur: 90,
    price: 135,
    staff: ["elin"],
    icon: "paintbrush",
    tint: "#a06f96",
    blurb: "Seamless root coverage matched right to your tone.",
    fname: "root_color.jpg",
  },
  {
    id: "balayage",
    name: "Balayage",
    cat: "hair",
    dur: 90,
    price: 190,
    staff: ["elin"],
    icon: "palette",
    tint: "#b58a6a",
    blurb: "Hand-painted, sun-kissed dimension that grows out soft.",
    fname: "balayage.jpg",
  },
  {
    id: "gloss",
    name: "Gloss & Tone",
    cat: "hair",
    dur: 45,
    price: 60,
    staff: ["elin"],
    icon: "droplet",
    tint: "#9a7fb0",
    blurb: "A quick shine-and-tone refresh between color visits.",
    fname: "gloss_tone.jpg",
  },
  {
    id: "facial",
    name: "Signature Facial",
    cat: "spa",
    dur: 60,
    price: 110,
    staff: ["noor"],
    icon: "flower-2",
    tint: "#6f8bb0",
    blurb: "A deep-clean, glow-forward facial tuned to your skin.",
    fname: "signature_facial.jpg",
  },
  {
    id: "deep",
    name: "Deep-Tissue Massage",
    cat: "spa",
    dur: 60,
    price: 115,
    staff: ["noor", "marco"],
    icon: "hand",
    tint: "#6a86ab",
    blurb: "Firm, focused work on the knots that keep nagging.",
    fname: "deep_tissue.jpg",
  },
  {
    id: "aroma",
    name: "Aromatherapy Ritual",
    cat: "spa",
    dur: 90,
    price: 155,
    staff: ["noor"],
    icon: "leaf",
    tint: "#7d9179",
    blurb: "Ninety unhurried minutes of warm scent and stillness.",
    fname: "aroma_ritual.jpg",
  },
  {
    id: "mani",
    name: "Classic Manicure",
    cat: "nails",
    dur: 45,
    price: 45,
    staff: ["ivy"],
    icon: "hand",
    tint: "#b0836a",
    blurb: "Tidy shape, real cuticle care, and a color that lasts.",
    fname: "classic_mani.jpg",
  },
  {
    id: "gel",
    name: "Gel Manicure",
    cat: "nails",
    dur: 60,
    price: 58,
    staff: ["ivy"],
    icon: "sparkles",
    tint: "#c08a6a",
    blurb: "High-shine gel that stays glossy for weeks, not days.",
    fname: "gel_mani.jpg",
  },
  {
    id: "pedi",
    name: "Deluxe Pedicure",
    cat: "nails",
    dur: 60,
    price: 70,
    staff: ["ivy"],
    icon: "footprints",
    tint: "#a8846f",
    blurb: "A soak, scrub, and massage your feet will thank you for.",
    fname: "deluxe_pedi.jpg",
  },
  {
    id: "reformer",
    name: "Reformer Pilates",
    cat: "move",
    dur: 45,
    price: 40,
    staff: ["marco"],
    icon: "activity",
    tint: "#7d9166",
    blurb: "A low-impact reformer session tuned to where you are.",
    fname: "reformer.jpg",
  },
  {
    id: "yoga",
    name: "Private Yoga",
    cat: "move",
    dur: 60,
    price: 70,
    staff: ["marco"],
    icon: "person-standing",
    tint: "#8a9a6a",
    blurb: "One-on-one flow, breath, and mobility, at your pace.",
    fname: "private_yoga.jpg",
  },
];

/** Ids shown in the home "Popular services" row. */
export const POPULAR_SERVICE_IDS: readonly string[] = [
  "cut",
  "facial",
  "gel",
  "reformer",
];

/* ------------------------------------------------------------------ *
 * 5.3 Staff (4)
 * ------------------------------------------------------------------ */

export const STAFF: readonly StaffMember[] = [
  {
    id: "elin",
    name: "Elin",
    role: "Color specialist",
    cat: "hair",
    initials: "EL",
    tint: "#b07d9a",
    bio: "Balayage & lived-in color, ten years in the chair.",
    hours: {
      1: [[600, 840]],
      2: [
        [540, 780],
        [840, 1080],
      ],
      3: [
        [540, 780],
        [840, 1080],
      ],
      4: [
        [540, 780],
        [840, 1080],
      ],
      5: [
        [540, 780],
        [840, 1080],
      ],
      6: [[540, 780]],
    },
  },
  {
    id: "noor",
    name: "Noor",
    role: "Spa therapist",
    cat: "spa",
    initials: "NO",
    tint: "#6f8bb0",
    bio: "Facials & massage — mornings only, always calm.",
    hours: {
      1: [[540, 780]],
      2: [[540, 780]],
      3: [[540, 780]],
      4: [[540, 780]],
      5: [[540, 780]],
      6: [[540, 780]],
    },
  },
  {
    id: "ivy",
    name: "Ivy",
    role: "Nail artist",
    cat: "nails",
    initials: "IV",
    tint: "#b0836a",
    bio: "Gel sets & detailed nail art. Off Sundays & Mondays.",
    hours: {
      2: [
        [600, 840],
        [900, 1140],
      ],
      3: [
        [600, 840],
        [900, 1140],
      ],
      4: [
        [600, 840],
        [900, 1140],
      ],
      5: [
        [600, 840],
        [900, 1140],
      ],
      6: [[600, 840]],
    },
  },
  {
    id: "marco",
    name: "Marco",
    role: "Movement coach",
    cat: "move",
    initials: "MA",
    tint: "#7d9166",
    bio: "Pilates, yoga & bodywork. Takes Mondays off.",
    hours: {
      2: [
        [480, 720],
        [960, 1200],
      ],
      3: [
        [480, 720],
        [960, 1200],
      ],
      4: [
        [480, 720],
        [960, 1200],
      ],
      5: [
        [480, 720],
        [960, 1200],
      ],
      6: [[480, 720]],
    },
  },
];

/* ------------------------------------------------------------------ *
 * 5.6 Studio hours & location
 *
 * R5: the published hours are widened to cover the staff windows as authored
 * (Marco starts at 08:00 and finishes at 20:00 Tue–Fri; Ivy runs to 19:00;
 * Noor and Elin open at 09:00 on Mondays). Staff windows are untouched.
 * ------------------------------------------------------------------ */

export const STUDIO_HOURS: readonly StudioHoursRow[] = [
  { day: "Monday", value: "9:00 AM – 6:00 PM", closed: false },
  { day: "Tuesday", value: "8:00 AM – 8:00 PM", closed: false },
  { day: "Wednesday", value: "8:00 AM – 8:00 PM", closed: false },
  { day: "Thursday", value: "8:00 AM – 8:00 PM", closed: false },
  { day: "Friday", value: "8:00 AM – 8:00 PM", closed: false },
  { day: "Saturday", value: "8:00 AM – 5:00 PM", closed: false },
  { day: "Sunday", value: "Closed", closed: true },
];

export const STUDIO_LOCATION: StudioLocation = {
  name: "Lumen Studio",
  shortName: "Lumen",
  addressLine1: "148 Alder Lane, Suite 2",
  addressLine2: "Riverside, Downtown",
  phone: "(415) 555-0148",
  transit: "2 min from Alder stop",
  email: "hello@lumenstudio.demo",
  /* The real demo path — the repo, the README and `build:demo` all say
     `booking-scheduler`, so the footer badge has to as well. */
  url: "adminium.dev/demo/booking-scheduler",
};

/* ------------------------------------------------------------------ *
 * 5.7 Reviews (4)
 * ------------------------------------------------------------------ */

export const REVIEWS: readonly Review[] = [
  {
    name: "Priya S.",
    initials: "PS",
    tint: "#b07d9a",
    rating: 5,
    svc: "Balayage",
    date: "2 weeks ago",
    quote:
      "Elin read exactly what I wanted from one blurry screenshot. Best color I’ve ever had, full stop.",
  },
  {
    name: "Marcus L.",
    initials: "ML",
    tint: "#6f8bb0",
    rating: 5,
    svc: "Deep-Tissue Massage",
    date: "1 month ago",
    quote:
      "Noor found every knot I’d been ignoring for a year. I walked out standing three inches taller.",
  },
  {
    name: "Dana R.",
    initials: "DR",
    tint: "#b0836a",
    rating: 5,
    svc: "Gel Manicure",
    date: "3 weeks ago",
    quote:
      "Ivy’s detail work is unreal, and it lasted almost three weeks without a single chip.",
  },
  {
    name: "Theo K.",
    initials: "TK",
    tint: "#7d9166",
    rating: 4,
    svc: "Reformer Pilates",
    date: "6 days ago",
    quote:
      "Marco tailors every session to how my back feels that day. Rebooking is genuinely one tap.",
  },
];

/** Marketing caption under the average (`from {REVIEW_COUNT_LABEL}`). */
export const REVIEW_COUNT_LABEL = "480+ visits";

/* ------------------------------------------------------------------ *
 * 5.8 Loyalty rewards
 * ------------------------------------------------------------------ */

export const REWARDS: readonly LoyaltyReward[] = [
  { label: "$10 off any service", cost: 200, icon: "ticket-percent", tint: "#7d9166" },
  { label: "Free Gloss & Tone", cost: 450, icon: "droplet", tint: "#9a7fb0" },
  { label: "Free Classic Manicure", cost: 500, icon: "hand", tint: "#b0836a" },
  { label: "Free Signature Facial", cost: 800, icon: "flower-2", tint: "#6f8bb0" },
];

export const LOYALTY_START_POINTS = 340;
export const LOYALTY_THRESHOLD = 500;

export const LOYALTY_HOW_IT_WORKS: readonly string[] = [
  "Earn 1 point for every $1 you spend.",
  "Redeem points for services and add-ons.",
  "Members earn 2× points on every visit.",
];

/* ------------------------------------------------------------------ *
 * 5.9 Membership plans
 * ------------------------------------------------------------------ */

export const PLANS: readonly MembershipPlan[] = [
  {
    name: "Glow Monthly",
    price: "$39",
    cadence: "/mo",
    featured: true,
    perks: [
      "One facial or gloss every month",
      "10% off any add-on service",
      "Priority spot on waitlists",
      "Earn 2× points on every visit",
    ],
  },
  {
    name: "Glow Annual",
    price: "$390",
    cadence: "/yr",
    featured: false,
    perks: [
      "Everything in Monthly",
      "Two months free vs. paying monthly",
      "A birthday-month treat on us",
      "A bring-a-friend guest pass",
    ],
  },
];

/* ------------------------------------------------------------------ *
 * 5.10 Loyalty history ledger (newest first; deltas sum to 340)
 * ------------------------------------------------------------------ */

export const LOYALTY_HISTORY: readonly LoyaltyHistoryRow[] = [
  { label: "Balayage with Elin", date: "Jul 14, 2026", delta: 190 },
  { label: "Signature Facial with Noor", date: "Jun 30, 2026", delta: 110 },
  { label: "Redeemed — $10 off any service", date: "Jun 18, 2026", delta: -200 },
  { label: "Gel Manicure with Ivy", date: "Jun 2, 2026", delta: 58 },
  { label: "Welcome bonus + early visits", date: "May 20, 2026", delta: 182 },
];

/* ------------------------------------------------------------------ *
 * 5.11 Referral
 * ------------------------------------------------------------------ */

export const REFERRAL: ReferralData = {
  code: "AVA-LUMEN",
  steps: [
    { icon: "share-2", label: "Share your code with a friend who hasn’t visited yet." },
    { icon: "calendar-check", label: "They book & complete their first appointment." },
    { icon: "gift", label: "You both get $15 off your next visit — no limit." },
  ],
  invites: [
    {
      name: "Jordan P.",
      initials: initialsOf("Jordan P."),
      status: "Joined · you earned $15",
      done: true,
    },
    {
      name: "Sam K.",
      initials: initialsOf("Sam K."),
      status: "Invite sent · waiting on first booking",
      done: false,
    },
  ],
};

/* ------------------------------------------------------------------ *
 * 5.12 Intake
 * ------------------------------------------------------------------ */

export const INTAKE_CONCERNS: readonly string[] = [
  "Sensitive skin",
  "Color-treated hair",
  "Recent injury or surgery",
  "Pregnant or nursing",
  "Known allergies",
  "First visit with us",
];

export const INTAKE_PRESSURES: readonly IntakeOption[] = [
  { id: "light", label: "Light" },
  { id: "medium", label: "Medium" },
  { id: "firm", label: "Firm" },
];

/* ------------------------------------------------------------------ *
 * 5.13 Gift-card themes & amounts
 * ------------------------------------------------------------------ */

export const GIFT_THEMES: readonly GiftTheme[] = [
  { id: "bloom", name: "Bloom", tint: "#b07d9a" },
  { id: "sea", name: "Sea", tint: "#6f8bb0" },
  { id: "sage", name: "Sage", tint: "#7d9166" },
  { id: "amber", name: "Amber", tint: "#c19a5b" },
];

export const GIFT_AMOUNTS: readonly number[] = [50, 100, 150, 250];

export const SEEDED_GIFT_CARDS: readonly GiftCard[] = [
  {
    code: "GIFT-4821",
    amount: 100,
    to: "Robin Alvarez",
    toEmail: "robin@email.com",
    status: "sent",
    date: "Jul 12, 2026",
  },
];

/* ------------------------------------------------------------------ *
 * 6.2 The rolling 7-day window — index 0 is always today
 * ------------------------------------------------------------------ */

export function buildWeek(from: Date = new Date()): Date[] {
  const t = new Date(from);
  t.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(t);
    d.setDate(t.getDate() + i);
    return d;
  });
}

/**
 * §5.4 `biso` — the first day in the window that falls Tue–Fri, else the first
 * Mon–Sat, else index 1. Everything seeded lands on this day.
 */
export function seedDateISO(week: readonly Date[]): string {
  const midweek = week.find((d) => d.getDay() >= 2 && d.getDay() <= 5);
  const weekday = week.find((d) => d.getDay() >= 1 && d.getDay() <= 6);
  return isoOf(midweek ?? weekday ?? week[1]);
}

/* ------------------------------------------------------------------ *
 * 5.5 Seeded bookings
 * ------------------------------------------------------------------ */

export function buildSeedBookings(week: readonly Date[]): Booking[] {
  const biso = seedDateISO(week);
  return [
    {
      code: "LMN-1039",
      svc: "gloss",
      staff: "elin",
      dateISO: biso,
      time: 840,
      dur: 45,
      price: 60,
      name: "Ava Reyes",
      email: "ava@example.com",
      phone: "(415) 555-0142",
      note: "Running a few minutes late, sorry!",
      status: "confirmed",
      remEmail: true,
      remSms: false,
      remWhen: "24h",
      recurOn: false,
      recurFreq: "1w",
      recurCount: 1,
      series: [biso],
    },
    {
      code: "LMN-1041",
      svc: "reformer",
      staff: "marco",
      dateISO: biso,
      time: 1020,
      dur: 45,
      price: 40,
      name: "Ava Reyes",
      email: "ava@example.com",
      phone: "(415) 555-0142",
      note: "",
      status: "confirmed",
      remEmail: true,
      remSms: true,
      remWhen: "24h",
      recurOn: false,
      recurFreq: "1w",
      recurCount: 1,
      series: [biso],
    },
  ];
}

export function buildSeedWaitlist(week: readonly Date[]): WaitlistEntry[] {
  const biso = seedDateISO(week);
  return [{ key: `${biso}|ivy`, staff: "ivy", svc: "gel", iso: biso }];
}

/* ------------------------------------------------------------------ *
 * 5.4 Seeded appointments
 *
 * The comp's pseudo-random fill marks ~30% of the 30-minute points inside
 * every staff window as busy, deterministic in the *relative* day index. Each
 * marked point becomes a 30-minute appointment; ruling R2's interval-overlap
 * engine reads them as real intervals. The two seeded bookings are pushed
 * first so their real durations win over any fill that would collide with them
 * (ruling R4 — LMN-1041 is included, which the comp forgot).
 *
 * The de-duplication is by INTERVAL, not by start minute. Keying on the start
 * alone is not enough once durations are real: LMN-1039 runs [840, 885) and the
 * fill would otherwise drop a separate 30-minute block at [870, 900) on the same
 * calendar. Two overlapping appointments for one staff member are impossible in
 * reality, and that particular pair also breaks ruling R3 — the overlapping fill
 * is not the booking being moved, so excluding LMN-1039 would still not let it
 * be rescheduled onto its own current slot. Skipping any fill that intersects
 * something already placed keeps the seed internally consistent.
 * ------------------------------------------------------------------ */

export const SEED_FILL_STEP = 30;

export function buildSeedAppointments(week: readonly Date[]): Appointment[] {
  const out: Appointment[] = [];

  const push = (a: Appointment): void => {
    const clash = out.some(
      (b) =>
        b.staffId === a.staffId &&
        b.dateISO === a.dateISO &&
        a.start < b.start + b.dur &&
        b.start < a.start + a.dur,
    );
    if (clash) return;
    out.push(a);
  };

  for (const b of buildSeedBookings(week)) {
    push({
      staffId: b.staff,
      dateISO: b.dateISO,
      start: b.time,
      dur: b.dur,
      bookingCode: b.code,
    });
  }

  for (const st of STAFF) {
    week.forEach((date, dayIndex) => {
      const wins = st.hours[date.getDay() as Weekday] ?? [];
      const iso = isoOf(date);
      for (const [from, to] of wins) {
        for (let m = from; m + SEED_FILL_STEP <= to; m += SEED_FILL_STEP) {
          if (hash(`${st.id}_${dayIndex}_${m}`) % 10 < 3) {
            push({
              staffId: st.id,
              dateISO: iso,
              start: m,
              dur: SEED_FILL_STEP,
              bookingCode: null,
            });
          }
        }
      }
    });
  }

  return out;
}
