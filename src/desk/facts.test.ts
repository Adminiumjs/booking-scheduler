/** The desk's rules, each on its own: which state a row reads as, which moves it allows, what needs someone. */
import { describe, expect, it } from "vitest";

import type { DeskData, Person, Table } from "./door.ts";
import { clientFacts, firstRunGaps, gridHours, guestFits, guestLastDay, holdsLetGo, kindOf, letGoAt, movesOf, needsOf, payLine, personDay, reviewsOfClient, search, shortName, whyRefused } from "./facts.ts";
import { instantOf } from "./time.ts";
import type { Row } from "./wire.ts";

const ZONE = "America/Los_Angeles";
const at = (day: string, clock: string) => instantOf(day, clock, ZONE);
const iso = (day: string, clock: string) => new Date(at(day, clock)).toISOString();
const NOW = at("2026-09-15", "10:40");

const person = (grants: string[]): Person => ({ id: "u1", name: "Pat", roles: [], can: (table: Table, action) => grants.includes(`${table}:${action}`) });
const OWNER = person(["bookings:update", "bookings:create", "settings:update", "waitlist:update"]);
const DESK = person(["bookings:update", "bookings:create", "waitlist:update"]);
const SPECIALIST = person(["bookings:update"]);

const booking = (over: Record<string, unknown> = {}): Row => ({ id: 1, state: "booked", starts_at: iso("2026-09-15", "12:00"), minutes: 60, buffer_min: 15, team_id: 1, service_id: 1, ...over });
const empty = (over: Partial<DeskData> = {}): DeskData => ({
  settings: { id: 1, window_days: 30, notice_min: 120 },
  openingHours: ["mon", "tue", "wed", "thu", "fri", "sat"].map((weekday, i) => ({ id: i + 1, weekday, open: true, opens: "09:00", closes: "19:00" })),
  closures: [],
  categories: [],
  services: [{ id: 1, name: "Cut", active: true, bookable_online: true }],
  team: [{ id: 1, name: "Elin Sund", active: true, bookable_online: true }],
  teamServices: [{ id: 1, team_id: 1, service_id: 1 }],
  teamHours: [{ id: 1, team_id: 1, weekday: "tue", opens: "09:00", closes: "17:00", break_start: "13:00", break_end: "13:30" }],
  timeOff: [],
  customers: [],
  waitlist: [],
  bookings: [],
  payments: [],
  messages: [],
  reviews: null,
  offers: null,
  calendars: {},
  clashes: null,
  capReached: null,
  ...over,
});

describe("kindOf", () => {
  it("reads today's booked row by the clock", () => {
    expect(kindOf(booking({ starts_at: iso("2026-09-15", "10:45") }), NOW, ZONE)).toBe("soon");
    expect(kindOf(booking({ starts_at: iso("2026-09-15", "12:00") }), NOW, ZONE)).toBe("booked");
    expect(kindOf(booking({ starts_at: iso("2026-09-15", "10:25") }), NOW, ZONE)).toBe("late");
    expect(kindOf(booking({ starts_at: iso("2026-09-15", "10:30") }), NOW, ZONE)).toBe("booked");
  });
  it("leaves another day's row and any other state alone", () => {
    expect(kindOf(booking({ starts_at: iso("2026-09-16", "10:45") }), NOW, ZONE)).toBe("booked");
    expect(kindOf(booking({ state: "arrived", starts_at: iso("2026-09-15", "10:00") }), NOW, ZONE)).toBe("arrived");
  });
});

describe("movesOf", () => {
  it("a booking being paid can be let go and never cancelled (MON-6)", () => {
    const m = movesOf(booking({ state: "paying" }), DESK, NOW, ZONE, false);
    expect(m.letGo).toBe(true);
    expect(m.cancel).toBe(false);
  });
  it("offers Move only before the start (BOOK-15.3)", () => {
    expect(movesOf(booking(), DESK, NOW, ZONE, false).move).toBe(true);
    expect(movesOf(booking({ starts_at: iso("2026-09-15", "10:00") }), DESK, NOW, ZONE, false).move).toBe(false);
    expect(movesOf(booking({ state: "arrived", starts_at: iso("2026-09-15", "10:00") }), DESK, NOW, ZONE, false).move).toBe(false);
  });
  it("Arrived only on the visit's day, No-show only from its start", () => {
    expect(movesOf(booking({ starts_at: iso("2026-09-16", "12:00") }), DESK, NOW, ZONE, false).arrived).toBe(false);
    expect(movesOf(booking(), DESK, NOW, ZONE, false).arrived).toBe(true);
    expect(movesOf(booking(), DESK, NOW, ZONE, false).noShow).toBe(false);
    expect(movesOf(booking({ starts_at: iso("2026-09-15", "10:00") }), DESK, NOW, ZONE, false).noShow).toBe(true);
  });
  it("a specialist marks the day's steps and nothing else", () => {
    const m = movesOf(booking(), SPECIALIST, NOW, ZONE, false);
    expect(m.arrived).toBe(true);
    expect([m.cancel, m.move, m.letGo, m.bookAgain, m.refund, m.undo]).toEqual([false, false, false, false, false, null]);
  });
  it("Refund needs the right and money paid", () => {
    expect(movesOf(booking({ paid: 50 }), OWNER, NOW, ZONE, true).refund).toBe(true);
    expect(movesOf(booking({ paid: 50 }), DESK, NOW, ZONE, false).refund).toBe(false);
    expect(movesOf(booking({ paid: 0 }), OWNER, NOW, ZONE, true).refund).toBe(false);
  });
  it("nothing is left on a cancelled booking but a refund", () => {
    const m = movesOf(booking({ state: "cancelled", paid: 50 }), OWNER, NOW, ZONE, true);
    expect([m.arrived, m.done, m.noShow, m.cancel, m.move, m.letGo, m.bookAgain]).toEqual([false, false, false, false, false, false, false]);
    expect(m.refund).toBe(true);
  });
});

