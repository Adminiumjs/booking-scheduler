/*
 * Purchased gift cards (spec §3.7) — view `mygifts`.
 *
 * A read-only list of `store.gifts`: the seeded GIFT-4821 plus anything bought
 * this session (the gift flow unshifts new cards, so newest is first).
 */

import {
  BackLink,
  Button,
  EmptyState,
  Icon,
  StatusPill,
} from "../components/index.ts";
import { useT } from "../i18n/index.tsx";
import { formatMediumISO, money } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-mygifts.css";

export default function MyGifts() {
  const t = useT();
  const gifts = useStore((s) => s.gifts);
  const go = useStore((s) => s.go);
  const setGift = useStore((s) => s.setGift);

  const buy = (): void => {
    setGift({ gcStep: "design", gcCode: null, gcErr: "" });
    go("giftcards");
  };

  return (
    <main className="bk-screen bk-page bk-mygifts-page">
      <BackLink onClick={() => go("home")}>
        {t("screensB.common.backHome")}
      </BackLink>

      <div className="bk-mygifts-head">
        <div>
          <h1 className="bk-h1">{t("screensB.mygifts.title")}</h1>
          <p className="bk-sub">{t("screensB.mygifts.sub")}</p>
        </div>
        <Button icon="gift" onClick={buy}>
          {t("screensB.mygifts.buy")}
        </Button>
      </div>

      {gifts.length === 0 ? (
        <EmptyState
          icon="gift"
          title={t("screensB.mygifts.emptyTitle")}
          body={t("screensB.mygifts.emptyBody")}
        />
      ) : null}

      <div className="bk-mygifts-list">
        {gifts.map((g) => (
          <div className="bk-card bk-mygift" key={g.code}>
            <div className="bk-mygift__tile">
              <Icon name="gift" size={24} />
            </div>
            <div className="bk-mygift__text">
              <div className="bk-mygift__top">
                <span className="bk-mono bk-mygift__amount">
                  {money(g.amount)}
                </span>
                <span className="bk-mono bk-mygift__code">{g.code}</span>
              </div>
              <div className="bk-mygift__meta">
                {t("screensB.mygifts.to", {
                  name: g.to,
                  date:
                    g.dateISO === null
                      ? t("chrome.gift.justNow")
                      : formatMediumISO(g.dateISO),
                })}
              </div>
            </div>
            <StatusPill
              tone={g.status === "sent" ? "pos" : "muted"}
              icon="check"
            >
              {t(
                g.status === "sent"
                  ? "screensB.mygifts.sent"
                  : "screensB.mygifts.redeemed",
              )}
            </StatusPill>
          </div>
        ))}
      </div>
    </main>
  );
}
