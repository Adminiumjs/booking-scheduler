// SPDX-License-Identifier: AGPL-3.0-only
/**
 * A `DataSource` backed by a real Adminium instance (28-public-surface.md §5.2,
 * 28-T28 wave 3).
 *
 * ── READS DO NOT BECOME ASYNC ──────────────────────────────────────────────
 * `loadSnapshot` fetches the whole read-set once, before React mounts, and the
 * class below answers the seam's thirty-odd methods SYNCHRONOUSLY from it — so
 * fifty screens, the booking engine and the store are untouched.
 *
 * ── IT DELEGATES WHAT IS COPY AND OVERRIDES WHAT IS RECORDS ────────────────
 * This seam mixes two different things. `getServices`, `getStaff` and the
 * appointment grid are the salon's ROWS. `getRewards`, `getPlans`,
 * `getPackages`, `getIntakeConcerns`, `getGiftThemes` and
 * `getLoyaltyHowItWorks` are the APP's own copy — message keys and catalogues
 * the product ships, with no table anywhere in `db/schema.sql`. So the class
 * holds a demo instance and delegates those, rather than inventing empty
 * versions of them. Every delegated method is listed at the bottom of this file
 * and each is a WS-I finding: a salon cannot change its own membership plans.
 *
 * ── THE SIDE OF THE KEY DECIDES WHAT IS READ, AND THAT IS THE POINT ────────
 * §4's staff/customer split is a branch here, not documentation. A CUSTOMER-side
 * scope reads the catalogue and the BUSY GRID — which service, which specialist,
 * from when to when — because a booking page cannot offer a slot without
 * knowing what is taken. It does not read a guest's name, e-mail, phone,
 * booking code, note or gift card. A STAFF-side scope reads those too. Getting
 * this backwards puts a salon's whole client list on its public booking page.
 *
 * ── TIME IS THE SALON'S, NEVER THE READER'S ────────────────────────────────
 * Every appointment is converted to the tenant's own day and minutes-from-
 * midnight. A guest booking from another timezone would otherwise be shown
 * their own clock against the salon's diary, and the slot they picked would be
 * the wrong one — with no error anywhere.
 *
 * ── WHAT THE SCHEMA CANNOT SAY (WS-I gaps, marked not hidden) ──────────────
 * G-1 THE STUDIO HAS NO RECORD: no name, address, phone, e-mail or URL. The
 *     header wordmark and the footer therefore render blank rather than
 *     Selma's. This is the third repo in this wave to need §5.5's settings
 *     record and the argument is now overwhelming.
 * G-2 There are no studio-wide opening hours — `availability_rules` are PER
 *     SPECIALIST. The hours strip is DERIVED as the union of everybody's
 *     windows, which is what a guest can actually book, and is truer than a
 *     posted sign that disagrees with the diary.
 * G-3 Reviews, the referral programme, loyalty rewards, membership plans and
 *     prepaid packages have no tables at all. They are the app's copy and come
 *     across unchanged — a salon cannot price its own membership.
 * G-4 The loyalty ledger IS a table, and it is per customer. Nothing here knows
 *     who is reading, so the balance and its history are empty until the claim
 *     flow lands (§3.4, O2).
 * G-5 `services.image_url` is read as the placeholder tile's filename chip
 *     because it is the only column of that shape.
 */

import {
  createPublicClient,
  toTenantDay,
  toTenantMinutes,
  type PublicClient,
  type PublicConfig,
} from "@adminiumjs/public-client";

import type { MessageKey } from "../i18n/index.tsx";
import type {
  Appointment,
  Booking,
  Category,
  CategoryFilter,
  CategorySlug,
  GiftCard,
  GiftStatus,
  LoyaltyLedgerRow,
  Service,
  StaffHours,
  StaffMember,
  StudioHoursRow,
  StudioLocation,
  TimeWindow,
  WaitlistEntry,
  Weekday,
} from "./types.ts";
import { createDemoDataSource, type CategoryCounts, type DataSource } from "./source.ts";

/* --------------------------------------------------------------- the wire */

interface WireCategory {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
}

