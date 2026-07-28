/*
 * Page-local seed for the account dashboard.
 *
 * The package catalogue is NOT here — it is contract data and lives in
 * `demo.ts` behind `data.getPackages()`. It briefly existed in two copies
 * (this screen and the packages screen), which is exactly the drift a seam
 * exists to prevent.
 */

import { data } from "../source.ts";
import type { PackageDeal } from "../types.ts";

/** Turn a `pkgOwned` id into the catalogue row it refers to. */
export function findPackage(id: string): PackageDeal | undefined {
  return data.getPackages().find((p) => p.id === id);
}

/** A row in the "Recent activity" list — demo fiction, newest first. */
export interface ActivityRow {
  icon: string;
  label: string;
  date: string;
}

export const RECENT_ACTIVITY: readonly ActivityRow[] = [
  { icon: "calendar-plus", label: "Booked Gloss & Tone with Elin", date: "Jul 22, 2026" },
  { icon: "gem", label: "Earned 190 points · Balayage", date: "Jul 14, 2026" },
  { icon: "gift", label: "Gift card sent to Robin Alvarez", date: "Jul 12, 2026" },
  { icon: "layers", label: "Used a Glow Five session", date: "Jul 6, 2026" },
];

/** The signed-in guest's avatar tint (a per-record tint, so a hex is fine). */
export const ACCOUNT_TINT = "#b07d9a";

/** Demo fiction: the value on the fourth stat tile. */
export const GIFTS_SENT_LABEL = "$100";
