/**
 * The studio's texts (plan 80, T19): the two templates, the box on the booking
 * form, and whether staff read the guests' replies.
 *
 * A text is sent only through the studio's own Twilio or Telnyx account, and
 * only to a guest who ticked the box and has not said STOP. Adminium checks
 * that at every send, with the sending hours and the daily limit, and adds the
 * last line itself: "Reply STOP to opt out." from a number, the studio's phone
 * or e-mail from a sender name. So no template here writes an opt-out.
 *
 * What a text may never carry: a link (the offer's own link included), a code,
 * a "Reply YES". Each text opens with the studio's name, which Taiwan asks of
 * every text and which tells anyone who it is from.
 *
 * Review requests stay e-mail only (A5).
 */
import type { Tag } from "./labels.ts";
import { templateKey, TEXT_NAMES, type TextKind } from "./outbox.ts";
import { WORDS } from "./words.ts";

/** Staff may read a guest's answer, such as "running ten minutes late". The owner can turn it off in Adminium. */
export const TEXT_REPLIES = "on";

/** The marks a translator writes, expanded once here (as the e-mails do). */
const MARKS: Record<string, string> = {
  "{STUDIO}": "{{appName}}",
  "{S}": "{{service.name}}",
  "{P}": "{{team.name}}",
  "{D}": "{{booking.starts_at.date}}",
  "{T}": "{{booking.starts_at.time}}",
  "{UD}": "{{booking.offer_until.date}}",
  "{UT}": "{{booking.offer_until.time}}",
};
const fill = (text: string) => text.replace(/\{[A-Z]+\}/g, (mark) => MARKS[mark] ?? mark);

/**
 * THE REMINDER (L06): the studio, the service, who, the day and the time.
 * THE WAITING-LIST OFFER (L07): the service, day and time, until when it can be taken, and where to take it: the offer's e-mail
 * or a call. An offer holds nothing (cQ33), so the text says until when it can be taken "if it's still free", as its e-mail does.
 */
export const TEXT_WORDS: Record<TextKind, Record<Tag, string>> = {
  reminder_text: {
    "en-US": "{STUDIO}: a reminder of your {S} with {P} on {D} at {T}.",
    "de-DE": "{STUDIO}: Erinnerung an Ihren Termin {S} bei {P} am {D} um {T}.",
    "fr-FR": "{STUDIO} : rappel de votre rendez-vous {S} avec {P} le {D} à {T}.",
    "da-DK": "{STUDIO}: Påmindelse om din tid til {S} hos {P} den {D} kl. {T}.",
    "cs-CZ": "{STUDIO}: připomínáme váš termín {S} dne {D} v {T}. Obslouží vás {P}.",
    "ar-EG": "{STUDIO}: تذكير بموعدك لـ {S} مع {P} يوم {D} الساعة {T}.",
    "zh-CN": "{STUDIO}：提醒您，{D} {T}有您的{S}预约，服务人员：{P}。",
    "zh-TW": "{STUDIO}：提醒您，{D} {T}有您的{S}預約，服務人員：{P}。",
  },
  offer_text: {
    "en-US": "{STUDIO}: a time opened for {S} on {D} at {T}. You can take it until {UD}, {UT}, if it's still free. To book it, open our e-mail or call the studio.",
    "de-DE": "{STUDIO}: Ein Termin ist frei geworden: {S} am {D} um {T}. Sie können ihn bis {UD}, {UT} buchen, solange er frei ist. Öffnen Sie dazu unsere E-Mail oder rufen Sie das Studio an.",
    "fr-FR": "{STUDIO} : un créneau s'est libéré pour {S} le {D} à {T}. Vous pouvez le prendre jusqu'au {UD}, {UT}, s'il est encore libre. Pour le réserver, ouvrez notre e-mail ou appelez le studio.",
    "da-DK": "{STUDIO}: En tid er blevet ledig til {S} den {D} kl. {T}. Du kan tage den indtil {UD} kl. {UT}, hvis den stadig er ledig. Åbn vores e-mail for at booke den, eller ring til studiet.",
    "cs-CZ": "{STUDIO}: uvolnil se termín {S} {D} v {T}. Platí do {UD} {UT}, pokud bude volný. Rezervujte v našem e-mailu nebo zavolejte do studia.",
    "ar-EG": "{STUDIO}: توفر موعد لـ {S} يوم {D} الساعة {T}. يمكنك حجزه حتى {UD} الساعة {UT} إن ظل متاحًا. لحجزه افتح رسالتنا الإلكترونية أو اتصل بالاستوديو.",
    "zh-CN": "{STUDIO}：您候补的{S}有空档了：{D} {T}。如仍有空，可在{UD} {UT}前预约。请打开我们的电子邮件预约，或致电工作室。",
    "zh-TW": "{STUDIO}：您候補的{S}有空檔了：{D} {T}。如仍有空，可在{UD} {UT}前預約。請開啟我們的電子郵件預約，或致電工作室。",
  },
};

