/*
 * Formatters (port spec §6.1).
 *
 * These were hand-rolled against en-US: literal `["Sunday", …]` name tables, a
 * 12-hour AM/PM clock, `$${n.toFixed(2)}`, and a pluraliser that appended "s".
 * Every one of those is a statement about English that stops being true in the
 * other seven locales the app now ships — a 12-hour clock is wrong in most of
 * them, `$` sits on the other side of the number in French, Arabic uses its own
 * digits, and Czech nouns have three plural forms.
 *
 * So the tables are gone and everything routes through `Intl`, bound to the
 * locale the provider is currently rendering. Two consequences worth knowing:
 *
 *   1. These functions are no longer pure — they read the active locale from
 *      `i18n/ambient`, which `<App>` republishes on every render. Before React
 *      mounts (and in the vitest suites) that is `en-US`, so module-scope
 *      callers and tests behave exactly as they did.
 *   2. Output is no longer byte-identical across environments the way a literal
 *      table was. It is instead *correct* per locale, which is the trade the
 *      i18n work is here to make.
 *
 * The machine-format helpers below the fold — `pad2`, `isoOf`, `parseISO` —
 * stay locale-independent on purpose: they produce keys and storage values,
 * not text a human reads.
 */

import { locale, money as ambientMoney, number as ambientNumber, t } from "../i18n/ambient.ts";
import type { StudioHoursRow } from "../data/types.ts";

/* ------------------------------------------------------------------ *
 * Memoised Intl instances
 *
 * Constructing an `Intl.*` formatter is the expensive part; formatting with
 * one is cheap. A busy screen calls `money()` a hundred times per render, so
 * the instances are cached per (locale, options) and thrown away implicitly
 * when the locale changes (the cache key carries the tag).
 * ------------------------------------------------------------------ */

const DTF_CACHE = new Map<string, Intl.DateTimeFormat>();
const NF_CACHE = new Map<string, Intl.NumberFormat>();
const RTF_CACHE = new Map<string, Intl.RelativeTimeFormat>();

function dtf(opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const tag = locale();
  const key = `${tag}|${JSON.stringify(opts)}`;
  let f = DTF_CACHE.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(tag, opts);
    DTF_CACHE.set(key, f);
  }
  return f;
}

function nf(opts: Intl.NumberFormatOptions): Intl.NumberFormat {
  const tag = locale();
  const key = `${tag}|${JSON.stringify(opts)}`;
  let f = NF_CACHE.get(key);
  if (!f) {
    f = new Intl.NumberFormat(tag, opts);
    NF_CACHE.set(key, f);
  }
  return f;
}

/* ------------------------------------------------------------------ *
 * Machine formats — deliberately locale-independent
 * ------------------------------------------------------------------ */

