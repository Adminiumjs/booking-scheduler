/**
 * The app's screens, as data, for `surface.json`: the file each surface build
 * writes beside its `index.html`, which Adminium reads to list the app's
 * sections in its sidebar. Each side's entries come from that side's own module.
 *
 * Icons are lucide NAMES in kebab-case, never imported components: this module
 * is read by the Vite config.
 */
import { DESK_NAV } from "./desk/nav.ts";
import type { SurfaceNavEntry } from "./surface-types.ts";

export const APP_KEY = "bookings";

/** The app's name, as the sidebar heads its section. */
export const APP_LABEL_KEY = "app.name";

/** The customer side is one site with its own menu: Adminium lists it as one entry. */
const CUSTOMER_NAV = [{ id: "site", path: "", view: "home", side: "customer", icon: "globe", labelKey: "nav.site" }] as const satisfies readonly (SurfaceNavEntry<string> & { labelKey: string })[];

export const SURFACE_NAV = [...CUSTOMER_NAV, ...DESK_NAV] as const;
