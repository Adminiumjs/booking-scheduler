/**
 * The customer pages' door into Adminium: the public API, through two browser
 * keys, one client each.
 *
 *   customer  the studio's public face, the three booking doors, the waiting
 *             list, and, once signed in with an e-mailed code, the person's own
 *             bookings, packs and cards;
 *   link      one booking, by the code in its link's fragment.
 *
 * Every figure and every yes or no is Adminium's. The page never sends a price,
 * and a refusal comes back as the server's own code, for `rules.ts` to word.
 *
 * Entries are found in the key's own config, by table and by what they may do,
 * in the order the manifest lists them (`src/manifest/public.ts`).
 */
import {
  createPublicClient,
  newClientKey,
  PublicApiError,
  type HeldSession,
  type PublicClient,
  type PublicConfig,
  type PublicRefConfig,
  type Row,
} from "@adminiumjs/public-client";
import { frameStore } from "@adminiumjs/public-client/frame";

import type { DoorName } from "./rules.ts";

export type { Row };

export interface Served {
  baseUrl: string;
  publishableKey: string;
  tables?: Record<string, string>;
  publicKeys?: Record<string, string>;
  rehearsalToken?: string;
  addOns?: Record<string, { present?: boolean }>;
  frameOrigins?: string[];
}

export interface DoorOptions {
  framed?: boolean;
  fetch?: typeof fetch;
  humanCheck?: boolean;
}

const PREFIX = "bookings_";
const suffixOf = (ref: string) => Number(/_(\d+)$/.exec(ref)?.[1] ?? 1);
const has = (entry: PublicRefConfig, action: PublicRefConfig["actions"][number]) => entry.actions.includes(action);

/** The refs of one table on one key, in the manifest's order. */
function entriesOf(config: PublicConfig, table: string): [string, PublicRefConfig][] {
  return Object.entries(config.refs)
    .filter(([ref]) => ref === table || new RegExp(`^${table}_(claimed|verified|availability|\\d)`).test(ref))
    .sort(([a], [b]) => suffixOf(a) - suffixOf(b));
}

export interface CustomerRefs {
  settings: string;
  categories: string;
  services: string;
  team: string;
  teamServices: string;
  hours: string;
  closures: string;
  giftAmounts: string;
  packs: string;
  availability: string;
  customer: string | null;
  doors: Record<DoorName, string>;
  join: string | null;
  buyCard: string | null;
  buyPack: string | null;
  myBookings: string[];
  myWaitlist: string | null;
  leaveList: string | null;
  myPurchases: string | null;
  cancel: string | null;
  move: string | null;
  pay: string | null;
  google: string | null;
  letOfferGo: string | null;
}

export interface LinkRefs {
  read: string;
  cancel: string;
  move: string;
  pay: string;
  google: string;
  takeBooked: string;
  takePaying: string;
  letOfferGo: string | null;
  codes: string | null;
}

export function customerRefs(config: PublicConfig, tables: Readonly<Record<string, string>> = {}): CustomerRefs {
  const t = (name: string) => tables[name] ?? `${PREFIX}${name}`;
  const of = (name: string) => entriesOf(config, t(name));
  const read = (name: string) => of(name).find(([, e]) => has(e, "read"))?.[0] ?? t(name);
  const bookings = of("bookings");
  const creates = bookings.filter(([, e]) => has(e, "create")).map(([r]) => r);
  const reads = bookings.filter(([, e]) => has(e, "read") && e.kind !== "availability").map(([r]) => r);
  const updates = bookings.filter(([, e]) => has(e, "update"));
  const updating = (column: string) => updates.find(([, e]) => e.writable.includes(column))?.[0] ?? null;
  const purchases = of("purchases");
  const purchaseCreates = purchases.filter(([, e]) => has(e, "create")).map(([r]) => r);
  const waitlist = of("waitlist");
  return {
    settings: read("settings"),
    categories: read("categories"),
    services: read("services"),
    team: read("team"),
    teamServices: read("team_services"),
    hours: read("opening_hours"),
    closures: read("closures"),
    giftAmounts: read("gift_amounts"),
    packs: read("pack_products"),
    availability: bookings.find(([, e]) => e.kind === "availability")?.[0] ?? `${t("bookings")}_availability`,
    customer: config.claim?.ref ?? null,
    doors: { studio: creates[0] ?? "", money: creates[1] ?? "", off: creates[2] ?? "" },
    join: waitlist.find(([, e]) => has(e, "create"))?.[0] ?? null,
    buyCard: purchaseCreates[0] ?? null,
    buyPack: purchaseCreates[1] ?? null,
    myBookings: reads,
    myWaitlist: waitlist.find(([, e]) => has(e, "read"))?.[0] ?? null,
    leaveList: waitlist.find(([, e]) => has(e, "update"))?.[0] ?? null,
    myPurchases: purchases.find(([, e]) => has(e, "read"))?.[0] ?? null,
    cancel: updates.find(([, e]) => e.writable.length === 1 && e.writable[0] === "state")?.[0] ?? null,
    move: updating("starts_at"),
    pay: updating("pay_started"),
    google: updating("google_pressed"),
    letOfferGo: updating("lapsed_by"),
  };
}

