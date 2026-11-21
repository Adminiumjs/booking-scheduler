/**
 * The Overview: the studio at a glance, drawn by Adminium's own widgets. Nothing
 * on it is typed in: every figure is counted or summed where Adminium runs the
 * query, on the studio's clock, as `figures.md` defines it.
 *
 * What the words mean, once:
 *   - "the last 4 weeks" are the 28 days before today, and today;
 *   - a "visit done" is counted on the visit's own day;
 *   - "worth" is at the price the visit was booked at;
 *   - a week is the 7 days ending yesterday, and the 7 before each of those.
 *
 * Where it departs from the comp (L5), because a card holds one figure:
 *   1. A tile's second line ("worth $25,393", "1 done · 2 in the chair") is a
 *      card of its own.
 *   2. Visits by week are tiles, not bars: a chart's week starts on Monday, and
 *      these run to yesterday.
 *   3. "Needs you" keeps what rows can say: who is paying and who is waiting.
 *      The calendar clash, a reconnect and "waiting fits a freed time" are the
 *      desk's Today (K1), which reads the routes that know them.
 *   4. A card whose add-on is away says so where it stands.
 *
 * The owner's page. The front desk and the specialists hold no console page.
 */
import { l, titles as others } from "./labels.ts";

type Json = Record<string, unknown>;

const query = (table: string, rest: Json): Json => ({ kind: "table-query", source: { name: table, type: "table" }, ...rest });
const addOnQuery = (addOn: string, table: string, rest: Json): Json => ({ kind: "table-query", source: { addOn, name: table, type: "table" }, ...rest });
const metric = (binding: (rest: Json) => Json, aggregation: Json, rest: Json = {}): Json => binding({ shape: "metric+delta", aggregations: [aggregation], ...rest });
const bookings = (rest: Json) => query("bookings", rest);

const count = (alias: string): Json => ({ fn: "count", alias });
const sum = (column: string, alias: string): Json => ({ fn: "sum", column, alias });
const eq = (column: string, value: unknown): Json => ({ column, op: "eq", value });
const oneOf = (column: string, value: string[]): Json => ({ column, op: "in", value });

/** Today from the studio's midnight, and the 28 days before it. */
export const FOUR_WEEKS: Json = { column: "starts_at", last: 29, unit: "day", calendar: true };
const TODAY: Json = { column: "starts_at", last: 1, unit: "day", calendar: true };
/** Seven days, ending so many days before today. */
const sevenDays = (endingDaysAgo: number): Json => ({ column: "starts_at", last: 7, unit: "day", calendar: true, offset: endingDaysAgo });

/** What the statistics count as a booking that stood: over the last 4 weeks, only these can be finished. */
const STOOD = ["done", "no_show"];
const COUNTED_TODAY = ["paying", "booked", "arrived", "done", "no_show"];
const MISSED = { or: [eq("state", "no_show"), { and: [eq("state", "cancelled"), eq("late_cancel", true)] }] };

const COUNT = { metricFormat: "plain", deltaMode: "none", showSparkline: false };
const MONEY = { metricFormat: "currency", deltaMode: "none", showSparkline: false };

const page = (ref: string, ...filters: string[]) => `/p/${ref}${filters.length === 0 ? "" : `?${filters.join("&")}`}`;
const LAST_FOUR_WEEKS = "f.starts_at=gte:today-28";

type Place = [x: number, y: number, w: number, h: number];

interface Words {
  subtitle?: string;
  empty?: string;
}

function card(i: string, widget: string, [x, y, w, h]: Place, en: string, config: Json, words: Words = {}): Json {
  return {
    i,
    widget,
    x,
    y,
    w,
    h,
    config: {
      title: en,
      titles: l(en),
      ...(words.subtitle === undefined ? {} : { subtitle: words.subtitle, subtitles: others(words.subtitle) }),
      ...(words.empty === undefined ? {} : { emptyState: { titleKey: words.empty, titles: others(words.empty) } }),
      ...config,
    },
  };
}

const VISITS_DONE = "Visits done";
const AT_LIST = "Worth at list prices";

/** One week's two tiles: its visits, and what they were worth. */
function weekTiles(id: string, x: number, title: string, endingDaysAgo: number): Json[] {
  const window = sevenDays(endingDaysAgo);
  return [
    card(`${id}-visits`, "kpi-stat-card", [x, 12, 3, 3], title, { ...COUNT, iconName: "calendar-check", binding: metric(bookings, count("visits"), { filters: [eq("state", "done")], window }) }, { subtitle: VISITS_DONE }),
    card(`${id}-worth`, "kpi-stat-card", [x, 15, 3, 3], title, { ...MONEY, iconName: "banknote", binding: metric(bookings, sum("price", "worth"), { filters: [eq("state", "done")], window }) }, { subtitle: AT_LIST }),
  ];
}

