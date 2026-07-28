/*
 * The slot engine (spec 19 D5 — "the port's hardest logic").
 *
 * This is the code that decides whether the app offers a time you can actually
 * have. Everything it does is a pure function of a `SlotContext`, so the whole
 * suite runs on hand-built fixtures with no store, no dates from the wall clock
 * and no demo data — a failure here is a failure in the rule, not the seed.
 *
 * The rules worth guarding hardest, because each one is a plausible "cleanup"
 * away from being wrong:
 *
 *   1. Windows never merge. A 60-minute service cannot straddle the lunch gap
 *      between 09:00–12:00 and 13:00–17:00, even though 12:00 sits "between"
 *      two open windows.
 *   2. Overlap is half-open. A booking ending at 10:00 does not collide with
 *      one starting at 10:00 — off-by-one here either double-books a stylist or
 *      hides a legitimately free slot.
 *   3. A slot is rendered when *anyone* could theoretically work it, and free
 *      when *someone* actually is. Those are different questions, and conflating
 *      them makes a fully-booked day vanish instead of showing as struck through.
 *   4. `excludeCode` exists so a booking being rescheduled does not block its
 *      own slot (ruling R3).
 */

import { describe, expect, it } from "vitest";
import type { Appointment, Service, StaffMember } from "../data/types.ts";
import {
  SLOT_STEP,
  canPerform,
  dayHasWindows,
  daySummaries,
  eligibleStaff,
  findService,
  findStaff,
  firstOpenIndex,
  groupSlots,
  isDayFull,
  isSlotSelected,
  isStaffFree,
  openSlotCount,
  overlaps,
  recurLabel,
  recurStepDays,
  resolveStaffId,
  seriesDates,
  simpleDaySummaries,
  slotStarts,
  slotsFor,
  windowsFor,
} from "./slots.ts";

/* ------------------------------------------------------------------ *
 * Fixtures — deliberately tiny and hand-checkable
 * ------------------------------------------------------------------ */

/** Mon 2026-08-03 … Sun 2026-08-09. Fixed dates: no wall clock in this suite. */
const MON = new Date(2026, 7, 3);
const TUE = new Date(2026, 7, 4);
const WED = new Date(2026, 7, 5);
const SUN = new Date(2026, 7, 9);

const WEEK = [MON, TUE, WED, new Date(2026, 7, 6), new Date(2026, 7, 7), new Date(2026, 7, 8), SUN];

/** 09:00–12:00 and 13:00–17:00 — a working day with a lunch gap. */
const SPLIT_DAY: readonly (readonly [number, number])[] = [
  [540, 720],
  [780, 1020],
];

function staff(id: string, hours: Partial<Record<number, readonly (readonly [number, number])[]>>): StaffMember {
  return {
    id,
    name: id,
    role: "Specialist",
    cat: "hair",
    initials: id.slice(0, 2).toUpperCase(),
    tint: "#000000",
    bio: "",
    hours: hours as StaffMember["hours"],
  };
}

/** Elin works Mon+Tue with a lunch gap; Noor works Mon only, mornings. */
const ELIN = staff("elin", { 1: SPLIT_DAY, 2: SPLIT_DAY });
const NOOR = staff("noor", { 1: [[540, 720]] });

function service(id: string, dur: number, people: string[]): Service {
  return {
    id,
    name: id,
    cat: "hair",
    dur,
    price: 50,
    staff: people,
    icon: "scissors",
    tint: "#000000",
  } as Service;
}

const CUT = service("cut", 60, ["elin", "noor"]);
const LONG = service("long", 180, ["elin"]);

function appt(staffId: string, dateISO: string, start: number, dur: number, code = "SLM-1"): Appointment {
  return { bookingCode: code, staffId, dateISO, start, dur } as Appointment;
}

const ctx = (appointments: Appointment[] = [], excludeCode?: string | null) => ({
  services: [CUT, LONG],
  staff: [ELIN, NOOR],
  appointments,
  excludeCode,
});

