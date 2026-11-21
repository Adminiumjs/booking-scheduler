/**
 * `manifest.json`, assembled from the modules beside this file. The file is
 * checked in; `npm run manifest` writes it and the drift test holds the two
 * together.
 */
import { ADD_ONS } from "./add-ons.ts";
import { NAV_GROUPS, pages } from "./pages.ts";
import { PAYMENTS } from "./payments.ts";
import { PEOPLE } from "./people.ts";
import { PUBLIC_ACCESS, PUBLIC_KEYS } from "./public.ts";
import { ROLES } from "./roles.ts";
import { TABLES } from "./tables.ts";

/** The first release of the rework. The manifest alone carries an app's version (`package.json`'s is never read). */
export const VERSION = "0.2.0";

/** The engine release that first reads the booking rule's buffer, busy tables, shared "anyone" and guests-only window. */
export const MIN_ADMINIUM = "0.3.71";

/** 0.1.x kept its tables unprefixed and in another shape: it cannot be updated in place (MOD-14). */
export const UPDATES_FROM = ">=0.2.0";

const ENV = {
  VITE_ADMINIUM_API_BASE_URL: { required: false, example: "https://admin.example.com" },
  VITE_ADMINIUM_PUBLISHABLE_KEY: { required: false, example: "adm_pub_..." },
};

export const STAFF_ROUTES = { today: "/", calendar: "/calendar", clients: "/clients", services: "/services", team: "/team", waitlist: "/waitlist", reviews: "/reviews", settings: "/settings" };

export const CUSTOMER_ROUTES = {
  home: "/",
  book: "/book",
  booking: "/b",
  paid: "/paid",
  find: "/find",
  signIn: "/sign-in",
  account: "/account",
  reviews: "/reviews",
  giftCards: "/gift-cards",
  giftCard: "/gift-cards",
  packs: "/packs",
  help: "/help",
  policy: "/policy",
  privacy: "/privacy",
  terms: "/terms",
  review: "/review",
};

/**
 * The screens a listed website may frame (cT13, cQ7): looking, booking as a guest, and the reviews. A booking's own page,
 * sign-in and Your visits are never declared, so the server refuses to frame them.
 */
const EMBED = {
  paths: [
    "/",
    { path: "/book", label: "Book a service", choose: { query: "service", table: "services", value: "id", label: "name", title: "A particular service", any: "Any service" } },
    "/reviews",
  ],
  modes: ["inline", "button", "floating"],
};

/** The one row a new studio starts with. No opening hours: those are the studio's to set (MOD-5). */
const SEEDS = [{ table: "settings", rows: [{ grid_min: 15 }] }];

export function buildManifest(): Record<string, unknown> {
  return {
    kind: "app",
    manifestVersion: 1,
    key: "bookings",
    name: "Bookings",
    version: VERSION,
    publisher: { id: "adminium", name: "Adminium", url: "https://adminium.dev" },
    license: "AGPL-3.0-only",
    description: {
      key: "mft.bookings.desc",
      fallback: "Online booking for a studio of specialists: services, each person's hours, deposits, a waiting list and reviews, with a desk for the day's work, all decided by your own database.",
    },
    categories: ["hospitality"],
    compatibility: {
      minAdminiumVersion: MIN_ADMINIUM,
      updatesFrom: UPDATES_FROM,
      engines: ["sqlite", "postgres", "mysql"],
      requires: ["realtime"],
    },
    capabilities: ["file-storage", "email-delivery", "realtime"],
    frontends: [
      { side: "staff", kind: "spa", entry: "index.html", env: ENV, placement: "external", routes: STAFF_ROUTES, instances: true },
      { side: "customer", kind: "spa", entry: "index.html", env: ENV, routes: CUSTOMER_ROUTES, instances: true, embed: EMBED },
    ],
    addOns: ADD_ONS,
    navGroups: NAV_GROUPS,
    requiredSchema: { prefixed: true, tables: TABLES },
    seeds: SEEDS,
    pages: pages(),
    roles: ROLES,
    publicKeys: PUBLIC_KEYS,
    publicAccess: PUBLIC_ACCESS,
    people: PEOPLE,
    payments: PAYMENTS,
    sampleData: { file: "seeds/bookings.sample.json" },
  };
}

/** The file's text: two-space JSON and a final newline. */
export function manifestText(): string {
  return `${JSON.stringify(buildManifest(), null, 2)}\n`;
}
