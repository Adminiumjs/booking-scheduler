/**
 * What the desk works out from the rows, with no drawing in it: which state
 * a booking reads as now, which moves it allows, what "Needs you" lists, who a
 * client usually sees. Each rule is one function, so it is tested on its own.
 *
 * Controls follow the person's grants (§7), never a role's name. What is shown
 * here is a courtesy: Adminium refuses the write whatever a screen offers.
 */
import type { Clash, DeskData, Person, Slot } from "./door.ts";
import { addDays, dayIn, instantOf, weekdayOf } from "./time.ts";
import { num, same, text, type Id, type Row } from "./wire.ts";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** The rows a day's list shows: a no-show stays listed, though it frees its time (cQ5). */
export const ON_THE_DAY = ["paying", "booked", "arrived", "done", "no_show"];
/** The rows that hold a person's time on the calendar. */
export const HOLDS_TIME = ["paying", "booked", "arrived", "done"];

export type Kind = "offered" | "paying" | "booked" | "soon" | "late" | "arrived" | "done" | "no_show" | "cancelled" | "lapsed";

export const byId = (rows: readonly Row[], id: unknown): Row | undefined => rows.find((row) => same(row.id, id));
export const startOf = (booking: Row): number => Date.parse(String(booking["starts_at"]));
export const endOf = (booking: Row): number => startOf(booking) + (num(booking["minutes"]) ?? 0) * MINUTE;
export const firstName = (name: unknown): string => (text(name) ?? "").split(" ")[0] ?? "";
export const initials = (name: unknown): string =>
  (text(name) ?? "")
    .split(" ")
    .filter((part) => part !== "")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
