/**
 * K7 Team (comp L2 269–298): each person's card, with their hours (edited in
 * the console, R4), time off, and their calendar connection.
 *
 * What a person may do with a calendar is the server's answer for that row
 * (`may`), never a role's name: the front desk sends a link to the address on
 * the row, the owner may also copy it, and a specialist handles their own.
 */
import { ArrowDown, ArrowUp, CalendarCheck, CalendarOff, CalendarSync, Clock, Copy, ExternalLink, Plane, Plus, RefreshCw, Rss, Trash2, TriangleAlert } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import type { CalendarAccount, PersonCalendar } from "../door.ts";
import { useData, useEnv, useRun } from "../env.tsx";
import { firstName } from "../facts.ts";
import { useFmt } from "../format.ts";
import { useDeskT, type DeskKey } from "../i18n/index.ts";
import { openSheet, toast } from "../store.ts";
import { dayIn, instantOf } from "../time.ts";
import { Fig } from "../ui.tsx";
import { same, text, type Row } from "../wire.ts";
import { Avatar } from "./parts.tsx";

const WEEK: { key: string; word: DeskKey }[] = [
  { key: "mon", word: "day.mon" },
  { key: "tue", word: "day.tue" },
  { key: "wed", word: "day.wed" },
  { key: "thu", word: "day.thu" },
  { key: "fri", word: "day.fri" },
  { key: "sat", word: "day.sat" },
  { key: "sun", word: "day.sun" },
];

/** Any ordinary day: a weekly hour is spelled from it, away from a clock change. */
const REFERENCE = "2026-01-15";

function FeedPart({ person, calendar }: { person: Row; calendar: PersonCalendar | undefined }) {
  const { door } = useEnv();
  const t = useDeskT();
  const { busy, run } = useRun();
  const [feed, setFeed] = useState<{ link: string | null; own: boolean } | null>(null);
  useEffect(() => {
    let live = true;
    void door.feedLink(person.id).then((got) => live && setFeed(got), () => undefined);
    return () => {
      live = false;
    };
  }, [door, person.id]);
  if (feed === null || calendar === undefined) return null;
  return (
    <div className="lm-feed">
      <strong className="lm-feed-title">
        <Rss size={14} aria-hidden="true" />
        {t("team.feedTitle")}
      </strong>
      {feed.link !== null && (
        <div className="lm-feed-row">
          <input readOnly value={feed.link} aria-label={t("team.feedLabel")} dir="ltr" />
          <button
            type="button"
            className="lm-btn"
            onClick={() => {
              void navigator.clipboard.writeText(feed.link!).then(() => toast(t("toast.linkCopied")));
            }}
          >
            <Copy size={14} aria-hidden="true" />
            {t("common.copy")}
          </button>
        </div>
      )}
      <p className="lm-hint">{t("team.feedNote")}</p>
      <button
        type="button"
        className="lm-btn lm-self-start"
        disabled={busy}
        onClick={() =>
          void run(async (d) => {
            setFeed(await d.renewFeed(person.id));
            return t("toast.feedRenewed");
          })
        }
      >
        <RefreshCw size={14} aria-hidden="true" />
        {t("team.feedRenew")}
      </button>
    </div>
  );
}

