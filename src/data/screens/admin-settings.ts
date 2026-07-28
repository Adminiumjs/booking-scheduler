/*
 * Page-local seed for the studio Settings screen (Admin comp logic 1103–1124).
 *
 * The *values* these describe already live on the store (`setName`, `setAddr`,
 * `setClosed`, `setWindow`, `setFee`, `setMsg`). What is here is the shape of
 * the form: which fields, which days, which options.
 */

import type { StoreState } from "../../state/store.ts";

/** Store keys the studio-details card writes to. Every one holds a string. */
export type StudioFieldKey = "setName" | "setAddr" | "setPhone" | "setEmail";

export interface StudioField {
  key: StudioFieldKey;
  label: string;
  /** Name and address take the full width of the two-column field grid. */
  wide: boolean;
}

export const STUDIO_FIELDS: readonly StudioField[] = [
  { key: "setName", label: "Studio name", wide: true },
  { key: "setAddr", label: "Address", wide: true },
  { key: "setPhone", label: "Phone", wide: false },
  { key: "setEmail", label: "Email", wide: false },
];

export interface OpeningHoursRow {
  /** JS day index — `setClosed` on the store is keyed by it. */
  day: number;
  label: string;
  /** The hours kept while the day is open. */
  hours: string;
}

/** Monday first, the way a rota is read — Sunday closes the list. */
export const OPENING_HOURS: readonly OpeningHoursRow[] = [
  { day: 1, label: "Monday", hours: "10:00 AM – 6:00 PM" },
  { day: 2, label: "Tuesday", hours: "9:00 AM – 7:00 PM" },
  { day: 3, label: "Wednesday", hours: "9:00 AM – 7:00 PM" },
  { day: 4, label: "Thursday", hours: "9:00 AM – 7:00 PM" },
  { day: 5, label: "Friday", hours: "9:00 AM – 7:00 PM" },
  { day: 6, label: "Saturday", hours: "9:00 AM – 5:00 PM" },
  { day: 0, label: "Sunday", hours: "9:00 AM – 5:00 PM" },
];

export interface PolicyOption {
  id: string;
  label: string;
}

export const CANCEL_WINDOWS: readonly PolicyOption[] = [
  { id: "12h", label: "12 hours" },
  { id: "24h", label: "24 hours" },
  { id: "48h", label: "48 hours" },
  { id: "none", label: "No window" },
];

export const LATE_FEES: readonly PolicyOption[] = [
  { id: "0", label: "No fee" },
  { id: "50", label: "50% of the service" },
  { id: "100", label: "Full price" },
];

export interface AutoMessage {
  /** Key into `setMsg` on the store. */
  key: string;
  label: string;
  sub: string;
}

export const AUTO_MESSAGES: readonly AutoMessage[] = [
  { key: "remind", label: "Booking reminder", sub: "Text the morning of the visit" },
  { key: "followup", label: "Follow-up", sub: "Ask how it went, two days later" },
  { key: "rebook", label: "Rebook nudge", sub: "Six weeks after a colour service" },
  { key: "birthday", label: "Birthday note", sub: "A small gift code on the day" },
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
