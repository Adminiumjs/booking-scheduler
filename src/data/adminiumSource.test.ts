// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Connected mode (28-public-surface.md §5.2, 28-T28 wave 3).
 *
 * ── WHY THIS DRIVES A REAL CLIENT ──────────────────────────────────────────
 * `createPublicClient` takes an injectable `fetch`, so these run the SHIPPED
 * client against canned wire responses rather than a hand-written stub of it.
 * `assertRefs`, the config fetch, the paging and the URL building are therefore
 * under test too.
 *
 * ── THE THREE THAT MATTER MOST HERE ────────────────────────────────────────
 *  1. A CUSTOMER-side key reads the busy grid and no guest. A booking page
 *     cannot offer a slot without knowing what is taken, and it has no business
 *     knowing whose appointment took it.
 *  2. THE DELEGATED METHODS ARE REALLY CALLABLE. `createDemoDataSource()`
 *     returns a class instance, so spreading it would have copied no methods at
 *     all while TypeScript stayed happy — fifteen seam methods `undefined` at
 *     run time, on screens nobody opened during review.
 *  3. Every time is the SALON's. A guest booking from another timezone would
 *     otherwise pick a slot an hour from the one they saw.
 */

import { describe, expect, it } from "vitest";

import { createPublicClient } from "@adminiumjs/public-client";

import { loadSnapshot, snapshotSource } from "./adminiumSource.ts";
import { createDemoDataSource, getDataSource, isConnected, setDataSource } from "./source.ts";

const PUBLIC = [
  "serviceCategories", "services", "staff", "staffServices", "availabilityRules", "appointments",
];
const STAFF = ["customers", "giftCards", "waitlistEntries"];

const APPOINTMENT_BASE = {
  id: 1, service_id: 10, staff_id: 20,
  starts_at: "2026-07-28T08:00:00Z", ends_at: "2026-07-28T09:00:00Z", status: "booked",
};

const ROWS: Record<string, unknown[]> = {
  serviceCategories: [
    { id: 5, name: "Hair", slug: "hair", icon: "scissors", sort_order: 0 },
    { id: 6, name: "Spa", slug: "spa", icon: "flower", sort_order: 1 },
  ],
  services: [
    {
      id: 10, slug: "cut-finish", name: "Cut & finish", category_id: 5,
      description: "A consultation, a cut and a finish.", duration_min: 60, price: "85.00",
      image_url: "cut.webp", icon: "scissors", tint: "#c7b8a8", active: true, sort_order: 0,
    },
    {
      id: 11, slug: "retired", name: "Retired treatment", category_id: 6,
      description: null, duration_min: 30, price: "40.00", image_url: null,
      icon: null, tint: null, active: false, sort_order: 1,
    },
  ],
  staff: [
    {
      id: 20, slug: "elin", name: "Elin Vagn", role: "Senior stylist", bio: "Twelve years.",
      initials: "EV", tint: "#c7b8a8", category_id: 5, active: true, sort_order: 0,
    },
    {
      id: 21, slug: "noor", name: "Noor Haddad", role: "Stylist", bio: null,
      initials: null, tint: null, category_id: 5, active: true, sort_order: 1,
    },
  ],
  staffServices: [
    { staff_id: 21, service_id: 10 },
    { staff_id: 20, service_id: 10 },
  ],
  availabilityRules: [
    { staff_id: 20, weekday: "tue", opens: "09:00", closes: "17:00" },
    { staff_id: 21, weekday: "tue", opens: "11:00", closes: "19:00" },
  ],
  appointments: [
    { ...APPOINTMENT_BASE, code: "SS-1042", customer_id: 30, price: "85.00", notes: "Fringe.", remind_email: true, remind_sms: false, remind_when: "2h" },
    { ...APPOINTMENT_BASE, id: 2, starts_at: "2026-07-28T10:00:00Z", ends_at: "2026-07-28T11:00:00Z", status: "cancelled", code: "SS-1041", customer_id: 30, price: "85.00", notes: null, remind_email: true, remind_sms: true, remind_when: "24h" },
  ],
  customers: [{ id: 30, name: "Ada Bell", email: "ada@example.test", phone: "07700" }],
  giftCards: [
    { code: "GC-77", amount: "100.00", recipient_name: "Mo", recipient_email: "mo@example.test", status: "sent", issued_at: "2026-07-12T09:00:00Z" },
  ],
  waitlistEntries: [
    { customer_id: 30, service_id: 10, staff_id: null, requested_date: "2026-07-30", status: "waiting" },
  ],
};

interface FakeOptions {
  rows?: Record<string, unknown[]>;
  expose?: (ref: string) => string[];
  limit?: number;
  side?: string;
}

