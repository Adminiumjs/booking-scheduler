/**
 * The studio's one rule: a specialist is told of a new booking of theirs
 * (e-mail 14). It goes to the person's Adminium sign-in, so someone with none
 * is told nothing and gets the private feed instead (MOD-17, FIL-11).
 *
 * Two triggers, because a booking that takes money is made `paying` or `offered`
 * and becomes `booked` later. The rule stamps the row, so an undo back to
 * `booked` (from Arrived or No-show) does not announce it a second time.
 */
import { STAFF_TEMPLATE } from "./emails.ts";
import { l } from "./labels.ts";

const node = (id: string, kind: string, title: string, more: Record<string, unknown> = {}) => ({ id, kind, title: l(title), ...more });
const TELL = { kind: "email", templateKey: STAFF_TEMPLATE, to: { kind: "staff", column: "team_id.user_id" }, vars: { service_name: "{{service_id.name}}" } };
const NOT_TOLD = [
  { left: { field: "state" }, op: "is", right: "booked" },
  { left: { field: "specialist_told_at" }, op: "is_empty" },
];

const graph = (title: string) => ({
  version: 1,
  nodes: [
    node("t", "trigger", title),
    node("stamp", "action", "Note that they were told", { action: { kind: "record.update", values: { specialist_told_at: { now: true } } } }),
    node("tell", "action", "Tell the specialist", { action: TELL }),
  ],
});

export const AUTOMATIONS = [
  {
    key: "new-booking-told",
    name: l("A booking is made: its specialist is told"),
    description: l("E-mails the person the booking is with, at their Adminium sign-in. It names no guest and no price."),
    enabled: true,
    trigger: { kind: "record", event: "created", table: "bookings", when: NOT_TOLD },
    graph: graph("A booking is made"),
  },
  {
    key: "paid-booking-told",
    name: l("A booking is paid: its specialist is told"),
    description: l("The same e-mail for a booking that waited for its payment or was offered, once it is booked."),
    enabled: true,
    trigger: { kind: "record", event: "updated", table: "bookings", changedColumn: "state", when: NOT_TOLD },
    graph: graph("A booking is paid"),
  },
];
