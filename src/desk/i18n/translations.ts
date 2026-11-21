/** The desk's words in the seven other languages. A key left out falls back to English, and the parity test lists it. */
import type { LocaleTag } from "../../i18n/index.tsx";
import type { en } from "./en.ts";

export const TRANSLATIONS: Partial<Record<LocaleTag, Partial<Record<keyof typeof en, string>>>> = {};