/** A server that answers exactly what the scope would, paging included. */
function fakeFetch(overrides: FakeOptions = {}) {
  const rows = overrides.rows ?? ROWS;
  const limit = overrides.limit ?? 500;
  const side = overrides.side ?? "staff";
  return async (input: RequestInfo | URL): Promise<Response> => {
    const url = new URL(String(input));
    const json = (body: unknown) =>
      new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });

    if (url.pathname.endsWith("/public/config")) {
      const refs: Record<string, unknown> = {};
      for (const ref of side === "staff" ? [...PUBLIC, ...STAFF] : PUBLIC) {
        // A customer-side scope narrows `appointments` to the busy grid, which
        // is what an operator would actually mint.
        const columns =
          overrides.expose?.(ref) ??
          (ref === "appointments" && side !== "staff"
            ? ["id", "service_id", "staff_id", "starts_at", "ends_at", "status"]
            : Object.keys((rows[ref]?.[0] ?? {}) as object));
        refs[ref] = {
          actions: ["list"], expose: columns,
          filterable: [], searchable: [], orderable: [], writable: [], limit,
        };
      }
      // `/public/config` is the one route the client unwraps: it reads
      // `body.data`, while `list` reads the body itself.
      return json({
        data: { version: 1, side, timezone: "Europe/Stockholm", currency: "SEK", claim: null, refs },
      });
    }

    const ref = url.pathname.split("/").pop() ?? "";
    const all = rows[ref] ?? [];
    const offset = Number(url.searchParams.get("offset") ?? "0");
    const size = Number(url.searchParams.get("limit") ?? String(all.length));
    return json({ data: all.slice(offset, offset + size) });
  };
}

const clientWith = (fetch: ReturnType<typeof fakeFetch>) =>
  createPublicClient({ baseUrl: "https://api.example.test", publishableKey: "adm_pub_test", fetch });

const snapshot = async (overrides: FakeOptions = {}) =>
  loadSnapshot(clientWith(fakeFetch(overrides))!);

describe("demo mode is the structural default", () => {
  it("builds no client when either variable is absent", () => {
    expect(createPublicClient({ baseUrl: "https://x.test", publishableKey: "" })).toBeNull();
    expect(createPublicClient({ baseUrl: "", publishableKey: "adm_pub_x" })).toBeNull();
    expect(createPublicClient(undefined)).toBeNull();
  });

  it("falls back rather than throwing when the server is unreachable", async () => {
    const client = clientWith(async () => {
      throw new Error("ECONNREFUSED");
    });
    expect(await loadSnapshot(client!)).toBeNull();
  });

  it("falls back when the scope does not expose a column the app reads", async () => {
    expect(await snapshot({ expose: () => ["id"] })).toBeNull();
  });
});

describe("the side of the key decides what is read", () => {
  it("gives a customer-side build the busy grid and no guest", async () => {
    const snap = await snapshot({ side: "customer" });
    expect(snap).not.toBeNull();
    // A booking page cannot offer a slot without knowing what is taken…
    expect(snap!.appointments).toHaveLength(1);
    expect(snap!.appointments[0]).toMatchObject({ staffId: "elin", dur: 60 });
    // …and the code is a guest's, so it is not there.
    expect(snap!.appointments[0]!.bookingCode).toBeNull();
    // Nor is anybody's name, gift card or place in the queue.
    expect(snap!.bookings).toEqual([]);
    expect(snap!.giftCards).toEqual([]);
    expect(snap!.waitlist).toEqual([]);
  });

  it("gives a staff-side build the diary itself", async () => {
    const snap = await snapshot({ side: "staff" });
    expect(snap!.bookings).toHaveLength(1);
    expect(snap!.bookings[0]).toMatchObject({
      code: "SS-1042", name: "Ada Bell", email: "ada@example.test",
      phone: "07700", note: "Fringe.", remWhen: "2h", remSms: false,
    });
    // The app knows two states and the schema knows four; a cancelled visit is
    // off the diary rather than on it in a colour nothing renders.
    expect(snap!.bookings[0]!.status).toBe("confirmed");
    expect(snap!.giftCards[0]).toMatchObject({ code: "GC-77", amount: 100, status: "sent" });
    expect(snap!.waitlist[0]).toMatchObject({ svc: "cut-finish", staff: "first" });
  });
});

