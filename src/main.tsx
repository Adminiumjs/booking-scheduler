/*
 * Entry point: which of the app's starts this bundle runs.
 *
 *   the staff build      the desk, on the signed-in person's session;
 *   the customer build   the booking pages, on the key Adminium binds to them;
 *   the demo build       both, over one Lumen Studio held in the page, for
 *                        the website's demo card;
 *   a connected build    the booking pages on their own domain, on the address
 *                        and keys baked in.
 *
 * Each start is a dynamic import behind a flag `surface.ts` folds at build
 * time, so a bundle carries only its own.
 */

import "./styles/tokens.css";
import "./styles/base.css";

import { DEMO, SURFACE_SIDE } from "./surface.ts";

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root — check index.html");

async function boot(mount: HTMLElement): Promise<void> {
  if (SURFACE_SIDE === "staff") {
    const { bootDesk } = await import("./desk/boot.tsx");
    await bootDesk(mount);
    return;
  }
  if (SURFACE_SIDE === null && DEMO && import.meta.env.VITE_LUMEN_CUSTOMER !== "1") {
    const { bootDemo } = await import("./demo/boot.tsx");
    await bootDemo(mount);
    return;
  }
  const { bootCustomer } = await import("./customer/CustomerApp.tsx");
  await bootCustomer(mount);
}

void boot(container);
