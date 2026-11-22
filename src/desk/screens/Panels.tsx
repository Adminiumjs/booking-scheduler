/**
 * K3 the booking and K5 the client (comp L2 472–565): a side panel on a wide
 * screen, an overlay on a tablet, a bottom sheet on a phone.
 *
 * A row shows what the person's role reads. A specialist's booking has no price,
 * e-mail or payment columns at all, so those lines are absent, not greyed.
 */
import { CalendarClock, CalendarPlus, CalendarX, Clock, Gift, Hourglass, Layers, Lock, MailCheck, MailX, Receipt, Repeat, Shuffle, TriangleAlert, Undo2, UserX, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useData, useEnv, useRun } from "../env.tsx";
import { byId, clientFacts, endOf, firstName, initials, kindOf, letGoAt, movesOf, payLine, reviewsOfClient, startOf } from "../facts.ts";
import { useFmt } from "../format.ts";
import { useDeskT, type DeskKey } from "../i18n/index.ts";
import { closePanel, newBooking, openBooking, openClient, openSheet, useDesk } from "../store.ts";
import { addDays, dayIn, minuteOfDay } from "../time.ts";
import { Chip, Fig, Switch } from "../ui.tsx";
import { num, same, text, type Id, type Row } from "../wire.ts";
import { StateChip } from "./parts.tsx";

/** The frame both panels share: a landmark beside the page when wide, a dialog otherwise. */
function PanelFrame({ titleId, wide, children }: { titleId: string; wide: boolean; children: ReactNode }) {
  const box = useRef<HTMLElement>(null);
  const [inline, setInline] = useState(() => typeof window.matchMedia === "function" && window.matchMedia("(min-width: 1100px)").matches);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const list = window.matchMedia("(min-width: 1100px)");
    const on = () => setInline(list.matches);
    on();
    list.addEventListener("change", on);
    return () => list.removeEventListener("change", on);
  }, []);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    box.current?.querySelector<HTMLElement>("button")?.focus();
    return () => before?.focus?.();
  }, [titleId]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && useDesk.getState().overlay === null) closePanel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return (
    <>
      {!inline && <div className="lm-panel-scrim" onClick={closePanel} aria-hidden="true" />}
      <aside ref={box} role={inline ? "complementary" : "dialog"} aria-modal={inline ? undefined : true} aria-labelledby={titleId} className={`lm-panel${wide ? " lm-panel--wide" : ""}`}>
        <span className="lm-grab" aria-hidden="true" />
        {children}
      </aside>
    </>
  );
}

const MAIL_WORDS: Record<string, DeskKey> = {
  booked: "mail.booked",
  confirmation: "mail.booked",
  deposit_link: "mail.depositLink",
  deposit_receipt: "mail.depositReceipt",
  receipt: "mail.depositReceipt",
  reminder: "mail.reminder",
  moved: "mail.moved",
  cancelled: "mail.cancelled",
  let_go: "mail.letGo",
  lapsed: "mail.letGo",
  offer: "mail.offer",
  review_request: "mail.reviewRequest",
  review_reminder: "mail.reviewReminder",
};

function MailRows({ booking }: { booking: Row }) {
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const rows = data.messages.filter((m) => same(m["booking_id"], booking.id));
  if (rows.length === 0) return <p className="lm-muted-sm">{t("booking.noMail")}</p>;
  return (
    <>
      {rows.map((message) => {
        const kind = String(message["kind"]);
        const status = String(message["status"]);
        const word = MAIL_WORDS[kind];
        const icon = status === "failed" ? <MailX size={15} aria-hidden="true" /> : status === "queued" ? <Clock size={15} aria-hidden="true" /> : <MailCheck size={15} aria-hidden="true" />;
        const when = message["sent_at"] ?? message["due_at"] ?? message["created_at"];
        const label = word === undefined ? kind.replace(/_/g, " ") : t(word);
        return (
          <div key={String(message.id)} className="lm-mail-row">
            {icon}
            <span>{status === "queued" ? t("mail.queued", { what: label }) : status === "failed" ? t("mail.failed", { what: label }) : label}</span>
            <Fig>{fmt.dayTime(when)}</Fig>
          </div>
        );
      })}
    </>
  );
}

