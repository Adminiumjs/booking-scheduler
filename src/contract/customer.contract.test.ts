/**
 * THE CUSTOMER'S PAGES' OWN DOOR, ON A BUILT ADMINIUM.
 *
 * On each engine, Lumen installed with its sample at Tuesday 15 September 2026,
 * 10:40, driven through `LumenDoor`, the code the pages call, as the person who
 * would press each button: a guest with a link, or a customer signed in with a
 * code from their mail. Staff appear only to do what the desk would do.
 */
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { LumenDoor, type Row, type Served } from "../customer/door.ts";
import { refusalOf } from "../customer/rules.ts";
import { ADMINIUM_REPO, Caller, ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, until, type Engine } from "./harness.ts";
import { ADD_ONS, dbName, inbox, num, retryKey, standUp, yes, type Stand } from "./stand.ts";

const why = missing() ?? ADD_ONS.map((key) => missingAddOn(key)).find((reason) => reason !== null) ?? null;
if (why !== null && process.env["ADMINIUM_REQUIRE_CONTRACT"] === "1") throw new Error(`the customer contract must run here, and cannot: ${why}`);
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 5310) + 40;

const pdt = (day: string, time: string) => new Date(`${day}T${time}:00-07:00`).toISOString();

/** A booking's link code, read from the database: no staff read holds it, and the mail that carries it is T15's. */
async function linkCodeOf(engine: Engine, base: string, id: unknown): Promise<string> {
  const load = createRequire(join(ADMINIUM_REPO, "apps", "e2e", "package.json"));
  const name = dbName("customer", engine);
  const query = `SELECT link_token AS t FROM bookings_bookings WHERE id = ${String(Number(id))}`;
  if (engine === "sqlite") {
    const Database = load("better-sqlite3") as new (file: string) => { prepare(sql: string): { get(): { t: string } }; close(): void };
    const db = new Database(join(tmpdir(), `${name}-${new URL(base).port}.db`));
    try {
      return db.prepare(query).get().t;
    } finally {
      db.close();
    }
  }
  const url = new URL(engine === "postgres" ? process.env["TEST_POSTGRES_URL"]! : process.env["TEST_MYSQL_URL"]!);
  url.pathname = `/${name}`;
  if (engine === "postgres") {
    const pg = load("pg") as { Client: new (o: { connectionString: string }) => { connect(): Promise<void>; query(sql: string): Promise<{ rows: { t: string }[] }>; end(): Promise<void> } };
    const client = new pg.Client({ connectionString: url.toString() });
    await client.connect();
    try {
      return (await client.query(query)).rows[0]!.t;
    } finally {
      await client.end();
    }
  }
  const mysql = load("mysql2/promise") as { createConnection(o: { uri: string }): Promise<{ query(sql: string): Promise<[{ t: string }[]]>; end(): Promise<void> }> };
  const connection = await mysql.createConnection({ uri: url.toString() });
  try {
    return (await connection.query(query))[0][0]!.t;
  } finally {
    await connection.end();
  }
}

