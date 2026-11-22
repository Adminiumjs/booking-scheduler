/**
 * The desk's read of the studio under the staff rate limit: one read at a time, a plain state while it waits, and a way back
 * with no press from anyone.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DeskData, DeskDoor } from "./door.ts";
import { reload, SLOW_DOWN_MS } from "./env.tsx";
import { useDesk } from "./store.ts";
import { ApiError } from "./wire.ts";

const DATA = { waitlist: [], team: [], teamServices: [] } as unknown as DeskData;
const limited = () => new ApiError(429, "RATE_LIMITED", "Too many requests.", {});

function doorWith(load: () => Promise<DeskData>): DeskDoor {
  return { load, who: () => ({ can: () => false }), facts: () => ({ zone: "UTC" }), now: () => 0 } as unknown as DeskDoor;
}

describe("the desk under the rate limit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useDesk.setState({ data: null, failure: null, slowedDown: false, fits: {} });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts no second read while one is on its way, however often the clock ticks", async () => {
    let running = 0;
    let most = 0;
    const door = doorWith(async () => {
      running += 1;
      most = Math.max(most, running);
      await new Promise((resolve) => setTimeout(resolve, 90_000));
      running -= 1;
      return DATA;
    });
    const first = reload(door);
    await vi.advanceTimersByTimeAsync(60_000);
    void reload(door);
    await vi.advanceTimersByTimeAsync(60_000);
    void reload(door);
    await vi.advanceTimersByTimeAsync(200_000);
    await first;
    expect(most).toBe(1);
    expect(useDesk.getState().data).toBe(DATA);
  });

  it("says so when it is limited, and comes back by itself", async () => {
    let calls = 0;
    const door = doorWith(async () => {
      calls += 1;
      if (calls === 1) throw limited();
      return DATA;
    });
    await reload(door);
    expect(useDesk.getState().data).toBeNull();
    expect(useDesk.getState().slowedDown).toBe(true);
    await vi.advanceTimersByTimeAsync(SLOW_DOWN_MS + 10);
    expect(calls).toBe(2);
    expect(useDesk.getState().data).toBe(DATA);
    expect(useDesk.getState().slowedDown).toBe(false);
    expect(useDesk.getState().failure).toBeNull();
  });

  it("a failure that came while another read was asked for is not lost", async () => {
    let calls = 0;
    const door = doorWith(async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 10));
      throw new ApiError(500, "INTERNAL", "It broke.", {});
    });
    const read = reload(door);
    void reload(door);
    await vi.advanceTimersByTimeAsync(50);
    await read;
    expect(calls).toBe(2);
    expect(useDesk.getState().failure).toBe("It broke.");
    expect(useDesk.getState().slowedDown).toBe(false);
  });
});
