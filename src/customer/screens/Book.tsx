/**
 * G2, Book: four steps with a summary beside them (the comp's lines 248–434),
 * and Move, which is step 3 of the same page.
 *
 * Times come from Adminium, one read per strip and one per day. A pick is judged
 * again when it is saved: a time lost in between comes back to step 3 with the
 * nearest free ones.
 */
import { payLinkProps, rememberPayReturn, watchPayment, type FramePayState } from "@adminiumjs/public-client/frame";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { A, useApp, type Service } from "../app.tsx";
import type { Booked, Held, Row } from "../door.ts";
import { addDays, dayNumber, dayOf, firstName, fmtDay, fmtMoney, fmtRange, fmtTime, hhmm, initials, momentOf, monthShort, weekdayShort } from "../format.ts";
import { Blank, Err, Icon, Rows } from "../parts.tsx";
import { doorFor, dueNow, letGoLine, looksLikeEmail, nearestTimes, nextFreeDay, partOf, refusalOf, usesLeft, type DayPart, type Refusal, type StripDay } from "../rules.ts";
import { NAME_MAX } from "../../limits.ts";
import { keepBooking } from "../session.ts";
import type { Word } from "../words/index.ts";

const STRIP = 14;
const ANYONE = "any";

interface Slot {
  minutes: number;
}

export interface MoveTarget {
  id: string;
  code: string;
  serviceId: string;
  teamId: string | null;
  anyone: boolean;
  startsAt: string;
  signedIn: boolean;
  paidLine: string | null;
}

const PARTS: { part: DayPart; word: Word; icon: string }[] = [
  { part: "morning", word: "morning", icon: "sunrise" },
  { part: "afternoon", word: "afternoon", icon: "sun" },
  { part: "evening", word: "evening", icon: "sunset" },
];

const REFUSAL_WORD: Partial<Record<Refusal, Word>> = {
  busy: "busyRetry",
  "not-offered": "notOffered",
  "too-late": "tooLate",
  "limit-guest": "limitGuest",
  "limit-customer": "limitCustomer",
  paused: "paused",
  off: "bookingOff",
  rate: "rateLimited",
  network: "offline",
  unknown: "somethingWrong",
};

function useStrip(serviceId: string | null, who: string | null, exclude: string | undefined, from: string, viaLink: boolean) {
  const { door } = useApp();
  const [days, setDays] = useState<StripDay[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (serviceId === null) return;
    const ctl = new AbortController();
    setDays(null);
    setFailed(false);
    door
      .days(serviceId, who, from, STRIP, exclude, ctl.signal, viaLink)
      .then((d) => setDays(d as StripDay[]))
      .catch(() => {
        if (!ctl.signal.aborted) setFailed(true);
      });
    return () => ctl.abort();
  }, [door, serviceId, who, from, exclude, viaLink, attempt]);
  return { days, setDays, failed, retry: () => setAttempt((n) => n + 1) };
}

