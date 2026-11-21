/**
 * The header, the phone menu and the footer (the comp's lines 42–58, 79–105,
 * 836–856). In a frame there is none of it: a small row of links to what opens
 * outside the frame, and the studio's name (L1b-F15).
 */
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { A, useApp } from "./app.tsx";
import { fmtTime, hhmm, type Clock, type Weekday } from "./format.ts";
import { ConfirmSheet, Icon, useTrap } from "./parts.tsx";
import type { Word } from "./words/index.ts";

const WEEK: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
/** A Monday, so a weekday's name comes from the language rather than from a list of ours. */
const DAY_OF: Record<Weekday, string> = { mon: "2026-01-05", tue: "2026-01-06", wed: "2026-01-07", thu: "2026-01-08", fri: "2026-01-09", sat: "2026-01-10", sun: "2026-01-11" };
export const dayName = (c: Clock, d: Weekday) => new Intl.DateTimeFormat(c.locale, { weekday: "short", timeZone: "UTC" }).format(new Date(`${DAY_OF[d]}T12:00:00Z`));

export interface HourRow {
  key: Weekday;
  day: string;
  time: string | null;
}

/** The week, in order, each day's opening hours as words. */
export function useHours(): HourRow[] {
  const { studio, clock } = useApp();
  return WEEK.map((key) => {
    const row = studio.rows.hours.find((h) => h["weekday"] === key);
    const open = row !== undefined && row["open"] !== false && row["open"] !== 0;
    return { key, day: dayName(clock, key), time: open ? `${fmtTime(clock, hhmm(row["opens"]))} – ${fmtTime(clock, hhmm(row["closes"]))}` : null };
  });
}

/** Days with the same hours side by side: "Tue–Fri". */
function grouped(hours: HourRow[]): { day: string; time: string | null }[] {
  const out: { first: string; last: string; time: string | null }[] = [];
  for (const h of hours) {
    const prev = out[out.length - 1];
    if (prev !== undefined && prev.time === h.time) prev.last = h.day;
    else out.push({ first: h.day, last: h.day, time: h.time });
  }
  return out.map((g) => ({ day: g.first === g.last ? g.first : `${g.first}–${g.last}`, time: g.time }));
}

const NAV: { word: Word; to: string }[] = [
  { word: "navServices", to: "/#services" },
  { word: "navTeam", to: "/#team" },
  { word: "navReviews", to: "/reviews" },
  { word: "navGifts", to: "/gift-cards" },
  { word: "navFind", to: "/#find" },
];

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.dataset["theme"] === "dark" || (document.documentElement.dataset["theme"] !== "light" && window.matchMedia?.("(prefers-color-scheme: dark)").matches === true));
  const toggle = useCallback(() => {
    setDark((d) => {
      const next = !d;
      document.documentElement.dataset["theme"] = next ? "dark" : "light";
      try {
        localStorage.setItem("lumen-theme", next ? "dark" : "light");
      } catch {
        // kept for this page only
      }
      return next;
    });
  }, []);
  return { dark, toggle };
}

function goToPart(to: string, go: (path: string) => void, onHome: boolean) {
  const part = to.split("#")[1];
  if (part === undefined) return false;
  if (!onHome) go("/");
  requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(`lm-${part}`)?.scrollIntoView({ behavior: "smooth", block: "start" })));
  return true;
}

function Header() {
  const { t, studio, me, route, go } = useApp();
  const { dark, toggle } = useTheme();
  const [menu, setMenu] = useState(false);
  const close = useCallback(() => setMenu(false), []);
  const account = me === null ? t("signIn") : String(me["name"] ?? t("signIn"));
  const accountTo = me === null ? "/sign-in" : "/account";
  const screenOf: Record<string, string> = { "/reviews": "reviews", "/gift-cards": "giftCards" };
  return (
    <header className="lm-header">
      <div className="lm-header-in">
        <A to="/" className="lm-logo" aria-label={studio.name}>
          <span className="lm-logo-mark">
            <Icon name="sun" size={19} />
          </span>
          <span className="lm-logo-name">{studio.name}</span>
        </A>
        <nav aria-label={t("mainNav")} className="lm-nav">
          {NAV.map((n) => (
            <A
              key={n.word}
              to={n.to.split("#")[0]!}
              {...(screenOf[n.to] === route.screen ? { "aria-current": "page" as const } : {})}
              onClick={(e) => {
                if (goToPart(n.to, go, route.screen === "home")) e.preventDefault();
              }}
            >
              {t(n.word)}
            </A>
          ))}
        </nav>
        <div className="lm-head-right">
          <button type="button" className="lm-icon-btn" aria-label={t("themeLabel")} onClick={toggle}>
            <Icon name={dark ? "sun" : "moon"} size={18} />
          </button>
          <A to={accountTo} className="lm-account lm-wide">
            <Icon name={me === null ? "log-in" : "user"} size={16} />
            {account}
          </A>
          <A to="/book" className="lm-btn primary lm-book-now lm-wide">
            <Icon name="calendar-plus" size={16} />
            {t("bookNow")}
          </A>
          <button type="button" className="lm-icon-btn lm-narrow" aria-label={t("menu")} aria-expanded={menu} onClick={() => setMenu(true)}>
            <Icon name="menu" size={20} />
          </button>
        </div>
      </div>
      {menu ? <PhoneMenu onClose={close} account={account} accountTo={accountTo} /> : null}
    </header>
  );
}

