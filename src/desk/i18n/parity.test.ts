/**
 * Every language carries every key of the desk, with the same blanks to fill and one form per plural rule of that language.
 * A key missing here would show English on a translated screen.
 */
import { describe, expect, it } from "vitest";

import { en } from "./en.ts";
import { makeDeskT, type DeskKey } from "./index.ts";
import { TRANSLATIONS } from "./translations.ts";

const FORMS: Record<string, number> = { "de-DE": 2, "fr-FR": 2, "da-DK": 2, "cs-CZ": 3, "ar-EG": 6, "zh-CN": 1, "zh-TW": 1 };
const keys = Object.keys(en) as DeskKey[];
const blanks = (text: string) => [...new Set(text.match(/\{\w+\}/g) ?? [])].sort();

describe.each(Object.keys(FORMS))("the desk in %s", (tag) => {
  const bundle = TRANSLATIONS[tag as keyof typeof TRANSLATIONS] ?? {};

  it("has every key and no other", () => {
    expect(keys.filter((key) => bundle[key] === undefined || bundle[key] === "")).toEqual([]);
    expect(Object.keys(bundle).filter((key) => !(key in en))).toEqual([]);
  });

  it("keeps the same blanks", () => {
    const wrong = keys.filter((key) => bundle[key] !== undefined && blanks(bundle[key]).join() !== blanks(en[key]).join());
    expect(wrong).toEqual([]);
  });

  it("has one form per plural rule, and only where English counts", () => {
    const wrong = keys.filter((key) => {
      const text = bundle[key];
      if (text === undefined) return false;
      const forms = text.split("|").length;
      return en[key].includes("|") ? forms !== FORMS[tag] : forms !== 1;
    });
    expect(wrong).toEqual([]);
  });

  it("fills a sentence with a count", () => {
    const t = makeDeskT(tag as Parameters<typeof makeDeskT>[0]);
    expect(t("today.count", {}, 3)).toContain("3");
  });
});
