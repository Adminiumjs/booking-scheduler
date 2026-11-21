/**
 * The studio's section in Adminium's console (plan §5, r3): the records, and
 * the lists the owner manages the studio with. The day's work is the desk.
 * Hours and time off are child rows on a person's form (cT11, R4). "Days off"
 * and "Closures" are two pages over the one closures table. The Overview joins
 * these once its core is in (T08, cQ27).
 */
import { l, titles } from "./labels.ts";

export const NAV_GROUPS = [
  { key: "records", label: l("Records"), order: 1 },
  { key: "manage", label: l("Manage"), order: 2 },
];

type Field = Record<string, unknown>;
const f = (column: string, more: Field = {}): Field => ({ column, ...more });
const title = (column: string): Field => ({ column, control: "title", span: 2 });
const wide = (column: string, control = "textarea"): Field => ({ column, control, span: 2 });
const toggle = (column: string): Field => ({ column, control: "toggle-row" });
const money = (column: string): Field => ({ column, control: "currency" });
const ref = (column: string): Field => ({ column, control: "reference" });
const when = (column: string): Field => ({ column, control: "datetime" });
const day = (column: string): Field => ({ column, control: "date" });
const rows = (relation: string, columns: Field[]): Field => ({ relation, control: "child-rows", span: 2, columns });
const form = (...sections: Field[][]) => ({
  form: { v: 2, sections: sections.map((fields, i) => ({ id: `s${String(i + 1)}`, fields })) },
});

interface PageSpec {
  ref: string;
  title: string;
  group: string;
  icon: string;
  order: number;
  table: string;
  config: Record<string, unknown>;
}

