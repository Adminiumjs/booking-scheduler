/**
 * The demo's Lumen Studio: the sample's rows as Adminium would hold them, with
 * every column the customer pages and the desk read. The rows come from the
 * plan's own world (`lumen-sample.json`, what `figures.md` is written from);
 * what no installable sample may bring (Forms' reviews, Offers' cards and
 * packs, the connected calendars) comes from the comp's world (`extras.json`
 * and the sample's `demoOnly`), which is why it exists only here.
 *
 * Days are counted from the anchor, Tuesday 15 September 2026, and every moment
 * is an ISO instant on the studio's clock (10:40 in San Francisco).
 *
 * DEMO BUILD ONLY: nothing in a real build imports it.
 */
import SAMPLE from "../sample/lumen-sample.json";
import type { World, WorldBooking } from "../sample/lumen.ts";
import { addDays, zoneOffsetMs } from "../desk/time.ts";
import type { Id, Row } from "../desk/wire.ts";
import EXTRAS from "./extras.json";

export const WORLD = SAMPLE as unknown as World;

export type Tables = Record<string, Row[]>;

export const DEMO_ZONE = WORLD.anchor.zone;
export const ANCHOR_DAY = WORLD.anchor.iso;

/** How far the studio's zone is from UTC on a day, read once a day: the clocks change at 2 AM, never in opening hours. */
const offsets = new Map<string, number>();
const offsetOn = (day: string): number => {
  let held = offsets.get(day);
  if (held === undefined) {
    held = zoneOffsetMs(DEMO_ZONE, Date.parse(`${day}T19:00:00Z`));
    offsets.set(day, held);
  }
  return held;
};

/** The instant of a wall-clock time on a studio day, as `instantOf` works it out, without a formatter per call. */
export function instantAt(day: string, clock: string): number {
  const [h = 0, m = 0] = clock.split(":").map(Number);
  return Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)), h, m) - offsetOn(day);
}

export const DEMO_START = instantAt(ANCHOR_DAY, WORLD.anchor.time);

/** The people the two personas are (D20). */
export const OWNER = { id: "selma", name: "Selma Okonjo" } as const;
export const AVA = WORLD.customers.find((c) => c.name === "Ava Reyes")!;

export const dayAt = (offset: number): string => addDays(ANCHOR_DAY, offset);
export const moment = (day: number, time: string): string => new Date(instantAt(dayAt(day), time)).toISOString();
const onDay = (iso: string, time: string): string => new Date(instantAt(iso, time)).toISOString();

const minutesOf = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));
const hm = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

const serviceById = new Map(WORLD.services.map((s) => [s.id, s]));
const customerById = new Map(WORLD.customers.map((c) => [c.id, c]));
const customerByName = new Map(WORLD.customers.map((c) => [c.name, c]));

interface ExtraReview {
  booking: string;
  name: string;
  stars: number;
  body: string;
  on: string;
  state: string;
  reply?: string;
  hiddenWhy?: string;
}
interface ExtraCard {
  code: string;
  amount: number;
  by: string;
  to: string;
  sold: string;
  spent: number;
  message: string | null;
}
const REVIEWS = EXTRAS.reviews as ExtraReview[];
const CARDS = EXTRAS.giftCards as ExtraCard[];

/** When a visit's reminder is written, and its review request: 10 AM (D26, A9). */
export const MORNING = "10:00";

// ── bookings ────────────────────────────────────────────────────────────────

const REVIEWED = new Map(REVIEWS.map((r) => [r.booking, r]));

