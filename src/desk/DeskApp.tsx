/**
 * The desk's shell (comp L2 37–73, 568–574): the sidebar with the person signed
 * in, the top bar with search and New booking, the section, the panels and
 * sheets over it, the toasts and one polite live region. Under 1100 px the
 * sidebar is a rail of icons; on a phone it is a bottom tab bar with More.
 *
 * A section shows only to someone whose grants reach it, and a control a person
 * may not use is absent. What their roles cannot do, Adminium refuses anyway.
 */
import { CalendarDays, House, IdCard, ListOrdered, Menu, Plus, Search, Settings, Sparkles, Star, Sun, Users } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import type { DeskData, Person } from "./door.ts";
import { reload, useData, useEnv } from "./env.tsx";
import { byId, initials, needsOf, search } from "./facts.ts";
import { useFmt } from "./format.ts";
import { useDeskT } from "./i18n/index.ts";
import { DESK_NAV } from "./nav.ts";
import { CalendarScreen, usePhone } from "./screens/Calendar.tsx";
import { ClientsScreen } from "./screens/Clients.tsx";
import { BookingPanel, ClientPanel } from "./screens/Panels.tsx";
import { ReviewsScreen } from "./screens/Reviews.tsx";
import { ServicesScreen } from "./screens/Services.tsx";
import { SettingsScreen } from "./screens/Settings.tsx";
import { Sheets } from "./screens/Sheets.tsx";
import { TeamScreen } from "./screens/Team.tsx";
import { TodayScreen } from "./screens/Today.tsx";
import { WaitingScreen } from "./screens/Waiting.tsx";
import { go, newBooking, openBooking, openClient, openSheet, useDesk, type View } from "./store.ts";
import { text } from "./wire.ts";
import { isEmbedded } from "../embed.ts";

const ICON: Record<string, ReactNode> = {
  house: <House size={18} aria-hidden="true" />,
  "calendar-days": <CalendarDays size={18} aria-hidden="true" />,
  users: <Users size={18} aria-hidden="true" />,
  sparkles: <Sparkles size={18} aria-hidden="true" />,
  "id-card": <IdCard size={18} aria-hidden="true" />,
  "list-ordered": <ListOrdered size={18} aria-hidden="true" />,
  star: <Star size={18} aria-hidden="true" />,
  settings: <Settings size={18} aria-hidden="true" />,
};

/** The sections a person's grants reach, by nav id (§7, BN-16). */
export function sectionsFor(who: Person, data: DeskData): string[] {
  return DESK_NAV.filter((entry) => {
    switch (entry.id) {
      // A specialist works from Today, their week and their own card (L2a-F9). A client of theirs opens from the booking.
      case "clients":
      case "services":
        return who.can("bookings", "create");
      case "waiting":
        return who.can("waitlist", "read");
      case "reviews":
        return data.reviews !== null;
      case "settings":
        return who.can("settings", "update");
      default:
        return true;
    }
  }).map((e) => e.id);
}

function Screen({ view }: { view: View }) {
  switch (view) {
    case "today":
      return <TodayScreen />;
    case "calendar":
      return <CalendarScreen />;
    case "clients":
      return <ClientsScreen />;
    case "services":
      return <ServicesScreen />;
    case "team":
      return <TeamScreen />;
    case "waiting":
      return <WaitingScreen />;
    case "reviews":
      return <ReviewsScreen />;
    case "settings":
      return <SettingsScreen />;
  }
}

function SearchBox() {
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const query = useDesk((s) => s.query);
  const hits = search(data, query);
  const open = query.trim().length >= 2;
  return (
    <div className="lm-search">
      <Search size={16} aria-hidden="true" />
      <input type="search" dir="auto" value={query} placeholder={t("shell.search")} aria-label={t("shell.search")} onChange={(e) => useDesk.setState({ query: e.target.value })} onKeyDown={(e) => e.key === "Escape" && useDesk.setState({ query: "" })} />
      {open && (
        <div className="lm-search-list">
          {hits.bookings.map((b) => (
            <button key={`b${String(b.id)}`} type="button" onClick={() => openBooking(b.id)}>
              <strong>{text(b["code"])}</strong>
              <small>{`${text(b["name"]) ?? ""} · ${text(byId(data.services, b["service_id"])?.["name"]) ?? ""} · ${fmt.day(b["starts_at"])}`}</small>
            </button>
          ))}
          {hits.clients.map((c) => (
            <button key={`c${String(c.id)}`} type="button" onClick={() => openClient(c.id)}>
              <strong>{text(c["name"])}</strong>
              {text(c["email"]) !== null && <small>{text(c["email"])}</small>}
            </button>
          ))}
          {hits.bookings.length === 0 && hits.clients.length === 0 && <p>{t("shell.noResults")}</p>}
        </div>
      )}
    </div>
  );
}

