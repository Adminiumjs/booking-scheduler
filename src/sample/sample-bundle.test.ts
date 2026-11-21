/**
 * THE SAMPLE FILE, ITS SOURCE, THE TABLES AND THE GENERATOR AGREE (MOD-13).
 *
 * `seeds/bookings.sample.json` is written from `lumen.ts` (`npm run sample`).
 * This fails when the file drifts, when a row names a column the table does
 * not have or one Adminium decides, and when the rows no longer say what
 * `figures.md` says. The engine's own answers are the sample contract's.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sampleText } from "../../scripts/write-sample.ts";
import { TABLES } from "../manifest/tables.ts";
import { sampleBundle, WORLD } from "./lumen.ts";

const bundle = sampleBundle();
const rowsOf = (ref: string) => bundle.tables.find((t) => t.ref === ref)!.rows;
const FIGURES = readFileSync(new URL("./figures.md", import.meta.url), "utf8");
const figure = (name: string) => FIGURES.split("\n").find((l) => l.startsWith(`| ${name} |`))!.split(" | ")[1]!;

describe("the sample file", () => {
  it("is what its source writes", () => {
    expect(readFileSync(new URL("../../seeds/bookings.sample.json", import.meta.url), "utf8")).toBe(sampleText());
  });

  it("names only columns its tables have, and none Adminium works out", () => {
    const decided = ["formula", "rollup", "copy"];
    for (const t of bundle.tables) {
      const table = TABLES.find((x) => x.ref === t.ref)!;
      const known = new Map(table.columns.map((c) => [c.ref, c]));
      for (const row of t.rows) {
        const clock = (row["@byClock"] ?? {}) as Record<string, Record<string, unknown>>;
        const names = [...Object.keys(row), ...["before", "around", "after"].flatMap((k) => Object.keys(clock[k] ?? {}))].filter((k) => !k.startsWith("@"));
        for (const name of names) {
          const column = known.get(name);
          expect(column, `${t.ref}.${name}`).toBeDefined();
          expect(decided.filter((rule) => column!.rules?.[rule] !== undefined), `${t.ref}.${name}`).toEqual([]);
        }
      }
    }
  });

  it("brings no calendar, no review and nothing that names a time zone", () => {
    const refs = bundle.tables.map((t) => t.ref);
    expect(refs).not.toContain("calendar_busy");
    expect(refs.filter((r) => r.startsWith("forms_"))).toEqual([]);
    expect(Object.keys(WORLD.settings).filter((k) => /zone/.test(k))).toEqual([]);
  });

  it("carries every booking of the world, under its own code, and the one offer without a code", () => {
    const rows = rowsOf("bookings");
    expect(rows.filter((b) => b["code"] !== undefined).length).toBe(Number(figure("Bookings in the sample (all time)")));
    expect(rows.filter((b) => b["state"] === "offered").map((b) => b["code"])).toEqual([undefined]);
    expect(`LMN-${String(Math.max(...WORLD.bookings.map((b) => b.number)) + 1)}`).toBe(figure("Next booking code"));
  });

  it("offers Dana a time that fits her specialist's Wednesday", () => {
    const offer = rowsOf("bookings").find((b) => b["state"] === "offered")!;
    const at = offer["starts_at"] as { "@day": number; "@time": string };
    expect(at["@day"]).toBe(1);
    expect(at["@time"] >= "09:00" && at["@time"] <= "14:00").toBe(true);
  });

  it("files the person's days off and the studio's closures in the one table (MOD-3)", () => {
    const rows = rowsOf("closures");
    expect(rows.map((c) => c["name"]).sort()).toEqual(["Holiday", "Labor Day"]);
    expect(rows.find((c) => c["name"] === "Labor Day")!["team_id"]).toBeNull();
    expect(rows.find((c) => c["name"] === "Holiday")!["team_id"]).toEqual({ "@ref": "team:rafa" });
  });

  it("leaves the operator's own settings and hours alone (MOD-5)", () => {
    const row = rowsOf("settings")[0]!;
    expect([row["@onlyIfEmpty"], row["@fillEmpty"]]).toEqual([true, true]);
    expect(row["online_payments"]).toBeUndefined();
    expect(bundle.tables.find((t) => t.ref === "opening_hours")!.onlyIfEmpty).toBe(true);
  });
});
