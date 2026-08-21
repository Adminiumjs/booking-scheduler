/*
 * Page-local seed for the studio Payroll screen (Admin comp logic 1083–1101).
 *
 * One row per specialist, quoted for a normal week; longer periods are that
 * week multiplied. `staffId` points into the staff seam so the name, initials
 * and tint stay in one place — the comp duplicated them here and the two lists
 * could drift.
 */

import type { MessageKey } from "../../i18n/index.tsx";

export interface PayrollSeed {
  /** An id from `data.getStaff()`. */
  staffId: string;
  /** Hours worked in a normal week. */
  hours: number;
  /** Service revenue they booked in a normal week, whole dollars. */
  services: number;
  /**
   * How they are paid — the grey line under the name. A key plus its numbers,
   * because `'45% commission'` and `'$32/hr + 10%'` are both a percentage, a
   * currency and a word order that every locale writes its own way.
   */
  rateKey: MessageKey;
  /** Fills `{share}` — a fraction, rendered as a percent. */
  share?: number;
  /** Fills `{hourly}` — whole dollars an hour. */
  hourly?: number;
  /** Commission share of `services`. */
  pct: number;
  /** Their cut of the pooled tips in a normal week. */
  tips: number;
}

/*
 * The comp's colour specialist was "Selma"; the shipped app calls her Elin and
 * keeps Selma Okonjo as the owner signed into the studio half, so the row is
 * keyed on `elin`.
 */
export const PAYROLL: readonly PayrollSeed[] = [
  {
    staffId: "elin",
    hours: 38,
    services: 4820,
    rateKey: "data.payroll.rateCommission",
    share: 0.45,
    pct: 0.45,
    tips: 312,
  },
  {
    staffId: "noor",
    hours: 24,
    services: 2640,
    rateKey: "data.payroll.rateCommission",
    share: 0.42,
    pct: 0.42,
    tips: 198,
  },
  {
    staffId: "ivy",
    hours: 32,
    services: 1980,
    rateKey: "data.payroll.rateCommission",
    share: 0.4,
    pct: 0.4,
    tips: 264,
  },
  {
    staffId: "marco",
    hours: 20,
    services: 920,
    rateKey: "data.payroll.rateHourlyPlus",
    hourly: 32,
    share: 0.1,
    pct: 0.1,
    tips: 86,
  },
];

export interface PayPeriod {
  id: string;
  labelKey: MessageKey;
  /**
   * The span printed at the end of the toolbar once the period is picked.
   * Demo fiction, and a date range, so it is stored as two ISO days and
   * spelled by the screen through `Intl` rather than shipped as `'Jul 21 – 27'`.
   */
  fromISO: string;
  toISO: string;
  /** What a normal week is multiplied by. */
  multiplier: number;
}

/**
 * The wage-to-revenue ratio the studio aims to stay under, as a fraction.
 *
 * A number rather than the `'45%'` that used to sit inside the caption: the
 * glyph, its side and the digits are all the reader's — ar-EG writes `٪٤٥`.
 */
export const WAGE_TARGET = 0.45;

export const PAY_PERIODS: readonly PayPeriod[] = [
  {
    id: "week",
    labelKey: "data.payroll.periodWeek",
    fromISO: "2026-07-21",
    toISO: "2026-07-27",
    multiplier: 1,
  },
  {
    id: "fort",
    labelKey: "data.payroll.periodFortnight",
    fromISO: "2026-07-07",
    toISO: "2026-07-20",
    multiplier: 2,
  },
  {
    id: "month",
    labelKey: "data.payroll.periodMonth",
    fromISO: "2026-07-01",
    toISO: "2026-07-31",
    multiplier: 4.3,
  },
];
