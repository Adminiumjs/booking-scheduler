/**
 * The demo's Adminium, whole: Lumen's world in the page, the guest's door into
 * it and the desk's, one of each for the page. The card's persona, theme and
 * language sit beside it (`useDemo`), since the card, not the app, chooses them.
 *
 * DEMO BUILD ONLY: nothing in a real build imports it.
 */
import { create } from "zustand";

import { DemoDesk } from "./desk.ts";
import { DemoGuest } from "./guest.ts";
import { LumenWorld } from "./world.ts";

export interface DemoAdminium {
  world: LumenWorld;
  guest: DemoGuest;
  desk: DemoDesk;
}

export function makeDemo(start?: number): DemoAdminium {
  const world = new LumenWorld(start);
  return { world, guest: new DemoGuest(world), desk: new DemoDesk(world) };
}

let demo: DemoAdminium | null = null;

/** The one demo Adminium of this page. */
export function demoAdminium(): DemoAdminium {
  demo ??= makeDemo();
  return demo;
}

export type Persona = "guest" | "desk";
export type WebMode = "inline" | "button" | "floating";

export interface DemoState {
  persona: Persona;
  theme: "light" | "dark";
  /** The language the card asked for, or null until it asks. */
  locale: string | null;
  /** Counts the fresh worlds this page has had: the doors are the newest one's. */
  generation: number;
  /** Counts the guest pages the card opened and the clock's moves: each draws the page afresh from the address. */
  page: number;
  /** The guest's page, or the stand-in website holding it (G15). */
  view: "site" | "web";
  webMode: WebMode;
  /** The Book page is showing the waiting-list card: the card's "Waiting list". */
  waiting: boolean;
}

const FIRST: DemoState = { persona: "guest", theme: "light", locale: null, generation: 0, page: 0, view: "site", webMode: "inline", waiting: false };

export const useDemo = create<DemoState>(() => FIRST);

/** A fresh Lumen in the same page: the card's "Back to Tuesday morning". Who is using it, the theme and the language stay. */
export function renewDemo(): DemoAdminium {
  demo = makeDemo();
  useDemo.setState((s) => ({ generation: s.generation + 1, page: s.page + 1, view: "site", waiting: false }));
  return demo;
}

/** For tests: a fresh Lumen, as a new page would have. */
export function resetDemo(): DemoAdminium {
  demo = makeDemo();
  useDemo.setState((s) => ({ ...FIRST, generation: s.generation + 1 }));
  return demo;
}

/** The app's own address under the demo's base: `/demo/booking-scheduler/app`, or nothing on a dev server. */
export const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
