/*
 * Footer (spec §4.2). Links to every routable view — ruling R1 ships all 16,
 * so nothing here is a dead route.
 */

import { data } from "../data/source.ts";
import type { View } from "../data/types.ts";
import { useI18n } from "../i18n/index.tsx";
import type { MessageKey } from "../i18n/index.tsx";
import { useStore } from "../state/store.ts";
import { Icon } from "./Icon.tsx";

/**
 * The demo's copyright year. A literal, not `new Date()`: the seeded catalogue
 * is pinned to 2026, and a footer that drifts against it would be the only
 * thing on the page that knows what day it is.
 */
const FOUNDED_YEAR = 2026;

/** Formatted through `Intl` so ar-EG gets Arabic-Indic digits, not "2026". */
const YEAR_STAMP = new Date(FOUNDED_YEAR, 0, 1);

interface FooterLink {
  labelKey: MessageKey;
  view?: View;
  /** Starts the booking flow instead of navigating. */
  book?: boolean;
}

const STUDIO_LINKS: FooterLink[] = [
  { labelKey: "chrome.footer.services", view: "services" },
  { labelKey: "chrome.footer.book", book: true },
  { labelKey: "chrome.footer.group", view: "group" },
  { labelKey: "chrome.footer.loyalty", view: "loyalty" },
  { labelKey: "chrome.footer.gift", view: "giftcards" },
  { labelKey: "chrome.footer.policy", view: "policy" },
];

const ACCOUNT_LINKS: FooterLink[] = [
  { labelKey: "chrome.footer.visits", view: "visits" },
  { labelKey: "chrome.footer.manage", view: "manage" },
  { labelKey: "chrome.footer.waitlist", view: "waitliststatus" },
  { labelKey: "chrome.footer.mygifts", view: "mygifts" },
  { labelKey: "chrome.footer.lhistory", view: "lhistory" },
  { labelKey: "chrome.footer.intake", view: "intake" },
  { labelKey: "chrome.footer.refer", view: "refer" },
];

export function Footer() {
  const { t, date } = useI18n();
  const go = useStore((s) => s.go);
  const startBooking = useStore((s) => s.startBooking);
  const loc = data.getLocation();

  const renderColumn = (headingKey: MessageKey, links: FooterLink[]) => (
    <nav className="bk-footer__col" aria-label={t(headingKey)}>
      <div className="bk-footer__head">{t(headingKey)}</div>
      {links.map((l) => (
        <button
          key={l.labelKey}
          type="button"
          className="bk-nav bk-footer__link"
          onClick={() => (l.book ? startBooking(null) : go(l.view as View))}
        >
          {t(l.labelKey)}
        </button>
      ))}
    </nav>
  );

  return (
    <footer className="bk-footer">
      <div className="bk-footer__inner">
        <div className="bk-footer__brand">
          <div className="bk-footer__brandrow">
            <span className="bk-logo bk-logo--sm" aria-hidden="true">
              {loc.shortName.charAt(0)}
            </span>
            <span className="bk-footer__name">{loc.name}</span>
          </div>
          <p className="bk-footer__blurb">{t("chrome.footer.blurb")}</p>
        </div>
        <div className="bk-footer__cols">
          {renderColumn("chrome.footer.studio", STUDIO_LINKS)}
          {renderColumn("chrome.footer.account", ACCOUNT_LINKS)}
        </div>
      </div>
      <div className="bk-footer__bar">
        <span>
          {t("chrome.footer.legal", { year: date(YEAR_STAMP, { year: "numeric" }), name: loc.name })}
        </span>
        <span className="bk-mono bk-footer__url">
          <Icon name="globe" size={13} />
          {loc.url}
        </span>
      </div>
    </footer>
  );
}
