/*
 * THE SLOT ENGINE (port spec §6.3, rulings R2 + R3).
 *
 * Pure, deterministic, side-effect free: every function takes a `SlotContext`
 * — the catalogue plus the list of occupied intervals — and returns a fresh
 * value. Nothing here reads the store, the clock, or the DOM, so the whole
 * file is unit-testable in isolation.
 *
 * The two rulings that make this differ from the comp:
 *
 *   R2  Real interval overlap. A candidate start `s` for a service of length
 *       `dur` is valid iff `s + dur <= windowEnd` AND `[s, s + dur)` intersects
 *       no appointment for that staff member on that date. The comp keyed a
 *       `booked` map by start minute only, which let a 90-minute booking block
 *       nothing after its own start.
 *
 *   R3  Reschedule excludes the booking being moved from its own overlap
 *       check (`SlotContext.excludeCode`) instead of deleting its appointment
 *       up front — so backing out of a reschedule leaks nothing.
 */

import type {
  Appointment,
  RecurFreq,
  Service,
  StaffMember,
  StaffSelection,
  Weekday,
} from "../data/types.ts";
import { isoOf, minutesToTime, parseISO } from "./format.ts";

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export interface SlotContext {
  services: readonly Service[];
  staff: readonly StaffMember[];
  appointments: readonly Appointment[];
  /**
   * Booking code to ignore while checking overlap (ruling R3). Set it to the
   * code being rescheduled so the booking's own interval does not block it.
   */
  excludeCode?: string | null;
}

export interface Slot {
  /** Start, minutes from midnight. */
  min: number;
  /** `'2:00 PM'`. */
  label: string;
  /** True when at least one relevant staff member is free at this start. */
  free: boolean;
  /** The staff member who would take it — first free in declared order. */
  staff: string | null;
  /** True when every relevant staff member is busy (renders struck through). */
  taken: boolean;
}

export type SlotGroupKey = "morning" | "afternoon" | "evening";

export interface SlotGroup {
  key: SlotGroupKey;
  label: string;
  /** Lucide icon name. */
  icon: string;
  slots: Slot[];
}

export interface DaySummary {
  /** Index into the 7-day window. */
  index: number;
  date: Date;
  iso: string;
  /** `'Wed'`. */
  dow: string;
  /** `29`. */
  dayNum: number;
  /** True on index 0. */
  isToday: boolean;
  /** True on Sundays — the studio is closed. */
  isClosed: boolean;
  /** True when at least one relevant staff member works that weekday. */
  hasWindows: boolean;
  /** How many rendered slots are free. */
  openCount: number;
  /** Chip is not selectable. */
  disabled: boolean;
  /** `'Closed'` / `'3 open'` / `'—'`. */
  subLabel: string;
}

/** The 30-minute grid step, always, regardless of service duration. */
export const SLOT_STEP = 30;

const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/* ------------------------------------------------------------------ *
 * Lookups
 * ------------------------------------------------------------------ */

export function findService(
  ctx: SlotContext,
  serviceId: string | null | undefined,
): Service | undefined {
  if (!serviceId) return undefined;
  return ctx.services.find((s) => s.id === serviceId);
}

export function findStaff(
  ctx: SlotContext,
  staffId: string | null | undefined,
): StaffMember | undefined {
  if (!staffId || staffId === "first") return undefined;
  return ctx.staff.find((s) => s.id === staffId);
}

/**
 * The staff whose calendars feed the grid: the chosen one, or — for
 * `'first'` / no choice — everyone who offers the service, in the service's
 * declared order (that order *is* the first-available tie-break).
 */
export function eligibleStaff(
  ctx: SlotContext,
  serviceId: string | null | undefined,
  selection: StaffSelection,
): StaffMember[] {
  const svc = findService(ctx, serviceId);
  if (!svc) return [];
  if (selection && selection !== "first") {
    /*
     * The selection must also be QUALIFIED. `selectSvc` clears `staffSel`
     * whenever the service changes, so the UI cannot currently present an
     * unqualified pair — but this is the function that owns the rule, and
     * without the check it happily builds a grid from the wrong person's
     * hours (a 180-minute service against a specialist who does not offer it
     * still fits their window, so a bookable slot appears). Relying on a
     * store action to remember the reset is not the same as enforcing it.
     */
    if (!canPerform(svc, selection)) return [];
    const one = findStaff(ctx, selection);
    return one ? [one] : [];
  }
  return svc.staff
    .map((id) => findStaff(ctx, id))
    .filter((s): s is StaffMember => Boolean(s));
}

/** True when the staff member is qualified for the service. */
export function canPerform(svc: Service, staffId: string): boolean {
  return svc.staff.includes(staffId);
}

