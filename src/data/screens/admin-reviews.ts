/*
 * Seed for the studio Reviews screen (view: 'admin-reviews').
 *
 * The guest half already publishes four of these (`data.getReviews()`), but
 * that shape is deliberately public-only: no id, no specialist, no reply. The
 * studio needs all three plus a fifth, private-facing three-star review, so the
 * moderation queue keeps its own records.
 *
 * The four shared quotes are worded exactly as the guest half words them —
 * the same guest saying two different things on the two screens would be a bug
 * in the demo, not fidelity to the comp.
 */

import type { MessageKey } from "../../i18n/index.tsx";

/** Ratings below this need a personal call, per the studio's own KPI. */
export const LOW_RATING = 4;

export interface AdminReview {
  id: string;
  /** Public display name, as the guest left it. */
  name: string;
  initials: string;
  tint: string;
  rating: number;
  /** Service name (display copy), not an id. */
  svc: string;
  staff: string;
  /**
   * How long ago the review was left — an offset, not a phrase. `'2 weeks ago'`
   * is a sentence with a plural and (in Arabic) a dual in it; `relativeAgo()`
   * builds the right one per locale from these two fields.
   */
  ago: number;
  agoUnit: Intl.RelativeTimeFormatUnit;
  quote: string;
  /** Seeded studio reply; empty means the queue still owes one. */
  reply: string;
  /** Who signed the seeded reply. */
  replyBy: string;
}

export const ADMIN_REVIEWS: readonly AdminReview[] = [
  {
    id: "r1",
    name: "Priya S.",
    initials: "PS",
    tint: "#b07d9a",
    rating: 5,
    svc: "Balayage",
    staff: "Elin",
    ago: 2,
    agoUnit: "week",
    quote:
      "Elin read exactly what I wanted from one blurry screenshot. Best color I’ve ever had, full stop.",
    reply: "",
    replyBy: "",
  },
  {
    id: "r2",
    name: "Sam D.",
    initials: "SD",
    tint: "#6a86ab",
    rating: 3,
    svc: "Gloss & Tone",
    staff: "Elin",
    ago: 3,
    agoUnit: "month",
    quote:
      "Lovely result but I’d hoped for a bigger change from a gloss. My expectations, not their work.",
    reply: "",
    replyBy: "",
  },
  {
    id: "r3",
    name: "Marcus L.",
    initials: "ML",
    tint: "#6f8bb0",
    rating: 5,
    svc: "Deep-Tissue Massage",
    staff: "Noor",
    ago: 1,
    agoUnit: "month",
    quote:
      "Noor found every knot I’d been ignoring for a year. I walked out standing three inches taller.",
    reply: "",
    replyBy: "",
  },
  {
    id: "r4",
    name: "Theo K.",
    initials: "TK",
    tint: "#7d9166",
    rating: 4,
    svc: "Reformer Pilates",
    staff: "Marco",
    ago: 6,
    agoUnit: "day",
    quote:
      "Marco tailors every session to how my back feels that day. Rebooking is genuinely one tap.",
    reply: "Glad the back is behaving. Bring the physio notes next time.",
    replyBy: "Marco",
  },
  {
    id: "r5",
    name: "Dana R.",
    initials: "DR",
    tint: "#b0836a",
    rating: 5,
    svc: "Gel Manicure",
    staff: "Ivy",
    ago: 3,
    agoUnit: "week",
    quote:
      "Ivy’s detail work is unreal, and it lasted almost three weeks without a single chip.",
    reply: "Thank you Dana — see you at the next fill.",
    replyBy: "Ivy",
  },
];

export type ReviewQueueFilter = "todo" | "all" | "low";

export interface ReviewFilterOption {
  id: ReviewQueueFilter;
  labelKey: MessageKey;
  /** Fills `{count}` in the "N stars & under" filter. */
  count?: number;
}

export const REVIEW_FILTERS: readonly ReviewFilterOption[] = [
  { id: "todo", labelKey: "data.adminReviews.filterTodo" },
  { id: "all", labelKey: "data.adminReviews.filterAll" },
  { id: "low", labelKey: "data.adminReviews.filterLow", count: LOW_RATING - 1 },
];

/** Who a reply posted from this screen is signed by. */
export const REPLY_AUTHOR = "Selma";
