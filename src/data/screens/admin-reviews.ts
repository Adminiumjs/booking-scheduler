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
  date: string;
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
    date: "2 weeks ago",
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
    date: "3 months ago",
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
    date: "1 month ago",
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
    date: "6 days ago",
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
    date: "3 weeks ago",
    quote:
      "Ivy’s detail work is unreal, and it lasted almost three weeks without a single chip.",
    reply: "Thank you Dana — see you at the next fill.",
    replyBy: "Ivy",
  },
];

export type ReviewQueueFilter = "todo" | "all" | "low";

export interface ReviewFilterOption {
  id: ReviewQueueFilter;
  label: string;
}

export const REVIEW_FILTERS: readonly ReviewFilterOption[] = [
  { id: "todo", label: "Needs a reply" },
  { id: "all", label: "All reviews" },
  { id: "low", label: "Three stars & under" },
];

/** Ratings below this need a personal call, per the studio's own KPI. */
export const LOW_RATING = 4;

/** Who a reply posted from this screen is signed by. */
export const REPLY_AUTHOR = "Selma";
