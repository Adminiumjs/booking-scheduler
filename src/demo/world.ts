/**
 * The demo's Adminium for Lumen Studio, in the page: the sample's rows, a clock
 * that stands on Tuesday 15 September 2026 at 10:40 in San Francisco until the
 * demo card moves it, and the rules the real server applies, worked here so
 * that a time the demo offers is a time the sample has free (`figures.md`
 * holds it to the plan's own figures). The guest's door (`guest.ts`) and the
 * desk's (`desk.ts`) read and write this one world, so a visit booked on one
 * side is on the other the moment it is made.
 *
 * MOVING THE CLOCK MOVES THE DATA (L4-F6). Everything that fell due on the way
 * runs: a deposit past its hold is let go and its time is free again, an offer
 * past its time lapses, the day-before reminders and the morning-after review
 * requests go out, and a day that has ended is closed: its visits are done.
 * The studio's staff would have marked them so; the sample never asks anyone
 * to do it by hand.
 *
 * DEMO BUILD ONLY: nothing in a real build imports it.
 */
import type { BusyBlock, CalendarAccount, CalendarSyncState, Clash, DayCount, PersonCalendar, Slot } from "../desk/door.ts";
import { addDays, weekdayOf } from "../desk/time.ts";
import { same, type Id, type Row } from "../desk/wire.ts";
import { DEMO_START, DEMO_ZONE, instantAt, moment, MORNING, sampleTables, WORLD, type Tables } from "./sample.ts";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** A refusal the world makes, as Adminium would: each door says it in its own error. */
export class DemoRefusal extends Error {
  readonly status: number;
  readonly code: string;
  readonly params: Record<string, unknown>;
  constructor(status: number, code: string, message: string, params: Record<string, unknown> = {}) {
    super(message);
    this.name = "DemoRefusal";
    this.status = status;
    this.code = code;
    this.params = params;
  }
}

/** The add-ons Lumen's demo runs with: what its install ticks. */
export const DEMO_ADD_ONS = ["forms", "offers", "google-reviews", "calendar-google", "calendar-microsoft"] as const;

/** What holds a person's time. A no-show frees it (cQ5); an offer holds nothing until it is taken. */
const HOLDS = new Set(["paying", "booked", "arrived", "done"]);

/** Where a booking may go from each state, as its table's `states` say. */
export const BOOKING_MOVES: Readonly<Record<string, readonly string[]>> = {
  offered: ["booked", "paying", "lapsed"],
  paying: ["booked", "lapsed"],
  booked: ["arrived", "no_show", "cancelled"],
  arrived: ["done", "booked"],
  done: ["arrived"],
  no_show: ["booked"],
};

export type PayWord = "open" | "confirming" | "failed" | "paid";
export type DoorWord = "studio" | "money" | "off" | "desk";

const n = (value: unknown): number => {
  const parsed = Number(value);
  return value === null || value === undefined || value === "" || Number.isNaN(parsed) ? 0 : parsed;
};
const minutesOf = (hm: unknown): number => {
  const [h = 0, m = 0] = String(hm).split(":").map(Number);
  return h * 60 + m;
};
const clockOf = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

interface Local {
  day: string;
  minute: number;
}

export interface NewVisit {
  service: Id;
  /** Null means Anyone: the world picks by the service's rule. */
  person: Id | null;
  startsAt: string;
  name: string;
  email: string;
  phone?: string | null;
  note?: string | null;
  language?: string | null;
  channel: "page" | "embed" | "desk";
  door: DoorWord;
  noReview?: boolean;
  depositLink?: boolean;
  customerId?: Id | null;
  /** Made signed in, or at the desk. */
  proved: boolean;
  /** Offers' pack, by its id: it covers the visit. */
  pack?: Id | null;
  /** Offers' gift card, by its id: it pays what is asked online, as far as it goes. */
  card?: Id | null;
  key?: string;
}

