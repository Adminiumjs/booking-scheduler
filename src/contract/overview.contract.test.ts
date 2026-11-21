/**
 * LUMEN'S OVERVIEW, READ THE WAY ITS PAGE READS IT.
 *
 * On each engine: the app with Forms and Offers, its sample added at Tuesday
 * 15 September 2026, 10:40. Every card of the page that ships is asked for its
 * figure through the widget route, as the owner, and answers what `figures.md`
 * says. The free times, the "Anyone" picks and the clash are the engine's own
 * answers over the sample's eight busy times (MOD-12).
 *
 * The front desk and the specialists hold no console page: the team's figures
 * are refused to a person a row limit holds.
 */
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Caller, ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, type Engine } from "./harness.ts";
import { ADD_ONS, ADMIN, num, PREFIX, retryKey, standUp, type Row, type Stand } from "./stand.ts";
import { OVERVIEW_LAYOUT } from "../manifest/overview.ts";
import { WORLD } from "../sample/lumen.ts";

const why = missing() ?? ADD_ONS.map((key) => missingAddOn(key)).find((reason) => reason !== null) ?? null;
if (why !== null && process.env["ADMINIUM_REQUIRE_CONTRACT"] === "1") throw new Error(`the Overview contract must run here, and cannot: ${why}`);
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 5310) + 50;

const FIGURES = readFileSync(new URL("../sample/figures.md", import.meta.url), "utf8");
const figure = (name: string): string => {
  const line = FIGURES.split("\n").find((l) => l.startsWith(`| ${name} |`));
  if (line === undefined) throw new Error(`no figure "${name}"`);
  return line.split(" | ")[1]!;
};
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const pdt = (day: string, time: string) => new Date(`${day}T${time}:00-07:00`).toISOString();

type Binding = Record<string, unknown> & { source: { name: string; addOn?: string; type?: string } };
type Card = { i: string; config: { binding: Binding } };
const CARDS = OVERVIEW_LAYOUT.items as unknown as Card[];
interface Item {
  key: string;
  label?: string;
  value: number;
}

