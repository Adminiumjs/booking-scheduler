/**
 * The customer pages' door into the demo's Adminium: the same answers the real
 * door (`customer/door.ts`) gets from the public API, read from and written to
 * the world in the page. A refusal comes back as the same `PublicApiError`, so
 * the pages word it as they word a real one.
 *
 * Paying leaves the page for the hosted pay page in a real build. Here the "pay
 * page" is a mark in the address (`PAY_MARK`): `boot.tsx` sees it and takes the
 * visitor to the app's own way back, and no card field is ever drawn.
 *
 * DEMO BUILD ONLY: nothing in a real build imports it.
 */
import { newClientKey, PublicApiError, type ForgetMeResult, type VerifyCodeResult } from "@adminiumjs/public-client";

import type { Booked, BookingValues, CustomerDoor, Held, ReviewLink, ReviewPage, Row, Served, StudioRows } from "../customer/door.ts";
import { usesLeft, type DoorName } from "../customer/rules.ts";
import { same, type Id } from "../desk/wire.ts";
import { DEMO_LOCALES } from "../demo-types.ts";
import { googleNote } from "./card.ts";
import { DemoRefusal, type LumenWorld } from "./world.ts";

/** The address a "pay page" is: a mark in the fragment, so nothing leaves the page. */
export const PAY_MARK = "#lumen-pay";

const copy = <T>(value: T): T => structuredClone(value);
const n = (value: unknown): number => (value === null || value === undefined || value === "" ? 0 : Number(value));

async function run<T>(work: () => T): Promise<T> {
  await Promise.resolve();
  try {
    return work();
  } catch (error) {
    if (error instanceof DemoRefusal) throw new PublicApiError(error.code as never, error.status, error.message, undefined, error.params);
    throw error;
  }
}

/**
 * The Google reviews add-on's own page, as the demo has it: the same small
 * protocol, and one drawn line, because the demo never loads Google. It rides
 * in the door's base address so the real box frames it unchanged.
 */
function googleFrame(): string {
  const words = Object.fromEntries(DEMO_LOCALES.map((locale) => [locale, googleNote(locale)]));
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;font:600 13.5px/1.5 system-ui,sans-serif;color:#4a4a54;padding:14px 16px;border-radius:14px;background:#fff}
body.dark{color:#b7b7c3;background:#1b1b22}
</style></head><body><div id="m"></div><script>
var W=${JSON.stringify(words).replace(/</g, "\\u003c")},C="adminium-google-reviews";
function H(){parent.postMessage({channel:C,event:"height",px:Math.max(document.body.offsetHeight,document.documentElement.scrollHeight,64)},"*");}
parent.postMessage({channel:C,event:"ready"},"*");addEventListener("resize",H);
addEventListener("message",function(e){var d=e.data;if(!d||d.channel!==C||d.event!=="show")return;
document.getElementById("m").textContent=W[d.language]||W["en-US"];document.body.className=d.dark?"dark":"";document.documentElement.dir=String(d.language).startsWith("ar")?"rtl":"ltr";H();setTimeout(H,0);});
</script></body></html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}#`;
}

export class DemoGuest implements CustomerDoor {
  readonly served: Served;
  private readonly world: LumenWorld;
  private email: string | null = null;
  private linkId: unknown = null;
  private saleId: unknown = null;
  private provedAt: number | null = null;
  /** The visit whose Pay was pressed last, for the way back from the pay step. */
  paying: unknown = null;

  constructor(world: LumenWorld) {
    this.world = world;
    this.served = { baseUrl: googleFrame(), publishableKey: "lumen-studio" };
  }

  addOn(key: string): boolean {
    return this.world.addOns.has(key);
  }

  newKey(): string {
    return newClientKey();
  }

  // ── the studio ────────────────────────────────────────────────────────────

  /** The studio's rows at this moment: what a page's first read answers. */
  rows(): StudioRows {
    const w = this.world;
    const live = (table: string) => copy(w.all(table).filter((r) => r["active"] !== false));
    return {
      settings: copy(w.settings()),
      categories: copy(w.all("categories")),
      services: live("services"),
      team: live("team"),
      teamServices: copy(w.all("team_services")),
      hours: copy(w.all("opening_hours")),
      closures: copy(w.all("closures")),
      giftAmounts: live("gift_amounts"),
      packs: live("pack_products"),
      paymentsOnline: true,
      timezone: w.zone,
      currency: w.currency,
      now: new Date(w.now),
    };
  }

