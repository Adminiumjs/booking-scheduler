import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { photoFilenames, photoUrl } from "./photos.ts";

/*
 * The photo table is keyed by the placeholder filenames scattered through the
 * data and screen files. That is two places holding the same set of names —
 * exactly the shape of bug that has bitten every app in this catalogue — so
 * these tests read the real source and assert the two sides agree.
 */
const SRC = fileURLToPath(new URL("..", import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.(ts|tsx)$/.test(p) && !/\.test\.tsx?$/.test(p) ? [p] : [];
  });
}

/**
 * Every image-filename literal in the app.
 *
 * Deliberately matched on the *literal*, not on `filename=`/`fname:` — the
 * first version of this keyed on those two prefixes and on `.jpg`, and missed
 * both `alder_lane_map.png` (wrong extension) and `team_morning_huddle.jpg`
 * (assigned through an upper-case `CAREERS_HERO_FILENAME` constant). The test
 * passed while two tiles still rendered as placeholders, because the check and
 * the bug shared an assumption. Match the shape of the value instead.
 */
function filenamesInSource(): Set<string> {
  const found = new Set<string>();
  for (const file of walk(SRC)) {
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(/"([a-z0-9_]+\.(?:jpg|jpeg|png|webp|avif))"/gi)) {
      found.add(m[1]);
    }
  }
  return found;
}

describe("the photo table matches the placeholders in the app", () => {
  const inSource = filenamesInSource();

  it("finds the placeholder names in the source", () => {
    expect(inSource.size).toBeGreaterThan(30);
  });

  it("every placeholder in the app has a photo", () => {
    const missing = [...inSource].filter((f) => photoUrl(f) === null).sort();
    expect(missing).toEqual([]);
  });

  it("every photo in the table is actually used by the app", () => {
    const orphans = photoFilenames()
      .filter((f) => !inSource.has(f))
      .sort();
    expect(orphans).toEqual([]);
  });

  it("no two placeholders share a photo", () => {
    const urls = photoFilenames().map((f) => photoUrl(f));
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe("photoUrl", () => {
  it("returns null for an unmapped or absent filename, so the tile falls back", () => {
    expect(photoUrl(undefined)).toBeNull();
    expect(photoUrl("")).toBeNull();
    expect(photoUrl("not_a_real_placeholder.jpg")).toBeNull();
  });

  it("asks the CDN for the width it will actually be rendered at", () => {
    expect(photoUrl("bond_mask.jpg", 132)).toContain("w=132");
    expect(photoUrl("studio_hero.jpg", 1200)).toContain("w=1200");
  });

  it("builds a well-formed Unsplash URL", () => {
    const url = photoUrl("studio_hero.jpg")!;
    expect(url).toMatch(
      /^https:\/\/images\.unsplash\.com\/photo-\d{10,13}-[0-9a-f]{12}\?w=\d+&q=75&auto=format&fit=crop$/,
    );
  });

  it("every id in the table is shaped like a real Unsplash id", () => {
    photoFilenames().forEach((f) => {
      expect([f, photoUrl(f)]).toEqual([
        f,
        expect.stringMatching(/photo-\d{10,13}-[0-9a-f]{12}\?/),
      ]);
    });
  });
});
