/**
 * What the customer's pages decide from what Adminium answered.
 *
 * Nothing here is a rule of its own: Adminium refuses what is not allowed. These
 * functions pick which words and which buttons fit a row as it stands, so a
 * page never offers what the server would refuse, and they are small enough to
 * test alone.
 */
import { PublicApiError } from "@adminiumjs/public-client";

// ── how a service is paid: three doors ──────────────────────────────────────

export type PayMode = "none" | "deposit" | "full";
export type DoorName = "studio" | "money" | "off";

export interface Payable {
  online: PayMode;
  price: number;
  deposit: number | null;
}

/**
 * Which door a service goes through (MON-4, cQ32).
 *   studio  it takes no money online;
 *   money   it does, the owner takes money online, and payments answer;
 *   off     it does, and the owner switched that off: paid at the studio;
 *   null    the owner takes money online and payments do not answer right
 *           now. It cannot be booked online until they do.
 */
export function doorFor(service: Payable, ownerSwitch: "on" | "off", paymentsOnline: boolean): DoorName | null {
  if (service.online === "none") return "studio";
  if (ownerSwitch === "off") return "off";
  return paymentsOnline ? "money" : null;
}

/** What is asked online for this service through this door. */
export function dueNow(service: Payable, door: DoorName | null): number {
  if (door !== "money") return 0;
  return service.online === "full" ? service.price : (service.deposit ?? 0);
}

// ── a refusal, in words the guest can act on (BOOK-9) ───────────────────────

export type Refusal =
  | "taken" // someone else has the time: back to the day, with the nearest free ones
  | "busy" // the server is working through the same time: try again
  | "no-longer-fits" // hours, a closure or the person changed since the page was drawn
  | "not-offered" // the service or the person is no longer offered online
  | "too-late" // inside the window
  | "limit-guest" // a guest's caps
  | "limit-customer" // three visits ahead, signed in
  | "paused" // payments are not answering
  | "off" // online booking is off
  | "rate" // too many tries
  | "network"
  | "unknown";

export function refusalOf(error: unknown, signedIn: boolean): Refusal {
  if (!(error instanceof PublicApiError)) return "unknown";
  const reason = typeof error.params["reason"] === "string" ? error.params["reason"] : null;
  switch (error.code) {
    case "PUBLIC_SLOT_FULL":
      return "taken";
    case "PUBLIC_SLOT_BUSY":
      return "busy";
    case "PUBLIC_TOO_LATE":
      return "too-late";
    case "PUBLIC_LIMIT_REACHED":
      return signedIn ? "limit-customer" : "limit-guest";
    case "PUBLIC_RATE_LIMITED":
      return signedIn ? "rate" : "limit-guest";
    case "PUBLIC_SWITCHED_OFF":
      return "paused";
    case "PUBLIC_API_DISABLED":
    case "PUBLIC_KEY_OFF":
      return "off";
    case "PUBLIC_NETWORK_UNAVAILABLE":
    case "PUBLIC_UPSTREAM_UNAVAILABLE":
      return "network";
    case "PUBLIC_WRITE_REFUSED":
      if (reason === "not-offered") return "not-offered";
      if (reason === "closed" || reason === "out-of-hours" || reason === "out-of-range") return "no-longer-fits";
      return "unknown";
    default:
      return "unknown";
  }
}

// ── a booking as its page shows it ──────────────────────────────────────────

export type BookingState = "offered" | "paying" | "booked" | "arrived" | "done" | "no_show" | "cancelled" | "lapsed";

export interface BookingFacts {
  state: BookingState;
  payMode: PayMode;
  asked: number;
  deposit: number;
  price: number;
  paid: number;
  refunded: number;
  discount: number;
  payDue: number;
  startsAt: string;
  freeUntil: string | null;
  lateCancel: boolean;
  cancelledBy: "customer" | "studio" | null;
  cancelReason: string | null;
  lapsedBy: "guest" | "desk" | "time" | null;
  reviewedAt: string | null;
}

export type Status = "booked" | "paying" | "done" | "missed" | "cancelled" | "letGo" | "offered";

/** The word on a booking's pill. "Arrived" reads as Booked to the guest (L1a-F9). */
export function statusOf(state: BookingState): Status {
  switch (state) {
    case "paying":
      return "paying";
    case "booked":
    case "arrived":
      return "booked";
    case "done":
      return "done";
    case "no_show":
      return "missed";
    case "cancelled":
      return "cancelled";
    case "lapsed":
      return "letGo";
    case "offered":
      return "offered";
  }
}

/** Whether it is still free to move or cancel. */
export const isFree = (b: Pick<BookingFacts, "freeUntil">, now: number) => b.freeUntil !== null && now < new Date(b.freeUntil).getTime();

export type Action = "move" | "cancel" | "pay" | "review" | "bookAgain";

