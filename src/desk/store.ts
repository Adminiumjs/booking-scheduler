/**
 * The desk's screen state: which screen is open, the panel and sheet over it,
 * the toasts, and the rows last read. The rows are Adminium's, read again after
 * every write; nothing here keeps a figure of its own.
 */
import { create } from "zustand";

import type { Clash, DeskData } from "./door.ts";
import type { WaitFit } from "./facts.ts";
import type { Id } from "./wire.ts";

export type View = "today" | "calendar" | "clients" | "services" | "team" | "waiting" | "reviews" | "settings";

/** What New booking opens with; a move locks the service and the client (L2a-F13). */
export interface BookingDraft {
  moving: Id | null;
  service: Id | null;
  person: Id | null;
  day: string | null;
  clock: string | null;
  customer: Id | null;
}

export type Overlay =
  | { kind: "book"; draft: BookingDraft }
  | { kind: "cancel"; bookingId: Id }
  | { kind: "letGo"; bookingId: Id }
  | { kind: "refund"; bookingId: Id }
  | { kind: "offer"; entryId: Id; person: Id; day: string; clock: string; freedBy: Id | null }
  | { kind: "calendar"; teamId: Id }
  | { kind: "disconnect"; teamId: Id; addOn: string; provider: string }
  | { kind: "link"; teamId: Id }
  | { kind: "timeOff"; teamId: Id }
  | { kind: "service"; serviceId: Id | null }
  | { kind: "hide"; reviewId: Id }
  | { kind: "closure" }
  | { kind: "more" }
  | null;

export type Panel = { kind: "booking"; id: Id } | { kind: "client"; id: Id } | null;

export interface Toast {
  id: number;
  tone: "pos" | "warn" | "danger";
  text: string;
}

export interface DeskState {
  view: View;
  panel: Panel;
  overlay: Overlay;
  calendarDay: string | null;
  calendarMode: "day" | "week";
  calendarPerson: Id | null;
  /** A refused drop's sentence, and an accepted one's outcome, on the calendar. */
  notice: { tone: "pos" | "danger"; text: string } | null;
  reviewTab: "waiting" | "published" | "hidden";
  settingsTab: "studio" | "rules" | "payments" | "requests" | "website" | "emails";
  clientSegment: "all" | "new" | "away";
  query: string;
  toasts: Toast[];
  said: string;
  data: DeskData | null;
  fits: Record<string, WaitFit[]>;
  failure: string | null;
  /** The server asked the desk to slow down; it tries again by itself. */
  slowedDown: boolean;
  theme: "light" | "dark" | null;
}

export const useDesk = create<DeskState>(() => ({
  view: "today",
  panel: null,
  overlay: null,
  calendarDay: null,
  calendarMode: "day",
  calendarPerson: null,
  notice: null,
  reviewTab: "waiting",
  settingsTab: "studio",
  clientSegment: "all",
  query: "",
  toasts: [],
  said: "",
  data: null,
  fits: {},
  failure: null,
  slowedDown: false,
  theme: null,
}));

/** Open a section, closing whatever lay over the last one. */
export function go(view: View, more: Partial<Pick<DeskState, "calendarDay" | "calendarMode" | "calendarPerson" | "reviewTab" | "settingsTab">> = {}): void {
  useDesk.setState({ view, ...more, overlay: null, panel: null, query: "", notice: null });
}

export const currentView = (): View => useDesk.getState().view;
export const openSheet = (overlay: Overlay): void => useDesk.setState({ overlay });
export const closeSheet = (): void => useDesk.setState({ overlay: null });
export const openBooking = (id: Id): void => useDesk.setState({ panel: { kind: "booking", id }, query: "" });
export const openClient = (id: Id): void => useDesk.setState({ panel: { kind: "client", id }, query: "" });
export const closePanel = (): void => useDesk.setState({ panel: null });

/** New booking, with what the place it was opened from already knows. */
export function newBooking(draft: Partial<BookingDraft> = {}): void {
  openSheet({ kind: "book", draft: { moving: null, service: null, person: null, day: null, clock: null, customer: null, ...draft } });
}

/** The key "Keep it" and a clash's row are told apart by. */
export const clashKey = (clash: Clash): string => `${clash.row}:${String(clash.overlapStart)}:${String(clash.overlapEnd)}`;

let toastId = 0;

/** A toast that goes by itself after a few seconds; it is said once, in the live region. */
export function toast(text: string, tone: Toast["tone"] = "pos"): void {
  toastId += 1;
  const id = toastId;
  useDesk.setState((s) => ({ toasts: [...s.toasts, { id, tone, text }], said: text }));
  setTimeout(() => useDesk.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4_500);
}
