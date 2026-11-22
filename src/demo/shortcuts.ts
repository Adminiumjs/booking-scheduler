/**
 * What the demo card's screens and shortcuts do: each one is what a person
 * would do on the page (choose a time, type an address, press a star), or what
 * would happen in the world meanwhile (a deposit lands, someone takes the
 * time), never a state the screens could not reach themselves. No shortcut
 * says "Done": the screen it leaves shows what it did (L4-F7).
 *
 * The customer's pages keep their steps in their own state, so a shortcut works
 * them from the outside the way a visitor does: it opens the address and
 * presses the real controls. Every value it types is the sample's (`card.ts`).
 *
 * DEMO BUILD ONLY: nothing in a real build imports it.
 */
import { fmtDay, fmtTime, type Clock } from "../customer/format.ts";
import { keepBooking } from "../customer/session.ts";
import { reload } from "../desk/env.tsx";
import { go as deskGo, newBooking, openBooking, useDesk, type View as DeskView } from "../desk/store.ts";
import { addDays } from "../desk/time.ts";
import type { Id, Row } from "../desk/wire.ts";
import { BASE, demoAdminium, renewDemo, useDemo, type Persona, type WebMode } from "./adminium.ts";
import { SAMPLE_PICKS } from "./card.ts";
import { instantAt } from "./sample.ts";
import type { PayWord } from "./world.ts";

const demo = () => demoAdminium();
const world = () => demo().world;

/** The desk's screen state as a new page has it, kept for "Back to Tuesday morning". */
const DESK_START = { ...useDesk.getState() };

/** How long the demo's pay step takes before the way back. */
export const DEMO_PAY_MS = 1100;

/** Wait, a little at a time and not for ever, until the page's answer is in. */
export async function until(done: () => boolean, tries = 120): Promise<boolean> {
  for (let i = 0; i < tries; i += 1) {
    if (done()) return true;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return done();
}

const one = <T extends Element = HTMLElement>(selector: string) => document.querySelector<T>(selector);

/** A text box filled in as if typed: React reads the value through its own setter. */
function typeInto(input: HTMLInputElement | HTMLTextAreaElement | null, value: string): void {
  if (input === null) return;
  const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

const clockNow = (): Clock => ({ locale: document.documentElement.lang || "en-US", timezone: world().zone, currency: world().currency });

// ── the guest's pages ───────────────────────────────────────────────────────

/** A page of the guest's, by its address, drawn afresh. */
export function openPath(path: string): void {
  useDemo.setState({ view: "site", waiting: false });
  window.history.pushState(null, "", `${BASE}${path}`);
  useDemo.setState((s) => ({ page: s.page + 1 }));
}

const guestPath = (): string => window.location.pathname.slice(BASE.length).replace(/\/+$/, "") || "/";

async function asGuest(): Promise<void> {
  await setPersona("guest");
}

/** Switch who is using it; the desk reads its rows again as it opens. */
export async function setPersona(persona: Persona): Promise<void> {
  const was = useDemo.getState().persona;
  if (was !== persona) useDemo.setState({ persona });
  if (persona === "desk") await reload(demo().desk);
}

const bookingId = (code: string): Id => world().byCode(code)!.id;

/** A visit opened by its own link, as its e-mail would open it. */
function openVisit(code: string): void {
  const row = world().byCode(code);
  if (row === undefined) return;
  demo().guest.holdLink(row.id);
  keepBooking({ id: String(row.id), token: null, name: String(row["name"]), email: String(row["email"]), fresh: false, signedIn: false });
  openPath(`/b?id=${String(row.id)}`);
}

/** A moment for React to draw what was just asked of it. */
const drawn = (ms = 60) => new Promise((resolve) => setTimeout(resolve, ms));

/** The Book page on a service, for that person or Anyone, at its third step, with its first day chosen. */
async function openBook(service: string, who: string | null): Promise<void> {
  await asGuest();
  openPath(`/book?service=${service}&with=${who ?? "any"}`);
  await drawn();
  await until(() => one('button.lm-day[aria-pressed="true"]') !== null);
}

/** A day pressed on the strip, its times read. */
async function pickDay(day: string): Promise<void> {
  const name = fmtDay(clockNow(), day);
  const found = () => [...document.querySelectorAll<HTMLButtonElement>("button.lm-day")].find((b) => (b.getAttribute("aria-label") ?? "").startsWith(name));
  await until(() => found() !== undefined);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const button = found();
    if (button === undefined || button.disabled) return;
    if (button.getAttribute("aria-pressed") === "true") break;
    button.click();
    await drawn();
  }
  await until(() => one('.lm-book [aria-busy="true"]') === null);
}

/** A time pressed, as the page shows it; the first free one if that time has gone. */
async function pickTime(minute: number): Promise<void> {
  const label = fmtTime(clockNow(), minute);
  await until(() => one("button.lm-slot") !== null);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slots = [...document.querySelectorAll<HTMLButtonElement>("button.lm-slot")];
    const slot = slots.find((b) => b.textContent === label) ?? slots[0];
    if (slot === undefined || slot.getAttribute("aria-pressed") === "true") return;
    slot.click();
    await drawn();
  }
}

