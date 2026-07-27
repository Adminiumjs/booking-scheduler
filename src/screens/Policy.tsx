/*
 * CANCELLATION POLICY (view: 'policy') — port spec §3.7.
 *
 * Static copy: four tinted cards plus the standard demo banner. The 24-hour
 * window here is the same one the cancel modal quotes (§4.21).
 */

import { BackLink, Banner, Icon } from "../components/index.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-policy.css";

type PolicyTone = "accent" | "warn";

interface PolicyCard {
  icon: string;
  tone: PolicyTone;
  title: string;
  body: string;
}

const POLICY_CARDS: readonly PolicyCard[] = [
  {
    icon: "clock",
    tone: "accent",
    title: "A 24-hour window",
    body: "Cancel or reschedule up to 24 hours before your start time, free of charge, straight from Manage booking.",
  },
  {
    icon: "alert-triangle",
    tone: "warn",
    title: "Late cancellations & no-shows",
    body: "Inside 24 hours, a 50% fee applies. No-shows are charged in full so the chair doesn’t sit empty.",
  },
  {
    icon: "settings-2",
    tone: "accent",
    title: "How to cancel",
    body: "Head to Manage booking, enter your code and email, and choose Reschedule or Cancel — no phone call needed.",
  },
  {
    icon: "gem",
    tone: "accent",
    title: "Members & packages",
    body: "Studio Circle members get one fee-free late cancel each month. Package sessions are simply returned to your balance.",
  },
];

export default function Policy() {
  const go = useStore((s) => s.go);

  return (
    <main className="bk-screen bk-page bk-policy">
      <BackLink onClick={() => go("home")}>Back home</BackLink>

      <div className="bk-policy__head">
        <h1 className="bk-h1">Cancellation policy</h1>
        <p className="bk-sub">
          Plans change — we get it. Here’s how ours works, in plain language.
        </p>
      </div>

      <div className="bk-policy__list">
        {POLICY_CARDS.map((card) => (
          <section className="bk-panel bk-policy-card" key={card.title}>
            <span className="bk-policy-card__tile" data-tone={card.tone}>
              <Icon name={card.icon} size={20} />
            </span>
            <div>
              <h2 className="bk-policy-card__title">{card.title}</h2>
              <p className="bk-policy-card__body">{card.body}</p>
            </div>
          </section>
        ))}
      </div>

      <Banner tone="info" className="bk-policy__banner">
        This is a demo policy for illustration — no fees are ever actually
        charged.
      </Banner>
    </main>
  );
}
