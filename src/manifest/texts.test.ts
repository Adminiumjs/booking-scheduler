/**
 * The studio's texts as the manifest declares them (plan 80, T19): two kinds,
 * their words in eight languages, and the box on the booking form.
 */
import { describe, expect, it } from "vitest";

import { EN, type Words } from "../customer/words/en.ts";
import { WORDS as AR } from "../customer/words/ar.ts";
import { WORDS as CS } from "../customer/words/cs.ts";
import { WORDS as DA } from "../customer/words/da.ts";
import { WORDS as DE } from "../customer/words/de.ts";
import { WORDS as FR } from "../customer/words/fr.ts";
import { WORDS as ZH_CN } from "../customer/words/zh-CN.ts";
import { WORDS as ZH_TW } from "../customer/words/zh-TW.ts";
import { asksForYes, checkTextTemplate } from "../testing/manifest/text-messages.ts";
import { buildManifest } from "./build.ts";
import { LOCALES, type Tag } from "./labels.ts";
import { NOT_TYPED_ON_A_BOOKING } from "./roles.ts";
import { TEXT_BOX, textBoxWording } from "./texts.ts";

type Doc = Record<string, any>;
const doc = buildManifest() as Doc;
const outbox = doc["outbox"] as Doc;
const templates = doc["textTemplates"] as { key: string; locales: Record<string, { body: string }> }[];
const bookings = (doc["requiredSchema"].tables as Doc[]).find((t) => t["ref"] === "bookings")!;
const column = (ref: string) => (bookings["columns"] as Doc[]).find((c) => c["ref"] === ref)!;
const doors = (doc["publicAccess"] as Doc[]).filter((e) => e["table"] === "bookings" && (e["methods"] as string[]).includes("POST"));

/** The page's words for the box, by the manifest's language tags. */
const PAGE: Record<Tag, Words> = { "en-US": EN, "de-DE": DE, "fr-FR": FR, "da-DK": DA, "cs-CZ": CS, "ar-EG": AR, "zh-CN": ZH_CN, "zh-TW": ZH_TW };

/** The counter's two tables (Adminium's `length.ts`): 160 / 153 in the GSM set, 70 / 67 otherwise. */
const GSM = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà^{}\\[~]|€";
function segments(text: string): number {
  const chars = [...text];
  const gsm = chars.every((c) => GSM.includes(c));
  const [one, many] = gsm ? [160, 153] : [70, 67];
  const units = chars.reduce((sum, c) => sum + (gsm ? ("^{}\\[~]|€".includes(c) ? 2 : 1) : c.length), 0);
  return units <= one ? 1 : Math.ceil(units / many);
}
const SAMPLE: Record<string, string> = {
  appName: "Lumen Studio",
  "service.name": "Reformer Pilates",
  "team.name": "Ivy Thornton",
  "booking.starts_at.date": "Thursday, September 17",
  "booking.starts_at.time": "5:00 PM",
  "booking.offer_until.date": "Wednesday, September 16",
  "booking.offer_until.time": "5:00 PM",
};
/** The longest opt-out line Adminium may add, in each language. */
const OPT_OUT: Record<Tag, string> = {
  "en-US": "To stop these texts, contact hello@lumenstudio.example",
  "de-DE": "Keine SMS mehr: hello@lumenstudio.example",
  "fr-FR": "Pour ne plus recevoir de SMS : hello@lumenstudio.example",
  "da-DK": "Stop sms'er: hello@lumenstudio.example",
  "cs-CZ": "Zrušení SMS: hello@lumenstudio.example",
  "ar-EG": "لإيقاف الرسائل: hello@lumenstudio.example",
  "zh-CN": "退订请联系：hello@lumenstudio.example",
  "zh-TW": "退訂請聯絡：hello@lumenstudio.example",
};

