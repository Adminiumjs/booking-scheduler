/*
 * Careers seed — the open roles and the perk cards.
 *
 * Page-local: no other screen advertises a job, and none of this belongs in
 * the booking `DataSource` seam.
 */

import type { MessageKey } from "../../i18n/index.tsx";

/**
 * An open role.
 *
 * `title`, `blurb` and `duties` are the studio's own advert and stay as
 * written. The contract shape, the team and the pay band are the product's
 * columns: each is a key, with the numbers passed in so a rate lands in the
 * reader's currency format rather than an English one.
 */
export interface CareerRole {
  id: string;
  title: string;
  /** Contract shape, e.g. "Part-time · 3 days". */
  typeKey: MessageKey;
  /** Fills `{count}` in the part-time and apprenticeship shapes. */
  typeCount?: number;
  teamKey: MessageKey;
  /** Rendered in mono — it is a figure, not prose. */
  payKey: MessageKey;
  /** Whole dollars an hour. `payTo` is absent on a flat rate. */
  payFrom: number;
  payTo?: number;
  /** Fills `{share}` where the band carries a commission on top. */
  payShare?: number;
  blurb: string;
  duties: readonly string[];
}

export interface CareerPerk {
  icon: string;
  labelKey: MessageKey;
  subKey: MessageKey;
  /** Whole dollars a month, for the allowance card. */
  amount?: number;
}

/*
 * "Selma" here is the studio owner (Selma Okonjo), a character rather than
 * the brand — the 2026-07-27 de-branding renamed the salon, not the people.
 */
export const ROLES: readonly CareerRole[] = [
  {
    id: "stylist",
    title: "Senior Stylist",
    typeKey: "data.careers.typeFullTime",
    teamKey: "data.careers.teamHair",
    payKey: "data.careers.payBandTips",
    payFrom: 32,
    payTo: 40,
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
    typeKey: "data.careers.typePartTime",
    typeCount: 3,
    teamKey: "data.careers.teamSpa",
    payKey: "data.careers.payBand",
    payFrom: 38,
    payTo: 45,
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
    typeKey: "data.careers.typeFullTime",
    teamKey: "data.careers.teamReception",
    payKey: "data.careers.payFlatTipShare",
    payFrom: 26,
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
    typeKey: "data.careers.typeApprenticeship",
    typeCount: 18,
    teamKey: "data.careers.teamHair",
    payKey: "data.careers.payFlatTraining",
    payFrom: 20,
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
    labelKey: "data.careers.perkFourDay",
    subKey: "data.careers.perkFourDaySub",
  },
  {
    icon: "hand-coins",
    labelKey: "data.careers.perkTips",
    subKey: "data.careers.perkTipsSub",
  },
  {
    icon: "graduation-cap",
    labelKey: "data.careers.perkEducation",
    subKey: "data.careers.perkEducationSub",
  },
  {
    icon: "package",
    labelKey: "data.careers.perkAllowance",
    subKey: "data.careers.perkAllowanceSub",
    amount: 60,
  },
];

/** Hero-tile tint (hex) — entity palette, deliberately not a token. */
export const CAREERS_HERO_TINT = "#7d9166";

/** Filename shown in the hero tile's corner chip. */
export const CAREERS_HERO_FILENAME = "team_morning_huddle.jpg";

/** The fake CV the demo "attaches". */
export const CAREERS_ATTACHMENT = "resume_robin_alvarez.pdf";