export function linkRefs(config: PublicConfig, tables: Readonly<Record<string, string>> = {}): LinkRefs {
  const table = tables["bookings"] ?? `${PREFIX}bookings`;
  const entries = entriesOf(config, table);
  const read = entries.find(([, e]) => has(e, "read"))?.[0] ?? `${table}_claimed`;
  const updates = entries.filter(([, e]) => has(e, "update"));
  const stateOnly = updates.filter(([, e]) => e.writable.length === 1 && e.writable[0] === "state").map(([r]) => r);
  const updating = (column: string) => updates.find(([, e]) => e.writable.includes(column))?.[0] ?? "";
  const codesTable = tables["booking_codes"] ?? `${PREFIX}booking_codes`;
  return {
    read,
    cancel: stateOnly[0] ?? "",
    move: updating("starts_at"),
    pay: updating("pay_started"),
    google: updating("google_pressed"),
    takeBooked: stateOnly[1] ?? "",
    takePaying: stateOnly[2] ?? "",
    letOfferGo: updates.find(([, e]) => e.writable.includes("lapsed_by"))?.[0] ?? null,
    codes: Object.keys(config.refs).find((r) => r.startsWith(codesTable)) ?? null,
  };
}

// ── where a session is kept ─────────────────────────────────────────────────

type Store = { get(key: string): string | null; set(key: string, value: string): void; remove(key: string): void };

function tabStore(): Store {
  return {
    get(key) {
      try {
        return sessionStorage.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        sessionStorage.setItem(key, value);
      } catch {
        // kept for the page's life only
      }
    },
    remove(key) {
      try {
        sessionStorage.removeItem(key);
      } catch {
        // nothing kept
      }
    },
  };
}

const slot = (purpose: string) => `lumen.session.${purpose}`;

function readSession(store: Store, purpose: string): HeldSession | undefined {
  try {
    const raw = store.get(slot(purpose));
    if (raw === null) return undefined;
    const held = JSON.parse(raw) as HeldSession;
    return typeof held?.token === "string" && typeof held.expiresAt === "number" && held.expiresAt > Date.now() ? held : undefined;
  } catch {
    return undefined;
  }
}

// ── the door ────────────────────────────────────────────────────────────────

export interface Booked {
  row: Row;
  /** The new booking's own link code. Never kept in an address the server logs. */
  token: string | null;
  payUrl: string | null;
  replayed: boolean;
}

export interface BookingValues {
  service_id: unknown;
  team_id?: unknown;
  starts_at: string;
  name: string;
  email: string;
  phone?: string;
  note?: string;
  language: string;
  channel: "page" | "embed";
  no_review?: boolean;
}

export interface Held {
  packs: Row[];
  cards: Row[];
}

export interface StudioRows {
  settings: Row;
  categories: Row[];
  services: Row[];
  team: Row[];
  teamServices: Row[];
  hours: Row[];
  closures: Row[];
  giftAmounts: Row[];
  packs: Row[];
  paymentsOnline: boolean;
  timezone: string;
  currency: string;
  now: Date;
}

export interface ReviewPage {
  count: number;
  average: number;
  /** Five stars first. */
  bars: number[];
  list: Row[];
  next: string | null;
}

export interface ReviewLink {
  open: boolean;
  reviewedAt: string | null;
  shownName: string;
  about: string;
  detail: string | null;
}

export class LumenDoor {
  readonly client: PublicClient;
  readonly linkClient: PublicClient | null;
  readonly served: Served;
  private readonly store: Store;
  private readonly fetchImpl: typeof fetch;
  private refsCache: Promise<CustomerRefs> | null = null;
  private linkRefsCache: Promise<LinkRefs> | null = null;

