/**
 * THE DESK AGAINST A BUILT ADMINIUM, AS EACH ROLE (plan §7, K1–K10).
 *
 * Lumen with its sample at Tuesday 15 September 2026, 10:40, and the desk's own
 * door (`desk/adminiumDesk.ts`) booted on three staff sessions as the staff
 * build boots it: an owner's, a front desk's and a specialist's, each holding
 * that one role of the app.
 *
 * A hidden button is not a lock, so a refusal here is the server's: the door
 * makes the write, and the write fails.
 */
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { AdminiumDesk } from "../desk/adminiumDesk.ts";
import type { DeskData } from "../desk/door.ts";
import { clientFacts, guestFits, holdsLetGo, kindOf, movesOf, needsOf, ON_THE_DAY, startOf, type WaitFit } from "../desk/facts.ts";
import { dayIn } from "../desk/time.ts";
import { createSessionTransport } from "../desk/transport/sessionSource.ts";
import { loadStaffConfig } from "../desk/transport/staffConnection.ts";
import type { Row } from "../desk/wire.ts";
import { ADMINIUM_REPO, Caller, ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, type Engine } from "./harness.ts";
import { ADD_ONS, CLOCK, standUp, type Stand } from "./stand.ts";

const why = missing() ?? ADD_ONS.map((key) => missingAddOn(key)).find((reason) => reason !== null) ?? null;
if (why !== null && process.env["ADMINIUM_REQUIRE_CONTRACT"] === "1") throw new Error(`the desk contract must run here, and cannot: ${why}`);
vi.setConfig({ testTimeout: 60_000 });
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 5310) + 60;
const ZONE = "America/Los_Angeles";
/** Whether the built engine has ACC-5's read. Until the patch lands this test says so by skipping, and the row stays open. */
const DATA_ROUTES = join(ADMINIUM_REPO, "apps", "server", "dist", "routes", "data", "index.js");
const hasCapRead = existsSync(DATA_ROUTES) && readFileSync(DATA_ROUTES, "utf8").includes("public-cap-reached");
/** Whether it can attach the built-in demo calendar. Until it can, the clash tests say so by skipping, and SYN-6 stays open. */
const CALENDAR_ROUTES = join(ADMINIUM_REPO, "apps", "server", "dist", "routes", "calendar-sync", "index.js");
const hasDemoRoute = existsSync(CALENDAR_ROUTES) && readFileSync(CALENDAR_ROUTES, "utf8").includes("/calendar-sync/row/demo");
/** Whether a screens-only person may reach the calendar routes. Until they can, the tests that need it say so by skipping. */
const SCREENS_ONLY = join(ADMINIUM_REPO, "apps", "server", "dist", "apps", "screens-only.js");
const staffReachCalendars = existsSync(SCREENS_ONLY) && readFileSync(SCREENS_ONLY, "utf8").includes("/calendar-sync/clashes");
const pdt = (day: string, time: string) => new Date(`${day}T${time}:00-07:00`).toISOString();
const key = () => randomBytes(16).toString("hex");
const refused = async (work: () => Promise<unknown>) => {
  const error = await work().then(
    () => null,
    (e: unknown) => e as { status?: number },
  );
  expect(error, "the server should have refused this").not.toBeNull();
  expect([403, 404, 409, 422]).toContain(error?.status);
};