/* ------------------------------------------------------------------ *
 * Lookups
 * ------------------------------------------------------------------ */

describe("lookups", () => {
  it("finds a service and a staff member by id", () => {
    expect(findService(ctx(), "cut")?.id).toBe("cut");
    expect(findStaff(ctx(), "elin")?.id).toBe("elin");
  });

  it("returns undefined rather than throwing on a miss or a nullish id", () => {
    expect(findService(ctx(), "nope")).toBeUndefined();
    expect(findService(ctx(), null)).toBeUndefined();
    expect(findStaff(ctx(), undefined)).toBeUndefined();
  });

  it("knows who can perform a service", () => {
    expect(canPerform(CUT, "elin")).toBe(true);
    expect(canPerform(LONG, "noor")).toBe(false);
  });

  it("narrows the eligible set to the explicit selection, or all of them on 'first'", () => {
    expect(eligibleStaff(ctx(), "cut", "first").map((s) => s.id)).toEqual(["elin", "noor"]);
    expect(eligibleStaff(ctx(), "cut", "noor").map((s) => s.id)).toEqual(["noor"]);
  });

  it("returns nobody when the selected specialist cannot do the service", () => {
    /*
     * Regression: this used to return Noor. `eligibleStaff` trusted the
     * selection without checking qualification, so a grid got built from the
     * wrong person's hours — Noor's Monday window is exactly 180 minutes, so
     * the 180-minute service she does not offer appeared bookable at 09:00.
     * Unreachable through the UI (selectSvc clears the selection) but wrong
     * at the seam, which is where the rule lives.
     */
    expect(eligibleStaff(ctx(), "long", "noor")).toHaveLength(0);
    expect(slotsFor(ctx(), "long", "noor", MON)).toEqual([]);
    expect(dayHasWindows(ctx(), "long", "noor", MON)).toBe(false);
  });
});

/* ------------------------------------------------------------------ *
 * Windows — rule 1
 * ------------------------------------------------------------------ */

describe("availability windows", () => {
  it("reads the weekday's windows and returns none on a day off", () => {
    expect(windowsFor(ELIN, MON)).toEqual(SPLIT_DAY);
    expect(windowsFor(NOOR, TUE)).toEqual([]);
    expect(windowsFor(ELIN, SUN)).toEqual([]);
  });

  it("steps starts on the 30-minute grid regardless of service duration", () => {
    expect(SLOT_STEP).toBe(30);
    const starts = slotStarts(ELIN, MON, 60);
    expect(starts.slice(0, 3)).toEqual([540, 570, 600]);
  });

  it("never lets a service straddle the gap between two windows", () => {
    /* Morning window closes at 720. A 60-minute service must start by 660, so
     * 690 (11:30, which would run to 12:30) is absent — even though 13:00
     * reopens shortly after. */
    const starts = slotStarts(ELIN, MON, 60);
    expect(starts).toContain(660);
    expect(starts).not.toContain(690);
    /* The afternoon window restarts cleanly at 780, not mid-grid. */
    expect(starts).toContain(780);
  });

  it("drops a window entirely when the service cannot fit in it", () => {
    /* 180 minutes fits the 240-minute afternoon window but not the 180-minute
     * morning one — a start at 540 would end exactly at 720, which does fit. */
    const starts = slotStarts(ELIN, MON, 180);
    expect(starts).toContain(540);
    expect(starts).not.toContain(570);
    expect(starts).toContain(780);
  });

  it("offers nothing at all when the service is longer than every window", () => {
    expect(slotStarts(ELIN, MON, 300)).toEqual([]);
  });
});

/* ------------------------------------------------------------------ *
 * Overlap — rule 2
 * ------------------------------------------------------------------ */

