/*
 * Page-local seed for the studio Reports screen (Admin comp logic 1235–1260).
 *
 * All of it is reporting fiction — aggregates that no other screen consumes —
 * so it stays beside the screen instead of widening the data seam.
 */

export interface ReportRange {
  id: string;
  label: string;
  /** The date span printed beside the chart title. */
  range: string;
  /** What the headline figures are multiplied by. */
  multiplier: number;
  /** A gentler multiplier for the daily bars, so the shape stays readable. */
  chartScale: number;
}

export const REPORT_RANGES: readonly ReportRange[] = [
  { id: "7d", label: "Last 7 days", range: "Jul 21 – Jul 27", multiplier: 1, chartScale: 1 },
  { id: "30d", label: "Last 30 days", range: "Jun 28 – Jul 27", multiplier: 4.2, chartScale: 1.1 },
  { id: "qtr", label: "This quarter", range: "Apr 1 – Jul 27", multiplier: 12.6, chartScale: 1.2 },
];

export interface ReportKpiSeed {
  label: string;
  /** Present when the figure scales with the range. */
  base?: number;
  /** Render `base` as whole dollars rather than a plain count. */
  money?: boolean;
  /** Present when the figure is a rate and does not scale. */
  fixed?: string;
  /** Signed percentage; the sign picks the colour. */
  delta: string;
}

export const REPORT_KPIS: readonly ReportKpiSeed[] = [
  { label: "Revenue", base: 4820, money: true, delta: "+12%" },
  { label: "Bookings", base: 58, delta: "+6%" },
  { label: "Average spend", fixed: "$83", delta: "+4%" },
  { label: "Rebook rate", fixed: "72%", delta: "−2%" },
];

export interface RevenueDay {
  day: string;
  /** Takings for that day of a normal week, whole dollars. */
  value: number;
}

export const REVENUE_SERIES: readonly RevenueDay[] = [
  { day: "Mon", value: 520 },
  { day: "Tue", value: 760 },
  { day: "Wed", value: 910 },
  { day: "Thu", value: 640 },
  { day: "Fri", value: 1080 },
  { day: "Sat", value: 1240 },
  { day: "Sun", value: 430 },
];

export interface RevenueMixRow {
  label: string;
  /** Takings for a normal week, whole dollars. */
  value: number;
  tint: string;
}

export const REVENUE_MIX: readonly RevenueMixRow[] = [
  { label: "Hair & colour", value: 2480, tint: "#b07d9a" },
  { label: "Spa & skin", value: 1240, tint: "#6f8bb0" },
  { label: "Nails", value: 640, tint: "#c08a6a" },
  { label: "Movement", value: 280, tint: "#7d9166" },
  { label: "Retail", value: 180, tint: "#b58a6a" },
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
