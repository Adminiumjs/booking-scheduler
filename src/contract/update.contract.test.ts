/**
 * LUMEN'S UPDATE CONTRACT: A STUDIO ON THE OLD EXAMPLE TAKES THE REWORK (MOD-14).
 *
 * The old `booking-scheduler` example was never released as a package: what is
 * out there is its own database (`db/schema.sql`), eleven bare tables. So the
 * update is the rework installed into a database that already holds them. On
 * SQLite, Postgres and MySQL:
 *
 *   1. a database on the old example, under its bare names, with rows;
 *   2. every old table read straight from the database: the snapshot;
 *   3. the plan is installable, and takes none of the old tables for its own,
 *      though `services`, `customers` and `time_off` share a name with the rework's;
 *   4. installed: every old table byte for byte the snapshot;
 *   5. the sample added: the old tables still the snapshot;
 *   6. a guest books through the studio's door: it lands in `bookings_bookings`
 *      as LMN-1900, and the old `appointments` is still the snapshot.
 *
 * And once: an installed 0.1.0 is refused the update (`UPDATE_NOT_SUPPORTED`).
 */
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ADMINIUM_REPO, addOnBundle, addSample, appBundle, boot, Caller, ENGINES, missing, missingAddOn, ok, PORTS_PER_ENGINE, until, type Engine, type Server } from "./harness.ts";
import { MANIFEST_TEXT } from "./release.ts";
import { ADD_ONS, ADMIN, CLOCK, dbName, Guest, retryKey, type Row } from "./stand.ts";

const why = missing() ?? ADD_ONS.map((key) => missingAddOn(key)).find((reason) => reason !== null) ?? null;
if (why !== null && process.env["ADMINIUM_REQUIRE_CONTRACT"] === "1") throw new Error(`the update contract must run here, and cannot: ${why}`);
const PORT_BASE = Number(process.env["CONTRACT_PORT_BASE"] ?? 5310) + 30;
const REPO = fileURLToPath(new URL("../..", import.meta.url));

// ── the old example's database ──────────────────────────────────────────────

/** The old tables, each with the columns it is sorted by. */
const OLD: Record<string, string[]> = {
  service_categories: ["id"],
  services: ["id"],
  staff: ["id"],
  staff_services: ["staff_id", "service_id"],
  availability_rules: ["id"],
  time_off: ["id"],
  customers: ["id"],
  appointments: ["id"],
  gift_cards: ["id"],
  waitlist_entries: ["id"],
  loyalty_ledger: ["id"],
};
const OLD_NAMES = Object.keys(OLD);
const NEW_PREFIXES = ["bookings_", "offers_", "forms_"];

/** `db/schema.sql` itself, in each engine's own words: what is out there. */
function oldSchema(engine: Engine): string[] {
  const statements = readFileSync(join(REPO, "db", "schema.sql"), "utf8")
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => /^CREATE (TABLE|INDEX)/.test(s));
  if (engine === "postgres") return statements;
  return statements.map((statement) => {
    // A pattern check is Postgres's own word: the other two keep the column without it.
    let s = statement
      .split("\n")
      .map((line) => (line.includes("~") ? line.replace(/\s+CHECK \(.*~.*\)(,?)\s*$/, "$1") : line))
      .join("\n");
    s = s.replace(/\n\s+CHECK \(\w+\s+~[^\n]*\)(,?)/g, "$1");
    s = s.replace(/now\(\)/g, "CURRENT_TIMESTAMP");
    if (engine === "sqlite") return s.replace(/serial PRIMARY KEY/g, "INTEGER PRIMARY KEY").replace(/timestamptz/g, "TEXT").replace(/char_length/g, "length");
    return s.replace(/serial PRIMARY KEY/g, "INT AUTO_INCREMENT PRIMARY KEY").replace(/timestamptz/g, "DATETIME").replace(/\btext\b/g, "VARCHAR(255)");
  });
}

