/*
 * STOCK (view: 'admin-stock') — the retail shelf and what needs ordering.
 *
 * A line is "low" at or under 35% of par. Ordering records the *units* a
 * purchase order would bring in rather than a bare flag, because the store
 * types `ordered` as id → number and the count is what the toast and the row
 * both want to say. Zero is never written, so the truthiness check that decides
 * "Ordered" vs "Reorder" still holds.
 */

import { Chip, Icon, IconTile } from "../components/index.ts";
import {
  isLow,
  reorderUnits,
  STOCK_FILTERS,
  STOCK_ITEMS,
  stockPercent,
} from "../data/screens/admin-stock.ts";
import type { StockItem } from "../data/screens/admin-stock.ts";
import { sizeLabel } from "../data/screens/shop.ts";
import { useI18n } from "../i18n/index.tsx";
import { money } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-admin-stock.css";

/** Which colour the fill takes: empty shelf, thin shelf, healthy shelf. */
function barTone(item: StockItem): string {
  if (isLow(item)) return "low";
  return stockPercent(item) < 70 ? "thin" : "ok";
}

export default function AdminStock() {
  const { t, number } = useI18n();
  const stockFilter = useStore((s) => s.stockFilter);
  const ordered = useStore((s) => s.ordered);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const rows = STOCK_ITEMS.filter((p) => {
    if (stockFilter === "all") return true;
    return stockFilter === "low" ? isLow(p) : !isLow(p);
  });

  const order = (item: StockItem): void => {
    if (ordered[item.id]) return;
    const units = reorderUnits(item);
    set({ ordered: { ...ordered, [item.id]: units } });
    showToast(t("screensA.stock.ordered", { name: item.name }, units), "ok");
  };

  const orderAllLow = (): void => {
    const next = { ...ordered };
    let added = 0;
    for (const p of STOCK_ITEMS) {
      if (!isLow(p) || next[p.id]) continue;
      next[p.id] = reorderUnits(p);
      added += 1;
    }
    /* Nothing left to order is a real state — the comp claimed a purchase
     * order had gone out even when every low line was already on one. */
    if (added === 0) {
      showToast(t("screensA.stock.allOnOrder"), "warn");
      return;
    }
    set({ ordered: next });
    showToast(t("screensA.stock.poSent"), "ok");
  };

  return (
    <div className="scr-admin-stock">
      <div className="bk-panel scr-admin-stock__panel">
        <div className="scr-admin-stock__bar">
          {STOCK_FILTERS.map((f) => (
            <Chip
              key={f.id}
              label={t(f.labelKey)}
              active={stockFilter === f.id}
              onClick={() => set({ stockFilter: f.id })}
            />
          ))}
          <button
            type="button"
            className="bk-gi scr-admin-stock__reorder"
            onClick={orderAllLow}
          >
            <Icon name="truck" size={15} />
            {t("screensA.stock.reorderAll")}
          </button>
        </div>

        <div className="scr-admin-stock__scroll">
          <div className="scr-admin-stock__track">
            <div className="scr-admin-stock__head">
              <span />
              <span>{t("screensA.stock.colProduct")}</span>
              <span>{t("screensA.stock.colStock")}</span>
              <span className="scr-admin-stock__end">
                {t("screensA.stock.colRetail")}
              </span>
              <span className="scr-admin-stock__end scr-admin-stock__sold">
                {t("screensA.stock.colSold")}
              </span>
              <span className="scr-admin-stock__end">
                {t("screensA.stock.colAction")}
              </span>
            </div>

            {rows.map((p) => {
              const low = isLow(p);
              const onOrder = Boolean(ordered[p.id]);
              const pct = stockPercent(p);
              return (
                <div
                  key={p.id}
                  className="scr-admin-stock__row"
                  data-alert={low && !onOrder ? "true" : "false"}
                >
                  <IconTile
                    icon={p.icon}
                    tint={p.tint}
                    size={32}
                    iconSize={15}
                    radius={10}
                  />
                  <span className="scr-admin-stock__name">
                    <span className="scr-admin-stock__title">{p.name}</span>
                    <span className="scr-admin-stock__meta">
                      {t("screensA.stock.meta", {
                        size: sizeLabel(t, p.ml),
                        par: number(p.par),
                      })}
                    </span>
                  </span>
                  <span className="scr-admin-stock__level">
                    <span className="scr-admin-stock__bar">
                      <span
                        className="scr-admin-stock__fill"
                        data-tone={barTone(p)}
                        style={{ inlineSize: `${pct}%` }}
                      />
                    </span>
                    <span className="bk-mono scr-admin-stock__count">
                      {t("screensA.stock.level", {
                        qty: number(p.qty),
                        par: number(p.par),
                      })}
                    </span>
                  </span>
                  <span className="bk-mono scr-admin-stock__end scr-admin-stock__price">
                    {money(p.price)}
                  </span>
                  <span className="bk-mono scr-admin-stock__end scr-admin-stock__sold">
                    {number(p.sold)}
                  </span>
                  <span className="scr-admin-stock__actioncell">
                    <button
                      type="button"
                      className="scr-admin-stock__order"
                      data-state={onOrder ? "done" : low ? "urgent" : "idle"}
                      disabled={onOrder}
                      onClick={() => order(p)}
                    >
                      {t(
                        onOrder
                          ? "screensA.stock.stateOrdered"
                          : low
                            ? "screensA.stock.stateReorder"
                            : "screensA.stock.stateOrder",
                      )}
                    </button>
                  </span>
                </div>
              );
            })}

            {rows.length === 0 ? (
              <p className="scr-admin-stock__empty">
                {t("screensA.stock.empty")}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