  async studio(): Promise<StudioRows> {
    return this.rows();
  }

  days: CustomerDoor["days"] = (kind, who, from, days, exclude) => run(() => this.world.strip(kind, who, from, days, { guest: true, exclude }));

  times: CustomerDoor["times"] = (kind, who, date, exclude) =>
    run(() => this.world.slots(kind, who, date, { guest: true, exclude }).map((s) => ({ time: s.time, state: s.state })));

  // ── making a booking ──────────────────────────────────────────────────────

  async book(door: DoorName, values: BookingValues, clientKey: string, children?: { codes?: string[]; card?: string | null }): Promise<Booked> {
    return run(() => {
      const held = (code: string | null | undefined) => (typeof code === "string" && code.startsWith("held:") ? code.slice(5) : null);
      const row = this.world.makeVisit({
        service: values.service_id as string,
        person: (values.team_id ?? null) as string | null,
        startsAt: values.starts_at,
        name: values.name,
        email: values.email,
        phone: values.phone ?? null,
        note: values.note ?? null,
        language: values.language,
        channel: values.channel,
        door,
        proved: this.signedIn(),
        customerId: (this.customer()?.["id"] ?? null) as Id | null,
        pack: held(children?.codes?.[0]),
        card: held(children?.card),
        key: clientKey,
        ...(values.no_review === undefined ? {} : { noReview: values.no_review }),
        ...(values.texts === true ? { texts: true } : {}),
      });
      this.linkId = row.id;
      return { row: this.show(row), token: this.linkToken(row.id), payUrl: null, replayed: false };
    });
  }

  holdsLink(): boolean {
    return this.linkId !== null;
  }

  holdsSale(): boolean {
    return this.saleId !== null;
  }

  linkToken(id: unknown): string {
    return `lumen-link-${String(id)}`;
  }

  /** What the public door answers of a booking: none of the studio's own note. */
  private show(row: Row): Row {
    const { staff_note: _note, ...open } = row;
    return copy(open) as Row;
  }

  async packCovers(_door: DoorName, values: BookingValues, packId: unknown): Promise<boolean> {
    const pack = this.world.get("vouchers", packId);
    return pack !== undefined && same(pack["service_id"], values.service_id) && n(pack["uses_left"]) > 0;
  }

  nothingDue(id: unknown): Promise<Row> {
    return run(() => this.show(this.world.moveVisit(id, "paying", "booked")));
  }

  // ── signing in ────────────────────────────────────────────────────────────

  private customer(): Row | undefined {
    return this.email === null ? undefined : this.world.customerByEmail(this.email);
  }

  /** Ask for the sign-in code. The demo has no post office: the code is kept for the card's "Fill the code". */
  requestSignIn(email: string, _lang: string): Promise<{ sentTo: string }> {
    return run(() => {
      const wanted = email.trim().toLowerCase();
      const code = String(100000 + ((this.world.codes.size + 1) * 271_828) % 900_000);
      this.world.codes.set(wanted, code);
      const [name = "", host = ""] = email.trim().split("@");
      return { sentTo: `${name.slice(0, 1)}•••@${host.slice(0, 1)}•••${host.slice(host.lastIndexOf("."))}` };
    });
  }

  /** The code the demo "e-mailed" to an address, for the card to type. */
  codeFor(email: string): string | null {
    return this.world.codes.get(email.trim().toLowerCase()) ?? null;
  }

  verifySignIn(email: string, code: string): Promise<VerifyCodeResult> {
    return run((): VerifyCodeResult => {
      const wanted = email.trim().toLowerCase();
      if (this.world.codes.get(wanted) !== code.trim()) return { ok: false, triesLeft: 4 };
      this.signInAs(wanted);
      return { ok: true, level: "verified", expiresAt: this.world.now + 3_600_000, ended: false, email: wanted };
    });
  }

  /** Signed in with that address, as a proved code leaves it. */
  signInAs(email: string): void {
    const wanted = email.trim().toLowerCase();
    if (this.world.customerByEmail(wanted) === undefined) this.world.insert("customers", { name: wanted.split("@")[0] ?? wanted, email: wanted, phone: null, language: "en-US", review_requests: true, staff_note: null, forgotten_at: null, created_at: this.world.nowIso() });
    this.email = wanted;
    this.provedAt = this.world.now;
  }

