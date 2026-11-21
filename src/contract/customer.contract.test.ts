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
import { refusalOf, usesLeft } from "../customer/rules.ts";
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

      describe("reviews", () => {
        const visit = async (code: string) => (await stand.rows("bookings")).find((b) => b["code"] === code)!;

        it("a guest's own link never reviews a visit it cannot prove (cQ23, ACC-6)", async () => {
          const row = await visit("LMN-1738");
          const token = await linkCodeOf(engine as Engine, stand.server.base, row["id"]);
          const door = tab();
          expect(await door.openLink(token)).toBe("opened");
          const state = await door.reviewState(row["id"], false);
          expect(state?.open).toBe(false);
          expect(state?.shownName).toBe("");
          await expect(door.sendReview(row["id"], false, 5, "Lovely")).rejects.toThrow();
        }, 60_000);

        it("a customer signed in reviews their visit once, and it waits to be read before it is public", async () => {
          await nextHour();
          const ava = tab();
          await signIn(ava, "ava.reyes@example.com");
          const row = await visit("LMN-1738");
          const state = (await ava.reviewState(row["id"], true))!;
          expect([state.open, state.reviewedAt]).toEqual([true, null]);
          expect(state.shownName).toBe("Ava R.");
          await ava.sendReview(row["id"], true, 2, "The colour was not what I asked for.");
          await expect(ava.sendReview(row["id"], true, 5, "Again")).rejects.toThrow();
          expect((await ava.reviewState(row["id"], true))!.reviewedAt).not.toBeNull();
          expect((await tab().reviews(10))?.count ?? 0).toBe(0);

          const kept = (await stand.rows("forms_reviews")).find((r) => num(r["stars"]) === 2)!;
          await stand.patch("forms_reviews", kept["id"], { state: "published" });
          const page = (await tab().reviews(10))!;
          expect([page.count, page.average, page.bars]).toEqual([1, 2, [0, 0, 0, 1, 0]]);
          // First name and initial, and the specialist by first name in what is public (cQ22).
          const shown = page.list[0]!;
          expect(shown["shown_name"]).toBe("Ava R.");
          expect(String(shown["about_detail"]).split(/\s+/)[0]).toBe("Ivy");
          expect(JSON.stringify(shown)).not.toContain("ava.reyes");
        }, 180_000);
      });

      describe("on the studio's own website (cT13, cQ7)", () => {
        const site = "https://lumenstudio.example";
        const policyOf = async (path: string) => {
          const res = await fetch(`${stand.server.base}/apps/bookings/customer${path}`);
          return { status: res.status, csp: res.headers.get("content-security-policy") ?? "", xfo: res.headers.get("x-frame-options"), store: res.headers.get("cache-control") ?? "" };
        };

        beforeAll(async () => {
          ok(await stand.staff.post("/api/v1/privacy/websites", { lines: [site] }));
        }, 60_000);

        it("lets a listed website frame only the declared screens", async () => {
          for (const path of ["/?frame=1", "/book?frame=1&service=1", "/reviews?frame=1"]) {
            const page = await policyOf(path);
            expect(page.status, path).toBe(200);
            expect(page.csp, path).toContain(site);
            expect(page.xfo, path).toBeNull();
            expect(page.store, path).toContain("no-store");
          }
        }, 60_000);

        it("never lets a website frame a private page", async () => {
          for (const path of ["/b?frame=1", "/account?frame=1", "/sign-in?frame=1", "/find?frame=1", "/packs?frame=1", "/gift-cards?frame=1", "/paid?frame=1", "/review?frame=1"]) {
            const page = await policyOf(path);
            expect(page.csp, path).not.toContain(site);
            expect(page.csp, path).toContain("frame-ancestors 'self'");
          }
        }, 60_000);

        it("hands the frame the listed websites", async () => {
          const doc = ok(await new Caller(stand.server.base).get<{ frameOrigins?: string[] }>("/apps/bookings/customer/surface-config.json?frame=1"));
          expect(doc.frameOrigins).toContain(site);
        }, 60_000);
      });

      describe("with payments on, as somebody rehearsing the checkout", () => {
        let money: () => LumenDoor;
        let nell: LumenDoor;
        const email = () => `nell.${engine}@lumen-guests.dev`;
        const product = async (name: string) => (await stand.rows("pack_products")).find((p) => p["name"] === name)!;
        const voucher = async (door: LumenDoor) => (await door.held()).packs.find((p) => p["public_name"] === "Movement Ten")!;
        const paidPurchase = (id: unknown) => until(async () => {
          const row = await stand.row("purchases", id);
          return row["state"] === "paid" ? row : undefined;
        }, "the purchase paid", 60_000);
        /** A free time for the Reformer on a day, through the door the page uses. */
        const freeOn = async (door: LumenDoor, day: string) => (await door.times(String(services["Reformer Pilates, private"]!["id"]), null, day)).find((t) => t.state === "free")!.time;
        const reformer = (day: string, time: string) => values("Reformer Pilates, private", pdt(day, time), "Nell Pack", { email: email() });

        beforeAll(async () => {
          await nextHour();
          await setSetting({ online_payments: "on" });
          ok(await stand.staff.post("/api/v1/payments/apps/switch", { connectionId: stand.connectionId, appKey: "bookings", enabled: true }));
          const guest = await stand.rehearsing();
          const rehearsal = guest as unknown as { rehearsal: { cookie: string; csrf: string } };
          money = () => {
            const fetcher: typeof fetch = (input, init) => {
              const headers = new Headers(init?.headers);
              headers.set("origin", stand.server.base);
              headers.set("cookie", rehearsal.rehearsal.cookie);
              return fetch(input, { ...init, headers });
            };
            return new LumenDoor({ ...served, baseUrl: stand.server.base, rehearsalToken: rehearsal.rehearsal.csrf }, { fetch: fetcher });
          };
          // Known to the studio by a first booking, so a code can be mailed to them.
          const first = await tab().book("studio", values("Cut & Style", pdt("2026-10-08", "10:00"), "Nell Pack", { email: email() }), retryKey("n0"));
          await tab().openLink(first.token!);
          nell = money();
          await signIn(nell, email());
        }, 180_000);

        it("buys a pack signed in: nothing exists until it is paid, and the holder is the proved customer", async () => {
          const pack = await product("Movement Ten");
          const made = await nell.buyPack(String(pack["id"]), { buyer_name: "Someone Else", buyer_email: `other.${engine}@lumen-guests.dev`, language: "en-US" }, retryKey("p1"));
          expect(made.row["state"]).toBe("paying");
          expect(await voucher(nell)).toBeUndefined();
          await stand.payDemo(made.payUrl!);
          const row = await paidPurchase(made.row["id"]);
          expect(String(row["holder_email"]).toLowerCase()).toBe(email());
          const held = await until(() => voucher(nell), "the pack held");
          expect([num(held["uses_total"]), usesLeft(held)]).toEqual([10, 10]);
        }, 180_000);

        it("refuses a pack to someone who is not signed in", async () => {
          const pack = await product("Movement Ten");
          await expect(tab().buyPack(String(pack["id"]), { buyer_name: "Gus", buyer_email: `gus2.${engine}@lumen-guests.dev`, language: "en-US" }, retryKey("p2"))).rejects.toThrow();
        }, 60_000);

        it("gives a pack use back on a free cancel (CR-OFF-1)", async () => {
          const held = await voucher(nell);
          const made = await nell.book("studio", reformer("2026-10-06", await freeOn(nell, "2026-10-06")), retryKey("u1"), { codes: [`held:${String(held["id"])}`] });
          expect(num(made.row["discount"])).toBe(40);
          expect(usesLeft(await voucher(nell))).toBe(9);
          await nell.cancelBooking(made.row["id"], true);
          await until(async () => (usesLeft(await voucher(nell)) === 10 ? true : undefined), "the use given back");
        }, 120_000);

        it("keeps a pack use on a late cancel (cQ31)", async () => {
          const held = await voucher(nell);
          const before = usesLeft(held);
          const made = await nell.book("studio", reformer("2026-09-16", await freeOn(nell, "2026-09-16")), retryKey("u2"), { codes: [`held:${String(held["id"])}`] });
          const row = await stand.row("bookings", made.row["id"]);
          const late = new Date(String(row["free_until"])).getTime() <= clock;
          expect(late, "this visit must already be inside the 24 hours").toBe(true);
          await nell.cancelBooking(made.row["id"], true);
          expect(yes((await stand.row("bookings", made.row["id"]))["late_cancel"])).toBe(true);
          expect(usesLeft(await voucher(nell))).toBe(before - 1);
        }, 120_000);

        it("sells a gift card to anyone, and it pays a deposit in full with nothing left to pay online (R2, MON-3)", async () => {
          const amount = (await stand.rows("gift_amounts")).find((a) => num(a["amount"]) === 100)!;
          const buyer = money();
          const bought = await buyer.buyCard({ gift_amount_id: amount["id"], to_name: "Nell Pack", to_email: email() }, { buyer_name: "A Friend", buyer_email: `friend.${engine}@lumen-guests.dev`, language: "en-US" }, retryKey("g1"));
          await stand.payDemo(bought.payUrl!);
          await paidPurchase(bought.row["id"]);
          const card = await until(async () => (await nell.held()).cards.find((c) => num(c["balance"]) === 100), "the card held");

          const balayage = String(services["Balayage"]!["id"]);
          const open = (await nell.days(balayage, null, "2026-10-05", 14)).find((d) => d.state === "open" && d.open > 0)!.date;
          const at = (await nell.times(balayage, null, open)).find((t) => t.state === "free")!.time;
          const made = await nell.book("money", values("Balayage", pdt(open, at), "Nell Pack", { email: email() }), retryKey("g2"), { card: `held:${String(card["id"])}` });
          expect([made.row["state"], num(made.row["pay_due"])]).toEqual(["paying", 0]);
          await nell.nothingDue(made.row["id"], true);
          expect((await stand.row("bookings", made.row["id"]))["state"]).toBe("booked");
          expect(num((await nell.held()).cards.find((c) => c["id"] === card["id"])!["balance"])).toBe(50);

          // A free cancel gives the card's part back.
          await nell.cancelBooking(made.row["id"], true);
          await until(async () => (num((await nell.held()).cards.find((c) => c["id"] === card["id"])?.["balance"]) === 100 ? true : undefined), "the card's part given back");
        }, 180_000);

        it("takes a pack back only through the owner's cancel of its sale (T10)", async () => {
          const pack = await product("Glow Five");
          const made = await nell.buyPack(String(pack["id"]), { buyer_name: "Nell Pack", buyer_email: email(), language: "en-US" }, retryKey("p3"));
          await stand.payDemo(made.payUrl!);
          await paidPurchase(made.row["id"]);
          const glow = () => nell.held().then((h) => h.packs.find((p) => p["public_name"] === "Glow Five"));
          await until(glow, "the second pack");
          await stand.patch("purchases", made.row["id"], { state: "cancelled" });
          await until(async () => ((await glow()) === undefined ? true : undefined), "the pack recalled");
        }, 180_000);

        // Last: it moves the clock past the visit, which outlives the customer's session.
        it("keeps a pack use on a no-show (cQ31)", async () => {
          const held = await voucher(nell);
          const before = usesLeft(held);
          const kind = String(services["Reformer Pilates, private"]!["id"]);
          const day = (await nell.days(kind, null, "2026-09-16", 14)).find((d) => d.state === "open" && d.open > 0)!.date;
          const time = await freeOn(nell, day);
          const made = await nell.book("studio", reformer(day, time), retryKey("u3"), { codes: [`held:${String(held["id"])}`] });
          expect(usesLeft(await voucher(nell))).toBe(before - 1);
          clock = new Date(pdt(day, time)).getTime() + 5 * 60_000;
          await stand.server.setClock(clock);
          await stand.patch("bookings", made.row["id"], { state: "no_show" });
          const row = (await stand.rows("offers_vouchers")).find((v) => v["id"] === held["id"])!;
          expect(usesLeft(row)).toBe(before - 1);
        }, 120_000);
      });
    });
  });
});

