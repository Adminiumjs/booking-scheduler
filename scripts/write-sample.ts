/**
 * `npm run sample`: write the sample file from its one source (`src/sample/lumen.ts`).
 * `src/sample/sample-bundle.test.ts` fails when the file and the source disagree.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { sampleBundle } from "../src/sample/lumen.ts";

export const SAMPLE_FILE = join(import.meta.dirname, "..", "seeds", "bookings.sample.json");
export const sampleText = (): string => `${JSON.stringify(sampleBundle())}\n`;

if (process.env["VITEST"] === undefined) {
  mkdirSync(join(import.meta.dirname, "..", "seeds"), { recursive: true });
  writeFileSync(SAMPLE_FILE, sampleText());
  console.info(`[sample] ${sampleBundle().tables.map((t) => `${t.ref} ${String(t.rows.length)}`).join(", ")}`);
}
