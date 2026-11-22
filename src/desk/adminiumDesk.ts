/**
 * The desk's door into a real Adminium: the data API as the person signed in
 * to it, the app served at `/apps/bookings/staff/`, riding that person's
 * session. Their roles and row limits hold every read and write.
 *
 * A move is a change of the state column, judged by the table's states: the
 * state the screen saw goes with it (`from`), so a booking that moved on since
 * is refused rather than moved twice.
 *
 * Each engine spells a moment and a yes/no its own way; every row is read back
 * here as the screens expect it, an ISO instant and a boolean.
 */
import { SessionPortError, type SessionTransport } from "./transport/sessionSource.ts";
import type { StaffConfig } from "./transport/staffConnection.ts";
import { addDays, dayIn, momentOf } from "./time.ts";
import type {
  Action,
  BusyBlock,
  CalendarAccount,
  CalendarSyncState,
  Clash,
  DayCount,
  DeskData,
  DeskDoor,
  DeskFacts,
  EmbedFacts,
  NewBooking,
  OfferLine,
  PanelPayment,
  PaymentPanel,
  Person,
  PersonCalendar,
  ReviewRows,
  Slot,
  StaffPayments,
  Table,
} from "./door.ts";
import { ApiError, type Id, type Row } from "./wire.ts";

export const APP_KEY = "bookings";
const PAGE = 200;
/**
 * A person has 300 requests a minute, and the rows are read again after every write. What changes all day (bookings, the
 * waiting list, money, mail) is read each time; what rarely does is kept briefly, and dropped at once when this desk writes it.
 */
const KEPT_MS = 120_000;
const RARELY_CHANGES: ReadonlySet<string> = new Set(["settings", "opening_hours", "closures", "categories", "services", "team", "team_services", "team_hours", "time_off"]);

/** The moments each table holds: SQLite hands them back without a zone. */
export const MOMENTS: Readonly<Partial<Record<string, readonly string[]>>> = {
  time_off: ["starts_at", "ends_at"],
  customers: ["forgotten_at", "created_at"],
  waitlist: ["created_at"],
  bookings: ["made_at", "starts_at", "free_until", "link_until", "pay_until", "offer_until", "arrived_at", "done_at", "cancelled_at", "link_expires", "reviewed_at", "google_pressed_at"],
  payments: ["paid_at"],
  messages: ["due_at", "created_at", "sent_at"],
  reviews: ["submitted_at", "replied_at"],
};

/** The yes/no columns each table holds: SQLite and MySQL hand back 0 or 1. */
export const YES_NO: Readonly<Partial<Record<string, readonly string[]>>> = {
  settings: ["online_booking", "reviews_on"],
  opening_hours: ["open"],
  closures: ["active"],
  services: ["bookable_online", "active"],
  team: ["active", "bookable_online"],
  customers: ["review_requests"],
  bookings: ["picked_by_anyone", "customer_proved", "ask_online", "deposit_link", "pay_started", "late_cancel", "link_stopped", "google_pressed"],
};

const yesNo = (value: unknown): unknown => (value === null || value === undefined || typeof value === "boolean" ? value : value === 1 || value === "1" || value === "true");

function asApiError(error: unknown): unknown {
  if (error instanceof SessionPortError) {
    const details = error.details !== null && typeof error.details === "object" && !Array.isArray(error.details) ? (error.details as Record<string, unknown>) : {};
    return new ApiError(error.status, error.code, error.message, details);
  }
  return error;
}

const q = (value: unknown) => encodeURIComponent(JSON.stringify(value));
const str = (value: unknown): string => (value === null || value === undefined ? "0" : String(value));

/** A read the server may not have, or this person may not make: the part it feeds stays empty. */
const absent = (error: unknown): boolean => error instanceof SessionPortError && (error.status === 403 || error.status === 404 || error.status === 412);

export interface DeskDoorOptions {
  /** The server's clock less the device's, as the config said it. */
  skew?: number;
}

export class AdminiumDesk implements DeskDoor {
  private readonly t: SessionTransport;
  private readonly cfg: StaffConfig;
  private readonly skew: number;
  private readonly kept = new Map<string, { at: number; value: unknown }>();
  /** Bumped by every write: a read that began before it may not be kept. */
  private readonly written = new Map<string, number>();
  private actions: Promise<readonly string[]> | null = null;

