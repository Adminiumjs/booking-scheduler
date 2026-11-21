/**
 * THE STUDIO'S PUBLIC DOORS, AND THE BOOKING'S OWN RULES, ON A BUILT ADMINIUM.
 *
 * On each engine, Lumen installed with its sample at Tuesday 15 September
 * 2026, 10:40, and then as a guest, over the public API only:
 *
 *   - a service switched off for online booking is refused at every door,
 *     and the desk may still book it (BOOK-12);
 *   - the three doors follow how the service is paid (MON-4, cQ32);
 *   - the caps hold for a guest and for a signed-in customer (cQ4);
 *   - a repeated save lands on the same row (MOD-10);
 *   - a link opens its one booking, staff never read its code (ACC-3, ACC-4);
 *   - a typed e-mail proves nothing (ACC-6);
 *   - the waiting-list offer is a booking that holds no time until taken
 *     (the shape T12 settled: MOD-8, ACC-4);
 *   - a no-show frees its time, only a customer's cancel is late, and the
 *     window ends on Monday 19 October for guests only (cQ5, MON-9, BOOK-3, cQ2).
 */
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ADMINIUM_REPO, Caller, ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, until, type Engine } from "./harness.ts";
import { ADD_ONS, ADMIN, CLOCK, dbName, Guest, num, retryKey, standUp, yes, type Row, type Stand } from "./stand.ts";

const why = missing() ?? ADD_ONS.map((key) => missingAddOn(key)).find((reason) => reason !== null) ?? null;
if (why !== null && process.env["ADMINIUM_REQUIRE_CONTRACT"] === "1") throw new Error(`the doors contract must run here, and cannot: ${why}`);
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 5310) + 10;

/** A wall time in San Francisco before the clocks change: Pacific daylight time. */
const pdt = (day: string, time: string) => new Date(`${day}T${time}:00-07:00`).toISOString();

/**
 * A booking's link code, read straight from the database: no staff read holds it, and the mail that carries an offer's link is
 * T15's. The drivers are the Adminium checkout's own.
 */