export const OVERVIEW_LAYOUT = {
  version: 1,
  toolbar: {
    link: { label: "Open the desk", labels: others("Open the desk"), href: "@staff", icon: "external-link" },
  },
  items: [
    // ── the last 4 weeks, and today ──────────────────────────────────────────
    card("visits-done", "kpi-stat-card", [0, 0, 3, 3], "Visits done, last 4 weeks", {
      ...COUNT,
      iconName: "circle-check",
      href: page("bookings-bookings", "f.state=eq:done", LAST_FOUR_WEEKS),
      binding: metric(bookings, count("visits"), { filters: [eq("state", "done")], window: FOUR_WEEKS }),
    }),
    card("visits-worth", "kpi-stat-card", [3, 0, 3, 3], "Worth, last 4 weeks", {
      ...MONEY,
      iconName: "banknote",
      binding: metric(bookings, sum("price", "worth"), { filters: [eq("state", "done")], window: FOUR_WEEKS }),
    }, { subtitle: AT_LIST }),
    card("today", "kpi-stat-card", [6, 0, 3, 3], "Booked today", {
      ...COUNT,
      iconName: "calendar-check",
      href: "@staff",
      binding: metric(bookings, count("visits"), { filters: [oneOf("state", COUNTED_TODAY)], window: TODAY }),
    }),
    card("missed", "kpi-stat-card", [9, 0, 3, 3], "No-shows and late cancels, last 4 weeks", {
      ...COUNT,
      iconName: "calendar-x",
      iconTone: "warn",
      href: page("bookings-bookings", "f.state=in:no_show,cancelled", LAST_FOUR_WEEKS),
      binding: metric(bookings, count("visits"), { filters: [MISSED], window: FOUR_WEEKS }),
    }),

    // ── reviews and deposits ─────────────────────────────────────────────────
    card("reviews", "kpi-stat-card", [0, 3, 3, 3], "Average review", {
      metricFormat: "compact",
      deltaMode: "none",
      showSparkline: false,
      iconName: "star",
      href: "@staff/reviews",
      binding: metric((rest) => addOnQuery("forms", "reviews", rest), { fn: "avg", column: "stars", alias: "stars" }, { filters: [eq("state", "published")] }),
    }, { subtitle: "Published reviews, from Forms & surveys" }),
    card("reviews-to-read", "kpi-stat-card", [3, 3, 3, 3], "Reviews to read", {
      ...COUNT,
      iconName: "inbox",
      iconTone: "info",
      href: "@staff/reviews",
      binding: metric((rest) => addOnQuery("forms", "reviews", rest), count("reviews"), { filters: [eq("state", "waiting")] }),
    }),
    card("deposits", "kpi-stat-card", [6, 3, 3, 3], "Deposits held", {
      ...MONEY,
      iconName: "wallet",
      href: page("bookings-bookings", "f.state=eq:booked", "f.paid=gt:0"),
      binding: metric(bookings, sum("paid", "held"), { filters: [eq("state", "booked"), { column: "paid", op: "gt", value: 0 }] }),
    }, { subtitle: "For upcoming visits" }),
    card("deposits-count", "kpi-stat-card", [9, 3, 3, 3], "Visits with a deposit", {
      ...COUNT,
      iconName: "wallet",
      binding: metric(bookings, count("visits"), { filters: [eq("state", "booked"), { column: "paid", op: "gt", value: 0 }] }),
    }, { subtitle: "For upcoming visits" }),

    // ── today, chair time, and who needs a person ────────────────────────────
    card("today-by-state", "chart-ranking-bars", [0, 6, 4, 6], "Today by state", {
      n: 6,
      metricFormat: "plain",
      binding: bookings({ shape: "categorical", groupBy: ["state"], aggregations: [count("visits")], filters: [oneOf("state", COUNTED_TODAY)], window: TODAY, limit: 6 }),
    }, { empty: "No bookings today" }),
    card("chair-time", "chart-ranking-bars", [4, 6, 4, 6], "Chair time booked, last 4 weeks", {
      n: 12,
      metricFormat: "percent",
      href: page("bookings-team"),
      binding: { kind: "booking-occupancy", source: { name: "bookings", type: "table" }, shape: "categorical", occupancy: { days: 28, offset: 1, states: STOOD } },
    }, { subtitle: "Booked minutes against working minutes", empty: "No working time in the last 4 weeks" }),
    card("being-paid", "mini-table", [8, 6, 4, 3], "Being paid now", {
      limit: 3,
      columns: [
        { name: "code", label: "Booking", format: "mono" },
        { name: "pay_until", label: "Let go at", logicalType: "timestamptz" },
        { name: "pay_due", label: "To pay", logicalType: "decimal", semantic: "money" },
      ],
      secondary: ["name"],
      viewAllHref: page("bookings-bookings", "f.state=eq:paying"),
      binding: bookings({ shape: "record-list", select: ["id", "code", "name", "pay_until", "pay_due"], filters: [eq("state", "paying")], orderBy: [{ column: "pay_until", dir: "asc" }], limit: 3 }),
    }, { subtitle: "Let go by themselves if the money never comes", empty: "Nobody is paying right now" }),
    card("waiting", "mini-table", [8, 9, 4, 3], "On the waiting list", {
      limit: 3,
      columns: [
        { name: "name", label: "Name" },
        { name: "day", label: "Day", logicalType: "date" },
      ],
      viewAllHref: page("bookings-waitlist", "f.state=eq:waiting"),
      binding: query("waitlist", { shape: "record-list", select: ["id", "name", "day", "state"], filters: [eq("state", "waiting")], orderBy: [{ column: "day", dir: "asc" }], limit: 3 }),
    }, { empty: "Nobody is waiting" }),

    // ── week by week ─────────────────────────────────────────────────────────
    ...weekTiles("week-1", 0, "The 7 days to yesterday", 1),
    ...weekTiles("week-2", 3, "The 7 days before", 8),
    ...weekTiles("week-3", 6, "Two weeks before", 15),
    ...weekTiles("week-4", 9, "Three weeks before", 22),

    // ── where bookings came from, and "Anyone" ───────────────────────────────
    card("sources", "chart-ranking-bars", [0, 18, 4, 6], "Where bookings came from, last 4 weeks", {
      n: 3,
      metricFormat: "plain",
      binding: bookings({ shape: "categorical", groupBy: ["channel"], aggregations: [count("visits")], filters: [oneOf("state", STOOD)], window: FOUR_WEEKS, limit: 3 }),
    }, { subtitle: "Visits by where they were booked", empty: "No visits in the last 4 weeks" }),
    card("anyone-people", "chart-ranking-bars", [4, 18, 4, 6], "\"Anyone\", by who got it", {
      n: 12,
      metricFormat: "plain",
      binding: bookings({ shape: "categorical", groupBy: ["team_id"], groupLabel: "team_id.name", aggregations: [count("visits")], filters: [eq("picked_by_anyone", true), oneOf("state", STOOD)], window: FOUR_WEEKS, limit: 12 }),
    }, { subtitle: "Last 4 weeks", empty: "Nobody chose \"Anyone\" in the last 4 weeks" }),
    card("anyone-pools", "chart-ranking-bars", [8, 18, 4, 6], "\"Anyone\", by category", {
      n: 8,
      metricFormat: "plain",
      binding: bookings({ shape: "categorical", groupBy: ["category_id"], groupLabel: "category_id.name", aggregations: [count("visits")], filters: [eq("picked_by_anyone", true), oneOf("state", STOOD)], window: FOUR_WEEKS, limit: 8 }),
    }, { subtitle: "Last 4 weeks", empty: "Nobody chose \"Anyone\" in the last 4 weeks" }),

    // ── review requests, gift cards, calendars ───────────────────────────────
    card("requests-sent", "kpi-stat-card", [0, 24, 3, 3], "Review requests sent", {
      ...COUNT,
      iconName: "bell-ring",
      binding: metric((rest) => query("messages", rest), count("sent"), { filters: [eq("kind", "review-request"), eq("status", "sent")] }),
    }),
    card("requests-no", "kpi-stat-card", [3, 24, 3, 3], "Visits not asked", {
      ...COUNT,
      iconName: "user-x",
      binding: metric(bookings, count("visits"), { filters: [eq("state", "done"), eq("customer_id.review_requests", false), { column: "starts_at", op: "lt", day: "today" }] }),
    }, { subtitle: "The customer said no to review e-mails" }),
    card("gift-sold", "kpi-stat-card", [6, 24, 3, 3], "Gift cards sold", {
      ...MONEY,
      iconName: "hand-coins",
      binding: metric((rest) => query("purchase_lines", rest), sum("amount", "sold"), { filters: [eq("kind", "card"), eq("purchase_id.state", "paid")] }),
    }),
    card("gift-unspent", "kpi-stat-card", [9, 24, 3, 3], "Gift cards not yet spent", {
      ...MONEY,
      iconName: "hand-coins",
      binding: metric((rest) => addOnQuery("offers", "gift_cards", rest), sum("balance", "unspent"), { filters: [eq("status", "active")] }),
    }, { subtitle: "From Offers & gift cards" }),
    card("calendars", "chart-ranking-bars", [0, 27, 6, 5], "Calendars", {
      n: 5,
      metricFormat: "plain",
      binding: { kind: "calendar-connections", source: { name: "team", type: "table" }, shape: "categorical" },
    }, { subtitle: "Each person's connection", empty: "Nobody on the team yet" }),
  ],
};