  constructor(transport: SessionTransport, config: StaffConfig, options: DeskDoorOptions = {}) {
    this.t = transport;
    this.cfg = config;
    this.skew = options.skew ?? 0;
  }

  // ── the wire ──────────────────────────────────────────────────────────────

  private get serverZone(): string {
    return this.cfg.serverTimezone ?? "UTC";
  }
  private real(table: Table): string {
    return this.cfg.tables[table] ?? `bookings_${table}`;
  }
  private realAddOn(addOn: string, table: string): string {
    return this.cfg.addOns[addOn]?.tables?.[table] ?? this.cfg.tables[`${addOn}:${table}`] ?? `${addOn.replace(/-/g, "_")}_${table}`;
  }
  private readsAddOn(addOn: string, table: string): boolean {
    if (!Object.keys(this.cfg.addOns).includes(addOn)) return false;
    return this.cfg.access === null || (this.cfg.access.tables[this.realAddOn(addOn, table)]?.includes("read") ?? this.cfg.access.tables[`${addOn}:${table}`]?.includes("read") ?? false);
  }
  private async conn(): Promise<string> {
    return this.cfg.connectionId ?? (await this.t.connection());
  }
  private async path(real: string, rest = ""): Promise<string> {
    return `/api/v1/data/${encodeURIComponent(await this.conn())}/${encodeURIComponent(real)}${rest}`;
  }
  private row(table: string, row: Row): Row {
    const out: Row = { ...row };
    for (const column of MOMENTS[table] ?? []) if (column in out) out[column] = momentOf(out[column], this.serverZone);
    for (const column of YES_NO[table] ?? []) if (column in out) out[column] = yesNo(out[column]);
    return out;
  }
  private async run<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      throw asApiError(error);
    }
  }
  private async listReal(short: string, real: string, query: { where?: unknown; order?: string } = {}): Promise<Row[]> {
    const rows: Row[] = [];
    const extra = `${query.where === undefined ? "" : `&where=${q(query.where)}`}${query.order === undefined ? "" : `&order=${encodeURIComponent(query.order)}`}`;
    for (let offset = 0; offset < 50 * PAGE; offset += PAGE) {
      const got = await this.t.get<{ data: Row[] }>(await this.path(real, `?limit=${String(PAGE)}&offset=${String(offset)}${extra}`));
      rows.push(...got.data.map((r) => this.row(short, r)));
      if (got.data.length < PAGE) break;
    }
    return rows;
  }
  private async list(table: Table, order?: string): Promise<Row[]> {
    if (!this.who().can(table, "read")) return [];
    const read = () => this.listReal(table, this.real(table), order === undefined ? {} : { order });
    return RARELY_CHANGES.has(table) ? this.keep(table, read) : read();
  }
  /** A read that rarely changes, kept for a moment. */
  private async keep<T>(name: string, read: () => Promise<T>): Promise<T> {
    const held = this.kept.get(name);
    if (held !== undefined && Date.now() - held.at < KEPT_MS) return held.value as T;
    const before = this.written.get(name) ?? 0;
    const value = await read();
    if ((this.written.get(name) ?? 0) === before) this.kept.set(name, { at: Date.now(), value });
    return value;
  }
  /** What this desk just wrote is read afresh, and a read still on its way cannot put the old answer back. */
  private forget(name: string): void {
    this.kept.delete(name);
    this.written.set(name, (this.written.get(name) ?? 0) + 1);
  }
  private async writing<T>(name: string, work: () => Promise<T>): Promise<T> {
    this.forget(name);
    try {
      return await work();
    } finally {
      this.forget(name);
    }
  }
  private async listAddOn(addOn: string, table: string, query: { where?: unknown; order?: string } = {}): Promise<Row[] | null> {
    if (!this.readsAddOn(addOn, table)) return null;
    try {
      return await this.listReal(table, this.realAddOn(addOn, table), query);
    } catch (error) {
      if (absent(error)) return null;
      throw error;
    }
  }
  /** `clientKey` is the engine's retry key: the same press sent twice answers with the first row (cT18). */
  private async create(table: Table, values: Record<string, unknown>, clientKey?: string): Promise<Row> {
    const body = clientKey === undefined ? { values } : { values, clientKey };
    return this.writing(table, async () => this.row(table, (await this.t.mutate<{ data: Row }>(await this.path(this.real(table)), "POST", body)).data));
  }
  private async change(table: Table, id: Id, values: Record<string, unknown>, from?: string): Promise<Row> {
    const body = from === undefined ? { values } : { values, from };
    return this.writing(table, async () => this.row(table, (await this.t.mutate<{ data: Row }>(await this.path(this.real(table), `/${encodeURIComponent(String(id))}`), "PATCH", body)).data));
  }
  private async remove(table: Table, id: Id): Promise<void> {
    await this.writing(table, async () => this.t.mutate(await this.path(this.real(table), `/${encodeURIComponent(String(id))}`), "DELETE"));
  }
  /** A person's row, as the calendar routes name it. */
  private async teamRef(team: Id): Promise<{ connection: string; table: string; row: string }> {
    return { connection: await this.conn(), table: await this.t.tableId(this.real("team")), row: String(team) };
  }
  /** The feed is the booking table's, for one person's row. */
  private async feedRef(team: Id): Promise<{ connection: string; table: string; row: string }> {
    return { connection: await this.conn(), table: await this.t.tableId(this.real("bookings")), row: String(team) };
  }
  private async feedQuery(team: Id): Promise<string> {
    const ref = await this.feedRef(team);
    return `connection=${encodeURIComponent(ref.connection)}&table=${encodeURIComponent(ref.table)}&row=${encodeURIComponent(ref.row)}`;
  }
  private async teamQuery(team: Id): Promise<string> {
    const ref = await this.teamRef(team);
    return `connection=${encodeURIComponent(ref.connection)}&table=${encodeURIComponent(ref.table)}&row=${encodeURIComponent(ref.row)}`;
  }

  // ── who, and the desk ─────────────────────────────────────────────────────

  who(): Person {
    const prefix = `${APP_KEY}-`;
    const roles = (this.cfg.access?.roles ?? []).map((r) => r.slug).filter((slug) => slug.startsWith(prefix)).map((slug) => slug.slice(prefix.length));
    const access = this.cfg.access;
    return {
      id: this.cfg.user?.id ?? null,
      name: this.cfg.user?.name ?? "",
      roles,
      can: (table: Table, action: Action) => access === null || (access.tables[table]?.includes(action) ?? access.tables[this.real(table)]?.includes(action) ?? false),
    };
  }

  facts(): DeskFacts {
    return {
      zone: this.cfg.timezone ?? this.cfg.serverTimezone ?? "UTC",
      currency: this.cfg.currency ?? "USD",
      addOns: Object.keys(this.cfg.addOns),
      connectionId: this.cfg.connectionId,
    };
  }

  now(): number {
    return Date.now() + this.skew;
  }

  moderates(): boolean {
    if (!Object.keys(this.cfg.addOns).includes("forms")) return false;
    const access = this.cfg.access;
    return access === null || (access.tables[this.realAddOn("forms", "reviews")]?.includes("update") ?? access.tables["forms:reviews"]?.includes("update") ?? false);
  }

  /** What this person may open in Adminium's console, so a link they could not follow is not drawn (ACC-12). */
  systemActions(): Promise<readonly string[]> {
    this.actions ??= this.t
      .get<{ data?: { systemActions?: string[] } }>("/api/v1/bootstrap")
      .then((reply) => reply.data?.systemActions ?? [])
      .catch(() => []);
    return this.actions;
  }

  payments(): StaffPayments | null {
    return this.cfg.payments ?? null;
  }

  async signOut(): Promise<void> {
    await this.run(async () => {
      await this.t.port.config();
      await this.t.mutate("/api/v1/auth/logout", "POST", {});
    });
  }

  load(): Promise<DeskData> {
    return this.run(async () => {
      // The session's write token comes with the first read.
      await this.t.port.config();
      const [settings, openingHours, closures, categories, services, team, teamServices, teamHours, timeOff, customers, waitlist, bookings, payments, messages] = await Promise.all([
        this.list("settings"),
        this.list("opening_hours"),
        this.list("closures", "from_date.asc"),
        this.list("categories", "position.asc,id.asc"),
        this.list("services", "position.asc,id.asc"),
        this.list("team", "position.asc,id.asc"),
        this.list("team_services"),
        this.list("team_hours"),
        this.list("time_off", "starts_at.asc"),
        this.list("customers", "id.asc"),
        this.list("waitlist", "day.asc,id.asc"),
        this.list("bookings", "starts_at.asc,id.asc"),
        this.list("payments", "id.asc"),
        this.list("messages", "id.asc"),
      ]);
      const [reviews, offers, calendars, clashes, capReached] = await Promise.all([this.keep("reviews", () => this.reviews()), this.keep("offers", () => this.offers(customers)), this.keep("calendars", () => this.calendars(team)), this.clashes(), this.capReached()]);
      return { settings: settings[0] ?? null, openingHours, closures, categories, services, team, teamServices, teamHours, timeOff, customers, waitlist, bookings, payments, messages, reviews, offers, calendars, clashes, capReached };
    });
  }

  private async reviews(): Promise<ReviewRows | null> {
    const where = { column: "app", op: "eq", value: APP_KEY };
    const [reviews, totals] = await Promise.all([this.listAddOn("forms", "reviews", { where, order: "submitted_at.desc" }), this.listAddOn("forms", "review_totals", { where })]);
    if (reviews === null) return null;
    return { reviews, totals: totals ?? [] };
  }

  /** Packs held and gift cards, joined to a client by their e-mail. Never a card's code: the last characters at most. */
  private async offers(customers: Row[]): Promise<Record<string, OfferLine[]> | null> {
    const [vouchers, cards] = await Promise.all([this.listAddOn("offers", "vouchers"), this.listAddOn("offers", "gift_cards")]);
    if (vouchers === null && cards === null) return null;
    const byEmail = new Map(customers.filter((c) => typeof c["email"] === "string").map((c) => [String(c["email"]).toLowerCase(), String(c.id)]));
    const out: Record<string, OfferLine[]> = {};
    const add = (email: unknown, line: OfferLine) => {
      const id = typeof email === "string" ? byEmail.get(email.toLowerCase()) : undefined;
      if (id !== undefined) (out[id] ??= []).push(line);
    };
    for (const v of vouchers ?? []) {
      if (v["uses_total"] === null || v["uses_total"] === undefined) continue;
      add(v["holder_email"], { key: `v${String(v.id)}`, kind: "pack", title: String(v["public_name"] ?? ""), sub: "", figure: `${str(v["uses_taken"])}/${str(v["uses_total"])}` });
    }
    for (const c of cards ?? []) {
      const line: OfferLine = { key: `c${String(c.id)}`, kind: "card", title: String(c["label"] ?? ""), sub: String(c["recipient_name"] ?? ""), figure: str(c["balance"]) };
      add(c["owner_email"], line);
      if (c["recipient_email"] !== c["owner_email"]) add(c["recipient_email"], line);
    }
    return out;
  }

  private async calendars(team: Row[]): Promise<Record<string, PersonCalendar>> {
    const out: Record<string, PersonCalendar> = {};
    await Promise.all(
      team.map(async (person) => {
        try {
          const query = await this.teamQuery(person.id);
          const [row, sync] = await Promise.all([
            this.t.get<Omit<PersonCalendar, "sync">>(`/api/v1/connected-accounts?${query}`),
            this.t.get<{ calendar: CalendarSyncState | null }>(`/api/v1/calendar-sync/row?${query}`).catch((error: unknown) => {
              if (absent(error)) return { calendar: null };
              throw error;
            }),
          ]);
          out[String(person.id)] = { accounts: row.accounts as CalendarAccount[], providers: row.providers, reach: row.reach, may: row.may, sync: sync.calendar };
        } catch (error) {
          if (!absent(error)) throw error;
        }
      }),
    );
    return out;
  }

  private async clashes(): Promise<Clash[] | null> {
    try {
      const query = `connection=${encodeURIComponent(await this.conn())}&table=${encodeURIComponent(await this.t.tableId(this.real("bookings")))}`;
      const clashes = (await this.t.get<{ clashes: Clash[] }>(`/api/v1/calendar-sync/clashes?${query}`)).clashes;
      // The sentence names the whole busy time: read for each clash still open, on its own day.
      const zone = this.facts().zone;
      const read = new Map<string, Promise<BusyBlock[]>>();
      return await Promise.all(
        clashes.map(async (clash) => {
          if (clash.kept) return clash;
          const day = dayIn(clash.overlapStart, zone);
          const once = `${clash.resource}|${day}`;
          if (!read.has(once)) read.set(once, this.busy(clash.resource, day, addDays(day, 1)).catch(() => []));
          const blocks = await read.get(once)!;
          const block = blocks.find((one) => one.start <= clash.overlapStart && one.end >= clash.overlapEnd);
          return block === undefined ? clash : { ...clash, block };
        }),
      );
    } catch (error) {
      if (absent(error)) return null;
      throw error;
    }
  }

  private async capReached(): Promise<number | null> {
    try {
      return (await this.t.get<{ data: { lastHour: number } }>(await this.path(this.real("bookings"), "/public-cap-reached"))).data.lastHour;
    } catch (error) {
      // An engine without this read takes the word for a row's key, and each database refuses that its own way (a 400, or
      // Postgres's 500). One missing "Needs you" row must not stop the desk; only a lost session goes on up.
      if (error instanceof SessionPortError && error.status !== 401) return null;
      throw error;
    }
  }

  // ── free times ────────────────────────────────────────────────────────────

  private slotQuery(input: { service: Id; person: Id | null; exclude?: Id | null }): string {
    const person = input.person === null ? "" : `&resource=${encodeURIComponent(String(input.person))}`;
    const exclude = input.exclude === null || input.exclude === undefined ? "" : `&exclude=${encodeURIComponent(String(input.exclude))}`;
    return `kind=${encodeURIComponent(String(input.service))}${person}${exclude}`;
  }

  slots(input: { service: Id; person: Id | null; day: string; exclude?: Id | null }): Promise<Slot[]> {
    return this.run(async () => (await this.t.get<{ data: Slot[] }>(await this.path(this.real("bookings"), `/booking-slots?${this.slotQuery(input)}&date=${input.day}`))).data);
  }

  days(input: { service: Id; person: Id | null; from: string; days: number; exclude?: Id | null }): Promise<DayCount[]> {
    return this.run(async () => (await this.t.get<{ data: DayCount[] }>(await this.path(this.real("bookings"), `/booking-slots?${this.slotQuery(input)}&from=${input.from}&days=${String(input.days)}`))).data);
  }

  busy(team: Id, from: string, to: string): Promise<BusyBlock[]> {
    return this.run(async () => {
      try {
        return (await this.t.get<{ busy: BusyBlock[] }>(`/api/v1/calendar-sync/busy?${await this.teamQuery(team)}&from=${from}&to=${to}`)).busy;
      } catch (error) {
        if (absent(error)) return [];
        throw error;
      }
    });
  }

  // ── bookings ──────────────────────────────────────────────────────────────

  createBooking(input: NewBooking): Promise<Row> {
    return this.run(() =>
      this.create("bookings", {
        service_id: input.service,
        team_id: input.person,
        customer_id: input.customer.id,
        name: input.customer.name,
        email: input.customer.email,
        phone: input.customer.phone,
        // The mails about this visit are written in the language the customer's own row keeps.
        ...(input.customer.language ? { language: input.customer.language } : {}),
        starts_at: input.startsAt,
        channel: "desk",
        ...(input.depositLink ? { state: "paying", ask_online: true, deposit_link: true } : {}),
      }, input.key),
    );
  }

  moveBooking(booking: Row, to: string, values: Record<string, unknown> = {}): Promise<Row> {
    return this.run(() => this.change("bookings", booking.id, { state: to, ...values }, String(booking["state"])));
  }

  saveBooking(booking: Row, values: Record<string, unknown>): Promise<Row> {
    return this.run(() => this.change("bookings", booking.id, values));
  }

  panel(booking: Row): Promise<PaymentPanel | null> {
    return this.run(async () => {
      await this.t.port.config();
      const reply = await this.t.mutate<{ data: Record<string, unknown> | null }>("/api/v1/payments/panel", "POST", {
        connectionId: await this.conn(),
        table: await this.t.tableId(this.real("bookings")),
        recordId: String(booking.id),
      });
      const p = reply.data;
      if (p === null || p === undefined) return null;
      const payments = Array.isArray(p["payments"]) ? (p["payments"] as Record<string, unknown>[]) : [];
      const refusal = (value: unknown): string | null => (value !== null && typeof value === "object" ? String((value as Record<string, unknown>)["message"] ?? "") || null : null);
      return {
        currency: String(p["currency"] ?? ""),
        total: str(p["total"]),
        due: str(p["due"]),
        paid: str(p["paid"]),
        mayRefund: p["mayRefund"] === true,
        waiting: Array.isArray(p["waiting"]) && p["waiting"].length > 0,
        payments: payments.map(
          (one): PanelPayment => ({
            attemptId: typeof one["attemptId"] === "string" ? one["attemptId"] : null,
            amount: str(one["amount"]),
            method: String(one["method"] ?? ""),
            provider: typeof one["provider"] === "string" ? one["provider"] : null,
            test: one["test"] === true,
            paidOn: String(one["paidOn"] ?? ""),
            refundable: str(one["refundable"]),
            refundRefusal: refusal(one["refundRefusal"]),
          }),
        ),
      };
    });
  }

  refund(input: { attemptId: string; amount: string; reason: string; note: string; key: string }): Promise<{ state: string; failureMessage: string | null }> {
    return this.run(async () => {
      await this.t.port.config();
      const reply = await this.t.mutate<{ data: { refund: { state: string; failureMessage: string | null } } }>("/api/v1/payments/refunds", "POST", { attemptId: input.attemptId, amount: input.amount, reason: input.reason, note: input.note, key: input.key });
      return { state: reply.data.refund.state, failureMessage: reply.data.refund.failureMessage };
    });
  }

  // ── the rest of the studio ────────────────────────────────────────────────

  createCustomer(values: { name: string; email: string | null; phone: string | null }): Promise<Row> {
    return this.run(() => this.create("customers", values));
  }
  saveCustomer(customer: Row, values: Record<string, unknown>): Promise<Row> {
    return this.run(() => this.change("customers", customer.id, values));
  }
  createService(values: Record<string, unknown>): Promise<Row> {
    return this.run(() => this.create("services", values));
  }
  saveService(service: Row, values: Record<string, unknown>): Promise<Row> {
    return this.run(() => this.change("services", service.id, values));
  }
  addServicePerson(service: Id, team: Id): Promise<Row> {
    return this.run(() => this.create("team_services", { service_id: service, team_id: team }));
  }
  removeServicePerson(link: Row): Promise<void> {
    return this.run(() => this.remove("team_services", link.id));
  }
  saveTeam(person: Row, values: Record<string, unknown>): Promise<Row> {
    return this.run(() => this.change("team", person.id, values));
  }
  addTimeOff(values: { team_id: Id; starts_at: string; ends_at: string; why: string | null }): Promise<Row> {
    return this.run(() => this.create("time_off", values));
  }
  removeTimeOff(row: Row): Promise<void> {
    return this.run(() => this.remove("time_off", row.id));
  }
  offerTime(input: { entry: Row; person: Id; startsAt: string; key: string }): Promise<Row> {
    const { entry } = input;
    return this.run(() =>
      this.create("bookings", {
        state: "offered",
        waitlist_id: entry.id,
        service_id: entry["service_id"],
        team_id: input.person,
        customer_id: entry["customer_id"] ?? null,
        name: entry["name"],
        email: entry["email"],
        language: entry["language"] ?? null,
        starts_at: input.startsAt,
        channel: "desk",
      }, input.key),
    );
  }
  closeWaiting(entry: Row): Promise<Row> {
    return this.run(() => this.change("waitlist", entry.id, { state: "closed" }, String(entry["state"])));
  }
  saveReview(review: Row, values: Record<string, unknown>): Promise<Row> {
    return this.run(() =>
      this.writing("reviews", async () => {
        const real = this.realAddOn("forms", "reviews");
        const path = await this.path(real, `/${encodeURIComponent(String(review.id))}`);
        return this.row("reviews", (await this.t.mutate<{ data: Row }>(path, "PATCH", { values })).data);
      }),
    );
  }
  saveSettings(settings: Row, values: Record<string, unknown>): Promise<Row> {
    return this.run(() => this.change("settings", settings.id, values));
  }
  addClosure(values: { from_date: string; to_date: string; name: string }): Promise<Row> {
    return this.run(() => this.create("closures", { ...values, active: true }));
  }

  // ── calendars ─────────────────────────────────────────────────────────────

  keepClash(clash: Clash): Promise<void> {
    return this.run(async () => {
      await this.t.mutate("/api/v1/calendar-sync/clashes/keep", "POST", {
        connection: await this.conn(),
        table: await this.t.tableId(this.real("bookings")),
        row: clash.row,
        overlapStart: clash.overlapStart,
        overlapEnd: clash.overlapEnd,
      });
    });
  }
  syncNow(team: Id): Promise<void> {
    return this.run(() =>
      this.writing("calendars", async () => {
        await this.t.mutate("/api/v1/calendar-sync/row/sync-now", "POST", await this.teamRef(team));
      }),
    );
  }
  saveCalendarChoices(team: Id, choices: { readCalendars?: string[] | null; countAllDay?: boolean; detail?: "first-name+initial" | "none"; resume?: true }): Promise<void> {
    return this.run(() =>
      this.writing("calendars", async () => {
        await this.t.mutate("/api/v1/calendar-sync/row/choices", "POST", { ...(await this.teamRef(team)), ...choices });
      }),
    );
  }
  connectCalendar(team: Id, addOn: string): Promise<string> {
    return this.run(async () => (await this.t.mutate<{ url: string }>("/api/v1/connected-accounts/connect", "POST", { ...(await this.teamRef(team)), addOn })).url);
  }
  sendConnectLink(team: Id): Promise<string | null> {
    return this.run(async () => (await this.t.mutate<{ sentTo: string | null }>("/api/v1/connected-accounts/link", "POST", await this.teamRef(team))).sentTo);
  }
  copyConnectLink(team: Id): Promise<string> {
    return this.run(async () => {
      const reply = await this.t.mutate<{ url: string | null }>("/api/v1/connected-accounts/link", "POST", { ...(await this.teamRef(team)), copy: true });
      if (reply.url === null) throw new ApiError(409, "NO_LINK", "No link came back.");
      return reply.url;
    });
  }
  feedLink(team: Id): Promise<{ link: string | null; own: boolean } | null> {
    return this.run(async () => {
      try {
        return (await this.t.get<{ data: { link: string | null; own: boolean } }>(`/api/v1/calendar-feed?${await this.feedQuery(team)}`)).data;
      } catch (error) {
        if (absent(error)) return null;
        throw error;
      }
    });
  }
  renewFeed(team: Id): Promise<{ link: string | null; own: boolean }> {
    return this.run(async () => (await this.t.mutate<{ data: { link: string | null; own: boolean } }>("/api/v1/calendar-feed/renew", "POST", await this.feedRef(team))).data);
  }
  embeds(): Promise<EmbedFacts | null> {
    return this.run(async () => {
      try {
        const [sites, embeds] = await Promise.all([
          this.t.get<{ data: { websites: { origin: string }[] } }>("/api/v1/privacy/websites"),
          this.t.get<{ data: { apps: { app: string; mount: string; modes: EmbedFacts["modes"]; screens: { path: string; choose: { query: string; values: { value: string; label: string }[] } | null }[] }[] } }>("/api/v1/privacy/embeds"),
        ]);
        const app = embeds.data.apps.find((one) => one.app === APP_KEY || one.app.startsWith(`${APP_KEY}~`));
        const origins = sites.data.websites.map((one) => one.origin);
        if (app === undefined) return { origin: window.location.origin, sites: origins, app: APP_KEY, mount: "", path: "/", modes: [], services: [], query: null };
        const screen = app.screens.find((one) => one.choose !== null) ?? app.screens[0];
        return { origin: window.location.origin, sites: origins, app: app.app, mount: app.mount, path: screen?.path ?? "/", modes: app.modes, services: screen?.choose?.values ?? [], query: screen?.choose?.query ?? null };
      } catch (error) {
        if (absent(error)) return null;
        throw error;
      }
    });
  }
  disconnectCalendar(team: Id, addOn: string): Promise<void> {
    return this.run(() =>
      this.writing("calendars", async () => {
        await this.t.mutate("/api/v1/connected-accounts/disconnect", "POST", { ...(await this.teamRef(team)), addOn });
      }),
    );
  }
}
