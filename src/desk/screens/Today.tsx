/**
 * K1 Today (comp L2 77–120): now and next, one move a row, and what needs
 * someone. Every line opens what it talks about, and every figure is counted
 * from the rows.
 */
import { CalendarSync, ChevronRight, Hourglass, ListOrdered, Rocket, ShieldAlert, Star, TriangleAlert, Wallet } from "lucide-react";
import type { ReactNode } from "react";

import { useData, useEnv, useRun } from "../env.tsx";
import { byId, endOf, firstName, kindOf, letGoAt, needsOf, ON_THE_DAY, startOf, type Need } from "../facts.ts";
import { useFmt, type Fmt } from "../format.ts";
import { useDeskT, type DeskT } from "../i18n/index.ts";
import { go, newBooking, openBooking, useDesk } from "../store.ts";
import { dayIn } from "../time.ts";
import { Chip, Fig } from "../ui.tsx";
import { num, same, text, type Row } from "../wire.ts";
import { Avatar, StateChip } from "./parts.tsx";

function TodayRow({ booking }: { booking: Row }) {
  const { door } = useEnv();
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const { busy, run } = useRun();
  const { zone } = door.facts();
  const now = door.now();
  const kind = kindOf(booking, now, zone);
  const service = byId(data.services, booking["service_id"]);
  const person = byId(data.team, booking["team_id"]);
  const customer = text(booking["name"]) ?? t("common.noName");
  const who = door.who();
  const writes = who.can("bookings", "update");
  const desk = writes && who.can("bookings", "create");

  const mark = (to: "arrived" | "done" | "no_show") =>
    run(async (d) => {
      await d.moveBooking(booking, to);
      return t("toast.marked", { name: customer, state: t(to === "arrived" ? "state.arrived" : to === "done" ? "state.done" : "state.noShow") });
    });
  const again = () => newBooking({ service: booking["service_id"] as string, person: booking["team_id"] as string | null, customer: booking["customer_id"] as string | null });
  const open = () => openBooking(booking.id);

  let sub: ReactNode = null;
  if (kind === "arrived") sub = t("today.finishes", { time: fmt.time(endOf(booking)) });
  if (kind === "soon") {
    const away = Math.round((startOf(booking) - now) / 60_000);
    sub = away > 0 ? t("today.dueIn", {}, away) : away === 0 ? t("today.dueNow") : t("today.lateBy", {}, -away);
  }
  if (kind === "late") sub = t("today.lateBy", {}, Math.round((now - startOf(booking)) / 60_000));
  if (kind === "paying") {
    const at = letGoAt(booking);
    sub = at === null ? t("state.paying") : t("today.letGoAt", { time: fmt.time(at) });
  }
  const warnSub = kind === "late" || kind === "paying";
  const paid = (num(booking["paid"]) ?? 0) > 0;
  const refunded = (num(booking["refunded"]) ?? 0) > 0;

  const button = (label: string, onClick: () => void, primary = false) => (
    <button key={label} type="button" className={`lm-btn${primary ? " lm-btn--primary" : ""}`} disabled={busy} aria-label={`${label} · ${customer}`} onClick={onClick}>
      {label}
    </button>
  );
  const moves =
    kind === "arrived" && writes
      ? [button(t("move.done"), () => void mark("done"), true)]
      : kind === "soon" && writes
        ? [button(t("move.arrived"), () => void mark("arrived"), true)]
        : kind === "late" && writes
          ? [button(t("move.arrived"), () => void mark("arrived"), true), button(t("move.noShow"), () => void mark("no_show"))]
          : (kind === "done" || kind === "no_show") && desk
            ? [button(t("move.bookAgain"), again)]
            : [button(t("common.open"), open)];

  return (
    <div className={`lm-today-row${kind === "late" ? " is-late" : ""}${kind === "done" || kind === "no_show" ? " is-past" : ""}`}>
      <span className="lm-today-time">
        <Fig strong>{fmt.time(booking["starts_at"])}</Fig>
      </span>
      <Avatar person={person} />
      <button type="button" className="lm-today-main" aria-label={`${customer}, ${text(service?.["name"]) ?? ""}, ${fmt.time(booking["starts_at"])}`} onClick={open}>
        <span className="lm-today-name">{customer}</span>
        <span className="lm-muted-sm">
          {text(service?.["name"])} · {firstName(person?.["name"])}
        </span>
        {sub !== null && <span className={`lm-today-sub${warnSub ? " is-warn" : ""}`}>{sub}</span>}
        {(paid || refunded || booking["picked_by_anyone"] === true) && (
          <span className="lm-tags">
            {refunded ? <Chip>{t("pay.refundedTag")}</Chip> : paid ? <Chip tone="pos">{t("pay.depositPaid")}</Chip> : null}
            {booking["picked_by_anyone"] === true && <Chip tone="info">{t("booking.pickedAnyone")}</Chip>}
          </span>
        )}
      </button>
      <div className="lm-today-moves">
        <StateChip kind={kind} t={t} />
        {moves}
      </div>
    </div>
  );
}

