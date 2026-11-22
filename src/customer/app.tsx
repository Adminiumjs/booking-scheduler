/**
 * What every customer page shares: the door, the studio as Adminium has it, the
 * clock, the words, where we are, and whether someone is signed in.
 */
import type { FrameLink } from "@adminiumjs/public-client/frame";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from "react";

import { useI18n } from "../i18n/index.tsx";
import type { LocaleTag } from "../i18n/locales.ts";
import type { CustomerDoor, Row, StudioRows } from "./door.ts";
import type { Clock } from "./format.ts";
import { FRAMED_SCREENS, routeOf, type Route, type Screen } from "./route.ts";
import type { PayMode } from "./rules.ts";
import { EN, loadWords, say, type Params, type T, type Word, type Words } from "./words/index.ts";
import { webLink } from "../safeLink.ts";

export interface Service {
  id: string;
  name: string;
  categoryId: string;
  blurb: string;
  minutes: number;
  price: number;
  online: PayMode;
  deposit: number | null;
  bring: string | null;
}

export interface Person {
  id: string;
  name: string;
  role: string;
  tint: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Studio {
  rows: StudioRows;
  name: string;
  email: string;
  noticeMin: number;
  windowDays: number;
  cancelHours: number;
  holdMin: number;
  onlineBooking: boolean;
  ownerSwitch: "on" | "off";
  reviewsOn: boolean;
  googleLink: string | null;
  categories: Category[];
  services: Service[];
  team: Person[];
  /** Who does what: service id → team ids. */
  doers: Map<string, string[]>;
}

const num = (v: unknown, or = 0) => (v === null || v === undefined || v === "" || Number.isNaN(Number(v)) ? or : Number(v));
export const yes = (v: unknown) => v === true || v === 1 || v === "1" || v === "true";

export function studioOf(rows: StudioRows): Studio {
  const s = rows.settings;
  const doers = new Map<string, string[]>();
  for (const row of rows.teamServices) {
    const key = String(row["service_id"]);
    doers.set(key, [...(doers.get(key) ?? []), String(row["team_id"])]);
  }
  const team = rows.team.map((t) => ({ id: String(t["id"]), name: String(t["name"] ?? ""), role: String(t["role_title"] ?? ""), tint: String(t["tint"] ?? "#6f8bb0") }));
  const known = new Set(team.map((t) => t.id));
  for (const [k, v] of doers) doers.set(k, v.filter((id) => known.has(id)));
  return {
    rows,
    name: String(s["studio_name"] ?? ""),
    email: String(s["email"] ?? ""),
    noticeMin: num(s["notice_min"], 120),
    windowDays: num(s["window_days"], 30),
    cancelHours: num(s["cancel_hours"], 24),
    holdMin: num(s["hold_min"], 15),
    onlineBooking: s["online_booking"] === undefined ? true : yes(s["online_booking"]),
    ownerSwitch: s["online_payments"] === "on" ? "on" : "off",
    reviewsOn: s["reviews_on"] === undefined ? true : yes(s["reviews_on"]),
    googleLink: webLink(s["google_review_link"]),
    categories: rows.categories.map((c) => ({ id: String(c["id"]), name: String(c["name"] ?? ""), icon: String(c["icon"] ?? "sparkles") })),
    services: rows.services.map((v) => ({
      id: String(v["id"]),
      name: String(v["name"] ?? ""),
      categoryId: String(v["category_id"] ?? ""),
      blurb: String(v["blurb"] ?? ""),
      minutes: num(v["minutes"], 60),
      price: num(v["price"]),
      online: v["online"] === "deposit" || v["online"] === "full" ? v["online"] : "none",
      deposit: v["deposit"] === null || v["deposit"] === undefined ? null : num(v["deposit"]),
      bring: typeof v["bring"] === "string" && v["bring"] !== "" ? v["bring"] : null,
    })),
    team,
    doers,
  };
}

export interface SheetSpec {
  icon: string;
  title: string;
  lines: string[];
  keep: string;
  go: string;
  onGo: () => void | Promise<void>;
}

export interface AppValue {
  door: CustomerDoor;
  studio: Studio;
  clock: Clock;
  locale: LocaleTag;
  t: T;
  route: Route;
  base: string;
  frame: FrameLink | null;
  /** The server's clock now. */
  now: () => number;
  go: (path: string, options?: { replace?: boolean }) => void;
  me: Row | null;
  refreshMe: () => Promise<Row | null>;
  setMe: (row: Row | null) => void;
  toast: (text: string) => void;
  announce: (text: string) => void;
  openSheet: (sheet: SheetSpec) => void;
  closeSheet: () => void;
  sheet: SheetSpec | null;
  toastText: string | null;
  liveText: string;
}

const Ctx = createContext<AppValue | null>(null);

export function useApp(): AppValue {
  const v = useContext(Ctx);
  if (v === null) throw new Error("useApp outside the customer app");
  return v;
}

const screenOfPath = (path: string, base: string): Screen => routeOf(path.split("?")[0]!.split("#")[0]!, "", base).screen;

export function AppProvider({ door, rows, base, frame, clockNow, children }: { door: CustomerDoor; rows: StudioRows; base: string; frame: FrameLink | null; clockNow?: () => number; children: ReactNode }) {
  const { locale } = useI18n();
  const [words, setWords] = useState<Words>(EN);
  const [route, setRoute] = useState<Route>(() => routeOf(window.location.pathname, window.location.search, base));
  const [me, setMe] = useState<Row | null>(null);
  const [sheet, setSheet] = useState<SheetSpec | null>(null);
  const [toastText, setToast] = useState<string | null>(null);
  const [liveText, setLive] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skew = useRef(rows.now.getTime() - Date.now());

  useEffect(() => {
    let on = true;
    void loadWords(locale).then((w) => {
      if (on) setWords(w);
    });
    return () => {
      on = false;
    };
  }, [locale]);

  useEffect(() => {
    const onPop = () => setRoute(routeOf(window.location.pathname, window.location.search, base));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [base]);

  const refreshMe = useCallback(async () => {
    try {
      const row = await door.me();
      setMe(row);
      return row;
    } catch {
      setMe(null);
      return null;
    }
  }, [door]);

  useEffect(() => {
    if (door.signedIn()) void refreshMe();
  }, [door, refreshMe]);

  const go = useCallback(
    (path: string, options: { replace?: boolean } = {}) => {
      const screen = screenOfPath(path, "");
      // A frame shows only its own screens; anything else opens in a new tab (cQ7).
      if (frame !== null && !FRAMED_SCREENS.includes(screen)) {
        frame.go(screen, path);
        return;
      }
      const url = `${base}${path}`;
      // In a frame the host's Back button must not fill up with our steps.
      if (options.replace === true || frame !== null) window.history.replaceState(null, "", frame === null ? url : `${url}${url.includes("?") ? "&" : "?"}${window.location.search.replace(/^\?/, "")}`);
      else window.history.pushState(null, "", url);
      setRoute(routeOf(`${base}${path.split("?")[0]!}`, path.includes("?") ? `?${path.split("?")[1]!}` : "", base));
      if (frame !== null) frame.scrollIntoView();
      else window.scrollTo({ top: 0 });
    },
    [base, frame],
  );

  const value = useMemo<AppValue>(() => {
    const t: T = (word: Word, params?: Params) => say(words, locale, word, params);
    const studio = studioOf(rows);
    return {
      door,
      studio,
      clock: { locale, timezone: rows.timezone, currency: rows.currency },
      locale,
      t,
      route,
      base,
      frame,
      now: clockNow ?? (() => Date.now() + skew.current),
      go,
      me,
      refreshMe,
      setMe,
      toast: (text) => {
        setToast(text);
        setLive(text);
        if (toastTimer.current !== null) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(null), 3200);
      },
      announce: setLive,
      openSheet: setSheet,
      closeSheet: () => setSheet(null),
      sheet,
      toastText,
      liveText,
    };
  }, [door, rows, words, locale, route, base, frame, go, me, refreshMe, sheet, toastText, liveText, clockNow]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** A real link to one of the app's pages. In a frame, a page that isn't framed opens in a new tab. */
export function A({ to, children, onClick, ...rest }: { to: string; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const { base, go, frame } = useApp();
  const screen = screenOfPath(to, "");
  if (frame !== null && !FRAMED_SCREENS.includes(screen)) {
    return (
      <a {...rest} {...frame.linkProps(to)}>
        {children}
      </a>
    );
  }
  const click = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(to);
  };
  return (
    <a {...rest} href={`${base}${to}`} onClick={click}>
      {children}
    </a>
  );
}
