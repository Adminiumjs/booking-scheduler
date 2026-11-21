/**
 * A NEW STUDIO, WITH NOTHING BUT THE APP (MOD-4, MOD-5).
 *
 * On each engine: installed with no add-ons and no sample. It starts with one
 * settings row and nothing else, and no time-zone column: the clock is the
 * connection's. Closed all week until the studio sets its hours; once it has,
 * a person and a service, a guest can book, with neither Forms nor Offers.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ENGINES, missing, ok, PORTS_PER_ENGINE, type Engine } from "./harness.ts";
import { retryKey, standUp, type Row, type Stand } from "./stand.ts";
import { TABLE_REFS, TABLES } from "../manifest/tables.ts";

const why = missing();
if (why !== null && process.env["ADMINIUM_REQUIRE_CONTRACT"] === "1") throw new Error(`the install contract must run here, and cannot: ${why}`);
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 5310) + 40;
const pdt = (day: string, time: string) => new Date(`${day}T${time}:00-07:00`).toISOString();

describe.skipIf(why !== null)(`a new studio${why === null ? "" : ` — skipped: ${why}`}`, () => {
  ENGINES.forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let stand: Stand;

      beforeAll(async () => {
        stand = await standUp(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, "install", { sample: false, addOns: [] });
      }, 600_000);

      afterAll(async () => {
        await stand?.server.stop();
      });

      it("makes every table, empty but for one settings row", async () => {
        for (const ref of TABLE_REFS) expect((await stand.rows(ref)).length, ref).toBe(ref === "settings" ? 1 : 0);
        const settings = (await stand.rows("settings"))[0]!;
        expect([settings["grid_min"], settings["notice_min"], settings["window_days"], settings["cancel_hours"], settings["hold_min"], settings["link_hold_hours"], settings["online_payments"]]).toEqual([15, 120, 30, 24, 15, 24, "off"]);
      });

      it("keeps no time zone of its own: the clock is the connection's", () => {
        const columns = TABLES.find((t) => t.ref === "settings")!.columns.map((c) => c.ref);
        expect(columns.filter((c) => /zone|tz/.test(c))).toEqual([]);
      });

      it("takes no booking until the studio has hours, then takes a guest's, with no add-on", async () => {
        const category = await stand.create("categories", { name: "Hair" });
        const service = await stand.create("services", { name: "Cut", category_id: category["id"], minutes: 60, price: 50 });
        const person = await stand.create("team", { name: "Sam Stylist", position: 1 });
        await stand.create("team_services", { team_id: person["id"], service_id: service["id"] });
        const at = pdt("2026-09-16", "10:00");
        const closed = await stand.staff.post(stand.data("bookings"), { values: { service_id: service["id"], team_id: person["id"], name: "Too Soon", starts_at: at }, clientKey: retryKey("closed") });
        expect(closed.status).toBeGreaterThanOrEqual(400);
        await stand.create("opening_hours", { weekday: "wed", opens: "09:00", closes: "17:00", open: true });
        const suffix = (ref: string) => Number(/_(\d+)$/.exec(ref)?.[1] ?? 1);
        const door = Object.keys(stand.refs).filter((r) => r.startsWith("bookings_bookings") && JSON.stringify(stand.refs[r]?.["actions"] ?? []) === '["create"]').sort((a, b) => suffix(a) - suffix(b))[0]!;
        const made = await stand.guest("studio").create(door, { values: { service_id: service["id"], starts_at: at, name: "First Guest", email: `first.${engine}@lumen-guests.dev`, language: "en-US", channel: "page", client_key: retryKey("first") } });
        expect(made.status, JSON.stringify(made.body).slice(0, 500)).toBe(201);
        // No prefix set yet: the code is the number alone.
        expect(String(made.body.data["code"])).toBe("1001");
        const row = ok(await stand.staff.get<{ data: Row }>(`${stand.data("bookings")}/${String(made.body.data["id"])}`)).data;
        expect(row["team_id"]).toBe(person["id"]);
      }, 120_000);
    });
  });
});