describe("the catalogue", () => {
  it("keys everything by its slug and drops what is not on offer", async () => {
    const snap = await snapshot();
    expect(snap!.services.map((s) => s.id)).toEqual(["cut-finish"]);
    const service = snap!.services[0]!;
    // `numeric` arrives as a string and must not reach arithmetic as one.
    expect(service.price).toBe(85);
    expect(service.dur).toBe(60);
    // Specialists in the salon's own order, not the join table's.
    expect(service.staff).toEqual(["elin", "noor"]);
    // WS-I G-5: `image_url` is the only column of the chip's shape.
    expect(service.fname).toBe("cut.webp");
    // A category's own word renders literally: `t()` falls back to its argument.
    expect(snap!.categories.map((c) => c.nameKey)).toEqual(["Hair", "Spa"]);
  });

  it("fills in what a sparse row leaves out rather than rendering nothing", async () => {
    const snap = await snapshot();
    const noor = snap!.staff[1]!;
    expect(noor.initials).toBe("NH");
    expect(noor.bio).toBe("");
    expect(noor.tint).toMatch(/^#/);
    // Availability is per weekday, in minutes from midnight.
    expect(snap!.staff[0]!.hours[2]).toEqual([[540, 1020]]);
  });

  it("derives the studio's hours from who is actually in", async () => {
    const snap = await snapshot();
    // WS-I G-2: there is no studio-wide hours table, only per-specialist rules.
    // Tuesday is Elin's 09:00 to Noor's 19:00; every other day is closed.
    expect(snap!.hours[2]).toEqual({ day: 2, open: 540, close: 1140, closed: false });
    expect(snap!.hours[0]!.closed).toBe(true);
  });

  it("reads every page, not just the first the scope allows", async () => {
    const snap = await snapshot({ limit: 1 });
    expect(snap!.staff).toHaveLength(2);
    expect(snap!.categories).toHaveLength(2);
    expect(snap!.services[0]!.staff).toHaveLength(2);
  });
});

describe("the connected source answers every method the seam declares", () => {
  it("really calls the delegated ones, which a spread would not have", async () => {
    const connected = snapshotSource((await snapshot())!);
    const demo = createDemoDataSource();
    // THE BUG THIS PINS. `createDemoDataSource()` returns a CLASS INSTANCE, so
    // `{ ...copy }` copies own properties and no prototype methods — and
    // TypeScript accepts it, because the declared type has them all. Fifteen
    // methods would be `undefined` at run time.
    // The METHODS, off the prototype — `Object.keys` on a class instance
    // returns its private fields and none of what the interface promises.
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(demo)).filter(
      (name) => name !== "constructor",
    ) as (keyof typeof demo)[];
    expect(methods.length).toBeGreaterThan(20);
    for (const key of methods) {
      expect(typeof connected[key], key).toBe("function");
    }
    expect(connected.getRewards().length).toBeGreaterThan(0);
    expect(connected.getPlans().length).toBeGreaterThan(0);
    expect(connected.getPackages().length).toBeGreaterThan(0);
    expect(connected.getReviews().length).toBeGreaterThan(0);
    expect(connected.getIntakeConcerns().length).toBeGreaterThan(0);
    expect(connected.getGiftAmounts().length).toBeGreaterThan(0);
    expect(connected.getGiftTheme(connected.getGiftThemes()[0]!.id)).toBeDefined();
    expect(connected.getLoyaltyHowItWorks().length).toBeGreaterThan(0);
  });

  it("answers the derived catalogue questions the screens ask", async () => {
    const connected = snapshotSource((await snapshot())!);
    expect(connected.getCategoryCounts()).toMatchObject({ all: 1, hair: 1, spa: 0 });
    expect(connected.getServicesByCategory("hair").map((s) => s.id)).toEqual(["cut-finish"]);
    expect(connected.getStaffNames("cut-finish")).toBe("Elin Vagn / Noor Haddad");
    expect(connected.getStaffForService("cut-finish").map((s) => s.id)).toEqual(["elin", "noor"]);
    // The salon's favourites have no column, so this is what guests book most.
    expect(connected.getPopularServices().map((s) => s.id)).toEqual(["cut-finish"]);
  });

  it("blanks the studio and the loyalty ledger rather than inventing them", async () => {
    const connected = snapshotSource((await snapshot())!);
    // WS-I G-1: no name, address, phone or URL anywhere in the schema.
    expect(connected.getLocation().name).toBe("");
    expect(connected.getLocation().shortName).toBe("");
    // WS-I G-4: the ledger is per customer and nothing knows who is reading.
    expect(connected.getLoyaltyLedger()).toEqual([]);
  });

  it("continues the salon’s own booking sequence", async () => {
    expect((await snapshot({ side: "staff" }))!.firstCode).toBe(1043);
    // A customer-side build never reads a code — not because the scope hides
    // one, but because this source will not use it. An empty diary starts at 1.
    expect((await snapshot({ side: "customer" }))!.firstCode).toBe(1);
  });
});

describe("the seam", () => {
  it("reports demo mode until a real source is installed", async () => {
    expect(isConnected()).toBe(false);
    const connected = snapshotSource((await snapshot())!);
    setDataSource(connected);
    expect(isConnected()).toBe(true);
    expect(getDataSource().getServices().map((s) => s.id)).toEqual(["cut-finish"]);
    setDataSource(createDemoDataSource());
    // A fresh demo instance is not the one `isConnected` compares against, so
    // the honest answer is still "connected" until the app is reloaded — which
    // is what a swap back means in practice and is worth knowing.
    expect(isConnected()).toBe(true);
  });
});
