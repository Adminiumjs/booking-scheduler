/**
 * The desk's sheets (comp L2 577–727), one frame with its kinds: New booking
 * and Move, Cancel, "Let the time go", Refund in two steps, the waiting-list
 * offer, a person's calendar, a connect link, time off, the service editor,
 * hiding a review, a closure, and the phone's More.
 */
import { CalendarCheck, Info, Link2, Undo2, X } from "lucide-react";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";

import { useData, useEnv, useRun } from "../env.tsx";
import type { DayCount, Slot } from "../door.ts";
import { byId, firstName, personDay } from "../facts.ts";
import { useFmt } from "../format.ts";
import { useDeskT, type DeskKey } from "../i18n/index.ts";
import { DESK_NAV } from "../nav.ts";
import { closeSheet, go, useDesk, type BookingDraft, type Overlay, type View } from "../store.ts";
import { addDays, dayIn, instantOf, minuteOfDay } from "../time.ts";
import { FieldError, Fig, Sheet, Switch } from "../ui.tsx";
import { num, same, text, type Id } from "../wire.ts";

const key = () => crypto.randomUUID().replace(/-/g, "");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Frame({ title, wide = false, alert = false, children, foot }: { title: string; wide?: boolean; alert?: boolean; children: ReactNode; foot: ReactNode }) {
  const t = useDeskT();
  const id = useId();
  return (
    <Sheet labelledBy={id} wide={wide} alert={alert}>
      <span className="lm-grab" aria-hidden="true" />
      <div className="lm-sheet-head">
        <h2 id={id}>{title}</h2>
        <button type="button" className="lm-icon-btn" aria-label={t("common.close")} onClick={closeSheet}>
          <X size={17} aria-hidden="true" />
        </button>
      </div>
      <div className="lm-sheet-body">{children}</div>
      <div className="lm-sheet-foot">{foot}</div>
    </Sheet>
  );
}

// ── New booking, and Move ───────────────────────────────────────────────────