function PhoneMenu({ onClose, account, accountTo }: { onClose: () => void; account: string; accountTo: string }) {
  const { t, go, route } = useApp();
  const box = useTrap(onClose);
  const ICON: Partial<Record<Word, string>> = { navServices: "sparkles", navTeam: "users", navReviews: "star", navGifts: "gift", navFind: "map-pin" };
  return (
    <div className="lm-scrim" onClick={onClose}>
      <div ref={box} role="dialog" aria-modal="true" aria-label={t("menu")} className="lm-menu" onClick={(e) => e.stopPropagation()}>
        <div className="lm-menu-top">
          <span>{t("menu")}</span>
          <button type="button" className="lm-icon-btn lm-narrow" style={{ display: "flex" }} aria-label={t("close")} onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <nav>
          {NAV.map((n) => (
            <A
              key={n.word}
              to={n.to.split("#")[0]!}
              className="lm-menu-link"
              onClick={(e) => {
                onClose();
                if (goToPart(n.to, go, route.screen === "home")) e.preventDefault();
              }}
            >
              <Icon name={ICON[n.word] ?? "sparkles"} size={18} />
              {t(n.word)}
            </A>
          ))}
          <A to={accountTo} className="lm-menu-link" onClick={onClose}>
            <Icon name="user" size={18} />
            {account}
          </A>
          <A to="/book" className="lm-btn primary large" style={{ marginTop: 10 }} onClick={onClose}>
            <Icon name="calendar-plus" size={17} />
            {t("bookNow")}
          </A>
        </nav>
      </div>
    </div>
  );
}

function Footer() {
  const { t, studio } = useApp();
  const hours = grouped(useHours());
  const s = studio.rows.settings;
  const links: [Word, string][] = [
    ["fHelp", "/help"],
    ["fPolicy", "/policy"],
    ["fPrivacy", "/privacy"],
    ["fTerms", "/terms"],
    ["fFind", "/find"],
    ["navPacks", "/packs"],
  ];
  return (
    <footer className="lm-footer">
      <div className="lm-footer-in">
        <div className="lm-foot-col" style={{ gap: 10 }}>
          <div className="lm-foot-brand">
            <span className="lm-logo-mark">
              <Icon name="sun" size={16} />
            </span>
            {studio.name}
          </div>
          <div className="lm-muted" style={{ fontSize: 13, lineHeight: 1.55 }}>
            <bdi>{String(s["address_line1"] ?? "")}</bdi>
            <br />
            <bdi>{addressLine2(s)}</bdi>
          </div>
        </div>
        <div className="lm-foot-col">
          <div className="lm-foot-h">{t("fHours")}</div>
          {hours.map((h) => (
            <div key={h.day} className="lm-foot-row">
              <span>{h.day}</span>
              <span className="lm-mono" style={{ whiteSpace: "nowrap" }}>
                {h.time ?? t("closedDay")}
              </span>
            </div>
          ))}
        </div>
        <div className="lm-foot-col">
          <div className="lm-foot-h">{t("fContact")}</div>
          <a href={`mailto:${studio.email}`} dir="ltr" style={{ fontSize: 13, fontWeight: 600, alignSelf: "flex-start" }}>
            {studio.email}
          </a>
        </div>
        <nav aria-label={t("footerNav")} className="lm-foot-col" style={{ gap: 2 }}>
          {links.map(([word, to]) => (
            <A key={to} to={to} className="lm-foot-link">
              {t(word)}
            </A>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export const addressLine2 = (s: Record<string, unknown>) => `${String(s["city"] ?? "")}${s["region"] ? `, ${String(s["region"])}` : ""} ${String(s["zip"] ?? "")}`.trim();

function FrameFoot() {
  const { t, studio } = useApp();
  return (
    <>
      <div className="lm-frame-links">
        <A to="/sign-in">{t("frameSignIn")}</A>
        <A to="/find">{t("frameFind")}</A>
        <A to="/policy">{t("framePolicy")}</A>
      </div>
      <div className="lm-frame-line">{studio.name}</div>
    </>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { t, frame, toastText, liveText, studio } = useApp();
  useEffect(() => {
    document.title = studio.name;
  }, [studio.name]);
  return (
    <div className="lm-root">
      <div aria-live="polite" className="lm-sr">
        {liveText}
      </div>
      {toastText === null ? null : (
        <div className="lm-toast-wrap">
          <div role="status" className="lm-toast">
            <Icon name="circle-check" size={16} />
            {toastText}
          </div>
        </div>
      )}
      <ConfirmSheet />
      <div className="lm-shell">
        {frame === null ? (
          <a href="#lm-main" className="lm-skip">
            {t("skipToContent")}
          </a>
        ) : null}
        {frame === null ? <Header /> : null}
        {children}
        {frame === null ? <Footer /> : <FrameFoot />}
      </div>
    </div>
  );
}