describe("payLine and letGoAt", () => {
  it("reads a kept deposit, a let-go row and a refund", () => {
    expect(payLine(booking({ state: "no_show", paid: 40 }))).toEqual({ kind: "kept", amount: 40 });
    expect(payLine(booking({ state: "cancelled", late_cancel: true, paid: 40 }))).toEqual({ kind: "kept", amount: 40 });
    expect(payLine(booking({ state: "lapsed", paid: 0 }))).toEqual({ kind: "nothing" });
    expect(payLine(booking({ state: "booked", paid: 0, refunded: 50 }))).toEqual({ kind: "refunded", amount: 50 });
    expect(payLine(booking())).toEqual({ kind: "studio" });
  });
  it("the Pay press's minutes come before the link's hold", () => {
    expect(letGoAt(booking({ pay_until: iso("2026-09-15", "10:49"), link_until: iso("2026-09-16", "10:00") }))).toBe(at("2026-09-15", "10:49"));
    expect(letGoAt(booking({ link_until: iso("2026-09-16", "10:00") }))).toBe(at("2026-09-16", "10:00"));
  });
});

describe("clients", () => {
  const rows = [
    { id: 1, customer_id: 9, team_id: 1, state: "done", starts_at: iso("2026-08-01", "10:00") },
    { id: 2, customer_id: 9, team_id: 2, state: "done", starts_at: iso("2026-08-02", "10:00") },
    { id: 3, customer_id: 9, team_id: 2, state: "cancelled", starts_at: iso("2026-08-03", "10:00") },
  ];
  it("on a tie, usually with is the most recent (L2a-F3)", () => {
    const facts = clientFacts(rows, 9);
    expect(facts.visits).toBe(2);
    expect(facts.usuallyWith).toBe(2);
    expect(facts.last).toBe(rows[1]!["starts_at"]);
  });
  it("a review reaches a client by its booking, never by a short name (L2a-F4)", () => {
    const data = empty({ bookings: rows, reviews: { totals: [], reviews: [{ id: 1, subject_key: "1", shown_name: "Elena K." }, { id: 2, subject_key: "77", shown_name: "Elena K." }] } });
    expect(reviewsOfClient(data, 9).map((r) => r.id)).toEqual([1]);
  });
  it("shortens a name for a calendar block", () => {
    expect(shortName("Lucia Moss")).toBe("Lucia M.");
    expect(shortName("Cher")).toBe("Cher");
  });
  it("search needs two letters and caps its lists", () => {
    const data = empty({ customers: Array.from({ length: 8 }, (_, i) => ({ id: i, name: `Ann ${String(i)}`, email: `a${String(i)}@x.example` })) });
    expect(search(data, "a").clients).toEqual([]);
    expect(search(data, "ann").clients).toHaveLength(5);
  });
});

describe("the guest's rule on the waiting list (cQ33)", () => {
  const entry: Row = { id: 1, day: "2026-09-15", service_id: 1, team_id: null, state: "waiting" };
  it("offers nothing inside the notice", () => {
    const fits = guestFits([{ time: "11:00", state: "free", resource: 1 }, { time: "13:00", state: "free", resource: 1 }], entry, empty(), NOW, ZONE);
    expect(fits.map((f) => f.clock)).toEqual(["13:00"]);
  });
  it("skips a person not bookable online and a service that is off", () => {
    const off = empty({ team: [{ id: 1, name: "Elin", active: true, bookable_online: false }] });
    expect(guestFits([{ time: "15:00", state: "free", resource: 1 }], entry, off, NOW, ZONE)).toEqual([]);
    const closed = empty({ services: [{ id: 1, active: true, bookable_online: false }] });
    expect(guestFits([{ time: "15:00", state: "free", resource: 1 }], entry, closed, NOW, ZONE)).toEqual([]);
  });
  it("offers nothing past the guests' last working day", () => {
    const short = empty({ settings: { id: 1, window_days: 2, notice_min: 120 } });
    expect(guestLastDay(short, "2026-09-15")).toBe("2026-09-16");
    expect(guestFits([{ time: "15:00", state: "free", resource: 1 }], { ...entry, day: "2026-09-17" }, short, NOW, ZONE)).toEqual([]);
  });
  it("counts today as day 1 and skips a closed Sunday and a closure (cT15)", () => {
    const data = empty({ settings: { id: 1, window_days: 6, notice_min: 120 }, closures: [{ id: 1, team_id: null, from_date: "2026-09-17", to_date: "2026-09-17", active: true }] });
    expect(guestLastDay(data, "2026-09-15")).toBe("2026-09-22");
  });
});

