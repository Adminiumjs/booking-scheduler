/**
 * Lumen Studio's sample: the one source of `seeds/bookings.sample.json`.
 *
 * The world is `lumen-sample.json`, written by the plan's generator with
 * `figures.md`: every figure is read from it, none is typed again. This module
 * only turns its neutral rows (days counted from the anchor Tuesday) into the
 * sample format.
 *
 * Installed on another day, the weekdays hold (`@week`) and a visit's state
 * follows the clock (`@byClock`, read at the visit's middle): past is done, in
 * progress is arrived, ahead is booked. "Today's 12" is exact only at the
 * anchor, Tuesday 15 September 2026, 10:40.
 *
 * A sample row writes what a person typed and the moments a stamp would have
 * written; every copy, total and formula is Adminium's. Not here, because no
 * app's sample may bring them: Forms' reviews, Offers' cards and pack uses, and
 * the calendar states and busy times, which the engine's demo provider seeds
 * (T08, MOD-12). `figures.md` marks each figure "engine" or "demo".
 */
import { readFileSync } from "node:fs";

type Row = Record<string, unknown>;
interface Table {
  ref: string;
  onlyIfEmpty?: true;
  rows: Row[];
}
export interface SampleBundle {
  format: "adminium.sample/1";
  app: "bookings";
  weekAnchor: "tue";
  tables: Table[];
}

interface WorldMoment {
  day: number;
  time: string;
}
export interface WorldBooking {
  code: string;
  number: number;
  service: string;
  team: string;
  customer: number;
  day: number;
  start: string;
  state: "paying" | "booked" | "arrived" | "done" | "no_show" | "cancelled";
  by: "chose" | "anyone";
  channel: "page" | "embed" | "desk";
  made: WorldMoment;
  deposit: number | null;
  pay: "paid" | "paying" | "refunded" | null;
  late: boolean;
  cancelledBy: "customer" | "studio" | null;
  reason: string | null;
  googlePressed: boolean;
  review: string | null;
}
export interface World {
  anchor: { iso: string; time: string; weekday: string; zone: string };
  settings: Row;
  openingHours: { weekday: string; opens: string; closes: string; open: boolean }[];
  closures: { team: string | null; from: number; to: number; name: string }[];
  categories: { id: string; name: string; icon: string; position: number }[];
  services: { id: string; name: string; category: string; blurb: string; minutes: number; buffer: number; price: number; online: string; deposit: number | null; bring: string | null; position: number }[];
  team: { id: string; name: string; role: string; tint: string; position: number; email: string; does: string[]; hours: { weekday: string; opens: string; closes: string; breakStart: string | null; breakEnd: string | null }[] }[];
  timeOff: { team: string; day: number; from: string; to: string; why: string }[];
  customers: { id: number; name: string; email: string; account: boolean; reviewRequests: boolean }[];
  bookings: WorldBooking[];
  giftAmounts: number[];
  packs: { id: string; name: string; service: string; uses: number; price: number }[];
  giftSales: { code: string; amount: number; from: string; to: string; day: number; message: string | null }[];
  packSales: { pack: string; customer: string; day: number; used: number }[];
  waitlist: { customer: string; service: string; team: string | null; day: number; state: "waiting" | "offered" }[];
  demoOnly: { calendars: Record<string, unknown>; busy: { team: string; day: number; from: string; to: string }[]; clash: string };
}

export const WORLD = JSON.parse(readFileSync(new URL("./lumen-sample.json", import.meta.url), "utf8")) as World;

// ── moments ─────────────────────────────────────────────────────────────────

const minutesOf = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));
const hm = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
const ANCHOR_MINUTES = minutesOf(WORLD.anchor.time);

