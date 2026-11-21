/**
 * LUMEN'S SAMPLE GOES IN, ADDS UP, AND COMES OUT AGAIN.
 *
 * On each engine: the app installed, the sample added at the moment it is
 * written for (Tuesday 15 September 2026, 10:40 in San Francisco), and every
 * figure `figures.md` marks "engine" worked out again from the rows Adminium
 * then holds. A figure marked "demo" leans on calendars or an add-on's own
 * history, and is T08's to prove.
 */
import { readFileSync } from "node:fs";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, type Engine } from "./harness.ts";
import { ADD_ONS, num, retryKey, standUp, yes, type Row, type Stand } from "./stand.ts";

const why = missing() ?? ADD_ONS.map((key) => missingAddOn(key)).find((reason) => reason !== null) ?? null;
if (why !== null && process.env["ADMINIUM_REQUIRE_CONTRACT"] === "1") throw new Error(`the sample contract must run here, and cannot: ${why}`);
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 5310);

const FIGURES = readFileSync(new URL("../sample/figures.md", import.meta.url), "utf8");
const figure = (name: string): string => {
  const line = FIGURES.split("\n").find((l) => l.startsWith(`| ${name} |`));
  if (line === undefined) throw new Error(`no figure "${name}"`);
  return line.split(" | ")[1]!;
};
const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/** A moment as the studio's wall clock reads it. */
const wall = (value: unknown): { day: string; minutes: number } => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(String(value)));
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return { day: `${get("year")}-${get("month")}-${get("day")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
};
const TODAY = "2026-09-15";
const NOW = 10 * 60 + 40;

describe.skipIf(why !== null)(`Lumen's sample on a built Adminium${why === null ? "" : ` — skipped: ${why}`}`, () => {
  ENGINES.forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let stand: Stand;
      let bookings: Row[];
      let visits: (Row & { when: { day: string; minutes: number } })[];
      let services: Map<string, Row>;
      let team: Map<string, string>;

      beforeAll(async () => {
        stand = await standUp(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, "sample");
        bookings = await stand.rows("bookings");
        visits = bookings.filter((b) => b["code"] !== null).map((b) => ({ ...b, when: wall(b["starts_at"]) }));
        services = new Map((await stand.rows("services")).map((s) => [String(s["id"]), s]));
        team = new Map((await stand.rows("team")).map((t) => [String(t["id"]), String(t["name"]).split(" ")[0]!]));
      }, 900_000);

      afterAll(async () => {
        await stand?.server.stop();
      });

      const inLast28 = (b: (typeof visits)[number]) => {
        const end = b.when.minutes + num(b["minutes"]);
        return (b.when.day >= "2026-08-18" && b.when.day < TODAY) || (b.when.day === TODAY && end <= NOW);
      };
      const counted = (b: Row) => ["paying", "booked", "arrived", "done", "no_show"].includes(String(b["state"]));

      it("holds all 899 bookings, each with the copies Adminium made", () => {
        expect(visits.length).toBe(Number(figure("Bookings in the sample (all time)")));
        const cut = visits.find((b) => b["code"] === "LMN-1475")!;
        expect([num(cut["price"]), num(cut["minutes"]), num(cut["buffer_min"]), cut["pay_mode"]]).toEqual([78, 60, 15, "none"]);
        const root = visits.find((b) => b["code"] === "LMN-1899")!;
        expect([num(root["deposit"]), root["pay_mode"], num(root["asked"]), num(root["pay_due"]), root["state"]]).toEqual([50, "deposit", 50, 50, "paying"]);
      });

      it("adds up to the last 28 days", () => {
        const w = visits.filter(inLast28);
        const done = w.filter((b) => b["state"] === "done");
        expect(done.length).toBe(Number(figure("Visits done, last 28 days")));
        expect(money(done.reduce((sum, b) => sum + num(b["price"]), 0))).toBe(figure("Value of visits done, last 28 days (price list)"));
        expect(w.filter((b) => b["state"] === "no_show").length).toBe(Number(figure("No-shows, last 28 days")));
        expect(w.filter((b) => b["state"] === "cancelled" && yes(b["late_cancel"])).length).toBe(Number(figure("Late cancellations, last 28 days")));
        expect(w.filter((b) => b["state"] === "cancelled" && !yes(b["late_cancel"])).length).toBe(Number(figure("Cancellations in time, last 28 days")));
        const through = (c: string) => w.filter((b) => b["channel"] === c && counted(b)).length;
        expect(`your website (embed) ${String(through("embed"))} · booking page ${String(through("page"))} · front desk ${String(through("desk"))}`).toBe(figure("Booked through (last 28 days, counted)"));
        const anyone = w.filter((b) => yes(b["picked_by_anyone"]) && counted(b));
        expect(`${String(anyone.length)} of ${String(w.filter(counted).length)}`).toBe(figure("Booked as 'Anyone', last 28 days"));
        const share = (who: string[]) => who.map((n) => `${n} ${String(anyone.filter((b) => team.get(String(b["team_id"])) === n).length)}`).join(" · ");
        expect(share(["Elin", "Rafa"])).toBe(figure("'Anyone' shared, hair (Cut & Style, Gloss & Tone, Root Color)"));
        expect(share(["Noor", "Marco"])).toBe(figure("'Anyone' shared, massage (Deep-Tissue)"));
        expect(share(["Ivy", "June"])).toBe(figure("'Anyone' shared, nails"));
      });

      it("adds up by Tuesday-to-Monday week", () => {
        for (const [from, to, label] of [["2026-08-18", "2026-08-24", "Tue 18 Aug"], ["2026-08-25", "2026-08-31", "Tue 25 Aug"], ["2026-09-01", "2026-09-07", "Tue 1 Sep"], ["2026-09-08", "2026-09-14", "Tue 8 Sep"]] as const) {
          const week = visits.filter((b) => b["state"] === "done" && b.when.day >= from && b.when.day <= to);
          expect(`${String(week.length)} visits · ${money(week.reduce((sum, b) => sum + num(b["price"]), 0))}`).toBe(figure(`Week from ${label}`));
        }
      });

      it("draws today as the designs do, by the clock", () => {
        const today = visits.filter((b) => b.when.day === TODAY);
        expect(today.filter(counted).length).toBe(Number(figure("Today, counted bookings")));
        const by = (s: string) => today.filter((b) => b["state"] === s).length;
        expect(["done", "arrived", "booked", "paying", "no_show", "cancelled"].map((s) => `${s} ${String(by(s))}`).join(" · ")).toBe(figure("Today by state"));
        const ahead = visits.filter((b) => ["booked", "paying"].includes(String(b["state"])) && (b.when.day > TODAY || (b.when.day === TODAY && b.when.minutes > NOW)));
        expect(ahead.length).toBe(Number(figure("Upcoming counted bookings (after 10:40 today)")));
      });

      it("holds the deposits as money Adminium added up", () => {
        const held = visits.filter((b) => b["state"] === "booked" && num(b["paid"]) > 0);
        expect(`${String(held.length)} · ${money(held.reduce((sum, b) => sum + num(b["paid"]), 0))}`).toBe(figure("Deposits held for upcoming visits"));
        const kept = visits.filter(inLast28).filter((b) => num(b["paid"]) > 0 && (b["state"] === "no_show" || (b["state"] === "cancelled" && yes(b["late_cancel"]))));
        expect(String(kept.length)).toBe(figure("Deposits kept after a late cancel or no-show, last 28 days"));
      });

      it("nets what was given back: a refunded deposit holds nothing", () => {
        const refunded = visits.filter((b) => num(b["refunded"]) > 0);
        expect(refunded.length).toBeGreaterThan(0);
        for (const b of refunded) expect([b["code"], num(b["paid"]), b["state"]]).toEqual([b["code"], 0, "cancelled"]);
        const studio = visits.find((b) => b["code"] === "LMN-1746")!;
        expect([num(studio["refunded"]), studio["cancelled_by"]]).toEqual([40, "studio"]);
      });

      it("holds the gift cards sold, as purchases", async () => {
        const cards = (await stand.rows("purchases")).filter((p) => String(p["code"]).startsWith("LGC-"));
        expect(`${String(cards.length)} · ${money(cards.reduce((sum, p) => sum + num(p["total"]), 0))}`).toBe(figure("Gift cards sold online").split(" · ").slice(0, 2).join(" · "));
      });

      it("counts who pressed the Google link", () => {
        expect(visits.filter((b) => yes(b["google_pressed"])).length).toBe(Number(figure("Said they'd also review on Google (clicked the link)")));
      });

      it("can count the review requests sent and the people who said no, from its own rows (REV-14)", async () => {
        const said = new Map((await stand.rows("customers")).map((c) => [String(c["id"]), yes(c["review_requests"])]));
        // A request goes the morning after a done visit, at 10: by the clock, those of yesterday and before.
        const asked = visits.filter((b) => b["state"] === "done" && b.when.day < TODAY);
        expect(asked.filter((b) => said.get(String(b["customer_id"]))).length).toBe(Number(figure("Review requests sent (all time)")));
        expect(asked.filter((b) => !said.get(String(b["customer_id"]))).length).toBe(Number(figure("Not asked (said no to review e-mails)")));
      });

      it("seeds no calendar: the demo's busy times are the demo's", async () => {
        const schema = ok(await stand.staff.get<{ model: { tables: { name: string }[] } }>(`/api/v1/connections/${stand.connectionId}/schema`));
        expect(schema.model.tables.map((t) => t.name)).toContain("bookings_calendar_busy");
        expect((await stand.rows("calendar_busy")).length).toBe(0);
      });

      it("gives the studio's next own booking the next code", async () => {
        const service = [...services.values()].find((s) => s["name"] === "Cut & Style")!;
        // As the desk's New booking saves: one row, with a retry key (MOD-10). A repeat answers the same row.
        const key = retryKey("next");
        const write = { values: { service_id: service["id"], name: "Walk In", starts_at: "2026-09-19T17:00:00.000Z" }, clientKey: key };
        const made = ok(await stand.staff.post<{ data: Row }>(stand.data("bookings"), write), 201).data;
        expect(made["code"]).toBe(figure("Next booking code"));
        const again = await stand.staff.post<{ data: Row }>(stand.data("bookings"), write);
        expect([200, 201]).toContain(again.status);
        expect(again.body.data["id"]).toBe(made["id"]);
      });
    });
  });
});
