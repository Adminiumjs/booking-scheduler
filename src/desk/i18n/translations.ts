/** The desk's words in the seven other languages. A key left out falls back to English, and the parity test lists it. */
import type { LocaleTag } from "../../i18n/index.tsx";
import type { en } from "./en.ts";
import { ar } from "./locales/ar-EG.ts";
import { cs } from "./locales/cs-CZ.ts";
import { da } from "./locales/da-DK.ts";
import { de } from "./locales/de-DE.ts";
import { fr } from "./locales/fr-FR.ts";
import { zhCN } from "./locales/zh-CN.ts";
import { zhTW } from "./locales/zh-TW.ts";

export const TRANSLATIONS: Partial<Record<LocaleTag, Partial<Record<keyof typeof en, string>>>> = {
  "de-DE": de,
  "fr-FR": fr,
  "da-DK": da,
  "cs-CZ": cs,
  "ar-EG": ar,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
};
