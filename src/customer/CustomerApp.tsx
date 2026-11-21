/**
 * The customer side's start: find the Adminium it talks to, read the studio, and
 * draw the page for the address. In a frame it holds to the screens the manifest
 * declares (cT13, cQ7); anything else opens in a new tab.
 */
import { readFrame, startFrame, type FrameLink } from "@adminiumjs/public-client/frame";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import { I18nProvider, useI18n } from "../i18n/index.tsx";
import { isLocaleTag } from "../i18n/locales.ts";
import { AppProvider, useApp } from "./app.tsx";
import "./customer.css";
import { LumenDoor, type Served, type StudioRows } from "./door.ts";
import { Blank } from "./parts.tsx";
import { FRAMED_SCREENS, mountOf } from "./route.ts";
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

/** Where this page was served from, and with which keys. */
export async function resolveServed(framed: boolean): Promise<Served | null> {
  const env = import.meta.env as Record<string, string | undefined>;
  const baseUrl = env["VITE_ADMINIUM_API_BASE_URL"];
  const key = env["VITE_ADMINIUM_PUBLISHABLE_KEY"];
  if (baseUrl && key) {
    const link = env["VITE_ADMINIUM_LINK_KEY"];
    return { baseUrl, publishableKey: key, publicKeys: link ? { link } : {} };
  }
  const mount = mountOf(window.location.pathname);
  try {
    const res = await fetch(`${mount}/surface-config.json${framed ? "?frame=1" : ""}`, { cache: "no-store" });
    if (!res.ok) return null;
    const doc = (await res.json()) as Record<string, unknown> | null;
    if (doc === null || typeof doc["publishableKey"] !== "string" || doc["publishableKey"] === "") return null;
    const rehearsal = doc["rehearsal"] as { csrfToken?: unknown } | null | undefined;
    return {
      baseUrl: typeof doc["baseUrl"] === "string" && doc["baseUrl"] !== "" ? doc["baseUrl"] : window.location.origin,
      publishableKey: doc["publishableKey"],
      ...(typeof doc["tables"] === "object" && doc["tables"] !== null ? { tables: doc["tables"] as Record<string, string> } : {}),
      ...(typeof doc["publicKeys"] === "object" && doc["publicKeys"] !== null ? { publicKeys: doc["publicKeys"] as Record<string, string> } : {}),
      ...(typeof doc["addOns"] === "object" && doc["addOns"] !== null ? { addOns: doc["addOns"] as Record<string, { present?: boolean }> } : {}),
      ...(Array.isArray(doc["frameOrigins"]) ? { frameOrigins: doc["frameOrigins"] as string[] } : {}),
      ...(typeof rehearsal?.csrfToken === "string" && rehearsal.csrfToken !== "" ? { rehearsalToken: rehearsal.csrfToken } : {}),
    };
  } catch {
    return null;
  }
}

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

function Root({ door, rows, base, frame }: { door: LumenDoor; rows: StudioRows; base: string; frame: FrameLink | null }) {
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
    <AppProvider door={door} rows={rows} base={base} frame={frame}>
      <Shell>
        <Screen />
      </Shell>
    </AppProvider>
  );
}

function notConnected(mount: HTMLElement): void {
  mount.innerHTML = "";
  const box = document.createElement("div");
  box.setAttribute("role", "alert");
  box.style.cssText = "max-width:480px;margin:15vh auto;padding:24px;text-align:center;font-family:system-ui,sans-serif";
  const h = document.createElement("h1");
  h.textContent = "This booking page is not connected";
  h.style.fontSize = "20px";
  const p = document.createElement("p");
  p.textContent = "Please try again in a moment, or e-mail the studio.";
  box.append(h, p);
  mount.append(box);
}

export async function bootCustomer(mount: HTMLElement): Promise<void> {
  const framed = readFrame();
  try {
    const stored = localStorage.getItem("lumen-theme");
    if (framed !== null) document.documentElement.dataset["theme"] = framed.theme;
    else if (stored === "light" || stored === "dark") document.documentElement.dataset["theme"] = stored;
  } catch {
    // The browser's own preference stands.
  }
  const served = await resolveServed(framed !== null);
  if (served === null) {
    notConnected(mount);
    return;
  }
  const door = new LumenDoor(served, { framed: framed !== null });
  let rows: StudioRows;
  try {
    rows = await door.studio();
  } catch {
    notConnected(mount);
    return;
  }
  const base = mountOf(window.location.pathname);
  const frame = framed === null ? null : startFrame({ origins: served.frameOrigins ?? [], screens: FRAMED_SCREENS, base, root: mount });
  createRoot(mount).render(
    <StrictMode>
      <I18nProvider>
        <Root door={door} rows={rows} base={base} frame={frame} />
      </I18nProvider>
    </StrictMode>,
  );
}
