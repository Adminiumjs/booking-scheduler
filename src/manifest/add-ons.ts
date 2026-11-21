/**
 * The add-ons Lumen works better with. It needs none: booking, the desk and
 * paying a deposit all run on Adminium alone. Without one, its feature is off
 * and the rest of the studio works as before.
 *
 * The two calendar add-ons and Google reviews join this list when they exist
 * (T09, T10): an app may not suggest an add-on nobody has released.
 */
import { l } from "./labels.ts";

export const ADD_ONS_RANGE = "^1.0.33";

export const ADD_ONS = {
  suggests: [
    { key: "forms", range: ADD_ONS_RANGE, checked: true, reason: l("Take reviews from customers after their visit.") },
    { key: "offers", range: ADD_ONS_RANGE, checked: true, reason: l("Sell gift cards and packs of visits, and take them at booking.") },
    { key: "holiday-calendars", range: ADD_ONS_RANGE, reason: l("Bring public holidays in as closures.") },
  ],
  features: [
    { id: "reviews", label: l("Customer reviews"), requires: ["forms"] },
    { id: "offers", label: l("Gift cards and packs"), requires: ["offers"] },
  ],
};
