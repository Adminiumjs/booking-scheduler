/**
 * The demo build's side of the website's demo card: the card says which
 * screen, person, language and theme to show, presses shortcuts and moves
 * the clock; the page says where it is. DEMO BUILD ONLY: `main.tsx` reaches
 * it only behind the build-time `DEMO` flag, through the demo's own start, so
 * no surface bundle carries the protocol.
 *
 * Both ends speak only to their own origin: the card's page frames this one
 * from the same site, so a message from anywhere else, or from any window but
 * the one framing this page, is ignored, and nothing is ever posted to `*`.
 */
import { DEMO_MESSAGE_PREFIX, isDemoMessage, type DemoMessage } from "./demo-types.ts";
import { demoAdminium, useDemo } from "./demo/adminium.ts";
import { clockLine } from "./demo/card.ts";
import { currentScreen, goScreen, moveClock, resetWorld, runShortcut, SCREEN_IDS, setPersona, SHORTCUT_IDS } from "./demo/shortcuts.ts";
import { useDesk } from "./desk/store.ts";

export { SCREEN_IDS, SHORTCUT_IDS };

const APP_KEY = "bookings";

/** What the app keeps for the tab: a new demo page starts without the last one's booking, sale or sign-in. */
const TAB_SLOTS = ["lumen.booking", "lumen.purchase", "lumen.proved-at"];
const TAB_PREFIX = "lumen.session.";

const locale = (): string => document.documentElement.lang || "en-US";

function post(message: DemoMessage): void {
  if (window.parent === window) return;
  window.parent.postMessage(message, window.location.origin);
}

/** The clock as the card prints it, in the page's language: "Tue 15 Sep · 10:40 AM". */
export const clockLabel = (): string => clockLine(demoAdminium().world.now, locale());

/** Whether the page shows a dialog, a sheet or a panel over the screen: the card steps aside while it does. */
function overlay(): boolean {
  if (useDemo.getState().persona === "desk") {
    const s = useDesk.getState();
    return s.overlay !== null || s.panel !== null;
  }
  return document.querySelector('[role="dialog"], [role="alertdialog"]') !== null;
}

let queued = false;
let lastSent = "";

/** Where the page is, for the card: once per burst of changes, and only when something changed. */
export function reportState(): void {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    const state: DemoMessage = {
      type: `${DEMO_MESSAGE_PREFIX}state` as "adminium:demo:state",
      dv: 1,
      screen: currentScreen(),
      persona: useDemo.getState().persona,
      mode: null,
      online: true,
      toggles: {},
      locale: locale(),
      theme: useDemo.getState().theme,
      clockLabel: clockLabel(),
      overlay: overlay(),
    };
    const text = JSON.stringify(state);
    if (text === lastSent) return;
    lastSent = text;
    post(state);
  });
}

export function clearTab(): void {
  try {
    for (const slot of TAB_SLOTS) sessionStorage.removeItem(slot);
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const key = sessionStorage.key(i);
      if (key !== null && key.startsWith(TAB_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // no storage: nothing kept to clear
  }
}

export async function applyDemoMessage(message: DemoMessage): Promise<void> {
  switch (message.type) {
    case "adminium:demo:init":
    case "adminium:demo:set": {
      if (message.theme !== undefined) useDemo.setState({ theme: message.theme });
      if (message.locale !== undefined) useDemo.setState({ locale: message.locale });
      if (message.persona === "guest" || message.persona === "desk") {
        const was = useDemo.getState().persona;
        await setPersona(message.persona);
        // The card names only the person: the page opens that person's first screen (L4-F13).
        if (message.type === "adminium:demo:set" && was !== message.persona) await goScreen(message.persona === "desk" ? "today" : "page");
      }
      if (message.type === "adminium:demo:init" && message.screen !== undefined) await goScreen(message.screen);
      break;
    }
    case "adminium:demo:go":
      await goScreen(message.screen);
      break;
    case "adminium:demo:do":
      await runShortcut(message.shortcut);
      break;
    case "adminium:demo:clock":
      await moveClock(message.advance);
      break;
    case "adminium:demo:reset":
      clearTab();
      await resetWorld();
      break;
    default:
      break;
  }
  reportState();
}

export function attachDemoBridge(): void {
  window.addEventListener("message", (event: MessageEvent) => {
    if (event.source !== window.parent || event.origin !== window.location.origin || !isDemoMessage(event.data)) return;
    void applyDemoMessage(event.data);
  });
  for (const store of [useDemo, useDesk]) (store as { subscribe: (f: () => void) => unknown }).subscribe(reportState);
  // The guest's pages keep their place in the address and their sheets in the page: both are watched from here.
  for (const name of ["pushState", "replaceState"] as const) {
    const original = window.history[name].bind(window.history);
    window.history[name] = (...args: Parameters<History["pushState"]>) => {
      original(...args);
      reportState();
    };
  }
  window.addEventListener("popstate", reportState);
  new MutationObserver(reportState).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"], childList: true, subtree: true });
  post({ type: `${DEMO_MESSAGE_PREFIX}hello` as "adminium:demo:hello", dv: 1, appKey: APP_KEY });
}
