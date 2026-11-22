/**
 * WHAT AN ATTACKER TRIES, ON A BUILT ADMINIUM, AS EACH KIND OF PERSON.
 *
 * On each engine, Lumen with its sample at Tuesday 15 September 2026, 10:40.
 * Every refusal here is the server's, asked over HTTP as that person.
 */
import { randomBytes } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Caller, ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, type Engine } from "./harness.ts";
import { ADD_ONS, inbox, num, retryKey, standUp, type Row, type Stand } from "./stand.ts";

const why = missing() ?? ADD_ONS.map((key) => missingAddOn(key)).find((reason) => reason !== null) ?? null;
if (why !== null && process.env["ADMINIUM_REQUIRE_CONTRACT"] === "1") throw new Error(`the attack contract must run here, and cannot: ${why}`);
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 5310) + 70;
const pdt = (day: string, time: string) => new Date(`${day}T${time}:00-07:00`).toISOString();

describe.skipIf(why !== null)(`an attacker at Lumen${why === null ? "" : ` — skipped: ${why}`}`, () => {
  ENGINES.forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let stand: Stand;
      let owner: Caller;
      let desk: Caller;
      let clock = Date.parse("2026-09-15T17:40:00Z");
      /** The next hour: a visitor's hourly caps start again. */
      const nextHour = async () => {
        clock += 61 * 60_000;
        await stand.server.setClock(clock);
      };
      const creates = (table: string) =>
        Object.keys(stand.refs)
          .filter((r) => r.startsWith(`bookings_${table}`) && JSON.stringify(stand.refs[r]?.["actions"] ?? []) === '["create"]')
          .sort((a, b) => Number(/_(\d+)$/.exec(a)?.[1] ?? 1) - Number(/_(\d+)$/.exec(b)?.[1] ?? 1));
      const freeTimes = async (service: unknown, day: string): Promise<string[]> => {
        const availability = Object.keys(stand.refs).find((r) => stand.refs[r]?.["kind"] === "availability")!;
        const reply = await stand.guest("studio").raw("GET", `/api/v1/public/availability/${availability}?kind=${String(service)}&date=${day}`);
        return (reply.body.data as unknown as { time: string; state: string }[]).filter((t) => t.state === "free").map((t) => t.time);
      };
      const member = async (role: RegExp, who: string): Promise<Caller> => {
        const roles = ok(await stand.staff.get<{ roles: { id: string; name: string; key?: string }[] }>("/api/v1/roles")).roles;
        const found = roles.find((r) => role.test(r.name) || role.test(r.key ?? ""))!;
        const email = `${who}.${engine}@lumen-staff.dev`;
        const invited = ok(await stand.staff.post<{ invite: { token: string } }>("/api/v1/users", { email, name: who, roleIds: [found.id] }), 201);
        const password = `${randomBytes(18).toString("base64url")}Aa1!`;
        ok(await new Caller(stand.server.base, { origin: stand.server.base }).post("/api/v1/auth/password/reset", { token: invited.invite.token, newPassword: password }));
        const caller = new Caller(stand.server.base, { origin: stand.server.base });
        await caller.signInToScreens(email, password, "bookings");
        return caller;
      };
      const service = async (test: (s: Row) => boolean) => (await stand.rows("services")).find(test)!;
      const paymentsOn = async () => stand.patch("settings", (await stand.rows("settings"))[0]!["id"], { online_payments: "on" });

      beforeAll(async () => {
        stand = await standUp(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, "attack");
        owner = await member(/^owner$/i, "selma");
        desk = await member(/front/i, "jun");
      }, 900_000);

      afterAll(async () => {
        await stand?.server.stop();
      });

      it("no member of staff reads a gift card's whole code from the money", async () => {
        await nextHour();
        await paymentsOn();
        const tab = await stand.rehearsing();
        const amount = (await stand.rows("gift_amounts")).find((a) => num(a["amount"]) === 100)!;
        const to = `rita.${engine}@lumen-guests.dev`;
        const sale = await tab.create(creates("purchases")[0]!, {
          values: { buyer_name: "A Friend", buyer_email: `friend.${engine}@lumen-guests.dev`, language: "en-US", client_key: retryKey("code-sale") },
          children: { purchase_lines: [{ values: { gift_amount_id: amount["id"], to_name: "Rita Gift", to_email: to } }] },
        });
        expect(sale.status, JSON.stringify(sale.body).slice(0, 300)).toBe(201);
        await stand.payDemo(String(sale.body["payUrl"]));
        let code: string | undefined;
        for (let tries = 0; tries < 40 && code === undefined; tries += 1) {
          const cards = await stand.rows("offers_gift_cards");
          const held = cards.find((c) => c["recipient_email"] === to && c["status"] === "active")?.["code"];
          code = typeof held === "string" && !held.includes("*") ? held : undefined;
          if (code === undefined) await new Promise((resolve) => setTimeout(resolve, 500));
        }
        expect(code, "the card's code").toBeTruthy();
        const root = await service((s) => s["name"] === "Root Color");
        const at = (await freeTimes(root["id"], "2026-10-08"))[0]!;
        const paying = await (await stand.rehearsing()).create(creates("bookings")[1]!, {
          values: { service_id: root["id"], starts_at: pdt("2026-10-08", at), name: "Rita Gift", email: to, language: "en-US", channel: "page", client_key: retryKey("code-pay") },
          children: { payments: [{ values: { card_code: code } }] },
        });
        expect(paying.status, JSON.stringify(paying.body).slice(0, 300)).toBe(201);
        for (const who of [owner, desk]) {
          const rows = ok(await who.get<{ data: Row[] }>(`${stand.data("payments")}?limit=200`)).data;
          const row = rows.find((p) => String(p["booking_id"]) === String(paying.body.data["id"]))!;
          expect(row, "the card's payment").toBeTruthy();
          expect(JSON.stringify(row)).not.toContain(code!);
        }
      }, 180_000);

      it("the front desk cannot point a customer's sign-in at a mailbox of its own", async () => {
        const target = (await stand.rows("customers")).find((c) => String(c["name"]).startsWith("Priya"))!;
        const taken = `desk-owned.${engine}@lumen-guests.dev`;
        const reply = await desk.patch(`${stand.data("customers")}/${String(target["id"])}`, { values: { email: taken } });
        expect(reply.status, JSON.stringify(reply.body).slice(0, 200)).toBeGreaterThanOrEqual(400);
        expect((await stand.row("customers", target["id"]))["email"]).toBe(target["email"]);
        const before = (await inbox(stand.server)).length;
        const tab = stand.guest("studio");
        await tab.proved("claim", "/api/v1/public/claim/link", { email: taken });
        await new Promise((resolve) => setTimeout(resolve, 1_500));
        expect((await inbox(stand.server)).slice(before).filter((m) => m.to.includes(taken))).toEqual([]);
        // The owner may still correct an address.
        const corrected = await owner.patch(`${stand.data("customers")}/${String(target["id"])}`, { values: { email: `priya.new.${engine}@lumen-guests.dev` } });
        expect(corrected.status).toBe(200);
        ok(await owner.patch(`${stand.data("customers")}/${String(target["id"])}`, { values: { email: target["email"] } }));
      }, 120_000);

      it("a signed-in customer cannot pile up waiting rows or unpaid gift orders", async () => {
        await nextHour();
        await paymentsOn();
        const waiting = await stand.rows("waitlist");
        const person = (await stand.rows("customers")).find((c) => typeof c["email"] === "string" && !waiting.some((w) => w["customer_id"] === c["id"]) && String(c["name"]).startsWith("L"))!;
        const email = String(person["email"]);
        const atStudio = await service((s) => s["online"] === "none" && s["active"] === true);
        const tab = stand.guest("studio");
        await tab.signIn(stand.server, email);
        const joins: number[] = [];
        for (let i = 0; i < 7; i += 1) {
          const made = await tab.create(creates("waitlist")[0]!, { values: { service_id: atStudio["id"], day: `2026-10-${String(10 + i)}`, name: String(person["name"]), email, language: "en-US", client_key: retryKey(`cap-w${String(i)}`) } });
          joins.push(made.status);
          if (made.status !== 201) expect(made.code).toBe("PUBLIC_LIMIT_REACHED");
        }
        expect(joins.filter((s) => s === 201).length).toBe(5);
        const buyer = await stand.rehearsing();
        await buyer.signIn(stand.server, email);
        const amount = (await stand.rows("gift_amounts"))[0]!;
        const orders: number[] = [];
        for (let i = 0; i < 4; i += 1) {
          const made = await buyer.create(creates("purchases")[0]!, {
            values: { buyer_name: String(person["name"]), buyer_email: email, language: "en-US", client_key: retryKey(`cap-c${String(i)}`) },
            children: { purchase_lines: [{ values: { gift_amount_id: amount["id"], to_name: "A Friend", to_email: `friend${String(i)}.${engine}@lumen-guests.dev` } }] },
          });
          orders.push(made.status);
          if (made.status !== 201) expect(made.code).toBe("PUBLIC_LIMIT_REACHED");
        }
        expect(orders.filter((s) => s === 201).length).toBe(2);
      }, 240_000);

      it("takes every length the forms offer, and no more", async () => {
        await nextHour();
        await paymentsOn();
        const long = "Anne Marie ".repeat(8).slice(0, 80).replace(/ $/, "e");
        const atStudio = await service((s) => s["online"] === "none" && s["active"] === true);
        const at = (await freeTimes(atStudio["id"], "2026-10-14"))[0]!;
        const booked = await stand.guest("studio").create(creates("bookings")[0]!, { values: { service_id: atStudio["id"], starts_at: pdt("2026-10-14", at), name: long, email: `long.${engine}@lumen-guests.dev`, language: "en-US", channel: "page", client_key: retryKey("len-b") } });
        expect(booked.status, JSON.stringify(booked.body).slice(0, 300)).toBe(201);
        expect(long.length).toBe(80);
        const over = await stand.guest("studio").create(creates("bookings")[0]!, { values: { service_id: atStudio["id"], starts_at: pdt("2026-10-14", at), name: `${long}e`, email: `over.${engine}@lumen-guests.dev`, language: "en-US", channel: "page", client_key: retryKey("len-o") } });
        expect(over.status).toBe(400);
        const joined = await stand.guest("studio").create(creates("waitlist")[0]!, { values: { service_id: atStudio["id"], day: "2026-10-15", name: long, email: `longw.${engine}@lumen-guests.dev`, language: "en-US", client_key: retryKey("len-w") } });
        expect(joined.status, JSON.stringify(joined.body).slice(0, 300)).toBe(201);
        const amount = (await stand.rows("gift_amounts"))[0]!;
        const message = `Happy 30th birthday, with love from all of us. ${"So glad you are here. ".repeat(8)}`.slice(0, 200).trim();
        const card = (text: string, key: string) => ({
          values: { buyer_name: long, buyer_email: `longb.${engine}@lumen-guests.dev`, language: "en-US", client_key: retryKey(key) },
          children: { purchase_lines: [{ values: { gift_amount_id: amount["id"], to_name: long, to_email: `longt.${engine}@lumen-guests.dev`, message: text } }] },
        });
        const sold = await (await stand.rehearsing()).create(creates("purchases")[0]!, card(message, "len-c"));
        expect(sold.status, JSON.stringify(sold.body).slice(0, 300)).toBe(201);
        const tooLong = await (await stand.rehearsing()).create(creates("purchases")[0]!, card(`${message} and more words past the end`, "len-d"));
        expect(tooLong.status).toBe(400);
      }, 120_000);
    });
  });
});
