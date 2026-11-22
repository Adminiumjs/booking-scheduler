/** Who a gift was for stays in the tab only for the way back from the pay page, never for the next person at this screen. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LumenDoor } from "./door.ts";
import { PURCHASE_SLOT } from "./session.ts";

const held = new Map<string, string>();
const fakeStorage = {
  getItem: (key: string) => held.get(key) ?? null,
  setItem: (key: string, value: string) => void held.set(key, value),
  removeItem: (key: string) => void held.delete(key),
};
const silent: typeof fetch = async () => new Response("{}", { status: 200, headers: { "content-type": "application/json" } });

describe("a gift order kept in the tab", () => {
  beforeEach(() => {
    held.clear();
    vi.stubGlobal("sessionStorage", fakeStorage);
    held.set(PURCHASE_SLOT, JSON.stringify({ kind: "card", id: "7", to: "Rita Gift", toEmail: "rita@lumen-guests.dev" }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("is gone after signing out", async () => {
    const door = new LumenDoor({ baseUrl: "http://127.0.0.1:1", publishableKey: "adm_pub_test" }, { fetch: silent });
    await door.signOut();
    expect(held.has(PURCHASE_SLOT)).toBe(false);
  });

  it("is gone after deleting my details", async () => {
    const door = new LumenDoor({ baseUrl: "http://127.0.0.1:1", publishableKey: "adm_pub_test" }, { fetch: silent });
    vi.spyOn(door, "refs").mockResolvedValue({ cancel: null, letOfferGo: null } as never);
    vi.spyOn(door, "myWaitlist").mockResolvedValue([]);
    vi.spyOn(door.client, "forgetMe").mockResolvedValue(undefined as never);
    await door.forgetMe([]);
    expect(held.has(PURCHASE_SLOT)).toBe(false);
  });
});
