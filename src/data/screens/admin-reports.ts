/*
 * Page-local seed for the studio Reports screen (Admin comp logic 1235–1260).
 *
 * All of it is reporting fiction — aggregates that no other screen consumes —
 * so it stays beside the screen instead of widening the data seam.
 */

import type { MessageKey } from "../../i18n/index.tsx";

export interface ReportRange {
  id: string;
  labelKey: MessageKey;
  /** Fills `{count}` in the "last N days" labels. */
  days?: number;
  /** The date span printed beside the chart title, as two ISO days. */
  fromISO: string;
  toISO: string;
  /** What the headline figures are multiplied by. */
  multiplier: number;
  /** A gentler multiplier for the daily bars, so the shape stays readable. */
  chartScale: number;
}

export const REPORT_RANGES: readonly ReportRange[] = [
  {
    id: "7d",
    labelKey: "data.reports.rangeLastDays",
    days: 7,
    fromISO: "2026-07-21",
    toISO: "2026-07-27",
    multiplier: 1,
    chartScale: 1,
  },
  {
    id: "30d",
    labelKey: "data.reports.rangeLastDays",
    days: 30,
    fromISO: "2026-06-28",
    toISO: "2026-07-27",
    multiplier: 4.2,
    chartScale: 1.1,
  },
  {
    id: "qtr",
    labelKey: "data.reports.rangeQuarter",
    fromISO: "2026-04-01",
    toISO: "2026-07-27",
    multiplier: 12.6,
    chartScale: 1.2,
  },
];

export interface ReportKpiSeed {
  labelKey: MessageKey;
  /** Present when the figure scales with the range. */
  base?: number;
  /** Render `base` as whole dollars rather than a plain count. */
  money?: boolean;
  /** A rate that does not scale: whole dollars when `money`, else a fraction. */
  fixed?: number;
  /** Signed fraction — the sign picks the colour, `Intl` picks the glyph. */
  delta: number;
}

export const REPORT_KPIS: readonly ReportKpiSeed[] = [
  { labelKey: "data.reports.kpiRevenue", base: 4820, money: true, delta: 0.12 },
  { labelKey: "data.reports.kpiBookings", base: 58, delta: 0.06 },
  { labelKey: "data.reports.kpiAvgSpend", fixed: 83, money: true, delta: 0.04 },
  { labelKey: "data.reports.kpiRebookRate", fixed: 0.72, delta: -0.02 },
];

export interface RevenueDay {
  /** `Date.getDay()` — the bar's label is spelled by `weekdayName()`. */
  day: number;
  /** Takings for that day of a normal week, whole dollars. */
  value: number;
}

export const REVENUE_SERIES: readonly RevenueDay[] = [
  { day: 1, value: 520 },
  { day: 2, value: 760 },
  { day: 3, value: 910 },
  { day: 4, value: 640 },
  { day: 5, value: 1080 },
  { day: 6, value: 1240 },
  { day: 0, value: 430 },
];

export interface RevenueMixRow {
  labelKey: MessageKey;
  /** Takings for a normal week, whole dollars. */
  value: number;
  tint: string;
}

export const REVENUE_MIX: readonly RevenueMixRow[] = [
  { labelKey: "data.reports.mixHair", value: 2480, tint: "#b07d9a" },
  { labelKey: "data.reports.mixSpa", value: 1240, tint: "#6f8bb0" },
  { labelKey: "data.reports.mixNails", value: 640, tint: "#c08a6a" },
  { labelKey: "data.reports.mixMovement", value: 280, tint: "#7d9166" },
  { labelKey: "data.reports.mixRetail", value: 180, tint: "#b58a6a" },
];

export interface TopClient {
  name: string;
  initials: string;
  visits: number;
  /** Who they usually see. */
  staff: string;
  /** Lifetime spend, whole dollars. */
  spend: number;
  tint: string;
}

/** The four biggest spenders on the studio's client list, already ranked. */
export const TOP_CLIENTS: readonly TopClient[] = [
  { name: "Priya Sharma", initials: "PS", visits: 8, staff: "Elin", spend: 1240, tint: "#9a7fb0" },
  { name: "Hannah Wills", initials: "HW", visits: 9, staff: "Noor", spend: 1105, tint: "#8a9a6a" },
  { name: "Ava Reyes", initials: "AR", visits: 12, staff: "Elin", spend: 973, tint: "#b07d9a" },
  { name: "Theo Kim", initials: "TK", visits: 22, staff: "Marco", spend: 940, tint: "#6a86ab" },
];