interface WireService {
  id: number;
  slug: string;
  name: string;
  category_id: number;
  description: string | null;
  duration_min: number;
  /** `numeric` serializes as a STRING, not a number. */
  price: string;
  image_url: string | null;
  icon: string | null;
  tint: string | null;
  active: boolean;
  sort_order: number;
}

interface WireStaff {
  id: number;
  slug: string;
  name: string;
  role: string;
  bio: string | null;
  initials: string | null;
  tint: string | null;
  category_id: number | null;
  active: boolean;
  sort_order: number;
}

interface WireStaffService {
  staff_id: number;
  service_id: number;
}

interface WireAvailability {
  staff_id: number;
  weekday: string;
  opens: string;
  closes: string;
}

interface WireAppointment {
  id: number;
  service_id: number;
  staff_id: number | null;
  starts_at: string;
  ends_at: string;
  status: string;
  /** Staff-side only. */
  code?: string;
  customer_id?: number;
  price?: string;
  notes?: string | null;
  remind_email?: boolean;
  remind_sms?: boolean;
  remind_when?: string;
}

interface WireCustomer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
}

interface WireGiftCard {
  code: string;
  amount: string;
  recipient_name: string;
  recipient_email: string;
  status: string;
  issued_at: string;
}

interface WireWaitlist {
  customer_id: number;
  service_id: number;
  staff_id: number | null;
  requested_date: string;
  status: string;
}

/** `availability_rules.weekday` and `Date.getDay()` disagree; this is the map. */
const WEEKDAY_INDEX: Record<string, Weekday> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

/** The catalogue and the busy grid — readable by a key an operator hands out. */
const PUBLIC_REFS = {
  serviceCategories: ["id", "name", "slug", "icon", "sort_order"],
  services: [
    "id", "slug", "name", "category_id", "description", "duration_min",
    "price", "image_url", "icon", "tint", "active", "sort_order",
  ],
  staff: [
    "id", "slug", "name", "role", "bio", "initials", "tint",
    "category_id", "active", "sort_order",
  ],
  staffServices: ["staff_id", "service_id"],
  availabilityRules: ["staff_id", "weekday", "opens", "closes"],
  /* The busy grid, and nothing personal: no code, no customer, no note. A
   * booking page cannot offer a slot without knowing what is taken. */
  appointments: ["id", "service_id", "staff_id", "starts_at", "ends_at", "status"],
};

/** Everything with a guest's name on it — a staff-side key only. */
const STAFF_REFS = {
  customers: ["id", "name", "email", "phone"],
  giftCards: ["code", "amount", "recipient_name", "recipient_email", "status", "issued_at"],
  waitlistEntries: ["customer_id", "service_id", "staff_id", "requested_date", "status"],
};

/** The extra appointment columns a staff-side scope adds. */
const STAFF_APPOINTMENT_COLUMNS = [
  ...PUBLIC_REFS.appointments,
  "code", "customer_id", "price", "notes", "remind_email", "remind_sms", "remind_when",
];

/** WS-I G-1 — the studio itself, which `db/schema.sql` has nowhere to put. */
const NO_LOCATION: StudioLocation = {
  name: "",
  shortName: "",
  addressLine1: "",
  addressLine2: "",
  phone: "",
  transitMinutes: 0,
  email: "",
  url: "",
};

export interface Snapshot {
  side: PublicConfig["side"];
  todayISO: string;
  week: Date[];
  categories: Category[];
  services: Service[];
  staff: StaffMember[];
  popular: string[];
  appointments: Appointment[];
  bookings: Booking[];
  waitlist: WaitlistEntry[];
  giftCards: GiftCard[];
  hours: StudioHoursRow[];
  firstCode: number;
}

/**
 * The client, or null when either build-time variable is absent.
 *
 * The emptiness check is `createPublicClient`'s, not repeated here: it already
 * treats a missing or empty value as "this build has no server", and a second
 * copy of that rule is a second place for it to drift.
 */
export function clientFromEnv(): PublicClient | null {
  return createPublicClient({
    baseUrl: import.meta.env["VITE_ADMINIUM_API_BASE_URL"] as string | undefined,
    publishableKey: import.meta.env["VITE_ADMINIUM_PUBLISHABLE_KEY"] as string | undefined,
  });
}

