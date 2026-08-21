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
import type { MessageKey } from "../../i18n/index.tsx";

/** Turn a `pkgOwned` id into the catalogue row it refers to. */
export function findPackage(id: string): PackageDeal | undefined {
  return data.getPackages().find((p) => p.id === id);
}

/**
 * A row in the "Recent activity" list — demo fiction, newest first.
 *
 * The sentence is a key with holes in it, not four fragments to glue: which
 * order "booked", the treatment and the specialist come in is the translator's
 * decision, and `{service}` / `{staff}` are resolved through the seam.
 */
export interface ActivityRow {
  icon: string;
  labelKey: MessageKey;
  /** Service id substituted into `{service}`. */
  svc?: string;
  /** Staff id substituted into `{staff}`. */
  staff?: string;
  /** Points substituted into `{points}`, and the plural it selects. */
  points?: number;
  /** Recipient or package name — salon fiction, filled into `{name}`. */
  name?: string;
  /** `YYYY-MM-DD`; the screen spells it. */
  dateISO: string;
}

export const RECENT_ACTIVITY: readonly ActivityRow[] = [
  {
    icon: "calendar-plus",
    labelKey: "data.dash.actBooked",
    svc: "gloss",
    staff: "elin",
    dateISO: "2026-07-22",
  },
  {
    icon: "gem",
    labelKey: "data.dash.actEarned",
    svc: "balayage",
    points: 190,
    dateISO: "2026-07-14",
  },
  {
    icon: "gift",
    labelKey: "data.dash.actGiftSent",
    name: "Robin Alvarez",
    dateISO: "2026-07-12",
  },
  {
    icon: "layers",
    labelKey: "data.dash.actSessionUsed",
    name: "Glow Five",
    dateISO: "2026-07-06",
  },
];

/** The signed-in guest's avatar tint (a per-record tint, so a hex is fine). */
export const ACCOUNT_TINT = "#b07d9a";

/** Demo fiction: the value on the fourth stat tile, in whole dollars. */
export const GIFTS_SENT_TOTAL = 100;