/** Gel Manicure, Anyone, Thursday 10 AM: chosen the way a guest would, never showing who it will be. */
async function pickGel(): Promise<void> {
  const { service, day, minute } = SAMPLE_PICKS.gel;
  await openBook(service, null);
  await pickDay(day);
  await pickTime(minute);
}

/** Balayage with Elin on Saturday: a full day, with the waiting-list card. */
async function openFullDay(): Promise<void> {
  const { service, team, day } = SAMPLE_PICKS.full;
  await openBook(service, team);
  await pickDay(day);
}

/**
 * "Someone takes your time": the guest has the time and their details in, and
 * another guest books it first. Pressing Confirm gets the page's own refusal.
 */
async function takeTheTime(): Promise<void> {
  await pickGel();
  const onward = one<HTMLButtonElement>(".lm-foot-bar .lm-btn.primary");
  onward?.click();
  await drawn();
  await until(() => one("#lm-name") !== null);
  typeInto(one<HTMLInputElement>("#lm-name"), SAMPLE_PICKS.avaName);
  typeInto(one<HTMLInputElement>("#lm-email"), SAMPLE_PICKS.avaEmail);
  await new Promise((resolve) => setTimeout(resolve, 0));
  const w = world();
  const { service, day, minute } = SAMPLE_PICKS.gel;
  const clock = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
  const row = w.get("services", service)!;
  // Everyone who could have taken it is booked by someone else.
  for (let guard = 0; guard < 6; guard += 1) {
    const taker = w.pickAnyone(row, day, minute, { guest: false });
    if (taker === null) break;
    w.makeVisit({ service, person: taker.id, startsAt: new Date(instantAt(day, clock)).toISOString(), name: "Hannah Wills", email: "hannah.wills@example.com", channel: "page", door: "desk", proved: false });
  }
  one<HTMLButtonElement>(".lm-summary .lm-btn.primary")?.click();
}

// ── paying ──────────────────────────────────────────────────────────────────

/** The visit being paid, or a new one of Ava's on the first free time for a deposit service, sent to the pay step. */
function payingVisit(): Row | null {
  const w = world();
  const guest = demo().guest;
  const held = w.all("bookings").find((b) => b["state"] === "paying" && b["email"] === SAMPLE_PICKS.avaEmail);
  if (held !== undefined) {
    guest.holdLink(held.id);
    return held;
  }
  const service = w.all("services").find((s) => s["online"] === "deposit" && s["active"] !== false);
  if (service === undefined) return null;
  for (let i = 0; i < 14; i += 1) {
    const day = addDays(w.today(), i);
    const slot = w.slots(service.id, null, day, { guest: true }).find((s) => s.state === "free");
    if (slot === undefined) continue;
    const row = w.makeVisit({ service: service.id, person: null, startsAt: new Date(instantAt(day, slot.time)).toISOString(), name: SAMPLE_PICKS.avaName, email: SAMPLE_PICKS.avaEmail, language: clockNow().locale, channel: "page", door: "desk", depositLink: true, proved: false });
    Object.assign(row, { deposit_link: false, from_card: true });
    w.startPaying(row.id);
    guest.holdLink(row.id);
    keepBooking({ id: String(row.id), token: null, name: String(row["name"]), email: String(row["email"]), fresh: true, signedIn: false });
    return row;
  }
  return null;
}

/** The way back from the pay step, for the visit at hand. */
async function showPaying(): Promise<Row | null> {
  await asGuest();
  const row = payingVisit();
  if (row === null) return null;
  keepBooking({ id: String(row.id), token: null, name: String(row["name"]), email: String(row["email"]), fresh: true, signedIn: false });
  openPath("/paid");
  return row;
}