describe("overlap", () => {
  it("treats intervals as half-open — touching is not overlapping", () => {
    /* 09:00-10:00 against 10:00-11:00 */
    expect(overlaps(540, 60, 600, 60)).toBe(false);
    /* and the other way round */
    expect(overlaps(600, 60, 540, 60)).toBe(false);
  });

  it("catches every genuine collision", () => {
    expect(overlaps(540, 60, 570, 60)).toBe(true); // partial, later
    expect(overlaps(570, 60, 540, 60)).toBe(true); // partial, earlier
    expect(overlaps(540, 120, 570, 30)).toBe(true); // fully contained
    expect(overlaps(570, 30, 540, 120)).toBe(true); // fully containing
    expect(overlaps(540, 60, 540, 60)).toBe(true); // identical
  });

  it("only blocks the same specialist on the same day", () => {
    const c = ctx([appt("elin", "2026-08-03", 540, 60)]);
    expect(isStaffFree(c, "elin", "2026-08-03", 540, 60)).toBe(false);
    expect(isStaffFree(c, "noor", "2026-08-03", 540, 60)).toBe(true);
    expect(isStaffFree(c, "elin", "2026-08-04", 540, 60)).toBe(true);
  });

  it("ignores the booking being rescheduled (ruling R3)", () => {
    const busy = [appt("elin", "2026-08-03", 540, 60, "SLM-9")];
    expect(isStaffFree(ctx(busy), "elin", "2026-08-03", 540, 60)).toBe(false);
    expect(isStaffFree(ctx(busy, "SLM-9"), "elin", "2026-08-03", 540, 60)).toBe(true);
    /* excluding a different code changes nothing */
    expect(isStaffFree(ctx(busy, "SLM-8"), "elin", "2026-08-03", 540, 60)).toBe(false);
  });
});

/* ------------------------------------------------------------------ *
 * The grid — rule 3
 * ------------------------------------------------------------------ */

describe("the slot grid", () => {
  it("returns nothing without a service or a date", () => {
    expect(slotsFor(ctx(), null, "first", MON)).toEqual([]);
    expect(slotsFor(ctx(), "cut", "first", null)).toEqual([]);
    expect(slotsFor(ctx(), "cut", "noor", TUE)).toEqual([]); // Noor is off
  });

  it("returns ascending starts with human labels", () => {
    const slots = slotsFor(ctx(), "cut", "elin", MON);
    const mins = slots.map((s) => s.min);
    expect([...mins].sort((a, b) => a - b)).toEqual(mins);
    expect(slots[0]).toMatchObject({ min: 540, label: "9:00 AM", free: true });
  });

  it("still renders a start when one specialist is busy, and assigns the free one", () => {
    /* Elin is booked 09:00; Noor also works Monday morning, so 540 survives. */
    const slots = slotsFor(ctx([appt("elin", "2026-08-03", 540, 60)]), "cut", "first", MON);
    const nine = slots.find((s) => s.min === 540)!;
    expect(nine.free).toBe(true);
    expect(nine.staff).toBe("noor");
    expect(nine.taken).toBe(false);
  });

  it("marks a start taken — not missing — when everyone is busy", () => {
    const both = [
      appt("elin", "2026-08-03", 540, 60, "SLM-1"),
      appt("noor", "2026-08-03", 540, 60, "SLM-2"),
    ];
    const nine = slotsFor(ctx(both), "cut", "first", MON).find((s) => s.min === 540)!;
    expect(nine.free).toBe(false);
    expect(nine.taken).toBe(true);
    expect(nine.staff).toBeNull();
  });

  it("picks the first free specialist in the service's declared order", () => {
    const nine = slotsFor(ctx(), "cut", "first", MON).find((s) => s.min === 540)!;
    expect(nine.staff).toBe("elin");
  });

  it("counts only the free ones", () => {
    const all = slotsFor(ctx(), "cut", "elin", MON).length;
    const busy = [appt("elin", "2026-08-03", 540, 60)];
    expect(openSlotCount(ctx(busy), "cut", "elin", MON)).toBeLessThan(all);
  });

  it("blocks every grid start a booking overlaps, not just the one it sits on", () => {
    /*
     * The grid steps 30 minutes but the service runs 60, so a 09:00-10:00
     * booking also kills the 09:30 start (09:30-10:30 overlaps it). Losing
     * exactly one slot per booking would be the intuitive answer and the
     * wrong one — it would let two 60-minute cuts be booked half an hour
     * apart with the same stylist.
     */
    const busy = [appt("elin", "2026-08-03", 540, 60)];
    const slots = slotsFor(ctx(busy), "cut", "elin", MON);
    expect(slots.find((s) => s.min === 540)?.free).toBe(false);
    expect(slots.find((s) => s.min === 570)?.free).toBe(false);
    expect(slots.find((s) => s.min === 600)?.free).toBe(true);

    const all = slotsFor(ctx(), "cut", "elin", MON).length;
    expect(openSlotCount(ctx(busy), "cut", "elin", MON)).toBe(all - 2);
  });

  it("buckets into morning / afternoon / evening and drops empty groups", () => {
    const groups = groupSlots(slotsFor(ctx(), "cut", "elin", MON));
    expect(groups.map((g) => g.key)).toEqual(["morning", "afternoon"]);
    expect(groups[0].slots.every((s) => s.min < 720)).toBe(true);
    expect(groups[1].slots.every((s) => s.min >= 720 && s.min < 1020)).toBe(true);
  });

  it("puts the boundary minutes in the later bucket", () => {
    const slots = [
      { min: 719, label: "", free: true, staff: null, taken: false },
      { min: 720, label: "", free: true, staff: null, taken: false },
      { min: 1020, label: "", free: true, staff: null, taken: false },
    ];
    const groups = groupSlots(slots);
    expect(groups.map((g) => g.key)).toEqual(["morning", "afternoon", "evening"]);
  });
});

