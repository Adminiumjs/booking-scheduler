/**
 * Lumen Studio stood up for a contract: the BUILT Adminium booted on one
 * engine, the app installed as an operator installs it with Forms & surveys
 * and Offers & gift cards, San Francisco's clock and US dollars set, the
 * sample added at the moment the designs pin (Tuesday 15 September 2026,
 * 10:40), the public API on.
 *
 * Then the two ways in, both over HTTP only: the operator or a member of staff
 * (`Caller`, the data API) and a guest (`Guest`, the public API with the
 * studio's own browser key, the human check solved).
 *
 * Tests only; nothing that ships imports it.
 */
import { randomBytes } from "node:crypto";
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { addOnBundle, addSample, appBundle, boot, Caller, ok, solve, until, type Engine, type Server } from "./harness.ts";
import { MANIFEST_TEXT } from "./release.ts";

export const ADMIN = { email: process.env["E2E_ADMIN_EMAIL"] ?? "e2e@adminium.local", password: process.env["E2E_ADMIN_PASSWORD"] ?? "adminium-e2e-password" };
export const ADD_ONS = ["forms", "offers"] as const;
/** Tuesday 15 September 2026, 10:40 in San Francisco (Pacific daylight time): the sample's moment. */
export const CLOCK = Date.parse("2026-09-15T17:40:00Z");
/** The app's own prefix: every table it makes is `bookings_<ref>`. */
export const PREFIX = "bookings_";
/** A database name of this branch's own, so parallel runs never meet. */
export const dbName = (name: string, engine: Engine) => `p78_t12_${name}_${engine}${process.env["CONTRACT_DB_SUFFIX"] ?? ""}`;

export type Row = Record<string, unknown>;

/** One reply of the public API: its status, body, and the error's code and params. */
export interface PublicReply<T = Row> {
  status: number;
  body: { data: T; children?: Record<string, { data: Row }[]>; link?: { key: string; token: string; session: string | null; expiresAt: number | null } | null; payUrl?: string | null; replayed?: boolean; postings?: Row[]; applied?: Row[] } & Record<string, unknown>;
  code: string | undefined;
  params: Record<string, unknown>;
}

/**
 * A guest's tab: the studio's browser key, a public session once one is held,
 * and the human check solved for every create and claim (one proof, one
 * request). With `rehearsal`, the tab is the one somebody who manages
 * payments opens on the staff address to rehearse the checkout: their own
 * session cookie and write token go with every request.
 */
export class Guest {
  session: string | null = null;
  readonly base: string;
  readonly key: string;
  private readonly rehearsal: { cookie: string; csrf: string } | null;
  constructor(base: string, key: string, rehearsal: { cookie: string; csrf: string } | null = null) {
    this.base = base;
    this.key = key;
    this.rehearsal = rehearsal;
  }

  private async proof(purpose: "write" | "claim"): Promise<string> {
    const challenge = (await this.raw("GET", `/api/v1/public/challenge?purpose=${purpose}`)).body.data as unknown as { id: string; salt: string; difficulty: number };
    return `${challenge.id}.${solve(challenge.salt, challenge.difficulty)}`;
  }

