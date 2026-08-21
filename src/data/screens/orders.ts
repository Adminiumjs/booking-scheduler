/*
 * Page-local seed for the order-history screen.
 *
 * These are paid receipts, not bookings: they outlive the session store and
 * predate it (the earliest is May), so they are seeded rather than derived
 * from `state.bookings`.
 *
 * The comp credited the hair work to "Selma". On the guest half of the shipped
 * app the colourist is Elin — Selma Okonjo is the studio owner on the admin
 * side — so the receipts name Elin, otherwise they point at a specialist the
 * directory does not list.
 */

import type { MessageKey } from "../../i18n/index.tsx";

export type OrderType = "visit" | "package" | "gift";

/**
 * Statuses the comp uses; `ordersTone` maps each to a `StatusPill` tone.
 *
 * Lower-cased into machine tokens: the union used to be the display text too,
 * so a screen printing `order.status` looked correct in English and shipped
 * `Completed` into all eight bundles. Resolve `ORDER_STATUS_KEY[status]`.
 */
export type OrderStatus = "completed" | "sent" | "active" | "refunded";

export const ORDER_STATUS_KEY: Record<OrderStatus, MessageKey> = {
  completed: "data.orders.statusCompleted",
  sent: "data.orders.statusSent",
  active: "data.orders.statusActive",
  refunded: "data.orders.statusRefunded",
};

export interface Order {
  code: string;
  type: OrderType;
  /** The receipt's own line — a treatment, a package, a gift. Salon copy. */
  label: string;
  /**
   * The grey line under it. The date is ISO and the length is minutes, both
   * spelled at render; `subKey` says which shape the row takes, since a gift
   * card has no duration and a package counts sessions instead.
   */
  dateISO: string;
  subKey: MessageKey;
  /** Minutes, for a visit. */
  dur?: number;
  /** Sessions, for a package. */
  sessions?: number;
  amount: number;
  status: OrderStatus;
  icon: string;
  tint: string;
}

export const ORDERS: readonly Order[] = [
  {
    code: "ORD-2291",
    type: "visit",
    label: "Balayage with Elin",
    dateISO: "2026-07-14",
    subKey: "data.orders.subVisit",
    dur: 90,
    amount: 190,
    status: "completed",
    icon: "palette",
    tint: "#b58a6a",
  },
  {
    code: "ORD-2288",
    type: "gift",
    label: "Gift card for Robin Alvarez",
    dateISO: "2026-07-12",
    subKey: "data.orders.subEmailed",
    amount: 100,
    status: "sent",
    icon: "gift",
    tint: "#b07d9a",
  },
  {
    code: "ORD-2276",
    type: "package",
    label: "Glow Five package",
    dateISO: "2026-07-06",
    subKey: "data.orders.subSessions",
    sessions: 5,
    amount: 475,
    status: "active",
    icon: "flower-2",
    tint: "#6f8bb0",
  },
  {
    code: "ORD-2264",
    type: "visit",
    label: "Signature Facial with Noor",
    dateISO: "2026-06-30",
    subKey: "data.orders.subVisit",
    dur: 60,
    amount: 110,
    status: "completed",
    icon: "flower-2",
    tint: "#6f8bb0",
  },
  {
    code: "ORD-2251",
    type: "visit",
    label: "Gel Manicure with Ivy",
    dateISO: "2026-06-02",
    subKey: "data.orders.subVisit",
    dur: 60,
    amount: 58,
    status: "completed",
    icon: "sparkles",
    tint: "#c08a6a",
  },
  {
    code: "ORD-2240",
    type: "visit",
    label: "Reformer Pilates with Marco",
    dateISO: "2026-05-26",
    subKey: "data.orders.subVisit",
    dur: 45,
    amount: 40,
    status: "completed",
    icon: "activity",
    tint: "#7d9166",
  },
  {
    code: "ORD-2233",
    type: "visit",
    label: "Cut & Style with Elin",
    dateISO: "2026-05-12",
    subKey: "data.orders.subCancelledInTime",
    amount: 78,
    status: "refunded",
    icon: "scissors",
    tint: "#b07d9a",
  },
];

/**
 * Month heading a row groups under.
 *
 * Derived rather than seeded: `'July 2026'` was stored on every row, which is
 * a date written in English seven locales too early. The screen groups on this
 * key and spells the heading with `Intl` from the same row's `dateISO`.
 */
export function orderMonthKey(order: Order): string {
  return order.dateISO.slice(0, 7);
}

/** The filter chip row. `all` is the store's seed value for `ordFilter`. */
export const ORDER_FILTERS: readonly { value: string; labelKey: MessageKey }[] = [
  { value: "all", labelKey: "data.orders.filterAll" },
  { value: "visit", labelKey: "data.orders.filterVisits" },
  { value: "package", labelKey: "data.orders.filterPackages" },
  { value: "gift", labelKey: "data.orders.filterGifts" },
];
