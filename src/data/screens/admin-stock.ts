/*
 * Shelf counts for the studio's inventory screen (view: 'admin-stock').
 *
 * Only the *levels* live here. The products themselves come from the guest
 * shelf's seed: the storefront and the stockroom are one shelf, so a price, a
 * pack size or a tint can never drift between the two halves of the product.
 * The POS reads the same list for its Retail tab.
 */

import { PRODUCTS } from "./shop.ts";
import type { ShopProduct } from "./shop.ts";

/** A product's stockroom numbers. */
export interface StockLevel {
  /** Units on the shelf right now. */
  qty: number;
  /** Par level — what a full shelf holds. */
  par: number;
  /** Units sold in the last 30 days. */
  sold: number;
}

export interface StockItem extends ShopProduct, StockLevel {}

/** Below this fraction of par a line counts as low and wants reordering. */
export const LOW_AT = 0.35;

const LEVELS: Record<string, StockLevel> = {
  bond: { qty: 4, par: 20, sold: 22 },
  "gloss-sh": { qty: 16, par: 24, sold: 14 },
  scalp: { qty: 11, par: 15, sold: 7 },
  barrier: { qty: 2, par: 12, sold: 9 },
  spf: { qty: 19, par: 20, sold: 16 },
  cuticle: { qty: 31, par: 30, sold: 24 },
  balm: { qty: 6, par: 18, sold: 11 },
  towel: { qty: 9, par: 10, sold: 4 },
};

/** A product with no count yet reads as an empty shelf rather than crashing. */
const UNCOUNTED: StockLevel = { qty: 0, par: 1, sold: 0 };

export const STOCK_ITEMS: readonly StockItem[] = PRODUCTS.map((p) => ({
  ...p,
  ...(LEVELS[p.id] ?? UNCOUNTED),
}));

export function isLow(item: StockItem): boolean {
  return item.qty <= item.par * LOW_AT;
}

/** How full the shelf is, 0–100 — a line counted over par still reads 100. */
export function stockPercent(item: StockItem): number {
  return Math.min(100, Math.round((item.qty / item.par) * 100));
}

/**
 * Units a reorder brings in — enough to reach par, and never fewer than one.
 *
 * The floor matters twice: a line counted over par (the cuticle pens are) can
 * still be topped up, and the recorded count stays truthy, which is what tells
 * the row it is already on a purchase order.
 */
export function reorderUnits(item: StockItem): number {
  return Math.max(1, item.par - item.qty);
}

export type StockFilter = "all" | "low" | "ok";

export const STOCK_FILTERS: readonly { id: StockFilter; label: string }[] = [
  { id: "all", label: "All products" },
  { id: "low", label: "Low stock" },
  { id: "ok", label: "Well stocked" },
];
