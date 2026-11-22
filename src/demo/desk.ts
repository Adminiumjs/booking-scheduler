/**
 * The desk's door into the demo's Adminium: every row the screens read, and
 * each write made the way the real server makes it. Signed in as Selma Okonjo,
 * who owns the studio, so every screen is open (D20).
 *
 * The console's own pages are not in the demo (C1), so `systemActions` is
 * empty: a link to them is not drawn.
 *
 * DEMO BUILD ONLY: nothing in a real build imports it.
 */
import type { BusyBlock, Clash, DayCount, DeskData, DeskDoor, DeskFacts, EmbedFacts, NewBooking, OfferLine, PaymentPanel, Person, Slot, StaffPayments } from "../desk/door.ts";
import { ApiError, same, type Id, type Row } from "../desk/wire.ts";
import { OWNER } from "./sample.ts";
import { DemoRefusal, type LumenWorld } from "./world.ts";

const copy = <T>(value: T): T => structuredClone(value);
const n = (value: unknown): number => (value === null || value === undefined || value === "" ? 0 : Number(value));

/** The person the desk is signed in as. */
export const DEMO_PERSON: Person = { id: OWNER.id, name: OWNER.name, roles: ["owner"], can: () => true };

async function run<T>(work: () => T): Promise<T> {
  await Promise.resolve();
  try {
    return work();
  } catch (error) {
    if (error instanceof DemoRefusal) throw new ApiError(error.status, error.code === "PUBLIC_SLOT_FULL" ? "BOOKING_TAKEN" : error.code, error.message, error.params);
    throw error;
  }
}

export class DemoDesk implements DeskDoor {
  private readonly world: LumenWorld;

  constructor(world: LumenWorld) {
    this.world = world;
  }

  who(): Person {
    return DEMO_PERSON;
  }

  facts(): DeskFacts {
    return { zone: this.world.zone, currency: this.world.currency, addOns: [...this.world.addOns], connectionId: null };
  }

  now(): number {
    return this.world.now;
  }

  async systemActions(): Promise<readonly string[]> {
    return [];
  }

  payments(): StaffPayments {
    return { on: true, online: true, test: false, refund: true };
  }

  moderates(): boolean {
    return true;
  }

  load(): Promise<DeskData> {
    return run((): DeskData => {
      const w = this.world;
      const all = (table: string) => copy(w.all(table));
      const position = (a: Row, b: Row) => n(a["position"]) - n(b["position"]);
      const calendars = Object.fromEntries([...w.calendars.entries()].map(([id, calendar]) => [id, copy(calendar)]));
      return {
        settings: copy(w.settings()),
        openingHours: all("opening_hours"),
        closures: all("closures"),
        categories: all("categories").sort(position),
        services: all("services").sort(position),
        team: all("team").sort(position),
        teamServices: all("team_services"),
        teamHours: all("team_hours"),
        timeOff: all("time_off"),
        customers: all("customers").filter((c) => c["forgotten_at"] === null),
        waitlist: all("waitlist").filter((e) => e["state"] !== "closed"),
        bookings: all("bookings").sort((a, b) => String(a["starts_at"]).localeCompare(String(b["starts_at"])) || Number(a.id) - Number(b.id)),
        payments: all("payments"),
        messages: all("messages"),
        reviews: { reviews: all("reviews").sort((a, b) => String(b["submitted_at"]).localeCompare(String(a["submitted_at"]))), totals: [] },
        offers: this.offers(),
        calendars,
        clashes: copy(w.clashes),
        capReached: 0,
      };
    });
  }

  /** Packs and gift cards on a client's panel, joined by their e-mail. Never a card's code: the last characters at most. */
  private offers(): Record<string, OfferLine[]> {
    const w = this.world;
    const byEmail = new Map(w.all("customers").filter((c) => typeof c["email"] === "string").map((c) => [String(c["email"]).toLowerCase(), String(c.id)]));
    const out: Record<string, OfferLine[]> = {};
    const add = (email: unknown, line: OfferLine) => {
      const id = typeof email === "string" ? byEmail.get(email.toLowerCase()) : undefined;
      if (id !== undefined) (out[id] ??= []).push(line);
    };
    for (const v of w.all("vouchers")) add(v["holder_email"], { key: `v${String(v.id)}`, kind: "pack", title: String(v["public_name"] ?? ""), sub: "", figure: `${String(v["uses_taken"])}/${String(v["uses_total"])}` });
    for (const c of w.all("gift_cards")) {
      const line: OfferLine = { key: `c${String(c.id)}`, kind: "card", title: String(c["label"] ?? ""), sub: String(c["recipient_name"] ?? ""), figure: String(c["balance"]) };
      add(c["owner_email"], line);
      if (c["recipient_email"] !== c["owner_email"]) add(c["recipient_email"], line);
    }
    return out;
  }

  // ── free times ────────────────────────────────────────────────────────────