/* ------------------------------------------------------------------ *
 * Windows & candidate starts
 * ------------------------------------------------------------------ */

/** The staff member's availability windows for that calendar day. */
export function windowsFor(
  staff: StaffMember,
  date: Date,
): readonly (readonly [number, number])[] {
  return staff.hours[date.getDay() as Weekday] ?? [];
}

/**
 * Every 30-minute start inside the staff member's windows that can still fit
 * `dur` before the window closes. Windows never merge — a service cannot
 * straddle the gap between two of them.
 */
export function slotStarts(
  staff: StaffMember,
  date: Date,
  dur: number,
): number[] {
  const out: number[] = [];
  for (const [from, to] of windowsFor(staff, date)) {
    for (let m = from; m + dur <= to; m += SLOT_STEP) out.push(m);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Overlap (ruling R2)
 * ------------------------------------------------------------------ */

/** Half-open interval intersection: `[aStart, aStart+aDur) ∩ [bStart, …)`. */
export function overlaps(
  aStart: number,
  aDur: number,
  bStart: number,
  bDur: number,
): boolean {
  return aStart < bStart + bDur && bStart < aStart + aDur;
}

/**
 * Is `staffId` free for `[start, start + dur)` on `dateISO`?
 * `ctx.excludeCode` (ruling R3) is skipped.
 */
export function isStaffFree(
  ctx: SlotContext,
  staffId: string,
  dateISO: string,
  start: number,
  dur: number,
): boolean {
  const exclude = ctx.excludeCode ?? null;
  for (const a of ctx.appointments) {
    if (a.staffId !== staffId || a.dateISO !== dateISO) continue;
    if (exclude !== null && a.bookingCode === exclude) continue;
    if (overlaps(start, dur, a.start, a.dur)) return false;
  }
  return true;
}

/* ------------------------------------------------------------------ *
 * The grid
 * ------------------------------------------------------------------ */

/**
 * Every rendered start for `serviceId` on `date`, ascending.
 *
 * A start appears if *any* relevant staff member could theoretically work it
 * (window + duration fit); it is `free` when at least one of them is actually
 * unbooked, and `taken` when all of them are.
 */
export function slotsFor(
  ctx: SlotContext,
  serviceId: string | null | undefined,
  selection: StaffSelection,
  date: Date | null | undefined,
): Slot[] {
  const svc = findService(ctx, serviceId);
  if (!svc || !date) return [];
  const people = eligibleStaff(ctx, serviceId, selection);
  if (people.length === 0) return [];

  const iso = isoOf(date);
  const times = new Map<number, string[]>();

  for (const st of people) {
    for (const m of slotStarts(st, date, svc.dur)) {
      let free = times.get(m);
      if (!free) {
        free = [];
        times.set(m, free);
      }
      if (isStaffFree(ctx, st.id, iso, m, svc.dur)) free.push(st.id);
    }
  }

  return [...times.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([min, free]) => ({
      min,
      label: minutesToTime(min),
      free: free.length > 0,
      staff: free.length > 0 ? free[0] : null,
      taken: free.length === 0,
    }));
}

/** Morning < 12:00 ≤ Afternoon < 17:00 ≤ Evening. Empty groups are dropped. */
export function groupSlots(slots: readonly Slot[]): SlotGroup[] {
  const groups: SlotGroup[] = [
    { key: "morning", label: "Morning", icon: "sunrise", slots: [] },
    { key: "afternoon", label: "Afternoon", icon: "sun", slots: [] },
    { key: "evening", label: "Evening", icon: "sunset", slots: [] },
  ];
  for (const s of slots) {
    const i = s.min < 720 ? 0 : s.min < 1020 ? 1 : 2;
    groups[i].slots.push(s);
  }
  return groups.filter((g) => g.slots.length > 0);
}

/** How many free slots a day offers — the `{n} open` chip sub-label. */
export function openSlotCount(
  ctx: SlotContext,
  serviceId: string | null | undefined,
  selection: StaffSelection,
  date: Date,
): number {
  return slotsFor(ctx, serviceId, selection, date).filter((s) => s.free).length;
}

/** Does any relevant staff member work that day at all (duration permitting)? */
export function dayHasWindows(
  ctx: SlotContext,
  serviceId: string | null | undefined,
  selection: StaffSelection,
  date: Date,
): boolean {
  const svc = findService(ctx, serviceId);
  if (!svc) return false;
  return eligibleStaff(ctx, serviceId, selection).some(
    (st) => slotStarts(st, date, svc.dur).length > 0,
  );
}

/** One row per day of the rolling window — everything the week strip needs. */
export function daySummaries(
  ctx: SlotContext,
  serviceId: string | null | undefined,
  selection: StaffSelection,
  week: readonly Date[],
): DaySummary[] {
  return week.map((date, index) => {
    const isClosed = date.getDay() === 0;
    const hasWindows = dayHasWindows(ctx, serviceId, selection, date);
    const openCount = hasWindows
      ? openSlotCount(ctx, serviceId, selection, date)
      : 0;
    return {
      index,
      date,
      iso: isoOf(date),
      dow: DOW_SHORT[date.getDay()],
      dayNum: date.getDate(),
      isToday: index === 0,
      isClosed,
      hasWindows,
      openCount,
      disabled: isClosed || !hasWindows,
      subLabel: isClosed ? "Closed" : hasWindows ? `${openCount} open` : "—",
    };
  });
}

/**
 * The plain week strip used by the group screen — no service is picked there,
 * so the sub-label is just `Closed` / `Today` / nothing.
 */
export function simpleDaySummaries(week: readonly Date[]): DaySummary[] {
  return week.map((date, index) => {
    const isClosed = date.getDay() === 0;
    return {
      index,
      date,
      iso: isoOf(date),
      dow: DOW_SHORT[date.getDay()],
      dayNum: date.getDate(),
      isToday: index === 0,
      isClosed,
      hasWindows: !isClosed,
      openCount: 0,
      disabled: isClosed,
      subLabel: isClosed ? "Closed" : index === 0 ? "Today" : "",
    };
  });
}

/**
 * First day worth showing: the first index with windows *and* a free slot,
 * else the first index with windows, else 0.
 */
export function firstOpenIndex(
  ctx: SlotContext,
  serviceId: string | null | undefined,
  selection: StaffSelection,
  week: readonly Date[],
): number {
  let withWindows = -1;
  for (let i = 0; i < week.length; i += 1) {
    const date = week[i];
    if (!dayHasWindows(ctx, serviceId, selection, date)) continue;
    if (withWindows < 0) withWindows = i;
    if (openSlotCount(ctx, serviceId, selection, date) > 0) return i;
  }
  return withWindows < 0 ? 0 : withWindows;
}

/** True when the day has windows but nothing free — the waitlist nudge. */
export function isDayFull(
  ctx: SlotContext,
  serviceId: string | null | undefined,
  selection: StaffSelection,
  date: Date,
): boolean {
  const slots = slotsFor(ctx, serviceId, selection, date);
  return slots.length > 0 && slots.every((s) => !s.free);
}

/* ------------------------------------------------------------------ *
 * Assignment
 * ------------------------------------------------------------------ */

/**
 * Who the booking is actually with. With an explicit selection that is the
 * selection; with `'first'` it is the staff member the chosen slot resolved
 * to, falling back to the service's first specialist.
 */
export function resolveStaffId(
  ctx: SlotContext,
  serviceId: string | null | undefined,
  selection: StaffSelection,
  slotStaff: string | null,
): string | null {
  const svc = findService(ctx, serviceId);
  if (!svc) return null;
  if (selection && selection !== "first") return selection;
  return slotStaff ?? svc.staff[0] ?? null;
}

/**
 * Slot selected-state (spec §6.3 rule 6): with `'first'` the same minute can
 * belong to different specialists, so the resolved staff must match too.
 */
export function isSlotSelected(
  slot: Slot,
  selection: StaffSelection,
  time: number | null,
  slotStaff: string | null,
): boolean {
  if (time !== slot.min) return false;
  if (selection !== "first") return true;
  return slotStaff === slot.staff;
}

/* ------------------------------------------------------------------ *
 * Recurrence
 * ------------------------------------------------------------------ */

/** `'1w' | '2w' | '4w'` → 7 / 14 / 28 days. */
export function recurStepDays(freq: RecurFreq): number {
  return freq === "4w" ? 28 : freq === "2w" ? 14 : 7;
}

/** Every ISO date in a recurring series, oldest first (length `count`). */
export function seriesDates(
  startISO: string,
  freq: RecurFreq,
  count: number,
): string[] {
  const step = recurStepDays(freq);
  const start = parseISO(startISO);
  const out: string[] = [];
  for (let k = 0; k < Math.max(1, count); k += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + step * k);
    out.push(isoOf(d));
  }
  return out;
}

/** `'weekly' | 'every 2 weeks' | 'every 4 weeks'` — the summary copy. */
export function recurLabel(freq: RecurFreq): string {
  return freq === "4w" ? "every 4 weeks" : freq === "2w" ? "every 2 weeks" : "weekly";
}
