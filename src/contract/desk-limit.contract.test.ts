/**
 * "ONLINE BOOKING HIT ITS HOURLY LIMIT", FROM A REAL REFUSAL (ACC-5).
 *
 * The desk's "Needs you" row reads how often the studio's key was refused for
 * being full. Real guests fill that hour through Lumen's own booking doors:
 *
 *   - a visitor stopped by their own cap tells the studio nothing, so a single
 *     person cannot raise the notice;
 *   - the key's hour filling up does.
 *
 * The test server sees one address and trusts no proxy, and the shipped key cap
 * (60) sits above what one address may make. So this installs Lumen with two
 * numbers lowered and nothing else: the first door's cap per visitor, and the
 * third door's cap for the key.
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ADMINIUM_REPO, ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, type Engine } from "./harness.ts";
import { MANIFEST_TEXT } from "./release.ts";
import { ADD_ONS, standUp, type Guest, type PublicReply, type Row, type Stand } from "./stand.ts";

const why = missing() ?? ADD_ONS.map((key) => missingAddOn(key)).find((reason) => reason !== null) ?? null;
const DATA_ROUTES = join(ADMINIUM_REPO, "apps", "server", "dist", "routes", "data", "index.js");
const hasCapRead = existsSync(DATA_ROUTES) && readFileSync(DATA_ROUTES, "utf8").includes("public-cap-reached");
const skip = why ?? (hasCapRead ? null : "this engine has no public-cap-reached read yet");
if (skip !== null && process.env["ADMINIUM_REQUIRE_CONTRACT"] === "1") throw new Error(`the limit contract must run here, and cannot: ${skip}`);
vi.setConfig({ testTimeout: 180_000 });
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 5310) + 150;
const pdt = (day: string, time: string) => new Date(`${day}T${time}:00-07:00`).toISOString();

type Entry = { defaults?: { door?: string }; anonymous?: { perIpHour?: number; perKeyHour?: number } };

function tightened(): string {
  const manifest = JSON.parse(MANIFEST_TEXT) as { publicAccess: Entry[] };
  const doorOf = (door: string) => manifest.publicAccess.find((entry) => entry.defaults?.door === door)!;
  doorOf("at_studio").anonymous!.perIpHour = 2;
  doorOf("deposits_off").anonymous!.perKeyHour = 3;
  return JSON.stringify(manifest);
}

describe.skipIf(skip !== null)(`the hourly limit on the desk${skip === null ? "" : ` — skipped: ${skip}`}`, () => {
  ENGINES.forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let stand: Stand;
      let tab: Guest;
      let doors: string[] = [];
      let availability = "";

      const lastHour = async () => ok(await stand.staff.get<{ data: { lastHour: number } }>(`${stand.data("bookings")}/public-cap-reached`)).data.lastHour;
      const serviceNamed = async (name: string) => (await stand.rows("services")).find((s) => s["name"] === name) as Row;
      /** A guest's booking through one door, at the first time still free from this day on. */
      const book = async (door: string, service: Row, from: string): Promise<PublicReply> => {
        for (let d = 0; d < 20; d += 1) {
          const day = new Date(Date.parse(`${from}T12:00:00Z`) + d * 86_400_000).toISOString().slice(0, 10);
          const reply = await tab.raw<{ time: string; state: string }[]>("GET", `/api/v1/public/availability/${availability}?kind=${String(service["id"])}&date=${day}`);
          const free = reply.status === 200 ? reply.body.data.find((slot) => slot.state === "free") : undefined;
          if (free === undefined) continue;
          return tab.create(door, { values: { service_id: service["id"], starts_at: pdt(day, free.time), name: "Limit Guest", email: `limit.${randomBytes(6).toString("hex")}@lumen-guests.dev`, language: "en-US", channel: "page" } });
        }
        throw new Error("no free time in the window");
      };

      beforeAll(async () => {
        stand = await standUp(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, "limit", { manifest: tightened() });
        tab = stand.guest("studio");
        const suffix = (ref: string) => Number(/_(\d+)$/.exec(ref)?.[1] ?? 1);
        doors = Object.keys(stand.refs)
          .filter((r) => r.startsWith("bookings_bookings") && JSON.stringify(stand.refs[r]?.["actions"] ?? []) === '["create"]')
          .sort((a, b) => suffix(a) - suffix(b));
        availability = Object.keys(stand.refs).find((r) => stand.refs[r]?.["kind"] === "availability")!;
      }, 900_000);

      afterAll(async () => {
        await stand?.server.stop();
      });

      it("a visitor stopped by their own cap raises nothing", async () => {
        const gel = await serviceNamed("Gel Manicure");
        const replies: PublicReply[] = [];
        for (let i = 0; i < 3; i += 1) replies.push(await book(doors[0]!, gel, "2026-09-16"));
        expect(replies.slice(0, 2).map((r) => r.status), JSON.stringify(replies[0]?.body).slice(0, 300)).toEqual([201, 201]);
        expect([replies[2]!.status, replies[2]!.code]).toEqual([409, "PUBLIC_LIMIT_REACHED"]);
        expect(await lastHour()).toBe(0);
      });

      it("the key's hour filling up is counted, for the desk's row", async () => {
        const root = await serviceNamed("Root Color");
        // Two bookings are already in the key's hour: the third door allows three.
        const first = await book(doors[2]!, root, "2026-09-23");
        expect(first.status, JSON.stringify(first.body).slice(0, 300)).toBe(201);
        const second = await book(doors[2]!, root, "2026-09-23");
        expect([second.status, second.code]).toEqual([409, "PUBLIC_LIMIT_REACHED"]);
        expect(await lastHour()).toBe(1);
      });
    });
  });
});
