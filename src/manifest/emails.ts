/**
 * The studio's e-mails, one template per outbox kind, in the eight languages.
 *
 * A language is only its words (`Words`): the layout is written once below, so
 * no language can lose a block the others have. Short marks stand for the
 * outbox's variables and are expanded here, so a translator never retypes one:
 *
 *   {S} service · {D} day · {T} time · {P} the person · {N} the reader's first name
 *   {PAID} paid · {REST} left to pay at the studio · {DUE} to pay online now
 *   {WAS} what had been paid before a cancel · {FREE} free to change until
 *   {HOLD} the hold's minutes · {UNTIL} the deposit link's last moment · {H} the cancel window's hours
 *
 * Mail has one light palette and no icons (L3-F4, F5): the engine draws the
 * tables, the button and the plain-text part. A money line is left out when
 * there is nothing to say, and every sentence that depends on the row is chosen
 * by a variable, never by what the writer assumed (L3-F7, F9).
 */
import { EMAIL_EN, type Words } from "./email-en.ts";
import { EMAIL_AR, EMAIL_CS, EMAIL_DA, EMAIL_DE, EMAIL_FR, EMAIL_ZH_CN, EMAIL_ZH_TW } from "./email-words.ts";
import { LOCALES, type Tag } from "./labels.ts";
import { KINDS, templateKey, type Kind } from "./outbox.ts";

export { EMAIL_EN, type Words };
export const STAFF_TEMPLATE = "bookings-staff-booked";

const MARKS: Record<string, string> = {
  "{S}": "{{service.name}}",
  "{D}": "{{booking.starts_at.date}}",
  "{T}": "{{booking.starts_at.time}}",
  "{P}": "{{team.name}}",
  "{N}": "{{recipient.first_name}}",
  "{PAID}": "{{booking.shown_paid.money}}",
  "{REST}": "{{booking.rest_at_studio.money}}",
  "{DUE}": "{{booking.pay_due.money}}",
  "{WAS}": "{{was.shown_paid.money}}",
  "{FREE}": "{{booking.free_until.date}}, {{booking.free_until.time}}",
  "{HOLD}": "{{practice.hold_min}}",
  "{UNTIL}": "{{booking.link_until.date}}, {{booking.link_until.time}}",
  "{H}": "{{practice.cancel_hours}}",
};
const fill = (text: string) => text.replace(/\{[A-Z]+\}/g, (mark) => MARKS[mark] ?? mark);

type Block = { block: string; id: string; data: Record<string, unknown>; showWhen?: { var: string }; otherwise?: string };

const para = (id: string, ...paras: string[]): Block => ({ block: "email.text", id, data: { paras: paras.map(fill) } });
const when = (variable: string, block: Block, otherwise?: string): Block => ({ ...block, showWhen: { var: variable }, ...(otherwise === undefined ? {} : { otherwise: fill(otherwise) }) });
const heading = (text: string): Block => ({ block: "email.heading", id: "heading", data: { text: fill(text) } });
const button = (id: string, label: string, url: string): Block => ({ block: "email.button", id, data: { label: fill(label), url } });
const links = (id: string, ...items: { label: string; url: string }[]): Block => ({ block: "email.social", id, data: { links: items.map((item) => ({ label: fill(item.label), url: item.url })) } });
const lines = (id: string, ...rows: { label: string; amount: string }[]): Block => ({ block: "email.tax-breakdown", id, data: { lines: rows.map((row) => ({ label: fill(row.label), amount: fill(row.amount) })) } });

/** The booking's own link: the token rides the fragment, so it reaches no log (cT8). */
const OWN_LINK = "{{manage_url}}#{{booking.link_token}}";

const facts = (w: Words) =>
  lines(
    "booking",
    { label: "{S}", amount: "{{booking.minutes}} min" },
    { label: w.when, amount: "{D} · {{booking.time_range}}" },
    { label: w.with, amount: "{P}" },
    { label: w.code, amount: "{{booking.code}}" },
  );
const priceAtStudio = (w: Words) => lines("price", { label: `${w.price} · ${w.atStudio}`, amount: "{{booking.net_price.money}}" });
/** What is owed on a visit already booked: what it costs, what came in online, what is left to pay at the studio. */
const owed = (w: Words): Block[] => [
  lines("price", { label: w.price, amount: "{{booking.net_price.money}}" }),
  when("booking.shown_paid", lines("paid", { label: w.paidOnline, amount: "{PAID}" })),
  when("booking.rest_at_studio", lines("rest", { label: w.toPayStudio, amount: "{REST}" })),
];
const addToCalendar = (w: Words) =>
  when("calendarGoogle", links("calendar", { label: `${w.addToCalendar}: Google Calendar`, url: "{{calendarGoogle}}" }, { label: "Outlook", url: "{{calendarOutlook}}" }));
