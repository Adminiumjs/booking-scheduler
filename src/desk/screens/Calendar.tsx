/**
 * K2 Calendar (comp L2 122–200): the day by person, a week for one person, and
 * on a phone a list diary. A block is a booking with its clean-up as a pale
 * tail; breaks are hatched; time off and calendar busy times are grey and carry
 * their source, never a title.
 *
 * A drop is judged by Adminium's free times. Refused, the block springs back
 * with the reason; accepted, the Move sheet opens filled in, and only "Move
 * here" sends anything (R3).
 */
import { ChevronLeft, ChevronRight, CircleCheck, TriangleAlert, Undo2 } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties, type DragEvent, type MouseEvent } from "react";

import { useData, useEnv } from "../env.tsx";
import type { BusyBlock, DeskData } from "../door.ts";
import { byId, endOf, firstName, gridHours, kindOf, ON_THE_DAY, personDay, shortName, startOf, whyRefused, type DropRefusal, type PersonDay } from "../facts.ts";
import { useFmt, type Fmt } from "../format.ts";
import { useDeskT, type DeskT } from "../i18n/index.ts";
import { newBooking, openBooking, useDesk } from "../store.ts";
import { addDays, dayIn, instantOf, minuteOfDay, weekdayOf } from "../time.ts";
import { Fig } from "../ui.tsx";
import { num, same, text, type Id, type Row } from "../wire.ts";
import { Avatar, kindTone, kindWord, StateChip } from "./parts.tsx";

const PX_PER_MINUTE = 1;
const clockOf = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

export function usePhone(): boolean {
  const query = "(max-width: 639px)";
  const [phone, setPhone] = useState(() => typeof window.matchMedia === "function" && window.matchMedia(query).matches);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const list = window.matchMedia(query);
    const on = () => setPhone(list.matches);
    on();
    list.addEventListener("change", on);
    return () => list.removeEventListener("change", on);
  }, []);
  return phone;
}

function refusalSentence(t: DeskT, fmt: Fmt, day: string, zone: string, r: DropRefusal): string {
  const at = (minute: number) => fmt.time(instantOf(day, clockOf(minute), zone));
  switch (r.why) {
    case "notTheirs":
      return t("drop.notTheirs", { who: r.who, service: r.service });
    case "off":
      return t("drop.off", { who: r.who });
    case "hours":
      return t("drop.hours", { who: r.who, range: fmt.range(instantOf(day, clockOf(r.from), zone), instantOf(day, clockOf(r.to), zone)) });
    case "break":
      return t("drop.break", { who: r.who, time: at(r.at) });
    case "past":
      return t("drop.past");
    case "booking":
      return t("drop.booking", { who: r.who, time: fmt.time(r.at), service: r.service });
    case "busy":
      return t("drop.busy", { who: r.who });
    case "timeOff":
      return t("drop.timeOff", { who: r.who });
    case "taken":
      return t("drop.taken");
  }
}

/** The busy blocks of the people and days on screen, read again when the rows are. */
function useBusy(people: readonly Row[], from: string, to: string, stamp: unknown): Record<string, BusyBlock[]> {
  const { door } = useEnv();
  const ids = people.map((p) => String(p.id)).join(",");
  const [busy, setBusy] = useState<Record<string, BusyBlock[]>>({});
  useEffect(() => {
    let live = true;
    void Promise.all(ids.split(",").filter((id) => id !== "").map(async (id) => [id, await door.busy(id, from, addDays(to, 1)).catch(() => [])] as const)).then((pairs) => {
      if (live) setBusy(Object.fromEntries(pairs));
    });
    return () => {
      live = false;
    };
  }, [door, ids, from, to, stamp]);
  return busy;
}

function offWord(t: DeskT, off: Extract<PersonDay, { off: string }>): string {
  if (off.why !== null) return off.why;
  return t(off.off === "closed" ? "calendar.closed" : off.off === "notWorking" ? "calendar.notWorking" : "calendar.dayOff");
}

