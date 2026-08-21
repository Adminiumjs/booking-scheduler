/*
 * JOIN THE WAIT LIST (view: 'waitlist').
 *
 * The join form on the left, everything the guest is already waiting on
 * on the right. `waitliststatus` is the read-only companion — both read the
 * same `waitlist` map, so an entry added here shows up there immediately.
 */

import { useMemo } from "react";
import type { ReactNode } from "react";

import {
  Banner,
  Button,
  Chip,
  EmptyState,
  IconTile,
} from "../components/index.ts";
import { data } from "../data/source.ts";
import type { WaitlistEntry } from "../data/types.ts";
import { hash } from "../lib/codes.ts";
import { useI18n, useT, type MessageKey, type TFunction } from "../i18n/index.tsx";
import { formatShortISO, isoOf, weekdayName } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-waitlist.css";

/**
 * Service ids the wait list offers, with the comp's shortened labels.
 * Treatment names are in-fiction demo content and stay as written.
 */
const SERVICE_CHOICES = [
  { id: "gel", label: "Gel Manicure" },
  { id: "balayage", label: "Balayage" },
  { id: "facial", label: "Signature Facial" },
  { id: "deep", label: "Deep-Tissue" },
  { id: "reformer", label: "Reformer" },
] as const;

/**
 * Mon–Sat. The chip id is the storage key; the label is `Intl`'s own short
 * weekday for the reader's locale, so no message is needed and no locale ends
 * up reading English day names.
 */
const DAY_CHOICES = [
  { id: "mon", dow: 1 },
  { id: "tue", dow: 2 },
  { id: "wed", dow: 3 },
  { id: "thu", dow: 4 },
  { id: "fri", dow: 5 },
  { id: "sat", dow: 6 },
] as const;

const WINDOW_CHOICES: { id: string; labelKey: MessageKey }[] = [
  { id: "morning", labelKey: "screensB.waitlist.winMornings" },
  { id: "afternoon", labelKey: "screensB.waitlist.winAfternoons" },
  { id: "evening", labelKey: "screensB.waitlist.winEvenings" },
];

const NOTIFY_CHOICES: { id: string; labelKey: MessageKey }[] = [
  { id: "sms", labelKey: "screensB.waitlist.notifyText" },
  { id: "email", labelKey: "screensB.waitlist.notifyEmail" },
  { id: "push", labelKey: "screensB.waitlist.notifyPush" },
];

/** Which "we'll be in touch by …" sentence a channel gets. */
const JOINED_TOAST: Record<string, MessageKey> = {
  sms: "screensB.waitlist.toastJoinedText",
  email: "screensB.waitlist.toastJoinedEmail",
  push: "screensB.waitlist.toastJoinedPush",
};

/** `Date.getDay()` → the day key the chips use. */
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function oddsCopy(t: TFunction, dayCount: number): string {
  if (dayCount >= 4) return t("screensB.waitlist.oddsMany");
  if (dayCount >= 2) return t("screensB.waitlist.oddsSome");
  return t("screensB.waitlist.oddsOne");
}

