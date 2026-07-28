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

export interface ExportInclude {
  key: string;
  label: string;
  sub: string;
  /** Rows this section contributes to the file. */
  count: number;
}

export const EXPORT_INCLUDES: readonly ExportInclude[] = [
  {
    key: "visits",
    label: "Appointments",
    sub: "Every booked, completed and cancelled visit",
    count: 12,
  },
  {
    key: "packages",
    label: "Packages & sessions",
    sub: "Purchases and each session used",
    count: 3,
  },
  { key: "gifts", label: "Gift cards", sub: "Bought and redeemed", count: 1 },
  {
    key: "products",
    label: "Retail orders",
    sub: "Anything off the shelf",
    count: 4,
  },
];

export interface ExportFormat {
  id: string;
  label: string;
  /** Also the middle segment of the file's meta line, lower-cased. */
  sub: string;
  icon: string;
}

export const EXPORT_FORMATS: readonly ExportFormat[] = [
  { id: "csv", label: "CSV", sub: "Spreadsheet", icon: "file-spreadsheet" },
  { id: "pdf", label: "PDF", sub: "Printable", icon: "file-text" },
  { id: "ics", label: "ICS", sub: "Calendar", icon: "calendar" },
];

export interface ExportRange {
  id: string;
  label: string;
  /** Start date the preset jumps to; `null` keeps whatever is in the field. */
  from: string | null;
}

export const EXPORT_RANGES: readonly ExportRange[] = [
  { id: "ytd", label: "This year", from: "2026-01-01" },
  { id: "12m", label: "Last 12 months", from: "2025-07-27" },
  { id: "all", label: "Everything", from: "2023-04-02" },
  { id: "custom", label: "Custom", from: null },
];

export interface ExportHistoryRow {
  file: string;
  meta: string;
  icon: string;
}

/** Files the client "generated" before this session. */
export const EXPORT_HISTORY: readonly ExportHistoryRow[] = [
  {
    file: "lumen-bookings-2025.csv",
    meta: "Jan 2, 2026 · 24 rows · 14 KB",
    icon: "file-spreadsheet",
  },
  {
    file: "lumen-receipts-q4.pdf",
    meta: "Oct 4, 2025 · 9 rows · 210 KB",
    icon: "file-text",
  },
  {
    file: "lumen-visits.ics",
    meta: "Aug 19, 2025 · 6 events · 4 KB",
    icon: "calendar",
  },
];