/** The six states of a connection (SYN-8), plus "not connected". */
function CalendarPart({ person }: { person: Row }) {
  const { door } = useEnv();
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const { busy, run } = useRun();
  const calendar = data.calendars[String(person.id)];
  const who = firstName(person["name"]);
  if (calendar === undefined) return <FeedPart person={person} calendar={calendar} />;
  const account: CalendarAccount | undefined = calendar.accounts[0];
  const mine = text(person["user_id"]) !== null && text(person["user_id"]) === door.who().id;
  const { may, sync } = calendar;
  // The built-in demo calendar has no add-on behind it, and is not "missing".
  const unavailable = account !== undefined && sync?.demo !== true && !calendar.providers.some((p) => p.key === account.provider);
  const lastSynced = sync?.lastSyncedAt ?? null;
  const addOnKey = account === undefined ? null : (calendar.providers.find((p) => p.key === account.provider)?.key ?? account.provider);

  const connect = (key: string) =>
    void run(async (d) => {
      window.location.assign(await d.connectCalendar(person.id, key));
    });
  const sendLink = (
    <button key="send" type="button" className="lm-btn" onClick={() => openSheet({ kind: "link", teamId: person.id })}>
      {account === undefined ? t("team.sendConnect") : t("calendar.sendLink", { who })}
    </button>
  );
  const disconnect =
    account !== undefined && addOnKey !== null && may.disconnect ? (
      <button key="disc" type="button" className="lm-btn lm-btn--danger-text" onClick={() => openSheet({ kind: "disconnect", teamId: person.id, addOn: addOnKey, provider: account.providerName })}>
        {t("team.disconnect")}
      </button>
    ) : null;
  const syncNow =
    may.connect || may.disconnect ? (
      <button
        key="sync"
        type="button"
        className="lm-btn"
        disabled={busy}
        onClick={() =>
          void run(async (d) => {
            await d.syncNow(person.id);
            return t("toast.synced", { who });
          })
        }
      >
        {t("team.syncNow")}
      </button>
    ) : null;
  const settings =
    may.connect || may.disconnect ? (
      <button key="set" type="button" className="lm-btn" onClick={() => openSheet({ kind: "calendar", teamId: person.id })}>
        {t("team.settings")}
      </button>
    ) : null;

  let title = t("team.notConnected");
  let icon: ReactNode = <CalendarOff size={16} />;
  let tone: "ok" | "warn" | "off" = "off";
  const lines: { text: string; warn?: boolean }[] = [];
  let acts: ReactNode[] = [];

  if (account === undefined) {
    if (calendar.reach === "cannot-connect") lines.push({ text: t("team.cannotConnect") });
    else lines.push({ text: t("team.notConnectedLine", { who }) });
    if (calendar.reach !== "cannot-connect") {
      acts = [
        ...(may.connect
          ? calendar.providers.map((p) => (
              <button key={p.key} type="button" className="lm-btn lm-btn--primary" disabled={busy} onClick={() => connect(p.key)}>
                {t("team.connectTo", { provider: p.name })}
              </button>
            ))
          : []),
        ...(may.sendLink ? [sendLink] : []),
      ];
    }
  } else {
    title = account.providerName;
    if (account.address !== null) lines.push({ text: t("team.connectedAs", { address: account.address }) });
    if (account.addressDiffers) lines.push({ text: t("team.addressDiffers"), warn: true });
    if (unavailable) {
      tone = "warn";
      icon = <TriangleAlert size={16} />;
      lines.push({ text: t("team.unavailable", { provider: account.providerName }), warn: true });
      acts = [disconnect];
    } else if (account.state === "setup") {
      tone = "warn";
      icon = <TriangleAlert size={16} />;
      lines.push({ text: t("team.secretExpired"), warn: true });
    } else if (account.state === "reconnect") {
      tone = "warn";
      icon = <CalendarSync size={16} />;
      lines.push({ text: t("team.needsReconnect", { day: fmt.day(account.since) }), warn: true });
      if (sync?.busyAsOf !== null && sync?.busyAsOf !== undefined && !sync.busyDropped) lines.push({ text: t("team.busyKept", { day: fmt.day(sync.busyAsOf) }) });
      if (sync?.busyDropped === true) lines.push({ text: t("team.busyDropped"), warn: true });
      acts = [
        ...(mine && may.connect ? [<button key="re" type="button" className="lm-btn lm-btn--primary" disabled={busy} onClick={() => connect(account.provider)}>{t("team.reconnect")}</button>] : []),
        ...(!mine && may.sendLink ? [sendLink] : []),
        disconnect,
      ];
    } else if (account.state === "partial") {
      tone = "warn";
      icon = <TriangleAlert size={16} />;
      lines.push({ text: t("team.partial"), warn: true });
      acts = [
        ...(mine && may.connect ? [<button key="re" type="button" className="lm-btn lm-btn--primary" disabled={busy} onClick={() => connect(account.provider)}>{t("team.reconnect")}</button>] : []),
        ...(!mine && may.sendLink ? [sendLink] : []),
        disconnect,
      ];
    } else if (account.state === "connecting") {
      icon = <CalendarSync size={16} />;
      lines.push({ text: t("team.firstRead") });
    } else if (account.state === "disconnecting") {
      lines.push({ text: t("team.disconnecting") });
    } else {
      tone = "ok";
      icon = <CalendarCheck size={16} />;
      lines.push({ text: lastSynced === null ? t("team.notSyncedYet") : t("team.lastSynced", { time: fmt.time(lastSynced) }) });
      if (sync?.paused !== null && sync?.paused !== undefined) lines.push({ text: t("team.paused"), warn: true });
      acts = [syncNow, settings, disconnect];
    }
  }

  return (
    <>
      <div className={`lm-cal-box is-${tone}`}>
        <div className="lm-cal-box-head">
          <span className="lm-cal-ico" aria-hidden="true">
            {icon}
          </span>
          <div>
            <strong>{title}</strong>
            {lines.map((line) => (
              <div key={line.text} className={line.warn === true ? "lm-line-warn" : "lm-line"}>
                {line.text}
              </div>
            ))}
          </div>
        </div>
        {acts.some((a) => a !== null) && <div className="lm-row-gap">{acts}</div>}
      </div>
      <FeedPart person={person} calendar={calendar} />
    </>
  );
}

