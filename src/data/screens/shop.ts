/*
 * Retail seed for the shelf (view: 'shop') and the bag the checkout settles.
 *
 * Page-local on purpose: the DataSource seam covers what the studio *books*
 * (services, staff, availability); the shelf is a catalogue only these two
 * screens read. Checkout imports from here rather than duplicating the list,
 * so a cart line and a shelf card can never disagree about a price.
 */

import type { MessageKey, TFunction } from "../../i18n/index.tsx";
import { formatNumber } from "../../lib/format.ts";

/** Shelf sections. `'all'` is the chip, never a product's own category. */
export type ShopCategory = "hair" | "skin" | "nails" | "home";
export type ShopFilter = "all" | ShopCategory;

export interface ShopProduct {
  id: string;
  name: string;
  cat: ShopCategory;
  /** Whole dollars; render through `money()`. */
  price: number;
  /**
   * Pack size in millilitres, or `null` for the one-size line. The unit is a
   * message key rather than a suffix baked into the string, so the digits and
   * the abbreviation both belong to the reader's locale.
   */
  ml: number | null;
  /** Placeholder-tile tint (hex) — part of the entity palette, not a token. */
  tint: string;
  icon: string;
  /** Corner ribbon; `null` means no ribbon. */
  badgeKey: MessageKey | null;
  /** Fake filename for the tile's mono chip. */
  fname: string;
  blurb: string;
}

export const SHOP_CATS: readonly { slug: ShopFilter; labelKey: MessageKey }[] = [
  { slug: "all", labelKey: "data.shop.catAll" },
  { slug: "hair", labelKey: "data.shop.catHair" },
  { slug: "skin", labelKey: "data.shop.catSkin" },
  { slug: "nails", labelKey: "data.shop.catNails" },
  { slug: "home", labelKey: "data.shop.catHome" },
];

/**
 * How a pack size is spelled. `ml` carries the figure; these carry the unit
 * and the one-size wording, which are words and so belong in the bundle.
 */
export const SIZE_ML_KEY: MessageKey = "data.shop.sizeMl";
export const SIZE_ONE_KEY: MessageKey = "data.shop.oneSize";

/**
 * `'200 ml'` / `'One size'` — the shelf, the stock room and the till all print
 * a pack size, so the choice between the two keys lives here rather than three
 * times over. The figure goes through `formatNumber()` so it carries the
 * reader's digits and grouping.
 */
export function sizeLabel(t: TFunction, ml: number | null): string {
  return ml === null ? t(SIZE_ONE_KEY) : t(SIZE_ML_KEY, { n: formatNumber(ml) });
}

export const PRODUCTS: readonly ShopProduct[] = [
  {
    id: "bond",
    name: "Bond Repair Mask",
    cat: "hair",
    price: 38,
    ml: 200,
    tint: "#b58a6a",
    icon: "droplet",
    badgeKey: "data.shop.badgeBestseller",
    fname: "bond_mask.jpg",
    blurb:
      "Ten minutes a week. The one thing that keeps lightened hair from snapping.",
  },
  {
    id: "gloss-sh",
    name: "Colour Gloss Shampoo",
    cat: "hair",
    price: 26,
    ml: 300,
    tint: "#b07d9a",
    icon: "flask-conical",
    badgeKey: null,
    fname: "gloss_shampoo.jpg",
    blurb:
      "Tops up tone between glosses without staining your hands or your towels.",
  },
  {
    id: "scalp",
    name: "Weightless Scalp Oil",
    cat: "hair",
    price: 32,
    ml: 50,
    tint: "#9a7fb0",
    icon: "sprout",
    badgeKey: null,
    fname: "scalp_oil.jpg",
    blurb: "For itchy winter scalps. Sinks in fast enough to use in the morning.",
  },
  {
    id: "barrier",
    name: "Barrier Repair Cream",
    cat: "skin",
    price: 54,
    ml: 50,
    tint: "#6f8bb0",
    icon: "flower-2",
    badgeKey: "data.shop.badgeNew",
    fname: "barrier_cream.jpg",
    blurb:
      "Noor’s pick when the heating goes on and everything starts feeling tight.",
  },
  {
    id: "spf",
    name: "Everyday SPF 40",
    cat: "skin",
    price: 34,
    ml: 50,
    tint: "#6a86ab",
    icon: "sun",
    badgeKey: null,
    fname: "everyday_spf.jpg",
    blurb: "No white cast, no pilling under makeup. We go through cases of it.",
  },
  {
    id: "cuticle",
    name: "Cuticle Oil Pen",
    cat: "nails",
    price: 16,
    ml: 3,
    tint: "#c08a6a",
    icon: "pen-tool",
    badgeKey: null,
    fname: "cuticle_pen.jpg",
    blurb:
      "Lives in a coat pocket. The difference between two and three good weeks.",
  },
  {
    id: "balm",
    name: "Studio Hand Balm",
    cat: "nails",
    price: 22,
    ml: 75,
    tint: "#a8846f",
    icon: "hand",
    badgeKey: null,
    fname: "hand_balm.jpg",
    blurb: "The one on every station, in a size you can actually take home.",
  },
  {
    id: "towel",
    name: "Fast-Dry Hair Towel",
    cat: "home",
    price: 28,
    ml: null,
    tint: "#7d9166",
    icon: "waves",
    badgeKey: null,
    fname: "hair_towel.jpg",
    blurb: "Cuts drying time in half and stops the frizz a bath towel causes.",
  },
];

export function productById(id: string): ShopProduct | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export interface CartLine {
  product: ShopProduct;
  qty: number;
  /** `price × qty`, in whole dollars. */
  amount: number;
}

/**
 * The bag, in the order things were added — `store.cart` is a plain object
 * keyed by product id, and its keys are non-numeric, so insertion order holds.
 * Ids with no matching product are dropped rather than rendered blank.
 */
export function cartLines(cart: Record<string, number>): CartLine[] {
  const lines: CartLine[] = [];
  for (const id of Object.keys(cart)) {
    const product = productById(id);
    const qty = cart[id];
    if (!product || !qty) continue;
    lines.push({ product, qty, amount: product.price * qty });
  }
  return lines;
}

export function cartSubtotal(lines: readonly CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.amount, 0);
}

export function cartCount(lines: readonly CartLine[]): number {
  return lines.reduce((n, l) => n + l.qty, 0);
}