describe("the studio's texts", () => {
  it("are two kinds of their own, each a text, a service text, and never a mail purpose", () => {
    expect(outbox["channels"]).toEqual({ reminder_text: "sms", offer_text: "sms" });
    expect(outbox["kinds"]).toMatchObject({ reminder_text: "bookings-reminder-text", offer_text: "bookings-offer-text" });
    expect(outbox["classes"]).toMatchObject({ reminder_text: "service", offer_text: "service" });
    expect(Object.keys(outbox["purposes"])).not.toContain("reminder_text");
    expect(outbox["recipient"]).toMatchObject({ phone: "phone", fallback: { phone: "phone" } });
    expect(outbox["settings"]).toMatchObject({ phone: "phone", replyTo: "email" });
  });

  it("time the reminder as the e-mail's, only for a booking whose box was ticked, so the engine skips it rather than send it after the visit", () => {
    const producers = outbox["producers"] as Doc[];
    const mail = producers.find((p) => p["kind"] === "reminder")!;
    const text = producers.find((p) => p["kind"] === "reminder_text")!;
    // A `before` reminder's moment is its visit: the send path never holds it past that (Q9).
    expect(text["before"]).toEqual({ ...mail["before"], where: { column: "text_reminds", eq: 1 } });
    expect(JSON.stringify(column("text_reminds")["rules"])).toContain('"texts_ok",true');
    expect(outbox["waiting"]).not.toContain("reminder_text");
  });

  it("send the waiting-list offer when the desk makes it, and drop it once the offer is taken or gone", () => {
    const offer = (outbox["producers"] as Doc[]).find((p) => p["kind"] === "offer_text")!;
    expect(outbox["waiting"]).toEqual(["offer_text"]);
    expect(offer["onCreate"]).toEqual({ table: "bookings", where: { column: "state", eq: "offered" } });
    expect(offer["dropWhen"][0]["in"]).toEqual(["paying", "booked", "lapsed", "cancelled"]);
  });

  it("are written in all eight languages, with nothing a text may not carry", () => {
    expect(templates.map((t) => t.key)).toEqual(["bookings-reminder-text", "bookings-offer-text"]);
    for (const template of templates) {
      expect(Object.keys(template.locales).sort()).toEqual([...LOCALES].sort());
      for (const [locale, { body }] of Object.entries(template.locales)) {
        expect(checkTextTemplate(body), `${template.key} ${locale}`).toEqual({ ok: true });
        expect(body, `${template.key} ${locale}`).toMatch(/^\{\{appName\}\}/);
        expect(body, `${template.key} ${locale}`).not.toMatch(/https?:|link|STOP|\{[A-Z]+\}/);
      }
    }
  });

  it("stay short: at most four segments with long values and the longest opt-out (Adminium refuses past six)", () => {
    for (const template of templates) {
      for (const locale of LOCALES) {
        const filled = template.locales[locale]!.body.replace(/\{\{([\w.]+)\}\}/g, (_, name: string) => SAMPLE[name] ?? "?");
        const whole = `${filled}${locale.startsWith("zh") ? "" : " "}${OPT_OUT[locale]}`;
        expect(segments(whole), `${template.key} ${locale}: ${whole}`).toBeLessThanOrEqual(4);
      }
    }
  });

  it("leave review requests to e-mail (A5)", () => {
    expect(Object.keys(outbox["channels"])).not.toContain("review_request");
    expect(templates.some((t) => t.key.includes("review"))).toBe(false);
  });
});

describe("the box for texts in booking step 4", () => {
  it("is on every door, its own column, unticked and never required", () => {
    expect(doors).toHaveLength(3);
    for (const door of doors) {
      expect(door["textConsent"]).toMatchObject({ column: "texts_ok", phone: "phone", class: "service" });
      expect(door["consent"]["column"]).not.toBe("texts_ok");
      expect(door["writable"]).toContain("texts_ok");
      expect(door["requires"]).not.toContain("texts_ok");
      expect(door["defaults"]?.["texts_ok"]).toBeUndefined();
    }
    expect(column("texts_ok")).toMatchObject({ type: "bool", default: false });
    expect(column("texts_ok")["rules"]).toBeUndefined();
  });

  it("is never ticked by staff", () => {
    expect(NOT_TYPED_ON_A_BOOKING).toContain("texts_ok");
    for (const role of doc["roles"] as Doc[]) {
      expect(role["limits"]?.["bookings"]?.["creatable"] ?? [], role["key"]).not.toContain("texts_ok");
      expect(role["limits"]?.["bookings"]?.["writable"] ?? [], role["key"]).not.toContain("texts_ok");
    }
  });

  it("is kept with the words the page shows, in each language, and never asks for a YES", () => {
    const wording = doors[0]!["textConsent"]["wording"];
    expect(wording["version"]).toBe(1);
    for (const tag of LOCALES) {
      const page = PAGE[tag];
      expect([page.textBox, page.textBoxSub, page.textBoxOptional], tag).toEqual([TEXT_BOX[tag].label, TEXT_BOX[tag].sub, TEXT_BOX[tag].optional]);
      expect(wording["text"][tag]).toBe(textBoxWording(tag));
      expect(wording["text"][tag]).toContain(TEXT_BOX[tag].sub);
      expect(asksForYes(wording["text"][tag])).toBe(false);
    }
  });

  it("carries the words A5 gives, as written", () => {
    expect(TEXT_BOX["en-US"]).toEqual({
      label: "Text me about my booking",
      sub: "A reminder before your visit, and any waiting-list opening you asked for.",
      optional: "Optional. You can stop at any time; each text tells you how.",
    });
    expect(EN.textBoxChina).toBe("We can't send texts to numbers in mainland China. Everything else works as usual.");
    expect(TEXT_BOX["ar-EG"].label).toBe("أرسلوا لي رسائل عن حجزي");
    expect(TEXT_BOX["zh-TW"].sub).toBe("到訪前提醒，以及您候補的空檔通知。");
  });

  it("asks for Adminium 0.3.76, the first release that sends texts", () => {
    expect(doc["compatibility"]["minAdminiumVersion"]).toBe("0.3.76");
    expect(doc["textReplies"]).toBe("on");
  });
});