const manage = (w: Words) => links("manage", { label: w.manage, url: OWN_LINK });
const bookAnother = (w: Words) => button("again", w.bookAnother, "{{booking_url}}");

/** The policy line follows the deadline: never a "free until" that has already passed (L3-F7). */
const policy = (w: Words, paid: boolean) => when("booking.free_hours", para("policy", paid ? w.freeUntilPaid : w.freeUntil), paid ? w.tooLatePaid : w.tooLate);

function blocks(kind: Kind, w: Words): { subject: string; preheader: string; blocks: Block[] } {
  const anyoneLine = when("booking.shown_anyone", para("anyone", w.anyone));
  switch (kind) {
    case "booked":
      return {
        subject: w.bookedSubject,
        preheader: `${w.bookedPre} ${w.atStudio}.`,
        blocks: [heading(w.bookedHeading), para("thanks", w.bookedThanks), facts(w), anyoneLine, priceAtStudio(w), addToCalendar(w), para("file", w.fileAttached), policy(w, false), manage(w)],
      };
    case "deposit_receipt":
      return {
        subject: w.bookedSubject,
        preheader: w.paidPre,
        blocks: [
          heading(w.bookedHeading),
          para("thanks", w.paidThanks),
          facts(w),
          anyoneLine,
          ...owed(w),
          addToCalendar(w),
          para("file", w.fileAttached),
          policy(w, true),
          manage(w),
        ],
      };
    case "deposit_link":
      return {
        subject: w.linkSubject,
        preheader: w.linkPre,
        blocks: [
          heading(w.linkHeading),
          para("intro", w.linkIntro),
          facts(w),
          lines("price", { label: w.price, amount: "{{booking.net_price.money}}" }, { label: w.toPayOnline, amount: "{DUE}" }),
          when("booking.rest_at_studio", lines("rest", { label: w.toPayStudio, amount: "{REST}" })),
          para("hold", w.linkHold, w.linkUntil),
          button("pay", w.linkPay, OWN_LINK),
          para("secure", w.linkSecure, w.linkNoCard),
          policy(w, true),
        ],
      };
    case "let_go":
      return {
        subject: w.letSubject,
        preheader: w.letPre,
        blocks: [heading(w.letHeading), para("body", w.letBody), facts(w), bookAnother(w)],
      };
    case "reminder":
      return {
        subject: w.remSubject,
        preheader: w.remPre,
        blocks: [
          heading(w.remHeading),
          para("intro", w.remIntro),
          facts(w),
          ...owed(w),
          when("service.bring", para("bring", w.remBring)),
          when("booking.free_at_reminder", para("policy", w.remFree), w.remLate),
          manage(w),
        ],
      };
    case "moved":
      return {
        subject: w.movedSubject,
        preheader: w.movedPre,
        blocks: [heading(w.movedHeading), para("intro", w.movedIntro), facts(w), ...owed(w), addToCalendar(w), para("file", w.movedFile, w.movedOld), policy(w, false), manage(w)],
      };
    case "cancelled":
      return {
        subject: w.cancelSubject,
        preheader: w.cancelPre,
        blocks: [
          heading(w.cancelHeading),
          para("intro", w.cancelIntro),
          when("was.shown_paid", para("back", w.cancelBack, w.cancelBackNote)),
          facts(w),
          para("file", w.fileRemoves),
          bookAnother(w),
        ],
      };
    case "cancelled_late":
      return {
        subject: w.cancelSubject,
        preheader: w.latePre,
        blocks: [
          heading(w.cancelHeading),
          para("intro", w.lateIntro),
          when("was.shown_paid", para("kept", w.lateKept)),
          para("note", w.lateNote),
          facts(w),
          para("file", w.fileRemoves),
          bookAnother(w),
        ],
      };
    case "cancelled_studio":
      return {
        subject: w.studioSubject,
        preheader: w.studioPre,
        blocks: [
          heading(w.studioHeading),
          para("intro", w.studioIntro),
          when("booking.cancel_reason", { block: "email.quote", id: "reason", data: { text: "{{booking.cancel_reason}}", author: "{{appName}}" } }),
          facts(w),
          when("was.shown_paid", para("refund", w.studioBack), w.studioNothing),
          para("file", w.fileRemoves),
          bookAnother(w),
        ],
      };
    case "offer":
      return {
        subject: w.offerSubject,
        preheader: w.offerFirst,
        blocks: [
          heading(w.offerHeading),
          para("intro", w.offerIntro),
          facts(w),
          lines("price", { label: w.price, amount: "{{booking.net_price.money}}" }),
          button("take", w.offerButton, OWN_LINK),
          para("first", w.offerFirst),
          links("leave", { label: w.offerLeave, url: OWN_LINK }),
        ],
      };
    case "review_request":
    case "review_reminder": {
      const again = kind === "review_reminder";
      return {
        subject: again ? w.againSubject : w.reviewSubject,
        preheader: again ? w.againLine : w.reviewPre,
        blocks: [
          heading(w.reviewHeading),
          para("intro", again ? w.againLine : w.reviewIntro),
          // A star opens the page with it chosen, and saves nothing until the guest sends it: mail scanners follow links (FIL-12).
          links("stars", ...[1, 2, 3, 4, 5].map((n) => ({ label: `${String(n)} ${w.star}`, url: `{{reviewLink}}&star=${String(n)}` }))),
          para("hint", w.starsHint),
          button("write", w.reviewButton, "{{reviewLink}}"),
          para("alike", w.reviewAlike),
          when("stopLink", links("stop", { label: w.reviewStop, url: "{{stopLink}}" })),
          when("stopLink", para("stop-note", w.reviewStopNote)),
        ],
      };
    }
  }
}

