/*
 * Page-local seed for the notification-preferences screen.
 *
 * The rows are a description of the preference form, not records — the values
 * they toggle live on `store.np`.
 */

import type { NotifPrefs } from "../types.ts";

/** The three delivery channels, which are booleans on `NotifPrefs` itself. */
export type NotifChannel = Extract<keyof NotifPrefs, "email" | "sms" | "push">;

export interface PrefRowSpec<K extends string = string> {
  key: K;
  label: string;
  sub: string;
  icon: string;
}

export const NOTIF_CHANNELS: readonly PrefRowSpec<NotifChannel>[] = [
  {
    key: "email",
    label: "Email",
    sub: "Receipts, confirmations and the monthly letter.",
    icon: "mail",
  },
  {
    key: "sms",
    label: "Text message",
    sub: "Short reminders and waitlist openings.",
    icon: "message-square",
  },
  /* The comp asks for `bell-ring`, which the registry does not carry. */
  {
    key: "push",
    label: "Push",
    sub: "Browser alerts the moment a spot frees up.",
    icon: "bell",
  },
];

/** The six opt-in categories — keys of the `NotifPrefs.cat` map. */
export const NOTIF_CATEGORIES: readonly PrefRowSpec[] = [
  {
    key: "reminders",
    label: "Appointment reminders",
    sub: "A nudge before every visit.",
    icon: "calendar-clock",
  },
  {
    key: "waitlist",
    label: "Waitlist openings",
    sub: "The moment a spot frees up.",
    icon: "bell-plus",
  },
  {
    key: "loyalty",
    label: "Points & rewards",
    sub: "When you earn or unlock something.",
    icon: "gem",
  },
  {
    key: "packages",
    label: "Package updates",
    sub: "Sessions used and expiry warnings.",
    icon: "layers",
  },
  {
    key: "journal",
    label: "New journal posts",
    sub: "One short note when we publish.",
    icon: "book-open",
  },
  {
    key: "offers",
    label: "Offers & promotions",
    sub: "Occasional seasonal deals.",
    icon: "tag",
  },
];

/** `NotifPrefs.when` — how far ahead of a visit the reminder goes out. */
export const NOTIF_WHEN_OPTIONS = [
  { value: "24h", label: "24h before" },
  { value: "2h", label: "2h before" },
  { value: "both", label: "Both" },
] as const;

/** `NotifPrefs.quietWin` — which hours are held back. */
export const NOTIF_QUIET_OPTIONS = [
  { value: "10p8a", label: "10 PM – 8 AM" },
  { value: "9p7a", label: "9 PM – 7 AM" },
  { value: "weekends", label: "Weekends too" },
] as const;