/** A few rows of each. */
function oldRows(engine: Engine): string[] {
  const at = (moment: string) => (engine === "mysql" ? moment.replace(/\+\d\d$/, "") : moment);
  const yes = engine === "sqlite" ? "1" : "true";
  return [
    `INSERT INTO service_categories (id, name, slug, icon, sort_order) VALUES (1, 'Hair', 'hair', 'scissors', 1), (2, 'Spa', 'spa', 'flower', 2)`,
    `INSERT INTO services (id, slug, name, category_id, description, duration_min, price, active, sort_order, created_at) VALUES (1, 'cut', 'Cut', 1, 'A cut', 60, 78.00, ${yes}, 1, '${at("2026-05-01 09:00:00+00")}'), (2, 'facial', 'Facial', 2, NULL, 60, 110.00, ${yes}, 2, '${at("2026-05-01 09:00:00+00")}')`,
    `INSERT INTO staff (id, slug, name, role, initials, category_id, active, sort_order, created_at) VALUES (1, 'selma', 'Selma Okonjo', 'Owner', 'SO', 1, ${yes}, 1, '${at("2026-05-01 09:00:00+00")}')`,
    `INSERT INTO staff_services (staff_id, service_id) VALUES (1, 1), (1, 2)`,
    `INSERT INTO availability_rules (id, staff_id, weekday, opens, closes) VALUES (1, 1, 'mon', '09:00', '17:00')`,
    `INSERT INTO time_off (id, staff_id, starts_at, ends_at, reason) VALUES (1, 1, '${at("2026-06-01 09:00:00+00")}', '${at("2026-06-02 09:00:00+00")}', 'Holiday')`,
    `INSERT INTO customers (id, name, email, phone, created_at) VALUES (1, 'Ava Reyes', 'ava@example.com', NULL, '${at("2026-06-01 10:00:00+00")}')`,
    `INSERT INTO appointments (id, code, service_id, staff_id, customer_id, starts_at, ends_at, price, status, remind_email, remind_sms, remind_when, created_at) VALUES (1, 'BK-1', 1, 1, 1, '${at("2026-07-01 10:00:00+00")}', '${at("2026-07-01 11:00:00+00")}', 78.00, 'completed', ${yes}, ${yes}, '24h', '${at("2026-06-20 10:00:00+00")}')`,
    `INSERT INTO gift_cards (id, code, amount, balance, purchaser_id, recipient_name, recipient_email, theme, status, issued_at) VALUES (1, 'GC-1', 100.00, 100.00, 1, 'Kit', 'kit@example.com', 'sea', 'sent', '${at("2026-06-20 10:00:00+00")}')`,
    `INSERT INTO waitlist_entries (id, customer_id, service_id, staff_id, requested_date, status, created_at) VALUES (1, 1, 1, NULL, '2026-07-02', 'waiting', '${at("2026-06-20 10:00:00+00")}')`,
    `INSERT INTO loyalty_ledger (id, customer_id, appointment_id, label, kind, delta_points, occurred_on, created_at) VALUES (1, 1, 1, 'Visit', 'earn', 78, '2026-07-01', '${at("2026-07-01 12:00:00+00")}')`,
  ];
}

// ── the database, read past Adminium ────────────────────────────────────────

const driver = (name: string): unknown => createRequire(join(ADMINIUM_REPO, "apps", "e2e", "package.json"))(name);

interface Place {
  engine: Engine;
  name: string;
  dsn: string;
}
interface Read {
  shape: string[];
  rows: (string | null)[][];
}