describe("Needs you", () => {
  it("counts only holds the clock let go in the last hour", () => {
    expect(holdsLetGo([{ id: 1, state: "lapsed", lapsed_by: "time", pay_until: new Date(NOW - 600_000).toISOString() }, { id: 2, state: "lapsed", lapsed_by: "desk", pay_until: new Date(NOW - 600_000).toISOString() }], NOW)).toBe(1);
  });
  it("a kept clash raises nothing, and one clash raises one row", () => {
    const b = booking({ id: 5 });
    const clash = { row: "5", resource: "1", overlapStart: 1, overlapEnd: 2, kept: false };
    expect(needsOf(empty({ bookings: [b], clashes: [clash] }), DESK, NOW, ZONE, {}).filter((n) => n.kind === "clash")).toHaveLength(1);
    expect(needsOf(empty({ bookings: [b], clashes: [{ ...clash, kept: true }] }), DESK, NOW, ZONE, {}).filter((n) => n.kind === "clash")).toHaveLength(0);
  });
  it("late money is the owner's alone (MON-8)", () => {
    const data = empty({ bookings: [booking({ state: "lapsed", paid: 50 })] });
    expect(needsOf(data, OWNER, NOW, ZONE, {}).some((n) => n.kind === "lateMoney")).toBe(true);
    expect(needsOf(data, DESK, NOW, ZONE, {}).some((n) => n.kind === "lateMoney")).toBe(false);
  });
  it("the hourly limit row needs the desk and a count (ACC-5)", () => {
    expect(needsOf(empty({ capReached: 3 }), DESK, NOW, ZONE, {}).some((n) => n.kind === "limit")).toBe(true);
    expect(needsOf(empty({ capReached: 0 }), DESK, NOW, ZONE, {}).some((n) => n.kind === "limit")).toBe(false);
    expect(needsOf(empty({ capReached: 3 }), SPECIALIST, NOW, ZONE, {}).some((n) => n.kind === "limit")).toBe(false);
  });
  it("a new studio sees what it has still to set up, the owner only", () => {
    const fresh = empty({ openingHours: [], services: [], teamHours: [] });
    expect(firstRunGaps(fresh)).toEqual(["hours", "service", "person"]);
    expect(needsOf(fresh, OWNER, NOW, ZONE, {}).some((n) => n.kind === "firstRun")).toBe(true);
    expect(needsOf(fresh, DESK, NOW, ZONE, {}).some((n) => n.kind === "firstRun")).toBe(false);
  });
});

describe("the calendar", () => {
  it("reads a person's day: closed, off, hours and break", () => {
    const data = empty({ closures: [{ id: 1, team_id: 1, from_date: "2026-09-22", to_date: "2026-09-22", name: "Holiday", active: true }] });
    expect(personDay(data, 1, "2026-09-15")).toEqual({ off: null, opens: 540, closes: 1020, breakStart: 780, breakEnd: 810 });
    expect(personDay(data, 1, "2026-09-22")).toEqual({ off: "dayOff", why: "Holiday" });
    expect(personDay(data, 1, "2026-09-16").off).toBe("notWorking");
    expect(personDay(data, 1, "2026-09-20").off).toBe("notWorking");
  });
  it("draws from the earliest opening to the latest closing", () => {
    expect(gridHours(empty())).toEqual({ from: 540, to: 1140 });
  });
  it("says why a drop is refused, naming the booking in the way (K2)", () => {
    const moving = booking({ id: 7, starts_at: iso("2026-09-15", "15:00") });
    const other = booking({ id: 8, starts_at: iso("2026-09-15", "12:30"), minutes: 30 });
    const data = empty({ bookings: [moving, other] });
    const team = data.team[0]!;
    expect(whyRefused(data, moving, team, "2026-09-15", 12 * 60, NOW, ZONE, [])).toMatchObject({ why: "booking" });
    expect(whyRefused(data, moving, team, "2026-09-15", 17 * 60, NOW, ZONE, [])).toMatchObject({ why: "hours" });
    expect(whyRefused(data, moving, team, "2026-09-15", 13 * 60, NOW, ZONE, [])).toMatchObject({ why: "break" });
    expect(whyRefused(data, moving, team, "2026-09-15", 9 * 60, NOW, ZONE, [])).toMatchObject({ why: "past" });
    expect(whyRefused(data, moving, team, "2026-09-16", 12 * 60, NOW, ZONE, [])).toMatchObject({ why: "off" });
    const busy = [{ start: at("2026-09-15", "14:00"), end: at("2026-09-15", "15:00") }];
    expect(whyRefused(data, moving, team, "2026-09-15", 14 * 60, NOW, ZONE, busy)).toMatchObject({ why: "busy" });
  });
});