  constructor(served: Served, options: DoorOptions = {}) {
    this.served = served;
    this.fetchImpl = options.fetch ?? ((...args) => globalThis.fetch(...args));
    this.store = options.framed === true ? frameStore() : tabStore();
    const common = {
      baseUrl: served.baseUrl,
      ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
      ...(options.humanCheck === undefined ? {} : { humanCheck: options.humanCheck }),
      ...(options.framed === true ? { framed: true } : {}),
      ...(served.rehearsalToken === undefined ? {} : { csrfToken: served.rehearsalToken }),
    };
    const make = (publishableKey: string, purpose: string) => {
      const session = readSession(this.store, purpose);
      return createPublicClient({
        ...common,
        publishableKey,
        ...(session === undefined ? {} : { session }),
        onSessionChange: (held: HeldSession | null) => {
          if (held === null) this.store.remove(slot(purpose));
          else this.store.set(slot(purpose), JSON.stringify(held));
        },
      });
    };
    const main = make(served.publishableKey, "customer");
    if (main === null) throw new Error("no Adminium to talk to");
    this.client = main;
    const linkKey = served.publicKeys?.["link"];
    this.linkClient = linkKey === undefined ? null : make(linkKey, "link");
  }

  refs(): Promise<CustomerRefs> {
    this.refsCache ??= this.client.config().then((config) => customerRefs(config, this.served.tables));
    return this.refsCache;
  }

  linkRefs(): Promise<LinkRefs> {
    if (this.linkClient === null) return Promise.reject(new Error("no link key"));
    this.linkRefsCache ??= this.linkClient.config().then((config) => linkRefs(config, this.served.tables));
    return this.linkRefsCache;
  }

  addOn(key: string): boolean {
    return this.served.addOns?.[key]?.present === true;
  }

