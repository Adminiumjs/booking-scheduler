/**
 * The words `surface.json` carries, in the eight languages: the desk's section
 * names from its own bundle, and the two that belong to the app as a whole.
 * Read by the Vite config, so it imports nothing that needs a browser.
 */
import { en } from "./desk/i18n/en.ts";
import { ar } from "./desk/i18n/locales/ar-EG.ts";
import { cs } from "./desk/i18n/locales/cs-CZ.ts";
import { da } from "./desk/i18n/locales/da-DK.ts";
import { de } from "./desk/i18n/locales/de-DE.ts";
import { fr } from "./desk/i18n/locales/fr-FR.ts";
import { zhCN } from "./desk/i18n/locales/zh-CN.ts";
import { zhTW } from "./desk/i18n/locales/zh-TW.ts";

const own: Record<string, { "app.name": string; "nav.site": string }> = {
  "en-US": { "app.name": "Bookings", "nav.site": "Booking site" },
  "de-DE": { "app.name": "Buchungen", "nav.site": "Buchungsseite" },
  "fr-FR": { "app.name": "Réservations", "nav.site": "Site de réservation" },
  "da-DK": { "app.name": "Bookinger", "nav.site": "Bookingside" },
  "cs-CZ": { "app.name": "Rezervace", "nav.site": "Rezervační stránka" },
  "ar-EG": { "app.name": "الحجوزات", "nav.site": "موقع الحجز" },
  "zh-CN": { "app.name": "预约", "nav.site": "预约网站" },
  "zh-TW": { "app.name": "預約", "nav.site": "預約網站" },
};

const desk: Record<string, Partial<Record<keyof typeof en, string>>> = { "en-US": en, "de-DE": de, "fr-FR": fr, "da-DK": da, "cs-CZ": cs, "ar-EG": ar, "zh-CN": zhCN, "zh-TW": zhTW };

export const SURFACE_MESSAGES: Record<string, Record<string, string>> = Object.fromEntries(
  Object.keys(own).map((tag) => [tag, { ...(desk[tag] as Record<string, string>), ...own[tag] }]),
);
