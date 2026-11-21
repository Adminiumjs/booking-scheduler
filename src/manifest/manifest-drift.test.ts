/**
 * `manifest.json` is what the modules write, the labels left in English are
 * the ones listed, and the rules T12 ruled stay in the file: a test that reads
 * the manifest as a stranger would.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { buildManifest, manifestText, MIN_ADMINIUM, UPDATES_FROM, VERSION } from "./build.ts";
import { untranslated } from "./labels.ts";
import { BOOKING_SELECT, MADE_SELECT, PUBLIC_ACCESS } from "./public.ts";
import { NOT_THE_SPECIALISTS, ROLES, SPECIALIST_BOOKING_READS } from "./roles.ts";
import { HOLDS_TIME, TABLES } from "./tables.ts";

const table = (ref: string) => TABLES.find((t) => t.ref === ref)!;
const column = (ref: string, name: string) => table(ref).columns.find((c) => c.ref === name);
type Entry = Record<string, unknown> & { table: string; select?: string[]; writable?: string[]; filters?: { column: string }[]; orderable?: string[]; filterable?: unknown[] };
const ENTRIES = PUBLIC_ACCESS as unknown as Entry[];

describe("manifest.json", () => {
  it("is what the modules write", () => {
    expect(readFileSync(new URL("../../manifest.json", import.meta.url), "utf8")).toBe(manifestText());
  });

  it("lists every label still in English", () => {
    buildManifest();
    const listed = JSON.parse(readFileSync(new URL("./untranslated-labels.json", import.meta.url), "utf8")) as string[];
    expect(untranslated()).toEqual(listed);
  });

  it("is Lumen 0.2.0, on the engine that reads its booking rule, and refuses an update from the old example (MOD-14)", () => {
    expect([VERSION, MIN_ADMINIUM, UPDATES_FROM]).toEqual(["0.2.0", "0.3.71", ">=0.2.0"]);
  });
});

describe("the tables, as ruled", () => {
  it("keeps no time zone and no review hour in settings (MOD-4, REV-11)", () => {
    expect(table("settings").columns.map((c) => c.ref).filter((c) => /zone|review_at/.test(c))).toEqual([]);
  });

  it("seeds one settings row and no hours (MOD-5)", () => {
    const seeds = buildManifest()["seeds"] as { table: string }[];
    expect(seeds.map((s) => s.table)).toEqual(["settings"]);
  });

  it("has one closures table, with a nullable person (MOD-3)", () => {
    expect(TABLES.some((t) => t.ref === "days_off")).toBe(false);
    expect(column("closures", "team_id")?.nullable).toBe(true);
  });

  it("frees a no-show's time (cQ5)", () => {
    expect(HOLDS_TIME).not.toContain("no_show");
  });

  it("freezes what a booking costs when it is made (MON-2)", () => {
    for (const [name, from] of [["price", "price"], ["pay_mode", "online"], ["deposit", "deposit"], ["minutes", "minutes"], ["buffer_min", "buffer_min"]] as const) {
      const copy = column("bookings", name)?.rules?.["copy"] as { via: string; from: string; follow?: boolean };
      expect([name, copy.via, copy.from, copy.follow]).toEqual([name, "service_id", from, undefined]);
    }
  });

  it("hides the link's code from every staff reader, and renews it with the e-mail (ACC-3)", () => {
    const code = column("bookings", "link_token")?.rules?.["code"] as { hiddenFromStaff?: boolean; renew?: unknown };
    expect(code.hiddenFromStaff).toBe(true);
    expect(code.renew).toEqual({ on: { column: "email", changed: true } });
  });

  it("closes the calendar table to every role (cT1)", () => {
    expect(table("calendar_busy").private).toBe(true);
    for (const role of ROLES) expect(role.permissions.filter((p) => p.includes("@calendar_busy:")), role.key).toEqual([]);
    expect(table("calendar_busy").columns.map((c) => c.ref).filter((c) => /title|summary|subject/.test(c))).toEqual([]);
  });

  it("keeps only the money by law: a booking's personal copies can be erased (ACC-10)", () => {
    expect(TABLES.filter((t) => t.keep !== undefined).map((t) => t.ref).sort()).toEqual(["payments", "purchase_lines", "purchases"]);
    for (const name of ["name", "email", "phone", "note", "staff_note"]) expect(column("bookings", name)?.nullable, name).toBe(true);
  });

  it("gives a retry key to bookings and the waiting list (MOD-10)", () => {
    expect(column("bookings", "client_key")?.unique).toBe(true);
    expect(column("waitlist", "client_key")?.unique).toBe(true);
  });
});

describe("the public doors, as ruled", () => {
  it("never shows a staff note, a retry key or a link's code", () => {
    for (const entry of ENTRIES) for (const name of ["staff_note", "client_key", "link_token"]) expect(entry.select ?? [], `${entry.table}.${name}`).not.toContain(name);
  });

  it("answers a create with nothing personal", () => {
    for (const name of ["name", "email", "phone", "note"]) {
      expect(BOOKING_SELECT).toContain(name);
      expect(MADE_SELECT).not.toContain(name);
    }
  });

  it("lets no guest write a price, a state on create, the money or who proved it", () => {
    const creates = ENTRIES.filter((e) => e.table === "bookings" && (e["methods"] as string[]).includes("POST"));
    expect(creates.length).toBe(3);
    for (const door of creates) for (const name of ["price", "deposit", "state", "customer_id", "customer_proved", "proved_by", "ask_online", "door", "waitlist_id", "pay_due", "paid"]) expect(door.writable, name).not.toContain(name);
  });

  it("holds each door to the caps ruled (cQ4)", () => {
    const creates = ENTRIES.filter((e) => e.table === "bookings" && (e["methods"] as string[]).includes("POST")) as (Entry & { anonymous: { perValue: { n: number; columns: string[] }; perIpHour: number }; maxOpen: { n: number; values: string[]; upcoming: string }; humanCheck: boolean })[];
    expect(creates.map((d) => d.anonymous.perIpHour)).toEqual([4, 3, 4]);
    for (const door of creates) {
      expect([door.anonymous.perValue.n, door.anonymous.perValue.columns, door.humanCheck]).toEqual([3, ["email", "phone"], true]);
      expect([door.maxOpen.n, door.maxOpen.values, door.maxOpen.upcoming]).toEqual([3, ["booked", "paying"], "starts_at"]);
    }
  });

  it("serves a studio's closures, and never a person's day off", () => {
    const closures = ENTRIES.find((e) => e.table === "closures")!;
    expect(closures.select).not.toContain("team_id");
    expect(closures.filters!.map((f) => f.column)).toContain("studio_wide");
  });
});

describe("no gate on reviews (REV-13)", () => {
  const manifest = buildManifest() as { automations?: unknown; publicAccess: Entry[]; requiredSchema: { tables: { ref: string; review?: Record<string, unknown> }[] } };

  it("ships no rule that could publish or hide a review by itself", () => {
    expect(JSON.stringify(manifest.automations ?? [])).not.toMatch(/review/i);
  });

  it("names no public entry that filters or orders by stars", () => {
    for (const entry of manifest.publicAccess) {
      expect(JSON.stringify(entry.filters ?? [])).not.toContain("stars");
      expect(JSON.stringify(entry.filterable ?? [])).not.toContain("stars");
      expect(JSON.stringify(entry.orderable ?? [])).not.toContain("stars");
    }
  });

  it("opens a visit to review whatever it went like: arrived or done, and a typed e-mail's link reviews nothing", () => {
    const word = manifest.requiredSchema.tables.find((t) => t.ref === "bookings")!.review as { when: { in: string[] }; proved: string[] };
    expect(word.when.in).toEqual(["arrived", "done"]);
    expect(word.proved).toEqual(["customer_proved"]);
  });
});

describe("the specialist's reads", () => {
  it("hold no money and no way to reach the customer", () => {
    for (const name of ["price", "deposit", "paid", "pay_due", "refunded", "email", "phone", "link_token"]) {
      expect(NOT_THE_SPECIALISTS).toContain(name);
      expect(SPECIALIST_BOOKING_READS).not.toContain(name);
    }
  });
});
