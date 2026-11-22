/**
 * THE E-MAILS, AS THE SERVER SENDS THEM.
 *
 * On each engine, Lumen with its sample at Tuesday 15 September 2026, 10:40.
 * A guest acts through the pages' own door, the front desk and a specialist
 * through the desk's, each holding one role. Every mail is read from the SMTP
 * sink, so a variable nothing fills, a link that does not open or a mail that
 * should not have gone fails here and not in somebody's inbox.
 */
import { randomBytes } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { AdminiumDesk } from "../desk/adminiumDesk.ts";
import { createSessionTransport } from "../desk/transport/sessionSource.ts";
import { loadStaffConfig } from "../desk/transport/staffConnection.ts";
import { LumenDoor, type Row, type Served } from "../customer/door.ts";
import { emailWords } from "../manifest/emails.ts";
import { LOCALES } from "../manifest/labels.ts";
import { Caller, ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, until, type Engine } from "./harness.ts";
import { ADD_ONS, inbox, retryKey, standUp, type Mail, type Stand } from "./stand.ts";

const why = missing() ?? ADD_ONS.map((key) => missingAddOn(key)).find((reason) => reason !== null) ?? null;
if (why !== null && process.env["ADMINIUM_REQUIRE_CONTRACT"] === "1") throw new Error(`the mail contract must run here, and cannot: ${why}`);
vi.setConfig({ testTimeout: 180_000 });
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 5310) + 80;

const pdt = (day: string, time: string) => new Date(`${day}T${time}:00-07:00`).toISOString();
const at = (day: string, time: string) => Date.parse(pdt(day, time));
const key = () => randomBytes(16).toString("hex");
const EN = emailWords()["en-US"];

/** What no mail may ever print: a variable nothing filled. */
const clean = (mail: Mail) => {
  expect(mail.subject, mail.subject).not.toContain("{{");
  expect(mail.text, mail.text.slice(0, 600)).not.toContain("{{");
  expect(mail.html).not.toContain("{{");
};
/** The calendar part the sink kept, as text; `method` is REQUEST or CANCEL. */
const calendarOf = (mail: Mail) => {
  const parts = (mail as unknown as { attachments: { contentType: string; filename?: string; content?: string; size?: number }[] }).attachments.filter((a) => /calendar/i.test(a.contentType));
  return parts[0];
};
const linkIn = (text: string, path: string) => new RegExp(`https?://[^\\s"]*${path}#([A-Za-z0-9_.-]+)`).exec(text)?.[1];