async function linkCodeOf(engine: Engine, port: number, id: unknown): Promise<string> {
  const load = createRequire(join(ADMINIUM_REPO, "apps", "e2e", "package.json"));
  const name = dbName("doors", engine);
  const query = `SELECT link_token AS t FROM bookings_bookings WHERE id = ${String(Number(id))}`;
  if (engine === "sqlite") {
    const Database = load("better-sqlite3") as new (file: string) => { prepare(sql: string): { get(): { t: string } }; close(): void };
    const db = new Database(join(tmpdir(), `${name}-${String(port)}.db`));
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

describe.skipIf(why !== null)(`Lumen's doors${why === null ? "" : ` — skipped: ${why}`}`, () => {
  ENGINES.forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let stand: Stand;
      let services: Record<string, Row>;
      let team: Record<string, Row>;
      let doors: { studio: string; money: string; off: string };
      let waitRef: string;
      let clock = CLOCK;
      const mail = (who: string) => `${who}.${engine}@lumen-guests.dev`;
      const say = (r: { status: number; body: unknown }) => JSON.stringify(r.body).slice(0, 500);

      /** On past an hour: the per-visitor caps start again, as they would for the next visitor. */
      const nextHour = async () => {
        clock += 61 * 60_000;
        await stand.server.setClock(clock);
      };
      const guest = () => stand.guest("studio");
      const book = (who: Guest, door: string, values: Row) => who.create(door, { values: { language: "en-US", channel: "page", client_key: retryKey("door"), ...values } });
      const person = (name: string) => ({ name, email: mail(name.split(" ")[0]!.toLowerCase()) });
      const setSetting = async (values: Row) => {
        const row = (await stand.rows("settings"))[0]!;
        await stand.patch("settings", row["id"], values);
      };

      beforeAll(async () => {
        stand = await standUp(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, "doors");
        services = Object.fromEntries((await stand.rows("services")).map((s) => [String(s["name"]), s]));
        team = Object.fromEntries((await stand.rows("team")).map((t) => [String(t["name"]).split(" ")[0]!, t]));
        const suffix = (ref: string) => Number(/_(\d+)$/.exec(ref)?.[1] ?? 1);
        const creates = Object.keys(stand.refs)
          .filter((r) => r.startsWith("bookings_bookings") && JSON.stringify(stand.refs[r]?.["actions"] ?? []) === '["create"]')
          .sort((a, b) => suffix(a) - suffix(b));
        expect(creates.length).toBe(3);
        doors = { studio: creates[0]!, money: creates[1]!, off: creates[2]! };
        waitRef = Object.keys(stand.refs).find((r) => r.startsWith("bookings_waitlist") && JSON.stringify(stand.refs[r]?.["actions"] ?? []).includes("create"))!;
        const linkConfig = ok(await new Caller(stand.server.base, { origin: stand.server.base, authorization: `Bearer ${stand.linkKey}` }).get<{ data?: { refs?: Record<string, Row> } }>("/api/v1/public/config"));
        const linkRefs = linkConfig.data?.refs ?? {};
        linkEntry = Object.keys(linkRefs).find((r) => r.startsWith("bookings_bookings") && JSON.stringify(linkRefs[r]!["actions"]).includes("read"))!;
        linkWrites = Object.entries(linkRefs).filter(([r, e]) => r.startsWith("bookings_bookings") && JSON.stringify(e["actions"]).includes("update")).map(([r, e]) => ({ ref: r, writable: (e["writable"] ?? []) as string[] }))
          .sort((a, b) => Number(/_(\d+)$/.exec(a.ref)?.[1] ?? 0) - Number(/_(\d+)$/.exec(b.ref)?.[1] ?? 0));
        if (process.env["CONTRACT_DUMP"] === "1") console.info(JSON.stringify(linkRefs).slice(0, 2500));
      }, 900_000);

      afterAll(async () => {
        await stand?.server.stop();
      });

      describe("at the sample's own clock", () => {
        it("the window ends on Mon 19 Oct for a guest, and the desk may book past it (BOOK-3, cQ2)", async () => {
          const gel = services["Gel Manicure"]!["id"];
          const last = await book(guest(), doors.studio, { service_id: gel, starts_at: pdt("2026-10-19", "11:00"), ...person("Nia Window") });
          expect(last.status, say(last)).toBe(201);
          const past = await book(guest(), doors.studio, { service_id: gel, starts_at: pdt("2026-10-20", "11:00"), ...person("Ola Window") });
          expect(past.status, say(past)).toBeGreaterThanOrEqual(400);
          const desk = await stand.create("bookings", { service_id: gel, team_id: team["Ivy"]!["id"], name: "Booked Ahead", starts_at: pdt("2026-11-03", "11:00") });
          expect(desk["state"]).toBe("booked");
        }, 60_000);

        it("a customer's cancel inside 24 hours is late", async () => {
          const gel = services["Gel Manicure"]!["id"];
          const availability = Object.keys(stand.refs).find((r) => stand.refs[r]?.["kind"] === "availability")!;
          const times = ok(await guest().raw<{ time: string; state: string }[]>("GET", `/api/v1/public/availability/${availability}?kind=${String(gel)}&date=2026-09-15`)).data as unknown as { time: string; state: string }[];
          const free = times.find((t) => t.state === "free")!;
          const made = await book(guest(), doors.studio, { service_id: gel, starts_at: pdt("2026-09-15", free.time), ...person("Uma Late") });
          expect(made.status, say(made)).toBe(201);
          const tab = stand.guest("link");
          ok(await tab.openLink(String(made.body.link?.token)));
          const moved = await tab.patch(linkWrite("move"), made.body.data["id"], { starts_at: pdt("2026-09-15", "18:00") });
          expect(moved.status, say(moved)).toBeGreaterThanOrEqual(400);
          const cancelled = await tab.patch(linkWrite("cancel"), made.body.data["id"], { state: "cancelled" });
          expect(cancelled.status, say(cancelled)).toBe(200);
          const row = await stand.row("bookings", made.body.data["id"]);
          expect([row["cancelled_by"], yes(row["late_cancel"])]).toEqual(["customer", true]);
        }, 60_000);
      });

      describe("a service switched off for online booking (BOOK-12)", () => {
        it("is gone from the public list, refused at the door, and still the desk's to book", async () => {
          const pedicure = services["Deluxe Pedicure"]!;
          await stand.patch("services", pedicure["id"], { bookable_online: false });
          const listed = await guest().list(Object.keys(stand.refs).find((r) => r.startsWith("bookings_services"))!);
          expect(listed.some((s) => s["id"] === pedicure["id"])).toBe(false);
          const refused = await book(guest(), doors.studio, { service_id: pedicure["id"], starts_at: pdt("2026-10-15", "10:00"), ...person("Pia Offline") });
          expect([refused.status, refused.code, refused.params["reason"]], say(refused)).toEqual([400, "PUBLIC_WRITE_REFUSED", "not-offered"]);
          const desk = await stand.create("bookings", { service_id: pedicure["id"], team_id: team["Ivy"]!["id"], name: "Phone Booking", starts_at: pdt("2026-10-15", "10:00") });
          expect(desk["state"]).toBe("booked");
          await stand.patch("services", pedicure["id"], { bookable_online: true });
        }, 60_000);
      });

      describe("three doors, by how the service is paid (MON-4, cQ32)", () => {
        it("A: takes a pay-at-the-studio service, and refuses a deposit service", async () => {
          await nextHour();
          const made = await book(guest(), doors.studio, { service_id: services["Cut & Style"]!["id"], starts_at: pdt("2026-10-13", "09:00"), ...person("Ana Studio") });
          expect(made.status, say(made)).toBe(201);
          expect([made.body.data["state"], made.body.data["pay_mode"], num(made.body.data["asked"])]).toEqual(["booked", "none", 0]);
          const refused = await book(guest(), doors.studio, { service_id: services["Root Color"]!["id"], starts_at: pdt("2026-10-13", "11:00"), ...person("Bea Studio") });
          expect(refused.status, say(refused)).toBeGreaterThanOrEqual(400);
        }, 60_000);

        it("while the owner's switch is off, C books a deposit service with nothing to pay, and B stays shut", async () => {
          await nextHour();
          const off = await book(guest(), doors.off, { service_id: services["Root Color"]!["id"], starts_at: pdt("2026-10-13", "11:00"), ...person("Cleo Off") });
          expect(off.status, say(off)).toBe(201);
          expect([off.body.data["state"], num(off.body.data["pay_due"])]).toEqual(["booked", 0]);
          const shut = await book(guest(), doors.money, { service_id: services["Balayage"]!["id"], starts_at: pdt("2026-10-14", "09:00"), ...person("Dot Money") });
          expect(shut.status, say(shut)).toBe(403);
        }, 60_000);

        it("with the switch on and payments not answering, neither B nor C books it: the service reads as paused", async () => {
          await nextHour();
          await setSetting({ online_payments: "on" });
          const b = await book(guest(), doors.money, { service_id: services["Balayage"]!["id"], starts_at: pdt("2026-10-14", "09:00"), ...person("Eve Paused") });
          expect([b.status, b.code], say(b)).toEqual([403, "PUBLIC_SWITCHED_OFF"]);
          const c = await book(guest(), doors.off, { service_id: services["Balayage"]!["id"], starts_at: pdt("2026-10-14", "09:00"), ...person("Fay Paused") });
          expect(c.status, say(c)).toBe(403);
        }, 60_000);

        it("with payments on, B holds the time for the deposit, frozen, and paying books it", async () => {
          await nextHour();
          ok(await stand.staff.post("/api/v1/payments/apps/switch", { connectionId: stand.connectionId, appKey: "bookings", enabled: true }));
          const tab = await stand.rehearsing();
          const made = await book(tab, doors.money, { service_id: services["Balayage"]!["id"], starts_at: pdt("2026-10-14", "09:00"), ...person("Gia Money") });
          expect(made.status, say(made)).toBe(201);
          expect([made.body.data["state"], num(made.body.data["deposit"]), num(made.body.data["pay_due"])]).toEqual(["paying", 50, 50]);
          // Booked as "Anyone": who it will be stays unsaid until it is booked (§7).
          expect(made.body.data["team_id"] ?? null).toBeNull();
          const payBy = new Date(String(made.body.data["pay_until"])).getTime();
          expect(Math.round((payBy - clock) / 60_000)).toBeGreaterThanOrEqual(14);
          expect(Math.round((payBy - clock) / 60_000)).toBeLessThanOrEqual(16);
          // The price list moves while she pays: what she owes does not (MON-2).
          await stand.patch("services", services["Balayage"]!["id"], { deposit: 60 });
          const row = await stand.row("bookings", made.body.data["id"]);
          expect(num(row["pay_due"])).toBe(50);
          await stand.patch("services", services["Balayage"]!["id"], { deposit: 50 });
          // A guest cannot book it by hand while money is due (MON-3).
          const link = String(made.body.link?.token ?? "");
          const own = stand.guest("link");
          ok(await own.openLink(link));
          const read = await own.get(`/api/v1/public/records/${linkRef()}/${String(made.body.data["id"])}`);
          expect(read.body.data["team_id"] ?? null, say(read)).toBeNull();
          const skip = await own.patch(linkWrite("pay"), made.body.data["id"], { state: "booked" });
          expect(skip.status, say(skip)).toBeGreaterThanOrEqual(400);
          expect(made.body["payUrl"], say(made)).toBeTruthy();
          await stand.payDemo(String(made.body["payUrl"]));
          const paid = await until(async () => {
            const row = await stand.row("bookings", made.body.data["id"]);
            return row["state"] === "booked" ? row : undefined;
          }, "the booking paid", 60_000);
          expect([paid["state"], num(paid["paid"]), num(paid["pay_due"])]).toEqual(["booked", 50, 0]);
          await setSetting({ online_payments: "off" });
        }, 120_000);
      });

      /** The link key's own entry on bookings, as its config names it. */
      let linkEntry = "";
      let linkWrites: { ref: string; writable: string[] }[] = [];
      /** The link's changes, in the manifest's order: cancel, move, pay, the Google press, take an offer, take one by paying. */
      const linkWrite = (what: "cancel" | "move" | "pay" | "google" | "offer" | "offer-pay") => linkWrites[["cancel", "move", "pay", "google", "offer", "offer-pay"].indexOf(what)]!.ref;
      const linkRef = () => linkEntry;

      describe("the caps (cQ4)", () => {
        it("a guest's e-mail takes three new bookings a day, and a fourth is refused", async () => {
          const who = person("Hana Caps");
          for (const [i, time] of ["10:00", "11:00", "12:00"].entries()) {
            await nextHour();
            const made = await book(guest(), doors.studio, { service_id: services["Gel Manicure"]!["id"], starts_at: pdt("2026-10-16", time), ...who, name: `Hana ${"ABC"[i]!}` });
            expect(made.status, say(made)).toBe(201);
          }
          await nextHour();
          const fourth = await book(guest(), doors.studio, { service_id: services["Gel Manicure"]!["id"], starts_at: pdt("2026-10-16", "16:00"), ...who });
          expect([fourth.status, fourth.code], say(fourth)).toEqual([409, "PUBLIC_LIMIT_REACHED"]);
        }, 120_000);

        it("one visitor takes four an hour at the studio door", async () => {
          await nextHour();
          const results: number[] = [];
          for (let i = 0; i < 5; i += 1) {
            const made = await book(guest(), doors.studio, { service_id: services["Classic Manicure"]!["id"], starts_at: pdt("2026-10-17", `1${String(i)}:00`), name: `Ira ${"ABCDE"[i]!}`, email: mail(`ira${String(i)}`) });
            results.push(made.status === 409 && made.code === "PUBLIC_LIMIT_REACHED" ? 0 : made.status);
          }
          expect(results.filter((s) => s === 201).length).toBe(4);
          expect(results[4]).toBe(0);
        }, 120_000);

        it("a signed-in customer holds at most three visits ahead", async () => {
          await nextHour();
          const who = person("Jo Signed");
          const first = await book(guest(), doors.studio, { service_id: services["Gel Manicure"]!["id"], starts_at: pdt("2026-10-14", "10:00"), ...who });
          expect(first.status, say(first)).toBe(201);
          const tab = guest();
          await tab.signIn(stand.server, who.email);
          for (const time of ["11:00", "12:00"]) {
            const made = await book(tab, doors.studio, { service_id: services["Gel Manicure"]!["id"], starts_at: pdt("2026-10-14", time), ...who });
            expect(made.status, say(made)).toBe(201);
            // Signed in, with Offers on: proved, for the review word and for Offers.
            expect(yes(made.body.data["customer_proved"]), say(made)).toBe(true);
            expect((await stand.row("bookings", made.body.data["id"]))["proved_by"]).not.toBeNull();
          }
          const fourth = await book(tab, doors.studio, { service_id: services["Gel Manicure"]!["id"], starts_at: pdt("2026-10-14", "16:00"), ...who });
          expect([fourth.status, fourth.code], say(fourth)).toEqual([409, "PUBLIC_LIMIT_REACHED"]);
        }, 180_000);
      });

      describe("a repeated save (MOD-10)", () => {
        it("lands on the same row, so \"Anyone\" never books a second specialist", async () => {
          await nextHour();
          const key = retryKey("repeat");
          const values = { language: "en-US", channel: "embed", service_id: services["Gel Manicure"]!["id"], starts_at: pdt("2026-10-15", "12:00"), client_key: key, ...person("Kai Repeat") };
          const first = await guest().create(doors.studio, { values });
          expect(first.status, say(first)).toBe(201);
          const second = await guest().create(doors.studio, { values });
          expect([200, 201], say(second)).toContain(second.status);
          expect(second.body.data["id"]).toBe(first.body.data["id"]);
        }, 60_000);
      });

      describe("a booking's own link (ACC-3, ACC-4, ACC-6)", () => {
        let made: { id: unknown; token: string };

        it("is never in a staff read", async () => {
          await nextHour();
          const reply = await book(guest(), doors.studio, { service_id: services["Gel Manicure"]!["id"], starts_at: pdt("2026-10-15", "14:00"), ...person("Lea Link"), note: "Back door, please" });
          expect(reply.status, say(reply)).toBe(201);
          made = { id: reply.body.data["id"], token: String(reply.body.link?.token) };
          expect(made.token.length).toBe(16);
          const row = await stand.row("bookings", made.id);
          expect(row["link_token"]).toBeUndefined();
          expect(JSON.stringify(await stand.rows("bookings"))).not.toContain(made.token);
        }, 60_000);

        it("opens that booking and no other, and nothing of the customer", async () => {
          const tab = stand.guest("link");
          ok(await tab.openLink(made.token));
          const own = await tab.get(`/api/v1/public/records/${linkRef()}/${String(made.id)}`);
          expect(own.status, say(own)).toBe(200);
          expect(own.body.data["name"]).toBe("Lea Link");
          expect(own.body.data["staff_note"]).toBeUndefined();
          const other = (await stand.rows("bookings")).find((b) => b["code"] === "LMN-1779")!;
          const theirs = await tab.get(`/api/v1/public/records/${linkRef()}/${String(other["id"])}`);
          expect([403, 404]).toContain(theirs.status);
          const customers = await tab.get("/api/v1/public/records/bookings_customers");
          expect([401, 403, 404]).toContain(customers.status);
        }, 60_000);

        it("a typed e-mail is not proof: the row joins the customer unproved, and no one's name is shown from it", async () => {
          const row = await stand.row("bookings", made.id);
          expect(row["customer_id"]).not.toBeNull();
          expect(yes(row["customer_proved"])).toBe(false);
          expect(row["proved_by"] ?? null).toBeNull();
          const desk = await stand.create("bookings", { service_id: services["Gel Manicure"]!["id"], team_id: team["June"]!["id"], name: "Desk Made", starts_at: pdt("2026-10-16", "17:00") });
          expect(desk["proved_by"]).not.toBeNull();
        }, 60_000);

        it("moves and cancels within the rules, and a cancel in time is not late", async () => {
          const tab = stand.guest("link");
          ok(await tab.openLink(made.token));
          const moved = await tab.patch(linkWrite("move"), made.id, { starts_at: pdt("2026-10-15", "15:00") });
          expect(moved.status, say(moved)).toBe(200);
          const cancelled = await tab.patch(linkWrite("cancel"), made.id, { state: "cancelled" });
          expect(cancelled.status, say(cancelled)).toBe(200);
          const row = await stand.row("bookings", made.id);
          expect([row["state"], row["cancelled_by"], yes(row["late_cancel"])]).toEqual(["cancelled", "customer", false]);
        }, 60_000);
      });

      describe("the waiting-list offer (MOD-8, ACC-4)", () => {
        it("holds no time, opens by its own link, and is taken like a new booking", async () => {
          await nextHour();
          const joined = await guest().create(waitRef, { values: { service_id: services["Signature Facial"]!["id"], team_id: team["Noor"]!["id"], day: "2026-10-16", language: "en-US", client_key: retryKey("wait"), ...person("Mei Waiting") } });
          expect(joined.status, say(joined)).toBe(201);
          const entry = joined.body.data;
          const at = pdt("2026-10-16", "09:00");
          const offer = await stand.create("bookings", { service_id: services["Signature Facial"]!["id"], team_id: team["Noor"]!["id"], customer_id: (await stand.row("waitlist", entry["id"]))["customer_id"], waitlist_id: entry["id"], name: "Mei Waiting", email: mail("mei"), starts_at: at, state: "offered" });
          expect(offer["state"]).toBe("offered");
          // It ends by itself, a day from now by the studio's setting.
          expect(Math.round((new Date(String(offer["offer_until"])).getTime() - clock) / 3_600_000)).toBe(24);
          expect((await stand.row("waitlist", entry["id"]))["state"]).toBe("offered");
          // It holds nothing: the desk can still book that time for someone else, and then the offer cannot be taken.
          const rival = await stand.create("bookings", { service_id: services["Signature Facial"]!["id"], team_id: team["Noor"]!["id"], name: "Walk In", starts_at: at });
          const tab = stand.guest("link");
          ok(await tab.openLink(await linkCodeOf(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, offer["id"])));
          const stale = await tab.patch(linkWrite("offer"), offer["id"], { state: "booked" });
          expect([stale.status, stale.code], say(stale)).toEqual([409, "PUBLIC_SLOT_FULL"]);
          await stand.patch("bookings", rival["id"], { state: "cancelled", cancelled_by: "studio", cancel_reason: "A mistake" });
          const taken = await tab.patch(linkWrite("offer"), offer["id"], { state: "booked" });
          expect(taken.status, say(taken)).toBe(200);
          expect((await stand.row("waitlist", entry["id"]))["state"]).toBe("booked");
        }, 90_000);

        it("asks for the deposit of a money service: it cannot be taken unpaid, and paying holds it for the usual minutes", async () => {
          await setSetting({ online_payments: "on" });
          const joined = await guest().create(waitRef, { values: { service_id: services["Balayage"]!["id"], team_id: team["Elin"]!["id"], day: "2026-10-15", language: "en-US", client_key: retryKey("wait"), name: "Vi Deposit", email: mail("vi") } });
          expect(joined.status, say(joined)).toBe(201);
          const entry = joined.body.data;
          const offer = await stand.create("bookings", { service_id: services["Balayage"]!["id"], team_id: team["Elin"]!["id"], customer_id: (await stand.row("waitlist", entry["id"]))["customer_id"], waitlist_id: entry["id"], name: "Vi Deposit", email: mail("vi"), starts_at: pdt("2026-10-15", "09:00"), state: "offered" });
          expect([num(offer["asked"]), num(offer["pay_due"])]).toEqual([50, 50]);
          await setSetting({ online_payments: "off" });
          const tab = stand.guest("link");
          ok(await tab.openLink(await linkCodeOf(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, offer["id"])));
          const unpaid = await tab.patch(linkWrite("offer"), offer["id"], { state: "booked" });
          expect(unpaid.status, say(unpaid)).toBeGreaterThanOrEqual(400);
          expect((await stand.row("bookings", offer["id"]))["state"]).toBe("offered");
          const paying = await tab.patch(linkWrite("offer-pay"), offer["id"], { state: "paying" });
          expect(paying.status, say(paying)).toBe(200);
          const row = await stand.row("bookings", offer["id"]);
          expect(row["state"]).toBe("paying");
          expect(Math.round((new Date(String(row["pay_until"])).getTime() - clock) / 60_000)).toBe(15);
        }, 90_000);

        it("judges a taken offer as a new booking: a time outside the person's hours is refused", async () => {
          const joined = await guest().create(waitRef, { values: { service_id: services["Signature Facial"]!["id"], team_id: team["Noor"]!["id"], day: "2026-10-14", language: "en-US", client_key: retryKey("wait"), name: "Wyn Hours", email: mail("wyn") } });
          expect(joined.status, say(joined)).toBe(201);
          const entry = joined.body.data;
          const offer = await stand.create("bookings", { service_id: services["Signature Facial"]!["id"], team_id: team["Noor"]!["id"], customer_id: (await stand.row("waitlist", entry["id"]))["customer_id"], waitlist_id: entry["id"], name: "Wyn Hours", email: mail("wyn"), starts_at: pdt("2026-10-14", "07:00"), state: "offered" });
          const tab = stand.guest("link");
          ok(await tab.openLink(await linkCodeOf(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, offer["id"])));
          const taken = await tab.patch(linkWrite("offer"), offer["id"], { state: "booked" });
          expect(taken.status, say(taken)).toBeGreaterThanOrEqual(400);
          expect((await stand.row("bookings", offer["id"]))["state"]).toBe("offered");
        }, 90_000);

        it("is the only booking a waiting-list row may have made for it", async () => {
          const entry = (await stand.rows("waitlist")).find((w) => w["state"] === "waiting")!;
          const refused = await stand.staff.post(stand.data("bookings"), { values: { service_id: entry["service_id"], name: "Not An Offer", waitlist_id: entry["id"], starts_at: pdt("2026-10-16", "15:00") }, clientKey: retryKey("noffer") });
          expect(refused.status, say(refused)).toBeGreaterThanOrEqual(400);
          expect((await stand.row("waitlist", entry["id"]))["state"]).toBe("waiting");
        }, 30_000);
      });

      describe("the booking's own rules", () => {
        it("only a customer's cancel is late, and the studio says why (MON-9)", async () => {
          const soon = (await stand.rows("bookings")).find((b) => b["code"] === "LMN-1896")!;
          const noReason = await stand.staff.patch(`${stand.data("bookings")}/${String(soon["id"])}`, { values: { state: "cancelled", cancelled_by: "studio" } });
          expect(noReason.status).toBe(422);
          await stand.patch("bookings", soon["id"], { state: "cancelled", cancelled_by: "studio", cancel_reason: "Marco is ill" });
          const row = await stand.row("bookings", soon["id"]);
          expect([row["cancelled_by"], yes(row["late_cancel"])]).toEqual(["studio", false]);
        }, 60_000);

        it("a no-show frees its time for a walk-in (cQ5)", async () => {
          const gel = services["Gel Manicure"]!["id"];
          const ivy = team["Ivy"]!["id"];
          const at = pdt("2026-10-27", "11:00");
          const missed = await stand.create("bookings", { service_id: gel, team_id: ivy, name: "Never Came", starts_at: at });
          clock = Date.parse(pdt("2026-10-27", "11:05"));
          await stand.server.setClock(clock);
          // Six weeks on, the operator's session has ended.
          await stand.staff.signIn(ADMIN.email, ADMIN.password);
          const held = await stand.staff.post(stand.data("bookings"), { values: { service_id: gel, team_id: ivy, name: "Walk In", starts_at: at } });
          expect([held.status, held.code]).toEqual([409, "BOOKING_TAKEN"]);
          await stand.patch("bookings", missed["id"], { state: "no_show" });
          const walkIn = await stand.create("bookings", { service_id: gel, team_id: ivy, name: "Walk In", starts_at: at });
          expect(walkIn["state"]).toBe("booked");
        }, 60_000);
      });

      describe("what the clock lets go", () => {
        it("an unpaid hold and an offer nobody took: the offer's guest is waiting again", async () => {
          const rows = await stand.rows("bookings");
          const dana = rows.find((b) => b["code"] === "LMN-1899")!;
          const entry = (await stand.rows("waitlist")).find((w) => w["name"] === "Dana Rivas")!;
          const offer = rows.find((b) => String(b["waitlist_id"]) === String(entry["id"]))!;
          const gone = await until(async () => {
            const [held, offered] = await Promise.all([stand.row("bookings", dana["id"]), stand.row("bookings", offer["id"])]);
            return held["state"] === "lapsed" && offered["state"] === "lapsed" ? { held, offered } : undefined;
          }, "the clock to let them go", 120_000);
          expect([gone.held["lapsed_by"], gone.offered["lapsed_by"]]).toEqual(["time", "time"]);
          expect((await stand.row("waitlist", entry["id"]))["state"]).toBe("waiting");
        }, 150_000);
      });

    });
  });
});