/** The buttons a booking offers now: only the moves its state allows (BN-13). No cancel while it is being paid. */
export function actionsOf(b: BookingFacts, now: number): Action[] {
  switch (b.state) {
    case "paying":
      return ["pay"];
    case "booked": {
      const ahead = new Date(b.startsAt).getTime() > now;
      if (!ahead) return [];
      return isFree(b, now) ? ["move", "cancel"] : ["cancel"];
    }
    case "arrived":
      return b.reviewedAt === null ? ["review"] : [];
    case "done":
      return b.reviewedAt === null ? ["review", "bookAgain"] : ["bookAgain"];
    case "cancelled":
    case "lapsed":
    case "no_show":
      return ["bookAgain"];
    case "offered":
      return [];
  }
}

/** What the "Paid now" row says, as a word and the amount it is about. */
export type PaidRow =
  | { word: "nothing" }
  | { word: "notYet" | "paid" | "refunded" | "kept"; amount: number; full: boolean };

export function paidRow(b: BookingFacts): PaidRow {
  const full = b.payMode === "full";
  if (b.refunded > 0) return { word: "refunded", amount: b.refunded, full };
  if (b.state === "paying") return b.payDue > 0 ? { word: "notYet", amount: b.payDue, full } : { word: "nothing" };
  if (b.paid > 0) {
    const kept = b.state === "no_show" || (b.state === "cancelled" && b.lateCancel);
    return { word: kept ? "kept" : "paid", amount: b.paid, full };
  }
  return { word: "nothing" };
}

/** What a late cancel would keep, for the policy sentence (F8, cQ26, cQ31). */
export type Kept = "deposit" | "payment" | "use" | null;

export function keptOnLate(b: Pick<BookingFacts, "payMode" | "asked" | "paid" | "discount">): Kept {
  if (b.payMode === "full" && (b.asked > 0 || b.paid > 0)) return "payment";
  if (b.payMode === "deposit" && (b.asked > 0 || b.paid > 0)) return "deposit";
  return b.discount > 0 ? "use" : null;
}

/** The line under a cancelled booking's title. */
export type CancelledLine =
  | { word: "studio"; reason: string | null; refunded: number }
  | { word: "refunded"; amount: number; full: boolean }
  | { word: "kept"; amount: number; full: boolean }
  | { word: "keptUse" }
  | { word: "plain" };

export function cancelledLine(b: BookingFacts): CancelledLine {
  if (b.cancelledBy === "studio") return { word: "studio", reason: b.cancelReason, refunded: b.refunded };
  const full = b.payMode === "full";
  if (b.refunded > 0) return { word: "refunded", amount: b.refunded, full };
  if (b.lateCancel && b.paid > 0) return { word: "kept", amount: b.paid, full };
  if (b.lateCancel && b.discount > 0) return { word: "keptUse" };
  return { word: "plain" };
}

/**
 * A time let go. "Nothing was taken" only when that is true: money can land
 * after the hold ended, and then the page says so and how it is put right (MON-8).
 */
export const letGoLine = (b: Pick<BookingFacts, "paid">): { word: "lateMoney"; amount: number } | { word: "nothingTaken" } =>
  b.paid > 0 ? { word: "lateMoney", amount: b.paid } : { word: "nothingTaken" };

// ── the way back from paying ────────────────────────────────────────────────

export type PayView = "checking" | "paid" | "confirming" | "failed" | "letGo";

/**
 * What to show from the payment's word and the row. The row wins: a row that is
 * booked is paid, whatever the service last said, and one let go is let go.
 */
export function payViewOf(state: string | null, rowState: BookingState | null): PayView {
  if (rowState === "lapsed" || rowState === "cancelled") return "letGo";
  if (rowState !== null && rowState !== "paying" && rowState !== "offered") return "paid";
  switch (state) {
    case "confirming":
      return "confirming";
    case "failed":
    case "expired":
      return "failed";
    default:
      return "checking";
  }
}

// ── the day strip ───────────────────────────────────────────────────────────

export interface StripDay {
  date: string;
  open: number;
  state: "open" | "full" | "closed";
  lastBookable?: boolean;
}

/** The next day with a free time after `from`, across the days read so far. */
export const nextFreeDay = (days: readonly StripDay[], from: string) => days.find((d) => d.date > from && d.state === "open" && d.open > 0)?.date ?? null;

export type DayPart = "morning" | "afternoon" | "evening";
export const partOf = (minutes: number): DayPart => (minutes < 12 * 60 ? "morning" : minutes < 17 * 60 ? "afternoon" : "evening");

/** The three free times nearest a time that was just lost, nearest first. */
export function nearestTimes(free: readonly number[], lost: number, n = 3): number[] {
  return [...free].sort((a, b) => Math.abs(a - lost) - Math.abs(b - lost) || a - b).slice(0, n).sort((a, b) => a - b);
}

// ── what a pack has left ────────────────────────────────────────────────────

/** Offers leaves `uses_left` empty until the first use: an unused pack has all of them. */
export function usesLeft(pack: { uses_left?: unknown; uses_total?: unknown }): number {
  const left = pack.uses_left;
  return left === null || left === undefined || left === "" ? Number(pack.uses_total ?? 0) : Number(left);
}

// ── small proofs of what a form holds ───────────────────────────────────────

export const looksLikeEmail = (text: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(text.trim());
export const looksLikeCode = (text: string) => /^\d{6}$/.test(text.trim());