/* ------------------------------------------------------------------ *
 * Day-level rollups
 * ------------------------------------------------------------------ */

describe("day summaries", () => {
  it("knows which days anyone works", () => {
    expect(dayHasWindows(ctx(), "cut", "first", MON)).toBe(true);
    expect(dayHasWindows(ctx(), "cut", "noor", TUE)).toBe(false);
    expect(dayHasWindows(ctx(), "cut", "first", WED)).toBe(false);
    expect(dayHasWindows(ctx(), "nope", "first", MON)).toBe(false);
  });

  it("marks Sunday closed and labels each chip", () => {
    const rows = daySummaries(ctx(), "cut", "first", WEEK);
    expect(rows).toHaveLength(7);
    expect(rows[0]).toMatchObject({ isToday: true, isClosed: false, dow: "Mon" });
    expect(rows[6]).toMatchObject({ isClosed: true, disabled: true, subLabel: "Closed" });
    expect(rows[0].subLabel).toMatch(/^\d+ open$/);
    /* Wednesday: nobody works it, so it is disabled with an em dash. */
    expect(rows[2]).toMatchObject({ hasWindows: false, disabled: true, subLabel: "—" });
  });

  it("reports zero open on a day with windows but no free slot", () => {
    /* Book out Elin's whole Monday for a solo service. */
    const wall = Array.from({ length: 8 }, (_, i) => appt("elin", "2026-08-03", 540 + i * 60, 60, `SLM-${i}`));
    const rows = daySummaries(ctx(wall), "long", "elin", WEEK);
    expect(rows[0].hasWindows).toBe(true);
    expect(rows[0].openCount).toBe(0);
    expect(isDayFull(ctx(wall), "long", "elin", MON)).toBe(true);
  });

  it("does not call an unworked day 'full' — there is nothing to be full of", () => {
    expect(isDayFull(ctx(), "cut", "first", WED)).toBe(false);
    expect(isDayFull(ctx(), "cut", "first", SUN)).toBe(false);
  });

  it("gives the group screen a service-free strip", () => {
    const rows = simpleDaySummaries(WEEK);
    expect(rows[0].subLabel).toBe("Today");
    expect(rows[1].subLabel).toBe("");
    expect(rows[6]).toMatchObject({ isClosed: true, disabled: true, subLabel: "Closed" });
  });
});

