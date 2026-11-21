/**
 * The customer pages' words: English in the bundle, every other language loaded
 * when it is asked for. A message with `|` has one form per plural category of
 * the language, in CLDR order; `{n}` picks the form.
 */
import type { LocaleTag } from "../../i18n/locales.ts";
import { EN, type Word, type Words } from "./en.ts";

export type { Word, Words };
export { EN };

const PLURAL_ORDER: Record<LocaleTag, Intl.LDMLPluralRule[]> = {
  "en-US": ["one", "other"],
  "de-DE": ["one", "other"],
  "fr-FR": ["one", "other"],
  "da-DK": ["one", "other"],
  "cs-CZ": ["one", "few", "other"],
  "zh-CN": ["other"],
  "zh-TW": ["other"],
  "ar-EG": ["zero", "one", "two", "few", "many", "other"],
};

const LOADERS: Partial<Record<LocaleTag, () => Promise<Words>>> = {
  "de-DE": () => import("./de.ts").then((m) => m.WORDS),
  "fr-FR": () => import("./fr.ts").then((m) => m.WORDS),
  "da-DK": () => import("./da.ts").then((m) => m.WORDS),
  "cs-CZ": () => import("./cs.ts").then((m) => m.WORDS),
  "ar-EG": () => import("./ar.ts").then((m) => m.WORDS),
  "zh-CN": () => import("./zh-CN.ts").then((m) => m.WORDS),
  "zh-TW": () => import("./zh-TW.ts").then((m) => m.WORDS),
};

export const loadWords = async (locale: LocaleTag): Promise<Words> => (await LOADERS[locale]?.()) ?? EN;

export type Params = Record<string, string | number>;
export type T = (word: Word, params?: Params) => string;

/** A message in a language, with its values in and its plural form picked by `n`. */
export function say(words: Words, locale: LocaleTag, word: Word, params: Params = {}): string {
  let text: string = words[word] ?? EN[word];
  if (text.includes("|")) {
    const forms = text.split("|");
    const n = Number(params["n"] ?? 0);
    const category = new Intl.PluralRules(locale).select(n);
    const at = PLURAL_ORDER[locale].indexOf(category);
    text = forms[at === -1 ? forms.length - 1 : at] ?? forms[forms.length - 1]!;
  }
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole));
}
