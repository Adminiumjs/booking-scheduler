/*
 * Page-local seed for the Reviews screen (and the "What guests say" block on a
 * specialist's profile).
 *
 * `demo.ts` already ships a four-review `REVIEWS` array, but it is the home
 * screen's social-proof shape: no staff attribution, no helpful count and no
 * studio reply. The reviews screen needs all three, so the richer set lives
 * here rather than widening the shared `Review` type for one screen.
 *
 * Rebrand: the comp's colour specialist is `selma`; the shipped catalogue
 * renamed her `elin` (the 2026-07-27 de-branding), and `demo.ts` already
 * carries the renamed quote — so these follow the app's spelling ("color"),
 * not the comp's.
 */

import type { MessageKey } from "../../i18n/index.tsx";

export interface StudioReview {
  name: string;
  initials: string;
  /** Per-guest tint (hex) — the placeholder-avatar palette, not a token. */
  tint: string;
  rating: number;
  /** Service *name* (display copy), not an id. */
  svc: string;
  /** Staff id, matching `data.getStaff()`. */
  staff: string;
  /**
   * How long ago the review was left — an offset, not a phrase. `'2 weeks ago'`
   * is a sentence with a plural and (in Arabic) a dual in it; `relativeAgo()`
   * builds the right one per locale from these two fields.
   */
  ago: number;
  agoUnit: Intl.RelativeTimeFormatUnit;
  helpful: number;
  quote: string;
  /** Empty when the studio has not replied. */
  reply: string;
  replyBy: string;
  replyInitials: string;
}

export const STUDIO_REVIEWS: readonly StudioReview[] = [
  {
    name: "Priya S.",
    initials: "PS",
    tint: "#b07d9a",
    rating: 5,
    svc: "Balayage",
    staff: "elin",
    ago: 2,
    agoUnit: "week",
    helpful: 24,
    quote:
      "Elin read exactly what I wanted from one blurry screenshot. Best color I’ve ever had, full stop.",
    reply: "This made our week, Priya. See you at the six-week gloss.",
    replyBy: "Elin",
    replyInitials: "EL",
  },
  {
    name: "Marcus L.",
    initials: "ML",
    tint: "#6f8bb0",
    rating: 5,
    svc: "Deep-Tissue Massage",
    staff: "noor",
    ago: 1,
    agoUnit: "month",
    helpful: 18,
    quote:
      "Noor found every knot I’d been ignoring for a year. I walked out standing three inches taller.",
    reply: "",
    replyBy: "",
    replyInitials: "",
  },
  {
    name: "Dana R.",
    initials: "DR",
    tint: "#b0836a",
    rating: 5,
    svc: "Gel Manicure",
    staff: "ivy",
    ago: 3,
    agoUnit: "week",
    helpful: 31,
    quote:
      "Ivy’s detail work is unreal, and it lasted almost three weeks without a single chip.",
    reply: "",
    replyBy: "",
    replyInitials: "",
  },
  {
    name: "Theo K.",
    initials: "TK",
    tint: "#7d9166",
    rating: 4,
    svc: "Reformer Pilates",
    staff: "marco",
    ago: 6,
    agoUnit: "day",
    helpful: 9,
    quote:
      "Marco tailors every session to how my back feels that day. Rebooking is genuinely one tap.",
    reply: "Glad the back is behaving. Bring the physio notes next time.",
    replyBy: "Marco",
    replyInitials: "MA",
  },
  {
    name: "Hannah W.",
    initials: "HW",
    tint: "#9a7fb0",
    rating: 5,
    svc: "Signature Facial",
    staff: "noor",
    ago: 1,
    agoUnit: "week",
    helpful: 14,
    quote:
      "She told me to stop using two products I loved and my skin has been calm ever since. Worth it for the honesty alone.",
    reply: "",
    replyBy: "",
    replyInitials: "",
  },
  {
    name: "Owen B.",
    initials: "OB",
    tint: "#b58a6a",
    rating: 4,
    svc: "Cut & Style",
    staff: "elin",
    ago: 2,
    agoUnit: "month",
    helpful: 6,
    quote:
      "Ran about ten minutes late starting, but the cut has grown out beautifully and that matters more.",
    reply:
      "Sorry about the wait, Owen — that day got away from us. Coffee on us next visit.",
    replyBy: "Elin",
    replyInitials: "EL",
  },
  {
    name: "Lucia M.",
    initials: "LM",
    tint: "#c08a6a",
    rating: 5,
    svc: "Deluxe Pedicure",
    staff: "ivy",
    ago: 5,
    agoUnit: "week",
    helpful: 11,
    quote:
      "The only place I’ve been where the massage goes past the ankle. Small thing, enormous difference.",
    reply: "",
    replyBy: "",
    replyInitials: "",
  },
  {
    name: "Sam D.",
    initials: "SD",
    tint: "#6a86ab",
    rating: 3,
    svc: "Gloss & Tone",
    staff: "elin",
    ago: 3,
    agoUnit: "month",
    helpful: 4,
    quote:
      "Lovely result but I’d hoped for a bigger change from a gloss. My expectations, not their work.",
    reply:
      "Fair — a gloss can only do so much on its own. Happy to talk through a half-head next time.",
    replyBy: "Elin",
    replyInitials: "EL",
  },
];

/** The five filter chips above the list. `stars` fills `{count}`. */
export const REVIEW_FILTERS: readonly {
  id: string;
  labelKey: MessageKey;
  stars?: number;
}[] = [
  { id: "all", labelKey: "data.reviews.filterAll" },
  { id: "5", labelKey: "data.reviews.filterStars", stars: 5 },
  { id: "4", labelKey: "data.reviews.filterStars", stars: 4 },
  { id: "low", labelKey: "data.reviews.filterUnder", stars: 3 },
  { id: "replied", labelKey: "data.reviews.filterReplied" },
];

/**
 * Index by star count — `RATING_WORD_KEYS[4]` is "Really good". Index 0 is
 * `null`: there is no nought-star rating, and an empty string in a bundle
 * reads as a missing translation rather than a deliberate blank.
 */
export const RATING_WORD_KEYS: readonly (MessageKey | null)[] = [
  null,
  "data.rating.1",
  "data.rating.2",
  "data.rating.3",
  "data.rating.4",
  "data.rating.5",
];
