import { describe, expect, it } from "vitest";

import { lookAtPhone, textsPossible } from "./phone.ts";

describe("the booking form's first look at a phone number", () => {
  it("hides the box until a number is typed (L03)", () => {
    expect(lookAtPhone("")).toBe("none");
    expect(lookAtPhone("   ")).toBe("none");
    expect(textsPossible("none")).toBe(false);
  });

  it("turns the box off for mainland China, however it is typed (L04)", () => {
    for (const typed of ["+86 139 1234 5678", "+8613912345678", "0086 139 1234 5678", " +86-139-1234-5678"]) expect(lookAtPhone(typed), typed).toBe("china");
    expect(textsPossible("china")).toBe(false);
  });

  it("never mistakes Hong Kong or Taiwan for mainland China", () => {
    expect(lookAtPhone("+852 6123 4567")).toBe("ok");
    expect(lookAtPhone("+886 912 345 678")).toBe("ok");
  });

  it("reads the ways people write a number", () => {
    for (const typed of ["+1 (207) 555-0161", "+44 7700 900123", "0044 7700 900123", "(207) 555-0161", "207.555.0161", "+49 30 1234567"]) expect(lookAtPhone(typed), typed).toBe("ok");
  });

  it("asks for a second look at what is not a number, and still lets the box stand (L05)", () => {
    for (const typed of ["call me", "555-CALL", "+1 207", "12", "+0 207 555 0161"]) expect(lookAtPhone(typed), typed).toBe("unreadable");
    expect(textsPossible("unreadable")).toBe(true);
  });
});
