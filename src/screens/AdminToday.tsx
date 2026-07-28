/*
 * TODAY (view: 'admin-today') — the studio half's opening screen.
 *
 * Four numbers, the next five guests, the decisions waiting on someone, and
 * how full each chair is. Everything is computed from the one shared book in
 * `data/screens/admin-today.ts`, so checking a guest in here also moves the
 * block on the Calendar.
 *
 * The page heading lives in `StudioChrome`'s topbar — this file renders the
 * body only.
 */

import type { CSSProperties } from "react";
import { useMemo } from "react";

import { Avatar, Icon } from "../components/index.ts";
import { data } from "../data/source.ts";
import type { Weekday } from "../data/types.ts";
import type { AlertAction } from "../data/screens/admin-today.ts";
import {
  ALERT_SEED,
  apptStatus,
  clampedNow,
  dollars,
  effStart,
  FALLBACK_TINT,
  hoursLabel,
  KPI_SEED,
  NEXT_STATUS,
  ROW_ACTION,
  STATUS_META,
  STUDIO_BOOK,
} from "../data/screens/admin-today.ts";
import { minutesToTime, plural } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-admin-today.css";

/** A full shift, in minutes — the denominator for chair utilisation. */
const SHIFT = 8 * 60;

export default function AdminToday() {
  const apptState = useStore((s) => s.apptState);
  const apptTime = useStore((s) => s.apptTime);
  const set = useStore((s) => s.set);
  const go = useStore((s) => s.go);
  const showToast = useStore((s) => s.showToast);

  const staff = data.getStaff();

  /* Read the clock once per mount rather than per render, so the header
   * reading cannot drift from the Calendar's "now" line mid-session. */
  const nowLabel = useMemo(() => minutesToTime(clampedNow()), []);
  const weekday = useMemo(() => new Date().getDay() as Weekday, []);

  const { kpis, upcoming, util, pending } = useMemo(() => {
    const live = STUDIO_BOOK.filter(
      (a) => apptStatus(a, apptState) !== "cancelled",
    );
    const durOf = (id: string) => data.getService(id)?.dur ?? 0;
    const priceOf = (id: string) => data.getService(id)?.price ?? 0;

    const revenue = live
      .filter((a) => apptStatus(a, apptState) === "done")
      .reduce((n, a) => n + priceOf(a.svc), 0);
    const booked = live.reduce((n, a) => n + durOf(a.svc), 0);
    const capacity = staff.length * SHIFT;
    const pend = live.filter((a) => apptStatus(a, apptState) === "pending").length;

    /* The comp hardcoded "2 still unconfirmed" while the book held one. The
     * sub-line now counts the rows the Confirm button actually empties. */
    const subs = [
      `${plural(pend, "booking")} still unconfirmed`,
      "vs. this time last Tuesday",
      `${Math.round(booked / 60)} of ${Math.round(capacity / 60)} hours sold`,
      "2 waitlist matches available",
    ];
    const values = [
      String(live.length),
      dollars(revenue),
      `${Math.round((booked / capacity) * 100)}%`,
      "3",
    ];

    return {
      pending: pend,
      kpis: KPI_SEED.map((k, i) => ({
        ...k,
        value: values[i],
        sub: subs[i],
        up: k.delta.startsWith("+"),
      })),
      /* Ordered and stamped by the *effective* start, so an appointment
       * dragged on the Calendar shows its new time here too — the comp read
       * the seeded start and the two screens drifted apart. */
      upcoming: live
        .filter((a) => apptStatus(a, apptState) !== "done")
        .slice()
        .sort((a, b) => effStart(a, apptTime) - effStart(b, apptTime))
        .slice(0, 5),
      util: staff.map((st) => {
        const mins = live
          .filter((a) => a.staff === st.id)
          .reduce((n, a) => n + durOf(a.svc), 0);
        return {
          id: st.id,
          name: st.name,
          tint: st.tint,
          pct: Math.min(100, Math.round((mins / SHIFT) * 100)),
          sub: `${Math.round((mins / 60) * 10) / 10} h booked · ${hoursLabel(st, weekday)}`,
        };
      }),
    };
  }, [apptState, apptTime, staff, weekday]);

  /* Two of the four alerts hand the studio to another screen with its filter
   * already set — the comp's behaviour, and the reason these are handlers
   * here rather than links in the seed. */
  function runAlert(action: AlertAction): void {
    if (action === "waitlist") {
      showToast("Offer texted to both guests", "ok");
    } else if (action === "stock") {
      set({ stockFilter: "low" });
      go("admin-stock");
    } else if (action === "intake") {
      showToast("Intake form texted to Jonah", "ok");
    } else {
      set({ revFilter: "todo" });
      go("admin-reviews");
    }
  }

  return (
    <div className="scr-admin-today">
      <div className="scr-admin-today__kpis">
        {kpis.map((k) => (
          <article key={k.label} className="scr-admin-today__kpi">
            <div className="scr-admin-today__kpihead">
              <span
                className="scr-admin-today__tile scr-admin-today__tile--sm"
                style={{ "--tint": k.tint } as CSSProperties}
              >
                <Icon name={k.icon} size={14} />
              </span>
              <span className="scr-admin-today__kpilabel">{k.label}</span>
            </div>
            <div className="scr-admin-today__kpirow">
              <span className="bk-mono scr-admin-today__kpivalue">{k.value}</span>
              {k.delta ? (
                <span
                  className="scr-admin-today__kpidelta"
                  data-dir={k.up ? "up" : "down"}
                >
                  {k.delta}
                </span>
              ) : null}
            </div>
            <span className="scr-admin-today__kpisub">{k.sub}</span>
          </article>
        ))}
      </div>

      <div className="scr-admin-today__cols">
        <section className="scr-admin-today__panel">
          <header className="scr-admin-today__panelhead">
            <h2 className="scr-admin-today__paneltitle">Now &amp; next</h2>
            <span className="bk-mono scr-admin-today__clock">{nowLabel}</span>
          </header>

          {upcoming.length === 0 ? (
            <p className="scr-admin-today__empty">
              Every guest on today’s book has been seen. Nice work.
            </p>
          ) : (
            <ul className="scr-admin-today__list">
              {upcoming.map((a) => {
                const status = apptStatus(a, apptState);
                const svc = data.getService(a.svc);
                const member = data.getStaffMember(a.staff);
                const meta = STATUS_META[status];
                const next = NEXT_STATUS[status];
                return (
                  <li key={a.id} className="scr-admin-today__row">
                    <span className="bk-mono scr-admin-today__rowtime">
                      {minutesToTime(effStart(a, apptTime))}
                    </span>
                    <Avatar
                      initials={a.ci}
                      tint={member?.tint ?? FALLBACK_TINT}
                      size={32}
                      fontSize={11}
                      radius={999}
                    />
                    <span className="scr-admin-today__rowid">
                      <span className="scr-admin-today__rowname">{a.client}</span>
                      <span className="scr-admin-today__rowmeta">
                        {svc?.name} · {member?.name} · {svc?.dur} min
                      </span>
                    </span>
                    <span className="scr-admin-today__pill" data-tone={meta.tone}>
                      {meta.label}
                    </span>
                    <button
                      type="button"
                      className="bk-btn scr-admin-today__rowbtn"
                      onClick={() => {
                        set({ apptState: { ...apptState, [a.id]: next } });
                        showToast(`${a.client} · ${STATUS_META[next].label}`, "ok");
                      }}
                    >
                      {ROW_ACTION[status]}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="scr-admin-today__side">
          <section className="scr-admin-today__panel">
            <header className="scr-admin-today__panelhead">
              <h2 className="scr-admin-today__paneltitle">Needs a decision</h2>
              {pending > 0 ? (
                <span className="scr-admin-today__pill" data-tone="warn">
                  {pending} to confirm
                </span>
              ) : null}
            </header>
            <ul className="scr-admin-today__list">
              {ALERT_SEED.map((al) => (
                <li key={al.title} className="scr-admin-today__alert">
                  <span
                    className="scr-admin-today__tile"
                    style={{ "--tint": al.tint } as CSSProperties}
                  >
                    <Icon name={al.icon} size={15} />
                  </span>
                  <span className="scr-admin-today__alertid">
                    <span className="scr-admin-today__alerttitle">{al.title}</span>
                    <span className="scr-admin-today__alertsub">{al.sub}</span>
                  </span>
                  <button
                    type="button"
                    className="bk-gi scr-admin-today__alertbtn"
                    onClick={() => runAlert(al.action)}
                  >
                    {al.cta}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="scr-admin-today__panel">
            <header className="scr-admin-today__panelhead">
              <h2 className="scr-admin-today__paneltitle">
                Chair utilisation today
              </h2>
            </header>
            <div className="scr-admin-today__util">
              {util.map((u) => (
                <div key={u.id} className="scr-admin-today__utilrow">
                  <div className="scr-admin-today__utilhead">
                    <span
                      className="scr-admin-today__dot"
                      style={{ "--tint": u.tint } as CSSProperties}
                    />
                    <span className="scr-admin-today__utilname">{u.name}</span>
                    <span className="bk-mono scr-admin-today__utilpct">{u.pct}%</span>
                  </div>
                  <div
                    className="scr-admin-today__track"
                    role="progressbar"
                    aria-label={`${u.name} booked`}
                    aria-valuenow={u.pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span
                      className="scr-admin-today__bar"
                      style={
                        { "--tint": u.tint, inlineSize: `${u.pct}%` } as CSSProperties
                      }
                    />
                  </div>
                  <span className="scr-admin-today__utilsub">{u.sub}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