/** Read a whole ref, a page at a time, at whatever size the scope permits. */
async function listAll<T>(
  client: PublicClient,
  ref: string,
  size: number,
  max: number,
): Promise<T[]> {
  const out: T[] = [];
  const page = Math.max(1, Math.min(size, 500));
  for (let offset = 0; offset < max; offset += page) {
    const res = await client.list<T>(ref, { limit: page, offset });
    out.push(...res.data);
    if (res.data.length < page) return out;
  }
  console.warn(`[adminium] ${ref}: stopped at ${String(max)} rows — the rest were not read.`);
  return out;
}

/** "09:30" → 570. Availability rules store wall-clock strings, not instants. */
function clockToMinutes(value: string): number {
  const parts = value.split(":");
  return Number(parts[0]) * 60 + Number(parts[1] ?? "0");
}

/**
 * Fetch the read-set and map it into the app's shapes.
 *
 * Returns `null` on ANY failure so the caller falls back to demo mode
 * structurally rather than in a catch — the marketplace demos are static clones
 * with no server and must keep working byte-identically.
 */
export async function loadSnapshot(client: PublicClient): Promise<Snapshot | null> {
  try {
    const config = await client.config();
    const staff = config.side === "staff";
    await client.assertRefs(
      staff
        ? { ...PUBLIC_REFS, ...STAFF_REFS, appointments: STAFF_APPOINTMENT_COLUMNS }
        : PUBLIC_REFS,
    );

    const tz = config.timezone;
    const cap = (ref: string): number => config.refs[ref]?.limit ?? 100;

    const [categories, services, people, links, rules, appointments] = await Promise.all([
      listAll<WireCategory>(client, "serviceCategories", cap("serviceCategories"), 200),
      listAll<WireService>(client, "services", cap("services"), 5_000),
      listAll<WireStaff>(client, "staff", cap("staff"), 1_000),
      listAll<WireStaffService>(client, "staffServices", cap("staffServices"), 50_000),
      listAll<WireAvailability>(client, "availabilityRules", cap("availabilityRules"), 20_000),
      listAll<WireAppointment>(client, "appointments", cap("appointments"), 100_000),
    ]);

    const [customers, giftCards, waitlist] = staff
      ? await Promise.all([
          listAll<WireCustomer>(client, "customers", cap("customers"), 50_000),
          listAll<WireGiftCard>(client, "giftCards", cap("giftCards"), 50_000),
          listAll<WireWaitlist>(client, "waitlistEntries", cap("waitlistEntries"), 50_000),
        ])
      : ([[], [], []] as [WireCustomer[], WireGiftCard[], WireWaitlist[]]);

    const todayISO = toTenantDay(new Date().toISOString(), tz);

    /* --- catalogue ----------------------------------------------------- */

    const catSlug = new Map<number, string>(categories.map((c) => [c.id, c.slug]));
    const mappedCategories: Category[] = [...categories]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((row) => ({
        slug: row.slug as CategorySlug,
        // The salon's own word for its section. `t()` falls back to its
        // argument, so operator text renders literally where the seed's
        // message key would have been translated.
        nameKey: row.name as MessageKey,
        icon: row.icon ?? "sparkles",
      }));

    const serviceSlug = new Map<number, string>(services.map((s) => [s.id, s.slug]));
    const staffSlug = new Map<number, string>(people.map((s) => [s.id, s.slug]));

    const staffByService = new Map<number, number[]>();
    for (const row of links) {
      const list = staffByService.get(row.service_id) ?? [];
      list.push(row.staff_id);
      staffByService.set(row.service_id, list);
    }
    const orderOf = new Map<number, number>(people.map((p) => [p.id, p.sort_order]));

    const mappedServices: Service[] = [...services]
      .filter((row) => row.active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .flatMap((row) => {
        const cat = catSlug.get(row.category_id);
        // A service whose section did not come back has no chip and no filter.
        if (cat === undefined) return [];
        return [
          {
            id: row.slug,
            name: row.name,
            cat: cat as CategorySlug,
            dur: row.duration_min,
            price: Number(row.price),
            staff: (staffByService.get(row.id) ?? [])
              .sort((a, b) => (orderOf.get(a) ?? 0) - (orderOf.get(b) ?? 0))
              .flatMap((id) => {
                const slug = staffSlug.get(id);
                return slug === undefined ? [] : [slug];
              }),
            icon: row.icon ?? "sparkles",
            tint: row.tint ?? "#c7b8a8",
            blurb: row.description ?? "",
            // WS-I G-5: `image_url` is the only column of this shape.
            fname: row.image_url ?? `${row.slug}.webp`,
          },
        ];
      });

    const hoursByStaff = new Map<number, StaffHours>();
    for (const row of rules) {
      const day = WEEKDAY_INDEX[row.weekday];
      if (day === undefined) continue;
      const held = hoursByStaff.get(row.staff_id) ?? {};
      const window: TimeWindow = [clockToMinutes(row.opens), clockToMinutes(row.closes)];
      held[day] = [...(held[day] ?? []), window];
      hoursByStaff.set(row.staff_id, held);
    }

    const mappedStaff: StaffMember[] = [...people]
      .filter((row) => row.active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((row) => ({
        id: row.slug,
        name: row.name,
        role: row.role,
        cat: (row.category_id === null ? "" : catSlug.get(row.category_id) ?? "") as CategorySlug,
        initials: row.initials ?? initialsOf(row.name),
        tint: row.tint ?? "#c7b8a8",
        bio: row.bio ?? "",
        hours: hoursByStaff.get(row.id) ?? {},
      }));

    /* WS-I G-2: the union of everybody's windows, which is what a guest can
     * actually book. A posted sign with no table behind it would be a second
     * source of truth that disagrees with the diary. */
    const hours: StudioHoursRow[] = [0, 1, 2, 3, 4, 5, 6].map((day) => {
      let open = Number.POSITIVE_INFINITY;
      let close = Number.NEGATIVE_INFINITY;
      for (const own of hoursByStaff.values()) {
        for (const [from, to] of own[day as Weekday] ?? []) {
          open = Math.min(open, from);
          close = Math.max(close, to);
        }
      }
      const closed = open === Number.POSITIVE_INFINITY;
      return { day: day as Weekday, open: closed ? 0 : open, close: closed ? 0 : close, closed };
    });

    /* --- the diary ------------------------------------------------------ */

    const live = appointments.filter((a) => a.status === "booked" || a.status === "completed");
    const mappedAppointments: Appointment[] = live.flatMap((row) => {
      const slug = row.staff_id === null ? undefined : staffSlug.get(row.staff_id);
      // An appointment with nobody assigned occupies nobody's column.
      if (slug === undefined) return [];
      const start = toTenantMinutes(row.starts_at, tz);
      return [
        {
          staffId: slug,
          dateISO: toTenantDay(row.starts_at, tz),
          start,
          dur: Math.max(5, toTenantMinutes(row.ends_at, tz) - start),
          /* The code is a guest's. A customer-side scope should not expose
           * the column at all — and this does not TRUST that: the branch is
           * here so that a scope an operator widened by hand still cannot put
           * booking codes on a public page. */
          bookingCode: staff ? row.code ?? null : null,
        },
      ];
    });

    const customerOf = new Map(customers.map((c) => [c.id, c]));
    const bookings: Booking[] = staff
      ? live.flatMap((row) => {
          const service = serviceSlug.get(row.service_id);
          const person = row.staff_id === null ? undefined : staffSlug.get(row.staff_id);
          const guest = row.customer_id === undefined ? undefined : customerOf.get(row.customer_id);
          if (service === undefined || person === undefined || guest === undefined || row.code === undefined) {
            return [];
          }
          const dateISO = toTenantDay(row.starts_at, tz);
          const time = toTenantMinutes(row.starts_at, tz);
          return [
            {
              code: row.code,
              svc: service,
              staff: person,
              dateISO,
              time,
              dur: Math.max(5, toTenantMinutes(row.ends_at, tz) - time),
              price: Number(row.price ?? "0"),
              name: guest.name,
              email: guest.email,
              phone: guest.phone ?? "",
              note: row.notes ?? "",
              /* The app knows two states, `confirmed` and `cancelled`; the
               * schema knows four. `booked` and `completed` are both a visit
               * that stands, and `no_show` is filtered out above with
               * `cancelled` — a guest who did not come is not on the diary. */
              status: "confirmed",
              remEmail: row.remind_email ?? true,
              remSms: row.remind_sms ?? true,
              remWhen: (row.remind_when ?? "24h") as Booking["remWhen"],
              /* A recurring series has no column: `appointments` records the
               * visits, not the rule that made them. So every booking reads as
               * a one-off, which is the honest version of what is stored. */
              recurOn: false,
              recurFreq: "1w",
              recurCount: 1,
              series: [dateISO],
            } as Booking,
          ];
        })
      : [];

    const mappedWaitlist: WaitlistEntry[] = waitlist.flatMap((row) => {
      const service = serviceSlug.get(row.service_id);
      if (service === undefined || row.status !== "waiting") return [];
      const person = row.staff_id === null ? "first" : staffSlug.get(row.staff_id) ?? "first";
      return [{ key: `${row.requested_date}|${person}`, staff: person, svc: service, iso: row.requested_date }];
    });

    const mappedGiftCards: GiftCard[] = giftCards.map((row) => ({
      code: row.code,
      amount: Number(row.amount),
      to: row.recipient_name,
      toEmail: row.recipient_email,
      status: (row.status === "redeemed" ? "redeemed" : "sent") as GiftStatus,
      dateISO: toTenantDay(row.issued_at, tz),
    }));

    /* The salon's own favourites have no column, so this is what guests
     * actually book most — truer than a curated list, and it moves. */
    const bookedCount = new Map<string, number>();
    for (const row of live) {
      const slug = serviceSlug.get(row.service_id);
      if (slug === undefined) continue;
      bookedCount.set(slug, (bookedCount.get(slug) ?? 0) + 1);
    }
    const popular = [...mappedServices]
      .sort((a, b) => (bookedCount.get(b.id) ?? 0) - (bookedCount.get(a.id) ?? 0))
      .slice(0, 3)
      .map((s) => s.id);

    return {
      side: config.side,
      todayISO,
      week: weekFrom(todayISO),
      categories: mappedCategories,
      services: mappedServices,
      staff: mappedStaff,
      popular,
      appointments: mappedAppointments,
      bookings,
      waitlist: mappedWaitlist,
      giftCards: mappedGiftCards,
      hours,
      firstCode: staff ? nextCodeFrom(live) : 1,
    };
  } catch (error) {
    console.warn("[adminium] connected mode unavailable, using demo data:", error);
    return null;
  }
}

/** "Elin Vagn" → "EV". Only when the row leaves `initials` empty. */
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .slice(0, 2)
    .map((w) => (w[0] ?? "").toUpperCase())
    .join("");
}

/** The Monday-first week containing the salon's today. */
function weekFrom(todayISO: string): Date[] {
  const today = new Date(`${todayISO}T00:00:00Z`);
  const monday = new Date(today);
  // `getUTCDay()` is Sunday-first; the diary is Monday-first.
  monday.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + i);
    return day;
  });
}

