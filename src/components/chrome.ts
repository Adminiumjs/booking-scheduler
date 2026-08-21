/*
 * Chrome configuration for the demo dock and the studio sidebar.
 *
 * Kept out of the components so the dock, the sidebar and the mobile sheet all
 * quote the same arrays, and so adding a screen is a one-line edit here.
 *
 * Naming: the app is "Booking Scheduler" — that is the repo, the package and
 * the marketplace listing. "Lumen Studio" is the fictional salon the demo
 * portrays. The comps say "Selma's Studio"; the 2026-07-27 de-branding renamed
 * the in-demo salon, and that rename wins over the comp (the comp is the
 * visual spec, not the naming one).
 */

import type { MessageKey } from "../i18n/index.tsx";
import type { Persona, View } from "../data/types.ts";

/* ------------------------------------------------------------- the brand */

export const BRAND = {
  name: "Lumen Studio",
  /** The single-letter mark in the header and the studio sidebar. */
  mark: "L",
  /** Shown under the wordmark in the studio sidebar. */
  locality: "Alder Lane",
  /** Who is signed in on the studio half. The role is chrome, so it is a key. */
  owner: { name: "Selma Okonjo", initials: "SO", roleKey: "chrome.studio.ownerRole" },
} as const;

/* ------------------------------------------------------------- the dock */

export interface DockScreen {
  view: View;
  /** Message key — the dock and the sidebar translate it at the render site. */
  labelKey: MessageKey;
  icon: string;
}

/**
 * Every screen, grouped by persona, in the order the dock lists them.
 *
 * A screen with no entry here has no chip — that is how an unbuilt screen is
 * handled (hidden, never a dead button). All 50 are built, so all 50 appear.
 */
export const GUEST_SCREENS: DockScreen[] = [
  { view: "home", labelKey: "chrome.nav.home", icon: "sparkles" },
  { view: "services", labelKey: "chrome.nav.services", icon: "scissors" },
  { view: "booking", labelKey: "chrome.nav.booking", icon: "calendar-plus" },
  { view: "confirm", labelKey: "chrome.nav.confirm", icon: "check-circle" },
  { view: "manage", labelKey: "chrome.nav.manage", icon: "settings-2" },
  { view: "visits", labelKey: "chrome.nav.visits", icon: "history" },
  { view: "dash", labelKey: "chrome.nav.dash", icon: "layout-dashboard" },
  { view: "account", labelKey: "chrome.nav.account", icon: "user-round" },
  { view: "signin", labelKey: "chrome.nav.signin", icon: "log-in" },
  { view: "notifprefs", labelKey: "chrome.nav.notifprefs", icon: "bell" },
  { view: "staff", labelKey: "chrome.nav.staff", icon: "users" },
  { view: "reviews", labelKey: "chrome.nav.reviews", icon: "star" },
  { view: "shop", labelKey: "chrome.nav.shop", icon: "shopping-bag" },
  { view: "checkout", labelKey: "chrome.nav.checkout", icon: "credit-card" },
  { view: "orders", labelKey: "chrome.nav.orders", icon: "receipt" },
  { view: "packages", labelKey: "chrome.nav.packages", icon: "layers" },
  { view: "offers", labelKey: "chrome.nav.offers", icon: "tag" },
  { view: "rewards", labelKey: "chrome.nav.rewards", icon: "gift" },
  { view: "loyalty", labelKey: "chrome.nav.loyalty", icon: "heart" },
  { view: "lhistory", labelKey: "chrome.nav.lhistory", icon: "list" },
  { view: "giftcards", labelKey: "chrome.nav.giftcards", icon: "gift" },
  { view: "mygifts", labelKey: "chrome.nav.mygifts", icon: "wallet" },
  { view: "group", labelKey: "chrome.nav.group", icon: "users-round" },
  { view: "waitlist", labelKey: "chrome.nav.waitlist", icon: "clock" },
  { view: "waitliststatus", labelKey: "chrome.nav.waitliststatus", icon: "hourglass" },
  { view: "event", labelKey: "chrome.nav.event", icon: "party-popper" },
  { view: "join", labelKey: "chrome.nav.join", icon: "badge-check" },
  { view: "refer", labelKey: "chrome.nav.refer", icon: "share-2" },
  { view: "blog", labelKey: "chrome.nav.blog", icon: "book-open" },
  { view: "post", labelKey: "chrome.nav.post", icon: "file-text" },
  { view: "location", labelKey: "chrome.nav.location", icon: "map-pin" },
  { view: "careers", labelKey: "chrome.nav.careers", icon: "briefcase" },
  { view: "help", labelKey: "chrome.nav.help", icon: "life-buoy" },
  { view: "policy", labelKey: "chrome.nav.policy", icon: "shield" },
  { view: "intake", labelKey: "chrome.nav.intake", icon: "clipboard-list" },
  { view: "export", labelKey: "chrome.nav.export", icon: "download" },
  { view: "mobile", labelKey: "chrome.nav.mobile", icon: "smartphone" },
  { view: "notfound", labelKey: "chrome.nav.notfound", icon: "unplug" },
];