  slots(input: { service: Id; person: Id | null; day: string; exclude?: Id | null }): Promise<Slot[]> {
    return run(() => this.world.slots(input.service, input.person, input.day, { guest: false, exclude: input.exclude ?? undefined }));
  }

  days(input: { service: Id; person: Id | null; from: string; days: number; exclude?: Id | null }): Promise<DayCount[]> {
    return run(() => this.world.strip(input.service, input.person, input.from, input.days, { guest: false, exclude: input.exclude ?? undefined }));
  }

  busy(team: Id, from: string, to: string): Promise<BusyBlock[]> {
    return run(() => this.world.busyOf(team, from, to));
  }

  // ── bookings ──────────────────────────────────────────────────────────────

  createBooking(input: NewBooking): Promise<Row> {
    return run(() =>
      copy(
        this.world.makeVisit({
          service: input.service,
          person: input.person,
          startsAt: input.startsAt,
          name: input.customer.name,
          email: input.customer.email ?? "",
          phone: input.customer.phone,
          language: input.customer.language ?? "en-US",
          channel: "desk",
          door: "desk",
          depositLink: input.depositLink,
          customerId: input.customer.id,
          proved: true,
          key: input.key,
        }),
      ),
    );
  }

  moveBooking(booking: Row, to: string, values: Record<string, unknown> = {}): Promise<Row> {
    return run(() => copy(this.world.moveVisit(booking.id, String(booking["state"]), to, values)));
  }

  saveBooking(booking: Row, values: Record<string, unknown>): Promise<Row> {
    return run(() => {
      const { starts_at: startsAt, team_id: team, ...rest } = values;
      if (startsAt !== undefined) this.world.moveTime(booking.id, String(startsAt), (team ?? booking["team_id"]) as Id, false);
      const row = this.world.update("bookings", booking.id, rest);
      this.world.changed();
      return copy(row);
    });
  }

  panel(booking: Row): Promise<PaymentPanel | null> {
    return run((): PaymentPanel => {
      const w = this.world;
      const held = w.booking(booking.id);
      const payments = w.all("payments").filter((p) => same(p["booking_id"], held.id));
      return {
        currency: w.currency,
        total: String(held["net_price"]),
        due: String(held["pay_due"]),
        paid: String(held["paid"]),
        mayRefund: true,
        waiting: held["state"] === "paying" && w.payStates.get(String(held.id)) === "confirming",
        payments: payments
          .filter((p) => p["method"] === "online")
          .map((p) => ({ attemptId: String(p.id), amount: String(p["amount"]), method: "card", provider: (p["provider"] as string | null) ?? null, test: false, paidOn: String(p["paid_at"]).slice(0, 10), refundable: String(p["kept"]), refundRefusal: null })),
      };
    });
  }

  refund(input: { attemptId: string; amount: string; reason: string; note: string; key: string }): Promise<{ state: string; failureMessage: string | null }> {
    return run(() => {
      const w = this.world;
      const payment = w.get("payments", input.attemptId);
      if (payment === undefined) throw new DemoRefusal(404, "NOT_FOUND", "No such payment.");
      const amount = n(input.amount);
      if (amount > n(payment["kept"])) throw new DemoRefusal(409, "BALANCE_EXCEEDED", "More than the payment keeps.");
      Object.assign(payment, { kept: n(payment["kept"]) - amount, returned: n(payment["returned"]) + amount, refunded: n(payment["refunded"]) + amount });
      w.changed();
      return { state: "done", failureMessage: null };
    });
  }

  // ── the rest of the studio ────────────────────────────────────────────────

  createCustomer(values: { name: string; email: string | null; phone: string | null }): Promise<Row> {
    return run(() => {
      const row = this.world.insert("customers", { ...values, language: "en-US", review_requests: true, staff_note: null, forgotten_at: null, created_at: this.world.nowIso() });
      this.world.changed();
      return copy(row);
    });
  }

  private save(table: string, id: Id, values: Record<string, unknown>): Promise<Row> {
    return run(() => {
      const row = this.world.update(table, id, values);
      this.world.changed();
      return copy(row);
    });
  }

  saveCustomer(customer: Row, values: Record<string, unknown>): Promise<Row> {
    return this.save("customers", customer.id, values);
  }

  createService(values: Record<string, unknown>): Promise<Row> {
    return run(() => {
      const row = this.world.insert("services", { id: this.world.code("svc-"), active: true, bookable_online: true, anyone_pick: "even", position: this.world.all("services").length + 1, ...values });
      this.world.changed();
      return copy(row);
    });
  }

  saveService(service: Row, values: Record<string, unknown>): Promise<Row> {
    return this.save("services", service.id, values);
  }

  addServicePerson(service: Id, team: Id): Promise<Row> {
    return run(() => {
      const row = this.world.insert("team_services", { id: `${String(team)}:${String(service)}`, team_id: team, service_id: service });
      this.world.changed();
      return copy(row);
    });
  }