describe("first open day", () => {
  it("lands on the first day that actually has a free slot", () => {
    expect(firstOpenIndex(ctx(), "cut", "first", WEEK)).toBe(0);
  });

  it("skips a fully-booked day in favour of a later free one", () => {
    /* Elin's Monday is walled off; Tuesday is hers alone and open. */
    const wall = Array.from({ length: 8 }, (_, i) => appt("elin", "2026-08-03", 540 + i * 60, 60, `SLM-${i}`));
    expect(firstOpenIndex(ctx(wall), "long", "elin", WEEK)).toBe(1);
  });

  it("falls back to the first worked day when nothing is free all week", () => {
    const wall = [
      ...Array.from({ length: 8 }, (_, i) => appt("elin", "2026-08-03", 540 + i * 60, 60, `A${i}`)),
      ...Array.from({ length: 8 }, (_, i) => appt("elin", "2026-08-04", 540 + i * 60, 60, `B${i}`)),
    ];
    expect(firstOpenIndex(ctx(wall), "long", "elin", WEEK)).toBe(0);
  });

  it("falls back to 0 when nobody works at all", () => {
    expect(firstOpenIndex(ctx(), "cut", "noor", [WED, SUN])).toBe(0);
  });
});

/* ------------------------------------------------------------------ *
 * Assignment
 * ------------------------------------------------------------------ */

describe("who the booking lands with", () => {
  it("honours an explicit selection over whatever the slot resolved to", () => {
    expect(resolveStaffId(ctx(), "cut", "noor", "elin")).toBe("noor");
  });

  it("uses the slot's specialist under 'first available'", () => {
    expect(resolveStaffId(ctx(), "cut", "first", "noor")).toBe("noor");
  });

  it("falls back to the service's first specialist when the slot has none", () => {
    expect(resolveStaffId(ctx(), "cut", "first", null)).toBe("elin");
  });

  it("returns null for an unknown service", () => {
    expect(resolveStaffId(ctx(), "nope", "first", "elin")).toBeNull();
  });

  it("distinguishes two specialists offering the same minute under 'first'", () => {
    const slot = { min: 540, label: "9:00 AM", free: true, staff: "elin", taken: false };
    expect(isSlotSelected(slot, "first", 540, "elin")).toBe(true);
    /* Same minute, different specialist — not the selected one. */
    expect(isSlotSelected(slot, "first", 540, "noor")).toBe(false);
    /* With an explicit selection the minute alone decides. */
    expect(isSlotSelected(slot, "noor", 540, "noor")).toBe(true);
    expect(isSlotSelected(slot, "noor", 570, "noor")).toBe(false);
  });
});

/* ------------------------------------------------------------------ *
 * Recurrence
 * ------------------------------------------------------------------ */

describe("recurring series", () => {
  it("maps each frequency to its step", () => {
    expect(recurStepDays("1w")).toBe(7);
    expect(recurStepDays("2w")).toBe(14);
    expect(recurStepDays("4w")).toBe(28);
  });

  it("starts on the chosen date and steps forward", () => {
    expect(seriesDates("2026-08-03", "1w", 4)).toEqual([
      "2026-08-03",
      "2026-08-10",
      "2026-08-17",
      "2026-08-24",
    ]);
    expect(seriesDates("2026-08-03", "4w", 2)).toEqual(["2026-08-03", "2026-08-31"]);
  });

  it("crosses a month boundary without drifting", () => {
    expect(seriesDates("2026-08-24", "2w", 3)).toEqual([
      "2026-08-24",
      "2026-09-07",
      "2026-09-21",
    ]);
  });

  it("always yields at least one date, however silly the count", () => {
    expect(seriesDates("2026-08-03", "1w", 0)).toEqual(["2026-08-03"]);
    expect(seriesDates("2026-08-03", "1w", -5)).toEqual(["2026-08-03"]);
  });

  it("labels the frequency for the summary copy", () => {
    expect(recurLabel("1w")).toBe("weekly");
    expect(recurLabel("2w")).toBe("every 2 weeks");
    expect(recurLabel("4w")).toBe("every 4 weeks");
  });
});
