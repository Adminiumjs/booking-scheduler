/*
 * Front-desk seed for the till (view: 'admin-pos').
 *
 * The guest roster is page-local: the DataSource seam covers what the studio
 * *books* (services, staff, availability), not who has sat in a chair. The till
 * only needs enough of a client to name a ticket and email a receipt, so this
 * carries that slice rather than a full client record.
 */

/** A guest a ticket can be rung up against. */
export interface PosGuest {
  id: string;
  name: string;
  initials: string;
  email: string;
  /** Avatar tint (hex) — part of the entity palette, not a token. */
  tint: string;
  visits: number;
  /** Lifetime spend in whole dollars; render through `money()`. */
  spend: number;
}

export const POS_GUESTS: readonly PosGuest[] = [
  {
    id: "ava",
    name: "Ava Reyes",
    initials: "AR",
    email: "ava@example.com",
    tint: "#b07d9a",
    visits: 12,
    spend: 973,
  },
  {
    id: "priya",
    name: "Priya Sharma",
    initials: "PS",
    email: "priya.s@example.com",
    tint: "#9a7fb0",
    visits: 8,
    spend: 1240,
  },
  {
    id: "marcus",
    name: "Marcus Lund",
    initials: "ML",
    email: "m.lund@example.com",
    tint: "#6f8bb0",
    visits: 6,
    spend: 690,
  },
  {
    id: "dana",
    name: "Dana Rivas",
    initials: "DR",
    email: "dana.r@example.com",
    tint: "#b0836a",
    visits: 14,
    spend: 812,
  },
  {
    id: "jonah",
    name: "Jonah Pike",
    initials: "JP",
    email: "jonah@example.com",
    tint: "#7d9166",
    visits: 1,
    spend: 78,
  },
  {
    id: "lucia",
    name: "Lucia Moss",
    initials: "LM",
    email: "lucia.m@example.com",
    tint: "#c08a6a",
    visits: 4,
    spend: 288,
  },
  {
    id: "theo",
    name: "Theo Kim",
    initials: "TK",
    email: "theo.k@example.com",
    tint: "#6a86ab",
    visits: 22,
    spend: 940,
  },
  {
    id: "sam",
    name: "Sam Doyle",
    initials: "SD",
    email: "sam.d@example.com",
    tint: "#b58a6a",
    visits: 2,
    spend: 120,
  },
  {
    id: "hannah",
    name: "Hannah Wills",
    initials: "HW",
    email: "h.wills@example.com",
    tint: "#8a9a6a",
    visits: 9,
    spend: 1105,
  },
  {
    id: "robin",
    name: "Robin Alvarez",
    initials: "RA",
    email: "robin@example.com",
    tint: "#a8846f",
    visits: 3,
    spend: 210,
  },
];

export function posGuest(id: string): PosGuest {
  return POS_GUESTS.find((g) => g.id === id) ?? POS_GUESTS[0];
}

/** The guest after this one, wrapping — the picker cycles the roster. */
export function nextPosGuest(id: string): PosGuest {
  const i = POS_GUESTS.findIndex((g) => g.id === id);
  return POS_GUESTS[(i + 1) % POS_GUESTS.length];
}

/* ------------------------------------------------------------------ *
 * Till configuration
 * ------------------------------------------------------------------ */

export type PosTab = "svc" | "retail" | "gift";

export const POS_TABS: readonly { id: PosTab; label: string }[] = [
  { id: "svc", label: "Services" },
  { id: "retail", label: "Retail" },
  { id: "gift", label: "Gift cards" },
];

export const POS_METHODS: readonly { id: string; label: string; icon: string }[] =
  [
    { id: "card", label: "Card reader", icon: "credit-card" },
    { id: "cash", label: "Cash", icon: "banknote" },
    { id: "gift", label: "Gift balance", icon: "gift" },
    { id: "link", label: "Payment link", icon: "link" },
  ];

/**
 * Tip ladder. The comp offered 0/10/15/20 while seeding the till at 18%, so
 * the opening ticket charged a tip no chip could show or clear — 18 is back in
 * the ladder, matching the guest checkout's own rungs.
 */
export const POS_TIPS: readonly number[] = [0, 10, 15, 18, 20];

/** Sales tax the till adds to every ticket. */
export const POS_TAX_RATE = 0.085;

/** The tint gift-card tiles carry on the till. */
export const POS_GIFT_TINT = "#7d9166";
