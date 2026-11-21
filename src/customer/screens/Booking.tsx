/**
 * G3–G5 and G9: one booking, by its link (`/b#<code>`) or from Your visits.
 * Booked, Your booking, waiting for the deposit, the offer, cancelled and let go
 * are states of this page (the comp's lines 437–508, 623–647). The code is taken
 * from the fragment and cleared at once (cT8).
 */
import { rememberPayReturn } from "@adminiumjs/public-client/frame";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useApp, yes } from "../app.tsx";
import type { Row } from "../door.ts";
import { dayOf, firstName, fmtDay, fmtMoment, fmtMoney, fmtTime, fmtWhen, minutesOf } from "../format.ts";
import { Blank, Icon, Tile } from "../parts.tsx";
import { tokenOf } from "../route.ts";
import { actionsOf, cancelledLine, isFree, keptOnLate, letGoLine, paidRow, refusalOf, statusOf, type BookingFacts, type BookingState, type PayMode } from "../rules.ts";
import { forgetBooking, keptBooking } from "../session.ts";
import Book, { type MoveTarget } from "./Book.tsx";
import ReviewForm from "./ReviewForm.tsx";

const n = (v: unknown) => (v === null || v === undefined || v === "" ? 0 : Number(v));
const orNull = (v: unknown) => (v === null || v === undefined || v === "" ? null : String(v));

export function factsOf(r: Row): BookingFacts {
  return {
    state: String(r["state"]) as BookingState,
    payMode: (r["pay_mode"] === "deposit" || r["pay_mode"] === "full" ? r["pay_mode"] : "none") as PayMode,
    asked: n(r["asked"]),
    deposit: n(r["deposit"]),
    price: n(r["price"]),
    paid: n(r["paid"]),
    refunded: n(r["refunded"]),
    discount: n(r["discount"]),
    payDue: n(r["pay_due"]),
    startsAt: String(r["starts_at"]),
    freeUntil: orNull(r["free_until"]),
    lateCancel: yes(r["late_cancel"]),
    cancelledBy: r["cancelled_by"] === "customer" || r["cancelled_by"] === "studio" ? r["cancelled_by"] : null,
    cancelReason: orNull(r["cancel_reason"]),
    lapsedBy: r["lapsed_by"] === "guest" || r["lapsed_by"] === "desk" || r["lapsed_by"] === "time" ? r["lapsed_by"] : null,
    reviewedAt: orNull(r["reviewed_at"]),
  };
}

type Load = { kind: "loading" } | { kind: "expired" } | { kind: "ready"; row: Row; signedIn: boolean } | { kind: "error" };