describe.skipIf(why !== null)(`the desk on a built Adminium${why === null ? "" : ` — skipped: ${why}`}`, () => {
  ENGINES.forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let stand: Stand;
      const doors = {} as Record<"owner" | "desk" | "noor", AdminiumDesk>;
      const data = {} as Record<"owner" | "desk" | "noor", DeskData>;
      const callers = {} as Record<"owner" | "desk" | "noor", Caller>;
      let noorTeam: Row;
      let seeded = 0;

      const doorFor = async (caller: Caller): Promise<AdminiumDesk> => {
        const cfg = await loadStaffConfig({ hostedStaff: true, base: "/apps/bookings/staff/", fetchImpl: caller.fetchAs() });
        if (cfg === null) throw new Error("no staff config");
        const transport = createSessionTransport({
          tableOfRef: cfg.tables,
          connectionId: cfg.connectionId ?? undefined,
          installId: cfg.installId,
          staff: { csrfToken: cfg.csrfToken, timezone: cfg.timezone, timezoneSource: cfg.timezoneSource, serverTimezone: cfg.serverTimezone, currency: cfg.currency },
          fetchImpl: caller.fetchAs(),
        });
        const said = cfg.now === undefined || cfg.now === null ? Number.NaN : Date.parse(cfg.now);
        return new AdminiumDesk(transport, cfg, { skew: Number.isNaN(said) ? 0 : said - Date.now() });
      };
      const member = async (role: RegExp, who: string): Promise<{ caller: Caller; id: string }> => {
        const roles = ok(await stand.staff.get<{ roles: { id: string; name: string; key?: string }[] }>("/api/v1/roles")).roles;
        const found = roles.find((r) => role.test(r.name) || role.test(r.key ?? ""));
        if (found === undefined) throw new Error(`no role ${String(role)}`);
        const email = `${who}.desk.${engine}@lumen-staff.dev`;
        const invited = ok(await stand.staff.post<{ user?: { id: string }; id?: string; invite: { token: string } }>("/api/v1/users", { email, name: who.replace(/^./, (c) => c.toUpperCase()), roleIds: [found.id] }), 201);
        const password = `${randomBytes(18).toString("base64url")}Aa1!`;
        ok(await new Caller(stand.server.base, { origin: stand.server.base }).post("/api/v1/auth/password/reset", { token: invited.invite.token, newPassword: password }));
        const caller = new Caller(stand.server.base, { origin: stand.server.base });
        await caller.signInToScreens(email, password, "bookings");
        const users = ok(await stand.staff.get<{ users: { id: string; email: string }[] }>("/api/v1/users")).users;
        return { caller, id: invited.user?.id ?? invited.id ?? users.find((u) => u.email === email)!.id };
      };
      const reload = async (who: "owner" | "desk" | "noor") => {
        data[who] = await doors[who].load();
        return data[who];
      };
      const code = (d: DeskData, c: string): Row => {
        const found = d.bookings.find((b) => b["code"] === c);
        if (found === undefined) throw new Error(`no booking ${c}`);
        return found;
      };
      const serviceNamed = (d: DeskData, name: string) => d.services.find((s) => s["name"] === name)!;
      const personNamed = (d: DeskData, name: string) => d.team.find((p) => p["name"] === name)!;

      beforeAll(async () => {
        stand = await standUp(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, "desk");
        const owner = await member(/^owner$/i, "selma");
        const desk = await member(/front/i, "jun");
        const noor = await member(/specialist/i, "noor");
        noorTeam = (await stand.rows("team")).find((t) => t["name"] === "Noor Haddad") as Row;
        await stand.patch("team", noorTeam["id"], { user_id: noor.id, email: `noor.desk.${engine}@lumen-staff.dev` });
        callers.owner = owner.caller;
        callers.desk = desk.caller;
        callers.noor = noor.caller;
        // A sample cannot bring Forms' reviews (T12), and only a customer can leave one: signed in, on their own visits.
        const rows = await stand.rows("bookings");
        const done = rows.filter((b) => b["state"] === "done" && (b["reviewed_at"] === null || b["reviewed_at"] === undefined));
        const customers = await stand.rows("customers");
        const most = customers
          .map((c) => ({ c, visits: done.filter((b) => String(b["customer_id"]) === String(c["id"])) }))
          .sort((x, y) => y.visits.length - x.visits.length)
          .slice(0, 2);
        const signedIn = Object.keys(stand.refs).filter((r) => r.startsWith("bookings_bookings") && JSON.stringify(stand.refs[r]?.["actions"] ?? []) === '["read"]').sort((x, y) => x.length - y.length || x.localeCompare(y))[0]!;
        for (const { c, visits } of most) {
          const tab = stand.guest("studio");
          await tab.signIn(stand.server, String(c["email"]));
          for (const [i, visit] of visits.slice(0, 3).entries()) {
            const sent = await tab.raw("POST", `/api/v1/public/records/${signedIn}/${String(visit["id"])}/review`, { stars: (i % 5) + 1, body: `Review ${String(seeded)}` });
            if (sent.status !== 201) throw new Error(`leaving a review: ${String(sent.status)} ${JSON.stringify(sent.body).slice(0, 400)}`);
            seeded += 1;
          }
        }
        doors.owner = await doorFor(owner.caller);
        doors.desk = await doorFor(desk.caller);
        doors.noor = await doorFor(noor.caller);
        await Promise.all([reload("owner"), reload("desk"), reload("noor")]);
      }, 900_000);

      afterAll(async () => {
        await stand?.server.stop();
      });

      // ── K1 Today ──

      it("Today lists the sample's twelve bookings, each in its state at 10:40", () => {
        const today = dayIn(CLOCK, ZONE);
        const rows = data.desk.bookings.filter((b) => ON_THE_DAY.includes(String(b["state"])) && dayIn(startOf(b), ZONE) === today);
        expect(rows).toHaveLength(12);
        const kinds = rows.map((b) => kindOf(b, CLOCK, ZONE));
        expect(kinds.filter((k) => k === "soon")).toHaveLength(2);
        expect(kinds.filter((k) => k === "arrived")).toHaveLength(2);
        expect(kinds.filter((k) => k === "paying")).toHaveLength(1);
        expect(kinds.filter((k) => k === "no_show")).toHaveLength(1);
        expect(kinds.filter((k) => k === "done")).toHaveLength(1);
      });

      it("Needs you counts the paying booking and the reviews, and only the owner gets the first-run and late-money rows", () => {
        const needs = needsOf(data.desk, doors.desk.who(), CLOCK, ZONE, {});
        expect(needs.filter((n) => n.kind === "paying")).toHaveLength(1);
        const reviews = needs.find((n) => n.kind === "reviews");
        expect(seeded).toBeGreaterThanOrEqual(3);
        expect(reviews?.kind === "reviews" ? reviews.count : 0).toBe(seeded);
        expect(needs.some((n) => n.kind === "lateMoney")).toBe(false);
        // A specialist has no money line and no paying row.
        expect(needsOf(data.noor, doors.noor.who(), CLOCK, ZONE, {}).some((n) => n.kind === "paying")).toBe(false);
      });

      it.skipIf(!hasCapRead)(`the hourly-limit row reads the engine's count, and tells a specialist nothing (ACC-5)${hasCapRead ? "" : " — skipped: this engine has no public-cap-reached read yet"}`, () => {
        expect(data.owner.capReached).toBe(0);
        expect(data.desk.capReached).toBe(0);
        expect(data.noor.capReached).toBe(0);
        expect(needsOf({ ...data.desk, capReached: 2 }, doors.desk.who(), CLOCK, ZONE, {}).some((n) => n.kind === "limit")).toBe(true);
        expect(needsOf({ ...data.noor, capReached: 2 }, doors.noor.who(), CLOCK, ZONE, {}).some((n) => n.kind === "limit")).toBe(false);
      });

      // ── who reads what ──

      it("the specialist reads only their own bookings, with no money and no way to reach the customer", () => {
        expect(data.noor.bookings.length).toBeGreaterThan(0);
        for (const booking of data.noor.bookings) {
          expect(String(booking["team_id"])).toBe(String(noorTeam["id"]));
          for (const hidden of ["price", "paid", "pay_due", "email", "phone", "deposit"]) expect(booking).not.toHaveProperty(hidden);
        }
        expect(data.noor.payments).toEqual([]);
        expect(data.noor.messages).toEqual([]);
        expect(data.noor.waitlist).toEqual([]);
        expect(data.noor.team).toHaveLength(1);
      });

      it("the front desk reads prices and what was paid (cQ24)", () => {
        const booking = code(data.desk, "LMN-1706");
        expect(Number(booking["price"])).toBe(190);
        expect(Number(booking["paid"])).toBe(50);
        expect(booking["email"]).toBeTruthy();
      });

      it("the money a panel offers follows the role: only the owner may refund", () => {
        const booking = code(data.owner, "LMN-1706");
        const asOwner = movesOf(booking, doors.owner.who(), CLOCK, ZONE, doors.owner.payments()?.refund === true);
        const asDesk = movesOf(code(data.desk, "LMN-1706"), doors.desk.who(), CLOCK, ZONE, doors.desk.payments()?.refund === true);
        expect(asDesk.refund).toBe(false);
        expect(doors.owner.payments()?.refund === true ? asOwner.refund : true).toBe(true);
      });

      // ── K3 the moves ──

      it("a specialist marks their own visit and is refused a colleague's", async () => {
        const mine = data.noor.bookings.find((b) => b["state"] === "booked" && dayIn(startOf(b), ZONE) === dayIn(CLOCK, ZONE));
        expect(mine).toBeDefined();
        await doors.noor.moveBooking(mine!, "arrived");
        const after = await reload("noor");
        expect(after.bookings.find((b) => b.id === mine!.id)?.["state"]).toBe("arrived");
        const other = data.desk.bookings.find((b) => String(b["team_id"]) !== String(noorTeam["id"]) && b["state"] === "booked")!;
        await refused(() => doors.noor.moveBooking(other, "arrived"));
      });

      it("a specialist cannot cancel, move, or change a price", async () => {
        const mine = (await reload("noor")).bookings.find((b) => b["state"] === "booked")!;
        await refused(() => doors.noor.moveBooking(mine, "cancelled", { cancelled_by: "studio", cancel_reason: "No." }));
        await refused(() => doors.noor.saveBooking(mine, { starts_at: pdt("2026-09-24", "12:00") }));
        const service = data.noor.services[0]!;
        await refused(() => doors.noor.saveService(service, { price: "1.00" }));
      });

      it("the front desk books a walk-up from the staff free times, past the guests' notice", async () => {
        const fresh = await reload("desk");
        const gel = serviceNamed(fresh, "Gel Manicure");
        const slots = await doors.desk.slots({ service: gel.id, person: null, day: "2026-09-15" });
        // The desk is offered 11 AM; a guest's 2 hours of notice would start at 3 PM (K4's check).
        expect(slots.find((s) => s.state === "free")?.time).toBe("11:00");
        const customer = fresh.customers.find((c) => c["name"] === "Ava Reyes")!;
        const made = await doors.desk.createBooking({
          service: gel.id,
          person: null,
          startsAt: pdt("2026-09-15", "11:00"),
          customer: { id: customer.id, name: String(customer["name"]), email: String(customer["email"]), phone: null },
          depositLink: false,
          key: key(),
        });
        expect(made["state"]).toBe("booked");
        expect(made["picked_by_anyone"]).toBeTruthy();
        expect(made["team_id"]).toBeTruthy();
      });

      it("a retried press with one key books once (cT18)", async () => {
        const fresh = await reload("desk");
        const service = serviceNamed(fresh, "Classic Manicure");
        const customer = fresh.customers.find((c) => c["name"] === "Lucia Moss")!;
        const free = (await doors.desk.slots({ service: service.id, person: null, day: "2026-09-29" })).find((slot) => slot.state === "free");
        expect(free, "a free time on Tue 29 Sep").toBeDefined();
        const input = { service: service.id, person: null, startsAt: pdt("2026-09-29", free!.time), customer: { id: customer.id, name: String(customer["name"]), email: String(customer["email"]), phone: null }, depositLink: false, key: key() };
        const first = await doors.desk.createBooking(input);
        const second = await doors.desk.createBooking(input).catch((e: unknown) => e as { status?: number });
        expect((second as Row).id).toBe(first.id);
        const rows = (await reload("desk")).bookings.filter((b) => b["customer_id"] === customer.id && startOf(b) === Date.parse(input.startsAt));
        expect(rows).toHaveLength(1);
      });

      it("the front desk moves a booking before it starts, and a started visit keeps its person (BOOK-15.3)", async () => {
        const fresh = await reload("desk");
        const ahead = fresh.bookings.find((b) => b["state"] === "booked" && startOf(b) > Date.parse("2026-09-21T00:00:00Z") && b["picked_by_anyone"] !== true)!;
        const service = ahead["service_id"] as string;
        const day = dayIn(startOf(ahead), ZONE);
        const slots = await doors.desk.slots({ service, person: ahead["team_id"] as string, day, exclude: ahead.id });
        const free = slots.find((s) => s.state === "free" && pdt(day, s.time) !== new Date(startOf(ahead)).toISOString());
        expect(free).toBeDefined();
        const moved = await doors.desk.saveBooking(ahead, { starts_at: pdt(day, free!.time), team_id: ahead["team_id"] });
        expect(new Date(String(moved["starts_at"])).toISOString()).toBe(pdt(day, free!.time));

        const started = fresh.bookings.find((b) => b["state"] === "arrived" && startOf(b) < CLOCK)!;
        expect(movesOf(started, doors.desk.who(), CLOCK, ZONE, false).move).toBe(false);
        const other = fresh.team.find((p) => String(p.id) !== String(started["team_id"]))!;
        await refused(() => doors.desk.saveBooking(started, { team_id: other.id }));
      });

      it("the studio's cancel needs a reason and is the studio's", async () => {
        const fresh = await reload("desk");
        const ahead = fresh.bookings.find((b) => b["state"] === "booked" && startOf(b) > Date.parse("2026-09-25T00:00:00Z") && Number(b["paid"] ?? 0) === 0)!;
        await refused(() => doors.desk.moveBooking(ahead, "cancelled", { cancelled_by: "studio" }));
        const done = await doors.desk.moveBooking(ahead, "cancelled", { cancelled_by: "studio", cancel_reason: "The studio is closed for repairs." });
        expect(done["state"]).toBe("cancelled");
        expect(done["late_cancel"] ?? null).toBeFalsy();
      });

      // ── "Let the time go" (MON-6) ──

      it("the front desk lets a held time go, and no one can cancel it while it is being paid", async () => {
        const fresh = await reload("desk");
        const paying = fresh.bookings.find((b) => b["state"] === "paying")!;
        const moves = movesOf(paying, doors.desk.who(), CLOCK, ZONE, false);
        expect(moves.letGo).toBe(true);
        expect(moves.cancel).toBe(false);
        await refused(() => doors.desk.moveBooking(paying, "cancelled", { cancelled_by: "studio", cancel_reason: "No." }));
        const gone = await doors.desk.moveBooking(paying, "lapsed", { lapsed_by: "desk" });
        expect(gone["state"]).toBe("lapsed");
        expect(gone["lapsed_by"]).toBe("desk");
      });

      it("counts only holds the clock let go in the last hour (MON-7)", () => {
        const at = CLOCK;
        const rows = [
          { id: 1, state: "lapsed", lapsed_by: "time", pay_until: new Date(at - 10 * 60_000).toISOString() },
          { id: 2, state: "lapsed", lapsed_by: "time", link_until: new Date(at - 30 * 60_000).toISOString() },
          { id: 3, state: "lapsed", lapsed_by: "desk", pay_until: new Date(at - 10 * 60_000).toISOString() },
          { id: 4, state: "lapsed", lapsed_by: "time", pay_until: new Date(at - 2 * 3_600_000).toISOString() },
        ];
        expect(holdsLetGo(rows, at)).toBe(2);
      });

      // ── K5 ──

      it("a client's figures come from the whole table, and a note saves as the front desk", async () => {
        const fresh = await reload("desk");
        const lucia = fresh.customers.find((c) => c["name"] === "Lucia Moss")!;
        expect(clientFacts(fresh.bookings, lucia.id).visits).toBeGreaterThanOrEqual(3);
        await doors.desk.saveCustomer(lucia, { staff_note: "Prefers mornings." });
        expect((await reload("desk")).customers.find((c) => c.id === lucia.id)?.["staff_note"]).toBe("Prefers mornings.");
      });

      // ── K6 ──

      it("only the owner changes a service or the team's order", async () => {
        const fresh = await reload("owner");
        const service = serviceNamed(fresh, "Cut & Style");
        await refused(() => doors.desk.saveService(service, { price: "1.00" }));
        const saved = await doors.owner.saveService(service, { price: "80.00" });
        expect(Number(saved["price"])).toBe(80);
        const ivy = personNamed(fresh, "Ivy Chen");
        await refused(() => doors.desk.saveTeam(ivy, { position: 99 }));
        const moved = await doors.owner.saveTeam(ivy, { position: Number(ivy["position"]) });
        expect(moved.id).toBe(ivy.id);
      });

      // ── K7 ──

      it("a specialist adds and removes only their own time off", async () => {
        const made = await doors.noor.addTimeOff({ team_id: noorTeam["id"] as string, starts_at: pdt("2026-10-06", "09:00"), ends_at: pdt("2026-10-06", "10:00"), why: "Dentist" });
        await doors.noor.removeTimeOff(made);
        const other = (await reload("desk")).team.find((p) => String(p.id) !== String(noorTeam["id"]))!;
        await refused(() => doors.noor.addTimeOff({ team_id: other.id as string, starts_at: pdt("2026-10-06", "09:00"), ends_at: pdt("2026-10-06", "10:00"), why: null }));
      });

      it("what each role may do with a calendar is the server's answer for that row (cQ12)", async () => {
        const id = String(noorTeam["id"]);
        const asOwner = (await reload("owner")).calendars[id]!;
        expect(asOwner.may).toMatchObject({ connect: true, sendLink: true, copyLink: true, disconnect: true });
        const asDesk = (await reload("desk")).calendars[id]!;
        expect(asDesk.may).toMatchObject({ connect: false, sendLink: true, copyLink: false, disconnect: false });
        const asNoor = (await reload("noor")).calendars[id]!;
        expect(asNoor.may).toMatchObject({ connect: true, sendLink: false, copyLink: false, disconnect: true });
        expect(Object.keys(data.noor.calendars)).toEqual([id]);
      });

      it("the front desk sends a connect link and cannot copy one; a specialist reaches no colleague's row", async () => {
        const fresh = await reload("desk");
        await refused(() => doors.desk.copyConnectLink(noorTeam["id"] as string));
        const other = fresh.team.find((p) => String(p.id) !== String(noorTeam["id"]))!;
        await refused(() => doors.noor.sendConnectLink(other.id));
        await refused(() => doors.noor.connectCalendar(other.id, "calendar-google"));
        await refused(() => doors.noor.syncNow(other.id));
      });

      it.skipIf(!staffReachCalendars)(`the private feed link is shown only to its own person; the front desk reaches neither (A5)${staffReachCalendars ? "" : " — skipped: screens-only staff cannot reach the calendar routes on this engine"}`, async () => {
        const own = await doors.noor.feedLink(noorTeam["id"] as string);
        expect(own?.own).toBe(true);
        const asOwner = await doors.owner.feedLink(noorTeam["id"] as string);
        expect(asOwner).toMatchObject({ link: null, own: false });
        expect(await doors.desk.feedLink(noorTeam["id"] as string)).toBeNull();
      });

      it.skipIf(!hasDemoRoute || !staffReachCalendars)(`one clash raises one row, "Keep it" holds until the overlap changes (SYN-6)${hasDemoRoute && staffReachCalendars ? "" : " — skipped: this engine cannot attach a demo calendar, or screens-only staff cannot reach its routes"}`, async () => {
        const schema = ok(await stand.staff.get<{ model: { tables: { id: string; name: string }[] } }>(`/api/v1/connections/${stand.connectionId}/schema`));
        const teamTable = schema.model.tables.find((t) => t.name === "bookings_team")!.id;
        // The sync reads one account at most every 15 seconds: the clock moves on, and the block is checked, so a read that
        // was skipped cannot pass for a clash that stayed the same.
        const attach = async (busy: [string, string][]) => {
          await stand.server.setClock((await doorFor(callers.owner)).now() + 20_000);
          const reply = await callers.owner.post("/api/v1/calendar-sync/row/demo", {
            connection: stand.connectionId,
            table: teamTable,
            row: String(noorTeam["id"]),
            busy: busy.map(([start, end]) => ({ start: pdt("2026-09-17", start), end: pdt("2026-09-17", end) })),
          });
          doors.desk = await doorFor(callers.desk);
          const blocks = await doors.desk.busy(noorTeam["id"] as string, "2026-09-17", "2026-09-18");
          expect(blocks).toContainEqual({ start: Date.parse(pdt("2026-09-17", busy[0]![0])), end: Date.parse(pdt("2026-09-17", busy[0]![1])) });
          return reply;
        };
        // The sample's own busy row (Noor, 9–11 AM) already sits over Lucia's 10 AM, and stays whatever this calendar says.
        ok(await attach([["12:00", "13:00"]]));
        doors.noor = await doorFor(callers.noor);
        const before = await reload("desk");
        const lucia = code(before, "LMN-1779");
        const kenji = code(before, "LMN-1850");
        const of = (d: DeskData, row: Row) => (d.clashes ?? []).filter((c) => String(c.row) === String(row.id));
        expect(of(before, lucia)).toHaveLength(1);
        expect(of(before, lucia)[0]!.block).toEqual({ start: Date.parse(pdt("2026-09-17", "09:00")), end: Date.parse(pdt("2026-09-17", "11:00")) });
        expect(needsOf(before, doors.desk.who(), CLOCK, ZONE, {}).filter((n) => n.kind === "clash" && String(n.booking.id) === String(lucia.id))).toHaveLength(1);
        expect(of(await reload("noor"), lucia)).toHaveLength(1);
        expect(before.calendars[String(noorTeam["id"])]?.accounts[0]?.state).toBe("connected");

        await doors.desk.keepClash(of(before, lucia)[0]!);
        const kept = await reload("desk");
        expect(of(kept, lucia)[0]?.kept).toBe(true);
        expect(needsOf(kept, doors.desk.who(), CLOCK, ZONE, {}).some((n) => n.kind === "clash" && String(n.booking.id) === String(lucia.id))).toBe(false);

        // Kenji's 12:30–1:30 PM: the busy time covers its first half.
        expect(of(kept, kenji)).toHaveLength(1);
        await doors.desk.keepClash(of(kept, kenji)[0]!);
        // A longer busy time over the same part of the booking is the same clash: it stays kept.
        ok(await attach([["11:45", "13:00"]]));
        expect(of(await reload("desk"), kenji)[0]?.kept).toBe(true);
        // A changed overlap is a new clash, and it is raised again.
        ok(await attach([["12:00", "14:00"]]));
        const raised = of(await reload("desk"), kenji);
        expect(raised).toHaveLength(1);
        expect(raised[0]!.kept).toBe(false);
      });

      // ── K8 ──

      it("a waiting guest is offered only a time a guest could book, and the entry reads Offered (cQ33)", async () => {
        const fresh = await reload("desk");
        const theo = fresh.waitlist.find((e) => e["name"] === "Theo Kim")!;
        const slots = await doors.desk.slots({ service: theo["service_id"] as string, person: (theo["team_id"] as string | null) ?? null, day: String(theo["day"]).slice(0, 10) });
        const fits: WaitFit[] = guestFits(slots, theo, fresh, CLOCK, ZONE);
        expect(fits.map((f) => f.clock)).toContain("10:00");
        // Inside the notice: nothing is offered, whatever the staff times say.
        const today = { ...theo, day: "2026-09-15" };
        const soon = guestFits([{ time: "11:00", state: "free", resource: fits[0]!.person }], today, fresh, CLOCK, ZONE);
        expect(soon).toEqual([]);
        const made = await doors.desk.offerTime({ entry: theo, person: fits.find((f) => f.clock === "10:00")!.person, startsAt: pdt(String(theo["day"]).slice(0, 10), "10:00"), key: key() });
        expect(made["state"]).toBe("offered");
        expect((await reload("desk")).waitlist.find((e) => e.id === theo.id)?.["state"]).toBe("offered");
      });

      // ── K9 ──

      it("only the owner moderates a review, and hiding needs one of the five reasons", async () => {
        const fresh = await reload("owner");
        expect(doors.owner.moderates()).toBe(true);
        expect(doors.desk.moderates()).toBe(false);
        const waiting = fresh.reviews!.reviews.filter((r) => r["state"] === "waiting");
        await refused(() => doors.desk.saveReview(waiting[0]!, { state: "published" }));
        const published = await doors.owner.saveReview(waiting[0]!, { state: "published" });
        expect(published["state"]).toBe("published");
        const hidden = await doors.owner.saveReview(waiting[1]!, { state: "hidden", hide_reason: "names-someone" });
        expect(hidden["hide_reason"]).toBe("names-someone");
        await refused(() => doors.owner.saveReview(waiting[2]!, { state: "hidden", hide_reason: "low-rating" }));
      });

      // ── K10 ──

      it("only the owner saves settings", async () => {
        const fresh = await reload("owner");
        await refused(() => doors.desk.saveSettings(fresh.settings!, { hold_min: 20 }));
        const saved = await doors.owner.saveSettings(fresh.settings!, { hold_min: 20 });
        expect(Number(saved["hold_min"])).toBe(20);
        await doors.owner.saveSettings(saved, { hold_min: 15 });
      });

      it("a person with no privacy grant is told who manages the websites (EMB-12)", async () => {
        expect(await doors.desk.embeds()).toBeNull();
        expect(await doors.owner.embeds()).toBeNull();
      });
    });
  });
});