async function payEnds(outcome: "paid" | "confirming" | "failed" | "letGo"): Promise<void> {
  const row = await showPaying();
  if (row === null) return;
  if (outcome === "letGo") world().letGoNow(row.id);
  else world().settle(row.id, outcome);
  // Drawn again now, not at the page's next look.
  openPath("/paid");
}

/** The page reached the pay step on its own: the demo's "pay page" takes a moment, and pays. */
export function payHandOff(): void {
  const guest = demo().guest;
  const path = guestPath();
  window.history.replaceState(null, "", `${BASE}${path}${window.location.search}`);
  const sale = path === "/gift-cards" || path === "/packs" ? guest.saleInHand() : null;
  const visit = sale === null ? guest.paying : null;
  openPath("/paid");
  setTimeout(() => {
    if (sale !== null) world().settleSale(sale, "paid" satisfies PayWord);
    else if (visit !== null) world().settle(visit, "paid");
    if (guestPath() === "/paid") openPath("/paid");
  }, DEMO_PAY_MS);
}

// ── find and review ─────────────────────────────────────────────────────────

async function fillFind(): Promise<void> {
  await asGuest();
  if (guestPath() !== "/find") openPath("/find");
  await until(() => one("#lm-si-email") !== null || one("#lm-si-otp") !== null);
  if (one("#lm-si-otp") !== null) {
    openPath("/find");
    await until(() => one("#lm-si-email") !== null);
  }
  typeInto(one<HTMLInputElement>("#lm-fd-code"), SAMPLE_PICKS.avaNext);
  typeInto(one<HTMLInputElement>("#lm-si-email"), SAMPLE_PICKS.avaEmail);
}

/** "Fill the code": asked for first when it was not yet, then typed. The booking opens only when the guest presses on. */
async function fillCode(): Promise<void> {
  await asGuest();
  if (one("#lm-si-otp") === null) {
    await fillFind();
    await new Promise((resolve) => setTimeout(resolve, 0));
    one<HTMLButtonElement>('form button[type="submit"]')?.click();
    await until(() => one("#lm-si-otp") !== null);
  }
  const code = demo().guest.codeFor(SAMPLE_PICKS.avaEmail);
  if (code !== null) typeInto(one<HTMLInputElement>("#lm-si-otp"), code);
}

/** Ava's last visit, ready to be rated: a rating already given is taken back so both stars can be tried. */
function openReview(): void {
  const w = world();
  const row = w.byCode(SAMPLE_PICKS.avaLast)!;
  if (row["reviewed_at"] !== null) {
    for (const review of w.all("reviews").filter((r) => r["subject_key"] === String(row.id))) w.remove("reviews", review.id);
    row["reviewed_at"] = null;
    w.changed();
  }
  window.location.hash = "";
  useDemo.setState({ view: "site", waiting: false });
  window.history.pushState(null, "", `${BASE}/review#${demo().guest.reviewToken(row.id)}`);
  useDemo.setState((s) => ({ page: s.page + 1 }));
}

async function rate(stars: number): Promise<void> {
  await asGuest();
  openReview();
  await until(() => one(`[data-star="${String(stars)}"]`) !== null);
  one<HTMLButtonElement>(`[data-star="${String(stars)}"]`)?.click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  one<HTMLButtonElement>('form button[type="submit"]')?.click();
}

// ── the website ─────────────────────────────────────────────────────────────

async function showWebsite(mode: WebMode): Promise<void> {
  await asGuest();
  window.history.replaceState(null, "", `${BASE}/book`);
  useDemo.setState((s) => ({ view: "web", webMode: mode, waiting: false, page: s.page + 1 }));
}

// ── the desk ────────────────────────────────────────────────────────────────

async function deskScreen(view: DeskView, more: Parameters<typeof deskGo>[1] = {}): Promise<void> {
  await setPersona("desk");
  deskGo(view, more);
}