export default function Booking() {
  const app = useApp();
  const { door, route, go } = app;
  const [load, setLoad] = useState<Load>({ kind: "loading" });
  const [moving, setMoving] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const asked = route.query.get("id");

  const read = useCallback(async () => {
    // A row of the signed-in person's own, by its id.
    if (asked !== null && door.signedIn()) {
      const row = (await door.myBookings()).find((b) => String(b["id"]) === asked);
      if (row !== undefined) return { row, signedIn: true };
    }
    const row = await door.linkBooking();
    return row === null ? null : { row, signedIn: false };
  }, [door, asked]);

  // The link's code is read once and spent once, however often this effect runs.
  const [token] = useState(() => tokenOf(window.location.hash, 64));
  const opening = useRef<Promise<"opened" | "unknown" | "closed"> | null>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      if (token !== null) {
        // Out of the address at once: it reaches no history entry, referrer or log (cT8).
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        opening.current ??= door.openLink(token);
        if ((await opening.current) !== "opened") {
          if (on) setLoad({ kind: "expired" });
          return;
        }
      }
      const found = await read();
      if (!on) return;
      setLoad(found === null ? { kind: "expired" } : { kind: "ready", ...found });
    })().catch(() => {
      if (on) setLoad({ kind: "error" });
    });
    return () => {
      on = false;
    };
  }, [door, read, token]);

  const reload = useCallback(async () => {
    const found = await read();
    if (found !== null) setLoad({ kind: "ready", ...found });
  }, [read]);

  if (load.kind === "loading") return <Loading />;
  if (load.kind === "error") {
    return (
      <Blank icon="cloud-off" title={app.t("somethingWrong")}>
        <button type="button" className="lm-btn primary" onClick={() => window.location.reload()}>
          {app.t("tryAgain")}
        </button>
      </Blank>
    );
  }
  if (load.kind === "expired") {
    return (
      <Blank icon="link-2-off" title={app.t("exTitle")} sub={app.t("exSub")}>
        <button type="button" className="lm-btn primary mid" onClick={() => go("/find")}>
          {app.t("fFind")}
        </button>
      </Blank>
    );
  }
  const { row, signedIn } = load;
  if (moving) {
    const facts = factsOf(row);
    const paid = paidRow(facts);
    const target: MoveTarget = {
      id: String(row["id"]),
      code: String(row["code"] ?? ""),
      serviceId: String(row["service_id"]),
      teamId: orNull(row["team_id"]),
      anyone: yes(row["picked_by_anyone"]),
      startsAt: facts.startsAt,
      signedIn,
      paidLine: paid.word === "nothing" ? null : app.t("alreadyPaid", { amt: fmtMoney(app.clock, paid.amount) }),
    };
    return <MovePage target={target} onDone={() => { setMoving(false); void reload(); }} />;
  }
  if (reviewing) {
    return <ReviewForm bookingId={row["id"]} signedIn={signedIn} serviceId={String(row["service_id"])} teamId={orNull(row["team_id"])} day={dayOf(app.clock, String(row["starts_at"]))} onBack={() => { setReviewing(false); void reload(); }} />;
  }
  if (row["state"] === "offered") return <Offer row={row} onChange={reload} />;
  return <Card row={row} signedIn={signedIn} isNew={route.query.get("new") === "1"} onChange={reload} onMove={() => setMoving(true)} onReview={() => setReviewing(true)} />;
}

function Loading() {
  const { t } = useApp();
  return (
    <main id="lm-main" className="lm-narrow-page" style={{ maxWidth: 680 }} aria-busy="true" aria-label={t("loading")}>
      <div className="lm-skel" style={{ height: 320, borderRadius: 20 }} />
    </main>
  );
}

function MovePage({ target, onDone }: { target: MoveTarget; onDone: () => void }) {
  const { route } = useApp();
  // `go("/b")` from Move returns here; a change of the route's object is the signal.
  const [start] = useState(route);
  useEffect(() => {
    if (route !== start) onDone();
  }, [route, start, onDone]);
  return <Book move={target} />;
}

