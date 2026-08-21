/*
 * POINT OF SALE (view: 'admin-pos') — the front-desk till.
 *
 * Two panes: a catalogue you tap to build a ticket, and the ticket itself.
 * Everything sellable is flattened into one id-keyed map (`s_` service,
 * `p_` product, `g_` gift card) so a line rung up on the Services tab survives
 * a switch to Retail — the comp's `allPos` lookup, kept because dropping it
 * would silently blank a line the moment the tab changed.
 *
 * The catalogue reads the seam, not a till-local copy: the services are the
 * ones guests can book, the retail is the shelf the storefront sells, and the
 * gift-card denominations are the ones the gift-card screen issues.
 */

import { Avatar, Chip, Icon, IconTile } from "../components/index.ts";
import {
  nextPosGuest,
  posGuest,
  POS_GIFT_TINT,
  POS_METHODS,
  POS_TABS,
  POS_TAX_RATE,
  POS_TIPS,
} from "../data/screens/admin-pos.ts";
import { STOCK_ITEMS } from "../data/screens/admin-stock.ts";
import { sizeLabel } from "../data/screens/shop.ts";
import { data } from "../data/source.ts";
import { hash } from "../lib/codes.ts";
import { useI18n } from "../i18n/index.tsx";
import type { TFunction } from "../i18n/index.tsx";
import { durationLabel, money } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-admin-pos.css";

/** One tappable thing on the till. */
interface PosItem {
  id: string;
  tab: string;
  name: string;
  /** Whole dollars. */
  price: number;
  /** The line under the price — duration, pack size, or "emailed". */
  meta: string;
  icon: string;
  tint: string;
}

/** Everything the till can ring up, in tab order. */
function buildCatalogue(t: TFunction): PosItem[] {
  const services: PosItem[] = data.getServices().map((s) => ({
    id: `s_${s.id}`,
    tab: "svc",
    name: s.name,
    price: s.price,
    meta: durationLabel(s.dur),
    icon: s.icon,
    tint: s.tint,
  }));

  const retail: PosItem[] = STOCK_ITEMS.map((p) => ({
    id: `p_${p.id}`,
    tab: "retail",
    name: p.name,
    price: p.price,
    meta: sizeLabel(t, p.ml),
    icon: p.icon,
    tint: p.tint,
  }));

  const gifts: PosItem[] = data.getGiftAmounts().map((n) => ({
    id: `g_${n}`,
    tab: "gift",
    name: t("screensA.pos.giftCard", { amount: money(n) }),
    price: n,
    meta: t("screensA.pos.emailed"),
    icon: "gift",
    tint: POS_GIFT_TINT,
  }));

  return [...services, ...retail, ...gifts];
}