/**
 * The next booking code, read off the highest one already issued.
 *
 * The seed starts its in-session counter at 1043; a connected salon continues
 * its own. Anything that does not end in digits is ignored rather than parsed
 * into `NaN`. A customer-side build never calls this — it has no codes to read
 * and starts at one, which is what an empty diary means.
 */
function nextCodeFrom(appointments: readonly WireAppointment[]): number {
  let highest = 0;
  for (const row of appointments) {
    if (row.code === undefined) continue;
    const match = /(\d+)$/.exec(row.code);
    if (match !== null) highest = Math.max(highest, Number(match[1]));
  }
  return highest + 1;
}

/**
 * A synchronous `DataSource` over an already-fetched snapshot.
 *
 * Every method NOT overridden below is delegated to a demo instance, and each
 * of those is a WS-I finding rather than an oversight — see the file header's
 * G-3. They are, in full: reviews and their summary, the referral programme,
 * loyalty rewards, membership plans, prepaid packages, the loyalty rules and
 * their explanation, the intake questionnaire and the gift-card themes and
 * amounts. None of them has a table.
 */
export function snapshotSource(snap: Snapshot): DataSource {
  const copy = createDemoDataSource();

  const byId = new Map(snap.services.map((s) => [s.id, s]));
  const staffById = new Map(snap.staff.map((s) => [s.id, s]));

  return {
    /* ── DELEGATED, AND EACH ONE IS A WS-I FINDING ────────────────────────
     *
     * Written out rather than spread. `createDemoDataSource()` returns a CLASS
     * INSTANCE, so `{ ...copy }` would copy its own properties and none of its
     * prototype's methods — TypeScript accepts it (the declared type has them
     * all) and every one of these would be `undefined` at run time, on a screen
     * nobody opened during review. The list is also the point: a salon on a
     * connected build cannot change any of these, because none of them has a
     * table anywhere in `db/schema.sql`.
     */
    getReviews: () => copy.getReviews(),
    getReviewSummary: () => copy.getReviewSummary(),
    getReferral: () => copy.getReferral(),
    getRewards: () => copy.getRewards(),
    getPlans: () => copy.getPlans(),
    getPackages: () => copy.getPackages(),
    getLoyaltyStartPoints: () => copy.getLoyaltyStartPoints(),
    getLoyaltyThreshold: () => copy.getLoyaltyThreshold(),
    getLoyaltyEarnPer: () => copy.getLoyaltyEarnPer(),
    getLoyaltyHowItWorks: () => copy.getLoyaltyHowItWorks(),
    getIntakeConcerns: () => copy.getIntakeConcerns(),
    getIntakePressures: () => copy.getIntakePressures(),
    getGiftThemes: () => copy.getGiftThemes(),
    getGiftTheme: (id) => copy.getGiftTheme(id),
    getGiftAmounts: () => copy.getGiftAmounts(),

    /* catalogue — the salon's rows */
    getCategories: () => snap.categories,
    getCategory: (slug) => snap.categories.find((c) => c.slug === slug),
    getServices: () => snap.services,
    getService: (id) => (id ? byId.get(id) : undefined),
    getServicesByCategory: (filter: CategoryFilter) =>
      filter === "all" ? snap.services.slice() : snap.services.filter((s) => s.cat === filter),
    getCategoryCounts: (): CategoryCounts => {
      const counts = { all: snap.services.length } as CategoryCounts;
      for (const category of snap.categories) {
        counts[category.slug] = snap.services.filter((s) => s.cat === category.slug).length;
      }
      return counts;
    },
    getPopularServices: () => snap.popular.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])),

    /* people */
    getStaff: () => snap.staff,
    getStaffMember: (id) => (id ? staffById.get(id) : undefined),
    getStaffForService: (serviceId) =>
      (byId.get(serviceId)?.staff ?? []).flatMap((id) =>
        staffById.has(id) ? [staffById.get(id)!] : [],
      ),
    getStaffNames: (serviceId) =>
      (byId.get(serviceId)?.staff ?? [])
        .map((id) => staffById.get(id)?.name ?? id)
        .join(" / "),

    /* the studio */
    // WS-I G-2: derived from who is actually in, not from a posted sign.
    getStudioHours: () => snap.hours,
    getTodayHoursIndex: () => (new Date(`${snap.todayISO}T00:00:00Z`).getUTCDay() + 6) % 7,
    // WS-I G-1: blank, not Selma's. See the header.
    getLocation: (): StudioLocation => ({ ...NO_LOCATION }),

    /* the diary */
    getWeek: () => snap.week.map((d) => new Date(d)),
    getSeedDateISO: () => snap.todayISO,
    getSeedAppointments: () => snap.appointments.map((a) => ({ ...a })),
    getSeedBookings: () => snap.bookings.map((b) => ({ ...b, series: [...b.series] })),
    getSeedWaitlist: () => snap.waitlist.map((w) => ({ ...w })),
    getSeedGiftCards: () => snap.giftCards.map((g) => ({ ...g })),
    getFirstCodeNumber: () => snap.firstCode,

    // WS-I G-4: the ledger is per customer and nothing here knows who is
    // reading. Empty until the claim flow lands.
    getLoyaltyLedger: (): LoyaltyLedgerRow[] => [],
  };
}
