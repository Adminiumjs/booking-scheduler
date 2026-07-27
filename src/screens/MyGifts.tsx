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
import { money } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-mygifts.css";

export default function MyGifts() {
  const gifts = useStore((s) => s.gifts);
  const go = useStore((s) => s.go);
  const setGift = useStore((s) => s.setGift);

  const buy = (): void => {
    setGift({ gcStep: "design", gcCode: null, gcErr: "" });
    go("giftcards");
  };

  return (
    <main className="sm-screen sm-page sm-mygifts-page">
      <BackLink onClick={() => go("home")}>Back home</BackLink>

      <div className="sm-mygifts-head">
        <div>
          <h1 className="sm-h1">Purchased gift cards</h1>
          <p className="sm-sub">Gift cards you&apos;ve bought and sent.</p>
        </div>
        <Button icon="gift" onClick={buy}>
          Buy a gift card
        </Button>
      </div>

      {gifts.length === 0 ? (
        <EmptyState
          icon="gift"
          title="No gift cards yet"
          body="Gift a little calm — the cards you buy will live here."
        />
      ) : null}

      <div className="sm-mygifts-list">
        {gifts.map((g) => (
          <div className="sm-card sm-mygift" key={g.code}>
            <div className="sm-mygift__tile">
              <Icon name="gift" size={24} />
            </div>
            <div className="sm-mygift__text">
              <div className="sm-mygift__top">
                <span className="sm-mono sm-mygift__amount">
                  {money(g.amount)}
                </span>
                <span className="sm-mono sm-mygift__code">{g.code}</span>
              </div>
              <div className="sm-mygift__meta">
                To {g.to} · {g.date}
              </div>
            </div>
            <StatusPill
              tone={g.status === "sent" ? "pos" : "muted"}
              icon="check"
            >
              {g.status === "sent" ? "Sent" : "Redeemed"}
            </StatusPill>
          </div>
        ))}
      </div>
    </main>
  );
}
