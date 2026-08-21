/*
 * LOYALTY HISTORY — view `lhistory` (spec §3.7, §5.10).
 *
 * The balance card reads the live store points (so a redemption on the Loyalty
 * screen is reflected here); the ledger itself is seeded history from the
 * DataSource, newest first, with the running balance already computed.
 */

import type { CSSProperties } from "react";

import { BackLink, Button } from "../components/index.ts";
import { data, seedText } from "../data/source.ts";
import { useI18n } from "../i18n/index.tsx";
import { formatMediumISO, pointsDelta } from "../lib/format.ts";
import { useStore } from "../state/store.ts";
import "../styles/screen-lhistory.css";

/** `Button` writes its size geometry inline, so the override goes there too. */
const REDEEM_CTA: CSSProperties = {
  padding: "11px 18px",
  borderRadius: "12px",
  fontSize: "13px",
};

export default function LoyaltyHistory() {
  const { t, number } = useI18n();
  const points = useStore((s) => s.points);
  const go = useStore((s) => s.go);

  const rows = data.getLoyaltyLedger();

  return (
    <main className="bk-screen bk-page bk-lhistory">
      <BackLink onClick={() => go("home")}>
        {t("screensB.common.backHome")}
      </BackLink>

      <div className="bk-lhistory__intro">
        <h1 className="bk-h1">{t("screensB.lhistory.title")}</h1>
        <p className="bk-sub bk-lhistory__sub">{t("screensB.lhistory.sub")}</p>
      </div>

      <div className="bk-lhistory-balance">
        <div>
          <div className="bk-lhistory-balance__label">
            {t("screensB.lhistory.currentBalance")}
          </div>
          <div className="bk-lhistory-balance__figure">
            <span className="bk-mono bk-lhistory-balance__value">
              {number(points)}
            </span>
            <span className="bk-lhistory-balance__unit">
              {t("screensB.common.ptsUnit", {}, points)}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          icon="gift"
          iconSize={15}
          className="bk-lhistory-balance__cta"
          style={REDEEM_CTA}
          onClick={() => go("loyalty")}
        >
          {t("screensB.lhistory.redeemRewards")}
        </Button>
      </div>

      <div className="bk-lhistory-ledger">
        {rows.map((row) => (
          <div className="bk-lhistory-row" key={row.dateISO}>
            <div className="bk-lhistory-row__text">
              <div className="bk-lhistory-row__label">
                {seedText(t, row.labelKey, {
                  svc: row.svc,
                  staff: row.staff,
                  amount: row.amount,
                })}
              </div>
              <div className="bk-lhistory-row__date">
                {formatMediumISO(row.dateISO)}
              </div>
            </div>
            <div className="bk-lhistory-row__end">
              <div
                className="bk-mono bk-lhistory-row__delta"
                data-sign={row.delta >= 0 ? "pos" : "neg"}
              >
                {pointsDelta(row.delta)}
              </div>
              <div className="bk-mono bk-lhistory-row__balance">
                {t("screensB.common.ptsCount", { count: number(row.balance) }, row.balance)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