const SPECS: PageSpec[] = [
  {
    ref: "bookings-bookings",
    title: "Bookings",
    group: "records",
    icon: "calendar-check",
    order: 1,
    table: "bookings",
    config: form(
      [title("code"), f("state", { control: "segmented" }), ref("service_id"), ref("team_id"), when("starts_at")],
      [f("name"), f("email", { control: "email" }), f("phone"), ref("customer_id"), f("language"), f("channel")],
      [wide("note"), wide("staff_note")],
      [money("price"), f("pay_mode"), money("deposit"), money("paid"), money("pay_due"), money("refunded")],
    ),
  },
  {
    ref: "bookings-customers",
    title: "Customers",
    group: "records",
    icon: "users",
    order: 2,
    table: "customers",
    config: form([title("name"), f("email", { control: "email" }), f("phone"), f("language"), toggle("review_requests")], [wide("staff_note")]),
  },
  {
    ref: "bookings-services",
    title: "Services",
    group: "records",
    icon: "sparkles",
    order: 3,
    table: "services",
    config: form(
      [title("name"), ref("category_id"), wide("blurb", "text"), f("minutes", { control: "stepper" }), f("buffer_min", { control: "stepper" })],
      [money("price"), f("online", { control: "segmented" }), money("deposit"), toggle("bookable_online"), f("anyone_pick"), toggle("active"), f("position", { control: "stepper" })],
      [wide("bring", "text")],
    ),
  },
  {
    ref: "bookings-categories",
    title: "Categories",
    group: "records",
    icon: "folder",
    order: 4,
    table: "categories",
    config: form([title("name"), f("icon"), f("position", { control: "stepper" })]),
  },
  {
    ref: "bookings-team",
    title: "Team",
    group: "records",
    icon: "contact",
    order: 5,
    table: "team",
    config: {
      form: {
        v: 2,
        sections: [
          { id: "s1", fields: [title("name"), f("role_title"), f("tint"), f("email", { control: "email" }), f("user_id"), toggle("active"), toggle("bookable_online"), f("position", { control: "stepper" })] },
          { id: "s2", fields: [{ relation: "team_services", control: "reference-chips", span: 2 }] },
          {
            id: "s3",
            fields: [
              rows("team_hours", [
                { column: "weekday", control: "select", width: "1fr" },
                { column: "opens", width: "90px" },
                { column: "closes", width: "90px" },
                { column: "break_start", width: "90px" },
                { column: "break_end", width: "90px" },
              ]),
            ],
          },
          {
            id: "s4",
            fields: [
              rows("time_off", [
                { column: "starts_at", control: "datetime", width: "1fr" },
                { column: "ends_at", control: "datetime", width: "1fr" },
                { column: "why", width: "1fr" },
              ]),
            ],
          },
        ],
      },
    },
  },
  {
    ref: "bookings-days-off",
    title: "Days off",
    group: "records",
    icon: "palmtree",
    order: 6,
    table: "closures",
    config: { ...form([ref("team_id"), day("from_date"), day("to_date"), wide("name", "text"), toggle("active")]), defaultFilters: [{ column: "team_id", op: "not_null" }] },
  },
  {
    ref: "bookings-waitlist",
    title: "Waiting list",
    group: "records",
    icon: "list-plus",
    order: 7,
    table: "waitlist",
    config: form([title("name"), f("email", { control: "email" }), ref("customer_id"), ref("service_id"), ref("team_id"), day("day"), f("state", { control: "segmented" })]),
  },
  {
    ref: "bookings-messages",
    title: "E-mails",
    group: "records",
    icon: "mail",
    order: 8,
    table: "messages",
    config: form([title("kind"), f("status"), f("to_address"), ref("booking_id"), when("due_at"), when("sent_at"), wide("error", "text")]),
  },
  {
    ref: "bookings-payments",
    title: "Payments",
    group: "records",
    icon: "credit-card",
    order: 9,
    table: "payments",
    config: form([ref("booking_id"), ref("purchase_id"), f("kind"), money("amount"), f("method"), when("paid_at"), f("provider"), money("refunded"), money("kept")]),
  },
  {
    ref: "bookings-purchases",
    title: "Purchases",
    group: "records",
    icon: "shopping-bag",
    order: 10,
    table: "purchases",
    config: form(
      [title("code"), f("state", { control: "segmented" }), f("buyer_name"), f("buyer_email", { control: "email" }), ref("customer_id")],
      [
        rows("purchase_lines", [
          { column: "kind", control: "select", width: "1fr" },
          { column: "amount", control: "currency", width: "1fr" },
          { column: "to_name", width: "1fr" },
          { column: "to_email", width: "1fr" },
        ]),
      ],
      [money("total"), money("paid"), money("due"), money("refunded")],
    ),
  },
  {
    ref: "bookings-settings",
    title: "Settings",
    group: "manage",
    icon: "settings",
    order: 1,
    table: "settings",
    config: form(
      [title("studio_name"), wide("tagline", "text"), f("address_line1"), f("city"), f("region"), f("zip"), f("email", { control: "email" }), f("website")],
      [f("code_prefix"), f("grid_min", { control: "stepper" }), f("notice_min", { control: "stepper" }), f("window_days", { control: "stepper" }), f("cancel_hours", { control: "stepper" })],
      [f("hold_min", { control: "stepper" }), f("link_hold_hours", { control: "stepper" }), f("offer_hours", { control: "stepper" }), toggle("online_booking"), toggle("online_payments")],
      [toggle("reviews_on"), f("review_reminder_days", { control: "stepper" }), f("google_review_link"), f("event_detail")],
    ),
  },
  {
    ref: "bookings-opening-hours",
    title: "Opening hours",
    group: "manage",
    icon: "clock",
    order: 2,
    table: "opening_hours",
    config: form([f("weekday"), f("opens"), f("closes"), toggle("open")]),
  },
  {
    ref: "bookings-closures",
    title: "Closures",
    group: "manage",
    icon: "calendar-x",
    order: 3,
    table: "closures",
    config: { ...form([day("from_date"), day("to_date"), wide("name", "text"), toggle("active")]), defaultFilters: [{ column: "team_id", op: "is_null" }] },
  },
  {
    ref: "bookings-gift-amounts",
    title: "Gift card amounts",
    group: "manage",
    icon: "gift",
    order: 4,
    table: "gift_amounts",
    config: form([money("amount"), toggle("active"), f("position", { control: "stepper" })]),
  },
  {
    ref: "bookings-packs",
    title: "Packs on sale",
    group: "manage",
    icon: "package",
    order: 5,
    table: "pack_products",
    config: form([title("name"), money("price"), f("uses", { control: "stepper" }), f("what"), ref("service_id"), ref("category_id"), f("valid_days", { control: "stepper" }), toggle("active"), f("position", { control: "stepper" })]),
  },
];

const pageOf = (spec: PageSpec) => ({
  ref: spec.ref,
  template: "page-crud",
  title: { key: `mft.${spec.ref.replaceAll("-", ".")}`, fallback: spec.title },
  titles: titles(spec.title),
  nav: { group: spec.group, icon: spec.icon, order: spec.order },
  bindings: { rows: spec.table },
  config: spec.config,
});

export function pages(): unknown[] {
  return SPECS.map(pageOf);
}

export const PAGE_REFS = SPECS.map((spec) => spec.ref);