  async raw<T = Row>(method: string, path: string, body?: unknown, extra: Record<string, string> = {}): Promise<PublicReply<T>> {
    for (let attempt = 0; ; attempt += 1) {
      const res = await fetch(`${this.base}${path}`, {
        method,
        headers: {
          origin: this.base,
          authorization: `Bearer ${this.key}`,
          ...(this.session === null ? {} : { "x-adminium-public-session": this.session }),
          ...(this.rehearsal === null ? {} : { cookie: this.rehearsal.cookie, ...(method === "GET" ? {} : { "x-adminium-csrf": this.rehearsal.csrf }) }),
          ...(body === undefined ? {} : { "content-type": "application/json" }),
          ...extra,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      // A burst over the visitor's requests a minute is the server's flood guard, not the studio's rule: waited out, as
      // a person's next click would be. (A cap the app sets answers 409 PUBLIC_LIMIT_REACHED, never this.)
      if (res.status === 429 && attempt < 6) {
        const after = Number(res.headers.get("retry-after") ?? "10");
        await new Promise((resolve) => setTimeout(resolve, Math.min(Math.max(after, 1), 30) * 1_000));
        continue;
      }
      const text = await res.text();
      let parsed: unknown = null;
      try {
        parsed = text === "" ? null : JSON.parse(text);
      } catch {
        parsed = text;
      }
      const error = (parsed as { error?: { code?: string; params?: Record<string, unknown>; details?: Record<string, unknown> } } | null)?.error;
      return { status: res.status, body: parsed as PublicReply<T>["body"], code: error?.code, params: error?.params ?? error?.details ?? {} };
    }
  }

  /** A create or a claim, with a fresh proof solved for it. */
  async proved<T = Row>(purpose: "write" | "claim", path: string, body: unknown, extra: Record<string, string> = {}): Promise<PublicReply<T>> {
    return this.raw<T>("POST", path, body, { ...extra, "x-adminium-proof": await this.proof(purpose) });
  }

  get = <T = Row>(path: string) => this.raw<T>("GET", path);
  list = async (ref: string, query = ""): Promise<Row[]> => {
    const reply = await this.raw<Row[]>("GET", `/api/v1/public/records/${ref}?limit=100${query}`);
    if (reply.status !== 200) throw new Error(`list ${ref}: ${String(reply.status)} ${JSON.stringify(reply.body).slice(0, 400)}`);
    return reply.body.data;
  };
  quote = (ref: string, write: unknown) => this.raw("POST", `/api/v1/public/records/${ref}/dry-run`, write);
  create = (ref: string, write: unknown) => this.proved("write", `/api/v1/public/records/${ref}`, write);
  patch = (ref: string, id: unknown, values: Row) => this.raw("PATCH", `/api/v1/public/records/${ref}/${String(id)}`, { values });

  /** Sign in as the studio's pages do: an e-mailed link and code, the code typed back. */
  async signIn(server: Server, email: string): Promise<void> {
    const before = (await inbox(server)).length;
    let asked = await this.proved("claim", "/api/v1/public/claim/link", { email });
    // Five links a minute from one visitor: a contract signing in many customers waits its turn, as a person would.
    for (let tries = 0; asked.code === "PUBLIC_RATE_LIMITED" && tries < 8; tries += 1) {
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      asked = await this.proved("claim", "/api/v1/public/claim/link", { email });
    }
    if (asked.status !== 202 && asked.status !== 200) throw new Error(`sign-in link for ${email}: ${String(asked.status)} ${JSON.stringify(asked.body).slice(0, 400)}`);
    // A booking's own mails go to the same address: the code's is the one that says so in its subject.
    const mail = await until(async () => (await inbox(server)).slice(before).find((m) => m.to.includes(email) && isCodeMail(m)), `the sign-in e-mail to ${email}`, 90_000);
    const code = /\b(\d{6})\b/.exec(mail.text)?.[1];
    if (code === undefined) throw new Error(`no code in the sign-in e-mail: ${mail.text.slice(0, 400)}`);
    const verified = await this.raw<{ session: string }>("POST", "/api/v1/public/claim/link/verify", { email, code });
    if (verified.status !== 200) throw new Error(`verify ${email}: ${String(verified.status)} ${JSON.stringify(verified.body).slice(0, 400)}`);
    this.session = verified.body.data.session;
  }

  /** Open an order by the code in its own link. */
  async openLink(token: string): Promise<PublicReply<{ session: string }>> {
    const opened = await this.raw<{ session: string }>("POST", "/api/v1/public/claim/token", { token });
    if (opened.status === 200) this.session = opened.body.data.session;
    return opened;
  }
}

export interface Mail {
  to: string[];
  subject: string;
  text: string;
  html: string;
}
/** The engine's sign-in mail ("… is your Lumen Studio code"), among the mails a booking sends to the same address. */
export const isCodeMail = (mail: Mail) => /\bcode\b/i.test(mail.subject) && /\b\d{6}\b/.test(mail.text);
export const inbox = async (server: Server): Promise<Mail[]> => (await (await fetch(`${server.sink}/messages`)).json()) as Mail[];

export interface Stand {
  server: Server;
  staff: Caller;
  connectionId: string;
  /** The studio's browser key, and the booking link's. */
  studioKey: string;
  linkKey: string;
  /** The public refs the studio's key serves, with what each entry is. */
  refs: Record<string, Row>;
  /** A table's data API path, by the app's ref (`orders`) or an add-on's real name (`inventory_items`). */
  data(ref: string): string;
  rows(ref: string): Promise<Row[]>;
  row(ref: string, id: unknown): Promise<Row>;
  create(ref: string, values: Row): Promise<Row>;
  patch(ref: string, id: unknown, values: Row): Promise<Row>;
  /** A fresh guest's tab on the studio's key (or the booking link's). */
  guest(key?: "studio" | "link"): Guest;
  /** The tab of somebody who manages payments, rehearsing the checkout: payments on, in test mode, for them. */
  rehearsing(): Promise<Guest>;
  /** Pay an order on the pay page with the demo service, as the person rehearsing. */
  payDemo(payUrl: string): Promise<void>;
}

const tableName = (ref: string) => (ref.includes("_") && /^(offers|forms)_/.test(ref) ? ref : `${PREFIX}${ref}`);

/** Boot, install with its add-ons, set San Francisco's clock and dollars, add the sample (unless asked not to), and open the shop. */
export async function standUp(engine: Engine, port: number, name: string, options: { sample?: boolean; clock?: number; addOns?: readonly string[]; manifest?: string; built?: boolean } = {}): Promise<Stand> {
  const clock = options.clock ?? CLOCK;
  const server = await boot(engine, port, clock - 60_000, { database: dbName(name, engine) });
  try {
    const staff = new Caller(server.base, { origin: server.base });
    await staff.signIn(ADMIN.email, ADMIN.password);
    let connectionId: string;
    if (engine === "sqlite") {
      const file = join(tmpdir(), `${dbName(name, engine)}-${String(port)}.db`);
      rmSync(file, { force: true });
      writeFileSync(file, "");
      connectionId = ok(await staff.post<{ id: string }>("/api/v1/connections", { name: "lumen", engine: "sqlite", dsn: `sqlite:${file}` }), 201).id;
    } else {
      connectionId = ok(await staff.get<{ connections: { id: string; name: string }[] }>("/api/v1/connections")).connections.find((c) => c.name === "northwind")!.id;
    }
    const addOns = (options.addOns ?? ADD_ONS).map((key) => addOnBundle(key));
    for (const addOn of addOns) {
      const staged = await staff.post(`/api/v1/add-ons/upload?expectedSha512=${encodeURIComponent(addOn.integrity)}`, addOn.buffer);
      if (![200, 201].includes(staged.status)) throw new Error(`${addOn.key} upload: ${JSON.stringify(staged.body).slice(0, 600)}`);
    }
    const app = appBundle({ manifest: options.manifest ?? MANIFEST_TEXT, built: options.built === true });
    const staged = await staff.post(`/api/v1/apps/upload?expectedSha512=${encodeURIComponent(app.integrity)}`, app.buffer);
    if (![200, 201].includes(staged.status)) throw new Error(`upload: ${JSON.stringify(staged.body).slice(0, 1500)}`);
    const body = { key: app.key, version: app.version, connectionId };
    const plan = ok(await staff.post<{ plan: { checksum: string; installable: boolean } }>("/api/v1/apps/plan", body)).plan;
    if (!plan.installable) throw new Error(`not installable: ${JSON.stringify(plan).slice(0, 3000)}`);
    const installed = ok(await staff.post<{ rules: { skipped: unknown[] } }>("/api/v1/apps/install", { ...body, planChecksum: plan.checksum, addOns: addOns.map((a) => ({ key: a.key, version: a.version })) }));
    if (installed.rules.skipped.length > 0) throw new Error(`the install skipped rules: ${JSON.stringify(installed.rules.skipped).slice(0, 3000)}`);
    ok(await staff.patch(`/api/v1/connections/${connectionId}`, { timezone: "America/Los_Angeles", currency: "USD" }));
    if (options.sample !== false) {
      // The sample is written for 10:40 on the dot: the clock stands there while it goes in, then runs on.
      await server.setClock(clock, true);
      await addSample(staff);
      await server.setClock(clock);
    } else {
      await server.setClock(clock);
    }
    ok(await staff.put("/api/v1/public-api", { enabled: true }));
    ok(await staff.put("/api/v1/settings/email", { publicOrigin: server.base }));
    const served = ok(await new Caller(server.base).get<{ publishableKey: string; publicKeys?: Record<string, string> }>("/apps/bookings/customer/surface-config.json"));
    const studioKey = served.publishableKey;
    const linkKey = served.publicKeys?.["link"] ?? "";
    const config = ok(await new Caller(server.base, { origin: server.base, authorization: `Bearer ${studioKey}` }).get<{ data?: { refs?: Record<string, Row> }; refs?: Record<string, Row> }>("/api/v1/public/config"));
    const refs = config.data?.refs ?? config.refs ?? {};

    const data = (ref: string) => `/api/v1/data/${connectionId}/${encodeURIComponent(tableName(ref))}`;
    const rows = async (ref: string): Promise<Row[]> => {
      const out: Row[] = [];
      for (let offset = 0; ; offset += 200) {
        const page = ok(await staff.get<{ data: Row[] }>(`${data(ref)}?limit=200&offset=${String(offset)}`)).data;
        out.push(...page);
        if (page.length < 200) return out;
      }
    };
    const row = async (ref: string, id: unknown) => ok(await staff.get<{ data: Row }>(`${data(ref)}/${encodeURIComponent(String(id))}`)).data;
    const create = async (ref: string, values: Row) => {
      const reply = await staff.post<{ data: Row }>(data(ref), { values });
      if (reply.status !== 201 && reply.status !== 200) throw new Error(`create ${ref}: ${String(reply.status)} ${JSON.stringify(reply.body).slice(0, 800)}`);
      return reply.body.data;
    };
    const patch = async (ref: string, id: unknown, values: Row) => {
      const reply = await staff.patch<{ data: Row }>(`${data(ref)}/${encodeURIComponent(String(id))}`, { values });
      if (reply.status !== 200) throw new Error(`patch ${ref} ${String(id)}: ${String(reply.status)} ${JSON.stringify(reply.body).slice(0, 800)}`);
      return reply.body.data;
    };

    return {
      server,
      staff,
      connectionId,
      studioKey,
      linkKey,
      refs,
      data,
      rows,
      row,
      create,
      patch,
      guest: (key = "studio") => new Guest(server.base, key === "studio" ? studioKey : linkKey),
      rehearsing: async () => {
        ok(await staff.put("/api/v1/payments/rehearsal", { on: true }));
        const config = ok(await staff.get<{ publishableKey: string; rehearsal?: { csrfToken: string } }>("/apps/bookings/customer/surface-config.json"));
        if (config.rehearsal?.csrfToken === undefined) throw new Error("the customer config carries no rehearsal token");
        return new Guest(server.base, config.publishableKey, { cookie: staff.cookies, csrf: config.rehearsal.csrfToken });
      },
      payDemo: async (payUrl: string) => {
        const token = new URL(payUrl, server.base).pathname.split("/").pop()!;
        const challenge = ok(await staff.get<{ id: string; salt: string; difficulty: number }>(`/pay/api/${token}/challenge`));
        const started = ok(await staff.post<{ url?: string }>(`/pay/api/${token}/checkout`, { source: "demo" }, { "x-adminium-proof": `${challenge.id}.${solve(challenge.salt, challenge.difficulty)}` }));
        if (started.url === undefined) throw new Error(`no demo checkout: ${JSON.stringify(started)}`);
        const attempt = new URL(started.url, server.base).pathname.split("/").pop()!;
        const done = ok(await staff.post<{ back: string }>(`/pay/api/demo/${attempt}`, { action: "succeeds" }));
        const nonce = done.back.split("/").pop()!.split("?")[0]!;
        ok(await staff.get(`/pay/api/back/${nonce}`));
      },
    };
  } catch (error) {
    await server.stop();
    throw error;
  }
}

export const num = (value: unknown) => Number(value);
export const yes = (value: unknown) => value === true || value === 1 || value === "1" || value === "true";


/** A retry key as the page makes one, once per booking it means to make. */
export const retryKey = (label: string) => `${label}-${randomBytes(16).toString("hex")}`.slice(0, 64);