function bookingRow(b: WorldBooking): Row {
  const service = serviceById.get(b.service)!;
  const customer = customerById.get(b.customer)!;
  const proved = b.channel === "desk" || customer.account;
  const startsAt = moment(b.day, b.start);
  const madeAt = moment(b.made.day, b.made.time);
  const end = hm(minutesOf(b.start) + service.minutes);
  const asked = b.deposit ?? 0;
  const review = REVIEWED.get(b.code);
  const row: Row = {
    id: b.number,
    number: b.number,
    code: b.code,
    service_id: b.service,
    team_id: b.team,
    picked_by_anyone: b.by === "anyone",
    customer_id: b.customer,
    proved_by: proved ? "sample" : null,
    customer_proved: proved,
    made_proved: proved ? 1 : 0,
    name: customer.name,
    email: customer.email,
    phone: null,
    language: "en-US",
    note: null,
    staff_note: null,
    no_review_request: false,
    channel: b.channel,
    made_at: madeAt,
    time_set_at: madeAt,
    waitlist_id: null,
    starts_at: startsAt,
    minutes: service.minutes,
    buffer_min: service.buffer,
    free_until: moment(b.day - 1, b.start),
    remind_at: moment(b.day - 1, MORNING),
    review_from: moment(b.day + 1, MORNING),
    link_expires: moment(b.day + 30, b.start),
    revision: 0,
    price: service.price,
    pay_mode: service.online === "deposit" || service.online === "full" ? service.online : "none",
    deposit: service.deposit,
    ask_online: b.deposit !== null,
    deposit_link: false,
    discount: 0,
    asked,
    paid: 0,
    card_paid: 0,
    refunded: 0,
    pay_due: 0,
    net_price: service.price,
    pay_started: false,
    pay_until: null,
    link_until: null,
    offer_until: null,
    lapsed_by: null,
    state: b.state,
    arrived_at: null,
    done_at: null,
    cancelled_at: null,
    cancelled_by: null,
    cancel_reason: null,
    late_cancel: false,
    link_stopped: false,
    google_pressed: b.googlePressed,
    google_pressed_at: b.googlePressed ? moment(b.day + 1, "12:00") : null,
    reviewed_at: review === undefined ? null : onDay(review.on, "12:00"),
  };
  if (b.state === "arrived" || b.state === "done") row["arrived_at"] = startsAt;
  if (b.state === "done") row["done_at"] = moment(b.day, end);
  if (b.state === "paying") {
    // Dana's deposit: on the pay page now, let go at 10:49 unless it lands.
    row["pay_started"] = true;
    row["pay_until"] = moment(0, "10:49");
  }
  if (b.state === "cancelled") {
    row["cancelled_at"] = madeAt;
    row["cancelled_by"] = b.cancelledBy;
    row["cancel_reason"] = b.reason;
    row["late_cancel"] = b.late;
  }
  return row;
}

/** The time the desk offered Dana: the last of Noor's Wednesday a facial still fits, on the grid. */
function offeredStart(w: World["waitlist"][number]): string {
  const service = serviceById.get(w.service)!;
  const person = WORLD.team.find((t) => t.id === w.team)!;
  const hours = person.hours.find((h) => h.weekday === "wed")!;
  const taken = WORLD.bookings
    .filter((b) => b.team === person.id && b.day === w.day && ["paying", "booked", "arrived", "done"].includes(b.state))
    .map((b) => {
      const s = serviceById.get(b.service)!;
      return [minutesOf(b.start), minutesOf(b.start) + s.minutes + s.buffer] as const;
    });
  const breakFrom = hours.breakStart === null ? -1 : minutesOf(hours.breakStart);
  const breakTo = hours.breakEnd === null ? -1 : minutesOf(hours.breakEnd);
  for (let start = minutesOf(hours.closes) - service.minutes; start >= minutesOf(hours.opens); start -= 15) {
    const end = start + service.minutes;
    if (start < breakTo && end > breakFrom) continue;
    if (taken.every(([a, z]) => end + service.buffer <= a || start >= z)) return hm(start);
  }
  throw new Error(`no free time to offer ${w.customer}`);
}

// ── the tables ──────────────────────────────────────────────────────────────

const firstMade = new Map<number, { day: number; time: string }>();
for (const b of WORLD.bookings) {
  const held = firstMade.get(b.customer);
  if (held === undefined || b.made.day < held.day || (b.made.day === held.day && b.made.time < held.time)) firstMade.set(b.customer, b.made);
}