export default function Book({ move }: { move?: MoveTarget }) {
  const app = useApp();
  const { t, clock, studio, door, route, me, now, go, frame, locale, announce, toast } = app;
  const today = dayOf(clock, new Date(now()).toISOString());

  const moving = move !== undefined;
  const askedService = move?.serviceId ?? route.query.get("service");
  const askedWho = route.query.get("with");
  const initialService = studio.services.find((s) => s.id === askedService) ?? null;

  const [step, setStep] = useState<1 | 2 | 3 | 4>(moving ? 3 : initialService !== null ? (askedWho !== null ? 3 : 2) : 1);
  const [cat, setCat] = useState<string | null>(null);
  const [service, setService] = useState<Service | null>(initialService);
  const [who, setWho] = useState<string>(moving ? (move.anyone ? ANYONE : (move.teamId ?? ANYONE)) : (askedWho ?? ANYONE));
  const startDay = moving ? dayOf(clock, move.startsAt) : today;
  const [from, setFrom] = useState(moving && startDay >= today ? startDay : today);
  const [day, setDay] = useState<string | null>(moving ? startDay : null);
  const [time, setTime] = useState<number | null>(null);
  const [times, setTimes] = useState<Slot[] | null>(null);
  const [timesFailed, setTimesFailed] = useState(false);
  const [lost, setLost] = useState<{ minutes: number; word: "taken" | "noLongerFits" } | null>(null);
  const [form, setForm] = useState({ name: String(me?.["name"] ?? ""), email: String(me?.["email"] ?? ""), phone: String(me?.["phone"] ?? ""), note: "", noReview: false });
  const [errs, setErrs] = useState<{ name?: boolean; email?: boolean }>({});
  const [refused, setRefused] = useState<Refusal | null>(null);
  const [saving, setSaving] = useState(false);
  const [held, setHeld] = useState<Held | null>(null);
  const [heldFailed, setHeldFailed] = useState(false);
  const [packs, setPacks] = useState<Row[]>([]);
  const [replayed, setReplayed] = useState(false);
  const [usePack, setUsePack] = useState(route.query.get("pack"));
  const [useCard, setUseCard] = useState<string | null>(null);
  const [wl, setWl] = useState<"idle" | "form" | "added">("idle");
  const [wlForm, setWlForm] = useState({ name: String(me?.["name"] ?? ""), email: String(me?.["email"] ?? "") });
  const [wlErrs, setWlErrs] = useState<{ name?: boolean; email?: boolean; refused?: boolean }>({});
  const [frameWait, setFrameWait] = useState<{ payUrl: string; row: Row; token: string | null } | null>(null);
  const clientKey = useRef<{ sig: string; key: string } | null>(null);
  const wlKey = useRef(door.newKey());

  const teamId = who === ANYONE ? null : who;
  const exclude = move?.id;
  const viaLink = moving && !move.signedIn;
  const { days: strip, setDays: setStrip, failed: stripFailed, retry: retryStrip } = useStrip(step >= 3 && service !== null ? service.id : null, teamId, exclude, from, viaLink);

  useEffect(() => {
    setForm((f) => ({ ...f, name: f.name || String(me?.["name"] ?? ""), email: f.email || String(me?.["email"] ?? ""), phone: f.phone || String(me?.["phone"] ?? "") }));
    if (me !== null) {
      door
        .held()
        .then((h) => {
          setHeld(h);
          setHeldFailed(false);
        })
        .catch(() => setHeldFailed(true));
    }
  }, [me, door]);

  // The first open day of the strip, unless one is already picked inside it.
  useEffect(() => {
    if (strip === null || strip.length === 0) return;
    if (day !== null && strip.some((d) => d.date === day)) return;
    if (day !== null && day >= from && day < addDays(from, STRIP)) return;
    setDay((strip.find((d) => d.state === "open" && d.open > 0) ?? strip[0]!).date);
  }, [strip, day, from]);

  const loadTimes = useCallback(
    (signal?: AbortSignal) => {
      if (service === null || day === null) return;
      setTimes(null);
      setTimesFailed(false);
      door
        .times(service.id, teamId, day, exclude, signal, viaLink)
        .then((list) => setTimes(list.filter((s) => s.state === "free").map((s) => ({ minutes: hhmm(s.time) }))))
        .catch(() => {
          // A read that failed is not a day with no times: it must not offer the waiting list.
          if (signal?.aborted !== true) setTimesFailed(true);
        });
    },
    [door, service, day, teamId, exclude, viaLink],
  );

  useEffect(() => {
    if (step !== 3) return;
    const ctl = new AbortController();
    loadTimes(ctl.signal);
    return () => ctl.abort();
  }, [step, loadTimes]);

  const doer = (id: string | null) => studio.team.find((p) => p.id === id) ?? null;
  const person = doer(teamId);
  const whoName = person?.name ?? t("anyone");
  const pack = packs.find((p) => String(p["id"]) === usePack) ?? null;
  const cards = useMemo(() => (held?.cards ?? []).filter((c) => Number(c["balance"] ?? 0) > 0), [held]);
  const card = cards.find((c) => String(c["id"]) === useCard) ?? null;

  const door0 = service === null ? null : doorFor(service, studio.ownerSwitch, studio.rows.paymentsOnline);

  // Which of the packs held this visit can use is Offers' to say, asked with the visit itself and with nothing saved.
  useEffect(() => {
    setPacks([]);
    if (step !== 4 || service === null || day === null || time === null || door0 === null || me === null) return;
    const candidates = (held?.packs ?? []).filter((p) => p["worth"] === "pack" && usesLeft(p) > 0);
    if (candidates.length === 0) return;
    let on = true;
    const asked = { service_id: service.id, ...(teamId === null ? {} : { team_id: teamId }), starts_at: momentOf(clock, day, time), name: String(me["name"] ?? form.name), email: String(me["email"] ?? form.email), language: locale, channel: frame === null ? ("page" as const) : ("embed" as const) };
    Promise.all(candidates.map(async (p) => ((await door.packCovers(door0, asked, p["id"])) ? p : null)))
      .then((list) => {
        if (on) setPacks(list.filter((p): p is Row => p !== null));
      })
      .catch(() => {
        if (on) setHeldFailed(true);
      });
    return () => {
      on = false;
    };
    // The form's own fields are not part of the question.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, service, day, time, teamId, door0, me, held, door, clock, locale, frame]);
  const due = service === null ? 0 : dueNow(service, door0);
  const coveredByPack = pack !== null;
  const payNow = coveredByPack ? 0 : due;
  const paused = service !== null && door0 === null;

  const payRow = () => {
    if (moving) return move.paidLine ?? t("payStudio");
    if (coveredByPack) return t("packPay", { pack: String(pack["public_name"] ?? pack["name"] ?? "") });
    if (service === null || due === 0) return t("payStudio");
    return service.online === "full" ? t("payFull", { amt: fmtMoney(clock, due) }) : t("payDeposit", { amt: fmtMoney(clock, due) });
  };
  const whenText = day === null ? "—" : time === null ? fmtDay(clock, day) : `${fmtDay(clock, day)} · ${service === null ? fmtTime(clock, time) : fmtRange(clock, time, time + service.minutes)}`;
  const policy = [t("policyShort", { n: studio.cancelHours }), coveredByPack || useCard !== null ? t("policyUse") : due > 0 ? (service?.online === "full" ? t("policyFull") : t("policyDeposit")) : null].filter((x) => x !== null).join(" ");

  const pickService = (s: Service) => {
    setService(s);
    setWho(ANYONE);
    setDay(null);
    setTime(null);
    setFrom(today);
    setUsePack(null);
    setUseCard(null);
    setLost(null);
    setStep(2);
  };

  const pickWho = (id: string) => {
    setWho(id);
    setDay(null);
    setTime(null);
    setFrom(today);
    setLost(null);
    setWl("idle");
    setStep(3);
  };

  const pickDay = (date: string) => {
    setDay(date);
    setTime(null);
    setLost(null);
    setWl("idle");
    announce(fmtDay(clock, date));
  };

  const backToDay = async (minutes: number, word: "taken" | "noLongerFits") => {
    setStep(3);
    setTime(null);
    setLost({ minutes, word });
    if (service !== null) {
      door.days(service.id, teamId, from, STRIP, exclude, undefined, viaLink).then((d) => setStrip(d as StripDay[])).catch(() => undefined);
      loadTimes();
    }
  };

  const saveMove = async () => {
    if (!moving || day === null || time === null) return;
    setSaving(true);
    setRefused(null);
    try {
      await door.moveBooking(move.id, momentOf(clock, day, time), teamId, move.signedIn);
      toast(t("moved", { when: `${fmtDay(clock, day)}, ${fmtTime(clock, time)}` }));
      go(`/b?id=${move.id}`, { replace: true });
    } catch (error) {
      const why = refusalOf(error, door.signedIn());
      if (why === "taken" || why === "no-longer-fits") await backToDay(time, why === "taken" ? "taken" : "noLongerFits");
      else setRefused(why);
    } finally {
      setSaving(false);
    }
  };

  const confirm = async (e?: FormEvent) => {
    e?.preventDefault();
    if (service === null || day === null || time === null || door0 === null) return;
    const bad = { ...(form.name.trim() === "" ? { name: true } : {}), ...(looksLikeEmail(form.email) ? {} : { email: true }) };
    setErrs(bad);
    if (bad.name === true || bad.email === true) {
      document.getElementById(bad.name === true ? "lm-name" : "lm-email")?.focus();
      return;
    }
    setSaving(true);
    setRefused(null);
    const values = {
      service_id: service.id,
      ...(teamId === null ? {} : { team_id: teamId }),
      starts_at: momentOf(clock, day, time),
      name: form.name.trim(),
      email: form.email.trim(),
      ...(form.phone.trim() === "" ? {} : { phone: form.phone.trim() }),
      ...(form.note.trim() === "" ? {} : { note: form.note.trim() }),
      language: locale,
      channel: frame === null ? ("page" as const) : ("embed" as const),
      no_review: form.noReview,
    };
    const sig = JSON.stringify([values, usePack, useCard]);
    if (clientKey.current?.sig !== sig) clientKey.current = { sig, key: door.newKey() };
    const packCode = pack === null ? [] : [`held:${String(pack["id"])}`];
    const cardCode = card === null || pack !== null ? null : `held:${String(card["id"])}`;
    try {
      const made: Booked = await door.book(door0, values, clientKey.current.key, { codes: packCode, card: cardCode });
      await after(made);
    } catch (error) {
      const why = refusalOf(error, door.signedIn());
      if (why === "taken" || why === "no-longer-fits") await backToDay(time, why === "taken" ? "taken" : "noLongerFits");
      else setRefused(why);
    } finally {
      setSaving(false);
    }
  };

  const after = async (made: Booked) => {
    const id = String(made.row["id"]);
    // A retry of a save whose reply was lost: the booking stands, and its own link went out by e-mail, not in this reply.
    if (made.replayed && made.token === null) {
      if (door.signedIn()) go(`/b?id=${id}`, { replace: true });
      else setReplayed(true);
      return;
    }
    keepBooking({ id, token: made.token, name: form.name.trim(), email: form.email.trim(), fresh: true, signedIn: !door.holdsLink() });
    // A card or a pack that left nothing due: booked at once, with no trip to the pay page (MON-3).
    if (made.row["state"] === "paying" && Number(made.row["pay_due"] ?? 0) <= 0) {
      await door.nothingDue(id, !door.holdsLink());
      finish(made);
      return;
    }
    if (made.row["state"] !== "paying") {
      finish(made);
      return;
    }
    const payUrl = made.payUrl ?? (await door.startPaying(id, !door.holdsLink()));
    if (frame !== null) {
      // The pay page can never be framed: a real link, in its own tab, and this frame watches the row (EMB-3).
      setFrameWait({ payUrl, row: made.row, token: made.token });
      return;
    }
    rememberPayReturn("/b");
    window.location.assign(payUrl);
  };

  const finish = (made: Booked) => {
    if (frame !== null) {
      frame.done(String(made.row["code"] ?? ""));
      setFramedDone(made.row);
      return;
    }
    go(`/b?new=1&id=${String(made.row["id"])}`, { replace: true });
  };

  const [framedDone, setFramedDone] = useState<Row | null>(null);
  const [frameState, setFrameState] = useState<FramePayState | "lost">("paying");
  const [lateMoney, setLateMoney] = useState(0);
  useEffect(() => {
    if (frameWait === null) return;
    const id = String(frameWait.row["id"]);
    const holdEnds = frameWait.row["pay_until"] ?? frameWait.row["link_until"];
    return watchPayment({
      holdEndsAt: holdEnds ? new Date(String(holdEnds)).getTime() : null,
      read: async () => {
        const row = await door.linkBooking();
        if (row === null) return "let-go";
        const state = String(row["state"]);
        if (state === "lapsed" || state === "cancelled") {
          const late = letGoLine({ paid: Number(row["paid"] ?? 0), cardPaid: Number(row["card_paid"] ?? 0) });
          setLateMoney(late.word === "lateMoney" ? late.amount : 0);
          return "let-go";
        }
        if (state === "booked") return "paid";
        const pay = await door.payState(id, false).catch(() => null);
        return pay?.state === "confirming" ? "confirming" : "paying";
      },
      onState: (state) => {
        setFrameState(state);
        if (state === "paid") {
          frame?.done(String(frameWait.row["code"] ?? ""));
          setFramedDone(frameWait.row);
          setFrameWait(null);
        }
      },
      onLost: () => setFrameState("lost"),
    });
  }, [frameWait, door, frame]);

  const join = async () => {
    if (service === null || day === null) return;
    const signedIn = me !== null;
    const name = signedIn ? String(me["name"] ?? "") : wlForm.name.trim();
    const email = signedIn ? String(me["email"] ?? "") : wlForm.email.trim();
    if (!signedIn) {
      const bad = { ...(name === "" ? { name: true } : {}), ...(looksLikeEmail(email) ? {} : { email: true }) };
      setWlErrs(bad);
      if (bad.name === true || bad.email === true) return;
    }
    try {
      await door.joinList({ service_id: service.id, team_id: teamId, day, name, email, language: locale }, wlKey.current);
      wlKey.current = door.newKey();
      setWl("added");
      announce(t("wlDone"));
    } catch {
      setWlErrs({ refused: true });
    }
  };

  // ── what is drawn ──────────────────────────────────────────────────────

  if (replayed) {
    return (
      <Blank icon="calendar-check" title={t("replayEmail")}>
        <button type="button" className="lm-btn primary mid" onClick={() => go("/find")}>
          {t("fFind")}
        </button>
      </Blank>
    );
  }

  if (framedDone !== null) {
    return (
      <main id="lm-main" className="lm-narrow-page" style={{ maxWidth: 560 }}>
        <div className="lm-pay-card" role="status">
          <div className="lm-badge pos">
            <Icon name="circle-check" size={28} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>{form.name.trim() === "" ? t("bookedPlain") : t("booked", { name: firstName(form.name) })}</h1>
          <Rows rows={[{ label: t("code"), value: String(framedDone["code"] ?? ""), mono: 6 }, { label: t("rWhat"), value: service?.name ?? "" }, { label: t("rWhen"), value: whenText, mono: 5 }]} />
          <p className="lm-muted" style={{ fontSize: 13.5 }}>
            {t("emailed", { email: form.email.trim() })}
          </p>
        </div>
      </main>
    );
  }

  const stepsDone = (n: number) => (n === 1 ? service !== null : n === 2 ? service !== null && step > 2 : n === 3 ? time !== null && step > 3 : false);
  const canGo = (n: number) => !moving && (n === 1 || (n === 2 && service !== null) || (n === 3 && service !== null) || (n === 4 && time !== null));
  const showSummary = service !== null;
  const stripDays = strip ?? [];
  const lastBookable = stripDays.some((d) => d.lastBookable === true);
  const dayRow = stripDays.find((d) => d.date === day) ?? null;
  const works = dayRow === null || dayRow.state !== "closed";
  const free = times?.map((s) => s.minutes) ?? [];
  const nextFree = day === null ? null : nextFreeDay(stripDays, day);
  const nearest = lost === null ? [] : nearestTimes(free, lost.minutes);
  const noTimes = times !== null && times.length === 0;

  return (
    <main id="lm-main" className="lm-book">
      <button
        type="button"
        className="lm-link quiet"
        style={{ marginBottom: 6 }}
        onClick={() => {
          if (moving) go(`/b?id=${move.id}`);
          else if (step === 1) go("/");
          else setStep((step - 1) as 1 | 2 | 3);
        }}
      >
        <Icon name="arrow-left" size={15} />
        {t("back")}
      </button>
      {moving ? (
        <div className="lm-note info" style={{ marginBottom: 16, alignItems: "center", fontWeight: 600 }}>
          <Icon name="calendar-clock" size={16} />
          {move.anyone ? t("movingAnyone", { code: move.code }) : t("movingLine", { code: move.code, who: whoName })}
        </div>
      ) : null}
      <ol aria-label={t("stepsLabel")} className="lm-steps">
        {(["st1", "st2", "st3", "st4"] as const).map((word, i) => {
          const n = (i + 1) as 1 | 2 | 3 | 4;
          const done = stepsDone(n);
          return (
            <li key={word} className={`lm-step${done ? " done" : ""}`}>
              <button type="button" disabled={!canGo(n)} {...(step === n ? { "aria-current": "step" as const } : {})} onClick={() => setStep(n)}>
                <span className="lm-step-num">{done ? <Icon name="check" size={14} /> : n}</span>
                <span className="lm-step-label">{t(word)}</span>
              </button>
              {n < 4 ? <span aria-hidden="true" className="lm-step-bar" /> : null}
            </li>
          );
        })}
      </ol>

      <div className={`lm-book-grid${showSummary ? " has-summary" : ""}`}>
        <div style={{ minWidth: 0 }}>
          {step === 1 ? (
            <div className="lm-in">
              <h1>{t("s1t")}</h1>
              <p className="lm-muted" style={{ marginBottom: 16, fontSize: 14.5 }}>
                {t("s1s")}
              </p>
              <div role="group" aria-label={t("st1")} className="lm-chips">
                <button type="button" className="lm-chip" aria-pressed={cat === null} onClick={() => setCat(null)}>
                  {t("all")}
                </button>
                {studio.categories.map((c) => (
                  <button key={c.id} type="button" className="lm-chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
                    {c.name}
                  </button>
                ))}
              </div>
              <div className="lm-pick-grid">
                {studio.services
                  .filter((s) => cat === null || s.categoryId === cat)
                  .map((s) => {
                    const d = doorFor(s, studio.ownerSwitch, studio.rows.paymentsOnline);
                    const icon = studio.categories.find((c) => c.id === s.categoryId)?.icon ?? "sparkles";
                    return (
                      <button key={s.id} type="button" className="lm-pick" aria-pressed={service?.id === s.id} onClick={() => pickService(s)}>
                        <span aria-hidden="true" className="lm-tile" style={{ width: 52, height: 52 }}>
                          <Icon name={icon} size={22} />
                        </span>
                        <span className="lm-col" style={{ flex: 1, minWidth: 0, gap: 5 }}>
                          <span className="lm-svc-name">{s.name}</span>
                          <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px" }}>
                            <span className="lm-mono lm-dur">{t("minutes", { n: s.minutes })}</span>
                            <span className="lm-mono6" style={{ fontSize: 13.5 }}>
                              {fmtMoney(clock, s.price)}
                            </span>
                          </span>
                          {d === "money" ? (
                            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{s.online === "full" ? t("fullOnline", { amt: fmtMoney(clock, s.price) }) : t("depositOnline", { amt: fmtMoney(clock, s.deposit) })}</span>
                          ) : null}
                          {d === null ? <span style={{ fontSize: 12, fontWeight: 700, color: "var(--warn)" }}>{t("paused")}</span> : null}
                        </span>
                        <span aria-hidden="true" className="lm-radio">
                          <Icon name="check" size={14} />
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          ) : null}

          {step === 2 && service !== null ? (
            <div className="lm-in">
              <h1>{t("s2t")}</h1>
              <p className="lm-muted" style={{ marginBottom: 18, fontSize: 14.5 }}>
                {service.name}
              </p>
              <div role="group" aria-label={t("st2")} className="lm-col" style={{ gap: 12 }}>
                <button type="button" className="lm-pick" aria-pressed={who === ANYONE} onClick={() => pickWho(ANYONE)}>
                  <span aria-hidden="true" className="lm-avatar">
                    <Icon name="users" size={22} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 15.5, fontWeight: 800 }}>{t("anyone")}</span>
                    <span className="lm-muted" style={{ display: "block", fontSize: 13, marginTop: 3 }}>
                      {t("anyoneSub")}
                    </span>
                  </span>
                  <span aria-hidden="true" className="lm-radio">
                    <Icon name="check" size={14} />
                  </span>
                </button>
                {studio.team
                  .filter((p) => studio.doers.get(service.id)?.includes(p.id))
                  .map((p) => (
                    <button key={p.id} type="button" className="lm-pick" aria-pressed={who === p.id} onClick={() => pickWho(p.id)}>
                      <span aria-hidden="true" className="lm-avatar" style={{ "--tint": p.tint } as Record<string, string>}>
                        {initials(p.name)}
                      </span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 15.5, fontWeight: 800 }}>{p.name}</span>
                        <span className="lm-muted" style={{ display: "block", fontSize: 13, marginTop: 3 }}>
                          {p.role}
                        </span>
                      </span>
                      <span aria-hidden="true" className="lm-radio">
                        <Icon name="check" size={14} />
                      </span>
                    </button>
                  ))}
              </div>
            </div>
          ) : null}

          {step === 3 && service !== null ? (
            <div className="lm-in">
              <h1>{t("s3t")}</h1>
              <p className="lm-muted" style={{ marginBottom: 16, fontSize: 14.5 }}>
                {`${service.name} · ${whoName}`}
              </p>
              <div role="group" aria-label={t("st3")} className="lm-days">
                {from > today ? (
                  <button type="button" className="lm-day-page" aria-label={t("earlierLabel")} onClick={() => setFrom(addDays(from, -STRIP) < today ? today : addDays(from, -STRIP))}>
                    <Icon name="chevron-left" size={16} />
                    {t("earlier")}
                  </button>
                ) : null}
                {strip === null && !stripFailed
                  ? Array.from({ length: 7 }, (_, i) => <div key={i} className="lm-skel" style={{ flex: "0 0 68px", height: 84 }} />)
                  : stripDays.map((d) => {
                      const off = d.state !== "open" || d.open === 0;
                      const sub = d.state === "closed" ? t("closedChip") : d.state === "full" || d.open === 0 ? t("fullChip") : t("openChip", { n: d.open });
                      const first = d.date.endsWith("-01");
                      return (
                        <button key={d.date} type="button" className="lm-day" disabled={d.state === "closed"} aria-pressed={day === d.date} aria-label={`${fmtDay(clock, d.date)}, ${sub}`} onClick={() => pickDay(d.date)} style={off && day !== d.date ? { color: "var(--fg-subtle)" } : undefined}>
                          <span className="lm-day-dow">{first ? monthShort(clock, d.date) : weekdayShort(clock, d.date)}</span>
                          <span className="lm-day-num">{dayNumber(clock, d.date)}</span>
                          <span className="lm-day-sub">{sub}</span>
                        </button>
                      );
                    })}
                {strip !== null && !lastBookable && stripDays.length > 0 ? (
                  <button type="button" className="lm-day-page" aria-label={t("laterLabel")} onClick={() => setFrom(addDays(from, STRIP))}>
                    <Icon name="chevron-right" size={16} />
                    {t("later")}
                  </button>
                ) : null}
              </div>

              {stripFailed || timesFailed ? (
                <div role="alert" className="lm-note danger" style={{ marginBottom: 18, alignItems: "center" }}>
                  <Icon name="cloud-off" size={16} />
                  <span style={{ flex: 1 }}>{t("somethingWrong")}</span>
                  <button
                    type="button"
                    className="lm-btn"
                    onClick={() => {
                      if (stripFailed) retryStrip();
                      if (timesFailed) loadTimes();
                    }}
                  >
                    {t("tryAgain")}
                  </button>
                </div>
              ) : null}

              {lost !== null ? (
                <div role="alert" className="lm-note warn lm-col" style={{ marginBottom: 18, padding: "14px 16px", borderRadius: 14, alignItems: "stretch" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 14, fontWeight: 700 }}>
                    <Icon name="circle-alert" size={17} />
                    {nearest.length === 0 && times !== null ? t("takenNone") : t(lost.word === "taken" ? "taken" : "noLongerFits")}
                  </div>
                  {nearest.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                      {nearest.map((m) => (
                        <button
                          key={m}
                          type="button"
                          className="lm-slot"
                          style={{ minWidth: 96 }}
                          onClick={() => {
                            setTime(m);
                            setLost(null);
                          }}
                        >
                          {fmtTime(clock, m)}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {times === null && !timesFailed ? (
                <div aria-busy="true" aria-label={t("loadingTimes")} className="lm-col" style={{ gap: 18 }}>
                  {[6, 8].map((n) => (
                    <div key={n}>
                      <div style={{ width: 90, height: 12, borderRadius: 6, background: "var(--surface-3)", marginBottom: 12 }} />
                      <div className="lm-slots">
                        {Array.from({ length: n }, (_, i) => (
                          <div key={i} className="lm-skel" style={{ height: 44 }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {times !== null && !noTimes ? (
                <div className="lm-col" style={{ gap: 18 }}>
                  {PARTS.map(({ part, word, icon }) => {
                    const list = free.filter((m) => partOf(m) === part);
                    if (list.length === 0) return null;
                    return (
                      <div key={part} role="group" aria-label={t(word)}>
                        <div className="lm-group-h">
                          <Icon name={icon} size={15} />
                          <span>{t(word)}</span>
                        </div>
                        <div className="lm-slots">
                          {list.map((m) => (
                            <button
                              key={m}
                              type="button"
                              className="lm-slot"
                              aria-pressed={time === m}
                              onClick={() => {
                                setTime(m);
                                setLost(null);
                                announce(fmtTime(clock, m));
                              }}
                            >
                              {fmtTime(clock, m)}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {noTimes ? (
                <div className="lm-col" style={{ gap: 14 }}>
                  <div className="lm-empty" style={{ padding: "32px 20px", borderRadius: 18, gap: 8 }}>
                    <div className="lm-empty-mark">
                      <Icon name="calendar-off" size={24} />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{works ? t("noTimes") : t("personOff", { who: whoName })}</div>
                    <div className="lm-muted" style={{ fontSize: 13.5, maxWidth: 320, lineHeight: 1.5 }}>
                      {works ? t("noTimesSub") : t("personOffSub")}
                    </div>
                    {nextFree !== null ? (
                      <button type="button" className="lm-btn" style={{ marginTop: 6 }} onClick={() => pickDay(nextFree)}>
                        {t("nextFree")}
                        <span className="lm-mono lm-muted" style={{ fontSize: 12.5 }}>
                          {fmtDay(clock, nextFree)}
                        </span>
                        <Icon name="arrow-right" size={15} />
                      </button>
                    ) : null}
                  </div>
                  {works && day !== null && !moving && wl !== "added" ? (
                    <div className="lm-card" style={{ padding: "16px 18px", borderRadius: 18, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon name="bell" size={20} />
                      </div>
                      <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 800 }}>{t("wlTitle", { day: fmtDay(clock, day) })}</div>
                        <div className="lm-muted" style={{ fontSize: 12.5, marginTop: 3 }}>
                          {person === null ? t("wlForAnyone", { svc: service.name }) : t("wlForWho", { svc: service.name, who: person.name })}
                        </div>
                      </div>
                      {wl === "idle" ? (
                        <button type="button" className="lm-btn primary" onClick={() => (me === null ? setWl("form") : void join())}>
                          {t("addMe")}
                        </button>
                      ) : null}
                      {wl === "form" ? (
                        <form
                          noValidate
                          style={{ flex: "1 1 100%", display: "flex", flexDirection: "column", gap: 12 }}
                          onSubmit={(e) => {
                            e.preventDefault();
                            void join();
                          }}
                        >
                          <div className="lm-field">
                            <label htmlFor="lm-wl-name">{t("fName")}</label>
                            <input id="lm-wl-name" className="lm-input" autoComplete="name" maxLength={NAME_MAX} value={wlForm.name} aria-invalid={wlErrs.name === true} onChange={(e) => setWlForm({ ...wlForm, name: e.target.value })} />
                            {wlErrs.name === true ? <Err>{t("errName")}</Err> : null}
                          </div>
                          <div className="lm-field">
                            <label htmlFor="lm-wl-email">{t("fEmail")}</label>
                            <input id="lm-wl-email" className="lm-input" type="email" dir="ltr" autoComplete="email" value={wlForm.email} aria-invalid={wlErrs.email === true} onChange={(e) => setWlForm({ ...wlForm, email: e.target.value })} />
                            {wlErrs.email === true ? <Err>{t("errEmail")}</Err> : null}
                          </div>
                          <button type="submit" className="lm-btn primary">
                            {t("addMe")}
                          </button>
                        </form>
                      ) : null}
                      {wlErrs.refused === true ? <div style={{ flex: "1 1 100%" }}><Err>{t("wlLimit")}</Err></div> : null}
                    </div>
                  ) : null}
                  {wl === "added" ? (
                    <div role="status" className="lm-note pos" style={{ padding: "16px 18px", borderRadius: 18, gap: 12 }}>
                      <Icon name="circle-check" size={20} />
                      <div style={{ fontSize: 14, lineHeight: 1.55, fontWeight: 600 }}>{t("wlDone")}</div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {refused !== null ? (
                <div role="alert" className="lm-note danger" style={{ marginTop: 16 }}>
                  <Icon name="circle-alert" size={16} />
                  {t(REFUSAL_WORD[refused] ?? "somethingWrong")}
                </div>
              ) : null}

              <div className="lm-foot-bar">
                <div className="lm-muted" style={{ fontSize: 13.5, fontWeight: 600 }}>
                  {time === null || day === null ? t("pickTime") : `${fmtDay(clock, day)} · ${fmtTime(clock, time)}`}
                </div>
                <button
                  type="button"
                  className="lm-btn primary large"
                  disabled={time === null || saving || (paused && !moving)}
                  onClick={() => {
                    if (moving) void saveMove();
                    else setStep(4);
                  }}
                >
                  {moving ? t("moveHere") : t("cont")}
                  <Icon name="arrow-right" size={16} />
                </button>
              </div>
              {paused && !moving ? (
                <div className="lm-note warn" style={{ marginTop: 12 }}>
                  <Icon name="info" size={16} />
                  {t("paused")}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 4 && service !== null ? (
            <form noValidate onSubmit={(e) => void confirm(e)} className="lm-in lm-col" style={{ gap: 16 }}>
              <div>
                <h1>{t("s4t")}</h1>
                <p className="lm-muted" style={{ fontSize: 14.5 }}>
                  {t("s4s")}
                </p>
              </div>
              {frameWait !== null ? (
                <div role="status" className="lm-col" style={{ alignItems: "center", textAlign: "center", gap: 10, padding: "26px 20px", borderRadius: 18, background: "var(--info-soft)" }}>
                  <Icon name="external-link" size={24} />
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{frameState === "confirming" ? t("confirming") : frameState === "let-go" ? (lateMoney > 0 ? t("letGoMoney", { amt: fmtMoney(clock, lateMoney) }) : t("letGoTitle", { n: studio.holdMin })) : frameState === "lost" ? t("lostWatch") : t("newTab")}</div>
                  {frameState === "paying" || frameState === "confirming" ? (
                    <a className="lm-link" {...payLinkProps(frameWait.payUrl)}>
                      {t("openPay")}
                    </a>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="lm-field">
                    <label htmlFor="lm-name">{t("fName")}</label>
                    <input id="lm-name" className="lm-input" autoComplete="name" maxLength={NAME_MAX} value={form.name} aria-invalid={errs.name === true} {...(errs.name === true ? { "aria-describedby": "lm-name-err" } : {})} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    {errs.name === true ? <Err id="lm-name-err">{t("errName")}</Err> : null}
                  </div>
                  <div className="lm-field">
                    <label htmlFor="lm-email">{t("fEmail")}</label>
                    <input id="lm-email" className="lm-input" type="email" dir="ltr" autoComplete="email" maxLength={254} value={form.email} aria-invalid={errs.email === true} {...(errs.email === true ? { "aria-describedby": "lm-email-err" } : {})} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    {errs.email === true ? <Err id="lm-email-err">{t("errEmail")}</Err> : null}
                  </div>
                  <div className="lm-field">
                    <label htmlFor="lm-phone">{t("fPhone")}</label>
                    <input id="lm-phone" className="lm-input" type="tel" dir="ltr" autoComplete="tel" maxLength={32} aria-describedby="lm-phone-hint" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    <div id="lm-phone-hint" className="lm-hint">
                      {t("fPhoneHint")}
                    </div>
                  </div>
                  <div className="lm-field">
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                      <label htmlFor="lm-note">{t("fNote")}</label>
                      <span aria-hidden="true" className="lm-mono" style={{ fontSize: 11.5, color: "var(--fg-subtle)" }}>{`${String(form.note.length)} / 280`}</span>
                    </div>
                    <textarea id="lm-note" className="lm-input" rows={3} maxLength={280} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                  </div>
                  <label className="lm-check">
                    <input type="checkbox" checked={form.noReview} onChange={(e) => setForm({ ...form, noReview: e.target.checked })} />
                    <span>{t("noReview")}</span>
                  </label>
                </>
              )}
              {refused !== null ? (
                <div role="alert" className="lm-note danger">
                  <Icon name="circle-alert" size={16} />
                  {t(REFUSAL_WORD[refused] ?? "somethingWrong")}
                </div>
              ) : null}
            </form>
          ) : null}
        </div>

        {showSummary ? (
          <aside aria-label={t("sumTitle")} className="lm-summary" data-step={step}>
            <div className="lm-summary-h">
              <span className="lm-eyebrow">{t("sumTitle")}</span>
            </div>
            <dl>
              <div>
                <dt>{t("rSvc")}</dt>
                <dd>{service.name}</dd>
              </div>
              <div>
                <dt>{t("rWho")}</dt>
                <dd>{whoName}</dd>
              </div>
              <div>
                <dt>{t("rWhen")}</dt>
                <dd className="lm-mono">{whenText}</dd>
              </div>
              <div>
                <dt>{t("rLen")}</dt>
                <dd className="lm-mono">{t("minutes", { n: service.minutes })}</dd>
              </div>
              <div>
                <dt>{t("rPrice")}</dt>
                <dd className="lm-mono6">{fmtMoney(clock, service.price)}</dd>
              </div>
              <div>
                <dt>{t("rPay")}</dt>
                <dd>{payRow()}</dd>
              </div>
            </dl>
            {!moving && packs.length > 0
              ? packs.map((p) => (
                  <label key={String(p["id"])} className="lm-use">
                    <input
                      type="checkbox"
                      checked={usePack === String(p["id"])}
                      onChange={(e) => {
                        setUsePack(e.target.checked ? String(p["id"]) : null);
                        // A pack covers the visit: nothing is left for a card to pay.
                        if (e.target.checked) setUseCard(null);
                      }}
                    />
                    {t("usePack", { pack: String(p["public_name"] ?? ""), n: usesLeft(p) })}
                  </label>
                ))
              : null}
            {!moving && due > 0 && !coveredByPack
              ? cards.map((c) => (
                  <label key={String(c["id"])} className="lm-use">
                    <input type="checkbox" checked={useCard === String(c["id"])} onChange={(e) => setUseCard(e.target.checked ? String(c["id"]) : null)} />
                    {t("useCardPick", { card: String(c["label"] ?? t("navGifts")), amt: fmtMoney(clock, c["balance"]) })}
                  </label>
                ))
              : null}
            {!moving && heldFailed ? (
              <div className="lm-note warn" style={{ margin: "0 20px 14px" }}>
                <Icon name="info" size={16} />
                {t("heldFailed")}
              </div>
            ) : null}
            {step === 4 && frameWait === null ? (
              <div className="lm-col" style={{ padding: "0 20px 20px", gap: 10 }}>
                <button type="button" className="lm-btn primary large" disabled={saving || paused} onClick={() => void confirm()}>
                  {saving ? <Icon name="loader-circle" size={17} className="lm-spin" /> : null}
                  {payNow > 0 ? (service.online === "full" ? t("toPayment") : t("toDeposit")) : t("confirm")}
                </button>
                {paused ? (
                  <div className="lm-note warn">
                    <Icon name="info" size={16} />
                    {t("paused")}
                  </div>
                ) : null}
                <div className="lm-muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
                  {policy}
                </div>
              </div>
            ) : null}
          </aside>
        ) : null}
      </div>

      {service !== null && (step === 2 || step === 3) ? (
        <div className="lm-phone-bar">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="lm-ellipsis" style={{ fontSize: 13.5, fontWeight: 800 }}>{`${service.name} · ${whoName}`}</div>
            <div className="lm-mono lm-muted lm-ellipsis" style={{ fontSize: 12 }}>
              {whenText}
            </div>
          </div>
          <span className="lm-mono6" style={{ fontSize: 15 }}>
            {due > 0 ? (service.online === "full" ? t("payFull", { amt: fmtMoney(clock, due) }) : t("payDeposit", { amt: fmtMoney(clock, due) })) : fmtMoney(clock, service.price)}
          </span>
        </div>
      ) : null}
      {me === null && step === 4 ? (
        <p className="lm-muted" style={{ marginTop: 16, fontSize: 13 }}>
          {t("haveAccount")} <A to="/sign-in">{t("signIn")}</A> {t("toSeeVisits")}
        </p>
      ) : null}
    </main>
  );
}
