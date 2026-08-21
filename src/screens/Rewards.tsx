/*
 * LOYALTY REWARDS (view: 'rewards') — spend your points.
 *
 * The balance is derived, never stored: `rwPoints` is what you have earned and
 * `rwRedeemed` maps reward id → the cost it took, so redeeming is append-only
 * and the arithmetic below is the single place the two meet. That also makes a
 * reward idempotent — claiming one twice cannot double-charge you.
 *
 * This is the comp's own six-card catalogue, which is deliberately separate
 * from the seam's `getRewards()` list behind the original Loyalty screen.
 */

import { useMemo } from "react";

import { Button, Icon, PlaceholderTile } from "../components/index.ts";
import { seedText } from "../data/source.ts";
import {
  EARNED_THIS_YEAR,
  NEXT_REWARD_COST,
  REWARD_CARDS,
  REWARD_LEDGER,
  REWARD_RULES,
  type RewardCard,
} from "../data/screens/rewards.ts";
import { useI18n } from "../i18n/index.tsx";
import { formatMediumISO, money } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-rewards.css";

/** What the milestone reward is worth — the figure the progress copy quotes. */
const NEXT_REWARD_VALUE = 25;

export default function Rewards() {
  const { t, number } = useI18n();
  const rwPoints = useStore((s) => s.rwPoints);
  const rwRedeemed = useStore((s) => s.rwRedeemed);
  const member = useStore((s) => s.member);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const spent = useMemo(
    () => Object.values(rwRedeemed).reduce((n, cost) => n + cost, 0),
    [rwRedeemed],
  );
  const balance = Math.max(0, rwPoints - spent);
  const rewardValue = money(NEXT_REWARD_VALUE);

  const pct = Math.min(100, Math.round((balance / NEXT_REWARD_COST) * 100));
  const toGo =
    balance >= NEXT_REWARD_COST
      ? t("screensB.rewards.canRedeem", { amount: rewardValue })
      : t(
          "screensB.rewards.toGo",
          { amount: rewardValue, count: number(NEXT_REWARD_COST - balance) },
          NEXT_REWARD_COST - balance,
        );

  const redeemLabel = (reward: RewardCard, done: boolean): string => {
    if (done) return t("screensB.rewards.redeemed");
    if (balance >= reward.cost) return t("screensB.rewards.redeem");
    return t(
      "screensB.rewards.pointsToGo",
      { count: number(reward.cost - balance) },
      reward.cost - balance,
    );
  };

  const facts = [
    { label: t("screensB.rewards.factEarned"), value: number(EARNED_THIS_YEAR) },
    { label: t("screensB.rewards.factRedeemed"), value: number(spent) },
    {
      label: t("screensB.rewards.factTier"),
      value: t(
        member ? "screensB.rewards.tierCircle" : "screensB.rewards.tierGuest",
      ),
    },
  ];

  const redeem = (reward: RewardCard): void => {
    if (rwRedeemed[reward.id] !== undefined || balance < reward.cost) return;
    set({ rwRedeemed: { ...rwRedeemed, [reward.id]: reward.cost } });
    showToast(
      t("screensB.rewards.toastRedeemed", {
        name: seedText(t, reward.nameKey, { amount: reward.amount }),
      }),
    );
  };

  return (
    <section className="bk-screen bk-page scr-rewards">
      {/* The comp opens straight on the balance panel with no page heading at
          all. The design is right — a second title above the hero would be
          noise — so the heading exists for screen readers only. */}
      <h1 className="bk-sr-only">{t("screensB.rewards.srTitle")}</h1>

      <div className="scr-rewards__hero">
        <div className="scr-rewards__balance">
          <span className="scr-rewards__herolabel">
            {t("screensB.rewards.yourBalance")}
          </span>
          <div className="scr-rewards__figure">
            <span className="bk-mono scr-rewards__points">
              {number(balance)}
            </span>
            <span className="scr-rewards__unit">
              {t("screensB.common.pointsUnit", {}, balance)}
            </span>
          </div>
          <div
            className="scr-rewards__track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={NEXT_REWARD_COST}
            aria-valuenow={Math.min(balance, NEXT_REWARD_COST)}
            aria-label={t("screensB.rewards.progressLabel", {
              amount: rewardValue,
            })}
          >
            <div
              className="scr-rewards__fill"
              style={{ inlineSize: `${pct}%` }}
            />
          </div>
          <div className="scr-rewards__togo">{toGo}</div>
        </div>

        <dl className="scr-rewards__facts">
          {facts.map((f) => (
            <div className="scr-rewards__fact" key={f.label}>
              <dt className="scr-rewards__factlabel">{f.label}</dt>
              <dd className="bk-mono scr-rewards__factvalue">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <h2 className="scr-rewards__label">{t("screensB.rewards.spendTitle")}</h2>
      <div className="scr-rewards__grid">
        {REWARD_CARDS.map((r) => {
          const done = rwRedeemed[r.id] !== undefined;
          const can = balance >= r.cost && !done;
          return (
            <article
              className="bk-card scr-rw-card"
              data-done={done ? "true" : "false"}
              key={r.id}
            >
              <PlaceholderTile
                tint={r.tint}
                icon={r.icon}
                iconSize={32}
                minHeight={96}
              />
              <div className="scr-rw-card__body">
                <h3 className="scr-rw-card__name">
                  {seedText(t, r.nameKey, { amount: r.amount })}
                </h3>
                <p className="scr-rw-card__blurb">
                  {seedText(t, r.blurbKey, { staff: r.staff })}
                </p>
                <div className="scr-rw-card__meta">
                  <span className="bk-mono scr-rw-card__cost">
                    {t("screensB.common.ptsCount", { count: number(r.cost) }, r.cost)}
                  </span>
                  <span className="scr-rw-card__note">
                    {seedText(t, r.noteKey, { amount: r.worth })}
                  </span>
                </div>
                {/*
                 * The comp left the locked button focusable with a no-op
                 * handler; disabling it tells assistive tech the same thing
                 * the greyed fill tells everyone else.
                 */}
                <Button
                  variant={can ? "primary" : "ghost"}
                  full
                  disabled={!can}
                  className="scr-rw-card__btn"
                  onClick={() => redeem(r)}
                >
                  {redeemLabel(r, done)}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="scr-rewards__foot">
        <div className="scr-rewards__ledger">
          <h2 className="scr-rewards__panelhead">
            {t("screensB.rewards.recentPoints")}
          </h2>
          {REWARD_LEDGER.map((l) => (
            <div className="scr-rewards__row" key={`${l.labelKey}${l.dateISO}`}>
              <span className="scr-rewards__rowid">
                <span className="scr-rewards__rowlabel">
                  {seedText(t, l.labelKey, {
                    svc: l.svc,
                    staff: l.staff,
                    name: l.name,
                  })}
                </span>
                <span className="scr-rewards__rowdate">
                  {formatMediumISO(l.dateISO)}
                </span>
              </span>
              {/* The sign comes from Intl, not a hand-typed '+'. */}
              <span className="bk-mono scr-rewards__rowamount">
                {number(l.amount, { signDisplay: "always" })}
              </span>
            </div>
          ))}
        </div>

        <div className="scr-rewards__rules">
          <h2 className="scr-rewards__ruleshead">
            {t("screensB.rewards.howPointsWork")}
          </h2>
          {REWARD_RULES.map((r) => (
            <p className="scr-rewards__rule" key={r.textKey}>
              <Icon name={r.icon} size={15} className="scr-rewards__ruleicon" />
              {t(r.textKey)}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
