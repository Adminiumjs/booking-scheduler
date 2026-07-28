/*
 * Retail seed for the shelf (view: 'shop') and the bag the checkout settles.
 *
 * Page-local on purpose: the DataSource seam covers what the studio *books*
 * (services, staff, availability); the shelf is a catalogue only these two
 * screens read. Checkout imports from here rather than duplicating the list,
 * so a cart line and a shelf card can never disagree about a price.
 */

/** Shelf sections. `'all'` is the chip, never a product's own category. */
export type ShopCategory = "hair" | "skin" | "nails" | "home";
export type ShopFilter = "all" | ShopCategory;

export interface ShopProduct {
  id: string;
  name: string;
  cat: ShopCategory;
  /** Whole dollars; render through `money()`. */
  price: number;
  /** Pack size, e.g. `'200 ml'`. */
  size: string;
  /** Placeholder-tile tint (hex) — part of the entity palette, not a token. */
  tint: string;
  icon: string;
  /** Corner ribbon; empty string means no ribbon. */
  badge: string;
  /** Fake filename for the tile's mono chip. */
  fname: string;
  blurb: string;
}

export const SHOP_CATS: readonly { slug: ShopFilter; label: string }[] = [
  { slug: "all", label: "Everything" },
  { slug: "hair", label: "Hair" },
  { slug: "skin", label: "Skin" },
  { slug: "nails", label: "Nails" },
  { slug: "home", label: "Home" },
];

export const PRODUCTS: readonly ShopProduct[] = [
  {
    id: "bond",
    name: "Bond Repair Mask",
    cat: "hair",
    price: 38,
    size: "200 ml",
    tint: "#b58a6a",
    icon: "droplet",
    badge: "Bestseller",
    fname: "bond_mask.jpg",
    blurb:
      "Ten minutes a week. The one thing that keeps lightened hair from snapping.",
  },
  {
    id: "gloss-sh",
    name: "Colour Gloss Shampoo",
    cat: "hair",
    price: 26,
    size: "300 ml",
    tint: "#b07d9a",
    icon: "flask-conical",
    badge: "",
    fname: "gloss_shampoo.jpg",
    blurb:
      "Tops up tone between glosses without staining your hands or your towels.",
  },
  {
    id: "scalp",
    name: "Weightless Scalp Oil",
    cat: "hair",
    price: 32,
    size: "50 ml",
    tint: "#9a7fb0",
    icon: "sprout",
    badge: "",
    fname: "scalp_oil.jpg",
    blurb: "For itchy winter scalps. Sinks in fast enough to use in the morning.",
  },
  {
    id: "barrier",
    name: "Barrier Repair Cream",
    cat: "skin",
    price: 54,
    size: "50 ml",
    tint: "#6f8bb0",
    icon: "flower-2",
    badge: "New",
    fname: "barrier_cream.jpg",
    blurb:
      "Noor’s pick when the heating goes on and everything starts feeling tight.",
  },
  {
    id: "spf",
    name: "Everyday SPF 40",
    cat: "skin",
    price: 34,
    size: "50 ml",
    tint: "#6a86ab",
    icon: "sun",
    badge: "",
    fname: "everyday_spf.jpg",
    blurb: "No white cast, no pilling under makeup. We go through cases of it.",
  },
  {
    id: "cuticle",
    name: "Cuticle Oil Pen",
    cat: "nails",
    price: 16,
    size: "3 ml",
    tint: "#c08a6a",
    icon: "pen-tool",
    badge: "",
    fname: "cuticle_pen.jpg",
    blurb:
      "Lives in a coat pocket. The difference between two and three good weeks.",
  },
  {
    id: "balm",
    name: "Studio Hand Balm",
    cat: "nails",
    price: 22,
    size: "75 ml",
    tint: "#a8846f",
    icon: "hand",
    badge: "",
    fname: "hand_balm.jpg",
    blurb: "The one on every station, in a size you can actually take home.",
  },
  {
    id: "towel",
    name: "Fast-Dry Hair Towel",
    cat: "home",
    price: 28,
    size: "One size",
    tint: "#7d9166",
    icon: "waves",
    badge: "",
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
