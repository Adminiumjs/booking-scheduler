/*
 * Page-local seed for the data-export screen.
 *
 * The counts are the demo's own history, not derived from `store.bookings` —
 * the comp exports "everything we hold about you", which is a wider set than
 * the handful of bookings this session happens to have made.
 */

/** How long the fake generation run takes, in ms. */
export const EXPORT_DELAY_MS = 1100;

/**
 * The end of the demo's window. The seeded data stops here, so every preset
 * range ends on the same day rather than on the real "today".
 */
export const EXPORT_END_ISO = "2026-07-27";

import type { MessageKey } from "../../i18n/index.tsx";

export interface ExportInclude {
  key: string;
  labelKey: MessageKey;
  subKey: MessageKey;
  /** Rows this section contributes to the file. */
  count: number;
}

export const EXPORT_INCLUDES: readonly ExportInclude[] = [
  {
    key: "visits",
    labelKey: "data.export.incVisits",
    subKey: "data.export.incVisitsSub",
    count: 12,
  },
  {
    key: "packages",
    labelKey: "data.export.incPackages",
    subKey: "data.export.incPackagesSub",
    count: 3,
  },
  {
    key: "gifts",
    labelKey: "data.export.incGifts",
    subKey: "data.export.incGiftsSub",
    count: 1,
  },
  {
    key: "products",
    labelKey: "data.export.incOrders",
    subKey: "data.export.incOrdersSub",
    count: 4,
  },
];

export interface ExportFormat {
  id: string;
  /**
   * A file-format badge, never translated: CSV is CSV in every language, and
   * the string doubles as the extension in the generated filename.
   */
  label: string;
  /** Also the middle segment of the file's meta line, lower-cased. */
  subKey: MessageKey;
  icon: string;
}

export const EXPORT_FORMATS: readonly ExportFormat[] = [
  { id: "csv", label: "CSV", subKey: "data.export.fmtSpreadsheet", icon: "file-spreadsheet" },
  { id: "pdf", label: "PDF", subKey: "data.export.fmtPrintable", icon: "file-text" },
  { id: "ics", label: "ICS", subKey: "data.export.fmtCalendar", icon: "calendar" },
];

export interface ExportRange {
  id: string;
  labelKey: MessageKey;
  /** Fills `{count}` in the "last N months" label. */
  months?: number;
  /** Start date the preset jumps to; `null` keeps whatever is in the field. */
  from: string | null;
}

export const EXPORT_RANGES: readonly ExportRange[] = [
  { id: "ytd", labelKey: "data.export.rangeYear", from: "2026-01-01" },
  { id: "12m", labelKey: "data.export.rangeLastMonths", months: 12, from: "2025-07-27" },
  { id: "all", labelKey: "data.export.rangeAll", from: "2023-04-02" },
  { id: "custom", labelKey: "data.export.rangeCustom", from: null },
];

/**
 * The grey line under a generated file. Three slots rather than three glued
 * fragments — `{date}`, `{count}` (already a counted noun) and `{size}`.
 */
export const HISTORY_META_KEY: MessageKey = "data.export.historyMeta";

/** File size: `t(SIZE_KB_KEY, { n: formatNumber(row.kb) })`. */
export const SIZE_KB_KEY: MessageKey = "data.export.sizeKb";

export interface ExportHistoryRow {
  /** A generated filename — a machine token, not a label. */
  file: string;
  /** `YYYY-MM-DD` the file was produced. */
  dateISO: string;
  /** How many things are inside, and what kind of thing they are. */
  count: number;
  countKey: MessageKey;
  /** File size in kilobytes. */
  kb: number;
  icon: string;
}

/** Files the client "generated" before this session. */
export const EXPORT_HISTORY: readonly ExportHistoryRow[] = [
  {
    file: "lumen-bookings-2025.csv",
    dateISO: "2026-01-02",
    count: 24,
    countKey: "data.export.rows",
    kb: 14,
    icon: "file-spreadsheet",
  },
  {
    file: "lumen-receipts-q4.pdf",
    dateISO: "2025-10-04",
    count: 9,
    countKey: "data.export.rows",
    kb: 210,
    icon: "file-text",
  },
  {
    file: "lumen-visits.ics",
    dateISO: "2025-08-19",
    count: 6,
    countKey: "data.export.events",
    kb: 4,
    icon: "calendar",
  },
];
