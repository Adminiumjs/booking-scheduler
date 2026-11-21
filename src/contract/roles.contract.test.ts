/**
 * WHO MAY DO WHAT AT LUMEN, ENFORCED BY ADMINIUM, RUN AS EACH ROLE (plan §7, ACC-7).
 *
 * On each engine, Lumen with its sample at Tuesday 15 September 2026, 10:40.
 * Three members of staff are invited, each with one of the app's roles and no
 * other, and sign in. Then, as each of them, over the data API:
 *
 *   - the SPECIALIST (Noor) reads her own bookings, without money, e-mail or
 *     phone; those clients' names and notes; her own team row and time off.
 *     A colleague's anything answers nothing, by key, list or search.
 *   - the FRONT DESK reads every booking with its money, books, moves and
 *     cancels, and never changes a price, refunds, or touches settings.
 *   - the OWNER does all of it, and refunds.
 *
 * A hidden button is not a lock: every refusal here is the server's.
 */
import { randomBytes } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Caller, ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, until, type Engine } from "./harness.ts";
import { ADD_ONS, num, PREFIX, retryKey, standUp, yes, type Row, type Stand } from "./stand.ts";
import { NOT_THE_SPECIALISTS } from "../manifest/roles.ts";

const why = missing() ?? ADD_ONS.map((key) => missingAddOn(key)).find((reason) => reason !== null) ?? null;
if (why !== null && process.env["ADMINIUM_REQUIRE_CONTRACT"] === "1") throw new Error(`the roles contract must run here, and cannot: ${why}`);
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 5310) + 20;
const pdt = (day: string, time: string) => new Date(`${day}T${time}:00-07:00`).toISOString();
const REFUSED = [403, 404];