  /** A call the client has no word for, with the session and key of the client it goes through. */
  async raw<T>(client: PublicClient, key: string, path: string, init: RequestInit = {}): Promise<T> {
    const session = client.session();
    const headers: Record<string, string> = {
      authorization: `Bearer ${key}`,
      ...(init.body === undefined ? {} : { "content-type": "application/json" }),
      ...(session === null ? {} : { "x-adminium-public-session": session.token }),
      ...(init.method !== undefined && init.method !== "GET" && this.served.rehearsalToken !== undefined ? { "x-adminium-csrf": this.served.rehearsalToken } : {}),
    };
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.served.baseUrl}${path}`, { ...init, headers });
    } catch (cause) {
      throw new PublicApiError("PUBLIC_NETWORK_UNAVAILABLE", 0, `could not reach ${this.served.baseUrl}: ${String(cause)}`, undefined, {});
    }
    const body = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string; params?: Record<string, unknown> } } | null;
    if (!res.ok) {
      const error = body?.error;
      throw new PublicApiError((error?.code ?? "PUBLIC_UPSTREAM_UNAVAILABLE") as never, res.status, error?.message ?? `HTTP ${String(res.status)}`, undefined, error?.params ?? {});
    }
    return body as T;
  }

  // ── making a booking ──────────────────────────────────────────────────────

  async book(door: DoorName, values: BookingValues, clientKey: string, children?: { codes?: string[]; card?: string | null }): Promise<Booked> {
    const refs = await this.refs();
    const { no_review: noReview, ...sent } = values;
    const config = await this.client.config();
    // The box is the person's standing "no" (cQ10), through the door's own column.
    const takesBox = config.refs[refs.doors[door]]?.writable.includes("no_review_request") === true;
    const write = { ...sent, ...(takesBox && noReview === true ? { no_review_request: true } : {}), client_key: clientKey };
    const kids = {
      ...(children?.codes !== undefined && children.codes.length > 0 ? { booking_codes: children.codes.map((typed) => ({ values: { typed } })) } : {}),
      ...(children?.card ? { payments: [{ values: { card_code: children.card } }] } : {}),
    };
    const made = await this.client.createTree<Row>(refs.doors[door], { values: write, ...(Object.keys(kids).length === 0 ? {} : { children: kids }) });
    if (made.link?.session !== null && made.link?.session !== undefined && this.linkClient !== null) {
      this.linkClient.adoptSession({ token: made.link.session, expiresAt: made.link.expiresAt ?? Date.now() + 3_600_000, level: "verified" });
    }
    return { row: made.data, token: made.link?.token ?? null, payUrl: made.payUrl, replayed: made.replayed };
  }

  newKey(): string {
    return newClientKey();
  }

  // ── the studio ────────────────────────────────────────────────────────────

  async studio(): Promise<StudioRows> {
    const [config, refs] = await Promise.all([this.client.config(), this.refs()]);
    const all = async (ref: string, limit = 100) => (await this.client.list<Row>(ref, { limit })).data;
    const quiet = async (ref: string) => {
      try {
        return await all(ref);
      } catch {
        return [];
      }
    };
    const [settings, categories, services, team, teamServices, hours, closures, giftAmounts, packs, payments] = await Promise.all([
      all(refs.settings, 1),
      all(refs.categories),
      all(refs.services),
      all(refs.team),
      all(refs.teamServices),
      all(refs.hours),
      quiet(refs.closures),
      quiet(refs.giftAmounts),
      quiet(refs.packs),
      this.client.payments.available().catch(() => ({ online: false })),
    ]);
    return {
      settings: settings[0] ?? {},
      categories,
      services,
      team,
      teamServices,
      hours,
      closures,
      giftAmounts,
      packs,
      paymentsOnline: payments.online,
      timezone: config.timezone,
      currency: config.currency ?? "USD",
      now: await this.client.now(),
    };
  }

  async days(kind: string, who: string | null, from: string, days: number, exclude?: string, signal?: AbortSignal) {
    const refs = await this.refs();
    return this.client.bookingDays(refs.availability, { kind, resource: who ?? "any", from, days, ...(exclude === undefined ? {} : { exclude }) }, signal);
  }

  async times(kind: string, who: string | null, date: string, exclude?: string, signal?: AbortSignal) {
    const refs = await this.refs();
    return this.client.bookingTimes(refs.availability, { kind, resource: who ?? "any", date, ...(exclude === undefined ? {} : { exclude }) }, signal);
  }

  // ── signing in ────────────────────────────────────────────────────────────

  requestSignIn(email: string, lang: string) {
    return this.client.requestLink({ email, lang });
  }

  verifySignIn(email: string, code: string) {
    return this.client.verifyLinkCode({ email, code });
  }

  openSignInLink(token: string) {
    return this.client.openLink(token);
  }

  signedIn(): boolean {
    return this.client.session()?.level === "verified";
  }

  signOut() {
    return this.client.signOut();
  }

  async me(): Promise<Row | null> {
    const refs = await this.refs();
    if (refs.customer === null || !this.signedIn()) return null;
    return (await this.client.list<Row>(refs.customer, { limit: 1 })).data[0] ?? null;
  }

  async setAskReviews(id: unknown, on: boolean): Promise<void> {
    const refs = await this.refs();
    if (refs.customer !== null) await this.client.update(refs.customer, String(id), { review_requests: on });
  }

  async myBookings(): Promise<Row[]> {
    const refs = await this.refs();
    const lists = await Promise.all(refs.myBookings.map((ref) => this.client.list<Row>(ref, { limit: 100, order: "starts_at.desc" }).then((p) => p.data).catch(() => [] as Row[])));
    const byId = new Map<string, Row>();
    for (const row of lists.flat()) byId.set(String(row["id"]), row);
    return [...byId.values()];
  }

  async myWaitlist(): Promise<Row[]> {
    const refs = await this.refs();
    if (refs.myWaitlist === null) return [];
    return (await this.client.list<Row>(refs.myWaitlist, { limit: 50 })).data;
  }

  async leaveList(id: unknown): Promise<void> {
    const refs = await this.refs();
    if (refs.leaveList !== null) await this.client.update(refs.leaveList, String(id), { state: "closed" });
  }

  /** What Offers holds for the address this session proved. Without Offers: nothing. */
  async held(): Promise<Held> {
    const read = async (ref: string) => {
      try {
        return (await this.client.list<Row>(ref, { limit: 50 })).data;
      } catch {
        return [];
      }
    };
    const [packs, cards] = await Promise.all([read("offers_vouchers_verified"), read("offers_gift_cards_verified")]);
    return { packs, cards };
  }

  /** Cancels the visits ahead and leaves the list first (cQ29), then deletes the person's details. */
  async forgetMe(ahead: readonly Row[], waiting: readonly Row[]): Promise<void> {
    const refs = await this.refs();
    for (const row of ahead) {
      if (row["state"] === "booked" && refs.cancel !== null) await this.client.update(refs.cancel, String(row["id"]), { state: "cancelled" });
      if (row["state"] === "offered" && refs.letOfferGo !== null) await this.client.update(refs.letOfferGo, String(row["id"]), { state: "lapsed", lapsed_by: "guest" });
    }
    for (const row of waiting) if (row["state"] === "waiting") await this.leaveList(row["id"]);
    await this.client.forgetMe();
  }

  // ── changing a booking, signed in or by its link ──────────────────────────

  private async via(signedIn: boolean) {
    if (signedIn) {
      const r = await this.refs();
      return { client: this.client, cancel: r.cancel, move: r.move, pay: r.pay, google: r.google };
    }
    const r = await this.linkRefs();
    return { client: this.linkClient!, cancel: r.cancel, move: r.move, pay: r.pay, google: r.google };
  }

  async cancelBooking(id: unknown, signedIn: boolean): Promise<Row> {
    const v = await this.via(signedIn);
    return v.client.update<Row>(v.cancel!, String(id), { state: "cancelled" });
  }

  async moveBooking(id: unknown, startsAt: string, team: unknown, signedIn: boolean): Promise<Row> {
    const v = await this.via(signedIn);
    // Sent empty for "Anyone", so the engine picks again (BOOK-7).
    return v.client.update<Row>(v.move!, String(id), { starts_at: startsAt, team_id: team ?? null });
  }

  /** The moment Pay is pressed: the usual minutes start (MON-5). */
  async startPaying(id: unknown, signedIn: boolean): Promise<string> {
    const v = await this.via(signedIn);
    await v.client.update<Row>(v.pay!, String(id), { pay_started: true });
    return (await v.client.payments.start(v.pay!, String(id))).payUrl;
  }

  /** A deposit a card or a pack covered in full: nothing due, so it is booked with no payment (MON-3). */
  async nothingDue(id: unknown, signedIn: boolean): Promise<Row> {
    const v = await this.via(signedIn);
    return v.client.update<Row>(v.pay!, String(id), { state: "booked" });
  }

  async payState(id: unknown, signedIn: boolean) {
    const v = await this.via(signedIn);
    return v.client.payments.state(v.pay!, String(id));
  }

  async pressedGoogle(id: unknown, signedIn: boolean): Promise<void> {
    const v = await this.via(signedIn);
    await v.client.update(v.google!, String(id), { google_pressed: true }).catch(() => undefined);
  }

  async takeOffer(id: unknown, paying: boolean): Promise<Row> {
    const r = await this.linkRefs();
    return this.linkClient!.update<Row>(paying ? r.takePaying : r.takeBooked, String(id), { state: paying ? "paying" : "booked" });
  }

  // ── reviews ───────────────────────────────────────────────────────────────

  /** The published reviews and their totals. Null while reviews are off. */
  async reviews(limit: number, cursor?: string): Promise<ReviewPage | null> {
    try {
      const [totals, list] = await Promise.all([
        this.client.list<Row>("forms_review_totals", { limit: 20 }),
        this.client.list<Row>("forms_reviews", { order: "submitted_at.desc", limit, ...(cursor === undefined ? {} : { cursor }) }),
      ]);
      const sums = [5, 4, 3, 2, 1].map((n) => totals.data.reduce((a, r) => a + Number(r[`c${String(n)}`] ?? 0), 0));
      const count = totals.data.reduce((a, r) => a + Number(r["count"] ?? 0), 0);
      const sum = totals.data.reduce((a, r) => a + Number(r["sum"] ?? 0), 0);
      return { count, average: count === 0 ? 0 : sum / count, bars: sums, list: list.data, next: list.cursor?.next ?? null };
    } catch (error) {
      if (error instanceof PublicApiError && (error.status === 404 || error.code === "PUBLIC_SWITCHED_OFF" || error.code === "PUBLIC_REF_NOT_FOUND")) return null;
      throw error;
    }
  }

  /** The studio's row of the Google reviews add-on, once its owner has set it up. Null otherwise. */
  async googlePlace(): Promise<Row | null> {
    if (!this.addOn("google-reviews")) return null;
    try {
      return (await this.client.list<Row>("google_reviews_places", { limit: 1 })).data[0] ?? null;
    } catch {
      return null;
    }
  }

  readReviewLink(token: string) {
    return this.raw<{ data: ReviewLink }>(this.client, this.served.publishableKey, "/api/v1/public/review-link", { method: "POST", body: JSON.stringify({ token }) }).then((r) => r.data);
  }

  sendReviewLink(token: string, stars: number, body: string) {
    return this.raw(this.client, this.served.publishableKey, "/api/v1/public/review-link/take", { method: "POST", body: JSON.stringify({ token, stars, body: body.trim() === "" ? null : body.trim() }) });
  }

  private reviewPath(ref: string, id: unknown) {
    return `/api/v1/public/records/${ref}/${encodeURIComponent(String(id))}/review`;
  }

  async reviewState(id: unknown, signedIn: boolean): Promise<{ open: boolean; reviewedAt: string | null; shownName: string } | null> {
    try {
      if (signedIn) {
        const refs = await this.refs();
        return (await this.raw<{ data: { open: boolean; reviewedAt: string | null; shownName: string } }>(this.client, this.served.publishableKey, this.reviewPath(refs.myBookings[0]!, id))).data;
      }
      const refs = await this.linkRefs();
      return (await this.raw<{ data: { open: boolean; reviewedAt: string | null; shownName: string } }>(this.linkClient!, this.served.publicKeys!["link"]!, this.reviewPath(refs.read, id))).data;
    } catch {
      return null;
    }
  }

  async sendReview(id: unknown, signedIn: boolean, stars: number, body: string): Promise<void> {
    const payload = JSON.stringify({ stars, body: body.trim() === "" ? null : body.trim() });
    if (signedIn) {
      const refs = await this.refs();
      await this.raw(this.client, this.served.publishableKey, this.reviewPath(refs.myBookings[0]!, id), { method: "POST", body: payload });
      return;
    }
    const refs = await this.linkRefs();
    await this.raw(this.linkClient!, this.served.publicKeys!["link"]!, this.reviewPath(refs.read, id), { method: "POST", body: payload });
  }

  // ── gift cards and packs ──────────────────────────────────────────────────

  async buyCard(line: Row, buyer: Row, clientKey: string): Promise<{ row: Row; payUrl: string | null }> {
    const refs = await this.refs();
    const made = await this.client.createTree<Row>(refs.buyCard!, { values: { ...buyer, client_key: clientKey }, children: { purchase_lines: [{ values: { kind: "card", ...line } }] } });
    return { row: made.data, payUrl: made.payUrl };
  }

  async buyPack(packId: string, buyer: Row, clientKey: string): Promise<{ row: Row; payUrl: string | null }> {
    const refs = await this.refs();
    const made = await this.client.createTree<Row>(refs.buyPack!, { values: { ...buyer, client_key: clientKey }, children: { purchase_lines: [{ values: { kind: "pack", pack_id: packId } }] } });
    return { row: made.data, payUrl: made.payUrl };
  }

  async payPurchase(id: unknown): Promise<string> {
    const refs = await this.refs();
    return (await this.client.payments.start(refs.myPurchases ?? refs.buyCard!, String(id))).payUrl;
  }

  async purchaseState(id: string): Promise<string | null> {
    const refs = await this.refs();
    const ref = refs.myPurchases ?? refs.buyCard;
    if (ref === null) return null;
    return (await this.client.payments.state(ref, id)).state;
  }

  // ── the waiting list ──────────────────────────────────────────────────────

  async joinList(values: { service_id: unknown; team_id: unknown; day: string; name: string; email: string; language: string }, clientKey: string): Promise<void> {
    const refs = await this.refs();
    if (refs.join === null) throw new PublicApiError("PUBLIC_SWITCHED_OFF" as never, 403, "no waiting list", undefined, {});
    await this.client.create(refs.join, { ...values, ...(values.team_id === null ? { team_id: undefined } : {}), client_key: clientKey });
  }

  // ── one booking, by its own link ──────────────────────────────────────────

  async openLink(token: string): Promise<"opened" | "unknown" | "closed"> {
    if (this.linkClient === null) return "unknown";
    return this.linkClient.openShared(token);
  }

  async linkBooking(): Promise<Row | null> {
    if (this.linkClient === null || this.linkClient.session() === null) return null;
    const refs = await this.linkRefs();
    const page = await this.linkClient.list<Row>(refs.read, { limit: 1 });
    return page.data[0] ?? null;
  }

  async linkCalendar(id: unknown): Promise<{ ics: string; google: string; outlook: string } | null> {
    if (this.linkClient === null) return null;
    const refs = await this.linkRefs();
    const key = this.served.publicKeys?.["link"] ?? "";
    try {
      const out = await this.raw<{ data: { ics: string; google: string; outlook: string } }>(this.linkClient, key, `/api/v1/public/records/${refs.read}/${encodeURIComponent(String(id))}/calendar`);
      return out.data;
    } catch {
      return null;
    }
  }
}