export const STUDIO_SCREENS: DockScreen[] = [
  { view: "admin-today", labelKey: "chrome.nav.admin-today", icon: "sun" },
  { view: "admin-cal", labelKey: "chrome.nav.admin-cal", icon: "calendar-days" },
  { view: "admin-pos", labelKey: "chrome.nav.admin-pos", icon: "credit-card" },
  { view: "admin-clients", labelKey: "chrome.nav.admin-clients", icon: "users" },
  { view: "admin-services", labelKey: "chrome.nav.admin-services", icon: "scissors" },
  { view: "admin-team", labelKey: "chrome.nav.admin-team", icon: "user-round" },
  { view: "admin-stock", labelKey: "chrome.nav.admin-stock", icon: "package" },
  { view: "admin-marketing", labelKey: "chrome.nav.admin-marketing", icon: "megaphone" },
  { view: "admin-payroll", labelKey: "chrome.nav.admin-payroll", icon: "banknote" },
  { view: "admin-reviews", labelKey: "chrome.nav.admin-reviews", icon: "star" },
  { view: "admin-reports", labelKey: "chrome.nav.admin-reports", icon: "trending-up" },
  { view: "admin-settings", labelKey: "chrome.nav.admin-settings", icon: "settings" },
];

export function screensFor(persona: Persona): DockScreen[] {
  return persona === "guest" ? GUEST_SCREENS : STUDIO_SCREENS;
}

/* --------------------------------------------------- the studio sidebar */

export interface StudioNavItem {
  view: View;
  /** Message key — resolved by `StudioChrome`. */
  labelKey: MessageKey;
  icon: string;
  /** Optional count badge — the comp shows one on Today and Reviews. */
  badge?: number;
}

/** The sidebar splits into two groups, exactly as the Admin comp does. */
export const STUDIO_NAV_OPS: StudioNavItem[] = [
  { view: "admin-today", labelKey: "chrome.nav.admin-today", icon: "sun", badge: 3 },
  { view: "admin-cal", labelKey: "chrome.nav.admin-cal", icon: "calendar-days" },
  { view: "admin-pos", labelKey: "chrome.nav.admin-pos", icon: "credit-card" },
  { view: "admin-clients", labelKey: "chrome.nav.admin-clients", icon: "users" },
  { view: "admin-services", labelKey: "chrome.nav.admin-services", icon: "scissors" },
  { view: "admin-team", labelKey: "chrome.nav.admin-team", icon: "user-round" },
];

export const STUDIO_NAV_BIZ: StudioNavItem[] = [
  { view: "admin-stock", labelKey: "chrome.nav.admin-stock", icon: "package" },
  { view: "admin-marketing", labelKey: "chrome.nav.admin-marketing", icon: "megaphone" },
  { view: "admin-payroll", labelKey: "chrome.nav.admin-payroll", icon: "banknote" },
  { view: "admin-reviews", labelKey: "chrome.nav.admin-reviews", icon: "star", badge: 2 },
  { view: "admin-reports", labelKey: "chrome.nav.admin-reports", icon: "trending-up" },
  { view: "admin-settings", labelKey: "chrome.nav.admin-settings", icon: "settings" },
];

/** Topbar title + subtitle per studio screen. */
export const STUDIO_PAGE_META: Record<string, { titleKey: MessageKey; subKey: MessageKey }> = {
  "admin-today": {
    titleKey: "chrome.page.admin-today.title",
    subKey: "chrome.page.admin-today.sub",
  },
  "admin-cal": {
    titleKey: "chrome.page.admin-cal.title",
    subKey: "chrome.page.admin-cal.sub",
  },
  "admin-pos": {
    titleKey: "chrome.page.admin-pos.title",
    subKey: "chrome.page.admin-pos.sub",
  },
  "admin-clients": {
    titleKey: "chrome.page.admin-clients.title",
    subKey: "chrome.page.admin-clients.sub",
  },
  "admin-services": {
    titleKey: "chrome.page.admin-services.title",
    subKey: "chrome.page.admin-services.sub",
  },
  "admin-team": {
    titleKey: "chrome.page.admin-team.title",
    subKey: "chrome.page.admin-team.sub",
  },
  "admin-stock": {
    titleKey: "chrome.page.admin-stock.title",
    subKey: "chrome.page.admin-stock.sub",
  },
  "admin-marketing": {
    titleKey: "chrome.page.admin-marketing.title",
    subKey: "chrome.page.admin-marketing.sub",
  },
  "admin-payroll": {
    titleKey: "chrome.page.admin-payroll.title",
    subKey: "chrome.page.admin-payroll.sub",
  },
  "admin-reviews": {
    titleKey: "chrome.page.admin-reviews.title",
    subKey: "chrome.page.admin-reviews.sub",
  },
  "admin-reports": {
    titleKey: "chrome.page.admin-reports.title",
    subKey: "chrome.page.admin-reports.sub",
  },
  "admin-settings": {
    titleKey: "chrome.page.admin-settings.title",
    subKey: "chrome.page.admin-settings.sub",
  },
};