async function sql(place: Place, statements: readonly string[]): Promise<Record<string, unknown>[][]> {
  const out: Record<string, unknown>[][] = [];
  if (place.engine === "sqlite") {
    type Db = { prepare(sql: string): { all(): Record<string, unknown>[]; run(): unknown; reader: boolean }; close(): void };
    const Database = driver("better-sqlite3") as new (file: string) => Db;
    const db = new Database(place.name);
    try {
      for (const statement of statements) {
        const prepared = db.prepare(statement);
        out.push(prepared.reader ? prepared.all() : (prepared.run(), []));
      }
    } finally {
      db.close();
    }
    return out;
  }
  if (place.engine === "postgres") {
    type Client = { connect(): Promise<void>; query(sql: string): Promise<{ rows: Record<string, unknown>[] }>; end(): Promise<void> };
    const pg = driver("pg") as { Client: new (options: { connectionString: string }) => Client };
    const client = new pg.Client({ connectionString: place.dsn });
    await client.connect();
    try {
      for (const statement of statements) out.push((await client.query(statement)).rows);
    } finally {
      await client.end();
    }
    return out;
  }
  type Connection = { query(sql: string): Promise<[unknown]>; end(): Promise<void> };
  const mysql = driver("mysql2/promise") as { createConnection(options: { uri: string; dateStrings: boolean }): Promise<Connection> };
  const connection = await mysql.createConnection({ uri: place.dsn, dateStrings: true });
  try {
    for (const statement of statements) {
      const [rows] = await connection.query(statement);
      out.push(Array.isArray(rows) ? (rows as Record<string, unknown>[]) : []);
    }
  } finally {
    await connection.end();
  }
  return out;
}

const text = (value: unknown): string | null => (value === null || value === undefined ? null : Buffer.isBuffer(value) ? value.toString("hex") : String(value));

async function tablesIn(place: Place): Promise<string[]> {
  const query =
    place.engine === "sqlite"
      ? "SELECT name AS t FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      : place.engine === "postgres"
        ? "SELECT table_name AS t FROM information_schema.tables WHERE table_schema = current_schema() ORDER BY table_name"
        : `SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = '${place.name}' ORDER BY TABLE_NAME`;
  return (await sql(place, [query]))[0]!.map((r) => String(r["t"]));
}

/** The old tables, each as the engine says it: what "byte for byte" is measured on. */
async function snapshot(place: Place): Promise<Record<string, Read>> {
  const out: Record<string, Read> = {};
  for (const [table, order] of Object.entries(OLD)) {
    let shape: string[];
    let select: string;
    if (place.engine === "sqlite") {
      const [create, indexes, columns] = await sql(place, [`SELECT sql FROM sqlite_master WHERE tbl_name = '${table}' AND sql IS NOT NULL ORDER BY type, name`, `PRAGMA index_list("${table}")`, `PRAGMA table_info("${table}")`]);
      shape = [...create!.map((r) => String(r["sql"])), ...indexes!.map((r) => JSON.stringify(r))];
      select = `SELECT ${columns!.map((c) => `quote("${String(c["name"])}")`).join(", ")} FROM "${table}" ORDER BY ${order.join(", ")}`;
    } else if (place.engine === "postgres") {
      const [columns, constraints, indexes] = await sql(place, [
        `SELECT column_name, data_type, character_maximum_length, numeric_precision, numeric_scale, is_nullable, column_default, is_identity FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = '${table}' ORDER BY ordinal_position`,
        `SELECT conname, pg_get_constraintdef(o.oid) AS def FROM pg_constraint o JOIN pg_class c ON c.oid = o.conrelid WHERE c.relname = '${table}' AND c.relnamespace = current_schema()::regnamespace ORDER BY conname`,
        `SELECT indexdef FROM pg_indexes WHERE tablename = '${table}' AND schemaname = current_schema() ORDER BY indexname`,
      ]);
      shape = [...columns!.map((r) => JSON.stringify(r)), ...constraints!.map((r) => `${String(r["conname"])} ${String(r["def"])}`), ...indexes!.map((r) => String(r["indexdef"]))];
      select = `SELECT ${columns!.map((c) => `"${String(c["column_name"])}"::text`).join(", ")} FROM "${table}" ORDER BY ${order.join(", ")}`;
    } else {
      const [create, columns] = await sql(place, [`SHOW CREATE TABLE \`${table}\``, `SELECT COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = '${place.name}' AND TABLE_NAME = '${table}' ORDER BY ORDINAL_POSITION`]);
      shape = [String(create![0]!["Create Table"])];
      select = `SELECT ${columns!.map((c) => `CAST(\`${String(c["c"])}\` AS CHAR)`).join(", ")} FROM \`${table}\` ORDER BY ${order.join(", ")}`;
    }
    const [rows] = await sql(place, [select]);
    out[table] = { shape, rows: rows!.map((r) => Object.values(r).map(text)) };
  }
  return out;
}

