/*
 * Real photography for the tiles that used to be procedural placeholders.
 *
 * Every "image" in this app is a `PlaceholderTile` carrying a `filename` prop
 * like `"bond_mask.jpg"` — a convention inherited from the design comp, where a
 * tinted gradient and a mono filename chip stood in for a photo that had not
 * been chosen yet. This maps those filenames onto real Unsplash photos, so the
 * comp's placeholder names stay exactly as they are and nothing else in the app
 * has to change: `PlaceholderTile` looks the filename up and renders the photo
 * when there is one, or the original gradient when there is not.
 *
 * Keys are the filename verbatim, including the extension, so there is no
 * transformation between the data and this table that could silently miss.
 *
 * Photos are Unsplash — free for commercial use, no attribution required —
 * which is the same source and licence the storefront, point-of-sale and
 * learning-platform examples already use. Only the CDN id is stored; the size
 * and crop are applied per call site.
 */

const PHOTOS: Record<string, string> = {
  // ---- hair services ----
  "cut_style.jpg": "1562322140-8baeececf3df", // blow-dry at the chair
  "root_color.jpg": "1707812343087-c9ff9e5abb43", // foils at the root
  "balayage.jpg": "1617391654484-2894196c2cc9", // colour being painted on
  "gloss_tone.jpg": "1499557354967-2b2d8910bcca", // toned silver bob

  // ---- spa + treatments ----
  "signature_facial.jpg": "1570172619644-dfd03ed5d881", // mask being applied
  "aroma_ritual.jpg": "1544161515-4ab6ce6db874", // oil poured for a massage
  "deep_tissue.jpg": "1519823551278-64ac92734fb1", // back massage

  // ---- nails ----
  "classic_mani.jpg": "1632345031435-8727f6897d53",
  "gel_mani.jpg": "1604654894610-df63bc536371",
  "deluxe_pedi.jpg": "1519419451778-14599a49ec41", // an actual pedicure, not a hand

  // ---- movement ----
  "reformer.jpg": "1717500252573-d31d4bf5ddf1",
  "private_yoga.jpg": "1506126613408-eca07ce68773",

  // ---- specialists (staff.ts) ----
  "elin_at_station.jpg": "1560869713-7d0a29430803", // curling iron at the station
  "noor_treatment_room.jpg": "1745327883508-b6cd32e5dde5",
  "ivy_nail_bar.jpg": "1607779097040-26e80aa78e66",
  "marco_reformer.jpg": "1717500251716-27057c48ace4",
  "specialist.jpg": "1580618672591-eb180b1a973f", // the fallback portrait

  // ---- journal (blog.ts) ----
  "balayage_summer.jpg": "1492106087820-71f1a00d2b11",
  "evening_routine.jpg": "1540555700478-4be289fbecef",
  "gel_or_natural.jpg": "1619607146034-5a05296c8f9a",
  "morning_mobility.jpg": "1588286840104-8957b019727f",
  "first_facial.jpg": "1620733723572-11c53f73a416",

  // ---- retail (shop.ts) ----
  "bond_mask.jpg": "1616750819456-5cdee9b85d22",
  "gloss_shampoo.jpg": "1585945037805-5fd82c2e60b1",
  "scalp_oil.jpg": "1619451427882-6aaaded0cc61",
  "barrier_cream.jpg": "1608571423902-eed4a5ad8108",
  "everyday_spf.jpg": "1620916297397-a4a5402a3c6c",
  "cuticle_pen.jpg": "1552046122-03184de85e08",
  "hand_balm.jpg": "1608068811588-3a67006b7489",
  "hair_towel.jpg": "1638232928539-6e91c47ddec5", // a towel — it is a product, not a service

  // ---- the studio itself ----
  "studio_hero.jpg": "1695527081848-1e46c06e6458",
  "studio_map.jpg": "1468933327978-d8c712b75464", // street level, on Home
  "alder_lane_map.png": "1499310392581-322cec0355a6", // overhead, on Find us
  "new_rooms.jpg": "1626379501846-0df4067b8bb9",
  "open_house_evening.jpg": "1633681138600-295fcd688876",
  "team_morning_huddle.jpg": "1695527081874-b674c46f40fb", // the careers hero
};

/**
 * The photo for a placeholder filename, or `null` when there is not one — in
 * which case the caller keeps the procedural gradient tile.
 *
 * `w` is the intended rendered width; Unsplash resizes on the CDN, so a 132px
 * card never downloads a hero-sized file.
 */
export function photoUrl(filename: string | undefined, w = 800): string | null {
  if (!filename) return null;
  const id = PHOTOS[filename];
  return id
    ? `https://images.unsplash.com/photo-${id}?w=${w}&q=75&auto=format&fit=crop`
    : null;
}

/** Every filename that has a photo — used by the tests to prove the table and
 * the seed data agree. */
export function photoFilenames(): string[] {
  return Object.keys(PHOTOS);
}