export default function Waitlist() {
  const t = useT();
  const wlSvc = useStore((s) => s.wlSvc);
  const wlDays = useStore((s) => s.wlDays);
  const wlWin = useStore((s) => s.wlWin);
  const wlNotify = useStore((s) => s.wlNotify);
  const waitlist = useStore((s) => s.waitlist);
  const week = useStore((s) => s.week);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);
  const leaveWaitlist = useStore((s) => s.leaveWaitlist);

  const entries = useMemo(() => Object.values(waitlist), [waitlist]);

  const toggleDay = (id: string) => {
    const next = wlDays.includes(id)
      ? wlDays.filter((d) => d !== id)
      : [...wlDays, id];
    set({ wlDays: next });
  };

  const join = () => {
    if (wlDays.length === 0) {
      showToast(t("screensB.waitlist.errPickDay"), "warn");
      return;
    }
    /* The first day of the rolling week that matches one of the chosen chips.
     * Every offered key is Mon–Sat, so a seven-day window always hits one. */
    const idx = Math.max(
      0,
      week.findIndex((d) => wlDays.includes(DAY_KEYS[d.getDay()])),
    );
    const iso = isoOf(week[idx]);
    /* Keyed by service, not by specialist: this screen is service-first and
     * "first available" would otherwise let only one entry exist per day. The
     * booking flow's `${iso}|${staffId}` keys can never collide with these. */
    const key = `${iso}|${wlSvc}`;
    set({
      waitlist: {
        ...waitlist,
        [key]: { key, staff: "first", svc: wlSvc, iso },
      },
    });
    showToast(
      t(JOINED_TOAST[wlNotify] ?? "screensB.waitlist.toastJoinedText"),
      "ok",
    );
  };

  return (
    <section className="bk-screen bk-page scr-waitlist">
      <div className="scr-waitlist__head">
        <h1 className="bk-h1">{t("screensB.waitlist.title")}</h1>
        <p className="bk-sub scr-waitlist__lede">
          {t("screensB.waitlist.lede")}
        </p>
      </div>

      <div className="scr-waitlist__cols">
        {/* ---- the join form ---- */}
        <div className="bk-panel scr-waitlist__form">
          <span className="scr-waitlist__formtitle">
            {t("screensB.waitlist.joinTitle")}
          </span>

          <ChipGroup label={t("screensB.waitlist.groupService")}>
            {SERVICE_CHOICES.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                active={wlSvc === c.id}
                onClick={() => set({ wlSvc: c.id })}
              />
            ))}
          </ChipGroup>

          <ChipGroup label={t("screensB.waitlist.groupDays")}>
            {DAY_CHOICES.map((c) => (
              <Chip
                key={c.id}
                label={weekdayName(c.dow, "short")}
                active={wlDays.includes(c.id)}
                onClick={() => toggleDay(c.id)}
              />
            ))}
          </ChipGroup>

          <ChipGroup label={t("screensB.waitlist.groupTime")}>
            {WINDOW_CHOICES.map((c) => (
              <Chip
                key={c.id}
                label={t(c.labelKey)}
                active={wlWin === c.id}
                onClick={() => set({ wlWin: c.id })}
              />
            ))}
          </ChipGroup>

          <ChipGroup label={t("screensB.waitlist.groupNotify")}>
            {NOTIFY_CHOICES.map((c) => (
              <Chip
                key={c.id}
                label={t(c.labelKey)}
                active={wlNotify === c.id}
                onClick={() => set({ wlNotify: c.id })}
              />
            ))}
          </ChipGroup>

          <Banner tone="info">{oddsCopy(t, wlDays.length)}</Banner>

          <Button icon="bell-plus" iconSize={17} size="lg" full onClick={join}>
            {t("screensB.waitlist.addMe")}
          </Button>
        </div>

        {/* ---- what they're already waiting on ---- */}
        <div className="scr-waitlist__side">
          <div className="scr-waitlist__sidehead">
            <span className="scr-waitlist__sidetitle">
              {t("screensB.waitlist.waitingOn")}
            </span>
            <span className="scr-waitlist__count">
              {t("count.entry", {}, entries.length)}
            </span>
          </div>

          {entries.length === 0 ? (
            <EmptyState
              icon="bell-off"
              title={t("screensB.waitlist.emptyTitle")}
              body={t("screensB.waitlist.emptyBody")}
            />
          ) : (
            entries.map((entry) => (
              <EntryCard
                key={entry.key}
                entry={entry}
                onNudge={() =>
                  showToast(t("screensB.waitlist.toastWidened"), "ok")
                }
                onLeave={() => leaveWaitlist(entry.key)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Pieces (local to this screen)
 * ------------------------------------------------------------------ */

interface ChipGroupProps {
  label: string;
  children: ReactNode;
}

/* A group of chips, not a labelled control — `fieldset`/`legend` is the honest
 * markup, and it keeps the label announced together with the set. The comp
 * used a bare `<label>` pointing at nothing. */
function ChipGroup({ label, children }: ChipGroupProps) {
  return (
    <fieldset className="scr-waitlist__group">
      <legend className="scr-waitlist__grouplabel">{label}</legend>
      <div className="scr-waitlist__chips">{children}</div>
    </fieldset>
  );
}

interface EntryCardProps {
  entry: WaitlistEntry;
  onNudge: () => void;
  onLeave: () => void;
}

function EntryCard({ entry, onNudge, onLeave }: EntryCardProps) {
  const { t, number } = useI18n();
  const svc = data.getService(entry.svc);
  const staff = data.getStaffMember(entry.staff);
  const tint = svc?.tint ?? "#0d9488";
  /* Stable per key, so a place in line does not shuffle on every render. */
  const pos = (hash(entry.key) % 4) + 1;
  const when = entry.iso
    ? formatShortISO(entry.iso)
    : t("screensB.waitlist.flexible");

  return (
    <div className="bk-panel scr-waitlist__entry">
      <div className="scr-waitlist__entryhead">
        <IconTile
          icon={svc?.icon ?? "sparkles"}
          tint={tint}
          size={44}
          iconSize={20}
          radius={14}
        />
        <span className="scr-waitlist__entrytext">
          <span className="scr-waitlist__entrysvc">
            {svc?.name ?? t("screensB.common.anyService")}
          </span>
          <span className="scr-waitlist__entrysub">
            {staff
              ? t("screensB.waitlist.entryStaffDate", {
                  staff: staff.name,
                  date: when,
                })
              : t("screensB.waitlist.entryAnyDate", { date: when })}
          </span>
        </span>
        <span className="scr-waitlist__pos">
          {t("screensB.waitlist.inLine", { pos: number(pos) })}
        </span>
      </div>

      <div>
        <div className="scr-waitlist__track">
          <div
            className="scr-waitlist__bar"
            style={{ inlineSize: `${Math.max(18, 100 - pos * 20)}%` }}
          />
        </div>
        <div className="scr-waitlist__odds">
          {pos === 1
            ? t("screensB.waitlist.oddsNext")
            : t(
                "screensB.waitlist.oddsWait",
                { count: number(pos * 2) },
                pos * 2,
              )}
        </div>
      </div>

      <div className="scr-waitlist__entryfoot">
        <button
          type="button"
          className="bk-gi scr-waitlist__widen"
          onClick={onNudge}
        >
          {t("screensB.waitlist.widen")}
        </button>
        <button
          type="button"
          className="bk-gi scr-waitlist__leave"
          onClick={onLeave}
        >
          {t("screensB.common.leave")}
        </button>
      </div>
    </div>
  );
}