  removeServicePerson(link: Row): Promise<void> {
    return run(() => {
      this.world.remove("team_services", link.id);
      this.world.changed();
    });
  }

  saveTeam(person: Row, values: Record<string, unknown>): Promise<Row> {
    return this.save("team", person.id, values);
  }

  addTimeOff(values: { team_id: Id; starts_at: string; ends_at: string; why: string | null }): Promise<Row> {
    return run(() => {
      const row = this.world.insert("time_off", values);
      this.world.changed();
      return copy(row);
    });
  }

  removeTimeOff(row: Row): Promise<void> {
    return run(() => {
      this.world.remove("time_off", row.id);
      this.world.changed();
    });
  }

  offerTime(input: { entry: Row; person: Id; startsAt: string; key: string }): Promise<Row> {
    return run(() => {
      const entry = this.world.get("waitlist", input.entry.id);
      if (entry === undefined) throw new DemoRefusal(404, "NOT_FOUND", "No such entry.");
      return copy(this.world.offer(entry, input.person, input.startsAt));
    });
  }

  closeWaiting(entry: Row): Promise<Row> {
    return this.save("waitlist", entry.id, { state: "closed" });
  }

  saveReview(review: Row, values: Record<string, unknown>): Promise<Row> {
    const reply = typeof values["reply"] === "string" ? { replied_at: this.world.nowIso() } : {};
    return this.save("reviews", review.id, { ...values, ...reply });
  }

  saveSettings(settings: Row, values: Record<string, unknown>): Promise<Row> {
    return this.save("settings", settings.id, values);
  }

  addClosure(values: { from_date: string; to_date: string; name: string }): Promise<Row> {
    return run(() => {
      const row = this.world.insert("closures", { team_id: null, ...values, active: true });
      this.world.changed();
      return copy(row);
    });
  }

  // ── calendars ─────────────────────────────────────────────────────────────

  keepClash(clash: Clash): Promise<void> {
    return run(() => {
      this.world.clashes = this.world.clashes.map((c) => (c.row === clash.row && c.overlapStart === clash.overlapStart ? { ...c, kept: true } : c));
      this.world.changed();
    });
  }

  syncNow(team: Id): Promise<void> {
    return run(() => {
      const calendar = this.world.calendars.get(String(team));
      if (calendar?.sync) calendar.sync.lastSyncedAt = this.world.now;
      this.world.changed();
    });
  }

  saveCalendarChoices(team: Id, choices: { readCalendars?: string[] | null; countAllDay?: boolean; detail?: "first-name+initial" | "none"; resume?: true }): Promise<void> {
    return run(() => {
      const sync = this.world.calendars.get(String(team))?.sync;
      if (sync) {
        if (choices.readCalendars !== undefined) sync.readCalendars = choices.readCalendars;
        if (choices.countAllDay !== undefined) sync.countAllDay = choices.countAllDay;
        if (choices.detail !== undefined) sync.detail = choices.detail;
        if (choices.resume === true) sync.paused = null;
      }
      this.world.changed();
    });
  }

  /** The hand-off to the provider, faked: nothing leaves the page, and the calendar reads as connected (L4-F7). */
  connectCalendar(team: Id, addOn: string): Promise<string> {
    return run(() => {
      const provider = addOn.includes("microsoft") ? "microsoft" : "google";
      this.world.connectCalendar(team, provider);
      return "#lumen-connected";
    });
  }

  sendConnectLink(team: Id): Promise<string | null> {
    return run(() => (this.world.get("team", team)?.["email"] as string | undefined) ?? null);
  }

  copyConnectLink(team: Id): Promise<string> {
    return run(() => `https://lumenstudio.example/connect/${String(team)}`);
  }

  disconnectCalendar(team: Id): Promise<void> {
    return run(() => this.world.disconnectCalendar(team));
  }

  feedLink(team: Id): Promise<{ link: string | null; own: boolean } | null> {
    return run(() => {
      const held = this.world.calendars.get(String(team));
      if (held === undefined) return null;
      return { link: held.accounts.length === 0 ? `https://lumenstudio.example/x/cal/${String(team)}-feed.ics` : null, own: true };
    });
  }

  renewFeed(team: Id): Promise<{ link: string | null; own: boolean }> {
    return run(() => ({ link: `https://lumenstudio.example/x/cal/${String(team)}-${this.world.code("feed")}.ics`, own: true }));
  }

  embeds(): Promise<EmbedFacts | null> {
    return run(() => ({
      origin: "https://lumenstudio.example",
      sites: ["https://lumenstudio.example"],
      app: "bookings",
      mount: "/apps/bookings/customer",
      path: "/book",
      modes: ["inline", "button", "floating"],
      services: this.world.all("services").filter((s) => s["active"] !== false).map((s) => ({ value: String(s.id), label: String(s["name"]) })),
      query: "service",
    }));
  }
}
