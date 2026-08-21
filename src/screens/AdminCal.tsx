/*
 * CALENDAR (view: 'admin-cal') — the diary the studio works out of.
 *
 * One scrolling grid: a time gutter, then a column per specialist (or per
 * room, or per day in week mode). Blocks are absolutely positioned inside
 * their column from `DAY_START` + `ROW` pixels per half hour, and overlapping
 * bookings are packed into lanes so a double-booked chair still reads.
 *
 * Dragging a block moves it in half-hour steps and tells the guest. The comp
 * did that with `mousedown` + two document listeners; this uses pointer
 * events with capture, so it works with a finger and a pen as well, and the
 * same move is on Arrow Up / Arrow Down for anyone who is not using a mouse
 * at all.
 *
 * The page heading lives in `StudioChrome`'s topbar — this file renders the
 * body only.
 */

import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { useMemo, useState } from "react";

import { Avatar, Chip, Icon, Segmented } from "../components/index.ts";
import { data } from "../data/source.ts";
import type { Weekday } from "../data/types.ts";
import type { ApptStatus, StudioAppt } from "../data/screens/admin-today.ts";
import {
  apptStatus,
  clampedNow,
  DAY_END,
  DAY_START,
  dollars,
  effStart,
  FALLBACK_TINT,
  hoursLabel,
  NEXT_STATUS,
  PANEL_ACTION,
  ROW,
  STATUS_META,
  STUDIO_BOOK,
} from "../data/screens/admin-today.ts";
import {
  CLIENT_LEDGER,
  hash,
  RECENT_VISITS,
  ROOMS,
} from "../data/screens/admin-cal.ts";
import {
  durationLabel,
  formatMediumISO,
  formatWeekdayDate,
  minutesToTime,
  monthName,
  weekdayName,
} from "../lib/format.ts";
import { useI18n, useT } from "../i18n/index.tsx";
import { useStore } from "../state/store.ts";

import "../styles/screen-admin-cal.css";

type CalMode = "day" | "week";

/** A drag in flight: which block, and how many minutes it has moved. */
interface Drag {
  id: string;
  delta: number;
}

interface CalBlock {
  id: string;
  client: string;
  /** Service line — gains the specialist's name in week mode. */
  svc: string;
  time: string;
  status: ApptStatus;
  tint: string | null;
  top: number;
  height: number;
  lane: number;
  lanes: number;
  dragging: boolean;
}

interface CalCol {
  id: string;
  name: string;
  initials: string;
  sub: string;
  /** `null` in week mode, where the column is a date rather than a person. */
  tint: string | null;
  isToday: boolean;
  blocks: CalBlock[];
}

/** A column before its blocks are laid out. */
type ColSource = Omit<CalCol, "blocks"> & { items: StudioAppt[] };

