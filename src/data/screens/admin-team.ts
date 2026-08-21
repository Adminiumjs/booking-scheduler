/*
 * Seed for the studio Team screen (view: 'admin-team').
 *
 * The four specialists themselves come from the shared seam (`data.getStaff()`)
 * — the guest half lists the same people. What lives here is the studio-only
 * material: today's roster, which the cards reduce to bookings / takings /
 * chair time, and the time-off queue.
 *
 * Roster ids match the Admin comp's `APPTS` (A1…A12) on purpose: the screen
 * reads `store.apptState` for live status overrides, so checking a guest in on
 * Today flips the matching card to "With a guest" here.
 */

import type { MessageKey } from "../../i18n/index.tsx";

export type RosterStatus =
  | "confirmed"
  | "arrived"
  | "done"
  | "pending"
  | "cancelled";

export interface RosterEntry {
  id: string;
  staffId: string;
  /** Service id — duration and price are read from the shared seam. */
  svcId: string;
  status: RosterStatus;
}

/** Today's book, as the studio sees it. */
export const TEAM_ROSTER: readonly RosterEntry[] = [
  { id: "A1", staffId: "elin", svcId: "balayage", status: "done" },
  { id: "A2", staffId: "elin", svcId: "cut", status: "arrived" },
  { id: "A3", staffId: "elin", svcId: "gloss", status: "confirmed" },
  { id: "A4", staffId: "elin", svcId: "cut", status: "pending" },
  { id: "A5", staffId: "noor", svcId: "facial", status: "done" },
  { id: "A6", staffId: "noor", svcId: "deep", status: "arrived" },
  { id: "A7", staffId: "ivy", svcId: "gel", status: "done" },
  { id: "A8", staffId: "ivy", svcId: "pedi", status: "confirmed" },
  { id: "A9", staffId: "ivy", svcId: "gel", status: "confirmed" },
  { id: "A10", staffId: "marco", svcId: "reformer", status: "confirmed" },
  { id: "A11", staffId: "marco", svcId: "reformer", status: "confirmed" },
  { id: "A12", staffId: "noor", svcId: "facial", status: "cancelled" },
];

/**
 * The comp measures "booked today" against a flat eight-hour chair rather than
 * each person's rostered shift, and the Today screen's utilisation KPI uses the
 * same divisor. Kept flat so the two screens agree.
 */
export const STANDARD_DAY_MINUTES = 8 * 60;

/** Part-day absences: `t(TIME_OFF_FROM_KEY, { time: minutesToTime(m) })`. */
export const TIME_OFF_FROM_KEY: MessageKey = "data.team.offFrom";

export interface TimeOffRequest {
  key: string;
  who: string;
  initials: string;
  tint: string;
  /** Kind of absence — a key, it reads as "Ivy · holiday". */
  whatKey: MessageKey;
  /** First day off, `YYYY-MM-DD`. */
  fromISO: string;
  /** Last day off; equal to `fromISO` for a single day. */
  toISO: string;
  /** Minutes from midnight when a part-day absence starts, else `null`. */
  fromMinute: number | null;
  /** What it costs the diary if approved. */
  impactKey: MessageKey;
  /** Fills `{count}` in the impact line; `0` selects the "nothing" wording. */
  impactCount: number;
}

export const TIME_OFF: readonly TimeOffRequest[] = [
  {
    key: "t1",
    who: "Ivy",
    initials: "IV",
    tint: "#c08a6a",
    whatKey: "data.team.offHoliday",
    fromISO: "2026-08-12",
    toISO: "2026-08-19",
    fromMinute: null,
    impactKey: "data.team.impactMove",
    impactCount: 6,
  },
  {
    key: "t2",
    who: "Marco",
    initials: "MA",
    tint: "#7d9166",
    whatKey: "data.team.offLateStart",
    fromISO: "2026-08-06",
    toISO: "2026-08-06",
    fromMinute: 840,
    impactKey: "data.team.impactNone",
    impactCount: 0,
  },
  {
    key: "t3",
    who: "Noor",
    initials: "NO",
    tint: "#6f8bb0",
    whatKey: "data.team.offCourse",
    fromISO: "2026-09-03",
    toISO: "2026-09-03",
    fromMinute: null,
    impactKey: "data.team.impactRebook",
    impactCount: 2,
  },
];
