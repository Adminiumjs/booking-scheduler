/*
 * Page-local seed for the account dashboard.
 *
 * The package catalogue lives here because nothing in `src/data/source.ts`
 * exposes one: the store seeds `pkgOwned` with bare ids, so something has to
 * turn an id into a name, a size and a tint before the dashboard can draw the
 * "Your package" panel. If a second screen ends up needing the same rows the
 * catalogue should move up into the data seam.
 */

/** One bundle in the studio's package catalogue. */
export interface PackageDeal {
  id: string;
  name: string;
  /** Service the sessions are spent on; `null` = anything in the studio. */
  svc: string | null;
  qty: number;
  icon: string;
  tint: string;
}

export const PACKAGES: readonly PackageDeal[] = [
  { id: "glow5", name: "Glow Five", svc: "facial", qty: 5, icon: "flower-2", tint: "#6f8bb0" },
  { id: "color3", name: "Color Care Trio", svc: "root", qty: 3, icon: "paintbrush", tint: "#a06f96" },
  { id: "nail6", name: "Nail Club", svc: "gel", qty: 6, icon: "sparkles", tint: "#c08a6a" },
  { id: "move10", name: "Movement Ten", svc: "reformer", qty: 10, icon: "activity", tint: "#7d9166" },
  { id: "aroma3", name: "Slow Sundays", svc: "aroma", qty: 3, icon: "leaf", tint: "#7d9179" },
  { id: "sampler", name: "Studio Sampler", svc: null, qty: 3, icon: "gift", tint: "#b07d9a" },
];

export function findPackage(id: string): PackageDeal | undefined {
  return PACKAGES.find((p) => p.id === id);
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
