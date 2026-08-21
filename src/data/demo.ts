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
import type { MessageKey } from "../i18n/index.tsx";
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
  PackageDeal,
  StudioHoursRow,
  StudioLocation,
  WaitlistEntry,
  Weekday,
} from "./types.ts";

/* ------------------------------------------------------------------ *
 * 5.1 Categories
 * ------------------------------------------------------------------ */

export const CATEGORIES: readonly Category[] = [
  { slug: "hair", nameKey: "data.cat.hair", icon: "scissors" },
  { slug: "spa", nameKey: "data.cat.spa", icon: "flower-2" },
  { slug: "nails", nameKey: "data.cat.nails", icon: "hand" },
  { slug: "move", nameKey: "data.cat.move", icon: "activity" },
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

/*
 * Monday-first, carrying minute counts rather than `'9:00 AM – 6:00 PM'`. The
 * closed row keeps `open`/`close` at the studio's normal opening so nothing
 * downstream has to guard against a zero it will never draw.
 */
/** What a closed day says instead of a pair of times. */
export const HOURS_CLOSED_KEY: MessageKey = "data.hours.closed";

export const STUDIO_HOURS: readonly StudioHoursRow[] = [
  { day: 1, open: 540, close: 1080, closed: false },
  { day: 2, open: 480, close: 1200, closed: false },
  { day: 3, open: 480, close: 1200, closed: false },
  { day: 4, open: 480, close: 1200, closed: false },
  { day: 5, open: 480, close: 1200, closed: false },
  { day: 6, open: 480, close: 1020, closed: false },
  { day: 0, open: 540, close: 1020, closed: true },
];

export const STUDIO_LOCATION: StudioLocation = {
  name: "Lumen Studio",
  shortName: "Lumen",
  addressLine1: "148 Alder Lane, Suite 2",
  addressLine2: "Riverside, Downtown",
  phone: "(415) 555-0148",
  transitMinutes: 2,
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
    ago: 2,
    agoUnit: "week",
    quote:
      "Elin read exactly what I wanted from one blurry screenshot. Best color I’ve ever had, full stop.",
  },
  {
    name: "Marcus L.",
    initials: "ML",
    tint: "#6f8bb0",
    rating: 5,
    svc: "Deep-Tissue Massage",
    ago: 1,
    agoUnit: "month",
    quote:
      "Noor found every knot I’d been ignoring for a year. I walked out standing three inches taller.",
  },
  {
    name: "Dana R.",
    initials: "DR",
    tint: "#b0836a",
    rating: 5,
    svc: "Gel Manicure",
    ago: 3,
    agoUnit: "week",
    quote:
      "Ivy’s detail work is unreal, and it lasted almost three weeks without a single chip.",
  },
  {
    name: "Theo K.",
    initials: "TK",
    tint: "#7d9166",
    rating: 4,
    svc: "Reformer Pilates",
    ago: 6,
    agoUnit: "day",
    quote:
      "Marco tailors every session to how my back feels that day. Rebooking is genuinely one tap.",
  },
];

/**
 * The floor the caption under the average counts from — rendered through
 * `t('data.reviews.countLabel', {}, REVIEW_COUNT_BASE)`, which owns the `+`,
 * the plural and the word "visits" in each language.
 */
export const REVIEW_COUNT_BASE = 480;

/** The caption itself: `t(REVIEW_COUNT_LABEL_KEY, {}, REVIEW_COUNT_BASE)`. */
export const REVIEW_COUNT_LABEL_KEY: MessageKey = "data.reviews.countLabel";

/* ------------------------------------------------------------------ *
 * 5.8 Loyalty rewards
 * ------------------------------------------------------------------ */

/*
 * A reward is a benefit the product grants, not something the salon wrote, so
 * the wording is keyed. `svc` names the treatment the voucher is good for and
 * is resolved through the seam at render, which keeps the service name spelled
 * exactly once — the labels used to repeat "Gloss & Tone" by hand.
 */
export const REWARDS: readonly LoyaltyReward[] = [
  {
    labelKey: "data.reward.moneyOff",
    amount: 10,
    cost: 200,
    icon: "ticket-percent",
    tint: "#7d9166",
  },
  { labelKey: "data.reward.free", svc: "gloss", cost: 450, icon: "droplet", tint: "#9a7fb0" },
  { labelKey: "data.reward.free", svc: "mani", cost: 500, icon: "hand", tint: "#b0836a" },
  { labelKey: "data.reward.free", svc: "facial", cost: 800, icon: "flower-2", tint: "#6f8bb0" },
];

export const LOYALTY_START_POINTS = 340;
export const LOYALTY_THRESHOLD = 500;

/** The dollar spend that earns one point — filled into `{amount}`. */
export const LOYALTY_EARN_PER = 1;

/** Message keys, in order. The `{amount}` in the first is `LOYALTY_EARN_PER`. */
export const LOYALTY_HOW_IT_WORKS: readonly MessageKey[] = [
  "data.loyalty.howEarn",
  "data.loyalty.howRedeem",
  "data.loyalty.howMembers",
];

/* ------------------------------------------------------------------ *
 * 5.9 Membership plans
 * ------------------------------------------------------------------ */

