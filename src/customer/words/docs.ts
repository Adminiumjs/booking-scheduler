/**
 * The four text pages, in English; the other languages are in `docs.*.ts`.
 * A page is a function of the studio's own figures, so it can never promise
 * what the settings don't do (L1b-F14).
 */
import type { LocaleTag } from "../../i18n/locales.ts";
import { DOCS_AR } from "./docs.ar.ts";
import { DOCS_CS } from "./docs.cs.ts";
import { DOCS_DA } from "./docs.da.ts";
import { DOCS_DE } from "./docs.de.ts";
import { DOCS_FR } from "./docs.fr.ts";
import { DOCS_ZH_CN } from "./docs.zh-CN.ts";
import { DOCS_ZH_TW } from "./docs.zh-TW.ts";

export interface DocFacts {
  hours: number;
  hold: number;
  notice: number;
  window: number;
  /** "Root Color ($50), Balayage ($50)". */
  deposits: string;
  hasDeposits: boolean;
  currency: string;
}

export interface Doc {
  title: string;
  intro: string;
  items: [string, string][];
}

export type DocSet = Record<"help" | "policy" | "privacy" | "terms", (f: DocFacts) => Doc>;

export const DOCS_EN: DocSet = {
  help: (f) => ({
    title: "Help",
    intro: "Short answers to the questions we hear most.",
    items: [
      ["How do I move or cancel?", `Open your booking from the link in any e-mail from us, or find it with your booking code and e-mail. Moving and cancelling are free up to ${String(f.hours)} hours before.`],
      ["Do I need an account?", "No. You can book with your name and e-mail. If you sign in, you see all your visits in one place. We e-mail you a code to sign in. There are no passwords."],
      ['What does "Anyone" mean?', "We book whoever is free at the time you pick, and share the day evenly across the team. You see who it is once it is booked."],
      ["When do I pay?", f.hasDeposits ? `Most services are paid at the studio. These take a payment online when you book: ${f.deposits}.` : "Every service is paid at the studio."],
      ["How will you contact me?", "By e-mail. Your phone number is optional: we use it if we need to reach you on the day, and send texts to it only if you tick the box for them when you book. Each text tells you how to stop."],
    ],
  }),
  policy: (f) => ({
    title: "Cancellation policy",
    intro: "The same rules apply to everyone.",
    items: [
      [`Up to ${String(f.hours)} hours before`, "Cancel or move for free, online. If you paid online, it goes back to your card automatically. A pack session or a gift card's part comes back too."],
      [`Less than ${String(f.hours)} hours before`, "Moving is not possible online. E-mail us and we will help if we can. If you cancel, it counts as a late cancel: a deposit, a payment in full, a pack session or a gift card's part is kept."],
      ["If you do not come", "A no-show keeps the deposit, the payment, the pack session or the gift card's part, in the same way."],
      ["If we cancel", "If the studio cancels your visit, anything you paid online comes back in full."],
      ["No other fees", "There is no other fee for cancelling, moving or not coming."],
    ],
  }),
  privacy: () => ({
    title: "Privacy",
    intro: "What we keep, and who sees it.",
    items: [
      ["What we keep", 'Your name, e-mail, phone number if you gave one, your bookings, and anything you wrote in "Anything we should know?".'],
      ["Who sees it", "Only the studio team. You only ever see your own bookings. Free and full times never show anyone else's name."],
      ["Your specialist's calendar", "If your specialist connects a Google or Outlook calendar, your visit appears there with your first name and initial. The morning after the visit, it shows the service only."],
      ["Payments", "Paying online happens on the payment service's own page. We never see your card."],
      ["Reviews", 'Reviews show your first name and initial, like "Ava R.". Never your e-mail.'],
      ["E-mail, and texts if you ask", "We contact you by e-mail. We text you only if you tick the box for texts when you book: a reminder before your visit, and any waiting-list opening you asked for. Texts go through the studio's text provider and the phone networks, and each one tells you how to stop. Every review request has a link to stop them, and you can switch them off in Your visits."],
      ["Google reviews", 'Google reviews load from Google only when you press "See our Google reviews".'],
      ["Deleting your details", 'Sign in and choose "Delete my details" in Your visits. It cancels the visits still ahead, and we say so first.'],
    ],
  }),
  terms: (f) => ({
    title: "Terms",
    intro: "The short version of how booking with us works.",
    items: [
      ["Your booking", `A booking is made when you see "You're booked" and we e-mail you. We hold a time for ${String(f.hold)} minutes while a deposit is paid.`],
      ["Prices", `Prices are in ${f.currency} and are what you pay. There is no tax line, tip or service charge.`],
      ["Deposits", "Paid on the payment service's own page. We never see your card."],
      ["Booking window", `You can book from ${String(f.notice)} hours ahead to ${String(f.window)} working days ahead. We are closed on the days the studio lists as closures.`],
    ],
  }),
};

const SETS: Record<LocaleTag, DocSet> = {
  "en-US": DOCS_EN,
  "de-DE": DOCS_DE,
  "fr-FR": DOCS_FR,
  "da-DK": DOCS_DA,
  "cs-CZ": DOCS_CS,
  "ar-EG": DOCS_AR,
  "zh-CN": DOCS_ZH_CN,
  "zh-TW": DOCS_ZH_TW,
};

export const docWords = (locale: LocaleTag): DocSet => SETS[locale];