/** `7` → `'07'`. */
export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Local ISO day string, `YYYY-MM-DD`. Never UTC. A key, not a label. */
export function isoOf(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Parse a `YYYY-MM-DD` string at *local* midnight (avoids UTC drift). */
export function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

/* ------------------------------------------------------------------ *
 * Calendar names
 *
 * These replace the four `DOW_*` / `MONTH_*` literal tables. Callers used to
 * index an array (`DOW_LONG[d.getDay()]`); they now call a function with the
 * same index, so the call sites read almost identically.
 * ------------------------------------------------------------------ */

/* 2023-01-01 was a Sunday, so +index lands on the weekday with that `getDay()`. */
const WEEKDAY_EPOCH = new Date(2023, 0, 1);

/** `0` → `'Sunday'` / `'Sonntag'` / `'الأحد'`. Index is `Date.getDay()`. */
export function weekdayName(index: number, width: "long" | "short" = "long"): string {
  const d = new Date(WEEKDAY_EPOCH);
  d.setDate(WEEKDAY_EPOCH.getDate() + index);
  return dtf({ weekday: width }).format(d);
}

/** `0` → `'January'` / `'Januar'` / `'يناير'`. Index is `Date.getMonth()`. */
export function monthName(index: number, width: "long" | "short" = "long"): string {
  return dtf({ month: width }).format(new Date(2023, index, 1));
}

/* ------------------------------------------------------------------ *
 * Clock and dates
 * ------------------------------------------------------------------ */

/**
 * Minutes from midnight → a wall-clock label.
 *
 * `840` is `'2:00 PM'` in en-US, `'14:00'` in de-DE/fr-FR/cs-CZ/da-DK,
 * `'下午2:00'` in zh-CN and `'٢:٠٠ م'` in ar-EG. Whether the clock is 12- or
 * 24-hour is the locale's decision, not ours — which is precisely what the old
 * hardcoded `AM`/`PM` got wrong.
 */
export function minutesToTime(m: number): string {
  return dtf({ hour: "numeric", minute: "2-digit" }).format(new Date(2023, 0, 1, 0, m));
}

/** `'Wednesday, July 29'` — weekday and month spelled out. */
export function formatLongDate(d: Date): string {
  return dtf({ weekday: "long", month: "long", day: "numeric" }).format(d);
}

/** `'Wed, Jul 29'` — both abbreviated. */
export function formatShortDate(d: Date): string {
  return dtf({ weekday: "short", month: "short", day: "numeric" }).format(d);
}

/** `'Wednesday, Jul 29'` — the studio calendar's day heading. */
export function formatWeekdayDate(d: Date): string {
  return dtf({ weekday: "long", month: "short", day: "numeric" }).format(d);
}

/** `'Aug 14, 2026'` — used for gift delivery and package expiry. */
export function formatMediumDate(d: Date): string {
  return dtf({ year: "numeric", month: "short", day: "numeric" }).format(d);
}

/** `'2026-07-29'` → `'Wednesday, July 29'`. */
export function formatLongISO(iso: string): string {
  return formatLongDate(parseISO(iso));
}

/** `'2026-07-29'` → `'Wed, Jul 29'`. */
export function formatShortISO(iso: string): string {
  return formatShortDate(parseISO(iso));
}

/** `'2026-08-14'` → `'Aug 14, 2026'`. Empty- and garbage-safe. */
export function formatMediumISO(iso: string): string {
  if (!iso) return "";
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return formatMediumDate(d);
}

/**
 * One published trading day's hours: `'9:00 AM – 6:00 PM'`, or `'Closed'`.
 *
 * `formatRange` on a time-only formatter is what picks the separator and the
 * clock — 12-hour with a dash in en-US, 24-hour in de-DE, and the whole thing
 * mirrored in ar-EG. The row stores two minute counts precisely so that this
 * function, and not the seed, decides how they read.
 */
export function hoursLabel(row: StudioHoursRow): string {
  if (row.closed) return t("data.hours.closed");
  const f = dtf({ hour: "numeric", minute: "2-digit" });
  return f.formatRange(
    new Date(2023, 0, 1, 0, row.open),
    new Date(2023, 0, 1, 0, row.close),
  );
}

/**
 * `2, 'week'` → `'2 weeks ago'` / `'vor 2 Wochen'` / `'قبل أسبوعين'`.
 *
 * Review recency is demo fiction, so it is seeded as an offset rather than
 * computed — but `'2 weeks ago'` is a sentence in one language, and Arabic even
 * has a dual form for "two". `Intl.RelativeTimeFormat` is the only thing that
 * gets all eight right, and it needs a number and a unit, not a phrase.
 */
export function relativeAgo(value: number, unit: Intl.RelativeTimeFormatUnit): string {
  const tag = locale();
  const key = `${tag}|rtf`;
  let f = RTF_CACHE.get(key);
  if (!f) {
    f = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
    RTF_CACHE.set(key, f);
  }
  return f.format(-Math.abs(value), unit);
}

/** `'2026-07-14'` → `'July 2026'` — the order history's month headings. */
export function formatMonthYearISO(iso: string): string {
  return dtf({ year: "numeric", month: "long" }).format(parseISO(iso));
}

/**
 * `'2026-07-21'`, `'2026-07-27'` → `'Jul 21 – 27'`.
 *
 * `Intl.DateTimeFormat.formatRange` is what collapses the shared month, picks
 * the dash the locale uses and orders the two halves — all three of which a
 * hand-built `${a} – ${b}` gets wrong somewhere. Payroll periods and report
 * ranges both print one of these.
 */
export function formatISORange(fromISO: string, toISO: string): string {
  const from = parseISO(fromISO);
  const to = parseISO(toISO);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return "";
  return dtf({ month: "short", day: "numeric" }).formatRange(from, to);
}

/* ------------------------------------------------------------------ *
 * Money and numbers
 * ------------------------------------------------------------------ */

/**
 * `78` → `'$78.00'`.
 *
 * The currency stays USD because it is a property of the transaction — Lumen
 * Studio charges dollars whoever is reading. The *locale* still decides digit
 * grouping, the decimal separator, which side the symbol sits on and which
 * digits are used: `'78,00 $US'` in fr-FR, `'٧٨٫٠٠ US$'` in ar-EG.
 */
export function money(n: number, currency = "USD"): string {
  return ambientMoney(Number(n), currency);
}

/**
 * Whole dollars, grouped: `4820` → `'$4,820'`.
 *
 * The studio-side tables (payroll, reports, the calendar's lifetime-spend line)
 * want this rather than `money()`; two decimals in every cell is noise there.
 */
export function wholeMoney(n: number, currency = "USD"): string {
  return nf({
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

/** A bare count with the locale's grouping: `18420` → `'18,420'` / `'18 420'`. */
export function formatNumber(n: number, opts?: Intl.NumberFormatOptions): string {
  return ambientNumber(n, opts);
}

/* ------------------------------------------------------------------ *
 * Durations
 *
 * `Intl.NumberFormat`'s unit style translates the unit for us, so neither of
 * these needs a message key: `'60 min'` in en-US, `'60 Min.'` in de-DE,
 * `'٦٠ د'` in ar-EG.
 * ------------------------------------------------------------------ */

/** A single service's length: `60` → `'60 min'`. */
export function durationLabel(mins: number): string {
  return nf({ style: "unit", unit: "minute", unitDisplay: "short" }).format(mins);
}

/** A summed span: `150` → `'2h 30m'`, `45` → `'45 min'` (spec §6.11). */
export function spanLabel(mins: number): string {
  if (mins < 60) return durationLabel(mins);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const hours = nf({ style: "unit", unit: "hour", unitDisplay: "narrow" }).format(h);
  if (m === 0) return hours;
  const rest = nf({ style: "unit", unit: "minute", unitDisplay: "narrow" }).format(m);
  return `${hours} ${rest}`;
}

/* ------------------------------------------------------------------ *
 * Names and misc
 * ------------------------------------------------------------------ */

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

/**
 * `190` → `'+190 pts'`, `-200` → `'-200 pts'`.
 *
 * The sign comes from `Intl` rather than a hand-written `'+'`/`'−'`, and the
 * unit from a `|`-plural message key, because "pts" is not a word in seven of
 * the eight locales.
 */
export function pointsDelta(n: number): string {
  const value = nf({ signDisplay: "always" }).format(n);
  return t("format.pointsDelta", { value }, Math.abs(n));
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