describe.skipIf(why !== null)(`who may do what at Lumen${why === null ? "" : ` — skipped: ${why}`}`, () => {
  ENGINES.forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let stand: Stand;
      let owner: Caller;
      let desk: Caller;
      let noor: Caller;
      let noorTeam: Row;
      let all: Row[];
      let bookingsId = "";
      let paidOnline: { id: unknown; attemptId: string };
      let paidSoon: unknown;
      const exportOf = (ref: string) => ({ connectionId: stand.connectionId, source: { kind: "table", table: tableIds[ref] }, format: "csv" });
      let tableIds: Record<string, string> = {};
      const refundOf = (attemptId: string) => ({ attemptId, amount: "50.00", reason: "requested_by_customer", note: null, key: `refund_${randomBytes(10).toString("hex")}` });

      const member = async (role: RegExp, who: string): Promise<{ caller: Caller; id: string }> => {
        const roles = ok(await stand.staff.get<{ roles: { id: string; name: string; key?: string }[] }>("/api/v1/roles")).roles;
        const found = roles.find((r) => role.test(r.name) || role.test(r.key ?? ""));
        if (found === undefined) throw new Error(`no role ${String(role)} in ${JSON.stringify(roles.map((r) => r.name))}`);
        const email = `${who}.${engine}@lumen-staff.dev`;
        const invited = ok(await stand.staff.post<{ user?: { id: string }; id?: string; invite: { token: string } }>("/api/v1/users", { email, name: who.replace(/^./, (c) => c.toUpperCase()), roleIds: [found.id] }), 201);
        const password = `${randomBytes(18).toString("base64url")}Aa1!`;
        ok(await new Caller(stand.server.base, { origin: stand.server.base }).post("/api/v1/auth/password/reset", { token: invited.invite.token, newPassword: password }));
        const caller = new Caller(stand.server.base, { origin: stand.server.base });
        await caller.signInToScreens(email, password, "bookings");
        const users = ok(await stand.staff.get<{ users: { id: string; email: string }[] }>("/api/v1/users")).users;
        return { caller, id: invited.user?.id ?? invited.id ?? users.find((u) => u.email === email)!.id };
      };
      const read = async (who: Caller, ref: string): Promise<Row[]> => {
        const out: Row[] = [];
        for (let offset = 0; ; offset += 200) {
          const page = ok(await who.get<{ data: Row[] }>(`${stand.data(ref)}?limit=200&offset=${String(offset)}`)).data;
          out.push(...page);
          if (page.length < 200) return out;
        }
      };
      const code = (c: string) => all.find((b) => b["code"] === c)!;
      /** What a person may do with a team row's calendar connection, as the desk asks it. */
      const rowQuery = (id: unknown) => new URLSearchParams({ connection: stand.connectionId, table: tableIds["team"]!, row: String(id) }).toString();
      const connections = async (who: Caller, id: unknown) => ok(await who.get<{ may: { connect: boolean; sendLink: boolean; copyLink: boolean; disconnect: boolean } }>(`/api/v1/connected-accounts?${rowQuery(id)}`));

      beforeAll(async () => {
        stand = await standUp(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, "roles");
        const schema = ok(await stand.staff.get<{ model: { tables: { id: string; name: string }[] } }>(`/api/v1/connections/${stand.connectionId}/schema`));
        bookingsId = schema.model.tables.find((t) => t.name === `${PREFIX}bookings`)!.id;
        tableIds = Object.fromEntries(schema.model.tables.filter((t) => t.name.startsWith(PREFIX)).map((t) => [t.name.slice(PREFIX.length), t.id]));
        ok(await stand.staff.post("/api/v1/payments/apps/switch", { connectionId: stand.connectionId, appKey: "bookings", enabled: true }));
        owner = (await member(/^owner$/i, "selma")).caller;
        desk = (await member(/front/i, "jun")).caller;
        const specialist = await member(/specialist/i, "noor");
        noor = specialist.caller;
        noorTeam = (await stand.rows("team")).find((t) => t["name"] === "Noor Haddad")!;
        await stand.patch("team", noorTeam["id"], { user_id: specialist.id });
        // One deposit really paid, through the door and the pay page, for the refund tests.
        const settings = (await stand.rows("settings"))[0]!;
        await stand.patch("settings", settings["id"], { online_payments: "on" });
        const root = (await stand.rows("services")).find((s) => s["name"] === "Root Color")!;
        const tab = await stand.rehearsing();
        const suffix = (ref: string) => Number(/_(\d+)$/.exec(ref)?.[1] ?? 1);
        const door = Object.keys(stand.refs).filter((r) => r.startsWith("bookings_bookings") && JSON.stringify(stand.refs[r]?.["actions"] ?? []) === '["create"]').sort((a, b) => suffix(a) - suffix(b))[1]!;
        const made = await tab.create(door, { values: { service_id: root["id"], starts_at: pdt("2026-10-13", "09:00"), name: "Pay Once", email: `pay.${engine}@lumen-guests.dev`, language: "en-US", channel: "page", client_key: retryKey("roles") } });
        if (made.status !== 201) throw new Error(`the paid booking: ${JSON.stringify(made.body).slice(0, 500)}`);
        await stand.payDemo(String(made.body["payUrl"]));
        await until(async () => ((await stand.row("bookings", made.body.data["id"]))["state"] === "booked" ? true : undefined), "the deposit landed", 60_000);
        const panel = ok(await stand.staff.post<{ data: { payments: { attemptId: string | null }[] } }>("/api/v1/payments/panel", { connectionId: stand.connectionId, table: bookingsId, recordId: String(made.body.data["id"]) }));
        paidOnline = { id: made.body.data["id"], attemptId: panel.data.payments.find((p) => p.attemptId !== null)!.attemptId! };
        // A second, inside the 24-hour window, for the studio's own cancel.
        const availability = Object.keys(stand.refs).find((r) => stand.refs[r]?.["kind"] === "availability")!;
        const guestTab = stand.guest("studio");
        // Any deposit service with a free time inside the next 24 hours.
        const inside = Date.parse("2026-09-16T17:40:00Z");
        let free: { service: unknown; at: string } | undefined;
        for (const name of ["Root Color", "Aromatherapy Ritual", "Balayage"]) {
          const service = (await stand.rows("services")).find((s) => s["name"] === name)!;
          for (const day of ["2026-09-15", "2026-09-16"]) {
            const times = ok(await guestTab.raw("GET", `/api/v1/public/availability/${availability}?kind=${String(service["id"])}&date=${day}`)).data as unknown as { time: string; state: string }[];
            const hit = times.find((t) => t.state === "free" && Date.parse(pdt(day, t.time)) < inside);
            if (hit !== undefined && free === undefined) free = { service: service["id"], at: pdt(day, hit.time) };
          }
        }
        if (free === undefined) throw new Error("no deposit service is free inside the next 24 hours");
        const soon = await tab.create(door, { values: { service_id: free.service, starts_at: free.at, name: "Pay Soon", email: `soon.${engine}@lumen-guests.dev`, language: "en-US", channel: "page", client_key: retryKey("soon") } });
        if (soon.status !== 201) throw new Error(`the booking inside the window: ${JSON.stringify(soon.body).slice(0, 500)}`);
        await stand.payDemo(String(soon.body["payUrl"]));
        await until(async () => ((await stand.row("bookings", soon.body.data["id"]))["state"] === "booked" ? true : undefined), "the second deposit landed", 60_000);
        paidSoon = soon.body.data["id"];
        await stand.patch("settings", settings["id"], { online_payments: "off" });
        all = await stand.rows("bookings");
      }, 900_000);

      afterAll(async () => {
        await stand?.server.stop();
      });

      describe("the specialist", () => {
        it("reads only her own bookings, without money, e-mail or phone", async () => {
          const rows = await read(noor, "bookings");
          const hers = all.filter((b) => String(b["team_id"]) === String(noorTeam["id"]));
          expect(rows.length).toBe(hers.length);
          expect(rows.every((b) => String(b["team_id"]) === String(noorTeam["id"]))).toBe(true);
          for (const column of NOT_THE_SPECIALISTS) expect(rows.some((b) => b[column] !== undefined), column).toBe(false);
          expect(rows.some((b) => b["name"] === "Lucia Moss")).toBe(true);
        });

        it("cannot open a colleague's booking by key, or find it by search", async () => {
          const elins = code("LMN-1899");
          expect(REFUSED).toContain((await noor.get(`${stand.data("bookings")}/${String(elins["id"])}`)).status);
          // Dana's visits are all with Elin or someone else's but Noor's own: a search returns only Noor's.
          const found = ok(await noor.get<{ data: Row[] }>(`${stand.data("bookings")}?q=${encodeURIComponent("Dana Rivas")}&limit=50`)).data;
          expect(found.every((b) => String(b["team_id"]) === String(noorTeam["id"]))).toBe(true);
          const asOwner = ok(await stand.staff.get<{ data: Row[] }>(`${stand.data("bookings")}?q=${encodeURIComponent("Dana Rivas")}&limit=50`)).data;
          expect(asOwner.some((b) => String(b["team_id"]) !== String(noorTeam["id"]))).toBe(true);
        });

        it("reads her own clients' names and notes, and no one else's", async () => {
          const rows = await read(noor, "customers");
          const mine = new Set(all.filter((b) => String(b["team_id"]) === String(noorTeam["id"])).map((b) => String(b["customer_id"])));
          expect(rows.length).toBeGreaterThan(0);
          expect(rows.every((c) => mine.has(String(c["id"])))).toBe(true);
          for (const column of ["email", "phone", "review_requests"]) expect(rows.some((c) => c[column] !== undefined), column).toBe(false);
        });

        it("reads her own team row, hours and days off, and not a colleague's", async () => {
          expect((await read(noor, "team")).map((t) => t["name"])).toEqual(["Noor Haddad"]);
          const hours = await read(noor, "team_hours");
          expect(hours.length).toBeGreaterThan(0);
          expect(hours.every((h) => String(h["team_id"]) === String(noorTeam["id"]))).toBe(true);
          expect((await read(noor, "closures")).some((c) => c["name"] === "Holiday")).toBe(false);
          const off = await read(noor, "time_off");
          expect(off.every((o) => String(o["team_id"]) === String(noorTeam["id"]))).toBe(true);
        });

        it("adds and removes her own time off, and never a colleague's", async () => {
          const made = ok(await noor.post<{ data: Row }>(stand.data("time_off"), { values: { team_id: noorTeam["id"], starts_at: pdt("2026-10-20", "09:00"), ends_at: pdt("2026-10-20", "10:00"), why: "Dentist" } }), 201).data;
          const marco = (await stand.rows("team")).find((t) => t["name"] === "Marco Bellini")!;
          const theirs = await noor.post(stand.data("time_off"), { values: { team_id: marco["id"], starts_at: pdt("2026-10-21", "09:00"), ends_at: pdt("2026-10-21", "10:00") } });
          expect(theirs.status).toBeGreaterThanOrEqual(400);
          const juneOff = (await stand.rows("time_off")).find((o) => o["why"] === "Appointment")!;
          expect(REFUSED).toContain((await noor.send("DELETE", `${stand.data("time_off")}/${String(juneOff["id"])}`)).status);
          const removed = await noor.send("DELETE", `${stand.data("time_off")}/${String(made["id"])}`);
          expect([200, 204]).toContain(removed.status);
        });

        it("marks her own visit's steps, and nothing else of it", async () => {
          const iris = code("LMN-1784");
          ok(await noor.patch(`${stand.data("bookings")}/${String(iris["id"])}`, { values: { state: "arrived" } }));
          ok(await noor.patch(`${stand.data("bookings")}/${String(iris["id"])}`, { values: { state: "done" } }));
          const back = await noor.patch(`${stand.data("bookings")}/${String(iris["id"])}`, { values: { state: "arrived" } });
          expect(back.status).toBeGreaterThanOrEqual(400);
          const nadia = code("LMN-1546");
          const note = await noor.patch(`${stand.data("bookings")}/${String(nadia["id"])}`, { values: { staff_note: "Hello" } });
          expect(note.status).toBeGreaterThanOrEqual(400);
          const cancel = await noor.patch(`${stand.data("bookings")}/${String(nadia["id"])}`, { values: { state: "cancelled", cancelled_by: "studio", cancel_reason: "No" } });
          expect(cancel.status).toBeGreaterThanOrEqual(400);
          const elins = code("LMN-1864");
          expect(REFUSED).toContain((await noor.patch(`${stand.data("bookings")}/${String(elins["id"])}`, { values: { state: "arrived" } })).status);
        });

        it("may connect her own calendar, and write nothing of her team row", async () => {
          const mine = await connections(noor, noorTeam["id"]);
          expect([mine.may.connect, mine.may.disconnect, mine.may.sendLink, mine.may.copyLink]).toEqual([true, true, false, false]);
          const url = `${stand.data("team")}/${String(noorTeam["id"])}`;
          for (const values of [{ name: "Mine" }, { role_title: "Owner" }, { tint: "#000000" }, { active: false }, { bookable_online: false }, { position: 9 }, { user_id: "someone" }, { email: "noor@elsewhere.dev" }, { id: 999 }]) {
            const refused = await noor.patch(url, { values });
            expect(refused.status, JSON.stringify(values)).toBeGreaterThanOrEqual(400);
          }
          const row = await stand.row("team", noorTeam["id"]);
          expect([row["id"], row["name"], row["active"] === true || row["active"] === 1, row["email"]]).toEqual([noorTeam["id"], "Noor Haddad", true, noorTeam["email"]]);
        });

        it("reaches no colleague's calendar", async () => {
          const marco = (await stand.rows("team")).find((t) => t["name"] === "Marco Bellini")!;
          const reply = await noor.get(`/api/v1/connected-accounts?${rowQuery(marco["id"])}`);
          expect(REFUSED).toContain(reply.status);
          expect(REFUSED).toContain((await noor.patch(`${stand.data("team")}/${String(marco["id"])}`, { values: { name: "Theirs" } })).status);
        });

        it("reads no pack or gift card", async () => {
          for (const ref of ["offers_vouchers", "offers_gift_cards"]) expect(REFUSED, ref).toContain((await noor.get(`${stand.data(ref)}?limit=5`)).status);
        });

        it("cannot read money, the waiting list, the e-mails, or the calendar table", async () => {
          for (const ref of ["payments", "purchases", "purchase_lines", "waitlist", "messages", "calendar_busy"]) expect(REFUSED, ref).toContain((await noor.get(`${stand.data(ref)}?limit=5`)).status);
        });

        it("cannot change a service or a setting, or export", async () => {
          const service = (await stand.rows("services"))[0]!;
          expect(REFUSED).toContain((await noor.patch(`${stand.data("services")}/${String(service["id"])}`, { values: { price: 1 } })).status);
          const settings = (await stand.rows("settings"))[0]!;
          expect(REFUSED).toContain((await noor.patch(`${stand.data("settings")}/${String(settings["id"])}`, { values: { studio_name: "Mine" } })).status);
          expect(REFUSED).toContain((await noor.post("/api/v1/exports", exportOf("bookings"))).status);
        });
      });

      describe("the front desk", () => {
        it("reads every booking with its money, and no link code", async () => {
          const rows = await read(desk, "bookings");
          expect(rows.length).toBe(all.length);
          const dana = rows.find((b) => b["code"] === "LMN-1899")!;
          expect([num(dana["price"]), num(dana["pay_due"]), dana["email"]]).toEqual([135, 50, "dana.rivas@example.com"]);
          expect(rows.some((b) => b["link_token"] !== undefined)).toBe(false);
        });

        it("reads the team without their e-mails", async () => {
          expect((await read(desk, "team")).some((t) => t["email"] !== undefined)).toBe(false);
        });

        it("books, moves and cancels, naming the studio", async () => {
          const gel = (await stand.rows("services")).find((s) => s["name"] === "Gel Manicure")!;
          const ivy = (await stand.rows("team")).find((t) => t["name"] === "Ivy Chen")!;
          const made = ok(await desk.post<{ data: Row }>(stand.data("bookings"), { values: { service_id: gel["id"], team_id: ivy["id"], name: "Phone Guest", starts_at: pdt("2026-10-13", "10:00") }, clientKey: retryKey("desk") }), 201).data;
          expect(made["channel"]).toBe("desk");
          ok(await desk.patch(`${stand.data("bookings")}/${String(made["id"])}`, { values: { starts_at: pdt("2026-10-13", "11:00") } }));
          const asCustomer = await desk.patch(`${stand.data("bookings")}/${String(made["id"])}`, { values: { state: "cancelled", cancelled_by: "customer" } });
          expect(asCustomer.status).toBeGreaterThanOrEqual(400);
          ok(await desk.patch(`${stand.data("bookings")}/${String(made["id"])}`, { values: { state: "cancelled", cancelled_by: "studio", cancel_reason: "Called to cancel" } }));
        });

        it("reads packs and gift cards for the client panel", async () => {
          for (const ref of ["offers_vouchers", "offers_gift_cards"]) ok(await desk.get(`${stand.data(ref)}?limit=5`));
        });

        it("may send a connect link to anyone on the team, and nothing more of their calendar", async () => {
          const marco = (await stand.rows("team")).find((t) => t["name"] === "Marco Bellini")!;
          const row = await connections(desk, marco["id"]);
          expect([row.may.sendLink, row.may.copyLink, row.may.connect, row.may.disconnect]).toEqual([true, false, false, false]);
        });

        it("never changes a price, a setting, or a review's state, and has no refund or export", async () => {
          const service = (await stand.rows("services"))[0]!;
          expect(REFUSED).toContain((await desk.patch(`${stand.data("services")}/${String(service["id"])}`, { values: { price: 1 } })).status);
          const settings = (await stand.rows("settings"))[0]!;
          expect(REFUSED).toContain((await desk.patch(`${stand.data("settings")}/${String(settings["id"])}`, { values: { studio_name: "Mine" } })).status);
          const paid = (await stand.rows("payments")).find((p) => p["booking_id"] !== null)!;
          expect(REFUSED).toContain((await desk.patch(`${stand.data("payments")}/${String(paid["id"])}`, { values: { amount: 1 } })).status);
          // A real payment of a real booking: refused for want of the right, with a body the owner's refund below also sends.
          const refund = await desk.post("/api/v1/payments/refunds", refundOf(paidOnline.attemptId));
          expect(refund.status, JSON.stringify(refund.body).slice(0, 300)).toBe(403);
          expect(REFUSED).toContain((await desk.post("/api/v1/exports", exportOf("customers"))).status);
        });
      });

      describe("a cancel by the studio (cQ28)", () => {
        it("the front desk, with no refund right, cancels inside the window and the deposit goes back by itself", async () => {
          ok(await desk.patch(`${stand.data("bookings")}/${String(paidSoon)}`, { values: { state: "cancelled", cancelled_by: "studio", cancel_reason: "Elin is ill" } }));
          const row = await stand.row("bookings", paidSoon);
          expect([row["state"], row["cancelled_by"], yes(row["late_cancel"])]).toEqual(["cancelled", "studio", false]);
          const refunds = await until(async () => {
            const panel = ok(await stand.staff.post<{ data: { payments: { refunds: { amount: string; source: string }[] }[] } }>("/api/v1/payments/panel", { connectionId: stand.connectionId, table: bookingsId, recordId: String(paidSoon) }));
            const made = panel.data.payments.flatMap((p) => p.refunds);
            return made.length > 0 ? made : undefined;
          }, "the refund made", 60_000);
          expect(refunds.length).toBe(1);
          expect(num(refunds[0]!.amount)).toBeGreaterThan(0);
        }, 90_000);
      });

      describe("the owner", () => {
        it("reads it all, and changes a price and a setting", async () => {
          expect((await read(owner, "bookings")).length).toBeGreaterThanOrEqual(all.length);
          const service = (await read(owner, "services")).find((s) => s["name"] === "Cut & Style")!;
          ok(await owner.patch(`${stand.data("services")}/${String(service["id"])}`, { values: { price: 79 } }));
          ok(await owner.patch(`${stand.data("services")}/${String(service["id"])}`, { values: { price: 78 } }));
          const settings = (await read(owner, "settings"))[0]!;
          ok(await owner.patch(`${stand.data("settings")}/${String(settings["id"])}`, { values: { tagline: "A calm roof" } }));
        });

        it("may do all of it to anyone's calendar", async () => {
          const marco = (await stand.rows("team")).find((t) => t["name"] === "Marco Bellini")!;
          const row = await connections(owner, marco["id"]);
          expect([row.may.sendLink, row.may.copyLink, row.may.connect, row.may.disconnect]).toEqual([true, true, true, true]);
        });

        it("exports, and gives a paid deposit back", async () => {
          expect((await owner.post("/api/v1/exports", exportOf("bookings"))).status).toBe(202);
          const refund = await owner.post("/api/v1/payments/refunds", refundOf(paidOnline.attemptId));
          // A rehearsal's refund stays in Adminium and never writes the row: the sample contract proves the rollup.
          expect(refund.status, JSON.stringify(refund.body).slice(0, 400)).toBe(200);
        }, 30_000);

        it("records cash at the studio past the deposit, and money given back counts against it (MON-1)", async () => {
          const cut = code("LMN-1864");
          const taken = ok(await owner.post<{ data: Row }>(stand.data("payments"), { values: { booking_id: cut["id"], kind: "taken", amount: 60, method: "cash", paid_at: new Date().toISOString() } }), 201).data;
          let row = await stand.row("bookings", cut["id"]);
          expect([num(row["paid"]), num(row["balance"]), num(row["pay_due"])]).toEqual([60, 0, 0]);
          const over = await owner.post(stand.data("payments"), { values: { booking_id: cut["id"], kind: "taken", amount: 1, method: "cash", paid_at: new Date().toISOString() } });
          expect(over.status).toBeGreaterThanOrEqual(400);
          ok(await owner.post(stand.data("payments"), { values: { booking_id: cut["id"], kind: "given_back", amount: 20, method: "cash", paid_at: new Date().toISOString() } }), 201);
          row = await stand.row("bookings", cut["id"]);
          expect([num(row["paid"]), num(row["refunded"]), num(row["balance"])]).toEqual([40, 20, 20]);
          expect(taken["method"]).toBe("cash");
        }, 60_000);

        it("may not change what a booking was sold as, or whether money is asked", async () => {
          const held = code("LMN-1899");
          for (const values of [{ service_id: code("LMN-1864")["service_id"] }, { ask_online: false }, { customer_id: code("LMN-1864")["customer_id"] }, { waitlist_id: 1 }]) {
            const refused = await owner.patch(`${stand.data("bookings")}/${String(held["id"])}`, { values });
            expect(refused.status, JSON.stringify(values)).toBeGreaterThanOrEqual(400);
          }
          const row = await stand.row("bookings", held["id"]);
          expect([row["state"], num(row["pay_due"])]).toEqual(["paying", 50]);
        }, 30_000);

        it("erases a person: the copies on their bookings go, and the sale's record stays (ACC-10)", async () => {
          const address = "robin.alvarez@example.com";
          expect((await stand.rows("bookings")).some((b) => b["email"] === address)).toBe(true);
          const erased = await owner.post("/api/v1/privacy/erase", { address, confirm: address });
          expect([200, 202], JSON.stringify(erased.body).slice(0, 500)).toContain(erased.status);
          await until(async () => ((await stand.rows("bookings")).some((b) => b["email"] === address) ? undefined : true), "the copies blanked", 60_000);
          expect((await stand.rows("purchases")).some((p) => p["buyer_email"] === address)).toBe(true);
        }, 90_000);

        it("still cannot open the calendar table, nor read a link's code", async () => {
          expect(REFUSED).toContain((await owner.get(`${stand.data("calendar_busy")}?limit=5`)).status);
          expect((await read(owner, "bookings")).some((b) => b["link_token"] !== undefined)).toBe(false);
        });
      });
    });
  });
});
