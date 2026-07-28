/*
 * Careers seed — the open roles and the perk cards.
 *
 * Page-local: no other screen advertises a job, and none of this belongs in
 * the booking `DataSource` seam.
 */

export interface CareerRole {
  id: string;
  title: string;
  /** Contract shape, e.g. "Part-time · 3 days". */
  type: string;
  team: string;
  /** Rendered in mono — it is a figure, not prose. */
  pay: string;
  blurb: string;
  duties: readonly string[];
}

export interface CareerPerk {
  icon: string;
  label: string;
  sub: string;
}

/*
 * "Selma" here is the studio owner (Selma Okonjo), a character rather than
 * the brand — the 2026-07-27 de-branding renamed the salon, not the people.
 */
export const ROLES: readonly CareerRole[] = [
  {
    id: "stylist",
    title: "Senior Stylist",
    type: "Full-time",
    team: "Hair",
    pay: "$32–40/hr + tips",
    blurb:
      "Your own column, your own regulars, and the freedom to say no to a booking that needs more time than the slot allows.",
    duties: [
      "Four days a week, never six.",
      "Colour and cutting — you can lean either way.",
      "Two paid education days a year, your choice of course.",
    ],
  },
  {
    id: "therapist",
    title: "Massage Therapist",
    type: "Part-time · 3 days",
    team: "Spa",
    pay: "$38–45/hr",
    blurb:
      "Deep-tissue and recovery work alongside Noor, in a room that is yours for the day.",
    duties: [
      "Sixty and ninety-minute slots only — no thirty-minute rushes.",
      "Fifteen minutes between guests, protected.",
      "Licence and two years of hands-on required.",
    ],
  },
  {
    id: "front",
    title: "Front of House",
    type: "Full-time",
    team: "Reception",
    pay: "$26/hr + tip share",
    blurb:
      "The person who makes the day run. You will know every regular’s name by week three.",
    duties: [
      "Own the diary, the phone and the shelf.",
      "Keep the studio calm when the day slips.",
      "Retail knowledge is welcome, not required.",
    ],
  },
  {
    id: "apprentice",
    title: "Colour Apprentice",
    type: "Apprenticeship · 18 months",
    team: "Hair",
    pay: "$20/hr + training",
    blurb:
      "Two days on the floor with Selma, one day of structured training, every week for eighteen months.",
    duties: [
      "No sweeping-only days — you are on colour from month one.",
      "Model nights covered by the studio.",
      "A real job at the end of it if we both want it.",
    ],
  },
];

export const PERKS: readonly CareerPerk[] = [
  {
    icon: "calendar-days",
    label: "Four-day weeks",
    sub: "Everyone. Sundays and one more day, properly off.",
  },
  {
    icon: "hand-coins",
    label: "Tips split evenly",
    sub: "Front of house included, paid weekly, no pooling games.",
  },
  {
    icon: "graduation-cap",
    label: "Paid education",
    sub: "Two courses a year, your pick, we cover time and cost.",
  },
  {
    icon: "package",
    label: "Product allowance",
    sub: "$60 a month on the shelf, plus cost price on everything else.",
  },
];

/** Hero-tile tint (hex) — entity palette, deliberately not a token. */
export const CAREERS_HERO_TINT = "#7d9166";

/** Filename shown in the hero tile's corner chip. */
export const CAREERS_HERO_FILENAME = "team_morning_huddle.jpg";

/** The fake CV the demo "attaches". */
export const CAREERS_ATTACHMENT = "resume_robin_alvarez.pdf";
