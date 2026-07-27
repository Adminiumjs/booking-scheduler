/*
 * LOYALTY / MEMBERSHIP — view `loyalty` (spec §3.7, §5.8, §5.9, §6.12).
 *
 * Points card + progress to the next tier, "How it works", the reward grid
 * (redeem goes through the store so the "Not enough points yet" guard and the
 * "Redeemed: {label}" toast stay in one place), and the two membership plans.
 */

import type { CSSProperties } from "react";

import { Button, Icon, IconTile } from "../components/index.ts";
import { data } from "../data/source.ts";
import { useStore } from "../state/store.ts";
import "../styles/screen-loyalty.css";

/**
 * The comp pairs each "How it works" line with a glyph, but the DataSource
 * exposes the three strings only — the icons live with the presentation.
 */
const HOW_ICONS = ["sparkles", "gift", "gem"] as const;

/*
 * `Button` writes its size geometry as an inline style, so these one-off
 * dimensions have to come through the same channel. Module scope keeps them
 * stable across renders.
 */
const REDEEM_BTN: CSSProperties = {
  padding: "9px 14px",
  borderRadius: "10px",
  fontSize: "12.5px",
};

const JOIN_BTN: CSSProperties = {
  padding: "12px",
  borderRadius: "12px",
  fontSize: "14px",
};

export default function Loyalty() {
  const points = useStore((s) => s.points);
  const member = useStore((s) => s.member);
  const loyaltyJoin = useStore((s) => s.loyaltyJoin);
  const loyaltyRedeem = useStore((s) => s.loyaltyRedeem);

  const rewards = data.getRewards();
  const plans = data.getPlans();
  const howItWorks = data.getLoyaltyHowItWorks();
  const threshold = data.getLoyaltyThreshold();

  const pct = Math.min(100, Math.round((points / threshold) * 100));
  const toGo =
    points >= threshold
      ? "You’ve unlocked a free service — redeem below."
      : `${Math.max(0, threshold - points)} pts until your next free service`;

  return (
    <main className="bk-screen bk-page bk-loyalty">
      <div className="bk-loyalty__intro">
        <span className="bk-loyalty__eyebrow">
          <Icon name="gem" size={14} />
          Studio Circle
        </span>
        <h1 className="bk-loyalty__h1">A little glow with every visit.</h1>
        <p className="bk-loyalty__sub">
          Earn a point for every dollar, redeem for services you love, and unlock
          more as a member. It's free to join.
        </p>
      </div>

      <div className="bk-loyalty__cards">
        <div className="bk-loyalty-points">
          <div className="bk-loyalty-points__head">
            <span className="bk-loyalty-points__label">Your points</span>
            {member ? (
              <span className="bk-loyalty-points__member">
                <Icon name="gem" size={12} />
                Member
              </span>
            ) : null}
          </div>
          <div className="bk-loyalty-points__figure">
            <span className="bk-mono bk-loyalty-points__value">{points}</span>
            <span className="bk-loyalty-points__unit">pts</span>
          </div>
          <div
            className="bk-loyalty-points__track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={threshold}
            aria-valuenow={Math.min(points, threshold)}
            aria-label="Progress to your next free service"
          >
            <div className="bk-loyalty-points__fill" style={{ inlineSize: `${pct}%` }} />
          </div>
          <div className="bk-loyalty-points__togo">{toGo}</div>
        </div>

        <div className="bk-loyalty-how">
          <span className="bk-loyalty-how__label">How it works</span>
          {howItWorks.map((line, i) => (
            <div className="bk-loyalty-how__row" key={line}>
              <span className="bk-loyalty-how__glyph">
                <Icon name={HOW_ICONS[i] ?? "sparkles"} size={16} />
              </span>
              <span className="bk-loyalty-how__text">{line}</span>
            </div>
          ))}
        </div>
      </div>

      <h2 className="bk-loyalty__h2">Redeem your points</h2>
      <div className="bk-loyalty__rewards">
        {rewards.map((r) => {
          const locked = points < r.cost;
          return (
            <div className="bk-card bk-loyalty-reward" key={r.label}>
              <IconTile icon={r.icon} tint={r.tint} size={44} iconSize={20} radius={12} />
              <div className="bk-loyalty-reward__body">
                <div className="bk-loyalty-reward__name">{r.label}</div>
                <div className="bk-mono bk-loyalty-reward__cost">{r.cost} pts</div>
              </div>
              <Button
                variant="primary"
                size="sm"
                style={REDEEM_BTN}
                disabled={locked}
                onClick={() => loyaltyRedeem(r.cost, r.label)}
              >
                {locked ? "Locked" : "Redeem"}
              </Button>
            </div>
          );
        })}
      </div>

      <h2 className="bk-loyalty__h2">Become a member</h2>
      <p className="bk-loyalty__h2sub">
        Go further with Studio Circle membership — cancel anytime.
      </p>
      <div className="bk-loyalty__plans">
        {plans.map((p) => (
          <div
            className="bk-loyalty-plan"
            data-featured={p.featured ? "true" : "false"}
            key={p.name}
          >
            {p.featured ? (
              <span className="bk-loyalty-plan__ribbon">Most loved</span>
            ) : null}
            <div>
              <div className="bk-loyalty-plan__name">{p.name}</div>
              <div className="bk-loyalty-plan__pricerow">
                <span className="bk-mono bk-loyalty-plan__price">{p.price}</span>
                <span className="bk-loyalty-plan__cadence">{p.cadence}</span>
              </div>
            </div>
            <div className="bk-loyalty-plan__perks">
              {p.perks.map((perk) => (
                <div className="bk-loyalty-plan__perk" key={perk}>
                  <Icon name="check" size={15} className="bk-loyalty-plan__tick" />
                  {perk}
                </div>
              ))}
            </div>
            <Button
              variant={p.featured ? "primary" : "ghost"}
              icon="gem"
              full
              className="bk-loyalty-plan__join"
              style={JOIN_BTN}
              onClick={loyaltyJoin}
            >
              {member ? "You’re a member ✓" : `Join ${p.name}`}
            </Button>
          </div>
        ))}
      </div>
    </main>
  );
}