  async openSignInLink(): Promise<boolean> {
    return false;
  }

  mayForget(): boolean {
    return this.provedAt !== null;
  }

  signedIn(): boolean {
    return this.email !== null;
  }

  async signOut(): Promise<void> {
    this.email = null;
    this.linkId = null;
    this.saleId = null;
    this.provedAt = null;
  }

  async me(): Promise<Row | null> {
    const row = this.customer();
    return row === undefined ? null : copy(row);
  }

  setAskReviews(id: unknown, on: boolean): Promise<void> {
    return run(() => {
      this.world.update("customers", id, { review_requests: on });
      this.world.changed();
    });
  }

  // ── what the signed-in person holds ───────────────────────────────────────

  myBookings(): Promise<Row[]> {
    return run(() => {
      const email = this.email;
      if (email === null) return [];
      return this.world.all("bookings").filter((b) => String(b["email"] ?? "").toLowerCase() === email && b["state"] !== "lapsed").map((b) => this.show(b));
    });
  }

  myWaitlist(): Promise<Row[]> {
    return run(() => copy(this.world.all("waitlist").filter((w) => String(w["email"] ?? "").toLowerCase() === this.email)));
  }

  leaveList(id: unknown): Promise<void> {
    return run(() => {
      this.world.update("waitlist", id, { state: "closed" });
      this.world.changed();
    });
  }

  held(): Promise<Held> {
    return run(() => {
      const email = this.email;
      return {
        packs: copy(this.world.all("vouchers").filter((v) => String(v["holder_email"] ?? "").toLowerCase() === email)),
        cards: copy(this.world.all("gift_cards").filter((c) => String(c["recipient_email"] ?? "").toLowerCase() === email)),
      };
    });
  }

  forgetMe(ahead: readonly Row[]): Promise<ForgetMeResult> {
    return run(() => {
      // As the real door answers: the packs that still hold a visit keep their holder until they end.
      const today = this.world.nowIso().slice(0, 10);
      const keptBalances = this.world.all("vouchers").filter((v) => {
        const ends = String(v["expires_on"] ?? "").slice(0, 10);
        return String(v["holder_email"] ?? "").toLowerCase() === this.email && usesLeft({ uses_left: v["uses_left"], uses_total: v["uses_total"] }) > 0 && (ends === "" || ends >= today);
      }).length;
      for (const row of ahead) {
        if (row["state"] === "booked") this.world.moveVisit(row["id"], "booked", "cancelled", { cancelled_by: "customer" });
        if (row["state"] === "offered") this.world.moveVisit(row["id"], "offered", "lapsed", { lapsed_by: "guest" });
      }
      for (const entry of this.world.all("waitlist")) if (String(entry["email"] ?? "").toLowerCase() === this.email && entry["state"] === "waiting") entry["state"] = "closed";
      const me = this.customer();
      if (me !== undefined) Object.assign(me, { name: null, email: null, phone: null, forgotten_at: this.world.nowIso() });
      this.email = null;
      this.provedAt = null;
      this.world.changed();
      return { keptBalances, giftsNotLinked: true };
    });
  }

  // ── changing a booking ────────────────────────────────────────────────────

  cancelBooking(id: unknown): Promise<Row> {
    return run(() => this.show(this.world.moveVisit(id, "booked", "cancelled", { cancelled_by: "customer" })));
  }

  moveBooking(id: unknown, startsAt: string, team: unknown): Promise<Row> {
    return run(() => this.show(this.world.moveTime(id, startsAt, (team ?? null) as string | null, true)));
  }

  /** The moment Pay is pressed: the usual minutes start (MON-5), and the visitor goes to the pay step. */
  startPaying(id: unknown): Promise<string> {
    return run(() => {
      this.world.startPaying(id);
      this.linkId ??= id;
      this.paying = id;
      return PAY_MARK;
    });
  }

  payState(id: unknown): Promise<{ state: "none" | "open" | "confirming" | "paid" | "failed" | "expired" }> {
    return run(() => {
      const row = this.world.booking(id);
      if (row["state"] === "booked") return { state: "paid" as const };
      if (row["state"] === "lapsed") return { state: "expired" as const };
      return { state: this.world.payStates.get(String(id)) ?? "open" };
    });
  }

