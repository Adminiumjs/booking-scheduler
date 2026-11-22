/**
 * The customer side's page tree: the screen for the address, and how a frame
 * holds it. A start hands it the door and the studio's rows; `CustomerApp.tsx`
 * is the real one.
 */
import { readFrame, type FrameLink } from "@adminiumjs/public-client/frame";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { useI18n } from "../i18n/index.tsx";
import { isLocaleTag } from "../i18n/locales.ts";
import { AppProvider, useApp } from "./app.tsx";
import type { CustomerDoor, StudioRows } from "./door.ts";
import { Blank, Icon } from "./parts.tsx";
import { FRAMED_SCREENS } from "./route.ts";
import Account from "./screens/Account.tsx";
import Book from "./screens/Book.tsx";
import Booking from "./screens/Booking.tsx";
import Docs from "./screens/Docs.tsx";
import Home from "./screens/Home.tsx";
import Paid from "./screens/Paid.tsx";
import { ReviewLinkPage } from "./screens/ReviewForm.tsx";
import Reviews from "./screens/Reviews.tsx";
import { GiftCards, Packs } from "./screens/Sales.tsx";
import SignIn from "./screens/SignIn.tsx";
import { Shell } from "./Shell.tsx";

function Screen() {
  const { route, t, go, frame } = useApp();
  // A framed page never draws a screen it does not declare, whatever the address says.
  if (frame !== null && !FRAMED_SCREENS.includes(route.screen)) {
    return (
      <Blank icon="external-link" title={t("nfTitle")}>
        <a className="lm-btn primary mid" {...frame.linkProps("/")}>
          {t("nfCta")}
        </a>
      </Blank>
    );
  }
  switch (route.screen) {
    case "home":
      return <Home />;
    case "book":
      return <Book key={route.query.toString()} />;
    case "booking":
      return <Booking key={route.query.toString()} />;
    case "paid":
      return <Paid />;
    case "find":
      return <SignIn find />;
    case "signIn":
      return <SignIn />;
    case "account":
      return <Account />;
    case "reviews":
      return <Reviews />;
    case "review":
      return <ReviewLinkPage />;
    case "giftCards":
      return <GiftCards key={route.query.toString()} />;
    case "packs":
      return <Packs key={route.query.toString()} />;
    case "help":
    case "policy":
    case "privacy":
    case "terms":
      return <Docs page={route.screen} />;
    case "expired":
      return (
        <Blank icon="link-2-off" title={t("exTitle")} sub={t("exSub")}>
          <button type="button" className="lm-btn primary mid" onClick={() => go("/find")}>
            {t("fFind")}
          </button>
        </Blank>
      );
    case "notFound":
      return (
        <Blank icon="coffee" title={t("nfTitle")} sub={t("nfSub")}>
          <button type="button" className="lm-btn primary mid" onClick={() => go("/")}>
            {t("nfCta")}
          </button>
        </Blank>
      );
  }
}

/** What the loader says to a button or floating frame: the site's own label, and the sheet opening or closing. */
export const frameEvents = {
  label: null as string | null,
  open: false,
  listeners: new Set<() => void>(),
  set(change: { label?: string | null; open?: boolean }) {
    if (change.label !== undefined) this.label = change.label;
    if (change.open !== undefined) this.open = change.open;
    for (const listen of this.listeners) listen();
  },
};

function useFrameSheet() {
  return useSyncExternalStore(
    (listen) => {
      frameEvents.listeners.add(listen);
      return () => frameEvents.listeners.delete(listen);
    },
    () => frameEvents.open,
  );
}

/**
 * A floating frame is its launcher until pressed; a button frame is nothing until the site's own button opens it. Both are
 * drawn here, inside the frame, so the site's styles cannot reach them (cQ6). Open, the sheet is the page with a way to close.
 */
function FramedSheet({ frame, children }: { frame: FrameLink; children: ReactNode }) {
  const { t } = useApp();
  const open = useFrameSheet();
  const launcher = useRef<HTMLButtonElement | null>(null);
  const label = useSyncExternalStore(
    (listen) => {
      frameEvents.listeners.add(listen);
      return () => frameEvents.listeners.delete(listen);
    },
    () => frameEvents.label,
  );

  useEffect(() => {
    if (frame.mode !== "floating" || open || launcher.current === null) return;
    const box = launcher.current.getBoundingClientRect();
    frame.size(Math.ceil(box.width) + 8, Math.ceil(box.height) + 8);
  }, [frame, open, label]);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-lm-closed", !open);
    return () => document.documentElement.removeAttribute("data-lm-closed");
  }, [open]);

  if (!open) {
    if (frame.mode !== "floating") return null;
    return (
      <button
        ref={launcher}
        type="button"
        className="lm-launcher"
        onClick={() => {
          frame.openSheet();
          frameEvents.set({ open: true });
        }}
      >
        <Icon name="calendar-plus" size={17} />
        {label ?? t("bookNow")}
      </button>
    );
  }
  return (
    <>
      <button
        type="button"
        className="lm-icon-btn lm-sheet-close"
        aria-label={t("close")}
        onClick={() => {
          frame.closeSheet();
          frameEvents.set({ open: false });
        }}
      >
        <Icon name="x" size={18} />
      </button>
      {children}
    </>
  );
}

export function Root({ door, rows, base, frame, clockNow }: { door: CustomerDoor; rows: StudioRows; base: string; frame: FrameLink | null; clockNow?: () => number }) {
  const { setLocale } = useI18n();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const asked = readFrame()?.lang ?? null;
    if (asked !== null) {
      const tag = [asked, `${asked.split("-")[0]!}`].find((a) => isLocaleTag(a));
      if (tag !== undefined && isLocaleTag(tag)) setLocale(tag);
    }
    setReady(true);
  }, [setLocale]);
  if (!ready) return null;
  return (
    <AppProvider door={door} rows={rows} base={base} frame={frame} {...(clockNow === undefined ? {} : { clockNow })}>
      {frame === null || frame.mode === "inline" ? (
        <Shell>
          <Screen />
        </Shell>
      ) : (
        <FramedSheet frame={frame}>
          <Shell>
            <Screen />
          </Shell>
        </FramedSheet>
      )}
    </AppProvider>
  );
}
