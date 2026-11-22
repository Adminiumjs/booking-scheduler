import { describe, expect, it } from "vitest";

import { webLink } from "./safeLink.ts";

describe("a link somebody typed, before it becomes an href", () => {
  it("keeps an https address", () => {
    expect(webLink("https://g.page/r/lumen-studio-example")).toBe("https://g.page/r/lumen-studio-example");
    expect(webLink("  https://search.google.com/local/writereview?placeid=abc ")).toBe("https://search.google.com/local/writereview?placeid=abc");
  });
  it.each(["javascript:alert(1)", "JaVaScRiPt:alert(1)", " javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "vbscript:x", "http://g.page/r/x", "//evil.example/x", "https:/x", "https://", "", null, undefined, 7])("refuses %s", (value) => {
    expect(webLink(value)).toBeNull();
  });
});
