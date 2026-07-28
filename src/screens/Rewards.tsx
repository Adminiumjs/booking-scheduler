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
import { data } from "../data/source.ts";
import {
  EARNED_THIS_YEAR,
  NEXT_REWARD_COST,
  REWARD_CARDS,
  REWARD_LEDGER,
  REWARD_RULES,
  type RewardCard,
} from "../data/screens/rewards.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-rewards.css";

/** Copy in the seed names specialists as `{staff}`; the roster fills it in. */
function fillStaff(text: string, staffId?: string): string {
  if (!staffId) return text;
  const name = data.getStaffMember(staffId)?.name ?? "your specialist";
  return text.replace("{staff}", name);
}

function redeemLabel(reward: RewardCard, balance: number, done: boolean): string {
  if (done) return "Redeemed · in your account";
  if (balance >= reward.cost) return "Redeem";
  return `${reward.cost - balance} points to go`;
}

export default function Rewards() {
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

  const pct = Math.min(100, Math.round((balance / NEXT_REWARD_COST) * 100));
  const toGo =
    balance >= NEXT_REWARD_COST
      ? "You can redeem the $25 reward now."
      : `${NEXT_REWARD_COST - balance} points to your next $25 reward`;

  const facts = [
    { label: "Earned this year", value: EARNED_THIS_YEAR },
    { label: "Redeemed", value: String(spent) },
    { label: "Tier", value: member ? "Circle" : "Guest" },
  ];

  const redeem = (reward: RewardCard): void => {
    if (rwRedeemed[reward.id] !== undefined || balance < reward.cost) return;
    set({ rwRedeemed: { ...rwRedeemed, [reward.id]: reward.cost } });
    showToast(`${reward.name} · added to your account`);
  };

  return (
    <section className="bk-screen bk-page scr-rewards">
      {/* The comp opens straight on the balance panel with no page heading at
          all. The design is right — a second title above the hero would be
          noise — so the heading exists for screen readers only. */}
      <h1 className="bk-sr-only">Loyalty rewards</h1>

      <div className="scr-rewards__hero">
        <div className="scr-rewards__balance">
          <span className="scr-rewards__herolabel">Your balance</span>
          <div className="scr-rewards__figure">
            <span className="bk-mono scr-rewards__points">{balance}</span>
            <span className="scr-rewards__unit">points</span>
          </div>
          <div
            className="scr-rewards__track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={NEXT_REWARD_COST}
            aria-valuenow={Math.min(balance, NEXT_REWARD_COST)}
            aria-label="Progress to your next $25 reward"
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

      <h2 className="scr-rewards__label">Spend your points</h2>
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
                <h3 className="scr-rw-card__name">{r.name}</h3>
                <p className="scr-rw-card__blurb">{fillStaff(r.blurb, r.staff)}</p>
                <div className="scr-rw-card__meta">
                  <span className="bk-mono scr-rw-card__cost">{r.cost} pts</span>
                  <span className="scr-rw-card__note">{r.note}</span>
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
                  {redeemLabel(r, balance, done)}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="scr-rewards__foot">
        <div className="scr-rewards__ledger">
          <h2 className="scr-rewards__panelhead">Recent points</h2>
          {REWARD_LEDGER.map((l) => (
            <div className="scr-rewards__row" key={`${l.label}${l.date}`}>
              <span className="scr-rewards__rowid">
                <span className="scr-rewards__rowlabel">
                  {fillStaff(l.label, l.staff)}
                </span>
                <span className="scr-rewards__rowdate">{l.date}</span>
              </span>
              <span className="bk-mono scr-rewards__rowamount">+{l.amount}</span>
            </div>
          ))}
        </div>

        <div className="scr-rewards__rules">
          <h2 className="scr-rewards__ruleshead">How points work</h2>
          {REWARD_RULES.map((r) => (
            <p className="scr-rewards__rule" key={r.text}>
              <Icon name={r.icon} size={15} className="scr-rewards__ruleicon" />
              {r.text}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
