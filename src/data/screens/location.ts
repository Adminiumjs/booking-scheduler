/*
 * Find-us seed — the bits of the visit page that are not already in the
 * `DataSource` seam.
 *
 * The address, phone, email and opening hours all come from
 * `data.getLocation()` / `data.getStudioHours()`; only the how-you-get-here
 * and before-you-arrive copy lives here.
 */

export interface LocationNote {
  icon: string;
  text: string;
}

export interface TravelOption {
  icon: string;
  label: string;
  sub: string;
}

export const TRAVEL: readonly TravelOption[] = [
  {
    icon: "train-front",
    label: "By tram",
    sub: "Alder stop is two minutes’ walk — lines 6 and 14.",
  },
  {
    icon: "car",
    label: "Parking",
    sub: "Two hours free in the Alder Lane structure behind us. We validate.",
  },
  {
    icon: "bike",
    label: "On two wheels",
    sub: "Racks outside the bakery, and room inside for a folding bike.",
  },
];

export const ARRIVAL_NOTES: readonly LocationNote[] = [
  {
    icon: "clock",
    text: "Arrive five minutes early for a first visit — there is a short form.",
  },
  {
    icon: "baby",
    text: "Little ones are welcome; we keep a quiet corner and colouring pencils.",
  },
  {
    icon: "accessibility",
    text: "Step-free entrance at the rear — call ahead and we will meet you there.",
  },
];

/** How to find the street door — not part of the postal address. */
export const DOOR_NOTE = "Street door beside the bakery · ring “Studio”";

/** Map-tile tint (hex) — entity palette, deliberately not a token. */
export const LOCATION_MAP_TINT = "#6f8bb0";

/** Filename shown in the map tile's corner chip. */
export const LOCATION_MAP_FILENAME = "alder_lane_map.png";
