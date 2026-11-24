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
  type ForgetMeResult,
  type HeldSession,
  type PublicClient,
  type PublicConfig,
  type PublicRefConfig,
  type Row,
} from "@adminiumjs/public-client";
import { frameStore } from "@adminiumjs/public-client/frame";

import type { DoorName } from "./rules.ts";
import { forgetPurchase } from "./session.ts";

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
  takeBooked: string | null;
  takePaying: string | null;
}

export interface LinkRefs {
  read: string;
  availability: string | null;
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
  // In the manifest's order: the cancel, then taking an offer as it is, then through paying.
  const stateOnly = updates.filter(([, e]) => e.writable.length === 1 && e.writable[0] === "state").map(([r]) => r);
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
    cancel: stateOnly[0] ?? null,
    takeBooked: stateOnly[1] ?? null,
    takePaying: stateOnly[2] ?? null,
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
    availability: entries.find(([, e]) => e.kind === "availability")?.[0] ?? null,
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
const PROVED_SLOT = "lumen.proved-at";
const FORGET_WITHIN_MS = 9 * 60_000;

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
  /** The box for texts, ticked (plan 80). Sent only with a number it can stand for. */
  texts?: boolean;
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
  /** Where the next page starts; null at the end. */
  next: number | null;
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
  /** One sale, by its own link: only for the way back from the pay page. */
  readonly saleClient: PublicClient | null;
  readonly served: Served;
  private readonly store: Store;
  private readonly fetchImpl: typeof fetch;
  private refsCache: Promise<CustomerRefs> | null = null;
  private linkRefsCache: Promise<LinkRefs> | null = null;
  private provedAt: number | null = null;

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
    const saleKey = served.publicKeys?.["sale"];
    this.saleClient = saleKey === undefined ? null : make(saleKey, "sale");
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

  /**
   * Whether the studio can send texts at all (a provider and a sender set, texts not switched off): the box for texts is drawn
   * only then (plan 80). It says nothing of the account. The client's own `texts.ready()` where it has one (0.3.76), else the
   * same route. Any doubt hides the box: a guest is never asked for a yes to texts that cannot go.
   */
  async textsReady(): Promise<boolean> {
    try {
      const own = (this.client as unknown as { texts?: { ready?: () => Promise<boolean> } }).texts;
      if (typeof own?.ready === "function") return (await own.ready()) === true;
      return (await this.raw<{ data: { ready?: boolean } }>(this.client, this.served.publishableKey, "/api/v1/public/texts")).data.ready === true;
    } catch {
      return false;
    }
  }

  async book(door: DoorName, values: BookingValues, clientKey: string, children?: { codes?: string[]; card?: string | null }): Promise<Booked> {
    const refs = await this.refs();
    const { no_review: noReview, texts, ...sent } = values;
    const config = await this.client.config();
    // The box is the person's standing "no" (cQ10), through the door's own column.
    const writable = config.refs[refs.doors[door]]?.writable ?? [];
    const takesBox = writable.includes("no_review_request");
    // The box for texts is its own column: a yes to texts about this booking, for the number typed (plan 80). Never sent unticked.
    const takesTexts = writable.includes("texts_ok") && texts === true && sent.phone !== undefined;
    const write = { ...sent, ...(takesBox && noReview === true ? { no_review_request: true } : {}), ...(takesTexts ? { texts_ok: true } : {}), client_key: clientKey };
    const kids = {
      ...(children?.codes !== undefined && children.codes.length > 0 ? { booking_codes: children.codes.map((typed) => ({ values: { typed } })) } : {}),
      ...(children?.card ? { payments: [{ values: { card_code: children.card } }] } : {}),
    };
    const made = await this.client.createTree<Row>(refs.doors[door], { values: write, ...(Object.keys(kids).length === 0 ? {} : { children: kids }) });
    this.holdLink(made.link);
    return { row: made.data, token: made.link?.token ?? null, payUrl: made.payUrl, replayed: made.replayed };
  }

  /** The session a create handed over on the row's own link. */
  private holdLink(link: { session: string | null; expiresAt: number | null } | null, client: PublicClient | null = this.linkClient): void {
    if (link?.session == null || client === null) return;
    client.adoptSession({ token: link.session, expiresAt: link.expiresAt ?? Date.now() + 3_600_000, level: "verified" });
  }