async function makeOld(engine: Engine, name: string): Promise<Place> {
  let place: Place;
  if (engine === "sqlite") {
    const file = join(tmpdir(), `${name}.db`);
    rmSync(file, { force: true });
    place = { engine, name: file, dsn: `sqlite:${file}` };
  } else {
    const base = new URL(engine === "postgres" ? process.env["TEST_POSTGRES_URL"]! : process.env["TEST_MYSQL_URL"]!);
    const server: Place = { engine, name, dsn: base.toString() };
    await sql(server, engine === "postgres" ? [`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`, `CREATE DATABASE ${name}`] : [`DROP DATABASE IF EXISTS \`${name}\``, `CREATE DATABASE \`${name}\``]);
    const url = new URL(base.toString());
    url.pathname = `/${name}`;
    place = { engine, name, dsn: url.toString() };
  }
  await sql(place, [...oldSchema(engine), ...oldRows(engine)]);
  return place;
}

async function dropOld(place: Place): Promise<void> {
  if (place.engine === "sqlite") {
    rmSync(place.name, { force: true });
    return;
  }
  const base = new URL(place.dsn);
  base.pathname = place.engine === "postgres" ? "/postgres" : "/";
  await sql({ ...place, dsn: base.toString() }, place.engine === "postgres" ? [`DROP DATABASE IF EXISTS ${place.name} WITH (FORCE)`] : [`DROP DATABASE IF EXISTS \`${place.name}\``]);
}

// ── the contract ────────────────────────────────────────────────────────────

const pdt = (day: string, time: string) => new Date(`${day}T${time}:00-07:00`).toISOString();

