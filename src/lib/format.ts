/*
 * Formatters (port spec §6.1). Pure, side-effect free, locale-independent —
 * the comp hand-rolled every one of these rather than using Intl, and the
 * port keeps that so the output is byte-identical in every environment.
 */

export const DOW_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DOW_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export const MONTH_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** `7` → `'07'`. */
export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Local ISO day string, `YYYY-MM-DD`. Never UTC. */
export function isoOf(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Parse a `YYYY-MM-DD` string at *local* midnight (avoids UTC drift). */
export function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

/** `78` → `'$78.00'`. Always two decimals (spec §4 / ruling R9). */
export function money(n: number): string {
  return `$${Number(n).toFixed(2)}`;
}

/** Minutes from midnight → `'2:00 PM'`. */
export function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ap = h < 12 ? "AM" : "PM";
  const hh = h % 12 || 12;
  return `${hh}:${pad2(mm)} ${ap}`;
}

/** `'Wednesday, July 29'`. */
export function formatLongDate(d: Date): string {
  return `${DOW_LONG[d.getDay()]}, ${MONTH_LONG[d.getMonth()]} ${d.getDate()}`;
}

/** `'Wed, Jul 29'`. */
export function formatShortDate(d: Date): string {
  return `${DOW_SHORT[d.getDay()]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

/** `'2026-07-29'` → `'Wednesday, July 29'`. */
export function formatLongISO(iso: string): string {
  return formatLongDate(parseISO(iso));
}

/** `'2026-07-29'` → `'Wed, Jul 29'`. */
export function formatShortISO(iso: string): string {
  return formatShortDate(parseISO(iso));
}

/** `'2026-08-14'` → `'Aug 14, 2026'` (used for scheduled gift delivery). */
export function formatMediumISO(iso: string): string {
  if (!iso) return "";
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** A single service's length: `60` → `'60 min'`. */
export function durationLabel(mins: number): string {
  return `${mins} min`;
}

/** A summed span: `150` → `'2h 30m'`, `45` → `'45 min'` (spec §6.11). */
export function spanLabel(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

/** `'Ava Reyes'` → `'Ava'`. Empty-safe. */
export function firstName(full: string): string {
  return (full || "").trim().split(/\s+/)[0] || "";
}

/** `'Jordan P.'` → `'JP'` (fixes the comp's full-name-in-an-avatar bug). */
export function initialsOf(full: string): string {
  const parts = (full || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const letters = parts.slice(0, 2).map((p) => p.replace(/[^A-Za-z]/g, "")[0]);
  const out = letters.filter(Boolean).join("");
  return (out || parts[0][0] || "?").toUpperCase();
}

/** `190` → `'+190 pts'`, `-200` → `'−200 pts'` (U+2212 minus). */
export function pointsDelta(n: number): string {
  return `${n >= 0 ? "+" : "−"}${Math.abs(n)} pts`;
}

/** Naive pluraliser, matching the comp's copy: `1 → '1 visit'`. */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Convert a hex colour to `rgba()` at the given alpha. */
export function hexToRgba(hex: string, alpha: number): string {
  const h = (hex || "").replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full || "000000", 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** The e-mail shape the comp validated with; exported so screens agree. */
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isValidEmail(v: string): boolean {
  return EMAIL_RE.test((v || "").trim());
}

/** At least seven digits, ignoring punctuation. */
export function isValidPhone(v: string): boolean {
  return (v || "").replace(/\D/g, "").length >= 7;
}
