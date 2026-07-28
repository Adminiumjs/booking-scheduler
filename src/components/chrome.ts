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

import type { Persona, View } from "../data/types.ts";

/* ------------------------------------------------------------- the brand */

export const BRAND = {
  name: "Lumen Studio",
  /** The single-letter mark in the header and the studio sidebar. */
  mark: "L",
  /** Shown under the wordmark in the studio sidebar. */
  locality: "Alder Lane",
  /** Who is signed in on the studio half. */
  owner: { name: "Selma Okonjo", initials: "SO", role: "Owner · admin" },
} as const;

/* ------------------------------------------------------------- the dock */

export interface DockScreen {
  view: View;
  label: string;
  icon: string;
}

/**
 * Every screen, grouped by persona, in the order the dock lists them.
 *
 * A screen with no entry here has no chip — that is how an unbuilt screen is
 * handled (hidden, never a dead button). All 50 are built, so all 50 appear.
 */
export const GUEST_SCREENS: DockScreen[] = [
  { view: "home", label: "Home", icon: "sparkles" },
  { view: "services", label: "Services", icon: "scissors" },
  { view: "booking", label: "Book", icon: "calendar-plus" },
  { view: "confirm", label: "Confirmation", icon: "check-circle" },
  { view: "manage", label: "Manage", icon: "settings-2" },
  { view: "visits", label: "Visits", icon: "history" },
  { view: "dash", label: "Dashboard", icon: "layout-dashboard" },
  { view: "account", label: "Account", icon: "user-round" },
  { view: "signin", label: "Sign in", icon: "log-in" },
  { view: "notifprefs", label: "Notifications", icon: "bell" },
  { view: "staff", label: "Specialists", icon: "users" },
  { view: "reviews", label: "Reviews", icon: "star" },
  { view: "shop", label: "Shop", icon: "shopping-bag" },
  { view: "checkout", label: "Checkout", icon: "credit-card" },
  { view: "orders", label: "Orders", icon: "receipt" },
  { view: "packages", label: "Packages", icon: "layers" },
  { view: "offers", label: "Offers", icon: "tag" },
  { view: "rewards", label: "Rewards", icon: "gift" },
  { view: "loyalty", label: "Loyalty", icon: "heart" },
  { view: "lhistory", label: "Points history", icon: "list" },
  { view: "giftcards", label: "Gift cards", icon: "gift" },
  { view: "mygifts", label: "My gifts", icon: "wallet" },
  { view: "group", label: "Group booking", icon: "users-round" },
  { view: "waitlist", label: "Join waitlist", icon: "clock" },
  { view: "waitliststatus", label: "Waitlist status", icon: "hourglass" },
  { view: "event", label: "Event", icon: "party-popper" },
  { view: "join", label: "Membership", icon: "badge-check" },
  { view: "refer", label: "Refer", icon: "share-2" },
  { view: "blog", label: "Journal", icon: "book-open" },
  { view: "post", label: "Journal post", icon: "file-text" },
  { view: "location", label: "Find us", icon: "map-pin" },
  { view: "careers", label: "Careers", icon: "briefcase" },
  { view: "help", label: "Help", icon: "life-buoy" },
  { view: "policy", label: "Policy", icon: "shield" },
  { view: "intake", label: "Intake form", icon: "clipboard-list" },
  { view: "export", label: "Export data", icon: "download" },
  { view: "mobile", label: "Mobile app", icon: "smartphone" },
  { view: "notfound", label: "404", icon: "unplug" },
];

export const STUDIO_SCREENS: DockScreen[] = [
  { view: "admin-today", label: "Today", icon: "sun" },
  { view: "admin-cal", label: "Calendar", icon: "calendar-days" },
  { view: "admin-pos", label: "Point of sale", icon: "credit-card" },
  { view: "admin-clients", label: "Clients", icon: "users" },
  { view: "admin-services", label: "Services", icon: "scissors" },
  { view: "admin-team", label: "Team", icon: "user-round" },
  { view: "admin-stock", label: "Stock", icon: "package" },
  { view: "admin-marketing", label: "Marketing", icon: "megaphone" },
  { view: "admin-payroll", label: "Payroll", icon: "banknote" },
  { view: "admin-reviews", label: "Reviews", icon: "star" },
  { view: "admin-reports", label: "Reports", icon: "trending-up" },
  { view: "admin-settings", label: "Settings", icon: "settings" },
];

export function screensFor(persona: Persona): DockScreen[] {
  return persona === "guest" ? GUEST_SCREENS : STUDIO_SCREENS;
}

/* --------------------------------------------------- the studio sidebar */

export interface StudioNavItem {
  view: View;
  label: string;
  icon: string;
  /** Optional count badge — the comp shows one on Today and Reviews. */
  badge?: number;
}

/** The sidebar splits into two groups, exactly as the Admin comp does. */
export const STUDIO_NAV_OPS: StudioNavItem[] = [
  { view: "admin-today", label: "Today", icon: "sun", badge: 3 },
  { view: "admin-cal", label: "Calendar", icon: "calendar-days" },
  { view: "admin-pos", label: "Point of sale", icon: "credit-card" },
  { view: "admin-clients", label: "Clients", icon: "users" },
  { view: "admin-services", label: "Services", icon: "scissors" },
  { view: "admin-team", label: "Team", icon: "user-round" },
];

export const STUDIO_NAV_BIZ: StudioNavItem[] = [
  { view: "admin-stock", label: "Stock", icon: "package" },
  { view: "admin-marketing", label: "Marketing", icon: "megaphone" },
  { view: "admin-payroll", label: "Payroll", icon: "banknote" },
  { view: "admin-reviews", label: "Reviews", icon: "star", badge: 2 },
  { view: "admin-reports", label: "Reports", icon: "trending-up" },
  { view: "admin-settings", label: "Settings", icon: "settings" },
];

/** Topbar title + subtitle per studio screen. */
export const STUDIO_PAGE_META: Record<string, { title: string; sub: string }> = {
  "admin-today": { title: "Today", sub: "Everything happening in the studio right now" },
  "admin-cal": { title: "Calendar", sub: "Drag to move a booking; the guest is told automatically" },
  "admin-pos": { title: "Point of sale", sub: "Ring up a service, a product, or both" },
  "admin-clients": { title: "Clients", sub: "Everyone who has ever sat in a chair here" },
  "admin-services": { title: "Services", sub: "What you offer, what it costs, how long it takes" },
  "admin-team": { title: "Team", sub: "Who works when, and what they are qualified for" },
  "admin-stock": { title: "Stock", sub: "What is on the shelf and what needs ordering" },
  "admin-marketing": { title: "Marketing", sub: "Campaigns, offers and who they reached" },
  "admin-payroll": { title: "Payroll", sub: "Hours, commission and tips, by period" },
  "admin-reviews": { title: "Reviews", sub: "What guests said, and what you said back" },
  "admin-reports": { title: "Reports", sub: "Revenue, retention and utilisation" },
  "admin-settings": { title: "Settings", sub: "Studio details, hours and messaging" },
};