const week = (day: number): Row => ({ "@day": day, "@week": true });
const at = (day: number, time: string): Row => ({ "@day": day, "@time": time, "@week": true });
const span = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h > 0 ? `${String(h)}H` : ""}${m > 0 || h === 0 ? `${String(m)}M` : ""}`;
};
/** A moment that has passed: on its weekday when it is old enough, counted back from the adding moment when it is recent. */
const passed = ({ day, time }: WorldMoment): Row => {
  if (day <= -4) return at(day, time);
  if (day < 0) return { "@day": day, "@time": time };
  return { "@ago": span(Math.max(0, ANCHOR_MINUTES - minutesOf(time))) };
};

const ref = (label: string) => ({ "@ref": label });
const serviceById = new Map(WORLD.services.map((s) => [s.id, s]));
const customerById = new Map(WORLD.customers.map((c) => [c.id, c]));
const customerByName = new Map(WORLD.customers.map((c) => [c.name, c]));
const customerLabel = (id: number) => `customer:${String(id)}`;

/** The time a visit's middle falls at: where `@byClock` reads whether it is over, in progress or ahead. */
const middle = (b: WorldBooking) => hm(minutesOf(b.start) + Math.floor(serviceById.get(b.service)!.minutes / 2));

// ── a booking ───────────────────────────────────────────────────────────────

function stateOf(b: WorldBooking): Row {
  const service = serviceById.get(b.service)!;
  const end = hm(minutesOf(b.start) + service.minutes);
  const started = { arrived_at: at(b.day, b.start) };
  const over = { state: "done", ...started, done_at: at(b.day, end) };
  switch (b.state) {
    case "booked":
    case "arrived":
    case "done":
      return { "@byClock": { at: at(b.day, middle(b)), before: over, around: { state: "arrived", ...started }, after: { state: "booked" } } };
    case "no_show":
      return { "@byClock": { at: at(b.day, middle(b)), before: { state: "no_show" }, around: { state: "booked" }, after: { state: "booked" } } };
    case "paying":
      // Dana's deposit: on the pay page now, let go at 10:49 unless it lands.
      return { state: "paying", pay_started: true, pay_until: { "@in": "PT9M" } };
    case "cancelled":
      return {
        state: "cancelled",
        cancelled_at: passed(b.made),
        cancelled_by: b.cancelledBy,
        ...(b.reason === null ? {} : { cancel_reason: b.reason }),
        ...(b.late ? { late_cancel: true } : {}),
      };
  }
}

function bookingRow(b: WorldBooking): Row {
  const customer = customerById.get(b.customer)!;
  return {
    "@label": `booking:${b.code}`,
    // Its own number: Adminium moves the series past the sample's, so the next real code is the next one.
    number: b.number,
    code: b.code,
    service_id: ref(`service:${b.service}`),
    team_id: ref(`team:${b.team}`),
    picked_by_anyone: b.by === "anyone",
    customer_id: ref(customerLabel(b.customer)),
    name: customer.name,
    email: customer.email,
    language: "en-US",
    channel: b.channel,
    made_at: b.state === "paying" ? { "@ago": "PT6M" } : passed(b.made),
    starts_at: at(b.day, b.start),
    ask_online: b.deposit !== null,
    google_pressed: b.googlePressed,
    ...stateOf(b),
  };
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

// ── the bundle ──────────────────────────────────────────────────────────────

export function sampleBundle(): SampleBundle {
  const waitLabel = (i: number) => `wait:${String(i)}`;
  const offered: Row[] = WORLD.waitlist.flatMap((w, i) => {
    if (w.state !== "offered") return [];
    const c = customerByName.get(w.customer)!;
    return [
      {
        // No code: an offer is a booking only once it is taken, so the next real code stays LMN-1900.
        "@label": `offer:${String(i)}`,
        number: null,
        service_id: ref(`service:${w.service}`),
        team_id: w.team === null ? null : ref(`team:${w.team}`),
        customer_id: ref(customerLabel(c.id)),
        waitlist_id: ref(waitLabel(i)),
        name: c.name,
        email: c.email,
        language: "en-US",
        channel: "desk",
        made_at: { "@ago": "PT40M" },
        starts_at: at(w.day, offeredStart(w)),
        state: "offered",
        offer_until: { "@in": "PT20H" },
      },
    ];
  });

  const giftBuyers = WORLD.giftSales.map((g, i) => ({ g, label: `purchase:gift:${String(i)}`, buyer: customerByName.get(g.from)! }));
  const packBuyers = WORLD.packSales.map((p, i) => ({ p, label: `purchase:pack:${String(i)}`, buyer: customerByName.get(p.customer)!, pack: WORLD.packs.find((x) => x.id === p.pack)! }));
  const when = (day: number) => passed({ day, time: "12:00" });

  return {
    format: "adminium.sample/1",
    app: "bookings",
    weekAnchor: "tue",
    tables: [
      // The operator's own settings stay: only what is still empty is filled. Their payment switch is theirs.
      { ref: "settings", rows: [{ "@onlyIfEmpty": true, "@fillEmpty": true, ...WORLD.settings }] },
      { ref: "opening_hours", onlyIfEmpty: true, rows: WORLD.openingHours.map((h) => ({ weekday: h.weekday, opens: h.opens, closes: h.closes, open: h.open })) },
      { ref: "categories", rows: WORLD.categories.map((c) => ({ "@label": `category:${c.id}`, name: c.name, icon: c.icon, position: c.position })) },
      {
        ref: "services",
        rows: WORLD.services.map((s) => ({
          "@label": `service:${s.id}`,
          name: s.name,
          category_id: ref(`category:${s.category}`),
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
      },
      { ref: "team", rows: WORLD.team.map((t) => ({ "@label": `team:${t.id}`, name: t.name, role_title: t.role, tint: t.tint, active: true, bookable_online: true, position: t.position, email: t.email })) },
      { ref: "team_services", rows: WORLD.team.flatMap((t) => t.does.map((s) => ({ team_id: ref(`team:${t.id}`), service_id: ref(`service:${s}`) }))) },
      {
        ref: "team_hours",
        rows: WORLD.team.flatMap((t) =>
          t.hours.map((h) => ({ team_id: ref(`team:${t.id}`), weekday: h.weekday, opens: h.opens, closes: h.closes, break_start: h.breakStart, break_end: h.breakEnd })),
        ),
      },
      {
        ref: "closures",
        rows: WORLD.closures.map((c) => ({ team_id: c.team === null ? null : ref(`team:${c.team}`), from_date: week(c.from), to_date: week(c.to), name: c.name, active: true })),
      },
      { ref: "time_off", rows: WORLD.timeOff.map((o) => ({ team_id: ref(`team:${o.team}`), starts_at: at(o.day, o.from), ends_at: at(o.day, o.to), why: o.why })) },
      {
        ref: "customers",
        rows: WORLD.customers.map((c) => ({ "@label": customerLabel(c.id), name: c.name, email: c.email, language: "en-US", review_requests: c.reviewRequests })),
      },
      {
        ref: "waitlist",
        rows: WORLD.waitlist.map((w, i) => {
          const c = customerByName.get(w.customer)!;
          return {
            "@label": waitLabel(i),
            customer_id: ref(customerLabel(c.id)),
            name: c.name,
            email: c.email,
            language: "en-US",
            service_id: ref(`service:${w.service}`),
            team_id: w.team === null ? null : ref(`team:${w.team}`),
            day: week(w.day),
            state: w.state,
          };
        }),
      },
      { ref: "bookings", rows: [...WORLD.bookings.map(bookingRow), ...offered] },
      { ref: "gift_amounts", rows: WORLD.giftAmounts.map((a, i) => ({ "@label": `gift:${String(a)}`, amount: a, position: i + 1, active: true })) },
      {
        ref: "pack_products",
        rows: WORLD.packs.map((p, i) => ({ "@label": `pack:${p.id}`, name: p.name, price: p.price, uses: p.uses, service_id: ref(`service:${p.service}`), what: "item", position: i + 1, active: true })),
      },
      {
        ref: "purchases",
        rows: [
          ...giftBuyers.map(({ g, label, buyer }) => ({ "@label": label, number: null, code: g.code, buyer_name: buyer.name, buyer_email: buyer.email, customer_id: ref(customerLabel(buyer.id)), language: "en-US", state: "paid", made_at: when(g.day) })),
          ...packBuyers.map(({ label, buyer, p }, i) => ({ "@label": label, number: null, code: `LPK-${String(4200 + i)}`, buyer_name: buyer.name, buyer_email: buyer.email, customer_id: ref(customerLabel(buyer.id)), language: "en-US", state: "paid", made_at: when(p.day) })),
        ],
      },
      {
        ref: "purchase_lines",
        rows: [
          ...giftBuyers.map(({ g, label }) => ({ purchase_id: ref(label), kind: "card", gift_amount_id: ref(`gift:${String(g.amount)}`), to_name: g.to, message: g.message })),
          ...packBuyers.map(({ label, pack }) => ({ purchase_id: ref(label), kind: "pack", pack_id: ref(`pack:${pack.id}`) })),
        ],
      },
      {
        ref: "payments",
        rows: [
          ...WORLD.bookings
            .filter((b) => b.deposit !== null && (b.pay === "paid" || b.pay === "refunded"))
            .map((b) => ({
              booking_id: ref(`booking:${b.code}`),
              kind: "taken",
              amount: b.deposit,
              method: "online",
              paid_at: passed(b.made),
              payment_ref: `sample_${b.code}`,
              provider: "stripe",
              refunded: b.pay === "refunded" ? b.deposit : 0,
            })),
          ...giftBuyers.map(({ g, label }) => ({ purchase_id: ref(label), kind: "taken", amount: g.amount, method: "online", paid_at: when(g.day), payment_ref: `sample_${g.code}`, provider: "stripe", refunded: 0 })),
          ...packBuyers.map(({ label, pack, p }, i) => ({ purchase_id: ref(label), kind: "taken", amount: pack.price, method: "online", paid_at: when(p.day), payment_ref: `sample_pack_${String(i)}`, provider: "stripe", refunded: 0 })),
        ],
      },
    ],
  };
}
