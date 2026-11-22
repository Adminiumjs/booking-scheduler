/**
 * A field holds whatever a person types, in any script, on a page that may be
 * right to left. Without its own direction, `148 Alder Lane, Suite 2` reads as
 * `Alder Lane, Suite 2 148` in Arabic. So every field that takes words says how
 * it runs: `auto` for a person's words, `ltr` for an address, a number or a code.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const SRC = fileURLToPath(new URL(".", import.meta.url));
const files = ["desk", "customer"].flatMap((side) =>
  (readdirSync(join(SRC, side), { recursive: true }) as string[]).filter((f) => f.endsWith(".tsx") && !f.includes(".test.")).map((f) => join(side, f)),
);
/** Fields with no words in them: a tick, a date, a time, or digits only. */
const WORDLESS = /type="(checkbox|radio|date|time|hidden)"|inputMode="(numeric|decimal)"/;

describe("text direction", () => {
  it("is set on every field that takes words", () => {
    const missing = files.flatMap((file) => {
      const source = readFileSync(join(SRC, file), "utf8");
      return [...source.matchAll(/<(input|textarea)\b[\s\S]*?\/>/g)]
        .filter((m) => !WORDLESS.test(m[0]) && !/\bdir[=:]/.test(m[0]))
        .map((m) => `${file}:${source.slice(0, m.index).split("\n").length}`);
    });
    expect(missing).toEqual([]);
  });
});
