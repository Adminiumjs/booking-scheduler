/*
 * Page-local seed for the studio Settings screen (Admin comp logic 1103–1124).
 *
 * The *values* these describe already live on the store (`setName`, `setAddr`,
 * `setClosed`, `setWindow`, `setFee`, `setMsg`). What is here is the shape of
 * the form: which fields, which days, which options.
 */

import type { StoreState } from "../../state/store.ts";
import type { MessageKey } from "../../i18n/index.tsx";

/** Store keys the studio-details card writes to. Every one holds a string. */
export type StudioFieldKey = "setName" | "setAddr" | "setPhone" | "setEmail";

export interface StudioField {
  key: StudioFieldKey;
  /** Message key — the screen resolves it. See `admin-today.ts` on why. */
  labelKey: MessageKey;
  /** Name and address take the full width of the two-column field grid. */
  wide: boolean;
}

export const STUDIO_FIELDS: readonly StudioField[] = [
  { key: "setName", labelKey: "screensA.settings.fieldName", wide: true },
  { key: "setAddr", labelKey: "screensA.settings.fieldAddr", wide: true },
  { key: "setPhone", labelKey: "screensA.settings.fieldPhone", wide: false },
  { key: "setEmail", labelKey: "screensA.settings.fieldEmail", wide: false },
];

export interface OpeningHoursRow {
  /** JS day index — `setClosed` on the store is keyed by it, and the day's
   *  NAME is derived from it through `Intl`, never stored as text. */
  day: number;
  /** Opening time, minutes from midnight. */
  open: number;
  /** Closing time, minutes from midnight. */
  close: number;
}

/**
 * Monday first, the way a rota is read — Sunday closes the list.
 *
 * Times are minutes, not `"10:00 AM – 6:00 PM"`: whether the studio's day is
 * drawn on a 12- or 24-hour clock is the reader's locale's business, so the
 * screen runs these through `minutesToTime()`.
 */
export const OPENING_HOURS: readonly OpeningHoursRow[] = [
  { day: 1, open: 600, close: 1080 },
  { day: 2, open: 540, close: 1140 },
  { day: 3, open: 540, close: 1140 },
  { day: 4, open: 540, close: 1140 },
  { day: 5, open: 540, close: 1140 },
  { day: 6, open: 540, close: 1020 },
  { day: 0, open: 540, close: 1020 },
];

export interface PolicyOption {
  id: string;
  labelKey: MessageKey;
  /** Set when the label is a counted noun, so plurals select correctly. */
  count?: number;
}

export const CANCEL_WINDOWS: readonly PolicyOption[] = [
  { id: "12h", labelKey: "screensA.settings.winHours", count: 12 },
  { id: "24h", labelKey: "screensA.settings.winHours", count: 24 },
  { id: "48h", labelKey: "screensA.settings.winHours", count: 48 },
  { id: "none", labelKey: "screensA.settings.winNone" },
];

export const LATE_FEES: readonly PolicyOption[] = [
  { id: "0", labelKey: "screensA.settings.feeNone" },
  { id: "50", labelKey: "screensA.settings.feeHalf" },
  { id: "100", labelKey: "screensA.settings.feeFull" },
];

export interface AutoMessage {
  /** Key into `setMsg` on the store. */
  key: string;
  labelKey: MessageKey;
  subKey: MessageKey;
}

export const AUTO_MESSAGES: readonly AutoMessage[] = [
  {
    key: "remind",
    labelKey: "screensA.settings.msgRemind",
    subKey: "screensA.settings.msgRemindSub",
  },
  {
    key: "followup",
    labelKey: "screensA.settings.msgFollowup",
    subKey: "screensA.settings.msgFollowupSub",
  },
  {
    key: "rebook",
    labelKey: "screensA.settings.msgRebook",
    subKey: "screensA.settings.msgRebookSub",
  },
  {
    key: "birthday",
    labelKey: "screensA.settings.msgBirthday",
    subKey: "screensA.settings.msgBirthdaySub",
  },
];

/** Typed patch builder — keeps the field loop free of a cast. */
export function studioFieldPatch(
  key: StudioFieldKey,
  value: string,
): Partial<StoreState> {
  const patch: Partial<StoreState> = {};
  patch[key] = value;
  return patch;
}