function Card({ row, signedIn, isNew, onChange, onMove, onReview }: { row: Row; signedIn: boolean; isNew: boolean; onChange: () => Promise<void>; onMove: () => void; onReview: () => void }) {
  const app = useApp();
  const { t, clock, studio, door, now, go, openSheet } = app;
  const b = useMemo(() => factsOf(row), [row]);
  const [problem, setProblem] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [cal, setCal] = useState<{ ics: string; google: string; outlook: string } | null>(null);
  const service = studio.services.find((s) => s.id === String(row["service_id"]));
  const person = studio.team.find((p) => p.id === String(row["team_id"] ?? ""));
  const category = studio.categories.find((c) => c.id === service?.categoryId);
  const serviceName = service?.name ?? "";
  const minutes = n(row["minutes"]) || (service?.minutes ?? 60);
  const money = (v: number) => fmtMoney(clock, v);
  const code = String(row["code"] ?? "");
  const kept = keptBooking();
  const name = String(row["name"] ?? kept?.name ?? "");
  const email = String(row["email"] ?? kept?.email ?? "");
  const stamp = now();
  const fresh = isNew && (b.state === "booked" || b.state === "arrived");
  const status = statusOf(b.state);
  const actions = actionsOf(b, stamp);
  const free = isFree(b, stamp);
  const ahead = new Date(b.startsAt).getTime() > stamp;
  const late = b.state === "booked" && ahead && !free;

  useEffect(() => {
    if (!fresh) return;
    let on = true;
    door.linkCalendar(row["id"]).then((c) => on && setCal(c)).catch(() => undefined);
    return () => {
      on = false;
    };
  }, [fresh, door, row]);

  const paidWords = () => {
    const p = paidRow(b);
    if (p.word === "nothing") return t("nothingPaid");
    const amt = money(p.amount);
    const f = p.full;
    switch (p.word) {
      case "notYet":
        return f ? t("fullNotYet", { amt }) : t("depositNotYet", { amt });
      case "paid":
        return f ? t("fullPaidRow", { amt }) : t("depositPaidRow", { amt });
      case "refunded":
        return f ? t("fullRefundedRow", { amt }) : t("depositRefundedRow", { amt });
      case "kept":
        return f ? t("fullKeptRow", { amt }) : t("depositKeptRow", { amt });
    }
  };

  const whoName = person?.name ?? t("anyone");
  const where = `${String(studio.rows.settings["address_line1"] ?? "")}, ${String(studio.rows.settings["city"] ?? "")}`;

  const startPay = async () => {
    setPaying(true);
    setProblem(null);
    try {
      if (b.payDue <= 0) {
        await door.nothingDue(row["id"], signedIn);
        await onChange();
        return;
      }
      const url = await door.startPaying(row["id"], signedIn);
      rememberPayReturn("/b");
      window.location.assign(url);
    } catch {
      setProblem(t("payRefused"));
      setPaying(false);
    }
  };

  const askCancel = () => {
    const day = fmtDay(clock, dayOf(clock, b.startsAt));
    const time = fmtTime(clock, minutesOf(clock, b.startsAt));
    const keeps = keptOnLate(b);
    const amount = money(b.paid > 0 ? b.paid : b.asked);
    const lines: string[] = [];
    if (free) {
      lines.push(t("cancelQ", { svc: serviceName, day, time, free: b.freeUntil === null ? "" : fmtMoment(clock, b.freeUntil) }));
      if (keeps === "deposit" && b.paid > 0) lines.push(t("depBack", { amt: amount }));
      if (keeps === "payment" && b.paid > 0) lines.push(t("fullBack", { amt: amount }));
      if (keeps === "use") lines.push(t("useBack"));
    } else {
      lines.push(t("cancelQs", { svc: serviceName, day, time }));
      lines.push(t("lateCancel", { n: studio.cancelHours }));
      if (keeps === "deposit") lines.push(t("depKept", { amt: amount }));
      if (keeps === "payment") lines.push(t("fullKept", { amt: amount }));
      if (keeps === "use") lines.push(t("useKept"));
    }
    openSheet({
      icon: "calendar-x",
      title: t("cancelTitle"),
      lines,
      keep: t("keep"),
      go: t("cancelBooking"),
      onGo: async () => {
        setProblem(null);
        try {
          await door.cancelBooking(row["id"], signedIn);
          forgetBooking();
          await onChange();
        } catch (error) {
          const why = refusalOf(error, signedIn);
          setProblem(why === "network" ? t("offline") : t("somethingWrong"));
          await onChange();
        }
      },
    });
  };

  const title = () => {
    if (fresh) return name === "" ? t("bookedPlain") : t("booked", { name: firstName(name) });
    return t("ybTitle");
  };

  const line = (): string | null => {
    if (fresh && kept?.fresh === true && b.paid > 0) return b.payMode === "full" ? t("paidNoteFull", { amt: money(b.paid) }) : t("paidNote", { amt: money(b.paid) });
    if (fresh && b.discount > 0 && b.payMode === "deposit" && b.paid === 0) return t("paidCovered");
    if (b.state === "paying") return row["pay_until"] === null || row["pay_until"] === undefined ? t("linkHoldLine", { when: row["link_until"] ? fmtMoment(clock, String(row["link_until"])) : "", n: studio.holdMin }) : t("payingLine", { n: studio.holdMin });
    if (b.state === "cancelled") {
      const c = cancelledLine(b);
      switch (c.word) {
        case "studio": {
          const first = c.reason === null ? t("cancelledStudioPlain", { studio: studio.name }) : t("cancelledStudio", { studio: studio.name, reason: c.reason });
          return c.refunded > 0 ? `${first} ${t("cancelledStudioRefund", { amt: money(c.refunded) })}` : first;
        }
        case "refunded":
          return c.full ? t("cancelledRefundFull", { amt: money(c.amount) }) : t("cancelledRefund", { amt: money(c.amount) });
        case "kept":
          return c.full ? t("cancelledKeptFull", { amt: money(c.amount) }) : t("cancelledKept", { amt: money(c.amount) });
        case "keptUse":
          return t("cancelledKeptUse");
        case "plain":
          return t("cancelledPlain");
      }
    }
    if (b.state === "lapsed") {
      const l = letGoLine(b);
      return l.word === "lateMoney" ? t("letGoMoney", { amt: money(l.amount) }) : t("letGoTitle", { n: studio.holdMin });
    }
    if (b.state === "no_show") return t("missedLine");
    return null;
  };

  const lineText = line();
  const badge = status === "booked" || status === "done" ? "pos" : status === "paying" ? "warn" : status === "cancelled" || status === "letGo" || status === "missed" ? "mute" : "";
  const icon = status === "paying" ? "hourglass" : status === "cancelled" ? "calendar-x" : status === "letGo" ? "timer-off" : status === "missed" ? "calendar-off" : "circle-check";
  const statusWord = { booked: "stBooked", paying: "stPaying", done: "stDone", missed: "stMissed", cancelled: "stCancelled", letGo: "stLetGo", offered: "stOffered" } as const;
  const policy = () => {
    if (b.state !== "booked" || !free || b.freeUntil === null) return null;
    const keeps = keptOnLate(b);
    const after = keeps === "deposit" ? t("policyDeposit") : keeps === "payment" ? t("policyFull") : keeps === "use" ? t("policyUse") : null;
    return [t("freeUntil", { when: fmtMoment(clock, b.freeUntil) }), after].filter((x) => x !== null).join(" ");
  };
  const policyText = policy();
  const payLabel = b.payMode === "full" ? t("payFullAmt", { amt: money(b.payDue) }) : t("payDepAmt", { amt: money(b.payDue) });

  return (
    <main id="lm-main" className="lm-narrow-page" style={{ maxWidth: 680 }}>
      <div className="lm-col" style={{ alignItems: "center", textAlign: "center", gap: 12, marginBottom: 22 }}>
        <div className={`lm-badge ${badge}`}>
          <Icon name={icon} size={28} />
        </div>
        <h1 className="lm-title">{title()}</h1>
        {lineText === null ? null : (
          <p role="status" className="lm-muted" style={{ fontSize: 15, lineHeight: 1.55, maxWidth: 460, textWrap: "pretty" }}>
            {lineText}
          </p>
        )}
      </div>
      <div className="lm-card" style={{ overflow: "hidden", marginBottom: 18 }}>
        <div className="lm-bk-head">
          <Tile icon={category?.icon ?? "sparkles"} size={48} iconSize={22} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{serviceName}</div>
            <div className="lm-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
              {t("code")}{" "}
              <span className="lm-mono6" style={{ color: "var(--fg)" }}>
                {code}
              </span>
            </div>
          </div>
          <span className={`lm-status ${status}`}>{t(statusWord[status])}</span>
        </div>
        <dl className="lm-bk-rows">
          {name !== "" && !fresh ? (
            <div>
              <dt>{t("rName")}</dt>
              <dd>{name}</dd>
            </div>
          ) : null}
          <div>
            <dt>{t("rWhat")}</dt>
            <dd>{serviceName}</dd>
          </div>
          <div>
            <dt>{t("rWho")}</dt>
            <dd>{whoName}</dd>
          </div>
          <div>
            <dt>{t("rWhen")}</dt>
            <dd className="lm-mono">{fmtWhen(clock, b.startsAt, minutes)}</dd>
          </div>
          <div>
            <dt>{t("rWhere")}</dt>
            <dd>{where}</dd>
          </div>
          <div>
            <dt>{t("rPaid")}</dt>
            <dd>{paidWords()}</dd>
          </div>
        </dl>
        {policyText === null ? null : (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "14px 20px 18px", fontSize: 13.5, lineHeight: 1.5 }}>
            <Icon name="calendar-check" size={16} />
            <span>{policyText}</span>
          </div>
        )}
        {late ? (
          <div className="lm-note warn" style={{ margin: "14px 20px 18px" }}>
            <Icon name="info" size={16} />
            <span>
              {t("tooLate")}{" "}
              <a href={`mailto:${studio.email}`} dir="ltr" style={{ fontWeight: 700 }}>
                {studio.email}
              </a>
            </span>
          </div>
        ) : null}
      </div>

      {problem === null ? null : (
        <div role="alert" className="lm-note danger" style={{ marginBottom: 14 }}>
          <Icon name="circle-alert" size={16} />
          {problem}
        </div>
      )}

      {fresh ? (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
            <a className="lm-btn primary mid" style={{ flex: "1 1 160px" }} {...(cal === null ? { "aria-disabled": true } : { href: `data:text/calendar;charset=utf-8,${encodeURIComponent(cal.ics)}`, download: `${code}.ics` })}>
              <Icon name="calendar-plus" size={16} />
              {t("addCal")}
            </a>
            {cal === null ? null : (
              <>
                <a className="lm-btn mid" style={{ flex: "1 1 140px" }} href={cal.google} target="_blank" rel="noopener noreferrer">
                  Google Calendar
                </a>
                <a className="lm-btn mid" style={{ flex: "1 1 120px" }} href={cal.outlook} target="_blank" rel="noopener noreferrer">
                  Outlook
                </a>
              </>
            )}
          </div>
          <button type="button" className="lm-btn mid wide" onClick={() => go("/b", { replace: true })}>
            {t("manage")}
            <Icon name="arrow-right" size={15} />
          </button>
          {email === "" ? null : (
            <p className="lm-muted" style={{ marginTop: 16, textAlign: "center", fontSize: 13.5 }}>
              {t("emailed", { email })}
            </p>
          )}
        </>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {actions.includes("pay") ? (
            <button type="button" className="lm-btn primary mid" style={{ flex: "1 1 160px" }} disabled={paying} onClick={() => void startPay()}>
              <Icon name={paying ? "loader-circle" : "lock"} size={16} {...(paying ? { className: "lm-spin" } : {})} />
              {b.payDue > 0 ? payLabel : t("confirm")}
            </button>
          ) : null}
          {actions.includes("move") ? (
            <button type="button" className="lm-btn mid" style={{ flex: "1 1 140px" }} onClick={onMove}>
              <Icon name="calendar-clock" size={16} />
              {t("move")}
            </button>
          ) : null}
          {actions.includes("cancel") ? (
            <button type="button" className="lm-btn mid" style={{ flex: "1 1 140px" }} onClick={askCancel}>
              <Icon name="calendar-x" size={16} />
              {t("cancel")}
            </button>
          ) : null}
          {actions.includes("review") ? (
            <button type="button" className="lm-btn primary mid" style={{ flex: "1 1 140px" }} onClick={onReview}>
              <Icon name="star" size={16} />
              {t("howWas")}
            </button>
          ) : null}
          {actions.includes("bookAgain") ? (
            <button type="button" className="lm-btn mid" style={{ flex: "1 1 140px" }} onClick={() => go(`/book?service=${String(row["service_id"])}`)}>
              <Icon name="rotate-ccw" size={16} />
              {t("bookAgain")}
            </button>
          ) : null}
        </div>
      )}
    </main>
  );
}

