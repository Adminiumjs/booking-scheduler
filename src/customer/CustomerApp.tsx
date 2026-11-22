/**
 * The customer side's start: find the Adminium it talks to, read the studio, and
 * draw the page for the address. In a frame it holds to the screens the manifest
 * declares (cT13, cQ7); anything else opens in a new tab.
 */
import { readFrame, startFrame } from "@adminiumjs/public-client/frame";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { I18nProvider } from "../i18n/index.tsx";
import "./customer.css";
import { LumenDoor, type Served, type StudioRows } from "./door.ts";
import { FRAMED_SCREENS, mountOf } from "./route.ts";
import { frameEvents, Root } from "./Root.tsx";

/** Where this page was served from, and with which keys. */
export async function resolveServed(framed: boolean): Promise<Served | null> {
  // By name: `vite.config.ts` defines these, and a hosted build defines them empty.
  const baseUrl = import.meta.env.VITE_ADMINIUM_API_BASE_URL;
  const key = import.meta.env.VITE_ADMINIUM_PUBLISHABLE_KEY;
  if (baseUrl && key) {
    const link = import.meta.env.VITE_ADMINIUM_LINK_KEY;
    const sale = import.meta.env.VITE_ADMINIUM_SALE_KEY;
    return { baseUrl, publishableKey: key, publicKeys: { ...(link ? { link } : {}), ...(sale ? { sale } : {}) } };
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
  const frame = framed === null ? null : startFrame({
          origins: served.frameOrigins ?? [],
          screens: FRAMED_SCREENS,
          base,
          root: mount,
          onLinked: ({ label }) => frameEvents.set({ label }),
          onOpen: () => frameEvents.set({ open: true }),
          onClose: () => frameEvents.set({ open: false }),
        });
  createRoot(mount).render(
    <StrictMode>
      <I18nProvider>
        <Root door={door} rows={rows} base={base} frame={frame} />
      </I18nProvider>
    </StrictMode>,
  );
}