function NoteField({ id, value, onSave, label, hint }: { id: string; value: string; onSave: (next: string) => void; label: string; hint: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <section className="lm-field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} rows={3} maxLength={500} value={draft} aria-describedby={`${id}-hint`} onChange={(e) => setDraft(e.target.value)} onBlur={() => draft !== value && onSave(draft)} />
      <span id={`${id}-hint`} className="lm-hint">
        <Lock size={12} aria-hidden="true" />
        {hint}
      </span>
    </section>
  );
}

export function BookingPanel({ id }: { id: Id }) {
  const { door } = useEnv();
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const { busy, run } = useRun();
  const [weeks, setWeeks] = useState(4);
  const booking = byId(data.bookings, id);
  if (booking === undefined) return null;
  const { zone } = door.facts();
  const now = door.now();
  const who = door.who();
  const mayRefund = door.payments()?.refund === true;
  const kind = kindOf(booking, now, zone);
  const moves = movesOf(booking, who, now, zone, mayRefund);
  const service = byId(data.services, booking["service_id"]);
  const person = byId(data.team, booking["team_id"]);
  const customer = byId(data.customers, booking["customer_id"]);
  const name = text(booking["name"]) ?? text(customer?.["name"]) ?? t("common.noName");
  const facts = booking["customer_id"] === null || booking["customer_id"] === undefined ? null : clientFacts(data.bookings, booking["customer_id"] as Id);
  const buffer = num(booking["buffer_min"]) ?? 0;
  const seesMoney = "price" in booking;
  const clash = (data.clashes ?? []).find((c) => !c.kept && same(c.row, booking.id));
  const provider = person === undefined ? undefined : data.calendars[String(person.id)]?.accounts[0]?.providerName;
  const asksNoReviews = customer !== undefined && customer["review_requests"] === false;
  const unproved = "proved_by" in booking && booking["proved_by"] === null && booking["channel"] !== "desk";
  const hold = letGoAt(booking);
  const line = payLine(booking);

  const payWords = (): string => {
    switch (line.kind) {
      case "studio":
        return t("pay.atStudio");
      case "paying":
        return t("pay.paying", { amt: fmt.money(line.amount) });
      case "paid": {
        // How it was paid, from the booking's own payment row: "Online · Stripe", "Cash".
        const taken = data.payments.find((p) => same(p["booking_id"], booking.id) && p["kind"] === "taken");
        const method = String(taken?.["method"] ?? "online");
        const word = t(method === "cash" ? "pay.cash" : method === "card" ? "pay.card" : method === "gift_card" ? "pay.giftCard" : "pay.online");
        const provider = method === "online" ? text(taken?.["provider"]) : null;
        const how = provider === null ? word : `${word} · ${provider}`;
        return t(booking["pay_mode"] === "deposit" ? "pay.paidDeposit" : "pay.paidFull", { amt: fmt.money(line.amount), how });
      }
      case "kept":
        return t(booking["pay_mode"] === "deposit" ? "pay.kept" : "pay.keptFull", { amt: fmt.money(line.amount) });
      case "refunded":
        return t("pay.refunded", { amt: fmt.money(line.amount) });
      case "nothing":
        return t("pay.nothing");
    }
  };

  const mark = (to: "arrived" | "done" | "no_show" | "booked") =>
    run(async (d) => {
      await d.moveBooking(booking, to);
      return t("toast.marked", { name, state: t(to === "arrived" ? "state.arrived" : to === "done" ? "state.done" : to === "no_show" ? "state.noShow" : "state.booked") });
    });
  const moveIt = () => newBooking({ moving: booking.id, service: booking["service_id"] as Id, person: booking["team_id"] as Id | null, day: dayIn(startOf(booking), zone), customer: booking["customer_id"] as Id | null });
  const again = () => {
    const minute = minuteOfDay(startOf(booking), zone);
    newBooking({
      service: booking["service_id"] as Id,
      person: booking["team_id"] as Id | null,
      customer: booking["customer_id"] as Id | null,
      day: addDays(dayIn(startOf(booking), zone), weeks * 7),
      clock: `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`,
    });
  };
  const marks: { key: string; label: string; go: () => void }[] = [];
  if (moves.arrived) marks.push({ key: "arrived", label: t("move.arrived"), go: () => void mark("arrived") });
  if (moves.done) marks.push({ key: "done", label: t("move.done"), go: () => void mark("done") });
  if (moves.noShow) marks.push({ key: "no_show", label: t("move.noShow"), go: () => void mark("no_show") });
  const hasMoves = marks.length > 0 || moves.undo !== null || moves.move || moves.cancel || moves.letGo || moves.bookAgain || moves.refund;

  return (
    <PanelFrame titleId="lm-panel-title" wide={false}>
      <div className="lm-panel-head">
        <span className="lm-panel-titles">
          <span id="lm-panel-title">{text(service?.["name"])}</span>
          <Fig>{text(booking["code"]) ?? ""}</Fig>
        </span>
        <StateChip kind={kind} t={t} />
        <button type="button" className="lm-icon-btn" aria-label={t("common.close")} onClick={closePanel}>
          <X size={17} aria-hidden="true" />
        </button>
      </div>
      <div className="lm-panel-body">
        {clash !== undefined && (
          <div role="note" className="lm-note is-warn">
            <span className="lm-note-line">
              <TriangleAlert size={16} aria-hidden="true" />
              <span>{t("clash.note", { who: firstName(person?.["name"]), src: provider ?? t("calendar.theirCalendar"), range: fmt.range(clash.block?.start ?? clash.overlapStart, clash.block?.end ?? clash.overlapEnd) })}</span>
            </span>
            {who.can("bookings", "create") && (
              <div className="lm-row-gap">
                {moves.move && (
                  <button type="button" className="lm-btn lm-btn--ink" onClick={moveIt}>
                    {t("clash.moveIt")}
                  </button>
                )}
                <button
                  type="button"
                  className="lm-btn"
                  disabled={busy}
                  onClick={() =>
                    void run(async (d) => {
                      await d.keepClash(clash);
                      return t("toast.kept", { cust: name });
                    })
                  }
                >
                  {t("clash.keepIt")}
                </button>
              </div>
            )}
          </div>
        )}
        {booking["state"] === "paying" && hold !== null && (
          <div role="note" className="lm-note is-warn">
            <span className="lm-note-line">
              <Hourglass size={16} aria-hidden="true" />
              <span>{seesMoney ? t("booking.heldUntil", { time: fmt.dayTime(hold), amt: fmt.money(booking["pay_due"] ?? booking["asked"]) }) : t("booking.heldUntilPlain", { time: fmt.dayTime(hold) })}</span>
            </span>
          </div>
        )}
        <section className="lm-panel-who">
          <span className="lm-avatar lm-avatar--plain" aria-hidden="true">
            {initials(name)}
          </span>
          <div>
            {customer !== undefined ? (
              <button type="button" className="lm-link-strong" onClick={() => openClient(customer.id)}>
                {name}
              </button>
            ) : (
              <strong>{name}</strong>
            )}
            {text(booking["email"]) !== null && <span className="lm-muted-sm lm-break">{text(booking["email"])}</span>}
            {facts !== null && <span className="lm-muted-sm">{facts.visits > 0 ? t("booking.visits", { day: fmt.day(facts.last) }, facts.visits) : t("booking.firstVisit")}</span>}
            {asksNoReviews && (
              <Chip>
                <MailX size={12} aria-hidden="true" /> {t("booking.noReviews")}
              </Chip>
            )}
            {unproved && (
              <Chip tone="warn">
                <UserX size={12} aria-hidden="true" /> {t("booking.unproved")}
              </Chip>
            )}
          </div>
        </section>
        <dl className="lm-facts">
          <dt>{t("booking.service")}</dt>
          <dd className="is-strong">{text(service?.["name"])}</dd>
          <dt>{t("booking.with")}</dt>
          <dd className="is-strong">{text(person?.["name"]) ?? t("booking.anyone")}</dd>
          <dt>{t("booking.when")}</dt>
          <dd>
            <Fig>{`${fmt.day(booking["starts_at"])} · ${fmt.range(startOf(booking), endOf(booking))}`}</Fig>
            {buffer > 0 && <small>{t("booking.cleanup", {}, buffer)}</small>}
          </dd>
          {seesMoney && (
            <>
              <dt>{t("booking.price")}</dt>
              <dd>
                <Fig strong>{fmt.money(booking["net_price"] ?? booking["price"])}</Fig>
              </dd>
              <dt>{t("booking.payment")}</dt>
              <dd className="is-strong">{payWords()}</dd>
            </>
          )}
        </dl>
        {booking["picked_by_anyone"] === true && (
          <Chip tone="info">
            <Shuffle size={13} aria-hidden="true" /> {t("booking.pickedAnyone")}
          </Chip>
        )}
        {hasMoves && (
          <section aria-label={t("booking.moves")} className="lm-moves">
            <h3>{t("booking.moves")}</h3>
            {marks.length > 0 && (
              <div className="lm-moves-marks">
                {marks.map((m) => (
                  <button key={m.key} type="button" className="lm-btn" disabled={busy} onClick={m.go}>
                    {m.label}
                  </button>
                ))}
              </div>
            )}
            {moves.undo !== null && (
              <button type="button" className="lm-btn" disabled={busy} onClick={() => void mark(moves.undo as "arrived" | "booked")}>
                <Undo2 size={14} aria-hidden="true" />
                {t(moves.undo === "arrived" ? "move.undoToArrived" : "move.undoToBooked")}
              </button>
            )}
            {(moves.move || moves.cancel || moves.letGo) && (
              <div className="lm-row-gap">
                {moves.move && (
                  <button type="button" className="lm-btn lm-grow" onClick={moveIt}>
                    <CalendarClock size={14} aria-hidden="true" />
                    {t("move.move")}
                  </button>
                )}
                {moves.cancel && (
                  <button type="button" className="lm-btn lm-btn--danger-text lm-grow" onClick={() => openSheet({ kind: "cancel", bookingId: booking.id })}>
                    <CalendarX size={14} aria-hidden="true" />
                    {t("move.cancel")}
                  </button>
                )}
                {moves.letGo && (
                  <button type="button" className="lm-btn lm-btn--danger-text lm-grow" onClick={() => openSheet({ kind: "letGo", bookingId: booking.id })}>
                    <CalendarX size={14} aria-hidden="true" />
                    {t("move.letGo")}
                  </button>
                )}
              </div>
            )}
            {moves.bookAgain && (
              <div className="lm-row-gap">
                <button type="button" className="lm-btn lm-grow" onClick={again}>
                  <Repeat size={14} aria-hidden="true" />
                  {t("move.againIn", {}, weeks)}
                </button>
                <select aria-label={t("move.weeks")} className="lm-select-mono" value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
                  {[2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {moves.refund && (
              <button type="button" className="lm-btn" onClick={() => openSheet({ kind: "refund", bookingId: booking.id })}>
                <Receipt size={14} aria-hidden="true" />
                {t("move.refund")}
              </button>
            )}
          </section>
        )}
        {who.can("messages", "read") && (
          <section className="lm-mails">
            <h3>{t("booking.emails")}</h3>
            <MailRows booking={booking} />
          </section>
        )}
        {who.can("bookings", "create") && (
          <NoteField
            id="lm-booking-note"
            value={text(booking["staff_note"]) ?? ""}
            label={t("booking.note")}
            hint={t("booking.noteHint")}
            onSave={(next) =>
              void run(async (d) => {
                await d.saveBooking(booking, { staff_note: next === "" ? null : next });
              })
            }
          />
        )}
      </div>
    </PanelFrame>
  );
}

export function ClientPanel({ id }: { id: Id }) {
  const { door } = useEnv();
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const { busy, run } = useRun();
  const customer = byId(data.customers, id);
  if (customer === undefined) return null;
  const { zone } = door.facts();
  const now = door.now();
  const who = door.who();
  const writes = who.can("customers", "update");
  const mine = data.bookings.filter((b) => same(b["customer_id"], id)).sort((a, b) => startOf(b) - startOf(a));
  const done = mine.filter((b) => b["state"] === "done").length;
  const reviews = reviewsOfClient(data, id);
  const asks = customer["review_requests"] !== false;
  const seesRequests = "review_requests" in customer;
  const offers = data.offers?.[String(id)] ?? [];
  return (
    <PanelFrame titleId="lm-client-title" wide>
      <div className="lm-panel-head">
        <span className="lm-avatar lm-avatar--plain" aria-hidden="true">
          {initials(customer["name"])}
        </span>
        <span className="lm-panel-titles">
          <span id="lm-client-title">{text(customer["name"]) ?? t("common.noName")}</span>
          {text(customer["email"]) !== null && <span className="lm-muted-sm lm-break">{text(customer["email"])}</span>}
        </span>
        <button type="button" className="lm-icon-btn" aria-label={t("common.close")} onClick={closePanel}>
          <X size={17} aria-hidden="true" />
        </button>
      </div>
      <div className="lm-panel-body">
        {seesRequests && (
          <div className="lm-switch-row">
            <span>
              <strong id="lm-client-req">{asks ? t("client.requestsOn") : t("client.requestsOff")}</strong>
              <small>{t("client.requestsHint")}</small>
            </span>
            {writes && (
              <Switch
                on={asks}
                labelledBy="lm-client-req"
                disabled={busy}
                onChange={(next) =>
                  void run(async (d) => {
                    await d.saveCustomer(customer, { review_requests: next });
                  })
                }
              />
            )}
          </div>
        )}
        <section className="lm-mails">
          <h3>{t("client.visits", {}, done)}</h3>
          {mine.map((b) => {
            const person = byId(data.team, b["team_id"]);
            return (
              <button key={String(b.id)} type="button" className="lm-visit" onClick={() => openBooking(b.id)}>
                <Fig>{fmt.day(b["starts_at"])}</Fig>
                <span>
                  {text(byId(data.services, b["service_id"])?.["name"])} · {firstName(person?.["name"])}
                </span>
                <StateChip kind={kindOf(b, now, zone)} t={t} />
              </button>
            );
          })}
        </section>
        {writes ? (
          <NoteField
            id="lm-client-note"
            value={text(customer["staff_note"]) ?? ""}
            label={t("client.notes")}
            hint={t("client.notesHint")}
            onSave={(next) =>
              void run(async (d) => {
                await d.saveCustomer(customer, { staff_note: next === "" ? null : next });
              })
            }
          />
        ) : (
          // A specialist reads the note on their own client, and does not write it (§7).
          text(customer["staff_note"]) !== null && (
            <section className="lm-mails">
              <h3>{t("client.notes")}</h3>
              <p className="lm-note">{text(customer["staff_note"])}</p>
            </section>
          )
        )}
        {data.reviews !== null && (
          <section className="lm-mails">
            <h3>{t("client.reviews")}</h3>
            {reviews.length === 0 && <p className="lm-muted-sm">{t("client.noReviews")}</p>}
            {reviews.map((review) => (
              <div key={String(review.id)} className="lm-client-review">
                <small>
                  {t("client.reviewHead", { service: text(review["about_name"]) ?? "", day: fmt.day(review["submitted_at"]) }, num(review["stars"]) ?? 0)}
                </small>
                <span>{text(review["body"])}</span>
              </div>
            ))}
          </section>
        )}
        {data.offers !== null && (
          <section className="lm-offers">
            <h3>
              {t("client.offers")} <small>{t("client.offersAddOn")}</small>
            </h3>
            {offers.length === 0 && <p className="lm-muted-sm">{t("client.noOffers")}</p>}
            {offers.map((offer) => (
              <div key={offer.key} className="lm-offer">
                {offer.kind === "pack" ? <Layers size={15} aria-hidden="true" /> : <Gift size={15} aria-hidden="true" />}
                <span>
                  <strong>{offer.title}</strong>
                  <small>{offer.sub}</small>
                </span>
                <Fig>{offer.figure}</Fig>
              </div>
            ))}
          </section>
        )}
        {who.can("bookings", "create") && (
          <button type="button" className="lm-btn" onClick={() => newBooking({ customer: customer.id })}>
            <CalendarPlus size={14} aria-hidden="true" />
            {t("nav.newBooking")}
          </button>
        )}
      </div>
    </PanelFrame>
  );
}
