/*
 * THE SHELF (view: 'shop') — the retail catalogue, with a sticky bag.
 *
 * The bag lives in `store.cart` (product id → quantity) so the checkout reads
 * the same object; this screen only ever patches it. Dropping the last unit of
 * a line deletes the key rather than storing a zero, which is what keeps
 * `cartLines()` and the "N items" count honest.
 */

import { Chip, Icon, IconTile, PlaceholderTile } from "../components/index.ts";
import {
  cartCount,
  cartLines,
  cartSubtotal,
  PRODUCTS,
  SHOP_CATS,
  sizeLabel,
} from "../data/screens/shop.ts";
import { useI18n } from "../i18n/index.tsx";
import { money } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-shop.css";

/** Postage on a shelf order that is not collected in studio. */
const POSTAGE = 6;

export default function Shop() {
  const { t, number } = useI18n();
  const shopCat = useStore((s) => s.shopCat);
  const cart = useStore((s) => s.cart);
  const set = useStore((s) => s.set);
  const go = useStore((s) => s.go);
  const showToast = useStore((s) => s.showToast);

  const shown = PRODUCTS.filter((p) => shopCat === "all" || p.cat === shopCat);
  const lines = cartLines(cart);
  const count = cartCount(lines);
  const subtotal = cartSubtotal(lines);

  /** Move a line by `delta`; a line that reaches zero leaves the bag. */
  const bump = (id: string, delta: number): void => {
    const next = { ...cart };
    const qty = Math.max(0, (next[id] ?? 0) + delta);
    if (qty > 0) next[id] = qty;
    else delete next[id];
    set({ cart: next });
  };

  const checkout = (): void => {
    /* Always enter the flow on the pay step — a receipt from an earlier order
     * would otherwise still be on screen, since `ckStep` survives navigation. */
    set({ ckStep: "pay" });
    go("checkout");
  };

  return (
    <section className="bk-screen bk-page scr-shop">
      <header className="scr-shop__head">
        <h1 className="bk-h1 scr-shop__title">{t("screensB.shop.title")}</h1>
        <p className="bk-sub scr-shop__sub">{t("screensB.shop.sub")}</p>
      </header>

      <div className="scr-shop__chips">
        {SHOP_CATS.map((c) => (
          <Chip
            key={c.slug}
            label={t(c.labelKey)}
            active={shopCat === c.slug}
            onClick={() => set({ shopCat: c.slug })}
          />
        ))}
      </div>

      <div className="scr-shop__grid">
        <div className="scr-shop__products">
          {shown.map((p) => {
            const qty = cart[p.id] ?? 0;
            return (
              <article key={p.id} className="bk-card scr-shop__card">
                <PlaceholderTile
                  tint={p.tint}
                  icon={p.icon}
                  iconSize={42}
                  minHeight={132}
                  filename={p.fname}
                >
                  {p.badgeKey ? (
                    <span className="scr-shop__badge">{t(p.badgeKey)}</span>
                  ) : null}
                </PlaceholderTile>

                <div className="scr-shop__body">
                  <h2 className="scr-shop__name">{p.name}</h2>
                  <p className="scr-shop__blurb">{p.blurb}</p>
                  <div className="scr-shop__pricerow">
                    <span className="bk-mono scr-shop__price">{money(p.price)}</span>
                    <span className="scr-shop__size">{sizeLabel(t, p.ml)}</span>
                  </div>

                  {qty > 0 ? (
                    <div className="scr-shop__qty">
                      <button
                        type="button"
                        className="bk-gi scr-shop__qtybtn"
                        onClick={() => bump(p.id, -1)}
                        aria-label={t("screensB.shop.removeOne", { name: p.name })}
                      >
                        <Icon name="minus" size={15} />
                      </button>
                      <span className="bk-mono scr-shop__qtyval" aria-live="polite">
                        {number(qty)}
                      </span>
                      <button
                        type="button"
                        className="bk-gi scr-shop__qtybtn"
                        onClick={() => bump(p.id, 1)}
                        aria-label={t("screensB.shop.addAnother", { name: p.name })}
                      >
                        <Icon name="plus" size={15} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="bk-btn scr-shop__add"
                      onClick={() => {
                        bump(p.id, 1);
                        showToast(
                          t("screensB.shop.toastAdded", { name: p.name }),
                          "ok",
                        );
                      }}
                    >
                      <Icon name="plus" size={15} />
                      {t("screensB.shop.addToBag")}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="scr-shop__cartpane">
          <div className="bk-panel scr-shop__cart">
            <div className="scr-shop__carthead">
              <Icon name="shopping-bag" size={18} className="scr-shop__bagicon" />
              <span className="scr-shop__carttitle">
                {t("screensB.shop.yourBag")}
              </span>
              <span className="scr-shop__cartcount">{t("count.item", {}, count)}</span>
            </div>

            {lines.length === 0 ? (
              <p className="scr-shop__cartempty">
                {t("screensB.shop.cartEmpty")}
              </p>
            ) : null}

            {lines.map((l) => (
              <div key={l.product.id} className="scr-shop__line">
                <IconTile
                  icon={l.product.icon}
                  tint={l.product.tint}
                  size={38}
                  iconSize={17}
                  radius={12}
                />
                <span className="scr-shop__linetext">
                  <span className="scr-shop__linename">{l.product.name}</span>
                  <span className="scr-shop__lineqty">
                    {t("screensB.shop.lineQty", {
                      qty: number(l.qty),
                      price: money(l.product.price),
                    })}
                  </span>
                </span>
                <span className="bk-mono scr-shop__lineamt">{money(l.amount)}</span>
              </div>
            ))}

            {lines.length > 0 ? (
              <>
                <div className="scr-shop__rule" />
                <div className="scr-shop__subtotal">
                  <span className="scr-shop__subtotallabel">
                    {t("screensB.shop.subtotal")}
                  </span>
                  <span className="bk-mono scr-shop__subtotalval">
                    {money(subtotal)}
                  </span>
                </div>
                <button
                  type="button"
                  className="bk-btn scr-shop__checkout"
                  onClick={checkout}
                >
                  <Icon name="credit-card" size={16} />
                  {t("screensB.shop.checkout")}
                </button>
                <span className="scr-shop__ship">
                  {t("screensB.shop.ship", { amount: money(POSTAGE) })}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
