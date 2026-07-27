/*
 * Sticky header (spec §4.1). Reads everything from the store — screens just
 * render it once, at the top of the app shell.
 *
 * Ruling R8: the 900px breakpoint is pure CSS. The desktop nav and the "Book
 * now" button carry `.sm-wide-only`, the hamburger `.sm-narrow-only`; no
 * viewport width is tracked in state.
 */

import { data } from "../data/source.ts";
import type { View } from "../data/types.ts";
import { useStore } from "../state/store.ts";
import type { HomeAnchor } from "../state/store.ts";
import { Button, IconButton } from "./Button.tsx";

interface NavItem {
  label: string;
  view?: View;
  anchor?: HomeAnchor;
}

const NAV: NavItem[] = [
  { label: "Services", view: "services" },
  { label: "Membership", view: "loyalty" },
  { label: "Team", anchor: "team" },
  { label: "Visit us", anchor: "visit" },
];

export function Header() {
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
    <header className="sm-header">
      <div className="sm-header__inner">
        <button
          type="button"
          className="sm-brand"
          onClick={() => go("home")}
          aria-label={`${loc.name} — home`}
        >
          <span className="sm-logo" aria-hidden="true">
            {loc.shortName.charAt(0)}
          </span>
          <span className="sm-wordmark">{loc.shortName}</span>
        </button>

        <nav className="sm-wide-only sm-header__nav" aria-label="Main">
          {NAV.map((item) => (
            <button
              key={item.label}
              type="button"
              className="sm-nav sm-navlink"
              data-active={item.view && item.view === view ? "true" : "false"}
              aria-current={item.view && item.view === view ? "page" : undefined}
              onClick={() =>
                item.anchor ? goHomeScroll(item.anchor) : go(item.view as View)
              }
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sm-header__actions">
          <IconButton
            icon={theme === "dark" ? "sun" : "moon"}
            label="Toggle theme"
            onClick={toggleTheme}
          />
          <Button
            className="sm-wide-only"
            icon="calendar-plus"
            onClick={() => startBooking(null)}
            style={{ padding: "10px 18px", fontSize: "14px" }}
          >
            Book now
          </Button>
          <IconButton
            className="sm-narrow-only"
            icon="menu"
            iconSize={20}
            label="Open menu"
            onClick={() => setMenu(true)}
          />
        </div>
      </div>
    </header>
  );
}