function BookSheet({ draft }: { draft: BookingDraft }) {
  const { door } = useEnv();
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const { busy, run } = useRun();
  const { zone } = door.facts();
  const now = door.now();
  const today = dayIn(now, zone);
  const moving = draft.moving === null ? undefined : byId(data.bookings, draft.moving);
  const [service, setService] = useState<Id | null>(draft.service);
  const [person, setPerson] = useState<Id | null>(draft.person);
  const [day, setDay] = useState(draft.day ?? today);
  const [clock, setClock] = useState<string | null>(draft.clock);
  const [customer, setCustomer] = useState<Id | null>(draft.customer);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [add, setAdd] = useState({ name: "", email: "", phone: "" });
  const [depositLink, setDepositLink] = useState(false);
  const [walkIn, setWalkIn] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [strip, setStrip] = useState<DayCount[]>([]);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [retryKey] = useState(key);

  const row = byId(data.services, service);
  const stripFrom = day > addDays(today, 6) ? addDays(day, -3) : today;
  const exclude = moving?.id ?? null;
  useEffect(() => {
    if (service === null) return;
    let live = true;
    void door.days({ service, person, from: stripFrom, days: 10, exclude }).then((got) => live && setStrip(got), () => live && setStrip([]));
    return () => {
      live = false;
    };
  }, [door, service, person, stripFrom, exclude]);
  useEffect(() => {
    if (service === null) return;
    let live = true;
    setSlots(null);
    void door.slots({ service, person, day, exclude }).then((got) => live && setSlots(got.filter((s) => s.state === "free")), () => live && setSlots([]));
    return () => {
      live = false;
    };
  }, [door, service, person, day, exclude]);

  const people = data.team.filter((p) => p["active"] !== false && data.teamServices.some((l) => same(l["team_id"], p.id) && same(l["service_id"], service)));
  const chosen = byId(data.customers, customer);
  const q = query.trim().toLowerCase();
  const matches = q.length < 2 ? [] : data.customers.filter((c) => (text(c["name"]) ?? "").toLowerCase().includes(q) || (text(c["email"]) ?? "").toLowerCase().includes(q)).slice(0, 5);
  const groups: { label: DeskKey; from: number; to: number }[] = [
    { label: "book.morning", from: 0, to: 720 },
    { label: "book.afternoon", from: 720, to: 1020 },
    { label: "book.evening", from: 1020, to: 1440 },
  ];
  const minuteOf = (c: string) => Number(c.slice(0, 2)) * 60 + Number(c.slice(3, 5));
  const picked = slots?.find((s) => s.time === clock);
  const pickedPerson = person === null && picked?.resource !== undefined ? byId(data.team, picked.resource) : undefined;
  const grid = num(data.settings?.["grid_min"]) ?? 15;
  const nowMinute = minuteOfDay(now, zone);
  const nextQuarter = Math.ceil((nowMinute + 1) / grid) * grid;
  const walkClock = `${String(Math.floor(nowMinute / grid) * grid / 60 | 0).padStart(2, "0")}:${String((Math.floor(nowMinute / grid) * grid) % 60).padStart(2, "0")}`;
  const noticeHours = Math.round((num(data.settings?.["notice_min"]) ?? 120) / 60);
  const start = clock === null ? null : instantOf(day, clock, zone);

  // A link is offered only for a service that takes money online, while payments answer, and not within 4 hours of the visit (cQ30).
  const asks = row !== undefined && row["online"] !== "none" && data.settings?.["online_payments"] === "on" && door.payments()?.online === true;
  const farEnough = start !== null && start - now >= 4 * 3_600_000;
  const amount = row?.["online"] === "full" ? row["price"] : row?.["deposit"];
  const whoFirst = firstName(chosen?.["name"] ?? add.name) || t("book.theClient");
  const holdHours = num(data.settings?.["link_hold_hours"]) ?? 24;

  const submit = () => {
    const bad: Record<string, boolean> = {};
    if (service === null) bad["service"] = true;
    if (clock === null && !walkIn) bad["time"] = true;
    if (moving === undefined) {
      if (adding) {
        if (add.name.trim() === "") bad["name"] = true;
        if (!EMAIL.test(add.email.trim())) bad["email"] = true;
      } else if (customer === null) bad["customer"] = true;
    }
    setErrors(bad);
    if (Object.keys(bad).length > 0) {
      useDesk.setState({ said: t("book.missing") });
      return;
    }
    const at = new Date(instantOf(day, walkIn ? walkClock : clock!, zone)).toISOString();
    void run(async (d) => {
      if (moving !== undefined) {
        await d.saveBooking(moving, { starts_at: at, team_id: person });
        closeSheet();
        const name = text(moving["name"]) ?? t("common.noName");
        useDesk.setState({ notice: { tone: "pos", text: t("toast.moved", { name, service: text(row?.["name"]) ?? "", time: fmt.time(at) }) } });
        return t("toast.movedShort", { name });
      }
      let who = chosen;
      if (adding) {
        const email = add.email.trim().toLowerCase();
        who = data.customers.find((c) => (text(c["email"]) ?? "").toLowerCase() === email) ?? (await d.createCustomer({ name: add.name.trim(), email, phone: add.phone.trim() === "" ? null : add.phone.trim() }));
      }
      const made = await d.createBooking({
        service: service!,
        person,
        startsAt: at,
        customer: { id: who!.id, name: text(who!["name"]) ?? "", email: text(who!["email"]), phone: text(who!["phone"]) },
        depositLink: depositLink && asks && farEnough,
        key: retryKey,
      });
      closeSheet();
      const maker = byId(data.team, made["team_id"]);
      return t("toast.booked", { code: text(made["code"]) ?? "", name: text(who!["name"]) ?? "", when: `${fmt.day(at)}, ${fmt.time(at)}`, who: firstName(maker?.["name"]) });
    });
  };

  const stripWord = (d: DayCount): string => {
    if (d.state === "closed") {
      if (person === null) return t("book.closed");
      const state = personDay(data, person, d.date);
      return state.off === "closed" ? t("book.closed") : t("book.off");
    }
    return d.open > 0 ? t("book.open", {}, d.open) : t("book.full");
  };

  return (
    <Frame
      wide
      title={moving !== undefined ? t("book.moveTitle", { code: text(moving["code"]) ?? "" }) : t("book.title")}
      foot={
        <>
          <button type="button" className="lm-btn lm-btn--big" onClick={closeSheet}>
            {t("common.cancel")}
          </button>
          <button type="button" className="lm-btn lm-btn--primary lm-btn--big" disabled={busy} onClick={submit}>
            {moving !== undefined ? t("book.moveHere") : t("book.book")}
          </button>
        </>
      }
    >
      <div className="lm-field">
        <label htmlFor="lm-nb-service">{t("book.service")}</label>
        {moving !== undefined ? (
          <div className="lm-locked">{text(row?.["name"])}</div>
        ) : (
          <select
            id="lm-nb-service"
            value={service === null ? "" : String(service)}
            aria-invalid={errors["service"] === true}
            aria-describedby={errors["service"] ? "lm-nb-service-err" : undefined}
            onChange={(e) => {
              setService(e.target.value === "" ? null : e.target.value);
              setPerson(draft.person !== null && data.teamServices.some((l) => same(l["team_id"], draft.person) && same(l["service_id"], e.target.value)) ? draft.person : null);
              setClock(draft.clock);
              setDepositLink(false);
              setErrors({});
            }}
          >
            <option value="">{t("book.chooseService")}</option>
            {data.services
              .filter((s) => s["active"] !== false)
              .map((s) => (
                <option key={String(s.id)} value={String(s.id)}>
                  {`${text(s["name"]) ?? ""} · ${t("common.minutes", {}, num(s["minutes"]) ?? 0)}${"price" in s ? ` · ${fmt.money(s["price"])}` : ""}`}
                </option>
              ))}
          </select>
        )}
        {errors["service"] && <FieldError id="lm-nb-service-err">{t("book.errService")}</FieldError>}
      </div>

      {row !== undefined && (
        <>
          <div className="lm-field">
            <span className="lm-label">{t("book.person")}</span>
            <div role="radiogroup" aria-label={t("book.person")} className="lm-chip-row">
              {[{ id: null as Id | null, label: t("booking.anyone") }, ...people.map((p) => ({ id: p.id as Id | null, label: text(p["name"]) ?? "" }))].map((x) => {
                const on = x.id === null ? person === null : same(person, x.id);
                return (
                  <button
                    key={String(x.id)}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className={`lm-chip${on ? " is-on" : ""}`}
                    onClick={() => {
                      setPerson(x.id);
                      setClock(null);
                    }}
                  >
                    {x.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lm-field">
            <span className="lm-label">{t("book.day")}</span>
            <div role="group" aria-label={t("book.day")} className="lm-chips-scroll">
              {strip.map((d) => {
                const off = d.state === "closed";
                const on = d.date === day;
                const [weekday, number] = fmt.day(d.date).split(" ");
                return (
                  <button
                    key={d.date}
                    type="button"
                    aria-pressed={on}
                    aria-label={`${fmt.day(d.date)}, ${stripWord(d)}`}
                    disabled={off}
                    className={`lm-day-chip${on ? " is-on" : ""}${off ? " is-off" : ""}`}
                    onClick={() => {
                      setDay(d.date);
                      setClock(null);
                      setWalkIn(false);
                    }}
                  >
                    <small>{weekday}</small>
                    <Fig strong>{number}</Fig>
                    <small>{stripWord(d)}</small>
                  </button>
                );
              })}
            </div>
            <span className="lm-hint">{day === today ? t("book.ruleToday", { time: fmt.time(instantOf(day, `${String(Math.floor(nextQuarter / 60)).padStart(2, "0")}:${String(nextQuarter % 60).padStart(2, "0")}`, zone)) }, noticeHours) : t("book.rule")}</span>
          </div>

          <div className="lm-field">
            <span className="lm-sr-only">{t("book.time")}</span>
            {slots === null && <span className="lm-muted-sm">{t("common.loading")}</span>}
            {slots !== null && slots.length === 0 && <span className="lm-muted-sm">{t("book.noTimes")}</span>}
            {slots !== null &&
              groups.map((g) => {
                const items = slots.filter((s) => minuteOf(s.time) >= g.from && minuteOf(s.time) < g.to);
                if (items.length === 0) return null;
                return (
                  <div key={g.label} className="lm-slot-group">
                    <small>{t(g.label)}</small>
                    <div className="lm-slots">
                      {items.map((s) => (
                        <button
                          key={s.time}
                          type="button"
                          aria-pressed={clock === s.time && !walkIn}
                          className={`lm-slot${clock === s.time && !walkIn ? " is-on" : ""}`}
                          onClick={() => {
                            setClock(s.time);
                            setWalkIn(false);
                            setErrors((e) => ({ ...e, time: false }));
                          }}
                        >
                          {fmt.time(instantOf(day, s.time, zone))}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            {day === today && moving === undefined && (
              <button
                type="button"
                aria-pressed={walkIn}
                className={`lm-btn lm-self-start${walkIn ? " lm-btn--primary" : ""}`}
                onClick={() => {
                  setWalkIn(!walkIn);
                  setClock(null);
                  setErrors((e) => ({ ...e, time: false }));
                }}
              >
                {t("book.walkIn", { time: fmt.time(instantOf(day, walkClock, zone)) })}
              </button>
            )}
            {errors["time"] && <FieldError id="lm-nb-time-err">{t("book.errTime")}</FieldError>}
            {pickedPerson !== undefined && <span className="lm-hint">{t("book.anyonePick", { who: text(pickedPerson["name"]) ?? "" })}</span>}
          </div>
        </>
      )}

      {moving !== undefined ? (
        <div className="lm-field">
          <span className="lm-label">{t("book.client")}</span>
          <div className="lm-locked">{text(moving["name"])}</div>
        </div>
      ) : (
        <div className="lm-field">
          <label htmlFor="lm-nb-client">{t("book.client")}</label>
          {chosen !== undefined && !adding ? (
            <div className="lm-picked">
              <span>
                <strong>{text(chosen["name"])}</strong>
                <small>{text(chosen["email"])}</small>
              </span>
              <button
                type="button"
                className="lm-btn"
                onClick={() => {
                  setCustomer(null);
                  setQuery("");
                }}
              >
                {t("book.change")}
              </button>
            </div>
          ) : adding ? (
            <div className="lm-add">
              <label>
                {t("book.name")}
                <input value={add.name} aria-invalid={errors["name"] === true} aria-describedby={errors["name"] ? "lm-nb-name-err" : undefined} onChange={(e) => setAdd({ ...add, name: e.target.value })} />
              </label>
              {errors["name"] && <FieldError id="lm-nb-name-err">{t("book.errName")}</FieldError>}
              <label>
                {t("book.email")}
                <input type="email" value={add.email} aria-invalid={errors["email"] === true} aria-describedby={errors["email"] ? "lm-nb-email-err" : undefined} onChange={(e) => setAdd({ ...add, email: e.target.value })} />
              </label>
              {errors["email"] && <FieldError id="lm-nb-email-err">{t("book.errEmail")}</FieldError>}
              <label>
                {t("book.phone")}
                <input type="tel" value={add.phone} aria-describedby="lm-nb-phone-hint" onChange={(e) => setAdd({ ...add, phone: e.target.value })} />
              </label>
              <span id="lm-nb-phone-hint" className="lm-hint">
                {t("book.phoneHint")}
              </span>
              <button type="button" className="lm-link" onClick={() => setAdding(false)}>
                {t("book.findInstead")}
              </button>
            </div>
          ) : (
            <>
              <input id="lm-nb-client" value={query} placeholder={t("book.find")} aria-invalid={errors["customer"] === true} aria-describedby={errors["customer"] ? "lm-nb-client-err" : undefined} onChange={(e) => setQuery(e.target.value)} />
              {errors["customer"] && <FieldError id="lm-nb-client-err">{t("book.errClient")}</FieldError>}
              {matches.map((c) => (
                <button
                  key={String(c.id)}
                  type="button"
                  className="lm-match"
                  onClick={() => {
                    setCustomer(c.id);
                    setQuery("");
                    setErrors((e) => ({ ...e, customer: false }));
                  }}
                >
                  <strong>{text(c["name"])}</strong>
                  <small>{text(c["email"])}</small>
                </button>
              ))}
              <button type="button" className="lm-link" onClick={() => setAdding(true)}>
                {t("book.addNew")}
              </button>
            </>
          )}
        </div>
      )}

      {moving === undefined && row !== undefined &&
        (asks && farEnough ? (
          <label className="lm-check">
            <input type="checkbox" checked={depositLink} onChange={(e) => setDepositLink(e.target.checked)} />
            <span>
              <strong>{t("book.depositLink")}</strong>
              <small>{t("book.depositSub", { who: whoFirst, amt: fmt.money(amount) }, holdHours)}</small>
            </span>
          </label>
        ) : asks && start !== null ? (
          <span className="lm-hint">{t("book.tooSoonForLink")}</span>
        ) : (
          <span className="lm-hint">{t("pay.atStudioLine")}</span>
        ))}
    </Frame>
  );
}

// ── Cancel, and let the time go ─────────────────────────────────────────────

function CancelSheet({ bookingId }: { bookingId: Id }) {
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const { busy, run } = useRun();
  const [why, setWhy] = useState("");
  const [err, setErr] = useState(false);
  const booking = byId(data.bookings, bookingId);
  if (booking === undefined) return null;
  const name = text(booking["name"]) ?? t("common.noName");
  const paid = (num(booking["paid"]) ?? 0) > 0;
  const go1 = () => {
    if (why.trim() === "") {
      setErr(true);
      return;
    }
    void run(async (d) => {
      await d.moveBooking(booking, "cancelled", { cancelled_by: "studio", cancel_reason: why.trim() });
      closeSheet();
      return paid ? t("toast.cancelledRefund", { name, amt: fmt.money(booking["paid"]) }) : t("toast.cancelled", { name });
    });
  };
  return (
    <Frame
      alert
      title={t("cancel.title")}
      foot={
        <>
          <button type="button" className="lm-btn lm-btn--big" onClick={closeSheet}>
            {t("cancel.keep")}
          </button>
          <button type="button" className="lm-btn lm-btn--danger lm-btn--big" disabled={busy} onClick={go1}>
            {t("cancel.go")}
          </button>
        </>
      }
    >
      <p>{t("cancel.lead", { name, service: text(byId(data.services, booking["service_id"])?.["name"]) ?? "", day: fmt.day(booking["starts_at"]), time: fmt.time(booking["starts_at"]), who: firstName(byId(data.team, booking["team_id"])?.["name"]) })}</p>
      <div className="lm-field">
        <label htmlFor="lm-cancel-why">{t("cancel.reason")}</label>
        <textarea id="lm-cancel-why" rows={3} maxLength={200} value={why} aria-invalid={err} aria-describedby="lm-cancel-hint" onChange={(e) => { setWhy(e.target.value); setErr(false); }} />
        <span id="lm-cancel-hint" className={err ? "lm-err" : "lm-hint"}>{err ? t("cancel.errReason", { name }) : t("cancel.hint", { name })}</span>
      </div>
      <p className="lm-sheet-line">
        {paid ? <Undo2 size={15} aria-hidden="true" /> : <Info size={15} aria-hidden="true" />}
        {paid ? t("cancel.refunded", { amt: fmt.money(booking["paid"]) }) : t("cancel.noDeposit")}
      </p>
    </Frame>
  );
}

function LetGoSheet({ bookingId }: { bookingId: Id }) {
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const { busy, run } = useRun();
  const booking = byId(data.bookings, bookingId);
  if (booking === undefined) return null;
  const name = text(booking["name"]) ?? t("common.noName");
  return (
    <Frame
      alert
      title={t("letGo.title")}
      foot={
        <>
          <button type="button" className="lm-btn lm-btn--big" onClick={closeSheet}>
            {t("letGo.keep")}
          </button>
          <button
            type="button"
            className="lm-btn lm-btn--danger lm-btn--big"
            disabled={busy}
            onClick={() =>
              void run(async (d) => {
                await d.moveBooking(booking, "lapsed", { lapsed_by: "desk" });
                closeSheet();
                return t("toast.letGo", { name });
              })
            }
          >
            {t("letGo.go")}
          </button>
        </>
      }
    >
      <p>{t("letGo.lead", { name, service: text(byId(data.services, booking["service_id"])?.["name"]) ?? "", day: fmt.day(booking["starts_at"]), time: fmt.time(booking["starts_at"]) })}</p>
      <p className="lm-sheet-line">
        <Info size={15} aria-hidden="true" />
        {t("letGo.nothingTaken")}
      </p>
    </Frame>
  );
}

// ── Refund, in two steps ────────────────────────────────────────────────────

const REFUND_WHY: { word: DeskKey; reason: string }[] = [
  { word: "refund.whyStudio", reason: "other" },
  { word: "refund.whyGoodwill", reason: "requested_by_customer" },
  { word: "refund.whyMistake", reason: "duplicate" },
  { word: "refund.whyOther", reason: "other" },
];

function RefundSheet({ bookingId }: { bookingId: Id }) {
  const { door } = useEnv();
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const { busy, run } = useRun();
  const booking = byId(data.bookings, bookingId);
  const [panel, setPanel] = useState<Awaited<ReturnType<typeof door.panel>> | undefined>(undefined);
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [why, setWhy] = useState<number | null>(null);
  const [errs, setErrs] = useState<{ amount?: boolean; why?: boolean }>({});
  const [retryKey] = useState(key);
  useEffect(() => {
    if (booking === undefined) return;
    let live = true;
    void door.panel(booking).then((got) => {
      if (!live) return;
      setPanel(got);
      const first = got?.payments.find((p) => p.attemptId !== null && Number(p.refundable) > 0);
      if (first !== undefined) setAmount(first.refundable);
    }, () => live && setPanel(null));
    return () => {
      live = false;
    };
  }, [door, booking]);
  if (booking === undefined) return null;
  const payment = panel?.payments.find((p) => p.attemptId !== null && Number(p.refundable) > 0);
  const name = text(booking["name"]) ?? t("common.noName");
  const max = Number(payment?.refundable ?? 0);
  const provider = payment?.provider ?? t("refund.theService");
  const next = () => {
    const n = Number(amount);
    const bad = { amount: !(n > 0 && n <= max), why: why === null };
    setErrs(bad);
    if (!bad.amount && !bad.why) setStep(2);
  };
  const send = () =>
    void run(async (d) => {
      await d.refund({ attemptId: payment!.attemptId!, amount, reason: REFUND_WHY[why!]!.reason, note: t(REFUND_WHY[why!]!.word), key: retryKey });
      closeSheet();
      return t("toast.refunded", { amt: fmt.money(amount), name });
    });
  return (
    <Frame
      alert={step === 2}
      title={t("refund.title")}
      foot={
        step === 1 ? (
          <>
            <button type="button" className="lm-btn lm-btn--big" onClick={closeSheet}>
              {t("common.cancel")}
            </button>
            <button type="button" className="lm-btn lm-btn--primary lm-btn--big" disabled={payment === undefined} onClick={next}>
              {t("refund.continue")}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="lm-btn lm-btn--big" onClick={() => setStep(1)}>
              {t("common.back")}
            </button>
            <button type="button" className="lm-btn lm-btn--danger lm-btn--big" disabled={busy} onClick={send}>
              {t("refund.go", { amt: fmt.money(amount) })}
            </button>
          </>
        )
      }
    >
      {panel === undefined && <p className="lm-muted-sm">{t("common.loading")}</p>}
      {panel !== undefined && payment === undefined && <p>{panel?.payments[0]?.refundRefusal ?? t("refund.nothing")}</p>}
      {payment !== undefined && step === 1 && (
        <>
          <p>{t("refund.lead", { name, amt: fmt.money(payment.amount), provider })}</p>
          <div className="lm-field">
            <label htmlFor="lm-refund-amount">{t("refund.amount")}</label>
            <input id="lm-refund-amount" inputMode="decimal" className="lm-input-mono" value={amount} aria-invalid={errs.amount === true} aria-describedby={errs.amount ? "lm-refund-amount-err" : undefined} onChange={(e) => { setAmount(e.target.value.replace(/[^0-9.]/g, "")); setErrs({}); }} />
            {errs.amount && <FieldError id="lm-refund-amount-err">{t("refund.errAmount", { max: fmt.money(max) })}</FieldError>}
          </div>
          <div className="lm-field">
            <label htmlFor="lm-refund-why">{t("refund.reason")}</label>
            <select id="lm-refund-why" value={why ?? ""} aria-invalid={errs.why === true} aria-describedby={errs.why ? "lm-refund-why-err" : undefined} onChange={(e) => { setWhy(e.target.value === "" ? null : Number(e.target.value)); setErrs({}); }}>
              <option value="">{t("refund.chooseReason")}</option>
              {REFUND_WHY.map((r, i) => (
                <option key={r.word} value={i}>
                  {t(r.word)}
                </option>
              ))}
            </select>
            {errs.why && <FieldError id="lm-refund-why-err">{t("refund.errReason")}</FieldError>}
          </div>
        </>
      )}
      {payment !== undefined && step === 2 && <p className="lm-strong">{t("refund.sentence", { amt: fmt.money(amount), name, provider })}</p>}
    </Frame>
  );
}

// ── The waiting list's offer ────────────────────────────────────────────────

function OfferSheet({ overlay }: { overlay: Extract<Overlay, { kind: "offer" }> }) {
  const { door } = useEnv();
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const { busy, run } = useRun();
  const [retryKey] = useState(key);
  const entry = byId(data.waitlist, overlay.entryId);
  if (entry === undefined) return null;
  const { zone } = door.facts();
  const at = instantOf(overlay.day, overlay.clock, zone);
  const name = text(entry["name"]) ?? t("common.noName");
  const person = byId(data.team, overlay.person);
  const service = text(byId(data.services, entry["service_id"])?.["name"]) ?? "";
  const studio = text(data.settings?.["studio_name"]) ?? "";
  return (
    <Frame
      title={t("offer.title")}
      foot={
        <>
          <button type="button" className="lm-btn lm-btn--big" onClick={closeSheet}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="lm-btn lm-btn--primary lm-btn--big"
            disabled={busy}
            onClick={() =>
              void run(async (d) => {
                await d.offerTime({ entry, person: overlay.person, startsAt: new Date(at).toISOString(), key: retryKey });
                closeSheet();
                return t("toast.offered", { name });
              })
            }
          >
            {t("offer.send")}
          </button>
        </>
      }
    >
      <p>{t("offer.lead", { name })}</p>
      <div className="lm-mail-preview" aria-label={t("offer.preview")}>
        <dl>
          <dt>{t("offer.to")}</dt>
          <dd>{text(entry["email"])}</dd>
          <dt>{t("offer.subject")}</dt>
          <dd>{t("offer.subjectLine", { studio })}</dd>
        </dl>
        <p>{t("offer.hi", { name: firstName(name) })}</p>
        <p>{t("offer.body", { service, day: fmt.day(overlay.day), time: fmt.time(at), who: firstName(person?.["name"]) })}</p>
        <span className="lm-mail-cta" aria-hidden="true">{t("offer.cta")}</span>
        <small>{t("offer.leave")}</small>
      </div>
    </Frame>
  );
}

// ── A person's calendar ─────────────────────────────────────────────────────

function CalendarSheet({ teamId }: { teamId: Id }) {
  const data = useData();
  const t = useDeskT();
  const { busy, run } = useRun();
  const person = byId(data.team, teamId);
  const calendar = data.calendars[String(teamId)];
  const sync = calendar?.sync ?? null;
  const [read, setRead] = useState<string[] | null>(sync?.readCalendars ?? null);
  const [allDay, setAllDay] = useState(sync?.countAllDay ?? false);
  const [detail, setDetail] = useState<"first-name+initial" | "none">(sync?.detail ?? "first-name+initial");
  if (person === undefined || sync === null) return null;
  const who = firstName(person["name"]);
  const lists = sync.traits?.listsCalendars === true && sync.calendars !== null;
  const ticked = (id: string, primary: boolean) => (read === null ? primary : read.includes(id));
  const toggle = (id: string, primary: boolean) => {
    const base = read ?? (sync.calendars ?? []).filter((c) => c.primary).map((c) => c.id);
    setRead(ticked(id, primary) ? base.filter((x) => x !== id) : [...base, id]);
  };
  const service = text(data.services[0]?.["name"]) ?? "";
  return (
    <Frame
      title={t("calset.title", { who })}
      foot={
        <>
          <button type="button" className="lm-btn lm-btn--big" onClick={closeSheet}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="lm-btn lm-btn--primary lm-btn--big"
            disabled={busy || (read !== null && read.length === 0)}
            onClick={() =>
              void run(async (d) => {
                await d.saveCalendarChoices(teamId, { ...(lists ? { readCalendars: read } : {}), ...(sync.traits?.allDayKnown === true ? { countAllDay: allDay } : {}), detail });
                closeSheet();
                return t("toast.calendarSaved", { who });
              })
            }
          >
            {t("common.save")}
          </button>
        </>
      }
    >
      {lists && (
        <fieldset className="lm-fieldset">
          <legend>{t("calset.which", { who })}</legend>
          {(sync.calendars ?? []).map((c) => (
            <label key={c.id} className="lm-check">
              <input type="checkbox" checked={ticked(c.id, c.primary)} onChange={() => toggle(c.id, c.primary)} />
              <span>
                <strong>{c.name}</strong>
                {c.primary && <small>{t("calset.main")}</small>}
              </span>
            </label>
          ))}
        </fieldset>
      )}
      {sync.traits?.allDayKnown === true && (
        <div className="lm-switch-row">
          <strong id="lm-calset-allday">{t("calset.allDay")}</strong>
          <Switch on={allDay} labelledBy="lm-calset-allday" onChange={setAllDay} />
        </div>
      )}
      <fieldset className="lm-fieldset">
        <legend>{t("calset.says", { who })}</legend>
        {(["first-name+initial", "none"] as const).map((value) => (
          <label key={value} className="lm-check">
            <input type="radio" name={`lm-says-${String(teamId)}`} checked={detail === value} onChange={() => setDetail(value)} />
            <span>{value === "none" ? t("calset.serviceOnly") : t("calset.withName", { studio: text(data.settings?.["studio_name"]) ?? "", service })}</span>
          </label>
        ))}
      </fieldset>
    </Frame>
  );
}

function DisconnectSheet({ overlay }: { overlay: Extract<Overlay, { kind: "disconnect" }> }) {
  const data = useData();
  const t = useDeskT();
  const { busy, run } = useRun();
  const who = firstName(byId(data.team, overlay.teamId)?.["name"]);
  const studio = text(data.settings?.["studio_name"]) ?? "";
  return (
    <Frame
      alert
      title={t("disc.title", { who, provider: overlay.provider })}
      foot={
        <>
          <button type="button" className="lm-btn lm-btn--big" onClick={closeSheet}>
            {t("disc.keep")}
          </button>
          <button
            type="button"
            className="lm-btn lm-btn--danger lm-btn--big"
            disabled={busy}
            onClick={() =>
              void run(async (d) => {
                await d.disconnectCalendar(overlay.teamId, overlay.addOn);
                closeSheet();
                return t("toast.disconnected", { who, provider: overlay.provider });
              })
            }
          >
            {t("disc.go")}
          </button>
        </>
      }
    >
      <p>{t("disc.lead", { studio, who, provider: overlay.provider })}</p>
    </Frame>
  );
}

/** "Send a connect link": to the address on the row. Only someone who may update the row is also offered a copy (cQ12). */
function LinkSheet({ teamId }: { teamId: Id }) {
  const data = useData();
  const t = useDeskT();
  const { busy, run } = useRun();
  const person = byId(data.team, teamId);
  const calendar = data.calendars[String(teamId)];
  if (person === undefined || calendar === undefined) return null;
  const who = firstName(person["name"]);
  const address = text(person["email"]);
  return (
    <Frame
      title={t("link.title", { who })}
      foot={
        <>
          <button type="button" className="lm-btn lm-btn--big" onClick={closeSheet}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="lm-btn lm-btn--primary lm-btn--big"
            disabled={busy}
            onClick={() =>
              void run(async (d) => {
                const sentTo = await d.sendConnectLink(teamId);
                closeSheet();
                return t("toast.linkSent", { email: sentTo ?? who });
              })
            }
          >
            {t("link.send")}
          </button>
        </>
      }
    >
      <p>{address !== null ? t("link.leadTo", { who, address }) : t("link.lead", { who })}</p>
      {calendar.may.copyLink && (
        <button
          type="button"
          className="lm-btn lm-self-start"
          disabled={busy}
          onClick={() =>
            void run(async (d) => {
              const url = await d.copyConnectLink(teamId);
              await navigator.clipboard.writeText(url);
              return t("toast.linkCopied");
            })
          }
        >
          <Link2 size={14} aria-hidden="true" />
          {t("link.copy")}
        </button>
      )}
    </Frame>
  );
}

function TimeOffSheet({ teamId }: { teamId: Id }) {
  const { door } = useEnv();
  const data = useData();
  const t = useDeskT();
  const { busy, run } = useRun();
  const { zone } = door.facts();
  const today = dayIn(door.now(), zone);
  const [day, setDay] = useState(today);
  const [from, setFrom] = useState("09:00");
  const [to, setTo] = useState("11:00");
  const [why, setWhy] = useState("");
  const [err, setErr] = useState(false);
  const who = firstName(byId(data.team, teamId)?.["name"]);
  const save = () => {
    if (to <= from || day < today) {
      setErr(true);
      return;
    }
    void run(async (d) => {
      await d.addTimeOff({ team_id: teamId, starts_at: new Date(instantOf(day, from, zone)).toISOString(), ends_at: new Date(instantOf(day, to, zone)).toISOString(), why: why.trim() === "" ? null : why.trim() });
      closeSheet();
      return t("toast.timeOff", { who });
    });
  };
  return (
    <Frame
      title={t("timeOff.title", { who })}
      foot={
        <>
          <button type="button" className="lm-btn lm-btn--big" onClick={closeSheet}>
            {t("common.cancel")}
          </button>
          <button type="button" className="lm-btn lm-btn--primary lm-btn--big" disabled={busy} onClick={save}>
            {t("common.save")}
          </button>
        </>
      }
    >
      <div className="lm-field">
        <label htmlFor="lm-off-day">{t("timeOff.day")}</label>
        <input id="lm-off-day" type="date" min={today} value={day} onChange={(e) => { setDay(e.target.value); setErr(false); }} />
      </div>
      <div className="lm-row-gap">
        <div className="lm-field lm-grow">
          <label htmlFor="lm-off-from">{t("timeOff.from")}</label>
          <input id="lm-off-from" type="time" value={from} aria-invalid={err} aria-describedby={err ? "lm-off-err" : undefined} onChange={(e) => { setFrom(e.target.value); setErr(false); }} />
        </div>
        <div className="lm-field lm-grow">
          <label htmlFor="lm-off-to">{t("timeOff.to")}</label>
          <input id="lm-off-to" type="time" value={to} aria-invalid={err} aria-describedby={err ? "lm-off-err" : undefined} onChange={(e) => { setTo(e.target.value); setErr(false); }} />
        </div>
      </div>
      {err && <FieldError id="lm-off-err">{t("timeOff.err")}</FieldError>}
      <div className="lm-field">
        <label htmlFor="lm-off-why">{t("timeOff.why")}</label>
        <input id="lm-off-why" maxLength={120} value={why} onChange={(e) => setWhy(e.target.value)} />
      </div>
    </Frame>
  );
}

// ── The service editor ──────────────────────────────────────────────────────

function ServiceSheet({ serviceId }: { serviceId: Id | null }) {
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const { busy, run } = useRun();
  const service = serviceId === null ? undefined : byId(data.services, serviceId);
  const links = useMemo(() => data.teamServices.filter((l) => same(l["service_id"], serviceId)), [data.teamServices, serviceId]);
  const [form, setForm] = useState({
    name: text(service?.["name"]) ?? "",
    category: String(service?.["category_id"] ?? data.categories[0]?.id ?? ""),
    minutes: String(num(service?.["minutes"]) ?? 60),
    buffer: String(num(service?.["buffer_min"]) ?? 0),
    price: String(num(service?.["price"]) ?? ""),
    online: String(service?.["online"] ?? "none"),
    deposit: String(num(service?.["deposit"]) ?? ""),
    bookable: service?.["bookable_online"] !== false,
    bring: text(service?.["bring"]) ?? "",
    anyone: String(service?.["anyone_pick"] ?? "even"),
  });
  const [who, setWho] = useState<string[]>(() => links.map((l) => String(l["team_id"])));
  const [errs, setErrs] = useState<Record<string, boolean>>({});
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const save = () => {
    const bad: Record<string, boolean> = {};
    if (form.name.trim() === "") bad["name"] = true;
    if (!(Number(form.minutes) >= 5 && Number(form.minutes) <= 600)) bad["minutes"] = true;
    if (!(Number(form.buffer) >= 0 && Number(form.buffer) <= 120)) bad["buffer"] = true;
    if (form.price === "" || Number(form.price) < 0) bad["price"] = true;
    if (form.online === "deposit" && !(Number(form.deposit) > 0 && Number(form.deposit) <= Number(form.price))) bad["deposit"] = true;
    setErrs(bad);
    if (Object.keys(bad).length > 0) return;
    const values = {
      name: form.name.trim(),
      category_id: form.category,
      minutes: Number(form.minutes),
      buffer_min: Number(form.buffer),
      price: form.price,
      online: form.online,
      deposit: form.online === "deposit" ? form.deposit : null,
      bookable_online: form.bookable,
      bring: form.bring.trim() === "" ? null : form.bring.trim(),
      anyone_pick: form.anyone,
    };
    void run(async (d) => {
      const row = service === undefined ? await d.createService(values) : await d.saveService(service, values);
      for (const id of who) if (!links.some((l) => String(l["team_id"]) === id)) await d.addServicePerson(row.id, id);
      for (const link of links) if (!who.includes(String(link["team_id"]))) await d.removeServicePerson(link);
      closeSheet();
      return t("toast.serviceSaved");
    });
  };
  const num2 = (id: string, label: string, value: string, patch: (v: string) => void, unit: string, err: boolean, errWord: string) => (
    <div className="lm-field lm-grow">
      <label htmlFor={id}>{label}</label>
      <span className="lm-unit">
        <input id={id} inputMode="decimal" className="lm-input-mono" value={value} aria-invalid={err} aria-describedby={err ? `${id}-err` : undefined} onChange={(e) => patch(e.target.value.replace(/[^0-9.]/g, ""))} />
        <small>{unit}</small>
      </span>
      {err && <FieldError id={`${id}-err`}>{errWord}</FieldError>}
    </div>
  );
  return (
    <Frame
      wide
      title={service === undefined ? t("service.new") : (text(service["name"]) ?? "")}
      foot={
        <>
          <button type="button" className="lm-btn lm-btn--big" onClick={closeSheet}>
            {t("common.cancel")}
          </button>
          <button type="button" className="lm-btn lm-btn--primary lm-btn--big" disabled={busy} onClick={save}>
            {t("common.save")}
          </button>
        </>
      }
    >
      <div className="lm-row-gap">
        <div className="lm-field lm-grow">
          <label htmlFor="lm-se-name">{t("service.name")}</label>
          <input id="lm-se-name" maxLength={80} value={form.name} aria-invalid={errs["name"] === true} aria-describedby={errs["name"] ? "lm-se-name-err" : undefined} onChange={(e) => set({ name: e.target.value })} />
          {errs["name"] && <FieldError id="lm-se-name-err">{t("service.errName")}</FieldError>}
        </div>
        <div className="lm-field lm-grow">
          <label htmlFor="lm-se-cat">{t("service.category")}</label>
          <select id="lm-se-cat" value={form.category} onChange={(e) => set({ category: e.target.value })}>
            {data.categories.map((c) => (
              <option key={String(c.id)} value={String(c.id)}>
                {text(c["name"])}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="lm-row-gap">
        {num2("lm-se-len", t("service.length"), form.minutes, (v) => set({ minutes: v }), t("service.min"), errs["minutes"] === true, t("service.errLength"))}
        {num2("lm-se-buf", t("service.cleanup"), form.buffer, (v) => set({ buffer: v }), t("service.min"), errs["buffer"] === true, t("service.errCleanup"))}
        {num2("lm-se-price", t("service.price"), form.price, (v) => set({ price: v }), door0(fmt), errs["price"] === true, t("service.errPrice"))}
      </div>
      <div className="lm-field">
        <span className="lm-label" id="lm-se-pay">{t("service.online")}</span>
        <div role="radiogroup" aria-labelledby="lm-se-pay" className="lm-seg lm-seg--wide">
          {(["none", "deposit", "full"] as const).map((value) => (
            <button key={value} type="button" role="radio" aria-checked={form.online === value} className={form.online === value ? "is-on" : ""} onClick={() => set({ online: value })}>
              {t(value === "none" ? "service.payStudio" : value === "deposit" ? "service.payDeposit" : "service.payFull")}
            </button>
          ))}
        </div>
      </div>
      {form.online === "deposit" && num2("lm-se-dep", t("service.depositAmount"), form.deposit, (v) => set({ deposit: v }), door0(fmt), errs["deposit"] === true, t("service.errDeposit"))}
      <div className="lm-switch-row">
        <strong id="lm-se-bookable">{t("service.bookable")}</strong>
        <Switch on={form.bookable} labelledBy="lm-se-bookable" onChange={(on) => set({ bookable: on })} />
      </div>
      <div className="lm-field">
        <label htmlFor="lm-se-bring">{t("service.bring")}</label>
        <input id="lm-se-bring" maxLength={200} value={form.bring} onChange={(e) => set({ bring: e.target.value })} />
      </div>
      <fieldset className="lm-fieldset">
        <legend>{t("service.who")}</legend>
        <div className="lm-check-grid">
          {data.team.map((p) => (
            <label key={String(p.id)} className="lm-check">
              <input type="checkbox" checked={who.includes(String(p.id))} onChange={(e) => setWho(e.target.checked ? [...who, String(p.id)] : who.filter((x) => x !== String(p.id)))} />
              <span>{text(p["name"])}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="lm-fieldset">
        <legend>{t("service.anyone")}</legend>
        {(["even", "order"] as const).map((value) => (
          <label key={value} className="lm-check">
            <input type="radio" name="lm-se-anyone" checked={form.anyone === value} onChange={() => set({ anyone: value })} />
            <span>
              <strong>{t(value === "even" ? "service.even" : "service.order")}</strong>
              <small>{t(value === "even" ? "service.evenSub" : "service.orderSub")}</small>
            </span>
          </label>
        ))}
      </fieldset>
      <p className="lm-hint">{t("service.priceNote")}</p>
    </Frame>
  );
}

/** The currency's sign, from how the studio's money is written. */
const door0 = (fmt: { money(value: unknown): string }): string => fmt.money(0).replace(/[\d\s.,]/g, "");

// ── Hide a review ───────────────────────────────────────────────────────────

/** Forms' five reasons (cT16, cQ21). There is no reason about stars. */
export const HIDE_REASONS: { value: string; word: DeskKey }[] = [
  { value: "abusive", word: "hide.abusive" },
  { value: "names-someone", word: "hide.namesSomeone" },
  { value: "not-about-us", word: "hide.notAboutUs" },
  { value: "looks-fake", word: "hide.looksFake" },
  { value: "author-asked", word: "hide.authorAsked" },
];

function HideSheet({ reviewId }: { reviewId: Id }) {
  const data = useData();
  const t = useDeskT();
  const { busy, run } = useRun();
  const [why, setWhy] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const review = data.reviews?.reviews.find((r) => same(r.id, reviewId));
  if (review === undefined) return null;
  return (
    <Frame
      title={t("hide.title")}
      foot={
        <>
          <button type="button" className="lm-btn lm-btn--big" onClick={closeSheet}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="lm-btn lm-btn--primary lm-btn--big"
            disabled={busy}
            onClick={() => {
              if (why === null) {
                setErr(true);
                document.querySelector<HTMLInputElement>('input[name="lm-hide-why"]')?.focus();
                return;
              }
              void run(async (d) => {
                await d.saveReview(review, { state: "hidden", hide_reason: why });
                closeSheet();
                return t("toast.hidden");
              });
            }}
          >
            {t("hide.go")}
          </button>
        </>
      }
    >
      <p>{t("hide.lead", { name: text(review["shown_name"]) ?? "", service: text(review["about_name"]) ?? "" })}</p>
      <fieldset className="lm-fieldset" aria-describedby={err ? "lm-hide-err" : undefined}>
        <legend>{t("hide.why")}</legend>
        {HIDE_REASONS.map((r) => (
          <label key={r.value} className={`lm-check lm-check--box${why === r.value ? " is-on" : ""}${err ? " is-bad" : ""}`}>
            <input type="radio" name="lm-hide-why" checked={why === r.value} onChange={() => { setWhy(r.value); setErr(false); }} />
            <span>{t(r.word)}</span>
          </label>
        ))}
      </fieldset>
      {err && <FieldError id="lm-hide-err">{t("hide.err")}</FieldError>}
    </Frame>
  );
}

function ClosureSheet() {
  const { door } = useEnv();
  const t = useDeskT();
  const { busy, run } = useRun();
  const today = dayIn(door.now(), door.facts().zone);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [name, setName] = useState("");
  const [err, setErr] = useState(false);
  const save = () => {
    if (name.trim() === "" || to < from) {
      setErr(true);
      return;
    }
    void run(async (d) => {
      await d.addClosure({ from_date: from, to_date: to, name: name.trim() });
      closeSheet();
      return t("toast.closure");
    });
  };
  return (
    <Frame
      title={t("closure.title")}
      foot={
        <>
          <button type="button" className="lm-btn lm-btn--big" onClick={closeSheet}>
            {t("common.cancel")}
          </button>
          <button type="button" className="lm-btn lm-btn--primary lm-btn--big" disabled={busy} onClick={save}>
            {t("common.save")}
          </button>
        </>
      }
    >
      <div className="lm-field">
        <label htmlFor="lm-cl-name">{t("closure.name")}</label>
        <input id="lm-cl-name" maxLength={80} value={name} aria-invalid={err} aria-describedby={err ? "lm-cl-err" : undefined} onChange={(e) => { setName(e.target.value); setErr(false); }} />
      </div>
      <div className="lm-row-gap">
        <div className="lm-field lm-grow">
          <label htmlFor="lm-cl-from">{t("closure.from")}</label>
          <input id="lm-cl-from" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setErr(false); }} />
        </div>
        <div className="lm-field lm-grow">
          <label htmlFor="lm-cl-to">{t("closure.to")}</label>
          <input id="lm-cl-to" type="date" min={from} value={to} onChange={(e) => { setTo(e.target.value); setErr(false); }} />
        </div>
      </div>
      {err && <FieldError id="lm-cl-err">{t("closure.err")}</FieldError>}
    </Frame>
  );
}

/** The phone's More: the sections the tab bar has no room for, and who is signed in. */
function MoreSheet({ sections }: { sections: readonly string[] }) {
  const { door } = useEnv();
  const t = useDeskT();
  const who = door.who();
  const items = DESK_NAV.filter((n) => sections.includes(n.id) && !["today", "calendar", "clients", "waiting"].includes(n.id));
  return (
    <Frame title={t("nav.more")} foot={<span className="lm-muted-sm">{who.name}</span>}>
      {items.map((n) => (
        <button key={n.id} type="button" className="lm-more-item" onClick={() => go(n.view as View)}>
          <CalendarCheck size={16} aria-hidden="true" />
          {t(n.labelKey)}
        </button>
      ))}
    </Frame>
  );
}

export function Sheets({ sections }: { sections: readonly string[] }) {
  const overlay = useDesk((s) => s.overlay);
  if (overlay === null) return null;
  switch (overlay.kind) {
    case "book":
      return <BookSheet key={JSON.stringify(overlay.draft)} draft={overlay.draft} />;
    case "cancel":
      return <CancelSheet bookingId={overlay.bookingId} />;
    case "letGo":
      return <LetGoSheet bookingId={overlay.bookingId} />;
    case "refund":
      return <RefundSheet bookingId={overlay.bookingId} />;
    case "offer":
      return <OfferSheet overlay={overlay} />;
    case "calendar":
      return <CalendarSheet teamId={overlay.teamId} />;
    case "disconnect":
      return <DisconnectSheet overlay={overlay} />;
    case "link":
      return <LinkSheet teamId={overlay.teamId} />;
    case "timeOff":
      return <TimeOffSheet teamId={overlay.teamId} />;
    case "service":
      return <ServiceSheet serviceId={overlay.serviceId} />;
    case "hide":
      return <HideSheet reviewId={overlay.reviewId} />;
    case "closure":
      return <ClosureSheet />;
    case "more":
      return <MoreSheet sections={sections} />;
  }
}

