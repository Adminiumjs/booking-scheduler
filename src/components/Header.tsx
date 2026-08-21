/*
 * Sticky header (spec §4.1). Reads everything from the store — screens just
 * render it once, at the top of the app shell.
 *
 * Ruling R8: the 900px breakpoint is pure CSS. The desktop nav and the "Book
 * now" button carry `.bk-wide-only`, the hamburger `.bk-narrow-only`; no
 * viewport width is tracked in state.
 */

import { data } from "../data/source.ts";
import type { View } from "../data/types.ts";
import { useT } from "../i18n/index.tsx";
import type { MessageKey } from "../i18n/index.tsx";
import { useStore } from "../state/store.ts";
import type { HomeAnchor } from "../state/store.ts";
import { Button, IconButton } from "./Button.tsx";

interface NavItem {
  labelKey: MessageKey;
  view?: View;
  anchor?: HomeAnchor;
}

const NAV: NavItem[] = [
  { labelKey: "chrome.menu.services", view: "services" },
  { labelKey: "chrome.menu.membership", view: "loyalty" },
  { labelKey: "chrome.menu.team", anchor: "team" },
  { labelKey: "chrome.menu.visit", anchor: "visit" },
];

export function Header() {
  const t = useT();
  const view = useStore((s) => s.view);
  const theme = useStore((s) => s.theme);
  const go = useStore((s) => s.go);
  const goHomeScroll = useStore((s) => s.goHomeScroll);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const setMenu = useStore((s) => s.setMenu);
  const startBooking = useStore((s) => s.startBooking);

  /* One source of truth for the brand — the footer reads the same record. */
  const loc = data.getLocation();

  return (
    <header className="bk-header">
      <div className="bk-header__inner">
        <button
          type="button"
          className="bk-brand"
          onClick={() => go("home")}
          aria-label={t("chrome.header.home", { name: loc.name })}
        >
          <span className="bk-logo" aria-hidden="true">
            {loc.shortName.charAt(0)}
          </span>
          <span className="bk-wordmark">{loc.shortName}</span>
        </button>

        <nav className="bk-wide-only bk-header__nav" aria-label={t("chrome.header.nav")}>
          {NAV.map((item) => (
            <button
              key={item.labelKey}
              type="button"
              className="bk-nav bk-navlink"
              data-active={item.view && item.view === view ? "true" : "false"}
              aria-current={item.view && item.view === view ? "page" : undefined}
              onClick={() =>
                item.anchor ? goHomeScroll(item.anchor) : go(item.view as View)
              }
            >
              {t(item.labelKey)}
            </button>
          ))}
        </nav>

        <div className="bk-header__actions">
          <IconButton
            icon={theme === "dark" ? "sun" : "moon"}
            label={t("chrome.theme.toggle")}
            onClick={toggleTheme}
          />
          <Button
            className="bk-wide-only"
            icon="calendar-plus"
            onClick={() => startBooking(null)}
            style={{ padding: "10px 18px", fontSize: "14px" }}
          >
            {t("chrome.header.book")}
          </Button>
          <IconButton
            className="bk-narrow-only"
            icon="menu"
            iconSize={20}
            label={t("chrome.header.menu")}
            onClick={() => setMenu(true)}
          />
        </div>
      </div>
    </header>
  );
}
