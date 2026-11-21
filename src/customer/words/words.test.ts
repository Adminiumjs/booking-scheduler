import { describe, expect, it } from "vitest";

import { LOCALE_TAGS, type LocaleTag } from "../../i18n/locales.ts";
import { docWords, type DocFacts } from "./docs.ts";
import { EN, loadWords, say, type Word } from "./index.ts";

const FORMS: Record<LocaleTag, number> = { "en-US": 2, "de-DE": 2, "fr-FR": 2, "da-DK": 2, "cs-CZ": 3, "ar-EG": 6, "zh-CN": 1, "zh-TW": 1 };
const slots = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort();
const FACTS: DocFacts = { hours: 24, hold: 15, notice: 2, window: 30, deposits: "Root Color ($50)", hasDeposits: true, currency: "USD" };

describe.each(LOCALE_TAGS.filter((l) => l !== "en-US"))("the customer pages in %s", (locale) => {
  it("has every word, with the same values and the right plural forms", async () => {
    const words = await loadWords(locale);
    expect(Object.keys(words).sort()).toEqual(Object.keys(EN).sort());
    for (const word of Object.keys(EN) as Word[]) {
      const forms = words[word].split("|");
      expect(forms.length, word).toBe(EN[word].includes("|") ? FORMS[locale] : 1);
      for (const form of forms) expect(slots(form), `${word}: ${form}`).toEqual([...new Set(slots(EN[word].split("|")[0]!))].sort());
    }
  });

  it("is translated, not English with a new label", async () => {
    const words = await loadWords(locale);
    // "Book {service}" is also the Danish.
    const same = (Object.keys(EN) as Word[]).filter((w) => words[w] === EN[w] && EN[w].length > 12 && w !== "bookLabel");
    expect(same).toEqual([]);
  });

  it("writes the four text pages with the studio's own figures", () => {
    const set = docWords(locale);
    for (const page of ["help", "policy", "privacy", "terms"] as const) {
      const doc = set[page](FACTS);
      expect(doc.items.length, page).toBe(docWords("en-US")[page](FACTS).items.length);
      expect(JSON.stringify(doc), page).not.toContain("undefined");
    }
    expect(JSON.stringify(set.help(FACTS))).toContain("Root Color ($50)");
    expect(JSON.stringify(set.policy(FACTS))).toContain("24");
  });
});

describe("a message with a count", () => {
  it("picks the language's own plural form", () => {
    expect(say(EN, "en-US", "fromReviews", { n: 1 })).toBe("from 1 review");
    expect(say(EN, "en-US", "fromReviews", { n: 223 })).toBe("from 223 reviews");
  });
});
