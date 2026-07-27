/*
 * Refer a friend (spec §3.7, §5.11) — view `refer`.
 *
 * The comp only toasted; the port actually writes to the clipboard (§6.12).
 * The avatar shows initials rather than the comp's full name (§8.10 bug fix) —
 * `ReferralInvite.initials` already carries them.
 */

import { BackLink, Button, Icon } from "../components/index.ts";
import { data } from "../data/source.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-refer.css";

export default function Refer() {
  const go = useStore((s) => s.go);
  const showToast = useStore((s) => s.showToast);

  const referral = data.getReferral();

  const copyLink = (): void => {
    const link =
      typeof window === "undefined"
        ? referral.code
        : `${window.location.origin}${window.location.pathname}?ref=${referral.code}`;
    navigator.clipboard?.writeText(link).catch(() => {
      /* clipboard denied — the demo still confirms the intent */
    });
    showToast("Invite link copied to clipboard");
  };

  return (
    <main className="sm-screen sm-page sm-refer-page">
      <BackLink onClick={() => go("home")}>Back home</BackLink>

      <div className="sm-refer-head">
        <h1 className="sm-h1">Refer a friend</h1>
        <p className="sm-sub">Give $15, get $15. Everyone leaves glowing.</p>
      </div>

      <div className="sm-refer-code">
        <div className="sm-refer-code__text">
          <div className="sm-refer-code__label">Your invite code</div>
          <div className="sm-mono sm-refer-code__value">{referral.code}</div>
        </div>
        <Button size="lg" className="sm-refer-share" onClick={copyLink}>
          <Icon name="share-2" size={16} />
          Copy invite link
        </Button>
      </div>

      <section className="sm-refer-section">
        <span className="sm-refer-title">How it works</span>
        <div className="sm-refer-list">
          {referral.steps.map((s) => (
            <div className="sm-refer-step" key={s.label}>
              <span className="sm-refer-step__glyph">
                <Icon name={s.icon} size={17} />
              </span>
              <span className="sm-refer-step__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <span className="sm-refer-title">Your invites</span>
        <div className="sm-refer-list">
          {referral.invites.map((r) => (
            <div className="sm-refer-invite" key={r.name}>
              <span className="sm-refer-invite__avatar" aria-hidden="true">
                {r.initials}
              </span>
              <div className="sm-refer-invite__text">
                <div className="sm-refer-invite__name">{r.name}</div>
                <div className="sm-refer-invite__status">{r.status}</div>
              </div>
              {r.done ? (
                <Icon
                  name="check-circle-2"
                  size={20}
                  className="sm-refer-invite__done"
                />
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