interface ColumnProps {
  person: Row;
  day: string;
  title: string;
  hours: { from: number; to: number };
  busy: BusyBlock[];
  ghost: { minute: number; height: number } | null;
  spring: Id | null;
  onDrop: (person: Row, day: string, minute: number) => void;
}

function Column({ person, day, title, hours, busy, ghost, spring, onDrop }: ColumnProps) {
  const { door } = useEnv();
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const panel = useDesk((s) => s.panel);
  const { zone } = door.facts();
  const now = door.now();
  const today = personDay(data, person.id, day);
  const y = (minute: number) => (minute - hours.from) * PX_PER_MINUTE;
  const who = door.who();
  const mayBook = who.can("bookings", "create");
  const calendar = data.calendars[String(person.id)];
  const source = calendar?.accounts[0]?.providerName ?? null;
  const asOf = calendar?.sync?.state === "reconnect" && calendar.sync.busyAsOf !== null ? calendar.sync.busyAsOf : null;
  const busyWord = asOf !== null ? t("calendar.busyAsOf", { day: fmt.day(asOf) }) : source !== null ? t("calendar.busyFrom", { source }) : t("calendar.busy");

  const shades: { key: string; top: number; height: number; kind: "out" | "break" | "busy" | "off"; label: string | null }[] = [];
  const shade = (key: string, from: number, to: number, kind: "out" | "break" | "busy" | "off", label: string | null = null) => {
    const a = Math.max(from, hours.from);
    const z = Math.min(to, hours.to);
    if (z > a) shades.push({ key, top: y(a), height: (z - a) * PX_PER_MINUTE, kind, label });
  };
  if (today.off !== null) shade("off", hours.from, hours.to, "off", offWord(t, today));
  else {
    shade("before", hours.from, today.opens, "out");
    shade("after", today.closes, hours.to, "out");
    if (today.breakStart !== null && today.breakEnd !== null) shade("break", today.breakStart, today.breakEnd, "break", t("calendar.break"));
    for (const row of data.timeOff) {
      if (!same(row["team_id"], person.id) || dayIn(String(row["starts_at"]), zone) !== day) continue;
      shade(`off-${String(row.id)}`, minuteOfDay(String(row["starts_at"]), zone), minuteOfDay(String(row["ends_at"]), zone), "busy", t("calendar.busyTimeOff"));
    }
    for (const block of busy) {
      if (dayIn(block.start, zone) !== day) continue;
      shade(`busy-${String(block.start)}`, minuteOfDay(block.start, zone), dayIn(block.end, zone) === day ? minuteOfDay(block.end, zone) : hours.to, "busy", busyWord);
    }
  }

  const clashes = new Set((data.clashes ?? []).filter((c) => !c.kept).map((c) => c.row));
  const rows = data.bookings.filter((b) => ON_THE_DAY.includes(String(b["state"])) && b["state"] !== "no_show" && same(b["team_id"], person.id) && dayIn(startOf(b), zone) === day);

  const minuteAt = (event: MouseEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const grid = num(data.settings?.["grid_min"]) ?? 15;
    const raw = (event.clientY - box.top) / PX_PER_MINUTE + hours.from;
    return Math.max(hours.from, Math.min(hours.to - grid, Math.floor(raw / grid) * grid));
  };
  const onEmpty = (event: MouseEvent<HTMLDivElement>) => {
    if (!mayBook || event.target !== event.currentTarget) return;
    newBooking({ person: person.id, day, clock: clockOf(minuteAt(event)) });
  };
  const isToday = day === dayIn(now, zone);
  const nowMinute = minuteOfDay(now, zone);

  return (
    <div className="lm-col">
      <div className="lm-col-head">
        <Avatar person={person} size={28} />
        <span className="lm-col-title">
          <span>{title}</span>
          <small dir="auto">{today.off !== null ? offWord(t, today) : fmt.range(instantOf(day, clockOf(today.opens), zone), instantOf(day, clockOf(today.closes), zone))}</small>
        </span>
      </div>
      <div
        className="lm-col-body"
        style={{ height: (hours.to - hours.from) * PX_PER_MINUTE }}
        aria-label={`${text(person["name"]) ?? ""}, ${fmt.day(day)}`}
        onClick={onEmpty}
        onDragOver={(e: DragEvent<HTMLDivElement>) => e.preventDefault()}
        onDrop={(e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          onDrop(person, day, minuteAt(e));
        }}
      >
        {shades.map((s) => (
          <div key={s.key} className={`lm-shade lm-shade--${s.kind}`} style={{ top: s.top, height: s.height }}>
            {s.label !== null && <span>{s.label}</span>}
          </div>
        ))}
        {rows.map((booking) => {
          const kind = kindOf(booking, now, zone);
          const start = minuteOfDay(startOf(booking), zone);
          const length = num(booking["minutes"]) ?? 0;
          const buffer = num(booking["buffer_min"]) ?? 0;
          const service = text(byId(data.services, booking["service_id"])?.["name"]) ?? "";
          const clash = clashes.has(String(booking.id));
          const short = length < 60;
          const range = fmt.range(startOf(booking), endOf(booking));
          const name = shortName(booking["name"]);
          const open = panel?.kind === "booking" && same(panel.id, booking.id);
          const mayDrag = who.can("bookings", "create") && (booking["state"] === "booked" || booking["state"] === "paying") && startOf(booking) > now;
          return (
            <div key={String(booking.id)}>
              {buffer > 0 && <div aria-hidden="true" className={`lm-tail lm-tone-${kindTone(kind)}`} style={{ top: y(start + length), height: buffer * PX_PER_MINUTE }} />}
              <button
                type="button"
                draggable={mayDrag}
                className={`lm-block lm-tone-${kindTone(kind)}${kind === "paying" ? " is-dashed" : ""}${clash ? " is-clash" : ""}${open ? " is-open" : ""}${same(spring, booking.id) ? " is-spring" : ""}`}
                style={{ top: y(start), height: length * PX_PER_MINUTE - 2 }}
                aria-label={`${service}, ${text(booking["name"]) ?? ""}, ${fmt.time(booking["starts_at"])}, ${kindWord(t, kind)}${clash ? `, ${t("calendar.clashAria")}` : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  openBooking(booking.id);
                }}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", String(booking.id));
                  e.dataTransfer.effectAllowed = "move";
                  dragging = booking.id;
                }}
                onDragEnd={() => {
                  dragging = null;
                }}
              >
                <span className="lm-block-title">
                  {clash && <TriangleAlert size={12} aria-hidden="true" />}
                  <span>{service}</span>
                </span>
                <span className="lm-block-name" dir="auto">
                  {short ? `${name} · ${range}` : name}
                </span>
                {!short && (
                  <span className="lm-block-time">
                    <Fig>{range}</Fig>
                  </span>
                )}
              </button>
            </div>
          );
        })}
        {ghost !== null && (
          <div aria-hidden="true" className="lm-ghost" style={{ top: y(ghost.minute), height: ghost.height }}>
            {fmt.time(instantOf(day, clockOf(ghost.minute), zone))}
          </div>
        )}
        {isToday && nowMinute >= hours.from && nowMinute <= hours.to && <div aria-hidden="true" className="lm-now" style={{ top: y(nowMinute) }} />}
      </div>
      {mayBook && today.off === null && (
        <button type="button" className="lm-sr-only lm-sr-focus" onClick={() => newBooking({ person: person.id, day })}>
          {t("calendar.newFor", { who: firstName(person["name"]), day: fmt.day(day) })}
        </button>
      )}
    </div>
  );
}

/** The booking being dragged: a drop reads it, because `dataTransfer` is not readable during a drag in every browser. */
let dragging: Id | null = null;

function Diary({ day, setDay, busy }: { day: string; setDay: (day: string) => void; busy: Record<string, BusyBlock[]> }) {
  const { door } = useEnv();
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const [who, setWho] = useState<string>("all");
  const { zone } = door.facts();
  const now = door.now();
  const today = dayIn(now, zone);
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const open = (d: string) => data.openingHours.find((row) => row["weekday"] === weekdayOf(d))?.["open"] !== false && !data.closures.some((row) => (row["team_id"] === null || row["team_id"] === undefined) && row["active"] !== false && d >= String(row["from_date"]).slice(0, 10) && d <= String(row["to_date"]).slice(0, 10));
  const counted = (d: string) => data.bookings.filter((b) => ON_THE_DAY.includes(String(b["state"])) && dayIn(startOf(b), zone) === d).length;
  const people = data.team.filter((p) => who === "all" || String(p.id) === who);
  const clashes = new Set((data.clashes ?? []).filter((c) => !c.kept).map((c) => c.row));

  type Item = { key: string; at: number; time: string; title: string; sub: string; booking: Row | null; tint: unknown; clash: boolean };
  const items: Item[] = [];
  for (const person of people) {
    const first = firstName(person["name"]);
    const state = personDay(data, person.id, day);
    if (state.off === "dayOff") items.push({ key: `off-${String(person.id)}`, at: -1, time: "—", title: first, sub: offWord(t, state), booking: null, tint: person["tint"], clash: false });
    const source = data.calendars[String(person.id)]?.accounts[0]?.providerName ?? t("calendar.theirCalendar");
    for (const block of busy[String(person.id)] ?? []) {
      if (dayIn(block.start, zone) !== day) continue;
      items.push({ key: `busy-${String(person.id)}-${String(block.start)}`, at: block.start, time: fmt.time(block.start), title: t("calendar.busy"), sub: `${source} · ${first} · ${fmt.range(block.start, block.end)}`, booking: null, tint: null, clash: false });
    }
    for (const row of data.timeOff) {
      if (!same(row["team_id"], person.id) || dayIn(String(row["starts_at"]), zone) !== day) continue;
      items.push({ key: `timeoff-${String(row.id)}`, at: Date.parse(String(row["starts_at"])), time: fmt.time(row["starts_at"]), title: t("calendar.busy"), sub: `${t("calendar.timeOff")} · ${first} · ${fmt.range(row["starts_at"], row["ends_at"])}`, booking: null, tint: null, clash: false });
    }
    for (const booking of data.bookings) {
      if (!ON_THE_DAY.includes(String(booking["state"])) || !same(booking["team_id"], person.id) || dayIn(startOf(booking), zone) !== day) continue;
      const buffer = num(booking["buffer_min"]) ?? 0;
      const service = text(byId(data.services, booking["service_id"])?.["name"]) ?? "";
      items.push({
        key: `b-${String(booking.id)}`,
        at: startOf(booking),
        time: fmt.time(booking["starts_at"]),
        title: text(booking["name"]) ?? t("common.noName"),
        sub: `${service} · ${first} · ${fmt.range(startOf(booking), endOf(booking))}${buffer > 0 ? ` · ${t("booking.cleanup", {}, buffer)}` : ""}`,
        booking,
        tint: person["tint"],
        clash: clashes.has(String(booking.id)),
      });
    }
  }
  items.sort((a, b) => a.at - b.at);

  return (
    <div className="lm-diary">
      <div role="group" aria-label={t("calendar.days")} className="lm-chips-scroll">
        {days.map((d) => (
          <button key={d} type="button" aria-pressed={d === day} className={`lm-day-chip${d === day ? " is-on" : ""}${open(d) ? "" : " is-off"}`} onClick={() => setDay(d)}>
            <small>{fmt.day(d).split(" ")[0]}</small>
            <Fig strong>{Number(d.slice(8))}</Fig>
            <small>{open(d) ? t("calendar.booked", {}, counted(d)) : t("calendar.closed")}</small>
          </button>
        ))}
      </div>
      {data.team.length > 1 && (
        <div role="group" aria-label={t("calendar.person")} className="lm-chips-scroll">
          {[{ id: "all", label: t("common.all") }, ...data.team.map((p) => ({ id: String(p.id), label: firstName(p["name"]) }))].map((x) => (
            <button key={x.id} type="button" aria-pressed={who === x.id} className={`lm-chip${who === x.id ? " is-on" : ""}`} onClick={() => setWho(x.id)}>
              {x.label}
            </button>
          ))}
        </div>
      )}
      <div className="lm-card lm-diary-list">
        {items.length === 0 && <p className="lm-empty">{t("calendar.nothing")}</p>}
        {items.map((item) => {
          const booking = item.booking;
          const body = (
            <>
              <span className="lm-diary-time">
                <Fig strong>{item.time}</Fig>
              </span>
              <span aria-hidden="true" className="lm-diary-dot" style={{ background: text(item.tint) ?? "var(--border-strong)" } as CSSProperties} />
              <span className="lm-diary-main">
                <strong>{item.title}</strong>
                <span className="lm-muted-sm">{item.sub}</span>
                {item.clash && (
                  <span className="lm-diary-clash">
                    <TriangleAlert size={12} aria-hidden="true" />
                    {t("calendar.clashAria")}
                  </span>
                )}
              </span>
              {booking !== null && <StateChip kind={kindOf(booking, now, zone)} t={t} />}
            </>
          );
          return booking === null ? (
            <div key={item.key} className="lm-diary-row is-inert">
              {body}
            </div>
          ) : (
            <button key={item.key} type="button" className="lm-diary-row" onClick={() => openBooking(booking.id)}>
              {body}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarScreen() {
  const { door } = useEnv();
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const phone = usePhone();
  const { zone } = door.facts();
  const today = dayIn(door.now(), zone);
  const day = useDesk((s) => s.calendarDay) ?? today;
  const mode = useDesk((s) => s.calendarMode);
  const chosen = useDesk((s) => s.calendarPerson);
  const notice = useDesk((s) => s.notice);
  const [ghost, setGhost] = useState<{ person: Id; day: string; minute: number; height: number } | null>(null);
  const [spring, setSpring] = useState<Id | null>(null);

  // Someone who sees only their own row has one column: their week (L2a-F9).
  const single = data.team.length === 1;
  const week = !phone && (mode === "week" || single);
  const person = byId(data.team, chosen) ?? data.team[0];
  const weekday = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].indexOf(weekdayOf(day));
  const monday = addDays(day, -weekday);
  const step = week ? 7 : 1;
  const from = phone ? today : week ? monday : day;
  const to = phone ? addDays(today, 6) : week ? addDays(monday, 5) : day;
  const people = useMemo(() => (week && person !== undefined ? [person] : data.team), [week, person, data.team]);
  const busy = useBusy(people, from, to, data);
  const hours = gridHours(data);

  const setDay = (next: string) => {
    setGhost(null);
    useDesk.setState({ calendarDay: next, notice: null });
  };

  const drop = async (target: Row, onDay: string, minute: number) => {
    const id = dragging;
    dragging = null;
    if (id === null) return;
    const booking = byId(data.bookings, id);
    if (booking === undefined) return;
    const clock = clockOf(minute);
    const slots = await door.slots({ service: booking["service_id"] as Id, person: target.id, day: onDay, exclude: booking.id }).catch(() => []);
    if (slots.some((slot) => slot.time === clock && slot.state === "free")) {
      setGhost(null);
      useDesk.setState({ notice: null });
      newBooking({ moving: booking.id, service: booking["service_id"] as Id, person: target.id, day: onDay, clock, customer: booking["customer_id"] as Id | null });
      return;
    }
    const reason = whyRefused(data as DeskData, booking, target, onDay, minute, door.now(), zone, busy[String(target.id)] ?? []);
    const length = num(booking["minutes"]) ?? 0;
    const buffer = num(booking["buffer_min"]) ?? 0;
    setGhost({ person: target.id, day: onDay, minute, height: (length + buffer) * PX_PER_MINUTE });
    setSpring(booking.id);
    useDesk.setState({ notice: { tone: "danger", text: refusalSentence(t, fmt, onDay, zone, reason) } });
    setTimeout(() => {
      setGhost(null);
      setSpring(null);
    }, 2_600);
  };

  const hourLabels: number[] = [];
  for (let m = hours.from; m <= hours.to; m += 60) hourLabels.push(m);
  const columns = week ? [0, 1, 2, 3, 4, 5].map((k) => ({ person: person!, day: addDays(monday, k), title: fmt.day(addDays(monday, k)) })) : data.team.map((p) => ({ person: p, day, title: firstName(p["name"]) }));

  return (
    <div className="lm-cal">
      <div className="lm-cal-bar">
        <div className="lm-cal-nav">
          <button type="button" className="lm-icon-btn" aria-label={t("calendar.previous")} onClick={() => setDay(addDays(day, -step))}>
            <ChevronLeft size={17} className="lm-flip" aria-hidden="true" />
          </button>
          <button type="button" className="lm-btn" onClick={() => setDay(today)}>
            {t("calendar.today")}
          </button>
          <button type="button" className="lm-icon-btn" aria-label={t("calendar.next")} onClick={() => setDay(addDays(day, step))}>
            <ChevronRight size={17} className="lm-flip" aria-hidden="true" />
          </button>
        </div>
        <h1 className="lm-cal-label">{week ? `${fmt.day(monday)} – ${fmt.day(addDays(monday, 5))}` : fmt.day(day)}</h1>
        <span className="lm-spacer" />
        {week && !single && (
          <label className="lm-inline-field">
            {t("calendar.person")}
            <select value={String(person?.id ?? "")} onChange={(e) => useDesk.setState({ calendarPerson: e.target.value })}>
              {data.team.map((p) => (
                <option key={String(p.id)} value={String(p.id)}>
                  {text(p["name"])}
                </option>
              ))}
            </select>
          </label>
        )}
        {!phone && !single && (
          <div role="group" aria-label={t("calendar.view")} className="lm-seg">
            <button type="button" aria-pressed={!week} className={!week ? "is-on" : ""} onClick={() => useDesk.setState({ calendarMode: "day" })}>
              {t("calendar.day")}
            </button>
            <button type="button" aria-pressed={week} className={week ? "is-on" : ""} onClick={() => useDesk.setState({ calendarMode: "week" })}>
              {t("calendar.week")}
            </button>
          </div>
        )}
      </div>
      {notice !== null && (
        <div role="status" className={`lm-cal-notice is-${notice.tone}`}>
          {notice.tone === "pos" ? <CircleCheck size={16} aria-hidden="true" /> : <Undo2 size={16} aria-hidden="true" />}
          <span>{notice.text}</span>
        </div>
      )}
      {phone ? (
        <Diary day={day} setDay={setDay} busy={busy} />
      ) : (
        <div className="lm-grid-wrap">
          <div className="lm-grid" style={{ minWidth: 58 + columns.length * 112 }}>
            <div className="lm-gutter" aria-hidden="true">
              <div className="lm-gutter-head" />
              <div className="lm-gutter-body" style={{ height: (hours.to - hours.from) * PX_PER_MINUTE }}>
                {hourLabels.map((m) => (
                  <span key={m} style={{ top: (m - hours.from) * PX_PER_MINUTE }}>
                    {fmt.time(instantOf(day, clockOf(m), zone))}
                  </span>
                ))}
              </div>
            </div>
            {columns.map((col) => (
              <Column
                key={`${String(col.person.id)}-${col.day}`}
                person={col.person}
                day={col.day}
                title={col.title}
                hours={hours}
                busy={busy[String(col.person.id)] ?? []}
                ghost={ghost !== null && same(ghost.person, col.person.id) && ghost.day === col.day ? { minute: ghost.minute, height: ghost.height } : null}
                spring={spring}
                onDrop={(p, d, m) => void drop(p, d, m)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
