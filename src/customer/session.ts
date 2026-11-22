/**
 * What this tab remembers about the booking it just made or opened: enough to
 * come back from the pay page. Never the link's code in an address.
 */
const SLOT = "lumen.booking";

export interface KeptBooking {
  id: string;
  token: string | null;
  name: string;
  email: string;
  /** Just made: the page says "You're booked". */
  fresh: boolean;
  /** Read through the person's own session rather than the booking's link. */
  signedIn?: boolean;
}

/** The gift or pack order on its way through the pay page: who it is for, for the thank-you on the way back. */
export const PURCHASE_SLOT = "lumen.purchase";

export function forgetPurchase(): void {
  try {
    sessionStorage.removeItem(PURCHASE_SLOT);
  } catch {
    // nothing kept
  }
}

export function keepBooking(kept: KeptBooking): void {
  try {
    sessionStorage.setItem(SLOT, JSON.stringify(kept));
  } catch {
    // not kept: the page falls back on the booking's e-mail
  }
}

export function keptBooking(): KeptBooking | null {
  try {
    const raw = sessionStorage.getItem(SLOT);
    if (raw === null) return null;
    const kept = JSON.parse(raw) as Partial<KeptBooking>;
    return typeof kept.id === "string" ? (kept as KeptBooking) : null;
  } catch {
    return null;
  }
}

export function forgetBooking(): void {
  try {
    sessionStorage.removeItem(SLOT);
  } catch {
    // nothing kept
  }
}
