/**
 * Days, times and money on the customer's pages.
 *
 * Every day and time is the studio's, from the zone Adminium names, never the
 * browser's: a guest in another city must see the time they will walk in.
 * Money is whole while it is whole ($78), with its cents when it has them.
 */
import { fromTenantLocal, toTenantDay, toTenantMinutes } from "@adminiumjs/public-client";

export interface Clock {
  locale: string;
  timezone: string;
  currency: string;
}

/** Noon on a day, so a day's name never slips across a zone or a change of the clocks. */
const noon = (day: string) => new Date(`${day}T12:00:00Z`);

const dayFormat = (c: Clock, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(c.locale, { timeZone: "UTC", ...options });

/** "Thu 17 Sep" in the page's language. */
export function fmtDay(c: Clock, day: string): string {
  const d = noon(day);
  if (c.locale.startsWith("en")) {
    const weekday = dayFormat(c, { weekday: "short" }).format(d);
    const month = dayFormat(c, { month: "short" }).format(d);
    return `${weekday} ${String(d.getUTCDate())} ${month}`;
  }
  return dayFormat(c, { weekday: "short", day: "numeric", month: "short" }).format(d);
}

/** "Tue 10 Aug 2027". */
export function fmtDayYear(c: Clock, day: string): string {
  const d = noon(day);
  if (c.locale.startsWith("en")) return `${fmtDay(c, day)} ${String(d.getUTCFullYear())}`;
  return dayFormat(c, { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(d);
}

export const weekdayShort = (c: Clock, day: string) => dayFormat(c, { weekday: "short" }).format(noon(day));
export const dayNumber = (c: Clock, day: string) => dayFormat(c, { day: "numeric" }).format(noon(day));
export const monthShort = (c: Clock, day: string) => dayFormat(c, { month: "short" }).format(noon(day));

const minuteDate = (minutes: number) => new Date(Date.UTC(2026, 0, 5, Math.floor(minutes / 60), minutes % 60));

/** "10 AM", "1:30 PM"; a 24-hour clock where the language writes one. */
export function fmtTime(c: Clock, minutes: number): string {
  const whole = minutes % 60 === 0;
  const text = new Intl.DateTimeFormat(c.locale, { timeZone: "UTC", hour: "numeric", ...(whole && c.locale.startsWith("en") ? {} : { minute: "2-digit" }) }).format(minuteDate(minutes));
  return text.replace(/ /g, " ");
}

const meridiem = (text: string) => /\s(AM|PM)$/.exec(text)?.[1] ?? null;

/** "10–11 AM", "10:30 AM–12 PM". */
export function fmtRange(c: Clock, from: number, to: number): string {
  const a = fmtTime(c, from);
  const b = fmtTime(c, to);
  const am = meridiem(a);
  if (am !== null && am === meridiem(b)) return `${a.slice(0, -3)}–${b}`;
  return `${a}–${b}`;
}

/** The studio's day of a moment. */
export const dayOf = (c: Clock, iso: string) => toTenantDay(iso, c.timezone);
/** The studio's minutes from midnight of a moment. */
export const minutesOf = (c: Clock, iso: string) => toTenantMinutes(iso, c.timezone);
/** The moment of a time on the studio's clock. */
export const momentOf = (c: Clock, day: string, minutes: number) => fromTenantLocal(day, minutes, c.timezone);

/** "Wed 16 Sep, 10 AM". */
export const fmtMoment = (c: Clock, iso: string) => `${fmtDay(c, dayOf(c, iso))}, ${fmtTime(c, minutesOf(c, iso))}`;

/** "Thu 17 Sep · 10–11 AM". */
export const fmtWhen = (c: Clock, iso: string, length: number) => {
  const from = minutesOf(c, iso);
  return `${fmtDay(c, dayOf(c, iso))} · ${fmtRange(c, from, from + length)}`;
};

/** "$78", "$78.50". */
export function fmtMoney(c: Clock, value: unknown): string {
  const n = Number(value ?? 0);
  const whole = Number.isInteger(n);
  return new Intl.NumberFormat(c.locale, { style: "currency", currency: c.currency, minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(Number.isFinite(n) ? n : 0);
}

/** The next day, as text. */
export function addDays(day: string, n: number): string {
  const d = noon(day);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export const weekdayOf = (day: string): Weekday => WEEKDAYS[noon(day).getUTCDay()]!;

/** "09:00" as minutes. */
export function hhmm(text: unknown): number {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(text ?? ""));
  return m === null ? 0 : Number(m[1]) * 60 + Number(m[2]);
}

/** A name's first word, for "You're booked, Ava." */
export const firstName = (name: unknown) => String(name ?? "").trim().split(/\s+/)[0] ?? "";

/** Two letters for an avatar. */
export const initials = (name: unknown) =>
  String(name ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
