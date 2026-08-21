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

import type { MessageKey } from "../../i18n/index.tsx";

/**
 * A redeemable benefit.
 *
 * Unlike a package or a treatment, a reward is something the *product* grants
 * rather than something the salon sells, so its name, blurb and small print
 * are all keys. `{amount}` and `{staff}` are filled from the fields below, so
 * a price change or a roster change cannot leave the copy behind.
 */
export interface RewardCard {
  id: string;
  nameKey: MessageKey;
  /** Whole dollars substituted into `{amount}` in the name. */
  amount?: number;
  cost: number;
  icon: string;
  /** Per-record tint — the one place a raw hex is allowed. */
  tint: string;
  blurbKey: MessageKey;
  /** Staff id substituted into `{staff}`, when the blurb names someone. */
  staff?: string;
  /** The small print under the cost, e.g. "worth $60". */
  noteKey: MessageKey;
  /** Whole dollars substituted into `{amount}` in the note. */
  worth?: number;
}

export const REWARD_CARDS: readonly RewardCard[] = [
  {
    id: "r25",
    nameKey: "data.rewardCard.moneyOffName",
    amount: 25,
    cost: 500,
    icon: "ticket",
    tint: "#b58a6a",
    blurbKey: "data.rewardCard.moneyOffBlurb",
    noteKey: "data.rewardCard.noExpiry",
  },
  {
    id: "gloss",
    nameKey: "data.rewardCard.glossName",
    cost: 600,
    icon: "droplet",
    tint: "#9a7fb0",
    blurbKey: "data.rewardCard.glossBlurb",
    staff: "elin",
    noteKey: "data.rewardCard.worth",
    worth: 60,
  },
  {
    id: "file",
    nameKey: "data.rewardCard.fileName",
    cost: 300,
    icon: "sparkles",
    tint: "#c08a6a",
    blurbKey: "data.rewardCard.fileBlurb",
    staff: "ivy",
    noteKey: "data.rewardCard.worth",
    worth: 30,
  },
  {
    id: "prod",
    nameKey: "data.rewardCard.productName",
    cost: 250,
    icon: "package",
    tint: "#7d9166",
    blurbKey: "data.rewardCard.productBlurb",
    noteKey: "data.rewardCard.onePerQuarter",
  },
  {
    id: "brow",
    nameKey: "data.rewardCard.browName",
    cost: 200,
    icon: "eye",
    tint: "#6f8bb0",
    blurbKey: "data.rewardCard.browBlurb",
    noteKey: "data.rewardCard.worth",
    worth: 22,
  },
  {
    id: "friend",
    nameKey: "data.rewardCard.friendName",
    cost: 900,
    icon: "users",
    tint: "#b07d9a",
    blurbKey: "data.rewardCard.friendBlurb",
    noteKey: "data.rewardCard.weekdaysOnly",
  },
];

export interface RewardLedgerRow {
  labelKey: MessageKey;
  /** Service id substituted into `{service}` in the label. */
  svc?: string;
  /** Staff id substituted into `{staff}` in the label. */
  staff?: string;
  /** Referred guest's first name, substituted into `{name}` — salon fiction. */
  name?: string;
  /** `YYYY-MM-DD`; the screen spells it. */
  dateISO: string;
  amount: number;
}

export const REWARD_LEDGER: readonly RewardLedgerRow[] = [
  {
    labelKey: "data.ledger.visit",
    svc: "balayage",
    staff: "elin",
    dateISO: "2026-07-14",
    amount: 190,
  },
  {
    labelKey: "data.ledger.referralJoined",
    name: "Robin",
    dateISO: "2026-07-12",
    amount: 100,
  },
  { labelKey: "data.ledger.service", svc: "facial", dateISO: "2026-06-30", amount: 110 },
  { labelKey: "data.ledger.service", svc: "gel", dateISO: "2026-06-02", amount: 58 },
];

export interface RewardRule {
  icon: string;
  textKey: MessageKey;
}

/** How the scheme works — the product explaining itself, so all four are keys. */
export const REWARD_RULES: readonly RewardRule[] = [
  { icon: "coins", textKey: "data.rewardRule.earn" },
  { icon: "share-2", textKey: "data.rewardRule.referral" },
  { icon: "cake", textKey: "data.rewardRule.birthday" },
  { icon: "clock", textKey: "data.rewardRule.expiry" },
];

/**
 * The balance the hero's progress bar fills towards — the cost of the `r25`
 * reward, read from the catalogue so the two can never disagree (the comp
 * hardcoded 500 in three separate places).
 */
export const NEXT_REWARD_COST =
  REWARD_CARDS.find((r) => r.id === "r25")?.cost ?? 500;

/**
 * Demo fiction: lifetime-to-date earnings, shown as a flat fact. A number,
 * not `'1,240'` — the grouping separator is the reader's, not English's.
 */
export const EARNED_THIS_YEAR = 1240;