/** The two templates, as the manifest declares them. */
export function textTemplates(): Record<string, unknown>[] {
  return (Object.keys(TEXT_WORDS) as TextKind[]).map((kind) => ({
    key: templateKey(kind),
    name: { "en-US": TEXT_NAMES[kind], ...WORDS[TEXT_NAMES[kind]] },
    locales: Object.fromEntries(Object.entries(TEXT_WORDS[kind]).map(([locale, body]) => [locale, { body: fill(body) }])),
  }));
}

/**
 * THE BOX in booking step 4 (A5): the label, its line, and the line every form's box carries. The page shows these three; the
 * consent log keeps the same three as the wording the guest saw, with its version. A change of words is a new version.
 */
export const TEXT_BOX_VERSION = 1;
export const TEXT_BOX: Record<Tag, { label: string; sub: string; optional: string }> = {
  "en-US": {
    label: "Text me about my booking",
    sub: "A reminder before your visit, and any waiting-list opening you asked for.",
    optional: "Optional. You can stop at any time; each text tells you how.",
  },
  "de-DE": {
    label: "SMS zu meiner Buchung",
    sub: "Eine Erinnerung vor Ihrem Termin und frei gewordene Termine von Ihrer Warteliste.",
    optional: "Freiwillig. Sie können jederzeit abbestellen; jede SMS sagt Ihnen, wie.",
  },
  "fr-FR": {
    label: "M'envoyer des SMS sur ma réservation",
    sub: "Un rappel avant votre visite, et tout créneau libéré sur la liste d'attente que vous avez demandée.",
    optional: "Facultatif. Vous pouvez arrêter à tout moment ; chaque SMS vous dit comment.",
  },
  "da-DK": {
    label: "Send mig sms'er om min booking",
    sub: "En påmindelse før dit besøg, og ledige tider fra den venteliste, du har skrevet dig på.",
    optional: "Valgfrit. Du kan stoppe når som helst; hver sms fortæller dig hvordan.",
  },
  "cs-CZ": {
    label: "Posílat mi SMS o mé rezervaci",
    sub: "Připomínku před návštěvou a uvolněné termíny z pořadníku, o které jste požádali.",
    optional: "Nepovinné. Můžete kdykoli přestat; každá SMS vám řekne jak.",
  },
  "ar-EG": {
    label: "أرسلوا لي رسائل عن حجزي",
    sub: "تذكير قبل موعدك، وأي موعد يتوفر من قائمة الانتظار.",
    optional: "اختياري. يمكنك الإيقاف في أي وقت، وكل رسالة توضح لك الطريقة.",
  },
  "zh-CN": {
    label: "通过短信告知我预约信息",
    sub: "到访前提醒，以及您候补的空档通知。",
    optional: "可选。您可随时退订，每条短信都会说明退订方式。",
  },
  "zh-TW": {
    label: "以簡訊通知我預約資訊",
    sub: "到訪前提醒，以及您候補的空檔通知。",
    optional: "可選。您可隨時退訂，每則簡訊都會說明退訂方式。",
  },
};

/** What the consent log keeps: the three lines as the page shows them, one after the other. */
export const textBoxWording = (tag: Tag): string => {
  const box = TEXT_BOX[tag];
  const gap = tag.startsWith("zh") ? "" : " ";
  return [box.label + (tag.startsWith("zh") ? "。" : "."), box.sub, box.optional].join(gap);
};

/** The booking form's box for texts: a yes to service texts for the number typed, never a condition of booking (Q7). */
export const TEXT_CONSENT = {
  column: "texts_ok",
  phone: "phone",
  class: "service",
  wording: {
    version: TEXT_BOX_VERSION,
    text: Object.fromEntries((Object.keys(TEXT_BOX) as Tag[]).map((tag) => [tag, textBoxWording(tag)])),
  },
};
