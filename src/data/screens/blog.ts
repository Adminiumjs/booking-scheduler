/*
 * Studio-journal seed — the six posts the comp ships.
 *
 * Page-local rather than part of the `DataSource` seam: nothing outside the
 * Journal index and the post reader reads an article. Both screens import
 * from here so the "more from the journal" rail and the index can never
 * disagree about what exists.
 *
 * `author` is a **staff id**, resolved through `data.getStaffMember()` — the
 * byline name, initials, tint, role and bio all come from the shared seam so
 * a staff edit propagates here for free. The comp authored two posts as
 * `selma`; that specialist is `elin` in the shipped app after the 2026-07-27
 * de-branding, so the ids are remapped, not the prose.
 */

/** Journal sections, in the order the filter row shows them. */
export const JOURNAL_CATEGORIES = [
  "Hair",
  "Skin",
  "Nails",
  "Movement",
  "Studio news",
] as const;

export type JournalCategory = (typeof JOURNAL_CATEGORIES)[number];

/** The filter row's own value: every category, plus "show everything". */
export type JournalFilter = "all" | JournalCategory;

export interface JournalPost {
  id: string;
  cat: JournalCategory;
  /** Staff id — look it up with `data.getStaffMember()`. */
  author: string;
  date: string;
  read: string;
  /** Placeholder-tile tint (hex). Part of the entity palette, not a token. */
  tint: string;
  icon: string;
  /** Fake filename for the tile's corner chip. */
  fname: string;
  /** At most one post is featured; it leads the unfiltered index. */
  featured?: boolean;
  title: string;
  excerpt: string;
  /** Body paragraphs, rendered in order. */
  body: readonly string[];
  /** The pull quote under the body. */
  quote: string;
}

