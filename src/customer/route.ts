/**
 * The customer's addresses (plan §5, as r3 rules them). A private link's code
 * rides the fragment and is cleared as soon as it is read (cT8), so it reaches
 * no log, no referrer and no history entry.
 */

export type Screen =
  | "home"
  | "book"
  | "booking"
  | "paid"
  | "find"
  | "signIn"
  | "account"
  | "reviews"
  | "review"
  | "giftCards"
  | "packs"
  | "help"
  | "policy"
  | "privacy"
  | "terms"
  | "expired"
  | "notFound";

export interface Route {
  screen: Screen;
  query: URLSearchParams;
}

const PATHS: Record<string, Screen> = {
  "/": "home",
  "/book": "book",
  "/b": "booking",
  "/paid": "paid",
  "/find": "find",
  "/sign-in": "signIn",
  "/account": "account",
  "/reviews": "reviews",
  "/review": "review",
  "/gift-cards": "giftCards",
  "/packs": "packs",
  "/help": "help",
  "/policy": "policy",
  "/privacy": "privacy",
  "/terms": "terms",
  "/expired": "expired",
};

export const pathOf = (screen: Screen): string => Object.entries(PATHS).find(([, s]) => s === screen)?.[0] ?? "/";

/** The screens a frame may show (cQ7). `/b` and everything with a person's details never are. */
export const FRAMED_SCREENS: readonly Screen[] = ["home", "book", "reviews"];
/** The same, as the manifest declares them. */
export const FRAMED_PATHS = ["/", "/book", "/reviews"] as const;

/** The side's own address on this host: `/apps/bookings/customer`, a database's mount, or nothing on a domain of its own. */
export function mountOf(pathname: string): string {
  const parts = pathname.split("/").filter((p) => p !== "");
  if (parts[0] !== "apps") return "";
  const at = parts.indexOf("customer");
  return at === -1 ? "" : `/${parts.slice(0, at + 1).join("/")}`;
}

export function routeOf(pathname: string, search: string, base: string): Route {
  const inner = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  const clean = inner.replace(/\/+$/, "") || "/";
  return { screen: PATHS[clean] ?? "notFound", query: new URLSearchParams(search) };
}

/** A link's code from the fragment: letters, digits, `-` and `_`, and nothing after it but known words. */
export function tokenOf(hash: string, max = 1600): string | null {
  const [token = ""] = hash.replace(/^#/, "").split("&");
  return token.length >= 8 && token.length <= max && /^[A-Za-z0-9_.-]+$/.test(token) ? token : null;
}
