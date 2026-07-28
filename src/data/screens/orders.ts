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

export type OrderType = "visit" | "package" | "gift";

/** Statuses the comp uses; `ordersTone` maps each to a `StatusPill` tone. */
export type OrderStatus = "Completed" | "Sent" | "Active" | "Refunded";

export interface Order {
  code: string;
  type: OrderType;
  label: string;
  sub: string;
  amount: number;
  status: OrderStatus;
  /** Group heading — rows keep their seeded order inside a month. */
  month: string;
  icon: string;
  tint: string;
}

export const ORDERS: readonly Order[] = [
  {
    code: "ORD-2291",
    type: "visit",
    label: "Balayage with Elin",
    sub: "Jul 14, 2026 · 90 min",
    amount: 190,
    status: "Completed",
    month: "July 2026",
    icon: "palette",
    tint: "#b58a6a",
  },
  {
    code: "ORD-2288",
    type: "gift",
    label: "Gift card for Robin Alvarez",
    sub: "Jul 12, 2026 · emailed",
    amount: 100,
    status: "Sent",
    month: "July 2026",
    icon: "gift",
    tint: "#b07d9a",
  },
  {
    code: "ORD-2276",
    type: "package",
    label: "Glow Five package",
    sub: "Jul 6, 2026 · five facials",
    amount: 475,
    status: "Active",
    month: "July 2026",
    icon: "flower-2",
    tint: "#6f8bb0",
  },
  {
    code: "ORD-2264",
    type: "visit",
    label: "Signature Facial with Noor",
    sub: "Jun 30, 2026 · 60 min",
    amount: 110,
    status: "Completed",
    month: "June 2026",
    icon: "flower-2",
    tint: "#6f8bb0",
  },
  {
    code: "ORD-2251",
    type: "visit",
    label: "Gel Manicure with Ivy",
    sub: "Jun 2, 2026 · 60 min",
    amount: 58,
    status: "Completed",
    month: "June 2026",
    icon: "sparkles",
    tint: "#c08a6a",
  },
  {
    code: "ORD-2240",
    type: "visit",
    label: "Reformer Pilates with Marco",
    sub: "May 26, 2026 · 45 min",
    amount: 40,
    status: "Completed",
    month: "May 2026",
    icon: "activity",
    tint: "#7d9166",
  },
  {
    code: "ORD-2233",
    type: "visit",
    label: "Cut & Style with Elin",
    sub: "May 12, 2026 · cancelled in time",
    amount: 78,
    status: "Refunded",
    month: "May 2026",
    icon: "scissors",
    tint: "#b07d9a",
  },
];

/** The filter chip row. `all` is the store's seed value for `ordFilter`. */
export const ORDER_FILTERS: readonly { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "visit", label: "Visits" },
  { value: "package", label: "Packages" },
  { value: "gift", label: "Gift cards" },
];
