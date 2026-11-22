/**
 * The demo's Lumen is the sample's: the day as `figures.md` prints it, the free
 * times the plan's generator worked out, and a clock that moves the data
 * (L4-F6): "+1 hour" lets Dana's hold go and turns the two 10:45 bookings into
 * "Not arrived"; "Next morning" walks Tue 15 → Wed 16 → Thu 17 → Fri 18 → Sat
 * 19 → Mon 21 Sep, with what fell due on the way sent; the reset is the sample.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { kindOf } from "../desk/facts.ts";
import { DemoRefusal, LumenWorld } from "./world.ts";

const FIGURES = readFileSync(new URL("../sample/figures.md", import.meta.url), "utf8");

/** A figure's value, by its row's first cell. */
const figure = (name: string): string => {
  const line = FIGURES.split("\n").find((l) => l.startsWith(`| ${name} |`));
  if (line === undefined) throw new Error(`figures.md has no row ${name}`);
  return line.split("|")[2]!.trim();
};

const label = (w: LumenWorld) => {
  const { day, minute } = w.local(w.now);
  return `${day} ${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
};
const free = (w: LumenWorld, service: string, who: string | null, day: string) => w.slots(service, who, day, { guest: true }).filter((s) => s.state === "free");
const state = (w: LumenWorld, code: string) => w.byCode(code)!["state"];

describe("the demo's Lumen at 10:40 on Tuesday", () => {
  const w = new LumenWorld();

  it("stands on the sample's clock", () => {
    expect(figure("Clock")).toBe("Tue 15 Sep 2026 · 10:40 (America/Los_Angeles)");
    expect(label(w)).toBe("2026-09-15 10:40");
  });

  it("holds every booking of the sample", () => {
    expect(figure("Bookings in the sample (all time)")).toBe("899");
    expect(w.all("bookings").filter((b) => b["code"] !== null)).toHaveLength(899);
    expect(figure("Next booking code")).toBe("LMN-1900");
    expect(Math.max(...w.all("bookings").map((b) => Number(b["number"] ?? 0))) + 1).toBe(1900);
  });

  it("has today as figures.md counts it", () => {
    const today = w.all("bookings").filter((b) => w.local(String(b["starts_at"])).day === "2026-09-15" && b["state"] !== "offered");
    const by = (s: string) => today.filter((b) => b["state"] === s).length;
    expect(figure("Today by state")).toBe(`done ${String(by("done"))} · arrived ${String(by("arrived"))} · booked ${String(by("booked"))} · paying ${String(by("paying"))} · no_show ${String(by("no_show"))} · cancelled ${String(by("cancelled"))}`);
    expect(figure("Today, counted bookings")).toBe(String(today.length));
  });

  it("has the reviews and the published average figures.md prints", () => {
    const reviews = w.all("reviews");
    expect(figure("Reviews received")).toBe(String(reviews.length));
    const by = (s: string) => reviews.filter((r) => r["state"] === s);
    expect(figure("Reviews published / waiting / hidden")).toBe(`${String(by("published").length)} / ${String(by("waiting").length)} / ${String(by("hidden").length)}`);
    const stars = by("published").map((r) => Number(r["stars"]));
    expect(figure("Average of published reviews")).toBe(`${(stars.reduce((a, b) => a + b, 0) / stars.length).toFixed(1)} from ${String(stars.length)}`);
  });

  it("offers the free times the plan's generator worked out", () => {
    const list = (service: string, who: string | null, day: string) => free(w, service, who, day).length;
    expect(figure("Free times, Gel Manicure, Thu 17 Sep, anyone").startsWith(`${String(list("gel", null, "2026-09-17"))}:`)).toBe(true);
    expect(figure("Free times, Cut & Style, Sat 19 Sep, anyone").startsWith(`${String(list("cut", null, "2026-09-19"))}:`)).toBe(true);
    expect(figure("Free times, Deep-Tissue Massage, Wed 16 Sep, anyone").startsWith(`${String(list("deep", null, "2026-09-16"))}:`)).toBe(true);
    expect(list("balayage", "elin", "2026-09-19")).toBe(0);
    expect(list("facial", "noor", "2026-09-15")).toBe(0);
    expect(free(w, "gel", null, "2026-09-17")[0]?.time).toBe("10:00");
  });

  it("gives Gel Manicure the day strip figures.md prints", () => {
    const strip = w.strip("gel", null, "2026-09-15", 14, { guest: true });
    const read = strip.map((d) => {
      const name = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short" }).format(new Date(`${d.date}T12:00:00Z`));
      const month = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short" }).format(new Date(`${d.date}T12:00:00Z`));
      return `${name} ${String(Number(d.date.slice(8)))} ${month} ${d.state === "closed" ? "closed" : String(d.open)}`;
    });
    expect(read.join(" · ")).toBe(figure("Gel Manicure, anyone: free starts per day from today"));
  });

  it("gives 'Anyone' to the person figures.md names", () => {
    const pick = (service: string, day: string, minute: number) => w.pickAnyone(w.get("services", service)!, day, minute, { guest: true })?.["name"];
    expect(pick("gel", "2026-09-17", 600)).toBe(figure("'Anyone' for Gel Manicure Thu 17 Sep 10 AM"));
    expect(pick("cut", "2026-09-19", 600)).toBe(figure("'Anyone' for Cut & Style Sat 19 Sep 10 AM"));
    expect(pick("deep", "2026-09-16", 630)).toBe(figure("'Anyone' for Deep-Tissue Massage Wed 16 Sep 10:30 AM"));
  });

  it("has the calendar clash the sample names", () => {
    const clash = w.clashes[0]!;
    expect(w.get("bookings", clash.row)?.["code"]).toBe("LMN-1779");
    expect(clash.resource).toBe("noor");
    expect(w.local(clash.block!.start).minute).toBe(9 * 60);
    expect(w.local(clash.block!.end).minute).toBe(11 * 60);
  });

  it("has Marcus a no-show already (C2)", () => {
    expect(state(w, "LMN-1853")).toBe("no_show");
  });
});

describe("a visit booked in the demo", () => {
  it("takes the next code, holds its time, and is on the desk's rows", () => {
    const w = new LumenWorld();
    const before = free(w, "gel", null, "2026-09-17").length;
    const row = w.makeVisit({ service: "gel", person: null, startsAt: new Date(Date.parse("2026-09-17T17:00:00Z")).toISOString(), name: "Ava Reyes", email: "ava.reyes@example.com", channel: "page", door: "studio", proved: false });
    expect(row).toMatchObject({ code: "LMN-1900", state: "booked", team_id: "june" });
    expect(free(w, "gel", "june", "2026-09-17").map((s) => s.time)).not.toContain("10:00");
    expect(free(w, "gel", null, "2026-09-17").length).toBeLessThanOrEqual(before);
    expect(w.all("messages").some((m) => m["kind"] === "booked" && m["booking_id"] === row.id)).toBe(true);
  });

  it("refuses a time someone took meanwhile", () => {
    const w = new LumenWorld();
    const at = new Date(Date.parse("2026-09-17T17:00:00Z")).toISOString();
    const input = { service: "gel", person: "june", startsAt: at, name: "Ava Reyes", email: "ava.reyes@example.com", channel: "page" as const, door: "studio" as const, proved: false };
    w.makeVisit(input);
    expect(() => w.makeVisit({ ...input, name: "Theo Kim", email: "theo@example.com" })).toThrow(DemoRefusal);
  });

  it("is paying until its deposit lands, then booked, with the money on the row", () => {
    const w = new LumenWorld();
    const day = w.strip("root", "elin", "2026-09-16", 14, { guest: true }).find((d) => d.open > 0)!.date;
    const start = free(w, "root", "elin", day)[0]!.time;
    const row = w.makeVisit({ service: "root", person: "elin", startsAt: new Date(Date.parse(`${day}T${start}:00-07:00`)).toISOString(), name: "Ava Reyes", email: "ava.reyes@example.com", channel: "page", door: "money", proved: false });
    expect(row).toMatchObject({ state: "paying", pay_due: 50 });
    w.startPaying(row.id);
    w.settle(row.id, "paid");
    expect(w.booking(row.id)).toMatchObject({ state: "booked", paid: 50, pay_due: 0 });
  });
});

describe("moving the clock moves the data (L4-F6)", () => {
  it("+1 hour lets Dana's hold go, frees her time, and shows the two 10:45 bookings as Not arrived", () => {
    const w = new LumenWorld();
    const dana = w.byCode("LMN-1899")!;
    const iris = w.byCode("LMN-1784")!;
    const zoe = w.byCode("LMN-1896")!;
    expect(dana["state"]).toBe("paying");
    expect(free(w, "root", "elin", "2026-09-15").map((s) => s.time)).not.toContain("13:45");
    expect(kindOf(iris, w.now, w.zone)).toBe("soon");
    w.advanceHour();
    expect(label(w)).toBe("2026-09-15 11:40");
    expect(dana).toMatchObject({ state: "lapsed", lapsed_by: "time" });
    expect(w.all("messages").some((m) => m["kind"] === "let_go" && m["booking_id"] === dana.id)).toBe(true);
    expect(free(w, "root", "elin", "2026-09-15").map((s) => s.time)).toContain("13:45");
    expect(kindOf(iris, w.now, w.zone)).toBe("late");
    expect(kindOf(zoe, w.now, w.zone)).toBe("late");
    // Not arrived is only a reading: the desk still chooses Arrived or No-show.
    expect(iris["state"]).toBe("booked");
    w.moveVisit(iris.id, "booked", "no_show");
    expect(state(w, "LMN-1784")).toBe("no_show");
  });

  it("moves the guest's earliest time with the notice", () => {
    const w = new LumenWorld();
    const earliest = () => w.slots("deep", null, "2026-09-15", { guest: true }).find((s) => s.state === "free")?.time;
    expect(earliest()! >= "12:40").toBe(true);
    w.advanceHour();
    expect(earliest()! >= "13:40").toBe(true);
  });

  it("walks Tue 15 → Wed 16 → Thu 17 → Fri 18 → Sat 19 → Mon 21 Sep at 10 AM", () => {
    const w = new LumenWorld();
    const days: string[] = [];
    for (let i = 0; i < 5; i += 1) {
      w.advanceMorning();
      days.push(label(w));
    }
    expect(days).toEqual(["2026-09-16 10:00", "2026-09-17 10:00", "2026-09-18 10:00", "2026-09-19 10:00", "2026-09-21 10:00"]);
  });

  it("steps over a closure: from Sat 5 Sep the next morning is Tue 8 Sep (Labor Day)", () => {
    const w = new LumenWorld(Date.parse("2026-09-05T17:00:00Z"));
    w.advanceMorning();
    expect(label(w)).toBe("2026-09-08 10:00");
  });

  it("sends the day-before reminders at 10 AM: 13 for Thu 17 Sep", () => {
    const w = new LumenWorld();
    w.advanceMorning();
    const reminders = w.all("messages").filter((m) => m["kind"] === "reminder");
    expect(reminders).toHaveLength(13);
    for (const m of reminders) expect(w.local(String(w.get("bookings", m["booking_id"])!["starts_at"])).day).toBe("2026-09-17");
    expect(reminders.every((m) => m["sent_at"] === new Date(Date.parse("2026-09-16T17:00:00Z")).toISOString())).toBe(true);
  });

  it("sends the morning-after review requests, a Saturday visit's during the jump to Monday", () => {
    const w = new LumenWorld();
    const before = w.all("messages").filter((m) => m["kind"] === "review_request").length;
    w.advanceMorning();
    const tuesdayDone = w.all("bookings").filter((b) => w.local(String(b["starts_at"])).day === "2026-09-15" && b["state"] === "done");
    const sentNow = w.all("messages").filter((m) => m["kind"] === "review_request").slice(before);
    expect(sentNow.length).toBeGreaterThan(0);
    expect(sentNow.every((m) => tuesdayDone.some((b) => b.id === m["booking_id"]))).toBe(true);
    for (let i = 0; i < 3; i += 1) w.advanceMorning();
    const saturday = w.all("bookings").filter((b) => w.local(String(b["starts_at"])).day === "2026-09-19" && b["state"] === "booked").map((b) => b.id);
    w.advanceMorning();
    expect(label(w)).toBe("2026-09-21 10:00");
    const asked = new Set(w.all("messages").filter((m) => m["kind"] === "review_request").map((m) => m["booking_id"]));
    const satDone = w.all("bookings").filter((b) => saturday.includes(b.id) && b["state"] === "done");
    expect(satDone.length).toBeGreaterThan(0);
    const optedIn = satDone.filter((b) => w.get("customers", b["customer_id"])?.["review_requests"] !== false);
    expect(optedIn.length).toBeGreaterThan(0);
    expect(optedIn.every((b) => asked.has(b.id))).toBe(true);
  });

  it("leaves Ava's Reformer 7 hours of free cancelling on Wednesday morning", () => {
    const w = new LumenWorld();
    w.advanceMorning();
    const reformer = w.byCode("LMN-1807")!;
    expect((Date.parse(String(reformer["free_until"])) - w.now) / 3_600_000).toBe(7);
  });

  it("never lets a hold go while the bank is confirming", () => {
    const w = new LumenWorld();
    const dana = w.byCode("LMN-1899")!;
    w.settle(dana.id, "confirming");
    w.advanceHour();
    expect(dana["state"]).toBe("paying");
  });

  it("is the sample again after the reset", () => {
    const moved = new LumenWorld();
    moved.advanceMorning();
    const fresh = new LumenWorld();
    expect(label(fresh)).toBe("2026-09-15 10:40");
    expect(state(fresh, "LMN-1899")).toBe("paying");
    expect(fresh.all("messages").filter((m) => m["kind"] === "reminder")).toHaveLength(0);
  });
});
