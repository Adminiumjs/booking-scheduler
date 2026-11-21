import { PublicApiError } from "@adminiumjs/public-client";
import { describe, expect, it } from "vitest";

import { fmtDay, fmtMoney, fmtRange, fmtTime, fmtWhen, type Clock } from "./format.ts";
import {
  actionsOf,
  cancelledLine,
  doorFor,
  dueNow,
  keptOnLate,
  letGoLine,
  nearestTimes,
  nextFreeDay,
  paidRow,
  partOf,
  payViewOf,
  refusalOf,
  statusOf,
  usesLeft,
  type BookingFacts,
} from "./rules.ts";

const clock: Clock = { locale: "en-US", timezone: "America/Los_Angeles", currency: "USD" };
const NOW = new Date("2026-09-15T17:40:00Z").getTime();

const booking = (over: Partial<BookingFacts> = {}): BookingFacts => ({
  state: "booked",
  payMode: "none",
  asked: 0,
  deposit: 0,
  price: 58,
  paid: 0,
  cardPaid: 0,
  refunded: 0,
  discount: 0,
  payDue: 0,
  startsAt: "2026-09-17T17:00:00Z",
  freeUntil: "2026-09-16T17:00:00Z",
  lateCancel: false,
  cancelledBy: null,
  cancelReason: null,
  lapsedBy: null,
  reviewedAt: null,
  ...over,
});

const refused = (code: string, params: Record<string, unknown> = {}) => new PublicApiError(code as never, 409, code, undefined, params);

describe("how the pages write a day, a time and money", () => {
  it("follows the comp's forms", () => {
    expect(fmtDay(clock, "2026-09-17")).toBe("Thu 17 Sep");
    expect(fmtTime(clock, 600)).toBe("10 AM");
    expect(fmtTime(clock, 810)).toBe("1:30 PM");
    expect(fmtRange(clock, 600, 660)).toBe("10–11 AM");
    expect(fmtRange(clock, 630, 720)).toBe("10:30 AM–12 PM");
    expect(fmtMoney(clock, "78.00")).toBe("$78");
    expect(fmtMoney(clock, "78.50")).toBe("$78.50");
  });

  it("reads a moment on the studio's clock, not the browser's", () => {
    expect(fmtWhen(clock, "2026-09-18T00:00:00Z", 45)).toBe("Thu 17 Sep · 5–5:45 PM");
  });
});

describe("the three doors (MON-4, cQ32)", () => {
  const cut = { online: "none", price: 78, deposit: null } as const;
  const root = { online: "deposit", price: 135, deposit: 50 } as const;
  const full = { online: "full", price: 40, deposit: null } as const;

  it("sends each service through the door that fits", () => {
    expect(doorFor(cut, "on", true)).toBe("studio");
    expect(doorFor(cut, "off", false)).toBe("studio");
    expect(doorFor(root, "on", true)).toBe("money");
    expect(doorFor(root, "off", false)).toBe("off");
  });

  it("never books a money service free because payments paused", () => {
    expect(doorFor(root, "on", false)).toBeNull();
    expect(dueNow(root, null)).toBe(0);
  });

  it("asks the deposit or the whole price, and nothing at the studio", () => {
    expect(dueNow(root, "money")).toBe(50);
    expect(dueNow(full, "money")).toBe(40);
    expect(dueNow(root, "off")).toBe(0);
    expect(dueNow(cut, "studio")).toBe(0);
  });
});

describe("what a refusal says (BOOK-9)", () => {
  it("tells a lost time from a busy server and from a time that no longer fits", () => {
    expect(refusalOf(refused("PUBLIC_SLOT_FULL"), false)).toBe("taken");
    expect(refusalOf(refused("PUBLIC_SLOT_BUSY"), false)).toBe("busy");
    expect(refusalOf(refused("PUBLIC_WRITE_REFUSED", { reason: "out-of-hours" }), false)).toBe("no-longer-fits");
    expect(refusalOf(refused("PUBLIC_WRITE_REFUSED", { reason: "closed" }), false)).toBe("no-longer-fits");
    expect(refusalOf(refused("PUBLIC_WRITE_REFUSED", { reason: "not-offered" }), false)).toBe("not-offered");
  });

  it("words the caps by who is asking (cQ4)", () => {
    expect(refusalOf(refused("PUBLIC_LIMIT_REACHED"), true)).toBe("limit-customer");
    expect(refusalOf(refused("PUBLIC_LIMIT_REACHED"), false)).toBe("limit-guest");
  });

  it("does not mistake an unknown error for a lost time", () => {
    expect(refusalOf(new Error("boom"), false)).toBe("unknown");
  });
});

describe("what a booking offers", () => {
  it("moves and cancels while free, and only cancels once late", () => {
    expect(actionsOf(booking(), NOW)).toEqual(["move", "cancel"]);
    expect(actionsOf(booking({ freeUntil: "2026-09-15T17:00:00Z" }), NOW)).toEqual(["cancel"]);
  });

  it("offers no cancel while it is being paid (77 R3)", () => {
    expect(actionsOf(booking({ state: "paying" }), NOW)).toEqual(["pay"]);
  });

  it("offers a review only while the visit has none (cQ23, BN-01)", () => {
    expect(actionsOf(booking({ state: "done" }), NOW)).toEqual(["review", "bookAgain"]);
    expect(actionsOf(booking({ state: "arrived" }), NOW)).toEqual(["review"]);
    expect(actionsOf(booking({ state: "done", reviewedAt: "2026-09-10T10:00:00Z" }), NOW)).toEqual(["bookAgain"]);
  });

  it("reads arrived as booked, and a no-show as missed", () => {
    expect(statusOf("arrived")).toBe("booked");
    expect(statusOf("no_show")).toBe("missed");
  });
});

