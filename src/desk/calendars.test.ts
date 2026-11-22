/** The desk asks for a person's calendar state only when they have a calendar: most of a studio's team may have none. */
import { describe, expect, it, vi } from "vitest";

import { AdminiumDesk } from "./adminiumDesk.ts";
import type { SessionTransport } from "./transport/sessionSource.ts";
import type { StaffConfig } from "./transport/staffConnection.ts";

describe("reading the team's calendars", () => {
  it("reads the sync state of connected people only", async () => {
    const get = vi.fn(async (path: string) => {
      if (path.startsWith("/api/v1/connected-accounts")) {
        const connected = path.includes("row=2");
        return { accounts: connected ? [{ id: "a1" }] : [], providers: [], reach: "own", may: {} };
      }
      return { calendar: { state: "ok" } };
    });
    const transport = { get, tableId: async () => "t1", connection: async () => "c1" } as unknown as SessionTransport;
    const desk = new AdminiumDesk(transport, { connectionId: "c1", tables: {}, addOns: {}, access: null, serverTimezone: "UTC" } as unknown as StaffConfig);
    const read = (desk as unknown as { calendars(team: { id: number }[]): Promise<Record<string, { sync: unknown }>> }).calendars.bind(desk);
    const out = await read([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const asked = get.mock.calls.map(([path]) => path).filter((path) => path.startsWith("/api/v1/calendar-sync/row"));
    expect(asked.length).toBe(1);
    expect(asked[0]).toContain("row=2");
    expect(out["1"]!.sync).toBeNull();
    expect(out["2"]!.sync).toEqual({ state: "ok" });
  });
});