describe.skipIf(why !== null)(`the e-mails${why === null ? "" : ` — skipped: ${why}`}`, () => {
  ENGINES.forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let stand: Stand;
      let served: Served;
      let services: Record<string, Row>;
      let team: Record<string, Row>;
      let desk: AdminiumDesk;
      let frontDesk: { caller: Caller; email: string; password: string };
      let noorEmail: string;
      let customer: Row;

      const address = (who: string) => `${who}.${engine}@lumen-guests.dev`;
      const tab = () => {
        const fetcher: typeof fetch = (input, init) => {
          const headers = new Headers(init?.headers);
          headers.set("origin", stand.server.base);
          return fetch(input, { ...init, headers });
        };
        return new LumenDoor({ ...served, baseUrl: stand.server.base }, { fetch: fetcher });
      };
      const values = (service: string, starts: string, who: string, more: Record<string, unknown> = {}) => ({
        service_id: services[service]!["id"],
        starts_at: starts,
        name: `${who[0]!.toUpperCase()}${who.slice(1)} Guest`,
        email: address(who),
        language: "en-US",
        channel: "page" as const,
        ...more,
      });
      /** A time this service is free on a day, as the page shows it, at or after `from`. */
      const free = async (service: string, day: string, who: string | null = null, from = "00:00") => {
        // A person works some days only: the first day from this one that has a time.
        for (let d = 0; d < 12; d += 1) {
          const date = new Date(Date.parse(`${day}T12:00:00Z`) + d * 86_400_000).toISOString().slice(0, 10);
          const list = await tab().times(String(services[service]!["id"]), who === null ? null : String(team[who]!["id"]), date);
          const found = list.find((s) => s.state === "free" && s.time >= from);
          if (found !== undefined) return pdt(date, found.time);
        }
        throw new Error(`nothing free for ${service} from ${day}`);
      };
      /** The mails to one address so far. */
      const to = async (email: string) => (await inbox(stand.server)).filter((m) => m.to.some((t) => t.toLowerCase().includes(email.toLowerCase())));
      const mailTo = (email: string, subject: RegExp, label = subject.source) =>
        until(async () => (await to(email)).find((m) => subject.test(m.subject)), `a mail to ${email}: ${label}`, 120_000);
      const member = async (role: RegExp, who: string): Promise<{ caller: Caller; id: string; email: string; password: string }> => {
        const roles = ok(await stand.staff.get<{ roles: { id: string; name: string; key?: string }[] }>("/api/v1/roles")).roles;
        const found = roles.find((r) => role.test(r.name) || role.test(r.key ?? ""));
        if (found === undefined) throw new Error(`no role ${String(role)}`);
        const email = `${who}.mails.${engine}@lumen-staff.dev`;
        const invited = ok(await stand.staff.post<{ user?: { id: string }; id?: string; invite: { token: string } }>("/api/v1/users", { email, name: who, roleIds: [found.id] }), 201);
        const password = `${randomBytes(18).toString("base64url")}Aa1!`;
        ok(await new Caller(stand.server.base, { origin: stand.server.base }).post("/api/v1/auth/password/reset", { token: invited.invite.token, newPassword: password }));
        const caller = new Caller(stand.server.base, { origin: stand.server.base });
        await caller.signInToScreens(email, password, "bookings");
        const users = ok(await stand.staff.get<{ users: { id: string; email: string }[] }>("/api/v1/users")).users;
        return { caller, id: invited.user?.id ?? invited.id ?? users.find((u) => u.email === email)!.id, email, password };
      };
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

      /** Signed in afresh: moving the clock by days ends a staff session, as it would overnight. */
      const deskAgain = async () => {
        frontDesk.caller = new Caller(stand.server.base, { origin: stand.server.base });
        await frontDesk.caller.signInToScreens(frontDesk.email, frontDesk.password, "bookings");
        desk = await doorFor(frontDesk.caller);
        await desk.load();
      };

      beforeAll(async () => {
        stand = await standUp(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, "mails");
        const doc = ok(await new Caller(stand.server.base).get<Record<string, unknown>>("/apps/bookings/customer/surface-config.json"));
        served = {
          baseUrl: stand.server.base,
          publishableKey: stand.studioKey,
          publicKeys: doc["publicKeys"] as Record<string, string>,
          tables: doc["tables"] as Record<string, string>,
          addOns: doc["addOns"] as Record<string, { present?: boolean }>,
        };
        services = Object.fromEntries((await stand.rows("services")).map((s) => [String(s["name"]), s]));
        team = Object.fromEntries((await stand.rows("team")).map((t) => [String(t["name"]).split(" ")[0]!, t]));
        ok(await stand.staff.post("/api/v1/payments/apps/switch", { connectionId: stand.connectionId, appKey: "bookings", enabled: true }));
        const front = await member(/front/i, "jun");
        const noor = await member(/specialist/i, "noor");
        noorEmail = noor.email;
        await stand.patch("team", team["Noor"]!["id"], { user_id: noor.id, email: noor.email });
        frontDesk = front;
        await deskAgain();
        customer = await stand.create("customers", { name: "Dana Desk", email: address("dana") });
      }, 900_000);

      afterAll(async () => {
        await stand?.server.stop();
      });

      it("a guest's booking is confirmed by mail, with its link, its calendar entry and the sentence that fits", async () => {
        const made = await tab().book("studio", values("Gel Manicure", await free("Gel Manicure", "2026-09-29"), "ana"), retryKey("m1"));
        const mail = await mailTo(address("ana"), /Gel Manicure/);
        clean(mail);
        expect(mail.subject.startsWith("Booked: Gel Manicure")).toBe(true);
        expect(mail.text).toContain("You're booked, Ana");
        expect(mail.text).toContain("LMN-");
        expect(mail.text).toContain("Free to cancel or move until");
        // Its own link opens this booking, and the code is not the link.
        const token = linkIn(mail.text, "/b");
        expect(token).toBeTruthy();
        const reader = tab();
        expect(await reader.openLink(token!)).toBe("opened");
        expect((await reader.linkBooking())!["id"]).toBe(made.row["id"]);
        // The calendar entry travels as the engine's own part.
        expect(calendarOf(mail), JSON.stringify((mail as unknown as { attachments: unknown[] }).attachments).slice(0, 300)).toBeTruthy();
      });

      it("every language has its own words, and none leaves a variable behind", async () => {
        const words = emailWords();
        const days = ["2026-09-22", "2026-09-24", "2026-09-29", "2026-10-01", "2026-10-06", "2026-10-08", "2026-10-13", "2026-10-15"];
        for (const [i, tag] of LOCALES.entries()) {
          const who = `lang${String(i)}`;
          const day = days[i]!;
          await stand.create("bookings", { service_id: services["Gel Manicure"]!["id"], team_id: team["Ivy"]!["id"], starts_at: await free("Gel Manicure", day, "Ivy"), name: `Lang ${tag}`, email: address(who), language: tag, channel: "desk" });
          const head = words[tag].bookedSubject.split("{S}")[0]!;
          const mail = await until(async () => (await to(address(who))).find((m) => m.subject.includes(head.trim())), `the ${tag} confirmation`, 120_000);
          clean(mail);
          expect(mail.text, tag).toContain(words[tag].bookedThanks);
        }
      });

      it("a time offered from the waiting list goes by mail, on a link that opens the offer", async () => {
        const startsAt = await free("Gel Manicure", "2026-10-16", "Ivy");
        const day = new Date(Date.parse(startsAt) - 7 * 3_600_000).toISOString().slice(0, 10);
        await tab().joinList({ service_id: services["Gel Manicure"]!["id"], team_id: null, day, name: "Wes Waiting", email: address("wes"), language: "en-US" }, retryKey("m6"));
        const entry = (await stand.rows("waitlist")).find((w) => w["name"] === "Wes Waiting")!;
        const made = await desk.offerTime({ entry, person: team["Ivy"]!["id"], startsAt, key: key() } as never);
        expect(made["state"]).toBe("offered");
        const mail = await mailTo(address("wes"), /A time opened/);
        clean(mail);
        const token = linkIn(mail.text, "/b");
        const reader = tab();
        expect(await reader.openLink(token!)).toBe("opened");
        expect((await reader.linkBooking())!["state"]).toBe("offered");
      });

      it("a booking made inside the last day gets no reminder, and one made earlier gets it at 10 AM the day before (cQ11)", async () => {
        await tab().book("studio", values("Gel Manicure", await free("Gel Manicure", "2026-09-16", null, "14:00"), "soon"), retryKey("m2"));
        await mailTo(address("soon"), /Booked/);
        await tab().book("studio", values("Gel Manicure", await free("Gel Manicure", "2026-09-18"), "later"), retryKey("m3"));
        await mailTo(address("later"), /Booked/);
        await stand.server.setClock(at("2026-09-17", "10:05"));
        const reminder = await mailTo(address("later"), /See you tomorrow/);
        clean(reminder);
        expect(reminder.text).toContain("You can still move or cancel it free until");
        expect((await to(address("soon"))).filter((m) => /See you tomorrow/.test(m.subject))).toEqual([]);
      });

      it("a move, a free cancel and a late cancel each say so", async () => {
        const door = tab();
        const made = await door.book("studio", values("Gel Manicure", await free("Gel Manicure", "2026-10-02"), "mover"), retryKey("m4"));
        await mailTo(address("mover"), /Booked/);
        const own = tab();
        expect(await own.openLink(made.token!)).toBe("opened");
        await own.moveBooking(made.row["id"], await free("Gel Manicure", "2026-10-03"), null, false);
        const moved = await mailTo(address("mover"), /^Moved/);
        clean(moved);
        expect(moved.text).toContain("Your booking code stays the same");
        expect(moved.text).toContain(EN.movedOld);
        await own.cancelBooking(made.row["id"], false);
        const inTime = await mailTo(address("mover"), /^Cancelled/);
        clean(inTime);
        expect(inTime.text).toContain("you cancelled in time");

        const late = await tab().book("studio", values("Gel Manicure", await free("Gel Manicure", "2026-09-17", null, "13:00"), "latecomer"), retryKey("m5"));
        await mailTo(address("latecomer"), /Booked/);
        const lateTab = tab();
        await lateTab.openLink(late.token!);
        await lateTab.cancelBooking(late.row["id"], false);
        const mail = await mailTo(address("latecomer"), /^Cancelled/);
        clean(mail);
        expect(mail.text).toContain("You cancelled less than 24 hours");
        expect(mail.text).not.toContain("you cancelled in time");
      });

      it("the front desk's cancel carries its reason and the refund's words", async () => {
        const made = await desk.createBooking({
          service: services["Gel Manicure"]!["id"],
          person: team["Ivy"]!["id"],
          startsAt: await free("Gel Manicure", "2026-10-07", "Ivy"),
          customer: { id: customer["id"], name: "Dana Desk", email: address("dana"), phone: "" },
          depositLink: false,
          key: key(),
        } as never);
        await mailTo(address("dana"), /Booked/);
        await desk.moveBooking(made, "cancelled", { cancelled_by: "studio", cancel_reason: "Ivy is away that week." });
        const mail = await mailTo(address("dana"), /had to cancel/);
        clean(mail);
        expect(mail.text).toContain("Ivy is away that week.");
        expect(mail.text).toContain(EN.studioNothing);
      });

      it("a specialist is told of a new booking of theirs, and the notice names no guest and no price", async () => {
        const made = await stand.create("bookings", {
          service_id: services["Aromatherapy Ritual"]!["id"],
          team_id: team["Noor"]!["id"],
          starts_at: await free("Aromatherapy Ritual", "2026-10-09", "Noor"),
          name: "Private Person",
          email: address("private"),
          language: "en-US",
          channel: "desk",
        });
        const mail = await mailTo(noorEmail, /New booking/);
        clean(mail);
        expect(mail.text).toContain(String(made["code"]));
        expect(mail.text).toContain("Aromatherapy Ritual");
        for (const secret of ["Private Person", address("private"), "$"]) expect(mail.text).not.toContain(secret);
      });

      it("a deposit link is mailed, holds the time, and a time nobody paid for is let go", async () => {
        const root = services["Root Color"]!;
        const made = await desk.createBooking({
          service: root["id"],
          person: team["Elin"]!["id"],
          startsAt: await free("Root Color", "2026-10-14", "Elin"),
          customer: { id: customer["id"], name: "Dana Desk", email: address("dana"), phone: "" },
          depositLink: true,
          key: key(),
        } as never);
        const mail = await mailTo(address("dana"), /Pay your deposit/);
        clean(mail);
        expect(mail.text).toContain("This link works until");
        expect(linkIn(mail.text, "/b")).toBeTruthy();
        expect(mail.text).toContain(EN.linkNoCard);
        await stand.server.setClock(at("2026-09-19", "12:00"));
        const gone = await mailTo(address("dana"), /We let your time go/);
        clean(gone);
        expect((await stand.row("bookings", made["id"]))["state"]).toBe("lapsed");
      });

      it("the morning after a visit the request goes with a link that reviews it, and an answered visit gets no reminder", async () => {
        await stand.server.setClock(at("2026-09-22", "07:30"));
        const first = await free("Gel Manicure", "2026-09-22", "Ivy");
        const day = new Date(Date.parse(first) - 7 * 3_600_000).toISOString().slice(0, 10);
        const plus = (days: number) => new Date(Date.parse(`${day}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
        await stand.server.setClock(at(day, "07:30"));
        const answered = (await tab().book("studio", values("Gel Manicure", await free("Gel Manicure", day, "Ivy", "10:00"), "rita", { team_id: team["Ivy"]!["id"] }), retryKey("r1"))).row;
        const silent = (await tab().book("studio", values("Gel Manicure", await free("Gel Manicure", day, "Ivy", "10:00"), "sam", { team_id: team["Ivy"]!["id"] }), retryKey("r2"))).row;
        await mailTo(address("rita"), /Booked/);
        await mailTo(address("sam"), /Booked/);
        await stand.server.setClock(at(day, "19:00"));
        await deskAgain();
        await desk.moveBooking(answered as never, "arrived");
        await desk.moveBooking(silent as never, "arrived");

        await stand.server.setClock(at(plus(1), "10:05"));
        const request = await mailTo(address("rita"), /How was your/);
        clean(request);
        expect(request.text).toContain("We publish good and bad reviews alike.");
        expect(request.text).toContain("&star=5");
        const token = linkIn(request.text, "/review");
        expect(token).toBeTruthy();
        const reader = tab();
        const opened = await reader.readReviewLink(token!);
        expect(opened).toBeTruthy();
        await reader.sendReviewLink(token!, 5, "Lovely.");
        await mailTo(address("sam"), /How was your/);

        await stand.server.setClock(at(plus(5), "10:05"));
        const again = await mailTo(address("sam"), /One last question/);
        clean(again);
        expect((await to(address("rita"))).filter((m) => /One last question/.test(m.subject))).toEqual([]);
      });

    });
  });
});
