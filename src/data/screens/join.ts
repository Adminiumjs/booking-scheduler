/*
 * Page-local seed for the membership signup screen (guest view `join`).
 *
 * Distinct from `data.getPlans()`, which backs the two-plan teaser on the
 * original Loyalty screen. These three are the signup funnel's own tiers,
 * priced both monthly and annually so the cycle toggle has something to
 * switch between.
 */

export interface MembershipTier {
  id: string;
  name: string;
  /** Monthly price, in whole dollars. */
  m: number;
  /** Annual price — two months free against paying monthly. */
  y: number;
  featured?: boolean;
  blurb: string;
  perks: readonly string[];
}

export const MEMBERSHIP_TIERS: readonly MembershipTier[] = [
  {
    id: "lite",
    name: "Circle Lite",
    m: 19,
    y: 190,
    blurb: "For the every-other-month guest who still wants the perks.",
    perks: [
      "10% off every service",
      "Priority on cancellations",
      "Points earn at 1.5×",
    ],
  },
  {
    id: "glow",
    name: "Glow Monthly",
    m: 39,
    y: 390,
    featured: true,
    blurb: "One treatment a month, plus everything in Lite.",
    perks: [
      "One facial or gloss every month",
      "10% off any add-on service",
      "First refusal on cancellations",
      "Points earn at 2×",
    ],
  },
  {
    id: "full",
    name: "Full Circle",
    m: 79,
    y: 790,
    blurb: "Two treatments a month and a standing chair.",
    perks: [
      "Two treatments every month",
      "15% off everything else",
      "A standing slot held for you",
      "Bring a friend free, twice a year",
    ],
  },
];

/**
 * Starting on the 1st instead of today credits back the part of the period
 * you would not be using — 35% of the cycle price, in the comp's arithmetic.
 */
export const PRO_RATA_SHARE = 0.35;

/** Member numbers land in CIR-4100 … CIR-4899. */
export const MEMBER_NUMBER_BASE = 4100;
export const MEMBER_NUMBER_SPAN = 800;