/** A refused drop, made with the real drag: a booking onto another's clean-up. It springs back with its reason. */
async function dragRefused(): Promise<void> {
  await deskScreen("calendar", { calendarDay: world().today(), calendarMode: "day" });
  await until(() => one(".lm-col-body") !== null);
  await new Promise((resolve) => setTimeout(resolve, 60));
  for (const column of document.querySelectorAll<HTMLElement>(".lm-col-body")) {
    const blocks = [...column.querySelectorAll<HTMLElement>('button.lm-block[draggable="true"]')];
    const tails = [...column.querySelectorAll<HTMLElement>(".lm-tail")];
    for (const block of blocks) {
      const tail = tails.find((t) => t.parentElement !== block.parentElement);
      if (tail === undefined) continue;
      const data = typeof DataTransfer === "function" ? new DataTransfer() : ({ setData() {}, effectAllowed: "move" } as unknown as DataTransfer);
      const fire = (target: Element, type: string, y: number) => {
        const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientY: y });
        Object.defineProperty(event, "dataTransfer", { value: data });
        target.dispatchEvent(event);
      };
      const y = tail.getBoundingClientRect().top + 1;
      fire(block, "dragstart", y);
      fire(column, "dragover", y);
      fire(column, "drop", y);
      fire(block, "dragend", y);
      return;
    }
  }
}

/** Theo's Saturday: the 10 AM Owen cancelled, offered from the waiting list. */
async function offerTheo(): Promise<void> {
  const w = world();
  const entry = w.all("waitlist").find((e) => e["name"] === SAMPLE_PICKS.theoName && e["service_id"] === SAMPLE_PICKS.theoService && e["day"] === SAMPLE_PICKS.theoDay);
  await deskScreen("waiting");
  if (entry === undefined || entry["state"] !== "waiting") return;
  const startsAt = new Date(instantAt(SAMPLE_PICKS.theoDay, SAMPLE_PICKS.theoClock)).toISOString();
  await demo().desk.offerTime({ entry, person: SAMPLE_PICKS.theoPerson, startsAt, key: "offer-theo" }).catch(() => undefined);
  await reload(demo().desk);
}

async function danaLands(): Promise<void> {
  const w = world();
  const dana = w.byCode(SAMPLE_PICKS.dana)!;
  if (dana["state"] === "paying") w.settle(dana.id, "paid");
  await deskScreen("today");
  await reload(demo().desk);
  openBooking(dana.id);
}

// ── going to a screen ───────────────────────────────────────────────────────

const GUEST_PATHS: Record<string, string> = {
  page: "/",
  book: "/book",
  find: "/find",
  reviews: "/reviews",
  gifts: "/gift-cards",
  packs: "/packs",
  help: "/help",
  "404": "/a-page-that-is-not-here",
};

const DESK_VIEWS: Record<string, DeskView> = {
  today: "today",
  cal: "calendar",
  clients: "clients",
  services: "services",
  team: "team",
  dwait: "waiting",
  dreviews: "reviews",
  settings: "settings",
};

export const SCREEN_IDS = [...Object.keys(GUEST_PATHS), "paying", "booked", "yours", "visits", "wait", "how", "web", ...Object.keys(DESK_VIEWS), "new"];

export async function goScreen(screen: string): Promise<void> {
  const path = GUEST_PATHS[screen];
  if (path !== undefined) {
    await asGuest();
    openPath(path);
    return;
  }
  const view = DESK_VIEWS[screen];
  if (view !== undefined) {
    await deskScreen(view);
    return;
  }
  switch (screen) {
    case "paying":
      await showPaying();
      return;
    case "booked": {
      await asGuest();
      const w = world();
      // A visit just booked: the one in hand, or Ava's next as it read when it was made.
      const row = w.all("bookings").find((b) => b.id === (w.all("bookings").filter((x) => x["email"] === SAMPLE_PICKS.avaEmail && x["state"] === "booked").at(-1)?.id ?? null));
      if (row === undefined) return;
      demo().guest.holdLink(row.id);
      keepBooking({ id: String(row.id), token: null, name: String(row["name"]), email: String(row["email"]), fresh: true, signedIn: false });
      openPath(`/b?new=1&id=${String(row.id)}`);
      return;
    }
    case "yours":
      await asGuest();
      openVisit(SAMPLE_PICKS.avaNext);
      return;
    case "visits":
      await asGuest();
      if (!demo().guest.signedIn()) demo().guest.signInAs(SAMPLE_PICKS.avaEmail);
      openPath("/account");
      return;
    case "wait":
      await openFullDay();
      useDemo.setState({ waiting: true });
      return;
    case "how":
      await asGuest();
      openReview();
      return;
    case "web":
      await showWebsite(useDemo.getState().webMode);
      return;
    case "new":
      await deskScreen("today");
      newBooking();
      return;
    default:
      return;
  }
}