describe.skipIf(why !== null)(`Lumen's Overview${why === null ? "" : ` — skipped: ${why}`}`, () => {
  ENGINES.forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let stand: Stand;
      let owner: Caller;
      let desk: Caller;
      let noor: Caller;

      const descriptor = (id: string) => {
        const binding = CARDS.find((c) => c.i === id)!.config.binding;
        const source = binding.source.addOn === undefined ? { ...binding.source, name: `${PREFIX}${binding.source.name}` } : binding.source;
        return { ...binding, source, connectionId: stand.connectionId };
      };
      const asked = (who: Caller, id: string) => who.post<{ result: { value?: number | null; items?: Item[]; rows?: Row[] } & Record<string, unknown> }>("/api/v1/widget-data/query", { descriptor: descriptor(id) });
      const value = async (id: string) => {
        const reply = await asked(owner, id);
        expect(reply.status, `${id}: ${JSON.stringify(reply.body).slice(0, 500)}`).toBe(200);
        return num(reply.body.result.value ?? 0);
      };
      const items = async (id: string) => {
        const reply = await asked(owner, id);
        expect(reply.status, `${id}: ${JSON.stringify(reply.body).slice(0, 500)}`).toBe(200);
        return reply.body.result.items ?? [];
      };
      const byLabel = (list: Item[]) => Object.fromEntries(list.map((i) => [i.label ?? i.key, num(i.value)]));

      const member = async (role: RegExp, who: string): Promise<{ caller: Caller; id: string }> => {
        const roles = ok(await stand.staff.get<{ roles: { id: string; name: string; key?: string }[] }>("/api/v1/roles")).roles;
        const found = roles.find((r) => role.test(r.name) || role.test(r.key ?? ""))!;
        const email = `${who}.${engine}@lumen-staff.dev`;
        const invited = ok(await stand.staff.post<{ user?: { id: string }; id?: string; invite: { token: string } }>("/api/v1/users", { email, name: who, roleIds: [found.id] }), 201);
        const password = `${randomBytes(18).toString("base64url")}Aa1!`;
        ok(await new Caller(stand.server.base, { origin: stand.server.base }).post("/api/v1/auth/password/reset", { token: invited.invite.token, newPassword: password }));
        const caller = new Caller(stand.server.base, { origin: stand.server.base });
        if (role.test("owner")) await caller.signIn(email, password);
        else await caller.signInToScreens(email, password, "bookings");
        const users = ok(await stand.staff.get<{ users: { id: string; email: string }[] }>("/api/v1/users")).users;
        return { caller, id: invited.user?.id ?? invited.id ?? users.find((u) => u.email === email)!.id };
      };

      beforeAll(async () => {
        stand = await standUp(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, "overview");
        owner = (await member(/^owner$/i, "selma")).caller;
        desk = (await member(/front/i, "jun")).caller;
        const specialist = await member(/specialist/i, "noor");
        noor = specialist.caller;
        const row = (await stand.rows("team")).find((t) => t["name"] === "Noor Haddad")!;
        await stand.patch("team", row["id"], { user_id: specialist.id });
      }, 900_000);

      afterAll(async () => {
        await stand?.server.stop();
      });

      it("shows the last 4 weeks", async () => {
        expect(await value("visits-done")).toBe(Number(figure("Visits done, last 28 days")));
        expect(money(await value("visits-worth"))).toBe(figure("Value of visits done, last 28 days (price list)"));
        expect(await value("missed")).toBe(Number(figure("No-shows, last 28 days")) + Number(figure("Late cancellations, last 28 days")));
      });

      it("shows today, by state", async () => {
        expect(await value("today")).toBe(Number(figure("Today, counted bookings")));
        const states = byLabel(await items("today-by-state"));
        const said = Object.fromEntries(figure("Today by state").split(" · ").map((part) => part.split(" ") as [string, string]));
        expect(Object.values(states).reduce((a, b) => a + b, 0)).toBe(12);
        expect(Object.values(states).sort()).toEqual(Object.values(said).map(Number).filter((n) => n > 0).sort());
      });

      it("shows each person's chair time", async () => {
        const list = await items("chair-time");
        const shares = Object.fromEntries(list.map((i) => [String(i.label).split(" ")[0]!, Math.round(num(i.value) * 100)]));
        const said = Object.fromEntries(figure("Chair time booked, last 28 days (Tue 18 Aug – Mon 14 Sep)").split(" · ").map((part) => {
          const [name, share] = part.split(" ");
          return [name!, Number(share!.replace("%", ""))];
        }));
        expect(shares).toEqual(said);
      });

      it("shows the four weeks, each ending a week before the next", async () => {
        for (const [card, label] of [["week-1", "Tue 8 Sep"], ["week-2", "Tue 1 Sep"], ["week-3", "Tue 25 Aug"], ["week-4", "Tue 18 Aug"]] as const) {
          expect(`${String(await value(`${card}-visits`))} visits · ${money(await value(`${card}-worth`))}`).toBe(figure(`Week from ${label}`));
        }
      });

      it("shows where bookings came from, and who \"Anyone\" went to", async () => {
        const sources = Object.values(byLabel(await items("sources"))).sort((a, b) => b - a);
        expect(sources).toEqual([153, 109, 67]);
        expect(figure("Booked through (last 28 days, counted)")).toBe("your website (embed) 153 · booking page 109 · front desk 67");
        const people = byLabel(await items("anyone-people"));
        const first = (name: string) => Object.entries(people).find(([label]) => label.startsWith(name))?.[1];
        for (const [pool, names] of [["hair (Cut & Style, Gloss & Tone, Root Color)", ["Elin", "Rafa"]], ["massage (Deep-Tissue)", ["Noor", "Marco"]], ["nails", ["Ivy", "June"]]] as const) {
          expect(names.map((n) => `${n} ${String(first(n))}`).join(" · ")).toBe(figure(`'Anyone' shared, ${pool}`));
        }
        expect(byLabel(await items("anyone-pools"))).toMatchObject({ Hair: 70, Nails: 60 });
      });

      it("shows the deposits held, and who is paying now", async () => {
        const [held, sum] = figure("Deposits held for upcoming visits").split(" · ");
        expect(await value("deposits-count")).toBe(Number(held));
        expect(money(await value("deposits"))).toBe(sum);
        const paying = ok(await asked(owner, "being-paid")).result;
        expect((paying.rows ?? []).map((r) => r["code"])).toEqual(["LMN-1899"]);
      });

      it("shows the review requests and the gift cards the app's own rows hold", async () => {
        expect(await value("requests-sent")).toBe(Number(figure("Review requests sent (all time)")));
        expect(await value("requests-no")).toBe(Number(figure("Not asked (said no to review e-mails)")));
        expect(money(await value("gift-sold"))).toBe(figure("Gift cards sold online").split(" · ")[1]);
      });

      it("reads Forms' and Offers' own tables, which no sample fills", async () => {
        expect(await value("reviews-to-read")).toBe(0);
        expect(await value("gift-unspent")).toBe(0);
      });

      it("counts the team's calendars: nobody has signed in to one in a sample", async () => {
        const counts = byLabel(await items("calendars"));
        expect(Object.entries(counts).filter(([, n]) => n > 0).map(([, n]) => n)).toEqual([6]);
      });

      it("answers the free times and the \"Anyone\" picks over the sample's busy times", async () => {
        const services = Object.fromEntries((await stand.rows("services")).map((s) => [String(s["name"]), s["id"]]));
        const team = Object.fromEntries((await stand.rows("team")).map((t) => [String(t["name"]).split(" ")[0]!, t["id"]]));
        const availability = Object.keys(stand.refs).find((r) => stand.refs[r]?.["kind"] === "availability")!;
        const free = async (service: string, day: string, who: string) => {
          const resource = who === "anyone" ? "any" : String(team[who]);
          const reply = await stand.guest("studio").raw("GET", `/api/v1/public/availability/${availability}?kind=${String(services[service])}&resource=${resource}&date=${day}`);
          expect(reply.status, JSON.stringify(reply.body).slice(0, 300)).toBe(200);
          return (reply.body.data as unknown as { state: string }[]).filter((t) => t.state === "free").length;
        };
        for (const [service, day, who, label] of [
          ["Gel Manicure", "2026-09-17", "anyone", "Thu 17 Sep, anyone"],
          ["Cut & Style", "2026-09-19", "anyone", "Sat 19 Sep, anyone"],
          ["Deep-Tissue Massage", "2026-09-16", "anyone", "Wed 16 Sep, anyone"],
          ["Balayage", "2026-09-19", "Elin", "Sat 19 Sep, Elin"],
          ["Signature Facial", "2026-09-15", "Noor", "Tue 15 Sep, Noor"],
        ] as const) {
          expect(`${service}: ${String(await free(service, day, who))}`).toBe(`${service}: ${figure(`Free times, ${service}, ${label}`).split(":")[0]!}`);
        }
        const strip = figure("Gel Manicure, anyone: free starts per day from today").split(" · ");
        const reply = await stand.guest("studio").raw("GET", `/api/v1/public/availability/${availability}?kind=${String(services["Gel Manicure"])}&resource=any&from=2026-09-15&days=14`);
        expect(reply.status).toBe(200);
        const days = reply.body.data as unknown as { state: string; open: number }[];
        expect(days.map((d) => (d.state === "closed" ? "closed" : String(d.open)))).toEqual(strip.map((part) => part.split(" ").pop()));
        for (const [service, at, name] of [
          ["Gel Manicure", pdt("2026-09-17", "10:00"), "'Anyone' for Gel Manicure Thu 17 Sep 10 AM"],
          ["Cut & Style", pdt("2026-09-19", "10:00"), "'Anyone' for Cut & Style Sat 19 Sep 10 AM"],
          ["Deep-Tissue Massage", pdt("2026-09-16", "10:30"), "'Anyone' for Deep-Tissue Massage Wed 16 Sep 10:30 AM"],
        ] as const) {
          const made = ok(await stand.staff.post<{ data: Row }>(stand.data("bookings"), { values: { service_id: services[service], name: "Anyone Check", starts_at: at }, clientKey: retryKey("pick") }), 201).data;
          const person = (await stand.rows("team")).find((t) => String(t["id"]) === String(made["team_id"]))!;
          expect([service, person["name"]]).toEqual([service, figure(name)]);
          await stand.patch("bookings", made["id"], { state: "cancelled", cancelled_by: "studio", cancel_reason: "A check" });
        }
      }, 120_000);

      it("holds the one overlap the clash story is, which the desk is told of once that person's calendar is connected", async () => {
        const noorId = (await stand.rows("team")).find((t) => t["name"] === "Noor Haddad")!["id"];
        // The table is closed to every reader, the operator too: the rows are the sample's own, and the free times above read them.
        const teamIds = Object.fromEntries((await stand.rows("team")).map((t) => [String(t["name"]).split(" ")[0]!.toLowerCase(), String(t["id"])]));
        const dayOf = (offset: number) => new Date(Date.UTC(2026, 8, 15 + offset)).toISOString().slice(0, 10);
        const busy = WORLD.demoOnly.busy.map((b) => ({ team: teamIds[b.team]!, from: Date.parse(pdt(dayOf(b.day), b.from)), to: Date.parse(pdt(dayOf(b.day), b.to)) }));
        expect(busy.length).toBe(8);
        expect((await stand.rows("calendar_busy")).length).toBe(0);
        const now = Date.parse("2026-09-15T17:40:00Z");
        const over = (await stand.rows("bookings"))
          .filter((b) => ["booked", "paying"].includes(String(b["state"])) && b["code"] !== null)
          .filter((b) => {
            // (SQLite and MySQL answer a moment without a zone, on the server's own clock: `Date` reads it the same way.)
            const from = new Date(String(b["starts_at"])).getTime();
            const to = from + num(b["minutes"]) * 60_000;
            return to > now && busy.some((x) => x.team === String(b["team_id"]) && x.from < to && from < x.to);
          })
          .map((b) => [b["code"], String(b["team_id"])]);
        expect(over).toEqual([[figure("Calendar clash").split(" ")[0], String(noorId)]]);
        // A sample signs in to nobody's calendar, so the desk's own list of clashes starts empty.
        const schema = ok(await stand.staff.get<{ model: { tables: { id: string; name: string }[] } }>(`/api/v1/connections/${stand.connectionId}/schema`));
        const table = schema.model.tables.find((t) => t.name === `${PREFIX}bookings`)!.id;
        const told = ok(await owner.get<{ clashes: unknown[] }>(`/api/v1/calendar-sync/clashes?connection=${encodeURIComponent(stand.connectionId)}&table=${encodeURIComponent(table)}`));
        expect(told.clashes).toEqual([]);
      });

      it("keeps the page and the team's figures from anyone a limit holds", async () => {
        const pages = await desk.get<{ pages?: { ref?: string }[] }>("/api/v1/pages");
        expect(JSON.stringify(pages.body)).not.toContain("bookings-overview");
        for (const card of ["chair-time", "calendars"]) {
          const refused = await asked(noor, card);
          expect(refused.status, `${card}: ${JSON.stringify(refused.body).slice(0, 300)}`).toBe(403);
        }
        const hers = await asked(noor, "visits-worth");
        expect(hers.status, JSON.stringify(hers.body).slice(0, 300)).toBe(403);
        expect(ADMIN.email).toBeTruthy();
      });
    });
  });
});
