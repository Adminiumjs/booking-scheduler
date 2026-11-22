/** What Lumen offers at install: each add-on it can use, none of them needed. */
import { describe, expect, it } from "vitest";

import { ADD_ONS, NEW_ADD_ONS_RANGE } from "./add-ons.ts";
import { LOCALES } from "./labels.ts";

describe("the add-ons offered at install", () => {
  it("offers Google reviews, unticked, in every language", () => {
    const offer = ADD_ONS.suggests.find((a) => a.key === "google-reviews");
    expect(offer?.range).toBe(NEW_ADD_ONS_RANGE);
    expect(offer?.checked).toBeUndefined();
    expect(Object.keys(offer?.reason ?? {}).sort()).toEqual([...LOCALES].sort());
  });

  it("ticks only Forms and Offers", () => {
    expect(ADD_ONS.suggests.filter((a) => a.checked === true).map((a) => a.key)).toEqual(["forms", "offers"]);
  });
});
