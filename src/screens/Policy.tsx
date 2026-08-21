/*
 * CANCELLATION POLICY (view: 'policy') — port spec §3.7.
 *
 * Static copy: four tinted cards plus the standard demo banner. The 24-hour
 * window here is the same one the cancel modal quotes (§4.21).
 */

import { BackLink, Banner, Icon } from "../components/index.ts";
import { useT, type MessageKey } from "../i18n/index.tsx";
import { useStore } from "../state/store.ts";

import "../styles/screen-policy.css";

type PolicyTone = "accent" | "warn";

interface PolicyCard {
  icon: string;
  tone: PolicyTone;
  titleKey: MessageKey;
  bodyKey: MessageKey;
}

/* Module scope has no hook, so the cards carry keys and the render site
 * resolves them. */
const POLICY_CARDS: readonly PolicyCard[] = [
  {
    icon: "clock",
    tone: "accent",
    titleKey: "screensB.policy.windowTitle",
    bodyKey: "screensB.policy.windowBody",
  },
  {
    icon: "alert-triangle",
    tone: "warn",
    titleKey: "screensB.policy.lateTitle",
    bodyKey: "screensB.policy.lateBody",
  },
  {
    icon: "settings-2",
    tone: "accent",
    titleKey: "screensB.policy.howTitle",
    bodyKey: "screensB.policy.howBody",
  },
  {
    icon: "gem",
    tone: "accent",
    titleKey: "screensB.policy.membersTitle",
    bodyKey: "screensB.policy.membersBody",
  },
];

export default function Policy() {
  const t = useT();
  const go = useStore((s) => s.go);

  return (
    <main className="bk-screen bk-page bk-policy">
      <BackLink onClick={() => go("home")}>
        {t("screensB.common.backHome")}
      </BackLink>

      <div className="bk-policy__head">
        <h1 className="bk-h1">{t("screensB.policy.title")}</h1>
        <p className="bk-sub">{t("screensB.policy.sub")}</p>
      </div>

      <div className="bk-policy__list">
        {POLICY_CARDS.map((card) => (
          <section className="bk-panel bk-policy-card" key={card.titleKey}>
            <span className="bk-policy-card__tile" data-tone={card.tone}>
              <Icon name={card.icon} size={20} />
            </span>
            <div>
              <h2 className="bk-policy-card__title">{t(card.titleKey)}</h2>
              <p className="bk-policy-card__body">{t(card.bodyKey)}</p>
            </div>
          </section>
        ))}
      </div>

      <Banner tone="info" className="bk-policy__banner">
        {t("screensB.policy.banner")}
      </Banner>
    </main>
  );
}