export class LumenWorld {
  now: number;
  readonly zone = DEMO_ZONE;
  readonly currency = "USD";
  readonly tables: Tables;
  readonly addOns: Set<string> = new Set(DEMO_ADD_ONS);
  /** How each visit's online payment stands, by booking id. */
  readonly payStates = new Map<string, PayWord>();
  /** How each sale's stands, by purchase id. */
  readonly saleStates = new Map<string, PayWord>();
  /** The last code "e-mailed" to an address: the demo has no post office, so the card types it. */
  readonly codes = new Map<string, string>();
  readonly calendars = new Map<string, PersonCalendar>();
  clashes: Clash[] = [];
  private readonly listeners = new Set<() => void>();
  private readonly keys = new Map<string, Id>();
  private readonly format = new Intl.DateTimeFormat("en-CA", { timeZone: DEMO_ZONE, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  private readonly locals = new Map<number, Local>();
  private holdsByDay: Map<string, Row[]> | null = null;
  private serial = 0;

  constructor(start = DEMO_START) {
    this.now = start;
    this.tables = sampleTables();
    this.startCalendars();
    this.derive();
  }

  // ── reading ───────────────────────────────────────────────────────────────

  all(table: string): Row[] {
    return (this.tables[table] ??= []);
  }

  get(table: string, id: unknown): Row | undefined {
    return this.all(table).find((row) => same(row.id, id));
  }

  settings(): Row {
    return this.all("settings")[0]!;
  }

  setting(column: string): number {
    return n(this.settings()[column]);
  }

  booking(id: unknown): Row {
    const row = this.get("bookings", id);
    if (row === undefined) throw new DemoRefusal(404, "NOT_FOUND", "No such booking.");
    return row;
  }

  byCode(code: string): Row | undefined {
    return this.all("bookings").find((b) => b["code"] === code);
  }

  customerByEmail(email: string): Row | undefined {
    const wanted = email.trim().toLowerCase();
    return this.all("customers").find((c) => String(c["email"] ?? "").toLowerCase() === wanted && c["forgotten_at"] === null);
  }

  /** An instant's day and minute on the studio's clock. */
  local(instant: number | string): Local {
    const at = typeof instant === "number" ? instant : Date.parse(instant);
    const held = this.locals.get(at);
    if (held !== undefined) return held;
    const parts = this.format.formatToParts(new Date(at));
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
    const value = { day: `${get("year")}-${get("month")}-${get("day")}`, minute: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
    this.locals.set(at, value);
    return value;
  }

  today(): string {
    return this.local(this.now).day;
  }

  nowIso(): string {
    return new Date(this.now).toISOString();
  }

  // ── writing ───────────────────────────────────────────────────────────────

  insert(table: string, values: Record<string, unknown>): Row {
    const ids = this.all(table).map((r) => Number(r.id)).filter((id) => Number.isFinite(id));
    const row = { ...values, id: values["id"] ?? Math.max(0, ...ids) + 1 } as Row;
    this.all(table).push(row);
    return row;
  }

  update(table: string, id: unknown, values: Record<string, unknown>): Row {
    const row = this.get(table, id);
    if (row === undefined) throw new DemoRefusal(404, "NOT_FOUND", `No such ${table} row.`);
    Object.assign(row, values);
    return row;
  }

  remove(table: string, id: unknown): void {
    this.tables[table] = this.all(table).filter((r) => !same(r.id, id));
  }

  /** After a write: every worked-out figure again, then whoever is watching. */
  changed(): void {
    this.derive();
    for (const listener of this.listeners) listener();
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }

  /** A code nobody else has: counted, never drawn at random. */
  code(prefix: string): string {
    this.serial += 1;
    return `${prefix}${String(this.serial).padStart(8, "0")}`;
  }

  /** The figures Adminium works out on a booking: what was paid, what is still due. */
  private derive(): void {
    this.holdsByDay = null;
    const payments = new Map<string, Row[]>();
    for (const p of this.all("payments")) {
      if (p["booking_id"] === null || p["booking_id"] === undefined) continue;
      const key = String(p["booking_id"]);
      payments.set(key, [...(payments.get(key) ?? []), p]);
    }
    for (const b of this.all("bookings")) {
      const own = payments.get(String(b.id)) ?? [];
      const paid = own.reduce((sum, p) => sum + n(p["kept"]), 0);
      const discount = n(b["discount"]);
      const whole = b["pay_mode"] === "full" ? n(b["price"]) : b["pay_mode"] === "deposit" ? n(b["deposit"]) : 0;
      const asked = b["ask_online"] === true ? Math.max(0, whole - discount) : 0;
      b["paid"] = paid;
      b["refunded"] = own.reduce((sum, p) => sum + n(p["returned"]), 0);
      b["card_paid"] = own.reduce((sum, p) => sum + n(p["card_part"]), 0);
      b["net_price"] = Math.max(0, n(b["price"]) - discount);
      b["asked"] = asked;
      b["pay_due"] = Math.max(0, asked - paid);
    }
  }

  // ── the studio's days ─────────────────────────────────────────────────────

  private opening(day: string): { opens: number; closes: number } | null {
    const row = this.all("opening_hours").find((h) => h["weekday"] === weekdayOf(day));
    if (row === undefined || row["open"] === false) return null;
    const closed = this.all("closures").some((c) => c["active"] !== false && (c["team_id"] === null || c["team_id"] === undefined) && day >= String(c["from_date"]) && day <= String(c["to_date"]));
    return closed ? null : { opens: minutesOf(row["opens"]), closes: minutesOf(row["closes"]) };
  }

  studioOpen(day: string): boolean {
    return this.opening(day) !== null;
  }

  /** A person's working day, inside the studio's; null when they do not work it. */
  private personDay(team: unknown, day: string): { opens: number; closes: number; breakStart: number | null; breakEnd: number | null } | null {
    const studio = this.opening(day);
    if (studio === null) return null;
    if (this.all("closures").some((c) => c["active"] !== false && same(c["team_id"], team) && day >= String(c["from_date"]) && day <= String(c["to_date"]))) return null;
    const hours = this.all("team_hours").find((h) => same(h["team_id"], team) && h["weekday"] === weekdayOf(day));
    if (hours === undefined) return null;
    const opens = Math.max(minutesOf(hours["opens"]), studio.opens);
    const closes = Math.min(minutesOf(hours["closes"]), studio.closes);
    if (opens >= closes) return null;
    return { opens, closes, breakStart: hours["break_start"] ? minutesOf(hours["break_start"]) : null, breakEnd: hours["break_end"] ? minutesOf(hours["break_end"]) : null };
  }

  /** The guests' last bookable day: `window_days` working days, today being day 1 (cT15). */
  lastBookable(): string {
    const window = this.setting("window_days");
    let day = this.today();
    let counted = 0;
    for (let guard = 0; guard < 800; guard += 1) {
      if (this.studioOpen(day)) {
        counted += 1;
        if (counted >= window) return day;
      }
      day = addDays(day, 1);
    }
    return day;
  }

  // ── free times ────────────────────────────────────────────────────────────

  private holdsOn(day: string): Row[] {
    if (this.holdsByDay === null) {
      this.holdsByDay = new Map();
      for (const b of this.all("bookings")) {
        if (!HOLDS.has(String(b["state"]))) continue;
        const key = this.local(String(b["starts_at"])).day;
        this.holdsByDay.set(key, [...(this.holdsByDay.get(key) ?? []), b]);
      }
    }
    return this.holdsByDay.get(day) ?? [];
  }

  /** Who may be booked for a service, in the team's order. */
  private doers(service: unknown, guest: boolean): Row[] {
    const links = this.all("team_services").filter((l) => same(l["service_id"], service));
    return this.all("team")
      .filter((p) => p["active"] !== false && (!guest || p["bookable_online"] !== false) && links.some((l) => same(l["team_id"], p.id)))
      .sort((a, b) => n(a["position"]) - n(b["position"]));
  }

  /** The busy spans of a person's day, in minutes: their bookings with clear-up, time off and calendar. */
  private blocks(team: unknown, day: string, exclude: unknown): [number, number][] {
    const out: [number, number][] = [];
    for (const b of this.holdsOn(day)) {
      if (!same(b["team_id"], team) || same(b.id, exclude)) continue;
      const start = this.local(String(b["starts_at"])).minute;
      out.push([start, start + n(b["minutes"]) + n(b["buffer_min"])]);
    }
    for (const table of ["time_off", "calendar_busy"]) {
      for (const row of this.all(table)) {
        if (!same(row["team_id"], team)) continue;
        const from = this.local(String(row["starts_at"]));
        if (from.day !== day) continue;
        out.push([from.minute, this.local(String(row["ends_at"])).minute]);
      }
    }
    return out;
  }

  /** Whether a person can take this service at this minute of this day, by the guest's rule or the staff's. */
  fits(team: unknown, service: Row, day: string, start: number, options: { guest: boolean; exclude?: unknown }): boolean {
    const studio = this.opening(day);
    const hours = this.personDay(team, day);
    if (studio === null || hours === null) return false;
    if (!this.doers(service.id, options.guest).some((p) => same(p.id, team))) return false;
    const end = start + n(service["minutes"]);
    if ((start - studio.opens) % this.setting("grid_min") !== 0) return false;
    if (start < hours.opens || end > hours.closes) return false;
    if (hours.breakStart !== null && hours.breakEnd !== null && start < hours.breakEnd && end > hours.breakStart) return false;
    const instant = instantAt(day, clockOf(start));
    if (instant < this.now) return false;
    if (options.guest) {
      if (instant < this.now + this.setting("notice_min") * MINUTE) return false;
      if (day > this.lastBookable()) return false;
    }
    const spanEnd = end + n(service["buffer_min"]);
    return this.blocks(team, day, options.exclude).every(([a, z]) => start >= z || a >= spanEnd);
  }

  /** Whom "Anyone" gets: the fewest visits that day, then whoever was booked longest ago, then the team's order. */
  pickAnyone(service: Row, day: string, start: number, options: { guest: boolean; exclude?: unknown }): Row | null {
    const free = this.doers(service.id, options.guest).filter((p) => this.fits(p.id, service, day, start, options));
    if (free.length === 0) return null;
    const rank = (p: Row) => {
      const onDay = this.holdsOn(day).filter((b) => same(b["team_id"], p.id)).length;
      const last = Math.max(0, ...this.all("bookings").filter((b) => same(b["team_id"], p.id) && HOLDS.has(String(b["state"]))).map((b) => Date.parse(String(b["made_at"]))));
      return [onDay, last, n(p["position"])] as const;
    };
    return [...free].sort((a, b) => {
      const [x, y] = [rank(a), rank(b)];
      return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
    })[0]!;
  }

  /** One day's times: free or full, each with who would take it. */
  slots(serviceId: unknown, who: unknown, day: string, options: { guest: boolean; exclude?: unknown }): Slot[] {
    const service = this.get("services", serviceId);
    const studio = this.opening(day);
    if (service === undefined || studio === null) return [];
    const out: Slot[] = [];
    for (let start = studio.opens; start < studio.closes; start += this.setting("grid_min")) {
      const taker = who === null || who === undefined ? this.pickAnyone(service, day, start, options) : this.fits(who, service, day, start, options) ? this.get("team", who) ?? null : null;
      out.push(taker === null ? { time: clockOf(start), state: "full" } : { time: clockOf(start), state: "free", resource: taker.id });
    }
    return out;
  }

  /** A strip of days: how many times each has free. */
  strip(serviceId: unknown, who: unknown, from: string, days: number, options: { guest: boolean; exclude?: unknown }): DayCount[] {
    const last = options.guest ? this.lastBookable() : null;
    const out: DayCount[] = [];
    for (let i = 0; i < days; i += 1) {
      const date = addDays(from, i);
      if (last !== null && date > last) break;
      const closed = !this.studioOpen(date) || (who !== null && who !== undefined && this.personDay(who, date) === null);
      const open = closed ? 0 : this.slots(serviceId, who, date, options).filter((s) => s.state === "free").length;
      out.push({ date, open, state: closed ? "closed" : open > 0 ? "open" : "full", ...(date === last ? { lastBookable: true as const } : {}) });
    }
    return out;
  }

  // ── making a visit ────────────────────────────────────────────────────────

  /** A visit, judged again as it is saved: a time someone took meanwhile is refused. */
  makeVisit(input: NewVisit): Row {
    if (input.key !== undefined) {
      const again = this.keys.get(input.key);
      if (again !== undefined) return this.booking(again);
    }
    const service = this.get("services", input.service);
    if (service === undefined) throw new DemoRefusal(400, "PUBLIC_WRITE_REFUSED", "No such service.", { reason: "not-offered" });
    const guest = input.door !== "desk";
    const { day, minute } = this.local(input.startsAt);
    const person = input.person === null ? this.pickAnyone(service, day, minute, { guest }) : this.fits(input.person, service, day, minute, { guest }) ? (this.get("team", input.person) ?? null) : null;
    if (person === null) throw new DemoRefusal(409, "PUBLIC_SLOT_FULL", "That time was just taken.", { reason: "taken" });
    if (guest) {
      const wanted = input.email.trim().toLowerCase();
      const ahead = this.all("bookings").filter((b) => String(b["email"] ?? "").toLowerCase() === wanted && (b["state"] === "booked" || b["state"] === "paying") && b["from_card"] !== true && Date.parse(String(b["starts_at"])) > this.now);
      if (ahead.length >= 3) throw new DemoRefusal(429, "PUBLIC_LIMIT_REACHED", "Three visits ahead already.");
    }
    const customer = input.customerId !== undefined && input.customerId !== null ? this.get("customers", input.customerId) : (this.customerByEmail(input.email) ?? this.insert("customers", { name: input.name, email: input.email.trim(), phone: input.phone ?? null, language: input.language ?? "en-US", review_requests: input.noReview !== true, staff_note: null, forgotten_at: null, created_at: this.nowIso() }));
    if (input.noReview === true && customer !== undefined) customer["review_requests"] = false;
    const number = Math.max(0, ...this.all("bookings").map((b) => n(b["number"]))) + 1;
    const offersMoney = service["online"] === "deposit" || service["online"] === "full";
    const askOnline = input.door === "money" || input.depositLink === true;
    const startsAt = Date.parse(input.startsAt);
    const row = this.insert("bookings", {
      number,
      code: `${String(this.settings()["code_prefix"] ?? "")}${String(number)}`,
      service_id: service.id,
      team_id: person.id,
      picked_by_anyone: input.person === null,
      customer_id: customer?.id ?? null,
      proved_by: input.proved ? "desk" : null,
      customer_proved: input.proved,
      made_proved: input.proved ? 1 : 0,
      name: input.name,
      email: input.email.trim(),
      phone: input.phone ?? null,
      language: input.language ?? "en-US",
      note: input.note ?? null,
      staff_note: null,
      no_review_request: input.noReview === true,
      channel: input.channel,
      made_at: this.nowIso(),
      time_set_at: this.nowIso(),
      waitlist_id: null,
      starts_at: new Date(startsAt).toISOString(),
      minutes: n(service["minutes"]),
      buffer_min: n(service["buffer_min"]),
      free_until: new Date(startsAt - this.setting("cancel_hours") * HOUR).toISOString(),
      remind_at: moment(this.dayOffset(day) - 1, MORNING),
      review_from: moment(this.dayOffset(day) + 1, MORNING),
      link_expires: new Date(startsAt + 30 * 24 * HOUR).toISOString(),
      revision: 0,
      price: n(service["price"]),
      pay_mode: offersMoney ? service["online"] : "none",
      deposit: service["deposit"] ?? null,
      ask_online: askOnline && offersMoney,
      deposit_link: input.depositLink === true,
      discount: 0,
      asked: 0,
      paid: 0,
      card_paid: 0,
      refunded: 0,
      pay_due: 0,
      net_price: n(service["price"]),
      pay_started: false,
      pay_until: null,
      link_until: null,
      offer_until: null,
      lapsed_by: null,
      state: "booked",
      arrived_at: null,
      done_at: null,
      cancelled_at: null,
      cancelled_by: null,
      cancel_reason: null,
      late_cancel: false,
      link_stopped: false,
      google_pressed: false,
      google_pressed_at: null,
      reviewed_at: null,
    });
    if (input.key !== undefined) this.keys.set(input.key, row.id);
    if (input.pack !== null && input.pack !== undefined) this.usePack(row, input.pack);
    if (input.card !== null && input.card !== undefined) this.useCard(row, input.card);
    this.derive();
    if (n(row["pay_due"]) > 0) {
      row["state"] = "paying";
      row["link_until"] = new Date(Math.min(startsAt, this.now + this.setting("link_hold_hours") * HOUR)).toISOString();
      this.payStates.set(String(row.id), "open");
      if (input.depositLink === true) this.mail("deposit_link", row);
    } else {
      this.mail(n(row["paid"]) > 0 ? "deposit_receipt" : "booked", row);
    }
    this.changed();
    return row;
  }

  private dayOffset(day: string): number {
    return Math.round((Date.parse(`${day}T12:00:00Z`) - Date.parse(`${WORLD.anchor.iso}T12:00:00Z`)) / (24 * HOUR));
  }

  private usePack(row: Row, packId: Id): void {
    const pack = this.get("vouchers", packId);
    if (pack === undefined || n(pack["uses_left"]) <= 0) return;
    pack["uses_left"] = n(pack["uses_left"]) - 1;
    pack["uses_taken"] = n(pack["uses_taken"]) + 1;
    row["discount"] = n(row["price"]);
    row["pack_id"] = pack.id;
  }

  private useCard(row: Row, cardId: Id): void {
    const card = this.get("gift_cards", cardId);
    const whole = row["pay_mode"] === "full" ? n(row["price"]) : n(row["deposit"]);
    const amount = Math.min(n(card?.["balance"]), Math.max(0, whole - n(row["discount"])));
    if (card === undefined || amount <= 0) return;
    card["balance"] = n(card["balance"]) - amount;
    this.insert("payments", { booking_id: row.id, kind: "taken", amount, method: "gift_card", paid_at: this.nowIso(), provider: null, payment_ref: this.code("card_"), refunded: 0, returned: 0, kept: amount, card_part: amount, card_id: card.id });
  }

  /** An e-mail the outbox sent: the demo sends nothing, and writes down what Adminium would have sent. */
  mail(kind: string, booking: Row, at: string = this.nowIso()): void {
    if (!booking["email"]) return;
    this.insert("messages", { kind, status: "sent", to_address: booking["email"], language: booking["language"] ?? "en-US", booking_id: booking.id, customer_id: booking["customer_id"] ?? null, created_at: at, sent_at: at, due_at: null });
  }

  private mailed(kind: string, bookingId: Id): boolean {
    return this.all("messages").some((m) => m["kind"] === kind && same(m["booking_id"], bookingId));
  }

  // ── a booking along its states ────────────────────────────────────────────

  /** A move from the state the screen saw, as the table allows, with the stamps and the money it makes. */
  moveVisit(id: unknown, from: string | null, to: string, values: Record<string, unknown> = {}): Row {
    const row = this.booking(id);
    const state = String(row["state"]);
    const refuse = (why: string) => new DemoRefusal(409, "STATE_MOVE_REFUSED", why, { from: state, to });
    if (from !== null && state !== from) throw refuse("It moved on.");
    if (!(BOOKING_MOVES[state] ?? []).includes(to)) throw refuse("Not a move a booking makes.");
    if (to === "booked" && state === "paying" && n(row["pay_due"]) > 0) throw refuse("Not paid yet.");
    Object.assign(row, values, { state: to });
    const stamp = this.nowIso();
    if (to === "arrived") Object.assign(row, { arrived_at: stamp, done_at: null });
    if (to === "done") row["done_at"] = stamp;
    if (to === "booked" && (state === "arrived" || state === "no_show")) Object.assign(row, { arrived_at: null });
    if (to === "lapsed") {
      row["lapsed_by"] = values["lapsed_by"] ?? "time";
      this.payStates.delete(String(row.id));
      if (state === "paying") this.mail("let_go", row);
      this.backToList(row);
    }
    if (to === "cancelled") this.cancelMoney(row, stamp);
    if (to === "booked" && state === "paying") this.mail("deposit_receipt", row);
    if (to === "booked" && state === "offered") {
      row["code"] ??= this.nextCode(row);
      this.mail("booked", row);
    }
    this.changed();
    return row;
  }

  private nextCode(row: Row): string {
    const number = Math.max(0, ...this.all("bookings").map((b) => n(b["number"]))) + 1;
    row["number"] = number;
    return `${String(this.settings()["code_prefix"] ?? "")}${String(number)}`;
  }

  /** A cancel's money: in time, or by the studio, it goes back the way it came; inside the window it is kept. */
  private cancelMoney(row: Row, stamp: string): void {
    const byStudio = row["cancelled_by"] === "studio";
    const late = !byStudio && Date.parse(String(row["free_until"])) <= this.now;
    Object.assign(row, { cancelled_at: stamp, late_cancel: late, cancelled_by: row["cancelled_by"] ?? "customer" });
    if (!late) {
      for (const p of this.all("payments").filter((x) => same(x["booking_id"], row.id))) {
        const back = n(p["kept"]);
        if (back <= 0) continue;
        if (p["method"] === "gift_card") {
          const card = this.get("gift_cards", p["card_id"]);
          if (card !== undefined) card["balance"] = n(card["balance"]) + back;
        }
        Object.assign(p, { kept: 0, returned: n(p["returned"]) + back, refunded: n(p["refunded"]) + back, card_part: 0 });
      }
    }
    this.mail(byStudio ? "cancelled_studio" : late ? "cancelled_late" : "cancelled", row);
    this.backToList(row);
  }

  /** A time let go from the waiting list goes back to waiting for it. */
  private backToList(row: Row): void {
    if (row["waitlist_id"] === null || row["waitlist_id"] === undefined) return;
    const entry = this.get("waitlist", row["waitlist_id"]);
    if (entry !== undefined && entry["state"] === "offered") entry["state"] = "waiting";
  }

  /** A new time or person on a visit, judged as a new one would be, with the visit itself left out. */
  moveTime(id: unknown, startsAt: string, person: Id | null, guest: boolean): Row {
    const row = this.booking(id);
    const service = this.get("services", row["service_id"]);
    if (service === undefined) throw new DemoRefusal(404, "NOT_FOUND", "No such service.");
    const { day, minute } = this.local(startsAt);
    const options = { guest, exclude: row.id };
    const taker = person === null ? this.pickAnyone(service, day, minute, options) : this.fits(person, service, day, minute, options) ? this.get("team", person) : null;
    if (taker === null || taker === undefined) throw new DemoRefusal(409, guest ? "PUBLIC_SLOT_FULL" : "BOOKING_TAKEN", "That time was just taken.", { reason: "taken" });
    const start = Date.parse(startsAt);
    Object.assign(row, {
      starts_at: new Date(start).toISOString(),
      team_id: taker.id,
      time_set_at: this.nowIso(),
      free_until: new Date(start - this.setting("cancel_hours") * HOUR).toISOString(),
      remind_at: moment(this.dayOffset(day) - 1, MORNING),
      review_from: moment(this.dayOffset(day) + 1, MORNING),
      revision: n(row["revision"]) + 1,
    });
    this.clashes = this.clashes.filter((c) => !same(c.row, row.id));
    this.mail("moved", row);
    this.changed();
    return row;
  }

  // ── money ─────────────────────────────────────────────────────────────────

  /** The moment Pay is pressed: the usual minutes start (MON-5). */
  startPaying(id: unknown): Row {
    const row = this.booking(id);
    if (row["state"] !== "paying") throw new DemoRefusal(409, "STATE_MOVE_REFUSED", "Not being paid.");
    row["pay_started"] = true;
    row["pay_until"] = new Date(Math.min(Date.parse(String(row["starts_at"])), this.now + this.setting("hold_min") * MINUTE)).toISOString();
    this.payStates.set(String(row.id), "open");
    this.changed();
    return row;
  }

  /** How a visit's payment ends. Paid is a real row; the rest change only what the pay page answers. */
  settle(id: unknown, outcome: "paid" | "confirming" | "failed"): void {
    const row = this.booking(id);
    if (row["state"] !== "paying") return;
    if (outcome !== "paid") {
      this.payStates.set(String(row.id), outcome);
      this.changed();
      return;
    }
    this.insert("payments", { booking_id: row.id, kind: "taken", amount: n(row["pay_due"]), method: "online", paid_at: this.nowIso(), provider: "stripe", payment_ref: this.code("pi_demo_"), refunded: 0, returned: 0, kept: n(row["pay_due"]), card_part: 0 });
    this.payStates.set(String(row.id), "paid");
    this.derive();
    this.moveVisit(row.id, "paying", "booked");
  }

  /** The hold of a visit run out now, whatever the clock says: "Let go after 15 min". */
  letGoNow(id: unknown): void {
    const row = this.booking(id);
    if (row["state"] !== "paying") return;
    this.moveVisit(row.id, "paying", "lapsed", { lapsed_by: "time" });
  }

  /** A sale of a gift card or a pack: paid at the pay step, its card or pack made as Offers makes them. */
  makeSale(kind: "card" | "pack", line: Record<string, unknown>, buyer: Record<string, unknown>, key: string): Row {
    const again = this.keys.get(key);
    if (again !== undefined) return this.get("purchases", again)!;
    const row = this.insert("purchases", { kind, state: "paying", code: this.code("LPU-"), buyer_name: buyer["buyer_name"], buyer_email: buyer["buyer_email"], language: buyer["language"] ?? "en-US", made_at: this.nowIso(), line });
    this.keys.set(key, row.id);
    this.saleStates.set(String(row.id), "open");
    return row;
  }

  settleSale(id: unknown, outcome: PayWord): void {
    const row = this.get("purchases", id);
    if (row === undefined || row["state"] === "paid") return;
    this.saleStates.set(String(row.id), outcome);
    if (outcome !== "paid") return;
    row["state"] = "paid";
    const line = row["line"] as Record<string, unknown>;
    if (row["kind"] === "card") {
      const amount = n(this.get("gift_amounts", line["gift_amount_id"])?.["amount"]);
      const code = `LGC-${String(4200 + this.all("gift_cards").length)}`;
      this.insert("gift_cards", { code, label: `Gift card ···${code.slice(-4)}`, amount, balance: amount, recipient_name: line["to_name"], recipient_email: line["to_email"], owner_email: row["buyer_email"], message: line["message"] ?? null, expires_on: null });
    } else {
      const pack = this.get("pack_products", line["pack_id"]);
      if (pack !== undefined) this.insert("vouchers", { worth: "pack", public_name: pack["name"], pack_id: pack.id, service_id: pack["service_id"], holder_name: row["buyer_name"], holder_email: row["buyer_email"], uses_total: pack["uses"], uses_taken: 0, uses_left: pack["uses"], expires_on: addDays(this.today(), 365) });
    }
    this.changed();
  }

  // ── the waiting list ──────────────────────────────────────────────────────

  /** An offer to a waiting guest: a booking that holds nothing until it is taken, open for the settings' hours. */
  offer(entry: Row, person: Id, startsAt: string): Row {
    const service = this.get("services", entry["service_id"]);
    if (service === undefined) throw new DemoRefusal(404, "NOT_FOUND", "No such service.");
    const { day, minute } = this.local(startsAt);
    if (!this.fits(person, service, day, minute, { guest: false })) throw new DemoRefusal(409, "BOOKING_TAKEN", "That time was just taken.", { reason: "taken" });
    const start = Date.parse(startsAt);
    const until = Math.min(this.now + this.setting("offer_hours") * HOUR, start - this.setting("notice_min") * MINUTE);
    const offersMoney = service["online"] === "deposit" || service["online"] === "full";
    const row = this.insert("bookings", {
      number: null,
      code: null,
      service_id: service.id,
      team_id: person,
      picked_by_anyone: false,
      customer_id: entry["customer_id"] ?? null,
      proved_by: "desk",
      customer_proved: true,
      made_proved: 1,
      name: entry["name"],
      email: entry["email"],
      phone: null,
      language: entry["language"] ?? "en-US",
      note: null,
      staff_note: null,
      no_review_request: false,
      channel: "desk",
      made_at: this.nowIso(),
      time_set_at: this.nowIso(),
      waitlist_id: entry.id,
      starts_at: new Date(start).toISOString(),
      minutes: n(service["minutes"]),
      buffer_min: n(service["buffer_min"]),
      free_until: new Date(start - this.setting("cancel_hours") * HOUR).toISOString(),
      remind_at: moment(this.dayOffset(day) - 1, MORNING),
      review_from: moment(this.dayOffset(day) + 1, MORNING),
      link_expires: new Date(start + 30 * 24 * HOUR).toISOString(),
      revision: 0,
      price: n(service["price"]),
      pay_mode: offersMoney ? service["online"] : "none",
      deposit: service["deposit"] ?? null,
      ask_online: offersMoney,
      deposit_link: false,
      discount: 0,
      state: "offered",
      offer_until: new Date(until).toISOString(),
      pay_started: false,
      pay_until: null,
      link_until: null,
      lapsed_by: null,
      arrived_at: null,
      done_at: null,
      cancelled_at: null,
      cancelled_by: null,
      cancel_reason: null,
      late_cancel: false,
      link_stopped: false,
      google_pressed: false,
      google_pressed_at: null,
      reviewed_at: null,
    });
    entry["state"] = "offered";
    this.mail("offer", row);
    this.changed();
    return row;
  }

  // ── the calendars ─────────────────────────────────────────────────────────

  private startCalendars(): void {
    const names: Record<string, string> = { google: "Google Calendar", microsoft: "Outlook" };
    const providers = Object.entries(names).map(([key, name]) => ({ key, name }));
    for (const person of WORLD.team) {
      const held = (WORLD.demoOnly.calendars as Record<string, { provider: string | null; account: string | null; state: string; lastSync: string | null; feed: boolean }>)[person.id];
      const synced = held?.lastSync ?? null;
      const lastSyncedAt = synced === null ? null : synced.includes("·") ? Date.parse(moment(-3, "18:02")) : Date.parse(moment(0, synced));
      const connected = held?.state === "connected" || held?.state === "reconnect";
      const account: CalendarAccount | null = connected ? { id: `cac_${person.id}`, provider: held!.provider!, providerName: names[held!.provider!] ?? "", state: held!.state as CalendarAccount["state"], since: Date.parse(moment(-30, "12:00")), address: held!.account, addressDiffers: false, grantEndsAt: null } : null;
      const sync: CalendarSyncState | null = account === null ? null : { accountId: account.id, state: account.state as CalendarSyncState["state"], address: account.address, demo: false, lastSyncedAt, busyAsOf: account.state === "reconnect" ? lastSyncedAt : null, busyDropped: false, paused: null, readCalendars: null, countAllDay: true, detail: "first-name+initial", traits: { listsCalendars: true, allDayKnown: true, busyPush: true }, calendars: [{ id: "primary", name: account.address ?? person.name, primary: true, writable: true }] };
      this.calendars.set(person.id, { accounts: account === null ? [] : [account], providers, reach: "push", may: { connect: true, sendLink: true, copyLink: true, disconnect: true }, sync });
    }
    const clash = this.byCode(WORLD.demoOnly.clash);
    if (clash !== undefined) {
      const start = Date.parse(String(clash["starts_at"]));
      const end = start + n(clash["minutes"]) * MINUTE;
      const busy = this.all("calendar_busy").find((b) => same(b["team_id"], clash["team_id"]) && Date.parse(String(b["starts_at"])) < end && start < Date.parse(String(b["ends_at"])));
      if (busy !== undefined) {
        const block: BusyBlock = { start: Date.parse(String(busy["starts_at"])), end: Date.parse(String(busy["ends_at"])) };
        this.clashes = [{ row: String(clash.id), resource: String(clash["team_id"]), overlapStart: Math.max(start, block.start), overlapEnd: Math.min(end, block.end), kept: false, block }];
      }
    }
  }

  /** A calendar back on, as a finished connect would leave it. The demo never talks to a provider (D20). */
  connectCalendar(team: unknown, provider: string): void {
    const calendar = this.calendars.get(String(team));
    if (calendar === undefined) return;
    const name = calendar.providers.find((p) => p.key === provider)?.name ?? provider;
    const person = this.get("team", team);
    const address = String(person?.["email"] ?? "");
    const account: CalendarAccount = { id: calendar.accounts[0]?.id ?? `cac_${String(team)}`, provider, providerName: name, state: "connected", since: this.now, address, addressDiffers: false, grantEndsAt: null };
    calendar.accounts = [account];
    calendar.sync = { accountId: account.id, state: "connected", address, demo: false, lastSyncedAt: this.now, busyAsOf: null, busyDropped: false, paused: null, readCalendars: null, countAllDay: true, detail: "first-name+initial", traits: { listsCalendars: true, allDayKnown: true, busyPush: true }, calendars: [{ id: "primary", name: address, primary: true, writable: true }] };
    this.changed();
  }

  disconnectCalendar(team: unknown): void {
    const calendar = this.calendars.get(String(team));
    if (calendar === undefined) return;
    calendar.accounts = [];
    calendar.sync = null;
    this.all("calendar_busy").splice(0, this.all("calendar_busy").length, ...this.all("calendar_busy").filter((b) => !same(b["team_id"], team)));
    this.changed();
  }

  busyOf(team: unknown, from: string, to: string): BusyBlock[] {
    const fromAt = instantAt(from, "00:00");
    const toAt = instantAt(to, "00:00");
    return this.all("calendar_busy")
      .filter((b) => same(b["team_id"], team) && Date.parse(String(b["starts_at"])) < toAt && fromAt < Date.parse(String(b["ends_at"])))
      .map((b) => ({ start: Date.parse(String(b["starts_at"])), end: Date.parse(String(b["ends_at"])) }));
  }

  // ── the clock ─────────────────────────────────────────────────────────────

  /**
   * The clock moved to a later moment, and what fell due on the way run in
   * time order: holds and offers first, so a time they free is free for
   * whatever comes after, then the day's end, then the mail.
   */
  moveTo(target: number): void {
    const from = this.now;
    if (target <= from) return;
    this.now = target;
    for (const row of this.all("bookings")) {
      if (row["state"] === "paying") {
        const until = row["pay_until"] ?? row["link_until"];
        // Never while a payment is landing: that is the bank's to finish.
        if (until !== null && until !== undefined && Date.parse(String(until)) <= target && this.payStates.get(String(row.id)) !== "confirming") {
          Object.assign(row, { state: "lapsed", lapsed_by: "time" });
          this.payStates.delete(String(row.id));
          this.mail("let_go", row, String(until));
          this.backToList(row);
        }
      } else if (row["state"] === "offered" && row["offer_until"] && Date.parse(String(row["offer_until"])) <= target) {
        Object.assign(row, { state: "lapsed", lapsed_by: "time" });
        this.backToList(row);
      }
    }
    const today = this.local(target).day;
    if (today !== this.local(from).day) {
      for (const row of this.all("bookings")) {
        if (row["state"] !== "booked" && row["state"] !== "arrived") continue;
        const start = Date.parse(String(row["starts_at"]));
        if (this.local(start).day >= today) continue;
        Object.assign(row, { state: "done", arrived_at: row["arrived_at"] ?? new Date(start).toISOString(), done_at: new Date(start + n(row["minutes"]) * MINUTE).toISOString() });
      }
    }
    this.fireMail(from, target);
    this.changed();
  }

  private fireMail(from: number, to: number): void {
    const due = (value: unknown) => {
      const at = Date.parse(String(value));
      return at > from && at <= to;
    };
    const askReviews = this.settings()["reviews_on"] !== false;
    const reminderDays = this.setting("review_reminder_days");
    for (const row of this.all("bookings")) {
      // A visit made or moved inside the last day has had its own mail: it gets no reminder (cQ11).
      if (row["state"] === "booked" && due(row["remind_at"])) {
        const set = Date.parse(String(row["time_set_at"]));
        if (set <= Date.parse(String(row["remind_at"])) && Date.parse(String(row["starts_at"])) - set >= 24 * HOUR && !this.mailed("reminder", row.id)) this.mail("reminder", row, String(row["remind_at"]));
      }
      if (askReviews && row["state"] === "done" && due(row["review_from"]) && row["no_review_request"] !== true && !this.mailed("review_request", row.id)) {
        const customer = this.get("customers", row["customer_id"]);
        if (customer?.["review_requests"] !== false) this.mail("review_request", row, String(row["review_from"]));
      }
    }
    if (!askReviews) return;
    for (const message of [...this.all("messages")]) {
      if (message["kind"] !== "review_request") continue;
      const at = Date.parse(String(message["sent_at"])) + reminderDays * 24 * HOUR;
      if (at <= from || at > to) continue;
      const row = this.get("bookings", message["booking_id"]);
      if (row === undefined || row["reviewed_at"] !== null || this.mailed("review_reminder", row.id)) continue;
      this.mail("review_reminder", row, new Date(at).toISOString());
    }
  }

  /** "+1 hour". It may run past closing and over midnight: the studio is simply closed. */
  advanceHour(): void {
    this.moveTo(this.now + HOUR);
  }

  /** "Next morning": 10:00 on the next day the studio opens, Sundays and closures skipped. */
  advanceMorning(): void {
    let day = addDays(this.today(), 1);
    for (let guard = 0; guard < 60 && !this.studioOpen(day); guard += 1) day = addDays(day, 1);
    this.moveTo(instantAt(day, MORNING));
  }
}