describe.skipIf(why !== null)(`a studio on the old example takes the rework${why === null ? "" : ` — skipped: ${why}`}`, () => {
  ENGINES.forEach(([engine, available], index) => {
    describe.skipIf(!available)(`on ${engine}`, () => {
      let server: Server;
      let staff: Caller;
      let place: Place;
      let before: Record<string, Read>;
      let tablesBefore: string[];
      let connectionId = "";
      let app: ReturnType<typeof appBundle>;
      let addOns: ReturnType<typeof addOnBundle>[] = [];
      const body = () => ({ key: app.key, version: app.version, connectionId });
      const data = (table: string) => `/api/v1/data/${connectionId}/${table}`;
      const rows = async (table: string): Promise<Row[]> => {
        const out: Row[] = [];
        for (let offset = 0; ; offset += 200) {
          const page = ok(await staff.get<{ data: Row[] }>(`${data(table)}?limit=200&offset=${String(offset)}`)).data;
          out.push(...page);
          if (page.length < 200) return out;
        }
      };

      beforeAll(async () => {
        app = appBundle({ manifest: MANIFEST_TEXT });
        addOns = ADD_ONS.map((key) => addOnBundle(key));
        place = await makeOld(engine as Engine, dbName("update_old", engine as Engine));
        before = await snapshot(place);
        tablesBefore = await tablesIn(place);
        server = await boot(engine as Engine, PORT_BASE + index * PORTS_PER_ENGINE, CLOCK - 60_000, { database: dbName("update", engine as Engine) });
        staff = new Caller(server.base, { origin: server.base });
        await staff.signIn(ADMIN.email, ADMIN.password);
        connectionId = ok(await staff.post<{ id: string }>("/api/v1/connections", { name: "old-studio", engine, dsn: place.dsn }), 201).id;
        const introspect = await staff.post(`/api/v1/connections/${connectionId}/introspect`);
        expect([200, 202], JSON.stringify(introspect.body).slice(0, 600)).toContain(introspect.status);
        await until(async () => ((ok(await staff.get<{ snapshot?: unknown }>(`/api/v1/connections/${connectionId}`)).snapshot ?? null) === null ? undefined : true), "the old database's snapshot");
        for (const addOn of addOns) {
          const staged = await staff.post(`/api/v1/add-ons/upload?expectedSha512=${encodeURIComponent(addOn.integrity)}`, addOn.buffer);
          expect([200, 201], JSON.stringify(staged.body).slice(0, 600)).toContain(staged.status);
        }
        const staged = await staff.post(`/api/v1/apps/upload?expectedSha512=${encodeURIComponent(app.integrity)}`, app.buffer);
        expect([200, 201], JSON.stringify(staged.body).slice(0, 600)).toContain(staged.status);
      }, 360_000);

      afterAll(async () => {
        await server?.stop();
        if (place !== undefined) await dropOld(place);
      });

      it("holds the old example's eleven tables, bare, with their rows", () => {
        expect(tablesBefore).toEqual([...OLD_NAMES].sort());
        expect(OLD_NAMES.every((t) => before[t]!.rows.length > 0)).toBe(true);
      });

      it("plans the rework as installable, and takes none of the old tables", async () => {
        const plan = ok(await staff.post<{ plan: { installable: boolean; problems: unknown[]; create: { ref: string }[]; reuse: { ref: string }[] } }>("/api/v1/apps/plan", { ...body(), addOns: addOns.map((a) => a.key) })).plan;
        expect(plan.problems, JSON.stringify(plan.problems)).toEqual([]);
        expect(plan.installable).toBe(true);
        expect(plan.reuse.map((t) => t.ref)).toEqual([]);
        const refs = (JSON.parse(MANIFEST_TEXT) as { requiredSchema: { tables: { ref: string }[] } }).requiredSchema.tables.map((t) => t.ref);
        expect(plan.create.map((t) => t.ref)).toEqual(expect.arrayContaining(refs));
      });

      it("installs, and leaves every old table byte for byte as it was", async () => {
        const fresh = ok(await staff.post<{ plan: { checksum: string } }>("/api/v1/apps/plan", { ...body(), addOns: addOns.map((a) => a.key) })).plan;
        const install = await staff.post<{ rules: { skipped: unknown[] } }>("/api/v1/apps/install", { ...body(), planChecksum: fresh.checksum, addOns: addOns.map((a) => ({ key: a.key, version: a.version })) });
        expect(install.status, JSON.stringify(install.body).slice(0, 3000)).toBe(200);
        expect(await snapshot(place)).toEqual(before);
        const added = (await tablesIn(place)).filter((t) => !tablesBefore.includes(t));
        expect(added.filter((t) => !NEW_PREFIXES.some((p) => t.startsWith(p)))).toEqual([]);
        expect(added).toEqual(expect.arrayContaining(["bookings_bookings", "bookings_services", "bookings_customers", "bookings_time_off", "bookings_settings"]));
      }, 180_000);

      it("adds the sample into its own tables, and the old tables are still as they were", async () => {
        ok(await staff.patch(`/api/v1/connections/${connectionId}`, { timezone: "America/Los_Angeles", currency: "USD" }));
        await server.setClock(CLOCK, true);
        await addSample(staff);
        await server.setClock(CLOCK);
        expect((await rows("bookings_bookings")).map((b) => b["code"])).toContain("LMN-1899");
        expect(await snapshot(place)).toEqual(before);
      }, 300_000);

      it("lets a guest book through the studio's door, into its own bookings and not the old ones", async () => {
        ok(await staff.put("/api/v1/public-api", { enabled: true }));
        ok(await staff.put("/api/v1/settings/email", { publicOrigin: server.base }));
        const served = ok(await new Caller(server.base).get<{ publishableKey: string }>("/apps/bookings/customer/surface-config.json"));
        const config = ok(await new Caller(server.base, { origin: server.base, authorization: `Bearer ${served.publishableKey}` }).get<{ data?: { refs?: Record<string, Row> } }>("/api/v1/public/config"));
        const suffix = (ref: string) => Number(/_(\d+)$/.exec(ref)?.[1] ?? 1);
        const door = Object.keys(config.data?.refs ?? {}).filter((r) => r.startsWith("bookings_bookings") && JSON.stringify(config.data!.refs![r]!["actions"]) === '["create"]').sort((a, b) => suffix(a) - suffix(b))[0]!;
        const service = (await rows("bookings_services")).find((s) => s["name"] === "Cut & Style")!;
        const guest = new Guest(server.base, served.publishableKey);
        const made = await guest.create(door, { values: { service_id: service["id"], starts_at: pdt("2026-10-13", "09:00"), name: "Ava Reyes", email: `ava.${engine}@lumen-guests.dev`, language: "en-US", channel: "page", client_key: retryKey("update") } });
        expect(made.status, JSON.stringify(made.body).slice(0, 600)).toBe(201);
        expect(made.body.data["code"]).toBe("LMN-1900");
        expect(await snapshot(place)).toEqual(before);
      }, 120_000);
    });
  });

  describe("an installed 0.1.0", () => {
    let server: Server;
    const file = join(tmpdir(), `lumen-update-refused-${String(process.pid)}.db`);
    afterAll(async () => {
      await server?.stop();
      rmSync(file, { force: true });
    });

    it("is refused the update: its tables are in another shape, and it says to uninstall first", async () => {
      server = await boot("sqlite", PORT_BASE + 9, CLOCK - 60_000, { database: "lumen_update_refused" });
      const staff = new Caller(server.base, { origin: server.base });
      await staff.signIn(ADMIN.email, ADMIN.password);
      rmSync(file, { force: true });
      writeFileSync(file, "");
      const connectionId = ok(await staff.post<{ id: string }>("/api/v1/connections", { name: "old-app", engine: "sqlite", dsn: `sqlite:${file}` }), 201).id;
      // The manifest the old example carried, at the commit this rework started from.
      const oldManifest = execFileSync("git", ["-C", REPO, "show", "4bfca1f:manifest.json"], { encoding: "utf8", maxBuffer: 8_000_000 });
      const oldApp = appBundle({ manifest: oldManifest });
      expect(oldApp.version).toBe("0.1.0");
      ok(await staff.post(`/api/v1/apps/upload?expectedSha512=${encodeURIComponent(oldApp.integrity)}`, oldApp.buffer));
      const oldBody = { key: oldApp.key, version: oldApp.version, connectionId };
      const oldPlan = ok(await staff.post<{ plan: { checksum: string; installable: boolean } }>("/api/v1/apps/plan", oldBody)).plan;
      expect(oldPlan.installable).toBe(true);
      ok(await staff.post("/api/v1/apps/install", { ...oldBody, planChecksum: oldPlan.checksum }));
      const app = appBundle({ manifest: MANIFEST_TEXT });
      // Refused as soon as it is offered: nothing of the old install is touched.
      const refused = await staff.post(`/api/v1/apps/upload?expectedSha512=${encodeURIComponent(app.integrity)}`, app.buffer);
      expect([refused.status, refused.details["reason"]], JSON.stringify(refused.body).slice(0, 400)).toEqual([422, "UPDATE_NOT_SUPPORTED"]);
    }, 240_000);
  });
});