const ICONS: Record<Need["kind"], ReactNode> = {
  clash: <TriangleAlert size={16} />,
  reconnect: <CalendarSync size={16} />,
  paying: <Hourglass size={16} />,
  letGo: <Hourglass size={16} />,
  lateMoney: <Wallet size={16} />,
  limit: <ShieldAlert size={16} />,
  waiting: <ListOrdered size={16} />,
  reviews: <Star size={16} />,
  firstRun: <Rocket size={16} />,
};

/** The busy time a clash sits in, when the sync's blocks were read; the overlap itself otherwise. */
function clashWords(need: Extract<Need, { kind: "clash" }>, data: ReturnType<typeof useData>, t: DeskT, fmt: Fmt): string {
  const { clash, booking, person } = need;
  const calendar = person === undefined ? undefined : data.calendars[String(person.id)];
  const provider = calendar?.accounts[0]?.providerName ?? t("calendar.theirCalendar");
  return t("needs.clash", {
    who: firstName(person?.["name"]),
    src: provider,
    range: fmt.range(clash.block?.start ?? clash.overlapStart, clash.block?.end ?? clash.overlapEnd),
    day: fmt.day(booking["starts_at"]),
    cust: text(booking["name"]) ?? t("common.noName"),
    svc: text(byId(data.services, booking["service_id"])?.["name"]) ?? "",
    time: fmt.time(booking["starts_at"]),
    code: text(booking["code"]) ?? "",
  });
}

