/**
 * The demo build's start: the guest's pages and the studio desk, both, over the
 * one Lumen held in the page (`adminium.ts`), with no server anywhere. Whoever
 * the card says is using it has their side drawn; a visit booked on one side is
 * on the other the moment it is made.
 *
 * The page answers the website's demo card (`demoBridge.ts`) and keeps no card
 * of its own: no word of "demo" is drawn on the guest's pages or the desk, but
 * for the one line where Google's reviews would load (`guest.ts`). DEMO BUILD
 * ONLY: `main.tsx` reaches it behind the build-time `DEMO` flag.
 */
import { StrictMode, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";

import customerCss from "../customer/customer.css?inline";
import deskCss from "../desk/desk.css?inline";

import { Root } from "../customer/Root.tsx";
import { DeskApp } from "../desk/DeskApp.tsx";
import { DeskProvider, reload, type DeskEnv } from "../desk/env.tsx";
import { useDesk } from "../desk/store.ts";
import { attachDemoBridge, clearTab } from "../demoBridge.ts";
import { I18nProvider, useI18n } from "../i18n/index.tsx";
import { resolveLocale } from "../i18n/locales.ts";
import { BASE, demoAdminium, useDemo } from "./adminium.ts";
import { PAY_MARK } from "./guest.ts";
import { payHandOff } from "./shortcuts.ts";
import { Website } from "./website.tsx";

/** The card's language, once it has said one. */
function CardLocale() {
  const { setLocale } = useI18n();
  const asked = useDemo((s) => s.locale);
  useEffect(() => {
    if (asked !== null) setLocale(resolveLocale([asked]));
  }, [asked, setLocale]);
  return null;
}

/** The card's theme on the page, for the guest and the desk alike (the desk keeps its own in step). */
function CardTheme() {
  const theme = useDemo((s) => s.theme);
  const persona = useDemo((s) => s.persona);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (useDesk.getState().theme !== theme) useDesk.setState({ theme });
  }, [theme, persona]);
  return null;
}

/**
 * The two sides were written to be served apart and share class names, so the
 * page carries only the stylesheet of the side on show. The console's own pages
 * are not in the demo (C1), so a link to one is not drawn.
 */
function SideStyles() {
  const persona = useDemo((s) => s.persona);
  useEffect(() => {
    let tag = document.getElementById("lumen-side") as HTMLStyleElement | null;
    if (tag === null) {
      tag = document.createElement("style");
      tag.id = "lumen-side";
      document.head.append(tag);
    }
    tag.textContent = `${persona === "desk" ? deskCss : customerCss}\na[target="_top"]{display:none!important}`;
  }, [persona]);
  return null;
}

/** The guest's pages as the address says, over the demo's door, drawn afresh each time the card moves them. */
function GuestSide() {
  const generation = useDemo((s) => s.generation);
  const page = useDemo((s) => s.page);
  const view = useDemo((s) => s.view);
  const demo = useMemo(() => demoAdminium(), [generation]);
  const rows = useMemo(() => demo.guest.rows(), [demo, page]);
  const clockNow = useMemo(() => () => demo.world.now, [demo]);
  if (view === "web") return <Website key={`w${String(page)}`} door={demo.guest} rows={rows} clockNow={clockNow} />;
  return <Root key={`${String(generation)}:${String(page)}`} door={demo.guest} rows={rows} base={BASE} frame={null} clockNow={clockNow} />;
}

function DeskSide() {
  const generation = useDemo((s) => s.generation);
  const env = useMemo<DeskEnv>(
    () => ({ door: demoAdminium().desk }),
    // A fresh world is a new door.
    [generation],
  );
  return (
    <DeskProvider env={env}>
      <DeskApp />
    </DeskProvider>
  );
}

export function DemoRoot() {
  const persona = useDemo((s) => s.persona);
  return (
    <>
      <CardLocale />
      <CardTheme />
      <SideStyles />
      {persona === "guest" ? <GuestSide /> : <DeskSide />}
    </>
  );
}

/**
 * Nothing leaves the page: the pay step is a mark in the address, and an
 * outside link (Google, a calendar, the studio's site) is not followed, so the
 * demo never loads anything from anywhere else. A download stays a download.
 */
function keepLinksInPage(): void {
  document.addEventListener(
    "click",
    (event) => {
      const link = (event.target as Element | null)?.closest?.("a");
      if (link === null || link === undefined || link.hasAttribute("download")) return;
      if (link.getAttribute("href")?.startsWith(PAY_MARK) === true) {
        event.preventDefault();
        payHandOff();
        return;
      }
      if (link.target === "_blank" || link.target === "_top" || link.protocol === "mailto:") event.preventDefault();
    },
    true,
  );
  window.addEventListener("hashchange", () => {
    if (window.location.hash === PAY_MARK) payHandOff();
    if (window.location.hash === "#lumen-connected") {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      void reload(demoAdminium().desk);
    }
  });
}

export async function bootDemo(mount: HTMLElement): Promise<void> {
  // A new demo page is a new Lumen: nothing of the last one's booking, sale or sign-in.
  clearTab();
  keepLinksInPage();
  window.history.replaceState(null, "", `${BASE}/`);
  createRoot(mount).render(
    <StrictMode>
      <I18nProvider>
        <DemoRoot />
      </I18nProvider>
    </StrictMode>,
  );
  attachDemoBridge();
}