export function sampleTables(): Tables {
  const bookings = WORLD.bookings.map(bookingRow);
  const byCode = new Map(bookings.map((b) => [String(b["code"]), b]));
  let bookingId = Math.max(...bookings.map((b) => Number(b.id)));

  const waitlist: Row[] = WORLD.waitlist.map((w, i) => {
    const c = customerByName.get(w.customer)!;
    return { id: i + 1, customer_id: c.id, name: c.name, email: c.email, language: "en-US", service_id: w.service, team_id: w.team, day: dayAt(w.day), state: w.state, created_at: moment(Math.min(-1, w.day - 3), "12:00") };
  });
  WORLD.waitlist.forEach((w, i) => {
    if (w.state !== "offered") return;
    const c = customerByName.get(w.customer)!;
    const service = serviceById.get(w.service)!;
    const start = offeredStart(w);
    bookingId += 1;
    bookings.push({
      ...bookingRow({ code: "", number: 0, service: w.service, team: w.team!, customer: c.id, day: w.day, start, state: "booked", by: "chose", channel: "desk", made: { day: 0, time: "10:00" }, deposit: null, pay: null, late: false, cancelledBy: null, reason: null, googlePressed: false, review: null }),
      id: bookingId,
      number: null,
      code: null,
      waitlist_id: waitlist[i]!.id,
      proved_by: "sample",
      customer_proved: true,
      made_proved: 1,
      made_at: moment(0, "10:00"),
      state: "offered",
      offer_until: new Date(Date.parse(moment(0, "10:40")) + 20 * 3_600_000).toISOString(),
      pay_mode: service.online === "deposit" || service.online === "full" ? service.online : "none",
    });
  });

  const payments: Row[] = [];
  let paymentId = 0;
  for (const b of WORLD.bookings) {
    if (b.deposit === null || (b.pay !== "paid" && b.pay !== "refunded")) continue;
    paymentId += 1;
    payments.push({
      id: paymentId,
      booking_id: byCode.get(b.code)!.id,
      kind: "taken",
      amount: b.deposit,
      method: "online",
      paid_at: moment(b.made.day, b.made.time),
      payment_ref: `sample_${b.code}`,
      provider: "stripe",
      refunded: b.pay === "refunded" ? b.deposit : 0,
      returned: b.pay === "refunded" ? b.deposit : 0,
      kept: b.pay === "refunded" ? 0 : b.deposit,
      card_part: 0,
    });
  }

  const messages: Row[] = WORLD.bookings
    .filter((b) => b.review !== null && b.review !== "opted-out")
    .map((b, i) => {
      const c = customerById.get(b.customer)!;
      const sent = moment(b.day + 1, MORNING);
      return { id: i + 1, kind: "review_request", status: "sent", to_address: c.email, language: "en-US", booking_id: byCode.get(b.code)!.id, customer_id: c.id, created_at: sent, sent_at: sent, due_at: null };
    });

  const reviews: Row[] = REVIEWS.flatMap((r, i) => {
    const booking = byCode.get(r.booking);
    if (booking === undefined) return [];
    const person = WORLD.team.find((t) => t.id === booking["team_id"]);
    const submitted = onDay(r.on, "12:00");
    return [
      {
        id: i + 1,
        app: "bookings",
        subject_table: "bookings",
        subject_key: String(booking.id),
        about_table: "services",
        about_key: String(booking["service_id"]),
        about_name: serviceById.get(String(booking["service_id"]))?.name ?? "",
        about_detail: person?.name ?? null,
        stars: r.stars,
        title: null,
        body: r.body,
        shown_name: r.name,
        state: r.state,
        hide_reason: r.hiddenWhy ?? null,
        reply: r.reply ?? null,
        replied_at: r.reply === undefined ? null : onDay(r.on, "16:00"),
        submitted_at: submitted,
      },
    ];
  });

  const vouchers: Row[] = WORLD.packSales.map((p, i) => {
    const pack = WORLD.packs.find((x) => x.id === p.pack)!;
    const c = customerByName.get(p.customer)!;
    return {
      id: i + 1,
      worth: "pack",
      public_name: pack.name,
      pack_id: pack.id,
      service_id: pack.service,
      holder_name: c.name,
      holder_email: c.email,
      uses_total: pack.uses,
      uses_taken: p.used,
      uses_left: pack.uses - p.used,
      expires_on: dayAt(p.day + 365),
    };
  });

  const giftCards: Row[] = CARDS.map((g, i) => {
    const to = customerByName.get(g.to);
    const from = customerByName.get(g.by);
    return {
      id: i + 1,
      code: g.code,
      label: `Gift card ···${g.code.slice(-4)}`,
      amount: g.amount,
      balance: g.amount - g.spent,
      recipient_name: g.to,
      recipient_email: to?.email ?? null,
      owner_email: from?.email ?? null,
      message: g.message,
      expires_on: null,
    };
  });

  return {
    settings: [
      {
        id: 1,
        ...WORLD.settings,
        grid_min: 15,
        notice_min: 120,
        window_days: 30,
        cancel_hours: 24,
        hold_min: 15,
        link_hold_hours: 24,
        offer_hours: 24,
        online_booking: true,
        online_payments: "on",
        reviews_on: true,
        review_reminder_days: 4,
        event_detail: "name",
      },
    ],
    opening_hours: WORLD.openingHours.map((h, i) => ({ id: i + 1, weekday: h.weekday, opens: h.opens, closes: h.closes, open: h.open })),
    closures: WORLD.closures.map((c, i) => ({ id: i + 1, team_id: c.team, from_date: dayAt(c.from), to_date: dayAt(c.to), name: c.name, active: true })),
    categories: WORLD.categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon, position: c.position })),
    services: WORLD.services.map((s) => ({
      id: s.id,
      name: s.name,
      category_id: s.category,
      blurb: s.blurb,
      minutes: s.minutes,
      buffer_min: s.buffer,
      price: s.price,
      online: s.online,
      deposit: s.deposit,
      bring: s.bring,
      bookable_online: true,
      anyone_pick: "even",
      active: true,
      position: s.position,
    })),
    team: WORLD.team.map((t) => ({ id: t.id, name: t.name, role_title: t.role, tint: t.tint, active: true, bookable_online: true, position: t.position, email: t.email, user_id: null })),
    team_services: WORLD.team.flatMap((t) => t.does.map((s) => ({ id: `${t.id}:${s}`, team_id: t.id, service_id: s }))),
    team_hours: WORLD.team.flatMap((t) => t.hours.map((h) => ({ id: `${t.id}:${h.weekday}`, team_id: t.id, weekday: h.weekday, opens: h.opens, closes: h.closes, break_start: h.breakStart, break_end: h.breakEnd }))),
    time_off: WORLD.timeOff.map((o, i) => ({ id: i + 1, team_id: o.team, starts_at: moment(o.day, o.from), ends_at: moment(o.day, o.to), why: o.why })),
    calendar_busy: WORLD.demoOnly.busy.map((b, i) => ({ id: i + 1, team_id: b.team, starts_at: moment(b.day, b.from), ends_at: moment(b.day, b.to) })),
    customers: WORLD.customers.map((c) => {
      const first = firstMade.get(c.id);
      return { id: c.id, name: c.name, email: c.email, phone: null, language: "en-US", review_requests: c.reviewRequests, staff_note: null, forgotten_at: null, created_at: first === undefined ? moment(-90, "12:00") : moment(first.day, first.time) };
    }),
    waitlist,
    bookings,
    payments,
    messages,
    gift_amounts: WORLD.giftAmounts.map((a, i) => ({ id: i + 1, amount: a, position: i + 1, active: true })),
    pack_products: WORLD.packs.map((p, i) => ({ id: p.id, name: p.name, price: p.price, uses: p.uses, service_id: p.service, what: "item", valid_days: 365, position: i + 1, active: true })),
    purchases: [],
    reviews,
    vouchers,
    gift_cards: giftCards,
  };
}

/** A booking's code as the sample gives it, by the row's id; null for an offer, which has none yet. */
export const bookingIdOf = (tables: Tables, code: string): Id | null => tables["bookings"]!.find((b) => b["code"] === code)?.id ?? null;