function NeedRow({ need }: { need: Need }) {
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const { busy, run } = useRun();
  const { door } = useEnv();

  let words = "";
  let open: () => void = () => undefined;
  let acts: ReactNode = null;
  switch (need.kind) {
    case "clash": {
      words = clashWords(need, data, t, fmt);
      const { booking, clash } = need;
      open = () => {
        go("calendar", { calendarDay: dayIn(startOf(booking), door.facts().zone), calendarMode: "day" });
        openBooking(booking.id);
      };
      acts = (
        <>
          <button
            type="button"
            className="lm-btn lm-btn--ink"
            disabled={busy}
            onClick={() => newBooking({ moving: booking.id, service: booking["service_id"] as string, person: booking["team_id"] as string | null, customer: booking["customer_id"] as string | null })}
          >
            {t("clash.moveIt")}
          </button>
          <button
            type="button"
            className="lm-btn"
            disabled={busy}
            onClick={() =>
              void run(async (d) => {
                await d.keepClash(clash);
                return t("toast.kept", { cust: text(booking["name"]) ?? t("common.noName") });
              })
            }
          >
            {t("clash.keepIt")}
          </button>
        </>
      );
      break;
    }
    case "reconnect": {
      const name = firstName(need.person["name"]);
      const calendar = data.calendars[String(need.person.id)];
      words = t("needs.reconnect", { who: name, provider: need.provider });
      open = () => go("team");
      if (calendar?.may.sendLink === true) {
        acts = (
          <button
            type="button"
            className="lm-btn"
            disabled={busy}
            onClick={() =>
              void run(async (d) => {
                const sentTo = await d.sendConnectLink(need.person.id);
                return t("toast.linkSent", { email: sentTo ?? name });
              })
            }
          >
            {t("calendar.sendLink", { who: name })}
          </button>
        );
      }
      break;
    }
    case "paying":
      words = t("needs.paying", { cust: text(need.booking["name"]) ?? t("common.noName"), amt: fmt.money(need.booking["pay_due"] ?? need.booking["asked"]) });
      open = () => openBooking(need.booking.id);
      break;
    case "letGo":
      words = t("needs.letGo", {}, need.count);
      open = () => go("calendar");
      break;
    case "lateMoney":
      words = t("needs.lateMoney", { cust: text(need.booking["name"]) ?? t("common.noName"), amt: fmt.money(need.booking["paid"]) });
      open = () => openBooking(need.booking.id);
      break;
    case "limit":
      words = t("needs.limit");
      open = () => go("settings", { settingsTab: "rules" });
      break;
    case "waiting":
      words = t("needs.waiting", {}, need.count);
      open = () => go("waiting");
      break;
    case "reviews":
      words = t("needs.reviews", {}, need.count);
      open = () => go("reviews");
      break;
    case "firstRun":
      words = t("needs.firstRun", { list: need.missing.map((gap) => t(gap === "hours" ? "needs.gap.hours" : gap === "service" ? "needs.gap.service" : "needs.gap.person")).join(", ") });
      open = () => go(need.missing[0] === "service" ? "services" : need.missing[0] === "person" ? "team" : "settings");
      break;
  }
  const warn = ["clash", "reconnect", "paying", "letGo", "lateMoney", "limit"].includes(need.kind);
  return (
    <div className="lm-need">
      <span className={`lm-need-ico${warn ? " is-warn" : ""}`} aria-hidden="true">
        {ICONS[need.kind]}
      </span>
      <div className="lm-need-body">
        <button type="button" className="lm-need-open" onClick={open}>
          <span>{words}</span>
          <ChevronRight size={16} className="lm-flip" aria-hidden="true" />
        </button>
        {acts !== null && <div className="lm-need-acts">{acts}</div>}
      </div>
    </div>
  );
}

export function TodayScreen() {
  const { door } = useEnv();
  const data = useData();
  const fits = useDesk((s) => s.fits);
  const t = useDeskT();
  const fmt = useFmt();
  const { zone } = door.facts();
  const now = door.now();
  const today = dayIn(now, zone);
  // Two visits at one time: by the person's name, as the comp orders them.
  const nameOf = (id: unknown) => text(data.team.find((p) => same(p.id, id))?.["name"]) ?? "";
  const rows = data.bookings
    .filter((b) => ON_THE_DAY.includes(String(b["state"])) && dayIn(startOf(b), zone) === today)
    .sort((a, b) => startOf(a) - startOf(b) || nameOf(a["team_id"]).localeCompare(nameOf(b["team_id"])));
  const needs = needsOf(data, door.who(), now, zone, fits);
  return (
    <div className="lm-page">
      <div className="lm-today-head">
        <h1>{fmt.day(today)}</h1>
        <Fig>{fmt.time(now)}</Fig>
        <span className="lm-muted-sm">{t("today.count", {}, rows.length)}</span>
      </div>
      <div className="lm-today-grid">
        <section className="lm-card lm-today-now" aria-labelledby="lm-now">
          <div className="lm-card-head">
            <h2 id="lm-now">{t("today.nowNext")}</h2>
          </div>
          {rows.length === 0 ? <p className="lm-empty">{t("today.nothing")}</p> : rows.map((b) => <TodayRow key={String(b.id)} booking={b} />)}
        </section>
        <section className="lm-card lm-today-needs" aria-labelledby="lm-needs">
          <div className="lm-card-head">
            <h2 id="lm-needs">{t("today.needsYou")}</h2>
          </div>
          {needs.length === 0 ? <p className="lm-empty">{t("today.allClear")}</p> : needs.map((need, i) => <NeedRow key={`${need.kind}-${String(i)}`} need={need} />)}
        </section>
      </div>
    </div>
  );
}
