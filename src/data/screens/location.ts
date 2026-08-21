/*
 * Find-us seed — the bits of the visit page that are not already in the
 * `DataSource` seam.
 *
 * The address, phone, email and opening hours all come from
 * `data.getLocation()` / `data.getStudioHours()`; only the how-you-get-here
 * and before-you-arrive copy lives here.
 *
 * All of it is keyed. The address itself is the salon's own record and stays
 * as written; how to reach the door is guidance the product gives, so it is
 * chrome.
 */

import type { MessageKey } from "../../i18n/index.tsx";

export interface LocationNote {
  icon: string;
  textKey: MessageKey;
}

export interface TravelOption {
  icon: string;
  labelKey: MessageKey;
  subKey: MessageKey;
}

export const TRAVEL: readonly TravelOption[] = [
  {
    icon: "train-front",
    labelKey: "data.location.tramLabel",
    subKey: "data.location.tramSub",
  },
  {
    icon: "car",
    labelKey: "data.location.parkingLabel",
    subKey: "data.location.parkingSub",
  },
  {
    icon: "bike",
    labelKey: "data.location.bikeLabel",
    subKey: "data.location.bikeSub",
  },
];

export const ARRIVAL_NOTES: readonly LocationNote[] = [
  { icon: "clock", textKey: "data.location.noteEarly" },
  { icon: "baby", textKey: "data.location.noteChildren" },
  { icon: "accessibility", textKey: "data.location.noteStepFree" },
];

/**
 * How to find the street door — not part of the postal address, and so not
 * covered by the seed's address exemption: it is a sentence of guidance, which
 * every reader needs in their own language.
 */
export const DOOR_NOTE_KEY: MessageKey = "data.location.doorNote";

/** Map-tile tint (hex) — entity palette, deliberately not a token. */
export const LOCATION_MAP_TINT = "#6f8bb0";

/** Filename shown in the map tile's corner chip. */
export const LOCATION_MAP_FILENAME = "alder_lane_map.png";