export default function AdminPos() {
  const { t, number } = useI18n();
  const posCat = useStore((s) => s.posCat);
  const posCart = useStore((s) => s.posCart);
  const posTip = useStore((s) => s.posTip);
  const posMethod = useStore((s) => s.posMethod);
  const posDone = useStore((s) => s.posDone);
  const guestId = useStore((s) => s.posGuest);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const catalogue = buildCatalogue(t);
  const byId = new Map(catalogue.map((i) => [i.id, i]));
  const shown = catalogue.filter((i) => i.tab === posCat);

  const lines = Object.keys(posCart)
    .map((id) => {
      const item = byId.get(id);
      const qty = posCart[id];
      /* An id with no product behind it is dropped rather than rendered as a
       * blank $0 line — the same rule the guest bag follows. */
      return item && qty ? { item, qty, amount: item.price * qty } : null;
    })
    .filter((l): l is { item: PosItem; qty: number; amount: number } => l !== null);

  const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
  const tip = subtotal * (posTip / 100);
  const tax = subtotal * POS_TAX_RATE;
  const total = subtotal + tip + tax;

  const guest = posGuest(guestId);
  const empty = lines.length === 0;
  /* Sorted so the reference depends on *what* is on the ticket, not the order
   * it was tapped in — the comp's unsorted join renumbered a settled ticket
   * when the same lines were re-added in a different order. */
  const ref = `TKT-${2200 + (hash(lines.map((l) => l.item.id).sort().join("")) % 90)}`;

  /** Move a line by `delta`; a line that reaches zero leaves the ticket. */
  const bump = (id: string, delta: number): void => {
    const next = { ...posCart };
    const qty = (next[id] ?? 0) + delta;
    if (qty > 0) next[id] = qty;
    else delete next[id];
    /* Adding to a settled ticket reopens it rather than editing a paid sale. */
    set({ posCart: next, posDone: false });
  };

  const charge = (): void => {
    if (empty) {
      showToast(t("screensA.pos.addFirst"), "warn");
      return;
    }
    set({ posDone: true });
    showToast(t("screensA.pos.paidToast"), "ok");
  };

  const methodLabel =
    t((POS_METHODS.find((m) => m.id === posMethod) ?? POS_METHODS[0]).labelKey);

  return (
    <div className="scr-admin-pos">
      <section className="bk-panel scr-admin-pos__catalogue">
        <div className="scr-admin-pos__tabs">
          {POS_TABS.map((tab) => (
            <Chip
              key={tab.id}
              label={t(tab.labelKey)}
              active={posCat === tab.id}
              onClick={() => set({ posCat: tab.id })}
            />
          ))}
          <span className="scr-admin-pos__hint">{t("screensA.pos.tapHint")}</span>
        </div>

        <div className="scr-admin-pos__items">
          {shown.map((p) => (
            <button
              key={p.id}
              type="button"
              className="bk-card scr-admin-pos__item"
              onClick={() => bump(p.id, 1)}
            >
              <IconTile
                icon={p.icon}
                tint={p.tint}
                size={30}
                iconSize={16}
                radius={10}
              />
              <span className="scr-admin-pos__itemname">{p.name}</span>
              <span className="scr-admin-pos__itemfoot">
                <span className="bk-mono scr-admin-pos__itemprice">
                  {money(p.price)}
                </span>
                <span className="scr-admin-pos__itemmeta">{p.meta}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <aside className="bk-panel scr-admin-pos__ticket">
        <div className="scr-admin-pos__tickethead">
          <span className="scr-admin-pos__tickettitle">
            {t("screensA.pos.ticket")}
          </span>
          <span className="bk-mono scr-admin-pos__ref">{ref}</span>
        </div>

        {posDone ? (
          <div className="scr-admin-pos__done">
            <span className="scr-admin-pos__donemark">
              <Icon name="check" size={29} />
            </span>
            <span className="scr-admin-pos__donetotal">
              {t("screensA.pos.paid", { amount: money(total) })}
            </span>
            <span className="scr-admin-pos__donesub">
              {methodLabel} · {guest.name} · {ref}
            </span>
            <div className="scr-admin-pos__doneacts">
              <button
                type="button"
                className="bk-gi scr-admin-pos__doneghost"
                onClick={() =>
                  showToast(
                    t("screensA.pos.receiptSent", { email: guest.email }),
                    "ok",
                  )
                }
              >
                {t("screensA.pos.emailReceipt")}
              </button>
              <button
                type="button"
                className="bk-btn scr-admin-pos__donenew"
                onClick={() => set({ posCart: {}, posDone: false, posTip: 18 })}
              >
                {t("screensA.pos.newTicket")}
              </button>
            </div>
          </div>
        ) : (
          <div className="scr-admin-pos__pay">
            <button
              type="button"
              className="scr-admin-pos__guest"
              onClick={() => set({ posGuest: nextPosGuest(guestId).id })}
            >
              <Avatar
                initials={guest.initials}
                tint={guest.tint}
                size={32}
                fontSize={11}
                radius={16}
              />
              <span className="scr-admin-pos__guesttext">
                <span className="scr-admin-pos__guestname">{guest.name}</span>
                <span className="scr-admin-pos__guestmeta">
                  {t("screensA.pos.guestMeta", {
                    visits: t("count.visit", {}, guest.visits),
                    spend: money(guest.spend),
                  })}
                </span>
              </span>
              <Icon
                name="chevron-right"
                size={15}
                className="scr-admin-pos__guestchev"
              />
            </button>

            {empty ? (
              <div className="scr-admin-pos__empty">
                <Icon name="receipt" size={24} className="scr-admin-pos__emptyicon" />
                <span className="scr-admin-pos__emptytitle">
                  {t("screensA.pos.emptyTitle")}
                </span>
                <span className="scr-admin-pos__emptybody">
                  {t("screensA.pos.emptyBody")}
                </span>
              </div>
            ) : (
              <div className="scr-admin-pos__lines">
                {lines.map((l) => (
                  <div key={l.item.id} className="scr-admin-pos__line">
                    <span className="scr-admin-pos__linetext">
                      <span className="scr-admin-pos__linename">{l.item.name}</span>
                      <span className="scr-admin-pos__lineeach">
                        {t("screensA.pos.each", { price: money(l.item.price) })}
                      </span>
                    </span>
                    <span className="scr-admin-pos__qty">
                      <button
                        type="button"
                        className="bk-gi scr-admin-pos__qtybtn"
                        onClick={() => bump(l.item.id, -1)}
                        aria-label={t("screensA.pos.removeOne", {
                          name: l.item.name,
                        })}
                      >
                        <Icon name="minus" size={13} />
                      </button>
                      <span className="bk-mono scr-admin-pos__qtyval">
                        {number(l.qty)}
                      </span>
                      <button
                        type="button"
                        className="bk-gi scr-admin-pos__qtybtn"
                        onClick={() => bump(l.item.id, 1)}
                        aria-label={t("screensA.pos.addAnother", {
                          name: l.item.name,
                        })}
                      >
                        <Icon name="plus" size={13} />
                      </button>
                    </span>
                    <span className="bk-mono scr-admin-pos__lineamt">
                      {money(l.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="scr-admin-pos__group">
              <span className="scr-admin-pos__grouplabel">{t("screensA.pos.tip")}</span>
              <div className="scr-admin-pos__tips">
                {POS_TIPS.map((n) => (
                  <Chip
                    key={n}
                    label={
                      n === 0
                        ? t("screensA.common.noTip")
                        : number(n / 100, { style: "percent" })
                    }
                    active={posTip === n}
                    onClick={() => set({ posTip: n })}
                  />
                ))}
              </div>
            </div>

            <div className="scr-admin-pos__group">
              <span className="scr-admin-pos__grouplabel">
                {t("screensA.pos.payBy")}
              </span>
              <div className="scr-admin-pos__methods">
                {POS_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className="scr-admin-pos__meth"
                    data-on={posMethod === m.id ? "true" : "false"}
                    aria-pressed={posMethod === m.id}
                    onClick={() => set({ posMethod: m.id })}
                  >
                    <Icon name={m.icon} size={15} />
                    {t(m.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div className="scr-admin-pos__totals">
              <div className="scr-admin-pos__totalrow">
                <span className="scr-admin-pos__totallabel">
                  {t("screensA.common.subtotal")}
                </span>
                <span className="bk-mono scr-admin-pos__totalval">
                  {money(subtotal)}
                </span>
              </div>
              <div className="scr-admin-pos__totalrow">
                <span className="scr-admin-pos__totallabel">
                  {t("screensA.pos.tipRow", {
                    percent: number(posTip / 100, { style: "percent" }),
                  })}
                </span>
                <span className="bk-mono scr-admin-pos__totalval">{money(tip)}</span>
              </div>
              <div className="scr-admin-pos__totalrow">
                <span className="scr-admin-pos__totallabel">
                  {t("screensA.common.tax")}
                </span>
                <span className="bk-mono scr-admin-pos__totalval">{money(tax)}</span>
              </div>

              <div className="scr-admin-pos__grand">
                <span className="scr-admin-pos__grandlabel">
                  {t("screensA.common.total")}
                </span>
                <span className="bk-mono scr-admin-pos__grandval">{money(total)}</span>
              </div>

              <button
                type="button"
                className="bk-btn scr-admin-pos__charge"
                data-ready={empty ? "false" : "true"}
                onClick={charge}
              >
                <Icon name="credit-card" size={17} />
                {empty
                  ? t("screensA.pos.chargeEmpty")
                  : t("screensA.pos.charge", { amount: money(total) })}
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