export const PLANS: readonly MembershipPlan[] = [
  {
    name: "Glow Monthly",
    price: 39,
    cadenceKey: "data.plan.perMonth",
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
    price: 390,
    cadenceKey: "data.plan.perYear",
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

/*
 * Row labels are templates, not sentences glued together: `{service}` and
 * `{staff}` come from the seam so a renamed treatment cannot leave a stale
 * ledger behind, and word order stays the translator's to decide.
 */
export const LOYALTY_HISTORY: readonly LoyaltyHistoryRow[] = [
  {
    labelKey: "data.ledger.visit",
    svc: "balayage",
    staff: "elin",
    dateISO: "2026-07-14",
    delta: 190,
  },
  {
    labelKey: "data.ledger.visit",
    svc: "facial",
    staff: "noor",
    dateISO: "2026-06-30",
    delta: 110,
  },
  {
    labelKey: "data.ledger.redeemedMoneyOff",
    amount: 10,
    dateISO: "2026-06-18",
    delta: -200,
  },
  {
    labelKey: "data.ledger.visit",
    svc: "gel",
    staff: "ivy",
    dateISO: "2026-06-02",
    delta: 58,
  },
  { labelKey: "data.ledger.welcome", dateISO: "2026-05-20", delta: 182 },
];

/* ------------------------------------------------------------------ *
 * 5.11 Referral
 * ------------------------------------------------------------------ */

/** What a referral is worth to each side, whole dollars. */
export const REFERRAL_REWARD = 15;

export const REFERRAL: ReferralData = {
  code: "AVA-LUMEN",
  steps: [
    { icon: "share-2", labelKey: "data.refer.step1" },
    { icon: "calendar-check", labelKey: "data.refer.step2" },
    { icon: "gift", labelKey: "data.refer.step3", amount: REFERRAL_REWARD },
  ],
  invites: [
    {
      name: "Jordan P.",
      initials: initialsOf("Jordan P."),
      statusKey: "data.refer.inviteJoined",
      amount: REFERRAL_REWARD,
      done: true,
    },
    {
      name: "Sam K.",
      initials: initialsOf("Sam K."),
      statusKey: "data.refer.inviteWaiting",
      done: false,
    },
  ],
};

/* ------------------------------------------------------------------ *
 * 5.12 Intake
 * ------------------------------------------------------------------ */

/**
 * Checkbox labels on the intake form — chrome, so message keys.
 *
 * The key doubles as the identity `IntakeState.concerns` is keyed by, which it
 * has to: a translated label as a map key would reset every tick the moment
 * the reader changed language.
 */
export const INTAKE_CONCERNS: readonly MessageKey[] = [
  "data.intake.sensitiveSkin",
  "data.intake.colorTreated",
  "data.intake.recentInjury",
  "data.intake.pregnant",
  "data.intake.allergies",
  "data.intake.firstVisit",
];

export const INTAKE_PRESSURES: readonly IntakeOption[] = [
  { id: "light", labelKey: "data.intake.pressureLight" },
  { id: "medium", labelKey: "data.intake.pressureMedium" },
  { id: "firm", labelKey: "data.intake.pressureFirm" },
];

/* ------------------------------------------------------------------ *
 * 5.13 Gift-card themes & amounts
 * ------------------------------------------------------------------ */

export const GIFT_THEMES: readonly GiftTheme[] = [
  { id: "bloom", nameKey: "data.giftTheme.bloom", tint: "#b07d9a" },
  { id: "sea", nameKey: "data.giftTheme.sea", tint: "#6f8bb0" },
  { id: "sage", nameKey: "data.giftTheme.sage", tint: "#7d9166" },
  { id: "amber", nameKey: "data.giftTheme.amber", tint: "#c19a5b" },
];

export const GIFT_AMOUNTS: readonly number[] = [50, 100, 150, 250];

export const SEEDED_GIFT_CARDS: readonly GiftCard[] = [
  {
    code: "GIFT-4821",
    amount: 100,
    to: "Robin Alvarez",
    toEmail: "robin@email.com",
    status: "sent",
    dateISO: "2026-07-12",
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


/* ------------------------------------------------------------------ *
 * Packages — prepaid bundles of sessions
 *
 * Contract data: a studio owner edits these like services. Both the account
 * dashboard tile and the packages screen read this one array through the
 * seam, so the two can never drift apart on price or session count.
 * ------------------------------------------------------------------ */

export const PACKAGES: readonly PackageDeal[] = [
  {
    id: "glow5",
    name: "Glow Five",
    svc: "facial",
    qty: 5,
    was: 550,
    now: 475,
    icon: "flower-2",
    tint: "#6f8bb0",
    blurb: "Five signature facials, spaced however your skin likes them.",
  },
  {
    id: "color3",
    name: "Color Care Trio",
    svc: "root",
    qty: 3,
    was: 405,
    now: 355,
    icon: "paintbrush",
    tint: "#a06f96",
    blurb: "Three root touch-ups, booked whenever the line shows up.",
  },
  {
    id: "nail6",
    name: "Nail Club",
    svc: "gel",
    qty: 6,
    was: 348,
    now: 290,
    icon: "sparkles",
    tint: "#c08a6a",
    blurb: "Six gel sets — roughly half a year of very good hands.",
  },
  {
    id: "move10",
    name: "Movement Ten",
    svc: "reformer",
    qty: 10,
    was: 400,
    now: 320,
    featured: true,
    icon: "activity",
    tint: "#7d9166",
    blurb: "Ten reformer sessions with Marco. The habit-builder.",
  },
  {
    id: "aroma3",
    name: "Slow Sundays",
    svc: "aroma",
    qty: 3,
    was: 465,
    now: 399,
    icon: "leaf",
    tint: "#7d9179",
    blurb: "Three ninety-minute aromatherapy rituals, no rushing.",
  },
  {
    id: "sampler",
    name: "Studio Sampler",
    svc: null,
    qty: 3,
    was: 233,
    now: 199,
    icon: "gift",
    tint: "#b07d9a",
    blurb: "One cut, one facial, one manicure — try the whole studio.",
  },
];
