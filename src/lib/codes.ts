/*
 * Booking / group / gift code generation (port spec §6.5, §6.9; ruling R7).
 *
 * - Booking + group codes share one monotonic counter that starts at 1043,
 *   so the first in-session booking is SLM-1043 (the seeds are SLM-1039 and
 *   SLM-1041).
 * - Gift codes keep the comp's hash flavour but are made collision-free: the
 *   hash picks a starting point in GIFT-1000..GIFT-9999 and we linearly probe
 *   until we find one that is not already taken (the seeded GIFT-4821
 *   included).
 */

/** The comp's string hash: `n = (n * 31 + charCode) >>> 0`. */
export function hash(input: string): number {
  const s = String(input);
  let n = 0;
  for (let i = 0; i < s.length; i += 1) n = (n * 31 + s.charCodeAt(i)) >>> 0;
  return n;
}

/** The first code the in-session counter hands out. */
export const FIRST_CODE_NUMBER = 1043;

export const BOOKING_PREFIX = "SLM";
export const GROUP_PREFIX = "GRP";
export const GIFT_PREFIX = "GIFT";

/** `1043` → `'SLM-1043'`. */
export function bookingCode(n: number): string {
  return `${BOOKING_PREFIX}-${n}`;
}

/** `1043` → `'GRP-1043'`. */
export function groupCode(n: number): string {
  return `${GROUP_PREFIX}-${n}`;
}

const GIFT_MIN = 1000;
const GIFT_SPAN = 9000; // 1000..9999

/**
 * A gift code that is guaranteed not to collide with anything in `taken`.
 *
 * @param seed  Anything stable about the purchase (recipient, e-mail, amount).
 * @param taken Codes already issued — pass every code in `store.gifts`.
 */
export function giftCode(seed: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  let n = GIFT_MIN + (hash(`g${seed}`) % GIFT_SPAN);
  for (let i = 0; i < GIFT_SPAN; i += 1) {
    const code = `${GIFT_PREFIX}-${n}`;
    if (!used.has(code)) return code;
    n = n >= GIFT_MIN + GIFT_SPAN - 1 ? GIFT_MIN : n + 1;
  }
  /* istanbul ignore next — needs 9000 live gift cards in one session. */
  return `${GIFT_PREFIX}-${n}`;
}
