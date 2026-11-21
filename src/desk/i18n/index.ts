/**
 * The desk's words, in the eight languages, kept apart from the customer
 * side's so the two lanes never edit one file. English defines the keys; a
 * language that lacks one falls back to English, and the parity test lists it.
 *
 * A count picks its plural by `|`, in the order each language's rules give.
 * In a right-to-left page a filled-in value is isolated, so a name or a figure
 * keeps its own direction inside the sentence.
 */
import { useMemo } from "react";

import { useI18n, type LocaleTag } from "../../i18n/index.tsx";
import { en } from "./en.ts";
import { TRANSLATIONS } from "./translations.ts";

export type DeskKey = keyof typeof en;
export type DeskT = (key: DeskKey, params?: Record<string, string | number>, count?: number) => string;

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

export function makeDeskT(locale: LocaleTag): DeskT {
  const bundle: Partial<Record<DeskKey, string>> = locale === "en-US" ? en : (TRANSLATIONS[locale] ?? {});
  const rules = new Intl.PluralRules(locale);
  const rtl = locale.startsWith("ar");
  return (key, params, count) => {
    let raw: string = bundle[key] ?? en[key];
    if (count !== undefined && raw.includes("|")) {
      const variants = raw.split("|");
      const at = PLURAL_ORDER[locale].indexOf(rules.select(count));
      raw = variants[at === -1 ? variants.length - 1 : Math.min(at, variants.length - 1)]!;
    }
    const all = count === undefined ? params : { count, ...params };
    if (all === undefined) return raw;
    return raw.replace(/\{(\w+)\}/g, (whole: string, name: string) => {
      if (!(name in all)) return whole;
      const value = String(all[name]);
      return rtl ? `⁨${value}⁩` : value;
    });
  };
}

export function useDeskT(): DeskT {
  const { locale } = useI18n();
  return useMemo(() => makeDeskT(locale), [locale]);
}