describe.skipIf(why !== null)(`the customer's door${why === null ? "" : ` — skipped: ${why}`}`, () => {
  ENGINES.forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let stand: Stand;
      let served: Served;
      let services: Record<string, Row>;
      let team: Record<string, Row>;
      let clock = Date.parse("2026-09-15T17:40:00Z");

      /** A fresh tab: its own sessions, as a new visitor has. */
      const tab = (extra: Record<string, string> = {}) => {
        const fetcher: typeof fetch = (input, init) => {
          const headers = new Headers(init?.headers);
          headers.set("origin", stand.server.base);
          for (const [k, v] of Object.entries(extra)) headers.set(k, v);
          return fetch(input, { ...init, headers });
        };
        return new LumenDoor({ ...served, baseUrl: stand.server.base }, { fetch: fetcher });
      };
      const nextHour = async () => {
        clock += 61 * 60_000;
        await stand.server.setClock(clock);
      };
      const values = (service: string, starts: string, name: string, more: Record<string, unknown> = {}) => ({
        service_id: services[service]!["id"],
        starts_at: starts,
        name,
        email: `${name.split(" ")[0]!.toLowerCase()}.${engine}@lumen-guests.dev`,
        language: "en-US",
        channel: "page" as const,
        ...more,
      });
      const signIn = async (door: LumenDoor, email: string) => {
        const before = (await inbox(stand.server)).length;
        await door.requestSignIn(email, "en-US");
        const mail = await until(async () => (await inbox(stand.server)).slice(before).find((m) => m.to.includes(email)), `the code for ${email}`, 90_000);
        const code = /\b(\d{6})\b/.exec(mail.text)?.[1];
        expect(code).toBeTruthy();
        const verified = await door.verifySignIn(email, code!);
        expect(verified.ok).toBe(true);
      };
      const setSetting = async (change: Row) => stand.patch("settings", (await stand.rows("settings"))[0]!["id"], change);

      beforeAll(async () => {
        stand = await standUp(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, "customer");
        const doc = ok(await new Caller(stand.server.base).get<Record<string, unknown>>("/apps/bookings/customer/surface-config.json"));
        served = {
          baseUrl: stand.server.base,
          publishableKey: stand.studioKey,
          publicKeys: { link: stand.linkKey },
          tables: doc["tables"] as Record<string, string>,
          addOns: doc["addOns"] as Record<string, { present?: boolean }>,
        };
        services = Object.fromEntries((await stand.rows("services")).map((s) => [String(s["name"]), s]));
        team = Object.fromEntries((await stand.rows("team")).map((t) => [String(t["name"]).split(" ")[0]!, t]));
      }, 900_000);

      afterAll(async () => {
        await stand?.server.stop();
      });

      it("finds every entry it needs, by what the entry may do", async () => {
        const door = tab();
        const refs = await door.refs();
        expect(new Set(Object.values(refs.doors)).size).toBe(3);
        for (const name of ["customer", "join", "leaveList", "cancel", "move", "pay", "google", "letOfferGo"] as const) expect(refs[name], name).toBeTruthy();
        expect(refs.myBookings.length).toBe(2);
        const link = await door.linkRefs();
        for (const name of ["read", "availability", "cancel", "move", "pay", "google", "takeBooked", "takePaying"] as const) expect(link[name], name).toBeTruthy();
        expect(link.takeBooked).not.toBe(link.cancel);
        expect(link.takePaying).not.toBe(link.takeBooked);
      }, 60_000);

      it("reads the studio as the pages show it", async () => {
        const rows = await tab().studio();
        expect(rows.services.length).toBe(12);
        expect(rows.team.length).toBe(6);
        expect(rows.timezone).toBe("America/Los_Angeles");
        expect(rows.settings["studio_name"]).toBe("Lumen Studio");
        // Nothing of a person's own day off, and no staff column, comes through the public face.
        expect(rows.closures.every((c) => !("team_id" in c))).toBe(true);
        expect(rows.team.every((t) => !("email" in t) && !("user_id" in t))).toBe(true);
      }, 60_000);

      it("a guest books \"Anyone\", opens it by its link, moves it onto its own day and cancels it free", async () => {
        const door = tab();
        const made = await door.book("studio", values("Gel Manicure", pdt("2026-09-17", "10:00"), "Ana Guest"), retryKey("c1"));
        expect(made.row["state"]).toBe("booked");
        expect(made.token).toBeTruthy();

        const other = tab();
        expect(await other.openLink(made.token!)).toBe("opened");
        const read = (await other.linkBooking())!;
        expect(yes(read["picked_by_anyone"])).toBe(true);
        expect(read["team_id"]).toBe(team["June"]!["id"]);
        expect(read["link_token"]).toBeUndefined();
        expect(read["staff_note"]).toBeUndefined();

        // Through the link its own time is free; for a stranger it is not.
        const mine = await other.times(String(services["Gel Manicure"]!["id"]), String(team["June"]!["id"]), "2026-09-17", String(read["id"]), undefined, true);
        const stranger = await tab().times(String(services["Gel Manicure"]!["id"]), String(team["June"]!["id"]), "2026-09-17", String(read["id"]));
        const at10 = (list: { time: string; state: string }[]) => list.find((s) => s.time === "10:00")?.state;
        expect(at10(mine)).toBe("free");
        expect(at10(stranger)).not.toBe("free");

        // Sent with no person, "Anyone" is judged again (BOOK-7).
        await other.moveBooking(read["id"], pdt("2026-09-17", "14:00"), null, false);
        const moved = (await other.linkBooking())!;
        expect(new Date(String(moved["starts_at"])).toISOString()).toBe(pdt("2026-09-17", "14:00"));
        expect(moved["team_id"]).toBeTruthy();

        await other.cancelBooking(read["id"], false);
        const row = await stand.row("bookings", read["id"]);
        expect([row["state"], row["cancelled_by"], yes(row["late_cancel"]), num(row["gives_back"])]).toEqual(["cancelled", "customer", false, 1]);
      }, 120_000);

      it("a repeated save answers the same booking (MOD-10)", async () => {
        await nextHour();
        const key = retryKey("c2");
        const a = await tab().book("studio", values("Cut & Style", pdt("2026-10-13", "09:00"), "Bo Twice"), key);
        const b = await tab().book("studio", values("Cut & Style", pdt("2026-10-13", "09:00"), "Bo Twice"), key);
        expect(b.row["id"]).toBe(a.row["id"]);
        expect(b.replayed).toBe(true);
      }, 60_000);

      it("the last time goes to one guest, and the other is told it was taken (BOOK-9)", async () => {
        await nextHour();
        const who = { team_id: team["Elin"]!["id"] };
        await tab().book("studio", values("Cut & Style", pdt("2026-10-14", "11:00"), "Cy First", who), retryKey("c3"));
        await nextHour();
        const error = await tab().book("studio", values("Cut & Style", pdt("2026-10-14", "11:00"), "Di Second", who), retryKey("c3b")).catch((e: unknown) => e);
        expect(refusalOf(error, false)).toBe("taken");
      }, 60_000);

      it("a cancel inside the window is late, and the page's move is refused (MON-9)", async () => {
        await nextHour();
        const door = tab();
        // Today: whatever the clock has reached, this is inside the 24 hours.
        const list = await door.times(String(services["Gel Manicure"]!["id"]), null, "2026-09-15");
        const free = list.find((s) => s.state === "free")!;
        const made = await door.book("studio", values("Gel Manicure", pdt("2026-09-15", free.time), "Eli Late"), retryKey("c4"));
        const read = (await door.linkBooking())!;
        const refused = await door.moveBooking(read["id"], pdt("2026-09-22", "11:00"), null, false).catch((e: unknown) => e);
        expect(refused).toBeInstanceOf(Error);
        await door.cancelBooking(made.row["id"], false);
        const row = await stand.row("bookings", made.row["id"]);
        expect([row["state"], yes(row["late_cancel"])]).toEqual(["cancelled", true]);
      }, 60_000);

      it("a deposit service is refused as paused while payments do not answer (cQ32)", async () => {
        await nextHour();
        await setSetting({ online_payments: "on" });
        const door = tab();
        const error = await door.book("money", values("Balayage", pdt("2026-10-15", "09:00"), "Flo Paused"), retryKey("c5")).catch((e: unknown) => e);
        expect(refusalOf(error, false)).toBe("paused");
        await setSetting({ online_payments: "off" });
      }, 60_000);

      it("a signed-in customer sees only their own visits, and may leave the waiting list", async () => {
        await nextHour();
        const ava = tab();
        await signIn(ava, "ava.reyes@example.com");
        const me = (await ava.me())!;
        expect(me["name"]).toBe("Ava Reyes");
        const mine = await ava.myBookings();
        expect(mine.length).toBeGreaterThan(1);
        expect(mine.every((b) => String(b["email"]).toLowerCase() === "ava.reyes@example.com")).toBe(true);
        expect(mine.map((b) => b["code"])).toContain("LMN-1807");
        // Another customer's row is the same as no row.
        const someone = (await stand.rows("bookings")).find((b) => b["code"] === "LMN-1889")!;
        const refs = await ava.refs();
        await expect(ava.client.get(refs.myBookings[0]!, String(someone["id"]))).rejects.toThrow();

        await ava.joinList({ service_id: services["Balayage"]!["id"], team_id: team["Elin"]!["id"], day: "2026-09-19", name: "Ava Reyes", email: "ava.reyes@example.com", language: "en-US" }, retryKey("c6"));
        const waiting = (await ava.myWaitlist()).find((w) => w["state"] === "waiting" && String(w["day"]).startsWith("2026-09-19") && w["service_id"] === services["Balayage"]!["id"])!;
        expect(waiting).toBeTruthy();
        await ava.leaveList(waiting["id"]);
        expect((await ava.myWaitlist()).find((w) => w["id"] === waiting["id"])?.["state"]).toBe("closed");
      }, 180_000);

      it("a waiting-list offer is taken once through its own link", async () => {
        await nextHour();
        const guest = tab();
        await guest.joinList({ service_id: services["Gel Manicure"]!["id"], team_id: null, day: "2026-10-16", name: "Gus Waiting", email: `gus.${engine}@lumen-guests.dev`, language: "en-US" }, retryKey("c7"));
        const entry = (await stand.rows("waitlist")).find((w) => w["name"] === "Gus Waiting")!;
        const offer = await stand.create("bookings", { waitlist_id: entry["id"], service_id: entry["service_id"], team_id: team["Ivy"]!["id"], customer_id: entry["customer_id"], name: entry["name"], email: entry["email"], starts_at: pdt("2026-10-16", "11:00"), state: "offered" });
        expect(offer["state"]).toBe("offered");
        expect((await stand.row("waitlist", entry["id"]))["state"]).toBe("offered");

        const token = await linkCodeOf(engine as Engine, stand.server.base, offer["id"]);
        const door = tab();
        expect(await door.openLink(token)).toBe("opened");
        const read = (await door.linkBooking())!;
        expect([read["state"], num(read["pay_due"])]).toEqual(["offered", 0]);
        await door.takeOffer(read["id"], false);
        expect((await stand.row("bookings", offer["id"]))["state"]).toBe("booked");
        expect((await stand.row("waitlist", entry["id"]))["state"]).toBe("booked");
        // Taken once: the same link cannot take it again.
        await expect(door.takeOffer(read["id"], false)).rejects.toThrow();
      }, 60_000);
    });
  });
});