  pressedGoogle(id: unknown): Promise<void> {
    return run(() => {
      this.world.update("bookings", id, { google_pressed: true, google_pressed_at: this.world.nowIso() });
      this.world.changed();
    });
  }

  takeOffer(id: unknown, paying: boolean): Promise<Row> {
    return run(() => {
      const row = this.world.moveVisit(id, "offered", paying ? "paying" : "booked");
      if (paying) this.world.payStates.set(String(row.id), "open");
      return this.show(row);
    });
  }

  // ── reviews ───────────────────────────────────────────────────────────────

  private published(): Row[] {
    return this.world
      .all("reviews")
      .filter((r) => r["state"] === "published")
      .sort((a, b) => String(b["submitted_at"]).localeCompare(String(a["submitted_at"])) || Number(b.id) - Number(a.id));
  }

  reviews(limit: number, offset = 0): Promise<ReviewPage | null> {
    return run(() => {
      if (this.world.settings()["reviews_on"] === false) return null;
      const all = this.published();
      const count = all.length;
      const sum = all.reduce((s, r) => s + n(r["stars"]), 0);
      const list = all.slice(offset, offset + limit).map((r) => {
        const { hide_reason: _why, ...shown } = r;
        return copy(shown) as Row;
      });
      const seen = offset + list.length;
      return { count, average: count === 0 ? 0 : sum / count, bars: [5, 4, 3, 2, 1].map((star) => all.filter((r) => n(r["stars"]) === star).length), list, next: seen < count && list.length > 0 ? seen : null };
    });
  }

  /** A place to show: what makes the real box offer "See our Google reviews", which then draws the demo's note. */
  async googlePlace(): Promise<Row | null> {
    return { id: "lumen-place", place_id: "lumen-studio", browser_key: "not-a-key" } as Row;
  }

  private reviewOpen(row: Row): boolean {
    return (row["state"] === "arrived" || row["state"] === "done") && Date.parse(String(row["link_expires"])) > this.world.now;
  }

  private shownName(row: Row): string {
    const parts = String(row["name"] ?? "").split(" ").filter((p) => p !== "");
    return parts.length < 2 ? (parts[0] ?? "") : `${parts[0]!} ${parts[parts.length - 1]![0]!}.`;
  }

  reviewToken(id: unknown): string {
    return `lumen-review-${String(id)}`;
  }

  private byReviewToken(token: string): Row {
    const row = this.world.get("bookings", token.replace("lumen-review-", ""));
    if (row === undefined) throw new DemoRefusal(404, "PUBLIC_REF_NOT_FOUND", "No such link.");
    return row;
  }

  readReviewLink(token: string): Promise<ReviewLink> {
    return run(() => {
      const row = this.byReviewToken(token);
      return {
        open: this.reviewOpen(row),
        reviewedAt: (row["reviewed_at"] as string | null) ?? null,
        shownName: this.shownName(row),
        about: String(this.world.get("services", row["service_id"])?.["name"] ?? ""),
        detail: (this.world.get("team", row["team_id"])?.["name"] as string | undefined) ?? null,
      };
    });
  }

  private writeReview(row: Row, stars: number, body: string): void {
    if (row["reviewed_at"] !== null) throw new DemoRefusal(409, "PUBLIC_WRITE_REFUSED", "Already reviewed.");
    const person = this.world.get("team", row["team_id"]);
    this.world.insert("reviews", {
      app: "bookings",
      subject_table: "bookings",
      subject_key: String(row.id),
      about_table: "services",
      about_key: String(row["service_id"]),
      about_name: String(this.world.get("services", row["service_id"])?.["name"] ?? ""),
      about_detail: person?.["name"] ?? null,
      stars,
      title: null,
      body: body.trim() === "" ? null : body.trim(),
      shown_name: this.shownName(row),
      state: "waiting",
      hide_reason: null,
      reply: null,
      replied_at: null,
      submitted_at: this.world.nowIso(),
    });
    row["reviewed_at"] = this.world.nowIso();
    this.world.changed();
  }

  sendReviewLink(token: string, stars: number, body: string): Promise<unknown> {
    return run(() => this.writeReview(this.byReviewToken(token), stars, body));
  }

