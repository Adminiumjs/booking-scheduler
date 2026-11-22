/**
 * The studio's one rule: a specialist is told of a new booking of theirs
 * (e-mail 14). It goes to the person's Adminium sign-in, so someone with none
 * is told nothing and gets the private feed instead (MOD-17, FIL-11).
 *
 * Two triggers, because a booking that takes money is made `paying` and becomes
 * `booked` later. An offer or a paying row is nobody's visit yet.
 */
import { STAFF_TEMPLATE } from "./emails.ts";
import { l } from "./labels.ts";

const node = (id: string, kind: string, title: string, more: Record<string, unknown> = {}) => ({ id, kind, title: l(title), ...more });
const TELL = { kind: "email", templateKey: STAFF_TEMPLATE, to: { kind: "staff", column: "team_id.user_id" }, vars: { service_name: "{{service_id.name}}" } };
const IS_BOOKED = { left: { field: "state" }, op: "is", right: "booked" };

const graph = (title: string) => ({
  version: 1,
  nodes: [node("t", "trigger", title), node("tell", "action", "Tell the specialist", { action: TELL })],
});

export const AUTOMATIONS = [
  {
    key: "new-booking-told",
    name: l("A booking is made: its specialist is told"),
    description: l("E-mails the person the booking is with, at their Adminium sign-in. It names no guest and no price."),
    enabled: true,
    trigger: { kind: "record", event: "created", table: "bookings", when: [IS_BOOKED] },
    graph: graph("A booking is made"),
  },
  {
    key: "paid-booking-told",
    name: l("A booking is paid: its specialist is told"),
    description: l("The same e-mail for a booking that waited for its payment, once the money has landed."),
    enabled: true,
    trigger: {
      kind: "record",
      event: "updated",
      table: "bookings",
      changedColumn: "state",
      when: [IS_BOOKED, { left: { field: "link_until" }, op: "not_empty" }],
    },
    graph: graph("A booking is paid"),
  },
];