export const POSTS: readonly JournalPost[] = [
  {
    id: "balayage-summer",
    cat: "Hair",
    author: "elin",
    date: "Jul 18, 2026",
    read: "5 min read",
    tint: "#b58a6a",
    icon: "sun",
    fname: "balayage_summer.jpg",
    featured: true,
    title: "Making balayage last all the way through summer",
    excerpt:
      "Chlorine, salt water and SPF are all quietly working against your color. Here’s what actually helps.",
    body: [
      "Color rarely fades evenly. The pieces around your face take the most sun, the most heat and the most washing, which is why balayage tends to warm up at the front long before the ends give up.",
      "The fix is unglamorous. Rinse cooler than feels nice, wash a day later than you think you need to, and soak your hair with tap water before a pool so it has less room to drink chlorine.",
      "If you swim most days, book a gloss before the holiday rather than after. Toning warm hair back down takes twenty minutes. Rebuilding over-processed ends takes a season.",
    ],
    quote: "Wash less, rinse cooler, gloss sooner. That is the entire routine.",
  },
  {
    id: "evening-routine",
    cat: "Skin",
    author: "noor",
    date: "Jul 9, 2026",
    read: "4 min read",
    tint: "#6f8bb0",
    icon: "moon",
    fname: "evening_routine.jpg",
    title: "The three-step evening routine we actually recommend",
    excerpt:
      "Most shelves hold nine products doing the work of three. Here is the short version that holds up.",
    body: [
      "Cleanse, treat, protect. That is the whole framework, and everything else is preference. If a step cannot explain what it does, it is probably a texture you enjoy rather than a result you need.",
      "Cleansing should feel unremarkable — no squeak, no tightness. Treatment is where your one active lives, two or three nights a week rather than nightly. Protect is a moisturizer thick enough that you notice it in the morning.",
      "Give any new routine six weeks before judging it. Skin turns over slowly, and most of the disappointment we hear about is really impatience wearing a lab coat.",
    ],
    quote: "If a step cannot explain what it does, it is a texture, not a treatment.",
  },
  {
    id: "gel-or-natural",
    cat: "Nails",
    author: "ivy",
    date: "Jun 28, 2026",
    read: "6 min read",
    tint: "#c08a6a",
    icon: "sparkles",
    fname: "gel_or_natural.jpg",
    title: "Gel, dip, or natural: choosing your next set",
    excerpt:
      "Three finishes with three very different maintenance habits. Pick the one that matches your week.",
    body: [
      "Gel is the workhorse: two to three weeks of high shine, quick to apply, and gentle to remove when it is properly soaked off rather than picked at during a long meeting.",
      "Dip lasts longer and sits thicker, which suits hands that take a beating. It is less forgiving on very thin nails, so we usually alternate it with a bare month.",
      "Natural is not a compromise. A good shape, real cuticle work and a hard clear coat can look sharper than a rushed set, and it costs you less time in the chair.",
    ],
    quote: "The best set is the one you will not pick off in week two.",
  },
  {
    id: "five-minute-mobility",
    cat: "Movement",
    author: "marco",
    date: "Jun 15, 2026",
    read: "3 min read",
    tint: "#7d9166",
    icon: "activity",
    fname: "morning_mobility.jpg",
    title: "Five minutes of mobility before your morning coffee",
    excerpt:
      "Not a workout. A short sequence so the first hour of the day feels less like negotiating with your spine.",
    body: [
      "Start standing, feet under hips, and roll down one vertebra at a time. Hang for three breaths. Roll back up slower than you came down. Twice is plenty.",
      "Then open the front of the hips: half kneel, ribs stacked over pelvis, pressing gently forward for thirty seconds a side. Most desk stiffness lives here, not in the lower back.",
      "Finish with ten slow shoulder circles each way. The point is not intensity. It is telling your nervous system the day has started before caffeine does it for you.",
    ],
    quote: "The point is not intensity. It is arriving in your body before the day does.",
  },
  {
    id: "first-facial",
    cat: "Skin",
    author: "noor",
    date: "Jun 2, 2026",
    read: "5 min read",
    tint: "#6a86ab",
    icon: "flower-2",
    fname: "first_facial.jpg",
    title: "What to expect at your first facial",
    excerpt:
      "No mystery and no upsell — a walk through the hour, from the consult to the walk home.",
    body: [
      "We start with five minutes of questions: what your skin does in different seasons, what you have already tried, and what you realistically have time for. That conversation shapes everything after it.",
      "The middle of the hour is cleansing, gentle exfoliation, extractions if you want them, and a mask chosen on the day rather than booked in advance. You are told before anything unexpected happens.",
      "Afterwards skin can look a little flushed for an hour or two. Skip heavy makeup that evening, wear sunscreen the next day, and resist buying the entire shelf on your way out.",
    ],
    quote: "You are told before anything unexpected happens. That is the whole promise.",
  },
  {
    id: "new-rooms",
    cat: "Studio news",
    author: "elin",
    date: "May 21, 2026",
    read: "2 min read",
    tint: "#b07d9a",
    icon: "home",
    fname: "new_rooms.jpg",
    title: "We redid the treatment rooms — here is why",
    excerpt:
      "Softer light, quieter air, and a door that finally closes properly. Small things, big difference.",
    body: [
      "The old rooms were bright the way a kitchen is bright. Lovely for matching color, much less lovely when you are lying down trying to switch off for ninety minutes.",
      "So we dropped the ceiling lights, added warm side lamps on dimmers, and swapped the extractor for something that moves the same air at half the volume. The door seals now, too.",
      "Nothing about the treatments changed. But the feedback since has been about sleep — people keep telling us they drifted off, which is the highest compliment a treatment room can get.",
    ],
    quote: "People keep telling us they fell asleep. Best review we get.",
  },
];

/** One post by id, or `undefined` when the store holds a stale/unknown id. */
export function journalPost(id: string | null): JournalPost | undefined {
  if (!id) return undefined;
  return POSTS.find((p) => p.id === id);
}

/** The two other posts shown under an article. */
export function relatedPosts(id: string, count = 2): JournalPost[] {
  return POSTS.filter((p) => p.id !== id).slice(0, count);
}
