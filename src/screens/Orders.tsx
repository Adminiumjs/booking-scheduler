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
import { ORDER_FILTERS, ORDERS } from "../data/screens/orders.ts";
import type { Order, OrderStatus } from "../data/screens/orders.ts";
import { money } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-orders.css";

/** Refunds read as a warning, finished business as muted, live money as good. */
function toneFor(status: OrderStatus): StatusTone {
  if (status === "Refunded") return "warn";
  if (status === "Completed") return "muted";
  return "pos";
}

interface MonthGroup {
  month: string;
  rows: Order[];
}

/** Groups in first-seen order, which is the seed's newest-first order. */
function groupByMonth(orders: readonly Order[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const o of orders) {
    const found = groups.find((g) => g.month === o.month);
    if (found) found.rows.push(o);
    else groups.push({ month: o.month, rows: [o] });
  }
  return groups;
}

export default function Orders() {
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
    (sum, o) => sum + (o.status === "Refunded" ? 0 : o.amount),
    0,
  );

  return (
    <section className="bk-screen bk-page scr-orders">
      <BackLink onClick={() => go("dash")}>Back to dashboard</BackLink>

      <header className="scr-orders__head">
        <div>
          <h1 className="bk-h1">Order history</h1>
          <p className="bk-sub scr-orders__sub">
            Every visit, package and gift card you’ve paid for.
          </p>
        </div>
        <div className="bk-panel scr-orders__total">
          <span className="scr-orders__totallabel">Spent in 2026</span>
          <span className="bk-mono scr-orders__totalvalue">{money(spent)}</span>
        </div>
      </header>

      <div className="scr-orders__filters">
        {ORDER_FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            active={ordFilter === f.value}
            onClick={() => set({ ordFilter: f.value })}
          />
        ))}
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon="receipt"
          title="Nothing in this filter"
          body="Try another category — your other orders are still there."
        />
      ) : (
        <div className="scr-orders__groups">
          {groups.map((g) => (
            <section key={g.month}>
              <h2 className="bk-eyebrow scr-orders__month">{g.month}</h2>
              <div className="bk-panel scr-orders__list">
                {g.rows.map((o) => (
                  <article key={o.code} className="scr-orders__row">
                    <IconTile icon={o.icon} tint={o.tint} size={44} iconSize={20} radius={15} />
                    <div className="scr-orders__body">
                      <div className="scr-orders__label">{o.label}</div>
                      <div className="scr-orders__meta">{o.sub}</div>
                      <div className="scr-orders__tags">
                        <StatusPill
                          tone={toneFor(o.status)}
                          className="scr-orders__status"
                        >
                          {o.status}
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
                          showToast(`Receipt ${o.code} emailed to ${acctEmail}`, "ok")
                        }
                      >
                        Receipt
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