function Offer({ row, onChange }: { row: Row; onChange: () => Promise<void> }) {
  const { t, clock, studio, door, go, now } = useApp();
  const [busy, setBusy] = useState(false);
  const [gone, setGone] = useState(false);
  const service = studio.services.find((s) => s.id === String(row["service_id"]));
  const person = studio.team.find((p) => p.id === String(row["team_id"] ?? ""));
  const start = String(row["starts_at"]);
  const day = fmtDay(clock, dayOf(clock, start));
  const time = fmtTime(clock, minutesOf(clock, start));
  const due = n(row["pay_due"]);
  const until = row["offer_until"] ? new Date(String(row["offer_until"])).getTime() : 0;
  const open = !gone && until > now();
  const name = firstName(row["name"]);

  const take = async () => {
    setBusy(true);
    try {
      const paying = due > 0;
      await door.takeOffer(row["id"], paying);
      if (paying) {
        const url = await door.startPaying(row["id"], false);
        rememberPayReturn("/b");
        window.location.assign(url);
        return;
      }
      go("/b?new=1", { replace: true });
      await onChange();
    } catch {
      setGone(true);
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <main id="lm-main" className="lm-narrow-page" style={{ maxWidth: 560 }}>
        <div role="status" className="lm-empty">
          <div className="lm-empty-mark">
            <Icon name="hourglass" size={24} />
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.02em", textWrap: "balance" }}>{t("offerGoneTitle")}</h1>
          <p className="lm-muted" style={{ fontSize: 14, lineHeight: 1.55, maxWidth: 360 }}>
            {t("offerGoneLine", { day })}
          </p>
          <button type="button" className="lm-btn" onClick={() => go(`/book?service=${String(row["service_id"])}`)}>
            {t("seeOther")}
          </button>
        </div>
      </main>
    );
  }
  return (
    <main id="lm-main" className="lm-narrow-page" style={{ maxWidth: 560 }}>
      <div className="lm-card lm-col" style={{ borderRadius: 22, padding: "clamp(22px,4cqi,30px)", gap: 14 }}>
        <div className="lm-badge" style={{ width: 52, height: 52, borderRadius: 15 }}>
          <Icon name="bell-ring" size={24} />
        </div>
        {name === "" ? null : (
          <div className="lm-muted" style={{ fontSize: 14, fontWeight: 600 }}>
            {t("offerHi", { name })}
          </div>
        )}
        <h1 style={{ fontSize: "clamp(22px,3.4cqi,28px)", fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.25, textWrap: "balance" }}>
          {person === undefined ? t("offerTitleAnyone", { svc: service?.name ?? "", day, time }) : t("offerTitle", { svc: service?.name ?? "", day, time, who: person.name })}
        </h1>
        <p className="lm-muted" style={{ fontSize: 14, lineHeight: 1.55 }}>
          {`${t("offerLine")} ${due > 0 ? t("offerDeposit", { n: studio.holdMin }) : t("offerStudio")} ${t("offerUntil", { when: fmtMoment(clock, String(row["offer_until"])) })}`}
        </p>
        <dl className="lm-dl">
          <div>
            <dt>{t("rLen")}</dt>
            <dd className="lm-mono">{t("minutes", { n: n(row["minutes"]) || (service?.minutes ?? 0) })}</dd>
          </div>
          <div>
            <dt>{t("rPrice")}</dt>
            <dd className="lm-mono6">{fmtMoney(clock, row["price"] ?? service?.price)}</dd>
          </div>
          <div>
            <dt>{t("rPay")}</dt>
            <dd>{due > 0 ? t("payDeposit", { amt: fmtMoney(clock, due) }) : t("payStudio")}</dd>
          </div>
        </dl>
        <button type="button" className="lm-btn primary large" disabled={busy} onClick={() => void take()}>
          {due > 0 ? t("payToBook", { amt: fmtMoney(clock, due) }) : t("bookIt")}
        </button>
      </div>
    </main>
  );
}
