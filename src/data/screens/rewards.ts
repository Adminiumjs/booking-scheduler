/*
 * Page-local seed for the Loyalty rewards screen (guest view `rewards`).
 *
 * This is a *different* catalogue from `data.getRewards()`: the seam's list
 * backs the original Loyalty screen's compact redeem strip, while these are
 * the six full picture-cards the 2026-07-28 comp added, with their own costs,
 * artwork tints and fine print. Keeping them apart means neither screen has
 * to bend to the other's shape.
 *
 * `{staff}` in a blurb or ledger label is filled from the data seam at render
 * time, so the copy can never drift from the roster.
 */

export interface RewardCard {
  id: string;
  name: string;
  cost: number;
  icon: string;
  /** Per-record tint — the one place a raw hex is allowed. */
  tint: string;
  blurb: string;
  /** Staff id substituted into `{staff}`, when the blurb names someone. */
  staff?: string;
  /** The small print under the cost, e.g. `'worth $60'`. */
  note: string;
}

export const REWARD_CARDS: readonly RewardCard[] = [
  {
    id: "r25",
    name: "$25 off any visit",
    cost: 500,
    icon: "ticket",
    tint: "#b58a6a",
    blurb: "Comes off the bill at checkout, on anything at all.",
    note: "no expiry",
  },
  {
    id: "gloss",
    name: "Free gloss & tone",
    cost: 600,
    icon: "droplet",
    tint: "#9a7fb0",
    blurb: "Forty-five minutes with {staff} between colour appointments.",
    staff: "elin",
    note: "worth $60",
  },
  {
    id: "file",
    name: "Express file & polish",
    cost: 300,
    icon: "sparkles",
    tint: "#c08a6a",
    blurb: "A quick tidy with {staff} when you have half an hour.",
    staff: "ivy",
    note: "worth $30",
  },
  {
    id: "prod",
    name: "Any product, half price",
    cost: 250,
    icon: "package",
    tint: "#7d9166",
    blurb: "One item off the shelf, whichever you like.",
    note: "one per quarter",
  },
  {
    id: "brow",
    name: "Add-on brow shape",
    cost: 200,
    icon: "eye",
    tint: "#6f8bb0",
    blurb: "Tacked onto any facial or cut, no extra time booked.",
    note: "worth $22",
  },
  {
    id: "friend",
    name: "Bring a friend free",
    cost: 900,
    icon: "users",
    tint: "#b07d9a",
    blurb: "A second manicure or reformer class, on the house.",
    note: "weekdays only",
  },
];

export interface RewardLedgerRow {
  label: string;
  /** Staff id substituted into `{staff}` in the label. */
  staff?: string;
  date: string;
  amount: number;
}

export const REWARD_LEDGER: readonly RewardLedgerRow[] = [
  { label: "Balayage with {staff}", staff: "elin", date: "Jul 14", amount: 190 },
  { label: "Referral · Robin joined", date: "Jul 12", amount: 100 },
  { label: "Signature Facial", date: "Jun 30", amount: 110 },
  { label: "Gel Manicure", date: "Jun 2", amount: 58 },
];

export interface RewardRule {
  icon: string;
  text: string;
}

export const REWARD_RULES: readonly RewardRule[] = [
  {
    icon: "coins",
    text: "A point per dollar on every completed visit, doubled for Circle members.",
  },
  {
    icon: "share-2",
    text: "A hundred points when a friend you referred finishes their first visit.",
  },
  {
    icon: "cake",
    text: "Fifty points on your birthday, whether you come in or not.",
  },
  {
    icon: "clock",
    text: "Points sit in your account for two years from the day you earn them.",
  },
];

/**
 * The balance the hero's progress bar fills towards — the cost of the `r25`
 * reward, read from the catalogue so the two can never disagree (the comp
 * hardcoded 500 in three separate places).
 */
export const NEXT_REWARD_COST =
  REWARD_CARDS.find((r) => r.id === "r25")?.cost ?? 500;

/** Demo fiction: lifetime-to-date earnings, shown as a flat fact. */
export const EARNED_THIS_YEAR = "1,240";