describe("what was paid, kept or given back", () => {
  it("says a deposit is kept on a late cancel and on a no-show", () => {
    expect(paidRow(booking({ state: "cancelled", lateCancel: true, payMode: "deposit", paid: 40 }))).toEqual({ word: "kept", amount: 40, full: false });
    expect(paidRow(booking({ state: "no_show", payMode: "deposit", paid: 40 }))).toEqual({ word: "kept", amount: 40, full: false });
  });

  it("says a refund is a refund", () => {
    expect(paidRow(booking({ state: "cancelled", payMode: "deposit", paid: 0, refunded: 50 }))).toEqual({ word: "refunded", amount: 50, full: false });
  });

  it("says money is on its way back before the refund has landed (MON-16)", () => {
    const b = booking({ state: "cancelled", cancelledBy: "customer", payMode: "deposit", paid: 50 });
    expect(paidRow(b)).toEqual({ word: "refunded", amount: 50, full: false });
    expect(cancelledLine(b)).toEqual({ word: "refunded", amount: 50, full: false });
    expect(cancelledLine(booking({ state: "cancelled", cancelledBy: "studio", cancelReason: "Ivy is ill", payMode: "deposit", paid: 50 }))).toEqual({ word: "studio", reason: "Ivy is ill", refunded: 50 });
  });

  it("names what a late cancel keeps, for every way of paying (cQ26, cQ31)", () => {
    expect(keptOnLate({ payMode: "deposit", asked: 50, paid: 50, discount: 0 })).toBe("deposit");
    expect(keptOnLate({ payMode: "full", asked: 40, paid: 40, discount: 0 })).toBe("payment");
    expect(keptOnLate({ payMode: "none", asked: 0, paid: 0, discount: 40 })).toBe("use");
    expect(keptOnLate({ payMode: "none", asked: 0, paid: 0, discount: 0 })).toBeNull();
  });

  it("words a cancel by who made it", () => {
    expect(cancelledLine(booking({ state: "cancelled", cancelledBy: "studio", cancelReason: "Ivy is ill", refunded: 50 }))).toEqual({ word: "studio", reason: "Ivy is ill", refunded: 50 });
    expect(cancelledLine(booking({ state: "cancelled", cancelledBy: "customer", lateCancel: true, discount: 40 }))).toEqual({ word: "keptUse" });
    expect(cancelledLine(booking({ state: "cancelled", cancelledBy: "customer" }))).toEqual({ word: "plain" });
  });

  it("says nothing was taken only when that is true (MON-8)", () => {
    expect(letGoLine({ paid: 0, cardPaid: 0 })).toEqual({ word: "nothingTaken" });
    expect(letGoLine({ paid: 50, cardPaid: 0 })).toEqual({ word: "lateMoney", amount: 50 });
    // A card's part went back to the card: no money of theirs is held.
    expect(letGoLine({ paid: 30, cardPaid: 30 })).toEqual({ word: "nothingTaken" });
  });
});

describe("the way back from paying", () => {
  it("trusts the row over the payment's word", () => {
    expect(payViewOf("open", "booked")).toBe("paid");
    expect(payViewOf("paid", "lapsed")).toBe("letGo");
  });

  it("keeps checking until the row moves", () => {
    expect(payViewOf("paid", "paying")).toBe("checking");
    expect(payViewOf("open", "paying")).toBe("checking");
    expect(payViewOf("confirming", "paying")).toBe("confirming");
    expect(payViewOf("failed", "paying")).toBe("failed");
    expect(payViewOf("expired", "paying")).toBe("failed");
  });
});

describe("what a pack has left", () => {
  it("reads an unused pack as whole, and a used-up one as none", () => {
    expect(usesLeft({ uses_left: null, uses_total: 10 })).toBe(10);
    expect(usesLeft({ uses_left: 7, uses_total: 10 })).toBe(7);
    expect(usesLeft({ uses_left: 0, uses_total: 10 })).toBe(0);
  });
});

describe("the day strip", () => {
  const days = [
    { date: "2026-09-19", open: 0, state: "full" },
    { date: "2026-09-20", open: 0, state: "closed" },
    { date: "2026-09-23", open: 3, state: "open" },
  ] as const;

  it("finds the next free day", () => {
    expect(nextFreeDay(days, "2026-09-19")).toBe("2026-09-23");
    expect(nextFreeDay(days, "2026-09-23")).toBeNull();
  });

  it("groups times as the comp does", () => {
    expect([partOf(719), partOf(720), partOf(1019), partOf(1020)]).toEqual(["morning", "afternoon", "afternoon", "evening"]);
  });

  it("offers the nearest free times, in order", () => {
    expect(nearestTimes([600, 780, 795, 810, 840, 900], 825)).toEqual([795, 810, 840]);
  });
});
