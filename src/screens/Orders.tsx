/*
 * ORDER HISTORY (view: 'orders') — every visit, package and gift card the
 * guest has paid for.
 *
 * Receipts are seeded rather than derived from `state.bookings`: they are
 * settled payments that predate the session, and three of them are not
 * bookings at all. The filter chips narrow the list; the "Spent in 2026"
 * figure deliberately stays on the full set, so switching filters never makes
 * the year's total appear to change.
 */

import { useMemo } from "react";

import { BackLink, Button, Chip, EmptyState, IconTile, StatusPill } from "../components/index.ts";
import type { StatusTone } from "../components/index.ts";
import {
  ORDER_FILTERS,
  ORDER_STATUS_KEY,
  ORDERS,
} from "../data/screens/orders.ts";
import type { Order, OrderStatus } from "../data/screens/orders.ts";
import { useT } from "../i18n/index.tsx";
import {
  durationLabel,
  formatMediumISO,
  formatMonthYearISO,
  formatNumber,
  money,
} from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-orders.css";

/** Refunds read as a warning, finished business as muted, live money as good. */
function toneFor(status: OrderStatus): StatusTone {
  if (status === "refunded") return "warn";
  if (status === "completed") return "muted";
  return "pos";
}

interface MonthGroup {
  /** `'2026-07'` — a machine key, so grouping never depends on the language. */
  key: string;
  rows: Order[];
}

/** Groups in first-seen order, which is the seed's newest-first order. */
function groupByMonth(orders: readonly Order[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const o of orders) {
    const key = o.dateISO.slice(0, 7);
    const found = groups.find((g) => g.key === key);
    if (found) found.rows.push(o);
    else groups.push({ key, rows: [o] });
  }
  return groups;
}

export default function Orders() {
  const t = useT();
  const ordFilter = useStore((s) => s.ordFilter);
  const acctEmail = useStore((s) => s.acct.email);
  const go = useStore((s) => s.go);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const groups = useMemo(() => {
    const rows = ORDERS.filter(
      (o) => ordFilter === "all" || o.type === ordFilter,
    );
    return groupByMonth(rows);
  }, [ordFilter]);

  /* Refunded money was never really spent, so it is left out of the total. */
  const spent = ORDERS.reduce(
    (sum, o) => sum + (o.status === "refunded" ? 0 : o.amount),
    0,
  );

  return (
    <section className="bk-screen bk-page scr-orders">
      <BackLink onClick={() => go("dash")}>
        {t("screensB.common.backToDashboard")}
      </BackLink>

      <header className="scr-orders__head">
        <div>
          <h1 className="bk-h1">{t("screensB.orders.title")}</h1>
          <p className="bk-sub scr-orders__sub">{t("screensB.orders.sub")}</p>
        </div>
        <div className="bk-panel scr-orders__total">
          <span className="scr-orders__totallabel">
            {t("screensB.orders.spent")}
          </span>
          <span className="bk-mono scr-orders__totalvalue">{money(spent)}</span>
        </div>
      </header>

      <div className="scr-orders__filters">
        {ORDER_FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={t(f.labelKey)}
            active={ordFilter === f.value}
            onClick={() => set({ ordFilter: f.value })}
          />
        ))}
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon="receipt"
          title={t("screensB.orders.emptyTitle")}
          body={t("screensB.orders.emptyBody")}
        />
      ) : (
        <div className="scr-orders__groups">
          {groups.map((g) => (
            <section key={g.key}>
              <h2 className="bk-eyebrow scr-orders__month">
                {formatMonthYearISO(g.rows[0].dateISO)}
              </h2>
              <div className="bk-panel scr-orders__list">
                {g.rows.map((o) => (
                  <article key={o.code} className="scr-orders__row">
                    <IconTile icon={o.icon} tint={o.tint} size={44} iconSize={20} radius={15} />
                    <div className="scr-orders__body">
                      <div className="scr-orders__label">{o.label}</div>
                      <div className="scr-orders__meta">
                        {t(
                          o.subKey,
                          {
                            date: formatMediumISO(o.dateISO),
                            ...(o.dur === undefined
                              ? null
                              : { duration: durationLabel(o.dur) }),
                            ...(o.sessions === undefined
                              ? null
                              : { count: formatNumber(o.sessions) }),
                          },
                          o.sessions,
                        )}
                      </div>
                      <div className="scr-orders__tags">
                        <StatusPill
                          tone={toneFor(o.status)}
                          className="scr-orders__status"
                        >
                          {t(ORDER_STATUS_KEY[o.status])}
                        </StatusPill>
                        <span className="bk-mono scr-orders__code">{o.code}</span>
                      </div>
                    </div>
                    <div className="scr-orders__side">
                      <span className="bk-mono scr-orders__amount">
                        {money(o.amount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          showToast(
                            t("screensB.orders.toastReceipt", {
                              code: o.code,
                              email: acctEmail,
                            }),
                            "ok",
                          )
                        }
                      >
                        {t("screensB.common.receipt")}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
