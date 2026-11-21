/**
 * How the desk writes money, days and times: in the reader's language, on the
 * studio's clock (the connection's zone, never the device's). Money is whole
 * dollars when it is whole (BN-06). Every value is one Adminium stored.
 */
import { useMemo } from "react";

import { useI18n } from "../i18n/index.tsx";
import { useEnv } from "./env.tsx";
import { instantOf } from "./time.ts";
import { num, text } from "./wire.ts";

export interface Fmt {
  money(value: unknown): string;
  /** "Tue 15 Sep", from a day or a moment on the studio's clock. */
  day(value: unknown): string;
  /** "10 AM", "1:30 PM", from a moment or an `HH:MM`. */
  time(value: unknown): string;
  /** "10–11 AM", "9 AM–5 PM". */
  range(from: unknown, to: unknown): string;
  dayTime(value: unknown): string;
  number(value: number): string;
}

const DAY_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const CLOCK = /^\d{2}:\d{2}$/;

export function makeFmt(locale: string, zone: string, currency: string): Fmt {
  const whole = new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const cents = new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const numF = new Intl.NumberFormat(locale);
  const dayF = (timeZone: string) => new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone });
  const isEn = locale.startsWith("en");
  const hourF = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: zone, ...(isEn ? { hour12: true } : {}) });
  const spellDay = (date: Date, timeZone: string): string => {
    const f = dayF(timeZone);
    if (!isEn) return f.format(date);
    const parts = f.formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
    return `${get("weekday")} ${get("day")} ${get("month")}`;
  };
  const instant = (value: unknown): Date | null => {
    if (typeof value === "number") return new Date(value);
    const t = text(value);
    if (t === null) return null;
    if (CLOCK.test(t)) return new Date(instantOf("2026-01-15", t, zone));
    const at = Date.parse(t);
    return Number.isNaN(at) ? null : new Date(at);
  };
  /** English drops ":00" ("10 AM"); other languages keep their own form. */
  const time = (value: unknown): string => {
    const at = instant(value);
    if (at === null) return "";
    const spelled = hourF.format(at).replace(/ /g, " ");
    return isEn ? spelled.replace(":00", "") : spelled;
  };
  return {
    money(value) {
      const n = num(value);
      if (n === null) return "";
      return Number.isInteger(n) ? whole.format(n) : cents.format(n);
    },
    day(value) {
      const t = text(value);
      if (t === null && typeof value !== "number") return "";
      if (t !== null && DAY_ONLY.test(t)) return spellDay(new Date(`${t}T12:00:00Z`), "UTC");
      const at = instant(value);
      return at === null ? "" : spellDay(at, zone);
    },
    time,
    range(from, to) {
      const a = time(from);
      const b = time(to);
      if (!isEn) return `${a}–${b}`;
      const sameHalf = a.slice(-2) === b.slice(-2);
      return `${sameHalf ? a.slice(0, -3) : a}–${b}`;
    },
    dayTime(value) {
      const at = instant(value);
      return at === null ? "" : `${spellDay(at, zone)}, ${time(at.getTime())}`;
    },
    number: (value) => numF.format(value),
  };
}

export function useFmt(): Fmt {
  const { locale } = useI18n();
  const { door } = useEnv();
  const { zone, currency } = door.facts();
  return useMemo(() => makeFmt(locale, zone, currency), [locale, zone, currency]);
}