  /** Whether this tab holds the booking's own link, which is how a page just made goes on. */
  holdsLink(): boolean {
    return this.linkClient?.session() != null;
  }

  /** Whether this tab holds a sale's own link. */
  holdsSale(): boolean {
    return this.saleClient?.session() != null;
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

  /** The client and ref to read free times through: a move by its link reads them on the link, so its own time is left out. */
  private async freeTimes(viaLink: boolean): Promise<{ client: PublicClient; ref: string }> {
    if (viaLink && this.linkClient !== null) {
      const ref = (await this.linkRefs()).availability;
      if (ref !== null) return { client: this.linkClient, ref };
    }
    return { client: this.client, ref: (await this.refs()).availability };
  }

  async days(kind: string, who: string | null, from: string, days: number, exclude?: string, signal?: AbortSignal, viaLink = false) {
    const { client, ref } = await this.freeTimes(viaLink);
    return client.bookingDays(ref, { kind, resource: who ?? "any", from, days, ...(exclude === undefined ? {} : { exclude }) }, signal);
  }

  async times(kind: string, who: string | null, date: string, exclude?: string, signal?: AbortSignal, viaLink = false) {
    const { client, ref } = await this.freeTimes(viaLink);
    return client.bookingTimes(ref, { kind, resource: who ?? "any", date, ...(exclude === undefined ? {} : { exclude }) }, signal);
  }

  // ── signing in ────────────────────────────────────────────────────────────

  requestSignIn(email: string, lang: string) {
    return this.client.requestLink({ email, lang });
  }

  async verifySignIn(email: string, code: string) {
    const result = await this.client.verifyLinkCode({ email, code });
    if (result.ok) this.markProved();
    return result;
  }

  async openSignInLink(token: string) {
    const opened = await this.client.openLink(token);
    if (opened) this.markProved();
    return opened;
  }

  /**
   * Whether the delete would still be taken: the server wants a mailbox proved in the last ten minutes. Asked before
   * anything is cancelled, so a refused delete has changed nothing. A minute short, for the time the cancels take.
   */
  mayForget(): boolean {
    const at = this.provedAt ?? Number(this.store.get(PROVED_SLOT) ?? 0);
    return at > 0 && Date.now() - at < FORGET_WITHIN_MS;
  }

  /** Held in memory too: a browser may refuse the tab's storage, and that must not bar someone from deleting their details. */
  private markProved(): void {
    this.provedAt = Date.now();
    this.store.set(PROVED_SLOT, String(this.provedAt));
  }

  signedIn(): boolean {
    return this.client.session()?.level === "verified";
  }

  /** Ends every session this tab holds: the person's, and any booking's or sale's own link, so the next person at this screen has none. */
  async signOut(): Promise<void> {
    this.provedAt = null;
    this.store.remove(PROVED_SLOT);
    forgetPurchase();
    await Promise.allSettled([this.client.signOut(), this.linkClient?.signOut(), this.saleClient?.signOut()]);
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

  /** Every booking of the signed-in person, from both halves of the read. A failed read throws: it never reads as "no visits". */
  async myBookings(): Promise<Row[]> {
    const refs = await this.refs();
    const byId = new Map<string, Row>();
    for (const ref of refs.myBookings) {
      for (let cursor: string | undefined, pages = 0; pages < 20; pages += 1) {
        const page = await this.client.list<Row>(ref, { limit: 100, ...(cursor === undefined ? {} : { cursor }) });
        for (const row of page.data) byId.set(String(row["id"]), row);
        const next = page.cursor?.next ?? null;
        if (next === null || page.data.length === 0) break;
        cursor = next;
      }
    }
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

  /** What Offers holds for the address this session proved. Without Offers: nothing. A failed read throws: it is not "no packs". */
  async held(): Promise<Held> {
    const read = async (ref: string) => {
      try {
        return (await this.client.list<Row>(ref, { limit: 50 })).data;
      } catch (error) {
        if (error instanceof PublicApiError && (error.status === 404 || error.code === "PUBLIC_REF_NOT_FOUND" || error.code === "PUBLIC_SWITCHED_OFF")) return [];
        throw error;
      }
    };
    const [packs, cards] = await Promise.all([read("offers_vouchers_verified"), read("offers_gift_cards_verified")]);
    return { packs, cards };
  }

  /** Whether Offers would take this pack on this booking: asked of Offers itself, with nothing saved. */
  async packCovers(door: DoorName, values: BookingValues, packId: unknown): Promise<boolean> {
    const refs = await this.refs();
    const { no_review: _box, texts: _texts, ...sent } = values;
    try {
      const quote = await this.client.quote<Row>(refs.doors[door], { values: sent, children: { booking_codes: [{ values: { typed: `held:${String(packId)}` } }] } });
      return quote.applied.some((one) => one.kind === "pack" || one.kind === "voucher") || Number(quote.data["discount"] ?? 0) > 0;
    } catch (error) {
      if (error instanceof PublicApiError && error.status >= 400 && error.status < 500 && error.code !== "PUBLIC_RATE_LIMITED") return false;
      throw error;
    }
  }

  /**
   * Cancels the visits ahead and leaves the list first (cQ29), then deletes the person's details. A visit still being paid
   * cannot be cancelled: its hold runs out by itself. Letting an offer go puts its row back to waiting, so the list is read
   * again before it is left.
   */
  async forgetMe(ahead: readonly Row[]): Promise<ForgetMeResult> {
    const refs = await this.refs();
    for (const row of ahead) {
      if (row["state"] === "booked" && refs.cancel !== null) await this.client.update(refs.cancel, String(row["id"]), { state: "cancelled" });
      if (row["state"] === "offered" && refs.letOfferGo !== null) await this.client.update(refs.letOfferGo, String(row["id"]), { state: "lapsed", lapsed_by: "guest" });
    }
    for (const row of await this.myWaitlist()) if (row["state"] === "waiting") await this.leaveList(row["id"]);
    const left = await this.client.forgetMe();
    forgetPurchase();
    return left;
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

  /**
   * A ref the visitor can read this row through: what a payment is started and asked after on. Signed in there are two reads,
   * by whether "Anyone" is said yet, so it is the one that answers for this row.
   */
  private async readable(id: unknown, signedIn: boolean): Promise<{ client: PublicClient; ref: string }> {
    if (!signedIn) return { client: this.linkClient!, ref: (await this.linkRefs()).read };
    const refs = (await this.refs()).myBookings;
    for (const ref of refs) {
      const found = await this.client.get<Row>(ref, String(id)).then(() => true, () => false);
      if (found) return { client: this.client, ref };
    }
    return { client: this.client, ref: refs[0]! };
  }

  /** The moment Pay is pressed: the usual minutes start (MON-5). */
  async startPaying(id: unknown, signedIn: boolean): Promise<string> {
    const v = await this.via(signedIn);
    await v.client.update<Row>(v.pay!, String(id), { pay_started: true });
    const on = await this.readable(id, signedIn);
    return (await on.client.payments.start(on.ref, String(id))).payUrl;
  }

  /** A deposit a card or a pack covered in full: nothing due, so it is booked with no payment (MON-3). */
  async nothingDue(id: unknown, signedIn: boolean): Promise<Row> {
    const v = await this.via(signedIn);
    return v.client.update<Row>(v.pay!, String(id), { state: "booked" });
  }

  async payState(id: unknown, signedIn: boolean) {
    const on = await this.readable(id, signedIn);
    return on.client.payments.state(on.ref, String(id));
  }

  async pressedGoogle(id: unknown, signedIn: boolean): Promise<void> {
    const v = await this.via(signedIn);
    await v.client.update(v.google!, String(id), { google_pressed: true }).catch(() => undefined);
  }

  async takeOffer(id: unknown, paying: boolean, signedIn: boolean): Promise<Row> {
    if (signedIn) {
      const r = await this.refs();
      return this.client.update<Row>((paying ? r.takePaying : r.takeBooked)!, String(id), { state: paying ? "paying" : "booked" });
    }
    const r = await this.linkRefs();
    return this.linkClient!.update<Row>(paying ? r.takePaying : r.takeBooked, String(id), { state: paying ? "paying" : "booked" });
  }

  // ── reviews ───────────────────────────────────────────────────────────────

  /** The published reviews and their totals. Null while reviews are off. */
  async reviews(limit: number, offset = 0): Promise<ReviewPage | null> {
    try {
      const [totals, list] = await Promise.all([
        this.client.list<Row>("forms_review_totals", { limit: 100 }),
        // Sent as it is: the client reads a list that also says its `count` as one row (0.3.71).
        this.raw<{ data: Row[] }>(this.client, this.served.publishableKey, `/api/v1/public/records/forms_reviews?order=submitted_at.desc&limit=${String(limit)}&offset=${String(offset)}`),
      ]);
      // One row per service, and one for the whole app (no subject): only that one is the studio's total.
      const whole = totals.data.find((r) => (r["about_key"] ?? "") === "" && (r["about_table"] ?? "") === "");
      const sums = [5, 4, 3, 2, 1].map((n) => Number(whole?.[`c${String(n)}`] ?? 0));
      const count = Number(whole?.["count"] ?? 0);
      const sum = Number(whole?.["sum"] ?? 0);
      const seen = offset + list.data.length;
      return { count, average: count === 0 ? 0 : sum / count, bars: sums, list: list.data, next: seen < count && list.data.length > 0 ? seen : null };
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
    const made = await this.client.createTree<Row>(refs.buyCard!, { values: { ...buyer, client_key: clientKey }, children: { purchase_lines: [{ values: line }] } });
    this.holdLink(made.link, this.saleClient);
    return { row: made.data, payUrl: made.payUrl };
  }

  async buyPack(packId: string, buyer: Row, clientKey: string): Promise<{ row: Row; payUrl: string | null }> {
    const refs = await this.refs();
    const made = await this.client.createTree<Row>(refs.buyPack!, { values: { ...buyer, client_key: clientKey }, children: { purchase_lines: [{ values: { pack_id: packId } }] } });
    this.holdLink(made.link, this.saleClient);
    return { row: made.data, payUrl: made.payUrl };
  }

  private async purchaseRef(): Promise<{ client: PublicClient; ref: string } | null> {
    if (this.saleClient === null) return null;
    const config = await this.saleClient.config();
    const table = this.served.tables?.["purchases"] ?? `${PREFIX}purchases`;
    const ref = entriesOf(config, table).find(([, e]) => has(e, "read"))?.[0] ?? null;
    return ref === null ? null : { client: this.saleClient, ref };
  }

  async payPurchase(id: unknown): Promise<string> {
    const via = await this.purchaseRef();
    if (via === null) throw new PublicApiError("PUBLIC_REF_NOT_FOUND" as never, 404, "no way to pay this", undefined, {});
    return (await via.client.payments.start(via.ref, String(id))).payUrl;
  }

  /** How the sale's payment stands, through its own link. The sale's row wins: paid is paid. */
  async purchaseState(id: string): Promise<string | null> {
    const via = await this.purchaseRef();
    if (via === null) return null;
    const row = await via.client.get<Row>(via.ref, id).catch(() => null);
    if (row?.["state"] === "paid") return "paid";
    return (await via.client.payments.state(via.ref, id)).state;
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

/** What the customer pages use of a door: the real one above, or anything else that answers the same. */
export type CustomerDoor = Pick<
  LumenDoor,
  | "served" | "addOn" | "newKey" | "textsReady" | "book" | "holdsLink" | "holdsSale" | "days" | "times" | "packCovers" | "nothingDue"
  | "requestSignIn" | "verifySignIn" | "openSignInLink" | "mayForget" | "signedIn" | "signOut" | "me" | "setAskReviews"
  | "myBookings" | "myWaitlist" | "leaveList" | "held" | "forgetMe" | "cancelBooking" | "moveBooking" | "startPaying"
  | "payState" | "pressedGoogle" | "takeOffer" | "reviews" | "googlePlace" | "readReviewLink" | "sendReviewLink"
  | "reviewState" | "sendReview" | "buyCard" | "buyPack" | "payPurchase" | "purchaseState" | "joinList" | "openLink"
  | "linkBooking" | "linkCalendar"
>;
