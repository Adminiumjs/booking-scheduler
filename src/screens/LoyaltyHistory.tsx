/*
 * LOYALTY HISTORY — view `lhistory` (spec §3.7, §5.10).
 *
 * The balance card reads the live store points (so a redemption on the Loyalty
 * screen is reflected here); the ledger itself is seeded history from the
 * DataSource, newest first, with the running balance already computed.
 */

import type { CSSProperties } from "react";

import { BackLink, Button } from "../components/index.ts";
import { data } from "../data/source.ts";
import { pointsDelta } from "../lib/format.ts";
import { useStore } from "../state/store.ts";
import "../styles/screen-lhistory.css";

/** `Button` writes its size geometry inline, so the override goes there too. */
const REDEEM_CTA: CSSProperties = {
  padding: "11px 18px",
  borderRadius: "12px",
  fontSize: "13px",
};

export default function LoyaltyHistory() {
  const points = useStore((s) => s.points);
  const go = useStore((s) => s.go);

  const rows = data.getLoyaltyLedger();

  return (
    <main className="sm-screen sm-page sm-lhistory">
      <BackLink onClick={() => go("home")}>Back home</BackLink>

      <div className="sm-lhistory__intro">
        <h1 className="sm-h1">Loyalty history</h1>
        <p className="sm-sub sm-lhistory__sub">
          Every point you've earned and spent with Studio Circle.
        </p>
      </div>

      <div className="sm-lhistory-balance">
        <div>
          <div className="sm-lhistory-balance__label">Current balance</div>
          <div className="sm-lhistory-balance__figure">
            <span className="sm-mono sm-lhistory-balance__value">{points}</span>
            <span className="sm-lhistory-balance__unit">pts</span>
          </div>
        </div>
        <Button
          variant="ghost"
          icon="gift"
          iconSize={15}
          className="sm-lhistory-balance__cta"
          style={REDEEM_CTA}
          onClick={() => go("loyalty")}
        >
          Redeem rewards
        </Button>
      </div>

      <div className="sm-lhistory-ledger">
        {rows.map((row) => (
          <div className="sm-lhistory-row" key={row.label}>
            <div className="sm-lhistory-row__text">
              <div className="sm-lhistory-row__label">{row.label}</div>
              <div className="sm-lhistory-row__date">{row.date}</div>
            </div>
            <div className="sm-lhistory-row__end">
              <div
                className="sm-mono sm-lhistory-row__delta"
                data-sign={row.delta >= 0 ? "pos" : "neg"}
              >
                {pointsDelta(row.delta)}
              </div>
              <div className="sm-mono sm-lhistory-row__balance">{row.balance} pts</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