export default function AdminCal() {
  const dayOff = useStore((s) => s.dayOff);
  const staffFilter = useStore((s) => s.staffFilter);
  const selAppt = useStore((s) => s.selAppt);
  const apptState = useStore((s) => s.apptState);
  const apptTime = useStore((s) => s.apptTime);
  const calMode = useStore((s) => s.calMode);
  const rooms = useStore((s) => s.rooms);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const { locale, t, number } = useI18n();
  const [drag, setDrag] = useState<Drag | null>(null);

  const modes: readonly { value: CalMode; label: string }[] = useMemo(
    () => [
      { value: "day", label: t("screensA.cal.day") },
      { value: "week", label: t("screensA.cal.week") },
    ],
    [t],
  );

  const staff = data.getStaff();
  const mode: CalMode = calMode === "week" ? "week" : "day";
  const week = mode === "week";
  /* A block can only be moved in the plain day view: the room and week grids
   * put more than one chair in a column, so a vertical drop is ambiguous. */
  const movable = !week && !rooms;

  const day = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + dayOff);
    return d;
  }, [dayOff]);

  const dayLabel = formatWeekdayDate(day);
  const headLabel = week
    ? t("screensA.cal.weekOf", { date: dayLabel })
    : dayOff === 0
      ? t("screensA.cal.todayDate", { date: dayLabel })
      : dayLabel;

  /* Read once per mount: a "now" line that moved between renders would be
   * more distracting than one that is a few minutes stale. */
  const nowTop = useMemo(() => ((clampedNow() - DAY_START) / 30) * ROW, []);

  /* One label per bookable hour. The comp looped `<=` DAY_END and drew a
   * twelfth, empty hour below closing time; the grid now ends when the studio
   * does, which is also what the block coordinate space assumes. */
  const hours = useMemo(() => {
    const out: number[] = [];
    for (let m = DAY_START; m < DAY_END; m += 60) out.push(m);
    return out;
  }, []);

  const cols: CalCol[] = useMemo(() => {
    const durOf = (id: string) => data.getService(id)?.dur ?? 60;
    const nameOf = (id: string) =>
      data.getService(id)?.name ?? t("screensA.cal.appointment");
    const staffOf = (id: string) => staff.find((s) => s.id === id);

    /* Another day carries a hashed two-thirds of the book, so paging around
     * looks lived-in without seeding a second week — and lands on the same
     * answer every time you page back. */
    const onDay = STUDIO_BOOK.filter(
      (a) => dayOff === 0 || hash(a.id + dayOff) % 3 !== 0,
    );

    let src: ColSource[];
    if (week) {
      const base = new Date(day);
      base.setDate(day.getDate() - ((day.getDay() + 6) % 7));
      src = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        return {
          id: `d${i}`,
          name: weekdayName(d.getDay(), "short"),
          initials: String(d.getDate()),
          sub: monthName(d.getMonth(), "short"),
          tint: null,
          isToday: d.toDateString() === new Date().toDateString(),
          items: STUDIO_BOOK.filter(
            (a) =>
              hash(`${a.id}w${i}`) % 3 !== 0 &&
              (staffFilter === "all" || a.staff === staffFilter),
          ),
        };
      });
    } else if (rooms) {
      src = ROOMS.map((r) => ({
        id: r.id,
        name: t(r.nameKey, r.n === undefined ? undefined : { n: number(r.n) }),
        initials: r.initials,
        sub: "room",
        tint: r.tint,
        isToday: dayOff === 0,
        items: onDay.filter(
          (a) =>
            r.svcs.includes(a.svc) &&
            (staffFilter === "all" || a.staff === staffFilter),
        ),
      }));
    } else {
      src = staff
        .filter((s) => staffFilter === "all" || staffFilter === s.id)
        .map((s) => ({
          id: s.id,
          name: s.name,
          initials: s.initials,
          sub: hoursLabel(s, day.getDay() as Weekday),
          tint: s.tint,
          isToday: dayOff === 0,
          items: onDay.filter((a) => a.staff === s.id),
        }));
    }

    return src.map((col) => {
      const sorted = col.items
        .slice()
        .sort((x, y) => effStart(x, apptTime) - effStart(y, apptTime));

      /* Greedy lane packing: an appointment takes the first lane whose last
       * booking has already finished. */
      const laneEnd: number[] = [];
      const laneOf: Record<string, number> = {};
      for (const it of sorted) {
        const s = effStart(it, apptTime);
        const e = s + durOf(it.svc);
        let li = 0;
        while (laneEnd[li] != null && laneEnd[li] > s) li += 1;
        laneEnd[li] = e;
        laneOf[it.id] = li;
      }
      const lanes = Math.max(1, laneEnd.length);

      return {
        id: col.id,
        name: col.name,
        initials: col.initials,
        sub: col.sub,
        tint: col.tint,
        isToday: col.isToday,
        blocks: sorted.map((a) => {
          const dur = durOf(a.svc);
          const dragging = drag !== null && drag.id === a.id;
          const start =
            effStart(a, apptTime) + (drag && drag.id === a.id ? drag.delta : 0);
          const member = staffOf(a.staff);
          return {
            id: a.id,
            client: a.client,
            svc: week ? `${nameOf(a.svc)} · ${member?.name ?? ""}` : nameOf(a.svc),
            time: `${minutesToTime(start)} – ${minutesToTime(start + dur)}`,
            status: apptStatus(a, apptState),
            tint: rooms || week ? col.tint : (member?.tint ?? FALLBACK_TINT),
            top: ((start - DAY_START) / 30) * ROW + 2,
            height: (dur / 30) * ROW - 4,
            lane: laneOf[a.id],
            lanes,
            dragging,
          };
        }),
      };
    });
  /* `locale` is a dependency of every memo that formats: the formatters
   * read it from the ambient bridge, so a switch that did not invalidate
   * these would leave the last locale’s text cached on screen. */
  }, [apptState, apptTime, day, dayOff, drag, rooms, staff, staffFilter, week, locale, t]);

  /* ---------------- moving a block ---------------- */

  function move(id: string, deltaMin: number): void {
    const a = STUDIO_BOOK.find((x) => x.id === id);
    if (!a) return;
    const dur = data.getService(a.svc)?.dur ?? 60;
    const from = effStart(a, apptTime);
    const to = Math.max(DAY_START, Math.min(DAY_END - dur, from + deltaMin));
    /* Clamped against the end of the day, a drag can end where it started. */
    if (to === from) return;
    set({ apptTime: { ...apptTime, [id]: to }, selAppt: id });
    showToast(
      t("screensA.cal.moved", { client: a.client, time: minutesToTime(to) }),
      "ok",
    );
  }

  function onBlockDown(e: PointerEvent<HTMLButtonElement>, id: string): void {
    if (!movable || e.button !== 0) return;
    const el = e.currentTarget;
    const y0 = e.clientY;
    let last = 0;
    el.setPointerCapture(e.pointerId);
    setDrag({ id, delta: 0 });

    const onMove = (ev: globalThis.PointerEvent) => {
      const d = Math.round((ev.clientY - y0) / ROW) * 30;
      if (d !== last) {
        last = d;
        setDrag({ id, delta: d });
      }
    };
    const onUp = () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      setDrag(null);
      if (last !== 0) move(id, last);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  }

  function onBlockKey(e: KeyboardEvent<HTMLButtonElement>, id: string): void {
    if (!movable) return;
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    move(id, e.key === "ArrowUp" ? -30 : 30);
  }

  /* ---------------- the selected appointment ---------------- */

  const sel = STUDIO_BOOK.find((a) => a.id === selAppt);

  return (
    <div className={`scr-admin-cal${sel ? " is-split" : ""}`}>
      <div className="scr-admin-cal__main">
        <div className="scr-admin-cal__bar">
          <div className="scr-admin-cal__nav">
            <button
              type="button"
              className="bk-gi scr-admin-cal__navbtn"
              onClick={() => set({ dayOff: dayOff - 1 })}
              aria-label={t(week ? "screensA.cal.prevWeek" : "screensA.cal.prevDay")}
            >
              <Icon name="chevron-left" size={16} />
            </button>
            <button
              type="button"
              className="bk-gi scr-admin-cal__today"
              onClick={() => set({ dayOff: 0 })}
            >
              {t("screensA.cal.today")}
            </button>
            <button
              type="button"
              className="bk-gi scr-admin-cal__navbtn"
              onClick={() => set({ dayOff: dayOff + 1 })}
              aria-label={t(week ? "screensA.cal.nextWeek" : "screensA.cal.nextDay")}
            >
              <Icon name="chevron-right" size={16} />
            </button>
          </div>

          <h2 className="scr-admin-cal__daylabel">{headLabel}</h2>

          <Segmented<CalMode>
            options={modes}
            value={mode}
            onChange={(v) => set({ calMode: v })}
            label={t("screensA.cal.range")}
            className="scr-admin-cal__modes"
          />

          <button
            type="button"
            className="scr-admin-cal__rooms"
            data-active={rooms ? "true" : "false"}
            aria-pressed={rooms}
            onClick={() => set({ rooms: !rooms })}
          >
            <Icon name="door-open" size={15} />
            {t("screensA.cal.rooms")}
          </button>

          <div className="scr-admin-cal__chips">
            <Chip
              label={t("screensA.cal.everyone")}
              active={staffFilter === "all"}
              onClick={() => set({ staffFilter: "all" })}
              className="scr-admin-cal__chip"
            />
            {staff.map((s) => (
              <Chip
                key={s.id}
                label={s.name}
                active={staffFilter === s.id}
                onClick={() => set({ staffFilter: s.id })}
                className="scr-admin-cal__chip"
              />
            ))}
          </div>
        </div>

        {/* The half-hour row height is handed to CSS rather than duplicated
            there, so the pixels a drag snaps to and the pixels the grid draws
            can never disagree. */}
        <div
          className="bk-scroll scr-admin-cal__grid"
          style={{ "--row": `${ROW}px` } as CSSProperties}
        >
          <div className="scr-admin-cal__heads">
            <div className="scr-admin-cal__gutterhead" />
            {cols.map((c) => (
              <div key={c.id} className="scr-admin-cal__head">
                {c.tint === null ? (
                  <span className="scr-admin-cal__daynum">{c.initials}</span>
                ) : (
                  <Avatar
                    initials={c.initials}
                    tint={c.tint}
                    size={26}
                    fontSize={10}
                    radius={999}
                  />
                )}
                <span className="scr-admin-cal__headid">
                  <span className="scr-admin-cal__headname">{c.name}</span>
                  <span className="scr-admin-cal__headsub">{c.sub}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="scr-admin-cal__body">
            <div className="scr-admin-cal__gutter">
              {hours.map((h) => (
                <div key={h} className="bk-mono scr-admin-cal__hour">
                  {minutesToTime(h).replace(":00", "")}
                </div>
              ))}
            </div>

            {cols.map((c) => (
              <div key={c.id} className="scr-admin-cal__col">
                {hours.map((h) => (
                  <div key={h} className="scr-admin-cal__line" />
                ))}

                {/* The comp drew the current time over the first column only,
                    which read as a stray mark; it now runs the width of the
                    diary, with the dot on the leading edge. */}
                {c.isToday && !week ? (
                  <div
                    className="scr-admin-cal__now"
                    style={{ "--now-top": `${nowTop}px` } as CSSProperties}
                  >
                    {c.id === cols[0].id ? (
                      <span className="scr-admin-cal__nowdot" />
                    ) : null}
                  </div>
                ) : null}

                {c.blocks.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    className="scr-admin-cal__blk"
                    data-status={b.status}
                    data-selected={b.id === selAppt ? "true" : "false"}
                    data-dragging={b.dragging ? "true" : "false"}
                    data-movable={movable ? "true" : "false"}
                    style={
                      {
                        "--top": `${b.top}px`,
                        "--blk-h": `${b.height}px`,
                        "--lane": b.lane,
                        "--lanes": b.lanes,
                        ...(b.tint ? { "--tint": b.tint } : null),
                      } as CSSProperties
                    }
                    onPointerDown={(e) => onBlockDown(e, b.id)}
                    onKeyDown={(e) => onBlockKey(e, b.id)}
                    onClick={() => set({ selAppt: b.id })}
                  >
                    <span className="scr-admin-cal__blkclient">{b.client}</span>
                    <span className="bk-mono scr-admin-cal__blktime">{b.time}</span>
                    <span className="scr-admin-cal__blksvc">{b.svc}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {sel ? <SelectedPanel appt={sel} /> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The appointment panel (local to this screen)
 * ------------------------------------------------------------------ */

function SelectedPanel({ appt }: { appt: StudioAppt }) {
  const t = useT();
  const apptState = useStore((s) => s.apptState);
  const apptTime = useStore((s) => s.apptTime);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const svc = data.getService(appt.svc);
  const member = data.getStaffMember(appt.staff);
  const status = apptStatus(appt, apptState);
  const meta = STATUS_META[status];
  const ledger = CLIENT_LEDGER[appt.client];
  const primary = PANEL_ACTION[status];

  function moveStatus(next: ApptStatus, kind: "ok" | "warn" = "ok"): void {
    set({ apptState: { ...apptState, [appt.id]: next } });
    showToast(
      t("screensA.cal.statusToast", {
        client: appt.client,
        status: t(STATUS_META[next].labelKey),
      }),
      kind,
    );
  }

  const rows = [
    {
      icon: "sparkles",
      label: t("screensA.cal.rowService"),
      value: svc?.name ?? "—",
      mono: false,
    },
    {
      icon: "clock",
      label: t("screensA.cal.rowTime"),
      value: t("screensA.cal.timeValue", {
        time: minutesToTime(effStart(appt, apptTime)),
        duration: durationLabel(svc?.dur ?? 0),
      }),
      mono: true,
    },
    {
      icon: "user",
      label: t("screensA.cal.rowWith"),
      value: member?.name ?? "—",
      mono: false,
    },
    {
      icon: "credit-card",
      label: t("screensA.cal.rowPrice"),
      value: dollars(svc?.price ?? 0),
      mono: true,
    },
    /* Booking codes are `LMN-` app-wide; the comp's own prefix predates the
     * rename. */
    {
      icon: "hash",
      label: t("screensA.cal.rowRef"),
      value: `LMN-1${appt.id.replace("A", "0")}`,
      mono: true,
    },
  ];

  return (
    <aside
      className="scr-admin-cal__panel"
      aria-label={t("screensA.cal.appointment")}
    >
      <div className="scr-admin-cal__panelhead">
        <h2 className="scr-admin-cal__paneltitle">
          {t("screensA.cal.appointment")}
        </h2>
        <button
          type="button"
          className="bk-gi scr-admin-cal__close"
          onClick={() => set({ selAppt: null })}
          aria-label={t("screensA.cal.close")}
        >
          <Icon name="x" size={15} />
        </button>
      </div>

      <div className="scr-admin-cal__panelbody">
        <div className="scr-admin-cal__guest">
          <Avatar
            initials={appt.ci}
            tint={member?.tint ?? FALLBACK_TINT}
            size={44}
            fontSize={15}
            radius={999}
          />
          <span className="scr-admin-cal__guestid">
            <span className="scr-admin-cal__guestname">{appt.client}</span>
            <span className="scr-admin-cal__guestmeta">
              {ledger
                ? t("screensA.cal.guestMeta", {
                    visits: t("count.visit", {}, ledger.visits),
                    spend: dollars(ledger.spend),
                  })
                : t("screensA.cal.newGuest")}
            </span>
          </span>
          <span className="scr-admin-cal__pill" data-tone={meta.tone}>
            {t(meta.labelKey)}
          </span>
        </div>

        <dl className="scr-admin-cal__rows">
          {rows.map((r) => (
            <div key={r.label} className="scr-admin-cal__row">
              <Icon name={r.icon} size={14} className="scr-admin-cal__rowicon" />
              <dt className="scr-admin-cal__rowlabel">{r.label}</dt>
              <dd className={`scr-admin-cal__rowval${r.mono ? " bk-mono" : ""}`}>
                {r.value}
              </dd>
            </div>
          ))}
        </dl>

        {appt.note ? (
          <p className="scr-admin-cal__note">
            <Icon name="sticky-note" size={15} className="scr-admin-cal__noteicon" />
            {appt.note}
          </p>
        ) : null}

        <div className="scr-admin-cal__actions">
          <button
            type="button"
            className="bk-btn scr-admin-cal__action"
            data-kind="primary"
            onClick={() => moveStatus(NEXT_STATUS[status])}
          >
            <Icon name={primary.icon} size={15} />
            {t(primary.labelKey)}
          </button>
          <button
            type="button"
            className="bk-gi scr-admin-cal__action"
            onClick={() => showToast(t("screensA.cal.addProductToast"), "ok")}
          >
            <Icon name="plus" size={15} />
            {t("screensA.cal.addProduct")}
          </button>
          <button
            type="button"
            className="bk-gi scr-admin-cal__action"
            onClick={() => showToast(t("screensA.cal.rescheduleToast"), "warn")}
          >
            <Icon name="calendar-clock" size={15} />
            {t("screensA.cal.reschedule")}
          </button>
          <button
            type="button"
            className="bk-gi scr-admin-cal__action"
            data-kind="danger"
            onClick={() => {
              set({ apptState: { ...apptState, [appt.id]: "cancelled" } });
              showToast(t("screensA.cal.cancelledToast"), "warn");
            }}
          >
            <Icon name="x" size={15} />
            {t("screensA.cal.cancelBooking")}
          </button>
        </div>

        <div>
          <span className="scr-admin-cal__eyebrow">
            {t("screensA.cal.recentVisits")}
          </span>
          {/* The comp listed the same three visits under every guest, first-
              timers included. A guest with no history now says so. */}
          {ledger && ledger.visits > 1 ? (
            <ul className="scr-admin-cal__history">
              {RECENT_VISITS.slice(0, 3).map((h) => (
                <li key={h.svc} className="scr-admin-cal__visit">
                  <span className="scr-admin-cal__visitsvc">{h.svc}</span>
                  <span className="scr-admin-cal__visitdate">
                    {formatMediumISO(h.dateISO)}
                  </span>
                  <span className="bk-mono scr-admin-cal__visitamt">
                    {dollars(h.amount)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="scr-admin-cal__nohistory">
              {t("screensA.cal.noHistory")}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
