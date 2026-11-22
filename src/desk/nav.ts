/**
 * The desk's sections, as Adminium lists them in its sidebar (`surface.json`)
 * and as the desk's own sidebar draws them. A booking and a client are panels
 * over a section, so they have no entry. The desk lives at `/a/bookings/…`
 * inside the console (MOD-18).
 *
 * Icons are lucide NAMES in kebab-case, never imported components: this module
 * is read by the Vite config.
 */
import type { SurfaceNavEntry } from "../surface-types.ts";
import type { en } from "./i18n/en.ts";

export type DeskNavEntry = SurfaceNavEntry<string> & { labelKey: keyof typeof en; icon: string };

export const DESK_NAV = [
  { id: "today", path: "today", view: "today", side: "staff", icon: "house", labelKey: "nav.today" },
  { id: "calendar", path: "calendar", view: "calendar", side: "staff", icon: "calendar-days", labelKey: "nav.calendar" },
  { id: "clients", path: "clients", view: "clients", side: "staff", icon: "users", labelKey: "nav.clients" },
  { id: "services", path: "services", view: "services", side: "staff", icon: "sparkles", labelKey: "nav.services" },
  { id: "team", path: "team", view: "team", side: "staff", icon: "id-card", labelKey: "nav.team" },
  { id: "waiting", path: "waiting", view: "waiting", side: "staff", icon: "list-ordered", labelKey: "nav.waiting" },
  { id: "reviews", path: "reviews", view: "reviews", side: "staff", icon: "star", labelKey: "nav.reviews" },
  { id: "settings", path: "settings", view: "settings", side: "staff", icon: "settings", labelKey: "nav.settings" },
] as const satisfies readonly DeskNavEntry[];
