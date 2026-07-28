/*
 * Page-local seed for the Packages screen (guest view `packages`).
 *
 * Prepaid bundles are not part of the DataSource seam — nothing else in the
 * app reads them, and the only trace a purchase leaves is the `pkgOwned`
 * entry on the store. `svc` is a real service id from the seam so that
 * "Book a session" can hand it straight to `startBooking`; `null` means the
 * bundle spans the whole studio and lands on the services list instead.
 *
 * Every `was` figure is the seam's real per-visit price times `qty`, so the
 * "Save $X" badge is arithmetic rather than decoration.
 */

/** Sessions stay valid for twelve months, counted from the day you buy. */
export const PACKAGE_VALID_LABEL = "12 months";
