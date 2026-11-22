/**
 * `demo.json` as the website checks it: Lumen's declaration, emitted in the
 * card's eight languages, passes the website's own `demoJsonIssues`; every
 * screen and shortcut it offers is one the bridge answers to; and every label
 * that names a figure names the sample's own, as `figures.md` prints it (L4-F9).
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { buildDemoJson } from "../../demo-emit.ts";
import { DEMO_LOCALES, demoJsonIssues } from "../demo-types.ts";
import { CARD_MESSAGES, clockLine, DEMO_CARD, SAMPLE_PICKS } from "./card.ts";
import { SCREEN_IDS, SHORTCUT_IDS } from "./shortcuts.ts";
import { LumenWorld } from "./world.ts";

const FIGURES = readFileSync(new URL("../sample/figures.md", import.meta.url), "utf8");
const figureRow = (first: string): string[] =>
  FIGURES.split("\n")
    .find((l) => l.startsWith(`| ${first} |`))!
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim());

const doc = buildDemoJson({ ...DEMO_CARD, messages: CARD_MESSAGES });
const shortcut = (id: string) => doc.screens.flatMap((s) => s.shortcuts ?? []).find((s) => s.id === id)!;
const en = (id: string) => shortcut(id).labels["en-US"];

describe("demo.json", () => {
  it("passes the website's check", () => {
    expect(demoJsonIssues(doc, { appKey: "bookings", dir: "booking-scheduler" })).toEqual([]);
    expect(doc.base).toBe("/demo/booking-scheduler/app/");
    expect(doc.frames).toEqual(["desktop", "phone"]);
  });

  it("offers the guest's fifteen screens and the desk's nine, with no console chip (C1)", () => {
    expect(doc.screens.filter((s) => s.persona === "guest").map((s) => s.id)).toEqual(["page", "book", "paying", "booked", "yours", "find", "visits", "wait", "how", "reviews", "gifts", "packs", "web", "help", "404"]);
    expect(doc.screens.filter((s) => s.persona === "desk").map((s) => s.id)).toEqual(["today", "cal", "new", "clients", "services", "team", "dwait", "dreviews", "settings"]);
    expect(doc.screens.map((s) => s.labels["en-US"])).not.toContain("Overview");
    expect(doc.screens.map((s) => s.labels["en-US"])).not.toContain("Calendars");
    expect(new Set(doc.screens.map((s) => s.id)).size).toBe(24);
    expect(doc.personas?.map((p) => [p.id, p.icon, p.labels["en-US"]])).toEqual([
      ["guest", "user", "Guest"],
      ["desk", "store", "Studio desk"],
    ]);
  });

  it("has two clock steps and a named reset", () => {
    expect(doc.clock?.advance.map((a) => [a.id, a.labels["en-US"]])).toEqual([
      ["hour", "+1 hour"],
      ["morning", "Next morning"],
    ]);
    expect(doc.clock?.reset).toEqual({ labels: expect.objectContaining({ "en-US": "Back to Tuesday morning" }) });
    expect(doc.clock?.advance.map((a) => (a as { icon?: string }).icon)).toEqual([undefined, "sunrise"]);
  });

  it("carries the card's note line in all eight languages", () => {
    expect(Object.keys(doc.note!.labels).sort()).toEqual([...DEMO_LOCALES].sort());
    for (const locale of DEMO_LOCALES) expect(doc.note!.labels[locale]).toBe(CARD_MESSAGES[locale]["note.line"]);
    expect(doc.note!.labels["en-US"]).toBe("Demo: no money moves, no e-mail is sent, no calendar is touched");
  });

  it("addresses a German reader as the guest's pages do, with Sie", () => {
    const german = Object.values(CARD_MESSAGES["de-DE"]).join("\n");
    expect(german).not.toMatch(/\b(du|dich|dein\w*)\b/i);
    expect(CARD_MESSAGES["de-DE"]["screen.yours"]).toBe("Ihre Buchung");
    expect(CARD_MESSAGES["de-DE"]["screen.visits"]).toBe("Ihre Besuche");
  });

  it("names each figure as the sample has it", () => {
    const w = new LumenWorld();
    expect(figureRow("Free times, Gel Manicure, Thu 17 Sep, anyone")[1]).toContain("10 AM");
    expect(en("gel")).toBe("Gel, Anyone, Thu 10 AM");
    expect(figureRow("Free times, Balayage, Sat 19 Sep, Elin")[1]).toBe("0: none");
    expect(en("full")).toBe("Balayage with Elin — Sat is full");
    expect(en("letgo")).toBe(`Let go after ${String(w.setting("hold_min"))} min`);
    expect(en("inside")).toBe(`Inside ${String(w.setting("cancel_hours"))} hours`);
    expect(figureRow("LMN-1807").slice(2, 6)).toEqual(["5 PM", "Reformer Pilates, private", "Marco Bellini", "Ava Reyes"]);
    expect(SAMPLE_PICKS.avaNext).toBe("LMN-1807");
    expect(en("reformer")).toBe("Ava's Reformer");
    expect(en("fill")).toBe("Fill LMN-1807 and Ava's e-mail");
    expect(figureRow("LMN-1899").slice(3, 5)).toEqual(["Elin Sund", "Dana Rivas"]);
    expect(en("dana")).toBe("Dana's deposit lands");
    expect(figureRow("LMN-1853")[5]).toBe("no_show");
    expect(en("marcus")).toBe("Marcus's no-show");
    expect(figureRow("Calendar clash")[1]).toContain("LMN-1779");
    expect(en("noor")).toBe("Noor's calendar clash");
    expect(en("show")).toBe("Show Thu 17 Sep");
    expect(en("rafa")).toBe("Rafa reconnects");
    expect(en("marco")).toBe("Marco connects Google");
    expect(figureRow("Waiting list")[1]).toContain("Theo Kim Cut & Style Sat 19 Sep (waiting)");
    expect(figureRow("Free times, Cut & Style, Sat 19 Sep, anyone")[1]).toContain("10 AM");
    expect(en("theo")).toBe("Offer Sat 10 AM to Theo");
    // The same figures in every language.
    for (const locale of DEMO_LOCALES) {
      expect(shortcut("fill").labels[locale]).toContain("LMN-1807");
      expect(shortcut("letgo").labels[locale]).toContain("15");
      expect(shortcut("inside").labels[locale]).toContain("24");
      expect(shortcut("theo").labels[locale]).toContain("Theo");
    }
  });

  it("labels everything in all eight languages, each its own sentence", () => {
    const shortcuts = doc.screens.flatMap((s) => s.shortcuts ?? []);
    expect(shortcuts).toHaveLength(25);
    for (const labels of [...doc.screens.map((s) => s.labels), ...shortcuts.map((s) => s.labels), ...(doc.personas ?? []).map((p) => p.labels), ...(doc.clock?.advance ?? []).map((a) => a.labels)]) {
      expect(Object.keys(labels).sort()).toEqual([...DEMO_LOCALES].sort());
      for (const text of Object.values(labels)) expect(text.trim()).not.toBe("");
    }
    for (const s of shortcuts) expect(s.labels["ar-EG"], s.id).not.toBe(s.labels["en-US"]);
    for (const s of shortcuts.filter((x) => !["inline", "button"].includes(x.id))) expect(s.labels["de-DE"], s.id).not.toBe(s.labels["en-US"]);
  });

  it("names current icon names, as the comp does", () => {
    const all = doc.screens.flatMap((s) => [s.icon, ...(s.shortcuts ?? []).map((c) => c.icon)]);
    expect(all).toContain("wand-sparkles");
    expect(all).toContain("circle-x");
    expect(all).not.toContain("wand-2");
    expect(all).not.toContain("x-circle");
  });

  it("has no screen or shortcut the bridge does not answer to", () => {
    expect(doc.screens.map((s) => s.id).filter((id) => !SCREEN_IDS.includes(id))).toEqual([]);
    expect(doc.screens.flatMap((s) => s.shortcuts ?? []).map((s) => s.id).filter((id) => !SHORTCUT_IDS.includes(id))).toEqual([]);
    expect(SCREEN_IDS).toHaveLength(24);
    expect(SHORTCUT_IDS).toHaveLength(25);
  });

  it("prints the clock with its minutes, so the card draws a clock on the hour too (L4-F5)", () => {
    const at = Date.parse("2026-09-16T17:00:00Z");
    expect(clockLine(at, "en-US")).toBe("Wed 16 Sep · 10:00 AM");
    for (const locale of DEMO_LOCALES) expect(clockLine(at, locale), locale).toMatch(/\p{Nd}{1,2}[:.]\p{Nd}{2}(?!\p{Nd})/u);
  });
});
