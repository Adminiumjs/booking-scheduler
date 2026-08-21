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
  ROW_ACTION_KEY,
  STATUS_META,
  STUDIO_BOOK,
} from "../data/screens/admin-today.ts";
import { useI18n } from "../i18n/index.tsx";
import { durationLabel, minutesToTime } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-admin-today.css";

/** A full shift, in minutes — the denominator for chair utilisation. */
const SHIFT = 8 * 60;

export default function AdminToday() {
  const { locale, t, number } = useI18n();
  const apptState = useStore((s) => s.apptState);
  const apptTime = useStore((s) => s.apptTime);
  const set = useStore((s) => s.set);
  const go = useStore((s) => s.go);
  const showToast = useStore((s) => s.showToast);

  const staff = data.getStaff();

  /* Read the clock once per mount rather than per render, so the header
   * reading cannot drift from the Calendar's "now" line mid-session. */
  /* `locale` is a dependency of every memo that formats: the formatters
   * read it from the ambient bridge, so a switch that did not invalidate
   * these would leave the last locale’s text cached on screen. */
  const nowLabel = useMemo(() => minutesToTime(clampedNow()), [locale]);
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
    const soldHours = Math.round(booked / 60);
    const capacityHours = Math.round(capacity / 60);
    const subs = [
      t("screensA.today.unconfirmed", {}, pend),
      t("screensA.today.vsLastWeek"),
      t("screensA.today.hoursSold", { sold: number(soldHours) }, capacityHours),
      t("screensA.today.waitlistMatches", {}, 2),
    ];
    const values = [
      number(live.length),
      dollars(revenue),
      number(booked / capacity, { style: "percent", maximumFractionDigits: 0 }),
      number(3),
    ];

    return {
      pending: pend,
      kpis: KPI_SEED.map((k, i) => ({
        ...k,
        label: t(k.labelKey),
        value: values[i],
        sub: subs[i],
        /* A signed number in the seed, a signed string here: `signDisplay`
         * draws the glyph the locale uses and puts it on the side it writes
         * it — `startsWith('+')` was a fact about English, not about growth. */
        delta:
          k.delta === null
            ? null
            : number(k.delta, {
                ...(k.deltaPercent
                  ? { style: "percent" as const, maximumFractionDigits: 0 }
                  : null),
                signDisplay: "exceptZero",
              }),
        up: (k.delta ?? 0) >= 0,
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
          sub: t("screensA.today.utilSub", {
            hours: number(Math.round((mins / 60) * 10) / 10, {
              style: "unit",
              unit: "hour",
              unitDisplay: "short",
            }),
            shift: hoursLabel(st, weekday),
          }),
        };
      }),
    };
  }, [apptState, apptTime, staff, weekday, locale, t, number]);

  /* Two of the four alerts hand the studio to another screen with its filter
   * already set — the comp's behaviour, and the reason these are handlers
   * here rather than links in the seed. */
  function runAlert(action: AlertAction): void {
    if (action === "waitlist") {
      showToast(t("screensA.today.waitlistToast"), "ok");
    } else if (action === "stock") {
      set({ stockFilter: "low" });
      go("admin-stock");
    } else if (action === "intake") {
      showToast(t("screensA.today.intakeToast", { name: "Jonah" }), "ok");
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
            <h2 className="scr-admin-today__paneltitle">
              {t("screensA.today.nowNext")}
            </h2>
            <span className="bk-mono scr-admin-today__clock">{nowLabel}</span>
          </header>

          {upcoming.length === 0 ? (
            <p className="scr-admin-today__empty">
              {t("screensA.today.allSeen")}
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
                        {t("screensA.today.rowMeta", {
                          service: svc?.name ?? "—",
                          staff: member?.name ?? "—",
                          duration: durationLabel(svc?.dur ?? 0),
                        })}
                      </span>
                    </span>
                    <span className="scr-admin-today__pill" data-tone={meta.tone}>
                      {t(meta.labelKey)}
                    </span>
                    <button
                      type="button"
                      className="bk-btn scr-admin-today__rowbtn"
                      onClick={() => {
                        set({ apptState: { ...apptState, [a.id]: next } });
                        showToast(
                          t("screensA.cal.statusToast", {
                            client: a.client,
                            status: t(STATUS_META[next].labelKey),
                          }),
                          "ok",
                        );
                      }}
                    >
                      {t(ROW_ACTION_KEY[status])}
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
              <h2 className="scr-admin-today__paneltitle">
                {t("screensA.today.decisions")}
              </h2>
              {pending > 0 ? (
                <span className="scr-admin-today__pill" data-tone="warn">
                  {t("screensA.today.toConfirm", { count: number(pending) })}
                </span>
              ) : null}
            </header>
            <ul className="scr-admin-today__list">
              {ALERT_SEED.map((al) => (
                <li key={al.action} className="scr-admin-today__alert">
                  <span
                    className="scr-admin-today__tile"
                    style={{ "--tint": al.tint } as CSSProperties}
                  >
                    <Icon name={al.icon} size={15} />
                  </span>
                  <span className="scr-admin-today__alertid">
                    <span className="scr-admin-today__alerttitle">
                      {t(al.titleKey, al.subParams, al.titleCount)}
                    </span>
                    <span className="scr-admin-today__alertsub">
                      {t(
                        al.subKey,
                        {
                          ...al.subParams,
                          ...(al.subTime === undefined
                            ? {}
                            : { time: minutesToTime(al.subTime) }),
                        },
                        al.subCount,
                      )}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="bk-gi scr-admin-today__alertbtn"
                    onClick={() => runAlert(al.action)}
                  >
                    {t(al.ctaKey)}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="scr-admin-today__panel">
            <header className="scr-admin-today__panelhead">
              <h2 className="scr-admin-today__paneltitle">
                {t("screensA.today.utilisation")}
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
                    <span className="bk-mono scr-admin-today__utilpct">
                      {number(u.pct / 100, { style: "percent" })}
                    </span>
                  </div>
                  <div
                    className="scr-admin-today__track"
                    role="progressbar"
                    aria-label={t("screensA.today.utilAria", { name: u.name })}
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
