/*
 * Page-local seed for the help centre: the FAQ corpus the search filters, and
 * the three "reach a human" tiles above it.
 */

import type { MessageKey } from "../../i18n/index.tsx";

export interface Faq {
  /** Also the accordion key — `store.helpOpen` holds the open question. */
  q: string;
  a: string;
}

export const FAQS: readonly Faq[] = [
  {
    q: "How far ahead should I book?",
    a: "A week is comfortable for most services, two for colour on a Saturday. Same-week openings appear all the time though — the date step always shows live availability.",
  },
  {
    q: "What happens if I am running late?",
    a: "Text the studio and we will hold your slot as long as the next guest allows, usually about ten minutes. Past that we may need to shorten the service to stay on time.",
  },
  {
    q: "Can I choose my specialist?",
    a: "Yes. Pick them at the specialist step, or set a favourite in Account settings and we will default to them whenever they are free.",
  },
  {
    q: "Do you take walk-ins?",
    a: "When a chair is empty, gladly. Booking is the only way to guarantee a time, and evenings almost always fill in advance.",
  },
  {
    q: "How do package sessions work?",
    a: "Sessions sit in your account and are deducted when you book. They stay valid twelve months, can be gifted to a friend once, and are refundable pro-rata.",
  },
  {
    q: "Where do my loyalty points come from?",
    a: "A point per dollar on every completed visit, plus bonuses for referrals and first visits. Redeem them any time from the Membership screen.",
  },
  {
    q: "Is there parking nearby?",
    a: "Two hours free in the Alder Lane structure behind the building, and the Alder tram stop is a two-minute walk. We validate parking at reception.",
  },
  {
    q: "What is your cancellation window?",
    a: "Twenty-four hours, free of charge, from Manage booking. Inside that a 50% fee applies, and members get one fee-free late cancel each month.",
  },
];

export interface HelpContact {
  icon: string;
  labelKey: MessageKey;
  subKey: MessageKey;
  /** Phone or address filled into `{contact}`; the studio's own, so literal. */
  contact?: string;
  /** Opening and closing time, minutes from midnight, for the phone line. */
  from?: number;
  to?: number;
  /** First and last trading day, `Date.getDay()` — spelled by `weekdayName()`. */
  fromDay?: number;
  toDay?: number;
  /** Nothing leaves the demo — each tile just says so. */
  toastKey: MessageKey;
}

export const HELP_CONTACTS: readonly HelpContact[] = [
  {
    icon: "message-square",
    labelKey: "data.help.text",
    subKey: "data.help.textSub",
    contact: "(415) 555-0148",
    toastKey: "data.help.textToast",
  },
  {
    icon: "phone",
    labelKey: "data.help.call",
    subKey: "data.help.callSub",
    from: 540,
    to: 1080,
    fromDay: 2,
    toDay: 6,
    toastKey: "data.help.callToast",
  },
  {
    icon: "mail",
    labelKey: "data.help.email",
    subKey: "data.help.emailSub",
    contact: "hello@lumenstudio.demo",
    toastKey: "data.help.emailToast",
  },
];
