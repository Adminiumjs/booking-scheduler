/*
 * The studio half's chrome: a two-group sidebar and a topbar.
 *
 * Deliberately nothing like the guest header. A client browsing services and
 * a stylist working a Saturday need different furniture — the Admin comp
 * designed a persistent sidebar with a search-and-act topbar, and that is what
 * this is.
 *
 * Ruling carried from the guest half: no JavaScript reads the viewport. The
 * sidebar collapses to icons at 1100px and hides entirely at 860px, where the
 * topbar grows a menu button — all in CSS.
 */

import type { ReactNode } from "react";
import {
  BRAND,
  STUDIO_NAV_BIZ,
  STUDIO_NAV_OPS,
  STUDIO_PAGE_META,
} from "./chrome.ts";
import type { StudioNavItem } from "./chrome.ts";
import { Icon } from "./Icon.tsx";
import type { IconName } from "./Icon.tsx";
import { useStore } from "../state/store.ts";

function NavGroup({ label, items }: { label: string; items: StudioNavItem[] }) {
  const view = useStore((s) => s.view);
  const go = useStore((s) => s.go);

  return (
    <>
      <span className="bk-studio__navlabel">{label}</span>
      {items.map((n) => (
        <button
          key={n.view}
          type="button"
          className={`bk-gi bk-studio__navitem${view === n.view ? " is-active" : ""}`}
          onClick={() => go(n.view)}
          aria-current={view === n.view ? "page" : undefined}
        >
          <Icon name={n.icon as IconName} size={17} />
          <span className="bk-studio__navtext">{n.label}</span>
          {n.badge ? <span className="bk-studio__navbadge">{n.badge}</span> : null}
        </button>
      ))}
    </>
  );
}

/**
 * Wraps a studio screen. Guest screens render without it, which is why this
 * lives here rather than in App — the shell differs by persona, not by route.
 */
export default function StudioChrome({ children }: { children: ReactNode }) {
  const view = useStore((s) => s.view);
  const query = useStore((s) => s.query);
  const set = useStore((s) => s.set);
  const go = useStore((s) => s.go);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const theme = useStore((s) => s.theme);
  const showToast = useStore((s) => s.showToast);

  const meta = STUDIO_PAGE_META[view] ?? { title: "Studio", sub: "" };

  return (
    <div className="bk-studio">
      <aside className="bk-studio__side">
        <div className="bk-studio__brand">
          <span className="bk-studio__mark">{BRAND.mark}</span>
          <span className="bk-studio__brandtext">
            <span className="bk-studio__brandname">{BRAND.name}</span>
            <span className="bk-studio__brandsub">{BRAND.locality}</span>
          </span>
        </div>

        <nav className="bk-studio__nav" aria-label="Studio">
          <NavGroup label="Operations" items={STUDIO_NAV_OPS} />
          <NavGroup label="Business" items={STUDIO_NAV_BIZ} />
        </nav>

        <div className="bk-studio__me">
          <span className="bk-studio__avatar">{BRAND.owner.initials}</span>
          <span className="bk-studio__metext">
            <span className="bk-studio__mename">{BRAND.owner.name}</span>
            <span className="bk-studio__merole">{BRAND.owner.role}</span>
          </span>
          <button
            type="button"
            className="bk-gi bk-studio__themebtn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
          </button>
        </div>
      </aside>

      <div className="bk-studio__main">
        <header className="bk-studio__topbar">
          <div className="bk-studio__title">
            <span className="bk-studio__h1">{meta.title}</span>
            <span className="bk-studio__sub">{meta.sub}</span>
          </div>

          <label className="bk-studio__search">
            <Icon name="search" size={15} className="bk-studio__searchico" />
            <input
              value={query}
              onChange={(e) => set({ query: e.target.value })}
              placeholder="Search clients, bookings…"
              aria-label="Search clients and bookings"
            />
          </label>

          <button
            type="button"
            className="bk-gi bk-studio__bell"
            onClick={() => showToast("Three bookings need confirming.", "warn")}
            aria-label="Notifications"
          >
            <Icon name="bell" size={17} />
            <span className="bk-studio__dot" aria-hidden="true" />
          </button>

          <button
            type="button"
            className="bk-gi bk-studio__new"
            onClick={() => go("admin-cal")}
          >
            <Icon name="plus" size={16} />
            New booking
          </button>
        </header>

        <div className="bk-studio__body">{children}</div>
      </div>
    </div>
  );
}
