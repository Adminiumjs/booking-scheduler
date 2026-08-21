/*
 * Refer a friend (spec §3.7, §5.11) — view `refer`.
 *
 * The comp only toasted; the port actually writes to the clipboard (§6.12).
 * The avatar shows initials rather than the comp's full name (§8.10 bug fix) —
 * `ReferralInvite.initials` already carries them.
 */

import { BackLink, Button, Icon } from "../components/index.ts";
import { data, seedText } from "../data/source.ts";
import { useT } from "../i18n/index.tsx";
import { money } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-refer.css";

/** What each side of a referral is worth. */
const REFERRAL_CREDIT = 15;

export default function Refer() {
  const t = useT();
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
    showToast(t("screensB.refer.toastCopied"));
  };

  return (
    <main className="bk-screen bk-page bk-refer-page">
      <BackLink onClick={() => go("home")}>
        {t("screensB.common.backHome")}
      </BackLink>

      <div className="bk-refer-head">
        <h1 className="bk-h1">{t("screensB.refer.title")}</h1>
        <p className="bk-sub">
          {t("screensB.refer.sub", { amount: money(REFERRAL_CREDIT) })}
        </p>
      </div>

      <div className="bk-refer-code">
        <div className="bk-refer-code__text">
          <div className="bk-refer-code__label">
            {t("screensB.refer.yourCode")}
          </div>
          <div className="bk-mono bk-refer-code__value">{referral.code}</div>
        </div>
        <Button size="lg" className="bk-refer-share" onClick={copyLink}>
          <Icon name="share-2" size={16} />
          {t("screensB.refer.copyLink")}
        </Button>
      </div>

      <section className="bk-refer-section">
        <span className="bk-refer-title">{t("screensB.common.howItWorks")}</span>
        <div className="bk-refer-list">
          {referral.steps.map((s) => (
            <div className="bk-refer-step" key={s.labelKey}>
              <span className="bk-refer-step__glyph">
                <Icon name={s.icon} size={17} />
              </span>
              <span className="bk-refer-step__label">
                {seedText(t, s.labelKey, { amount: s.amount })}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <span className="bk-refer-title">{t("screensB.refer.yourInvites")}</span>
        <div className="bk-refer-list">
          {referral.invites.map((r) => (
            <div className="bk-refer-invite" key={r.name}>
              <span className="bk-refer-invite__avatar" aria-hidden="true">
                {r.initials}
              </span>
              <div className="bk-refer-invite__text">
                <div className="bk-refer-invite__name">{r.name}</div>
                <div className="bk-refer-invite__status">
                  {seedText(t, r.statusKey, { amount: r.amount })}
                </div>
              </div>
              {r.done ? (
                <Icon
                  name="check-circle-2"
                  size={20}
                  className="bk-refer-invite__done"
                />
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
