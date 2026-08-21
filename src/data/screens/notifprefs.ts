/*
 * Page-local seed for the notification-preferences screen.
 *
 * The rows are a description of the preference form, not records — the values
 * they toggle live on `store.np`.
 */

import type { NotifPrefs } from "../types.ts";
import type { MessageKey } from "../../i18n/index.tsx";

/** The three delivery channels, which are booleans on `NotifPrefs` itself. */
export type NotifChannel = Extract<keyof NotifPrefs, "email" | "sms" | "push">;

export interface PrefRowSpec<K extends string = string> {
  key: K;
  labelKey: MessageKey;
  subKey: MessageKey;
  icon: string;
}

export const NOTIF_CHANNELS: readonly PrefRowSpec<NotifChannel>[] = [
  {
    key: "email",
    labelKey: "data.notif.chEmail",
    subKey: "data.notif.chEmailSub",
    icon: "mail",
  },
  {
    key: "sms",
    labelKey: "data.notif.chSms",
    subKey: "data.notif.chSmsSub",
    icon: "message-square",
  },
  /* The comp asks for `bell-ring`, which the registry does not carry. */
  {
    key: "push",
    labelKey: "data.notif.chPush",
    subKey: "data.notif.chPushSub",
    icon: "bell",
  },
];

/** The six opt-in categories — keys of the `NotifPrefs.cat` map. */
export const NOTIF_CATEGORIES: readonly PrefRowSpec[] = [
  {
    key: "reminders",
    labelKey: "data.notif.catReminders",
    subKey: "data.notif.catRemindersSub",
    icon: "calendar-clock",
  },
  {
    key: "waitlist",
    labelKey: "data.notif.catWaitlist",
    subKey: "data.notif.catWaitlistSub",
    icon: "bell-plus",
  },
  {
    key: "loyalty",
    labelKey: "data.notif.catLoyalty",
    subKey: "data.notif.catLoyaltySub",
    icon: "gem",
  },
  {
    key: "packages",
    labelKey: "data.notif.catPackages",
    subKey: "data.notif.catPackagesSub",
    icon: "layers",
  },
  {
    key: "journal",
    labelKey: "data.notif.catJournal",
    subKey: "data.notif.catJournalSub",
    icon: "book-open",
  },
  {
    key: "offers",
    labelKey: "data.notif.catOffers",
    subKey: "data.notif.catOffersSub",
    icon: "tag",
  },
];

/**
 * `NotifPrefs.when` — how far ahead of a visit the reminder goes out. The
 * lead time is a count so `{count} hour|{count} hours` selects properly; the
 * "both" option has none.
 */
export const NOTIF_WHEN_OPTIONS = [
  { value: "24h", labelKey: "data.notif.whenBefore", hours: 24 },
  { value: "2h", labelKey: "data.notif.whenBefore", hours: 2 },
  { value: "both", labelKey: "data.notif.whenBoth", hours: null },
] as const satisfies readonly {
  value: string;
  labelKey: MessageKey;
  hours: number | null;
}[];

/**
 * `NotifPrefs.quietWin` — which hours are held back. Minutes from midnight,
 * so the window is drawn on the reader's own clock.
 */
export const NOTIF_QUIET_OPTIONS = [
  { value: "10p8a", labelKey: "data.notif.quietRange", from: 1320, to: 480 },
  { value: "9p7a", labelKey: "data.notif.quietRange", from: 1260, to: 420 },
  { value: "weekends", labelKey: "data.notif.quietWeekends", from: null, to: null },
] as const satisfies readonly {
  value: string;
  labelKey: MessageKey;
  from: number | null;
  to: number | null;
}[];