  reviewState(id: unknown): Promise<{ open: boolean; reviewedAt: string | null; shownName: string } | null> {
    return run(() => {
      const row = this.world.booking(id);
      return { open: this.reviewOpen(row), reviewedAt: (row["reviewed_at"] as string | null) ?? null, shownName: this.shownName(row) };
    });
  }

  sendReview(id: unknown, _signedIn: boolean, stars: number, body: string): Promise<void> {
    return run(() => this.writeReview(this.world.booking(id), stars, body));
  }

  // ── gift cards and packs ──────────────────────────────────────────────────

  buyCard(line: Row, buyer: Row, clientKey: string): Promise<{ row: Row; payUrl: string | null }> {
    return run(() => {
      const row = this.world.makeSale("card", line, buyer, clientKey);
      this.saleId = row.id;
      return { row: copy(row), payUrl: null };
    });
  }

  buyPack(packId: string, buyer: Row, clientKey: string): Promise<{ row: Row; payUrl: string | null }> {
    return run(() => {
      const row = this.world.makeSale("pack", { pack_id: packId }, buyer, clientKey);
      this.saleId = row.id;
      return { row: copy(row), payUrl: null };
    });
  }

  payPurchase(id: unknown): Promise<string> {
    return run(() => {
      this.saleId = id;
      return PAY_MARK;
    });
  }

  /** The sale the visitor is paying, for the way back. */
  saleInHand(): unknown {
    return this.saleId;
  }

  purchaseState(id: string): Promise<string | null> {
    return run(() => {
      const row = this.world.get("purchases", id);
      if (row === undefined) return null;
      return row["state"] === "paid" ? "paid" : (this.world.saleStates.get(id) ?? "open");
    });
  }

  // ── the waiting list ──────────────────────────────────────────────────────

  joinList(values: { service_id: unknown; team_id: unknown; day: string; name: string; email: string; language: string }): Promise<void> {
    return run(() => {
      const wanted = values.email.trim().toLowerCase();
      if (this.world.all("waitlist").some((w) => String(w["email"] ?? "").toLowerCase() === wanted && w["day"] === values.day && same(w["service_id"], values.service_id) && w["state"] === "waiting")) throw new DemoRefusal(409, "PUBLIC_LIMIT_REACHED", "Already on the list.");
      const customer = this.world.customerByEmail(wanted);
      this.world.insert("waitlist", { customer_id: customer?.id ?? null, name: values.name, email: values.email.trim(), language: values.language, service_id: values.service_id, team_id: values.team_id ?? null, day: values.day, state: "waiting", created_at: this.world.nowIso() });
      this.world.changed();
    });
  }

  // ── one booking, by its own link ──────────────────────────────────────────

  async openLink(token: string): Promise<"opened" | "unknown" | "closed"> {
    const row = this.world.get("bookings", token.replace("lumen-link-", ""));
    if (row === undefined) return "unknown";
    this.linkId = row.id;
    return "opened";
  }

  /** A visit held by its link, as its e-mail would open it. */
  holdLink(id: unknown): void {
    this.linkId = id;
  }

  linkBooking(): Promise<Row | null> {
    return run(() => {
      if (this.linkId === null) return null;
      const row = this.world.get("bookings", this.linkId);
      return row === undefined ? null : this.show(row);
    });
  }

  linkCalendar(id: unknown): Promise<{ ics: string; google: string; outlook: string } | null> {
    return run(() => {
      const row = this.world.booking(id);
      const stamp = (at: number) => new Date(at).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
      const start = Date.parse(String(row["starts_at"]));
      const end = start + n(row["minutes"]) * 60_000;
      const name = String(this.world.get("services", row["service_id"])?.["name"] ?? "");
      const studio = String(this.world.settings()["studio_name"] ?? "");
      const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Lumen Studio//Bookings//EN", "BEGIN:VEVENT", `UID:${String(row["code"])}@lumenstudio.example`, `DTSTAMP:${stamp(this.world.now)}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${name}, ${studio}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      // `boot.tsx` keeps every outside link in the page, so these two open nothing.
      return { ics, google: "https://calendar.google.com/calendar/render", outlook: "https://outlook.live.com/calendar/" };
    });
  }
}
