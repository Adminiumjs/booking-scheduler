/*
 * Page-local seed for the studio Payroll screen (Admin comp logic 1083–1101).
 *
 * One row per specialist, quoted for a normal week; longer periods are that
 * week multiplied. `staffId` points into the staff seam so the name, initials
 * and tint stay in one place — the comp duplicated them here and the two lists
 * could drift.
 */

export interface PayrollSeed {
  /** An id from `data.getStaff()`. */
  staffId: string;
  /** Hours worked in a normal week. */
  hours: number;
  /** Service revenue they booked in a normal week, whole dollars. */
  services: number;
  /** How they are paid — the grey line under the name. */
  rate: string;
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
  { staffId: "elin", hours: 38, services: 4820, rate: "45% commission", pct: 0.45, tips: 312 },
  { staffId: "noor", hours: 24, services: 2640, rate: "42% commission", pct: 0.42, tips: 198 },
  { staffId: "ivy", hours: 32, services: 1980, rate: "40% commission", pct: 0.4, tips: 264 },
  { staffId: "marco", hours: 20, services: 920, rate: "$32/hr + 10%", pct: 0.1, tips: 86 },
];

export interface PayPeriod {
  id: string;
  label: string;
  /** Shown at the end of the toolbar once the period is picked. */
  range: string;
  /** What a normal week is multiplied by. */
  multiplier: number;
}

export const PAY_PERIODS: readonly PayPeriod[] = [
  { id: "week", label: "This week", range: "Jul 21 – 27", multiplier: 1 },
  { id: "fort", label: "Last fortnight", range: "Jul 7 – 20", multiplier: 2 },
  { id: "month", label: "This month", range: "July 2026", multiplier: 4.3 },
];