function PersonCard({ person, index, total }: { person: Row; index: number; total: number }) {
  const { door } = useEnv();
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const { busy, run } = useRun();
  const { zone } = door.facts();
  const who = door.who();
  const manages = who.can("team_services", "update");
  const today = dayIn(door.now(), zone);
  const does = data.services.filter((s) => data.teamServices.some((l) => same(l["team_id"], person.id) && same(l["service_id"], s.id)));
  const clock = (value: unknown) => instantOf(REFERENCE, String(value), zone);
  const daysOff = data.closures.filter((row) => same(row["team_id"], person.id) && row["active"] !== false && String(row["to_date"]).slice(0, 10) >= today);
  const timeOff = data.timeOff.filter((row) => same(row["team_id"], person.id) && dayIn(String(row["ends_at"]), zone) >= today);
  const mine = text(person["user_id"]) !== null && text(person["user_id"]) === who.id;
  const mayAddOff = who.can("time_off", "create");
  const mayRemoveOff = who.can("time_off", "delete");
  const swap = (other: Row | undefined) => {
    if (other === undefined) return;
    void run(async (d) => {
      const mineAt = Number(person["position"] ?? index);
      const otherAt = Number(other["position"] ?? index);
      // Rows that share a position have no order to swap: each takes its place in the list first.
      const a = mineAt === otherAt ? index : mineAt;
      const b = mineAt === otherAt ? data.team.indexOf(other) : otherAt;
      await d.saveTeam(person, { position: b });
      await d.saveTeam(other, { position: a });
    });
  };
  return (
    <article className="lm-person" aria-labelledby={`lm-person-${String(person.id)}`}>
      <div className="lm-person-head">
        <Avatar person={person} size={44} />
        <div className="lm-grow">
          <h2 id={`lm-person-${String(person.id)}`}>{text(person["name"])}</h2>
          <span className="lm-person-role">{text(person["role_title"])}</span>
        </div>
        {manages && total > 1 && (
          <div className="lm-order">
            <button type="button" className="lm-icon-btn" disabled={busy || index === 0} aria-label={t("team.moveUp", { who: firstName(person["name"]) })} onClick={() => swap(data.team[index - 1])}>
              <ArrowUp size={15} aria-hidden="true" />
            </button>
            <button type="button" className="lm-icon-btn" disabled={busy || index === total - 1} aria-label={t("team.moveDown", { who: firstName(person["name"]) })} onClick={() => swap(data.team[index + 1])}>
              <ArrowDown size={15} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <div className="lm-tags">
        {does.map((s) => (
          <span key={String(s.id)} className="lm-tag">
            {text(s["name"])}
          </span>
        ))}
      </div>
      <div className="lm-week">
        {WEEK.map((d) => {
          const row = data.teamHours.find((h) => same(h["team_id"], person.id) && h["weekday"] === d.key);
          if (row === undefined && d.key === "sun") return null;
          return (
            <div key={d.key} className="lm-week-row">
              <span>{t(d.word)}</span>
              {row === undefined ? (
                <span className="lm-muted-sm">{t("team.off")}</span>
              ) : (
                <Fig>
                  {fmt.range(clock(row["opens"]), clock(row["closes"]))}
                  {text(row["break_start"]) !== null && ` · ${t("team.break")} ${fmt.range(clock(row["break_start"]), clock(row["break_end"]))}`}
                </Fig>
              )}
            </div>
          );
        })}
      </div>
      {(daysOff.length > 0 || timeOff.length > 0) && (
        <div className="lm-offs">
          {daysOff.map((row) => (
            <span key={`d${String(row.id)}`} className="lm-off">
              <Plane size={14} aria-hidden="true" />
              <strong>{t("team.daysOff")}</strong>
              <Fig>{`${fmt.day(String(row["from_date"]).slice(0, 10))} – ${fmt.day(String(row["to_date"]).slice(0, 10))}`}</Fig>
              {text(row["name"]) !== null && <span>· {text(row["name"])}</span>}
            </span>
          ))}
          {timeOff.map((row) => (
            <span key={`t${String(row.id)}`} className="lm-off">
              <Clock size={14} aria-hidden="true" />
              <strong>{t("team.timeOff")}</strong>
              <Fig>{`${fmt.day(row["starts_at"])} · ${fmt.range(row["starts_at"], row["ends_at"])}`}</Fig>
              {text(row["why"]) !== null && <span>· {text(row["why"])}</span>}
              {mayRemoveOff && (
                <button
                  type="button"
                  className="lm-icon-btn lm-icon-btn--sm"
                  disabled={busy}
                  aria-label={t("team.removeOff")}
                  onClick={() =>
                    void run(async (d) => {
                      await d.removeTimeOff(row);
                    })
                  }
                >
                  <Trash2 size={13} aria-hidden="true" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      <div className="lm-row-gap">
        {mayAddOff && (mine || manages) && (
          <button type="button" className="lm-btn" onClick={() => openSheet({ kind: "timeOff", teamId: person.id })}>
            <Plus size={14} aria-hidden="true" />
            {t("team.addOff")}
          </button>
        )}
        {manages && (
          <a className="lm-btn" href={`/p/bookings-team/r/${encodeURIComponent(String(person.id))}`} target="_top">
            <ExternalLink size={14} aria-hidden="true" />
            {t("team.editInAdminium")}
          </a>
        )}
      </div>
      {manages && <span className="lm-muted-sm">{text(person["user_id"]) !== null ? t("team.hasSignIn") : t("team.noSignIn")}</span>}
      <CalendarPart person={person} />
    </article>
  );
}

export function TeamScreen() {
  const data = useData();
  const t = useDeskT();
  return (
    <div className="lm-page lm-page--wide">
      <h1 className="lm-page-title">{t("nav.team")}</h1>
      <div className="lm-team-grid">
        {data.team.map((person, i) => (
          <PersonCard key={String(person.id)} person={person} index={i} total={data.team.length} />
        ))}
      </div>
    </div>
  );
}