const FOOT = "{{appName}} · {{practice.address_line1}}, {{practice.city}}, {{practice.region}} {{practice.zip}}";

function layout(kind: Kind, w: Words) {
  const made = blocks(kind, w);
  return { subject: fill(made.subject), preheader: fill(made.preheader), blocks: made.blocks, footer: FOOT };
}

/** The notice to the specialist: what and when, and no guest's name, contact or price (L3-F15). */
function staffLayout(w: Words) {
  return {
    subject: w.staffSubject,
    preheader: w.staffPre,
    blocks: [
      { block: "email.heading", id: "heading", data: { text: w.staffHeading } },
      {
        block: "email.tax-breakdown",
        id: "booking",
        data: {
          lines: [
            { label: "{{service_name}}", amount: "{{record.minutes}} min" },
            { label: w.when, amount: "{{record.starts_at}}" },
            { label: w.code, amount: "{{record.code}}" },
          ],
        },
      },
      { block: "email.text", id: "who", data: { paras: [w.staffAnyone] } },
      { block: "email.button", id: "diary", data: { label: w.staffOpen, url: "{{recordUrl}}" } },
    ],
    footer: FOOT.replace(/\{\{practice\.[a-z_0-9]+\}\},? ?/g, "").replace(/ · $/, ""),
  };
}

export function emailWords(): Record<Tag, Words> {
  return {
    "en-US": EMAIL_EN,
    "de-DE": EMAIL_DE,
    "fr-FR": EMAIL_FR,
    "da-DK": EMAIL_DA,
    "cs-CZ": EMAIL_CS,
    "ar-EG": EMAIL_AR,
    "zh-CN": EMAIL_ZH_CN,
    "zh-TW": EMAIL_ZH_TW,
  };
}

/** The mails that carry the booking's calendar entry: an invitation while it holds the time, a cancellation once it does not (L3-F17). */
const WITH_CALENDAR: ReadonlySet<Kind> = new Set(["booked", "deposit_receipt", "moved", "cancelled", "cancelled_late", "cancelled_studio"]);

function varsOf(content: unknown): string[] {
  const found = new Set<string>();
  for (const [, name] of JSON.stringify(content).matchAll(/\{\{([A-Za-z_][A-Za-z0-9_.]*)\}\}/g)) found.add(name!);
  return [...found].filter((name) => /^[a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*)*$/.test(name) || name === "appName").sort();
}

export function emailTemplates(): unknown[] {
  const words = emailWords();
  const of = <T>(pick: (w: Words) => T) => Object.fromEntries(LOCALES.map((tag) => [tag, pick(words[tag])]));
  return [
    ...KINDS.map((kind) => ({
      key: templateKey(kind),
      ...(WITH_CALENDAR.has(kind) ? { calendar: { link: "booking" } } : {}),
      name: of((w) => w.names[kind]),
      vars: varsOf(layout(kind, EMAIL_EN)),
      locales: of((w) => layout(kind, w)),
    })),
    {
      key: STAFF_TEMPLATE,
      name: of((w) => w.names.staff),
      vars: varsOf(staffLayout(EMAIL_EN)),
      locales: of((w) => staffLayout(w)),
    },
  ];
}