/** Which of the card's screens the page is on. */
export function currentScreen(): string {
  const state = useDemo.getState();
  if (state.persona === "desk") {
    const desk = useDesk.getState();
    if (desk.overlay?.kind === "book" && desk.overlay.draft.moving === null) return "new";
    return Object.entries(DESK_VIEWS).find(([, view]) => view === desk.view)?.[0] ?? "today";
  }
  if (state.view === "web") return "web";
  const path = guestPath();
  const query = new URLSearchParams(window.location.search);
  switch (path) {
    case "/":
      return "page";
    case "/book":
      return state.waiting ? "wait" : "book";
    case "/paid":
      return "paying";
    case "/b":
      return query.get("new") === "1" ? "booked" : "yours";
    case "/find":
    case "/sign-in":
      return "find";
    case "/account":
      return "visits";
    case "/review":
      return "how";
    case "/reviews":
      return "reviews";
    case "/gift-cards":
      return "gifts";
    case "/packs":
      return "packs";
    case "/help":
    case "/policy":
    case "/privacy":
    case "/terms":
      return "help";
    default:
      return "404";
  }
}

// ── the shortcuts ───────────────────────────────────────────────────────────

const SHORTCUTS: Record<string, () => void | Promise<void>> = {
  gel: pickGel,
  full: openFullDay,
  taken: takeTheTime,
  paid: () => payEnds("paid"),
  bank: () => payEnds("confirming"),
  didnt: () => payEnds("failed"),
  letgo: () => payEnds("letGo"),
  reformer: async () => {
    await asGuest();
    openVisit(SAMPLE_PICKS.avaNext);
  },
  inside: async () => {
    await asGuest();
    const w = world();
    const row = w.byCode(SAMPLE_PICKS.avaNext)!;
    // The clock stands an hour past the free window, on the visit's eve.
    const inside = Date.parse(String(row["free_until"])) + 3_600_000;
    if (w.now < inside) w.moveTo(inside);
    openVisit(SAMPLE_PICKS.avaNext);
  },
  after: async () => {
    await asGuest();
    openVisit(SAMPLE_PICKS.avaLast);
  },
  fill: fillFind,
  fillcode: fillCode,
  rate5: () => rate(5),
  rate2: () => rate(2),
  inline: () => showWebsite("inline"),
  button: () => showWebsite("button"),
  floating: () => showWebsite("floating"),
  dana: danaLands,
  // C2: Marcus is a no-show already. The move itself is what "+1 hour" shows on the two 10:45 bookings.
  marcus: async () => {
    await deskScreen("today");
    openBooking(bookingId(SAMPLE_PICKS.marcus));
  },
  noor: async () => {
    await deskScreen("today");
    openBooking(bookingId(SAMPLE_PICKS.clash));
  },
  drag: dragRefused,
  show: () => deskScreen("calendar", { calendarDay: SAMPLE_PICKS.clashDay, calendarMode: "day" }),
  rafa: async () => {
    world().connectCalendar(SAMPLE_PICKS.rafa, "google");
    await deskScreen("team");
    await reload(demo().desk);
  },
  marco: async () => {
    world().connectCalendar(SAMPLE_PICKS.marco, "google");
    await deskScreen("team");
    await reload(demo().desk);
  },
  theo: offerTheo,
};

export const SHORTCUT_IDS = Object.keys(SHORTCUTS);

export async function runShortcut(id: string): Promise<void> {
  await SHORTCUTS[id]?.();
}

// ── the clock ───────────────────────────────────────────────────────────────

/** A clock step: the world moved, and every page drawn again from what is true now. */
export async function moveClock(step: string): Promise<void> {
  const w = world();
  if (step === "hour") w.advanceHour();
  else if (step === "morning") w.advanceMorning();
  else return;
  useDemo.setState((s) => ({ page: s.page + 1 }));
  if (useDemo.getState().persona === "desk") await reload(demo().desk);
}

/**
 * "Back to Tuesday morning": a fresh Lumen in the same page, the sample as it
 * was added, the clock at 10:40, nobody signed in, on the first screen of
 * whoever is using it.
 */
export async function resetWorld(): Promise<void> {
  const fresh = renewDemo();
  useDesk.setState({ ...DESK_START, theme: useDesk.getState().theme, toasts: [] }, true);
  window.history.replaceState(null, "", `${BASE}/`);
  useDemo.setState((s) => ({ page: s.page + 1 }));
  if (useDemo.getState().persona === "desk") {
    await reload(fresh.desk);
    deskGo("today");
  }
}