/** "Lucia M.": how a calendar block names a customer. */
export function shortName(name: unknown): string {
  const parts = (text(name) ?? "").split(" ").filter((part) => part !== "");
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts[0]!} ${parts[parts.length - 1]![0]!}.`;
}

/** The state a booking reads as at this moment: today's booked row is "due" or "not arrived". */
export function kindOf(booking: Row, now: number, zone: string): Kind {
  const state = String(booking["state"]) as Kind;
  if (state !== "booked" || dayIn(startOf(booking), zone) !== dayIn(now, zone)) return state;
  const start = startOf(booking);
  if (now >= start + 15 * MINUTE) return "late";
  // From half an hour before until "Not arrived": someone a few minutes late still gets the one-press Arrived.
  if (now >= start - 30 * MINUTE) return "soon";
  return "booked";
}

/** When a booking being paid is let go: the Pay press's minutes, else the link's hold (R5). */
export function letGoAt(booking: Row): number | null {
  const at = text(booking["pay_until"]) ?? text(booking["link_until"]);
  return at === null ? null : Date.parse(at);
}

export interface Moves {
  arrived: boolean;
  done: boolean;
  noShow: boolean;
  /** Back one step, for a step taken by mistake. */
  undo: string | null;
  cancel: boolean;
  letGo: boolean;
  /** Only before the start: a visit that has begun keeps its person and time (BOOK-15.3). */
  move: boolean;
  bookAgain: boolean;
  refund: boolean;
}

/** The moves a booking's state allows, for this person (BN-13, MON-6). */
export function movesOf(booking: Row, who: Person, now: number, zone: string, mayRefund: boolean): Moves {
  const state = String(booking["state"]);
  const start = startOf(booking);
  const sameDay = dayIn(start, zone) === dayIn(now, zone);
  const writes = who.can("bookings", "update");
  // What only the desk does. A specialist reads no money, so `price` being absent from their row says the same as the grant.
  const desk = writes && who.can("bookings", "create");
  const paid = (num(booking["paid"]) ?? 0) > 0;
  return {
    arrived: writes && state === "booked" && sameDay,
    done: writes && state === "arrived",
    noShow: writes && state === "booked" && now >= start,
    undo: !desk ? null : state === "arrived" || state === "no_show" ? "booked" : state === "done" ? "arrived" : null,
    cancel: desk && state === "booked",
    letGo: desk && state === "paying",
    move: desk && (state === "booked" || state === "paying") && now < start,
    bookAgain: desk && ["booked", "arrived", "done", "no_show"].includes(state),
    refund: mayRefund && paid && ["booked", "arrived", "done", "no_show", "cancelled", "lapsed"].includes(state),
  };
}

/** How a booking's money reads on its panel. */
export type PayLine = { kind: "studio" } | { kind: "paying"; amount: number } | { kind: "paid"; amount: number } | { kind: "kept"; amount: number } | { kind: "refunded"; amount: number } | { kind: "nothing" };

export function payLine(booking: Row): PayLine {
  const state = String(booking["state"]);
  const paid = num(booking["paid"]) ?? 0;
  const refunded = num(booking["refunded"]) ?? 0;
  if (state === "paying") return { kind: "paying", amount: num(booking["pay_due"]) ?? num(booking["asked"]) ?? 0 };
  if (refunded > 0 && paid <= 0) return { kind: "refunded", amount: refunded };
  if (state === "lapsed" && paid <= 0) return { kind: "nothing" };
  if (paid > 0 && (state === "no_show" || (state === "cancelled" && booking["late_cancel"] === true))) return { kind: "kept", amount: paid };
  if (paid > 0) return { kind: "paid", amount: paid };
  return { kind: "studio" };
}

// ── clients ─────────────────────────────────────────────────────────────────

export interface ClientFacts {
  visits: number;
  last: string | null;
  first: string | null;
  usuallyWith: Id | null;
}

/** A client's figures, counted from the whole bookings table (L2a-F2). "Usually with": most done visits, then the most recent (F3). */
export function clientFacts(bookings: readonly Row[], customerId: Id): ClientFacts {
  const done = bookings.filter((b) => same(b["customer_id"], customerId) && b["state"] === "done").sort((a, b) => startOf(a) - startOf(b));
  const tally = new Map<string, { id: Id; n: number; last: number }>();
  for (const visit of done) {
    const person = visit["team_id"] as Id | null;
    if (person === null || person === undefined) continue;
    const seen = tally.get(String(person)) ?? { id: person, n: 0, last: 0 };
    tally.set(String(person), { id: person, n: seen.n + 1, last: startOf(visit) });
  }
  const top = [...tally.values()].sort((a, b) => b.n - a.n || b.last - a.last)[0];
  return {
    visits: done.length,
    last: done.length === 0 ? null : String(done[done.length - 1]!["starts_at"]),
    first: done.length === 0 ? null : String(done[0]!["starts_at"]),
    usuallyWith: top?.id ?? null,
  };
}

/** A review's customer goes review → booking → customer, never by a short name (L2a-F4). */
export function reviewsOfClient(data: DeskData, customerId: Id): Row[] {
  if (data.reviews === null) return [];
  const mine = new Set(data.bookings.filter((b) => same(b["customer_id"], customerId)).map((b) => String(b.id)));
  return data.reviews.reviews.filter((review) => mine.has(String(review["subject_key"])));
}

// ── the guest's rule, for the waiting list (cQ33) ───────────────────────────

/** The guests' last bookable day: `window_days` working days, today being day 1 (cT15). */
export function guestLastDay(data: DeskData, today: string): string {
  const windowDays = num(data.settings?.["window_days"]) ?? 30;
  const open = new Set(data.openingHours.filter((row) => row["open"] !== false).map((row) => String(row["weekday"])));
  const closed = data.closures.filter((row) => row["active"] !== false && (row["team_id"] === null || row["team_id"] === undefined));
  if (open.size === 0) return today;
  let day = today;
  let counted = 0;
  for (let guard = 0; guard < 800; guard += 1) {
    const isClosed = closed.some((row) => day >= String(row["from_date"]).slice(0, 10) && day <= String(row["to_date"]).slice(0, 10));
    if (open.has(weekdayOf(day)) && !isClosed) {
      counted += 1;
      if (counted >= windowDays) return day;
    }
    day = addDays(day, 1);
  }
  return day;
}

export interface WaitFit {
  clock: string;
  person: Id;
}

/** The staff's free times a guest could also take: inside the notice nothing is offered (cQ33, BOOK-15.4). */
export function guestFits(slots: readonly Slot[], entry: Row, data: DeskData, now: number, zone: string): WaitFit[] {
  const day = String(entry["day"]).slice(0, 10);
  const today = dayIn(now, zone);
  if (day < today || day > guestLastDay(data, today)) return [];
  const service = byId(data.services, entry["service_id"]);
  if (service === undefined || service["active"] === false || service["bookable_online"] === false) return [];
  const notice = (num(data.settings?.["notice_min"]) ?? 120) * MINUTE;
  const out: WaitFit[] = [];
  for (const slot of slots) {
    if (slot.state !== "free") continue;
    if (instantOf(day, slot.time, zone) < now + notice) continue;
    const person = (entry["team_id"] as Id | null | undefined) ?? slot.resource ?? null;
    if (person === null) continue;
    const row = byId(data.team, person);
    if (row === undefined || row["active"] === false || row["bookable_online"] === false) continue;
    out.push({ clock: slot.time, person });
  }
  return out;
}

/** The cancelled booking that freed this time, when one did: what the entry's line says. */
export function freedBy(data: DeskData, entry: Row, fit: WaitFit, zone: string): Row | undefined {
  const day = String(entry["day"]).slice(0, 10);
  const at = instantOf(day, fit.clock, zone);
  return data.bookings.find((b) => b["state"] === "cancelled" && same(b["service_id"], entry["service_id"]) && same(b["team_id"], fit.person) && startOf(b) === at);
}

// ── Needs you ───────────────────────────────────────────────────────────────

export type Need =
  | { kind: "clash"; clash: Clash; booking: Row; person: Row | undefined }
  | { kind: "reconnect"; person: Row; provider: string }
  | { kind: "paying"; booking: Row }
  | { kind: "letGo"; count: number }
  | { kind: "lateMoney"; booking: Row }
  | { kind: "limit"; minutes: number }
  | { kind: "waiting"; count: number }
  | { kind: "reviews"; count: number }
  | { kind: "firstRun"; missing: ("hours" | "service" | "person")[] };

/** The holds the clock let go in the last hour (MON-7). A hold lapsed at its `pay_until`, else its `link_until`. */
export function holdsLetGo(bookings: readonly Row[], now: number): number {
  return bookings.filter((b) => {
    if (b["state"] !== "lapsed" || b["lapsed_by"] !== "time") return false;
    const at = letGoAt(b);
    return at !== null && at <= now && at > now - HOUR;
  }).length;
}

/** What a new studio has still to set up, from its rows (MOD-4, MOD-5). */
export function firstRunGaps(data: DeskData): ("hours" | "service" | "person")[] {
  const gaps: ("hours" | "service" | "person")[] = [];
  if (!data.openingHours.some((row) => row["open"] !== false)) gaps.push("hours");
  if (!data.services.some((row) => row["active"] !== false)) gaps.push("service");
  if (!data.teamHours.length) gaps.push("person");
  return gaps;
}

export function needsOf(data: DeskData, who: Person, now: number, zone: string, fits: Record<string, WaitFit[]>): Need[] {
  const out: Need[] = [];
  const desk = who.can("bookings", "create");
  if (who.can("settings", "update")) {
    const missing = firstRunGaps(data);
    if (missing.length > 0) out.push({ kind: "firstRun", missing });
  }
  for (const clash of data.clashes ?? []) {
    if (clash.kept) continue;
    const booking = byId(data.bookings, clash.row);
    if (booking !== undefined) out.push({ kind: "clash", clash, booking, person: byId(data.team, clash.resource) });
  }
  for (const person of data.team) {
    const calendar = data.calendars[String(person.id)];
    const account = calendar?.accounts.find((one) => one.state === "reconnect");
    if (account !== undefined && calendar !== undefined && (calendar.may.sendLink || calendar.may.connect)) out.push({ kind: "reconnect", person, provider: account.providerName });
  }
  if (desk) {
    const today = dayIn(now, zone);
    for (const booking of data.bookings) {
      if (booking["state"] === "paying" && dayIn(startOf(booking), zone) === today) out.push({ kind: "paying", booking });
    }
    const letGo = holdsLetGo(data.bookings, now);
    if (letGo > 0) out.push({ kind: "letGo", count: letGo });
    if ((data.capReached ?? 0) > 0) out.push({ kind: "limit", minutes: data.capReached! });
  }
  // Money that landed on a time already let go: the owner's, who can refund it (MON-8).
  if (who.can("settings", "update")) {
    for (const booking of data.bookings) {
      if (booking["state"] === "lapsed" && (num(booking["paid"]) ?? 0) > 0) out.push({ kind: "lateMoney", booking });
    }
  }
  if (desk) {
    const count = data.waitlist.filter((entry) => entry["state"] === "waiting" && (fits[String(entry.id)]?.length ?? 0) > 0).length;
    if (count > 0) out.push({ kind: "waiting", count });
  }
  const toRead = data.reviews?.reviews.filter((review) => review["state"] === "waiting").length ?? 0;
  if (toRead > 0) out.push({ kind: "reviews", count: toRead });
  return out;
}

// ── search ──────────────────────────────────────────────────────────────────

/** The top bar's search: from two characters, at most three bookings and five clients. */
export function search(data: DeskData, query: string): { bookings: Row[]; clients: Row[] } {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return { bookings: [], clients: [] };
  const hit = (...values: unknown[]) => values.some((value) => (text(value) ?? "").toLowerCase().includes(q));
  return {
    bookings: data.bookings.filter((b) => hit(b["code"])).slice(0, 3),
    clients: data.customers.filter((c) => hit(c["name"], c["email"])).slice(0, 5),
  };
}

// ── the calendar ────────────────────────────────────────────────────────────

/** A person's day: off (and why), or their hours and break, in minutes of the studio's day. */
export type PersonDay = { off: "closed" | "notWorking" | "dayOff"; why: string | null } | { off: null; opens: number; closes: number; breakStart: number | null; breakEnd: number | null };

const clockMinutes = (value: unknown): number | null => {
  const t = text(value);
  if (t === null) return null;
  const [h, m] = t.split(":").map(Number);
  return h === undefined || m === undefined || Number.isNaN(h) || Number.isNaN(m) ? null : h * 60 + m;
};

export function personDay(data: DeskData, person: Id, day: string): PersonDay {
  const inRange = (row: Row) => row["active"] !== false && day >= String(row["from_date"]).slice(0, 10) && day <= String(row["to_date"]).slice(0, 10);
  const studio = data.closures.find((row) => (row["team_id"] === null || row["team_id"] === undefined) && inRange(row));
  if (studio !== undefined) return { off: "closed", why: text(studio["name"]) };
  const weekday = weekdayOf(day);
  const opening = data.openingHours.find((row) => row["weekday"] === weekday);
  if (opening !== undefined && opening["open"] === false) return { off: "closed", why: null };
  const own = data.closures.find((row) => same(row["team_id"], person) && inRange(row));
  if (own !== undefined) return { off: "dayOff", why: text(own["name"]) };
  const hours = data.teamHours.find((row) => same(row["team_id"], person) && row["weekday"] === weekday);
  const opens = clockMinutes(hours?.["opens"]);
  const closes = clockMinutes(hours?.["closes"]);
  if (opens === null || closes === null) return { off: "notWorking", why: null };
  return { off: null, opens, closes, breakStart: clockMinutes(hours?.["break_start"]), breakEnd: clockMinutes(hours?.["break_end"]) };
}

/** The hours the grid draws: the studio's earliest opening to its latest closing, whole hours. */
export function gridHours(data: DeskData): { from: number; to: number } {
  const open = data.openingHours.filter((row) => row["open"] !== false);
  const opens = open.map((row) => clockMinutes(row["opens"])).filter((n): n is number => n !== null);
  const closes = open.map((row) => clockMinutes(row["closes"])).filter((n): n is number => n !== null);
  if (opens.length === 0 || closes.length === 0) return { from: 9 * 60, to: 19 * 60 };
  return { from: Math.floor(Math.min(...opens) / 60) * 60, to: Math.ceil(Math.max(...closes) / 60) * 60 };
}

export type DropRefusal =
  | { why: "notTheirs"; who: string; service: string }
  | { why: "off"; who: string }
  | { why: "hours"; who: string; from: number; to: number }
  | { why: "break"; who: string; at: number }
  | { why: "past" }
  | { why: "booking"; who: string; at: number; service: string }
  | { why: "busy"; who: string }
  | { why: "timeOff"; who: string }
  | { why: "taken" };

/**
 * Why a drop the engine would not take is refused, in the words the comp draws. The free-times read decides; this only
 * says why, so a sentence can never let through a time Adminium refuses.
 */
export function whyRefused(data: DeskData, booking: Row, person: Row, day: string, minute: number, now: number, zone: string, busy: readonly { start: number; end: number }[]): DropRefusal {
  const who = firstName(person["name"]);
  const service = byId(data.services, booking["service_id"]);
  const length = num(booking["minutes"]) ?? 0;
  const buffer = num(booking["buffer_min"]) ?? 0;
  if (!data.teamServices.some((link) => same(link["team_id"], person.id) && same(link["service_id"], booking["service_id"]))) return { why: "notTheirs", who, service: text(service?.["name"]) ?? "" };
  const today = personDay(data, person.id, day);
  if (today.off !== null) return { why: "off", who };
  if (minute < today.opens || minute + length > today.closes) return { why: "hours", who, from: today.opens, to: today.closes };
  if (today.breakStart !== null && today.breakEnd !== null && minute < today.breakEnd && minute + length > today.breakStart) return { why: "break", who, at: today.breakStart };
  const clock = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
  const start = instantOf(day, clock, zone);
  if (start < now) return { why: "past" };
  const end = start + (length + buffer) * MINUTE;
  const other = data.bookings.find((b) => !same(b.id, booking.id) && same(b["team_id"], person.id) && HOLDS_TIME.includes(String(b["state"])) && startOf(b) < end && start < endOf(b) + (num(b["buffer_min"]) ?? 0) * MINUTE);
  if (other !== undefined) return { why: "booking", who, at: startOf(other), service: text(byId(data.services, other["service_id"])?.["name"]) ?? "" };
  if (data.timeOff.some((row) => same(row["team_id"], person.id) && Date.parse(String(row["starts_at"])) < end && start < Date.parse(String(row["ends_at"])))) return { why: "timeOff", who };
  if (busy.some((block) => block.start < end && start < block.end)) return { why: "busy", who };
  return { why: "taken" };
}