function Shell() {
  const { door } = useEnv();
  const data = useData();
  const t = useDeskT();
  const phone = usePhone();
  const view = useDesk((s) => s.view);
  const panel = useDesk((s) => s.panel);
  const fits = useDesk((s) => s.fits);
  const said = useDesk((s) => s.said);
  const toasts = useDesk((s) => s.toasts);
  const who = door.who();
  const sections = sectionsFor(who, data);
  const { zone } = door.facts();
  const needs = needsOf(data, who, door.now(), zone, fits);
  const badge = (id: string): number | null => {
    if (id === "waiting") {
      const need = needs.find((n) => n.kind === "waiting");
      return need?.kind === "waiting" ? need.count : null;
    }
    if (id === "reviews") {
      const need = needs.find((n) => n.kind === "reviews");
      return need?.kind === "reviews" ? need.count : null;
    }
    return null;
  };
  // A typed address to a section this person cannot open lands on Today.
  const shown: View = sections.includes(view) ? view : "today";
  const studio = text(data.settings?.["studio_name"]) ?? "";
  const line = text(data.settings?.["address_line1"]);
  const roleWord = who.can("settings", "update") ? t("shell.owner") : who.can("bookings", "create") ? t("shell.frontDesk") : t("shell.specialist");
  const tabs = DESK_NAV.filter((n) => sections.includes(n.id) && ["today", "calendar", "clients", "waiting"].includes(n.id));
  // Inside the console its sidebar and header name the section: the desk draws neither twice.
  const framed = isEmbedded();
  return (
    <div className="lm-app">
      <div aria-live="polite" className="lm-sr-only">
        {said}
      </div>
      {!phone && !framed && (
        <nav className="lm-side" aria-label={t("shell.nav")}>
          <div className="lm-brand">
            <span className="lm-logo" aria-hidden="true">
              <Sun size={18} />
            </span>
            <span className="lm-brand-text">
              <strong>{studio}</strong>
              {line !== null && <small dir="auto">{line}</small>}
            </span>
          </div>
          <div className="lm-nav">
            {DESK_NAV.filter((n) => sections.includes(n.id)).map((n) => {
              const count = badge(n.id);
              return (
                <button key={n.id} type="button" aria-current={shown === n.view ? "page" : undefined} aria-label={t(n.labelKey)} className={shown === n.view ? "is-on" : ""} onClick={() => go(n.view)}>
                  {ICON[n.icon]}
                  <span>{t(n.labelKey)}</span>
                  {count !== null && <em>{count}</em>}
                </button>
              );
            })}
          </div>
          <div className="lm-me">
            <span className="lm-avatar lm-avatar--plain" aria-hidden="true">
              {initials(who.name)}
            </span>
            <span className="lm-brand-text">
              <strong>{who.name}</strong>
              <small>{roleWord}</small>
            </span>
          </div>
        </nav>
      )}
      <div className="lm-column">
        <header className="lm-top">
          {!framed && (
            <div className="lm-top-title">
              <strong>{t(DESK_NAV.find((n) => n.view === shown)!.labelKey)}</strong>
              <small dir="auto">{line === null ? studio : `${studio} · ${line}`}</small>
            </div>
          )}
          <SearchBox />
          {who.can("bookings", "create") && (
            <button type="button" className="lm-btn lm-btn--primary" aria-label={t("nav.newBooking")} onClick={() => newBooking()}>
              <Plus size={16} aria-hidden="true" />
              {!phone && t("nav.newBooking")}
            </button>
          )}
        </header>
        <div className="lm-body">
          <main className="lm-main" id="main">
            <Screen view={shown} />
          </main>
          {panel?.kind === "booking" && <BookingPanel key={`b${String(panel.id)}`} id={panel.id} />}
          {panel?.kind === "client" && <ClientPanel key={`c${String(panel.id)}`} id={panel.id} />}
        </div>
        {phone && !framed && (
          <nav className="lm-tabs" aria-label={t("shell.nav")}>
            {tabs.map((n) => (
              <button key={n.id} type="button" aria-current={shown === n.view ? "page" : undefined} className={shown === n.view ? "is-on" : ""} onClick={() => go(n.view)}>
                {ICON[n.icon]}
                <span>{t(n.labelKey)}</span>
              </button>
            ))}
            <button type="button" onClick={() => openSheet({ kind: "more" })}>
              <Menu size={18} aria-hidden="true" />
              <span>{t("nav.more")}</span>
            </button>
          </nav>
        )}
      </div>
      <Sheets sections={sections} />
      <div className="lm-toasts">
        {toasts.map((toast) => (
          <div key={toast.id} className={`lm-toast is-${toast.tone}`}>
            {toast.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DeskApp() {
  const t = useDeskT();
  const data = useDesk((s) => s.data);
  const failure = useDesk((s) => s.failure);
  const slowedDown = useDesk((s) => s.slowedDown);
  const theme = useDesk((s) => s.theme);
  const { door } = useEnv();
  const [, tick] = useState(0);
  // Today's moves change with the clock ("Due in 5 minutes", "Not arrived"), and a colleague's desk changes the rows:
  // each minute the screen is in view, read them again and redraw.
  useEffect(() => {
    const id = setInterval(() => {
      tick((n) => n + 1);
      if (document.visibilityState === "visible") void reload(door);
    }, 60_000);
    return () => clearInterval(id);
  }, [door]);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === null) root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);
  if (data === null) {
    return (
      <div className="lm-app">
        <main className="lm-main" id="main">
          {slowedDown ? (
            <div role="status" aria-busy="true" className="lm-loading">
              {t("shell.slowDown")}
            </div>
          ) : failure === null ? (
            <div role="status" aria-busy="true" className="lm-loading">
              {t("common.loading")}
            </div>
          ) : (
            <div className="lm-failed" role="alert">
              <span>{t("shell.failed", { why: failure })}</span>
              <button type="button" className="lm-btn" onClick={() => window.location.reload()}>
                {t("shell.retry")}
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }
  return <Shell />;
}

