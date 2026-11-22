/**
 * The add-ons Lumen works better with. It needs none: booking, the desk and
 * paying a deposit all run on Adminium alone. Without one, its feature is off
 * and the rest of the studio works as before.
 *
 * The two calendar add-ons are the ones a person's own calendar connects
 * through. They and Google reviews come in the same release round as this app.
 */
import { l } from "./labels.ts";

export const ADD_ONS_RANGE = "^1.0.33";
/** The add-ons release that first carries the calendars and Google reviews. */
export const NEW_ADD_ONS_RANGE = "^1.0.34";
export const CALENDAR_ADD_ONS = ["calendar-google", "calendar-microsoft"];

export const ADD_ONS = {
  suggests: [
    { key: "forms", range: ADD_ONS_RANGE, checked: true, reason: l("Take reviews from customers after their visit.") },
    { key: "offers", range: ADD_ONS_RANGE, checked: true, reason: l("Sell gift cards and packs of visits, and take them at booking.") },
    { key: "holiday-calendars", range: ADD_ONS_RANGE, reason: l("Bring public holidays in as closures.") },
    { key: "calendar-google", range: NEW_ADD_ONS_RANGE, reason: l("Connect each person's Google Calendar: bookings go out, busy times come in.") },
    { key: "calendar-microsoft", range: NEW_ADD_ONS_RANGE, reason: l("Connect each person's Outlook Calendar: bookings go out, busy times come in.") },
    { key: "google-reviews", range: NEW_ADD_ONS_RANGE, reason: l("Show your Google reviews on the booking page when a visitor asks.") },
  ],
  features: [
    { id: "reviews", label: l("Customer reviews"), requires: ["forms"] },
    { id: "offers", label: l("Gift cards and packs"), requires: ["offers"] },
  ],
};
