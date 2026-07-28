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
import { formatShortISO, isoOf, plural } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-waitlist.css";

/** Service ids the wait list offers, with the comp's shortened labels. */
const SERVICE_CHOICES = [
  { id: "gel", label: "Gel Manicure" },
  { id: "balayage", label: "Balayage" },
  { id: "facial", label: "Signature Facial" },
  { id: "deep", label: "Deep-Tissue" },
  { id: "reformer", label: "Reformer" },
] as const;

const DAY_CHOICES = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
] as const;

const WINDOW_CHOICES = [
  { id: "morning", label: "Mornings" },
  { id: "afternoon", label: "Afternoons" },
  { id: "evening", label: "Evenings" },
] as const;

const NOTIFY_CHOICES = [
  { id: "sms", label: "Text" },
  { id: "email", label: "Email" },
  { id: "push", label: "Push" },
] as const;

/** `Date.getDay()` → the day key the chips use. */
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function oddsCopy(dayCount: number): string {
  if (dayCount >= 4) {
    return "With that many days open, most guests hear from us within 48 hours.";
  }
  if (dayCount >= 2) {
    return "Two or three days is usually a few days’ wait this time of year.";
  }
  return "One day only can take a couple of weeks — add another if you can.";
}

export default function Waitlist() {
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
      showToast("Pick at least one day that works", "warn");
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
      `On the list · we’ll be in touch by ${wlNotify === "sms" ? "text" : wlNotify}`,
      "ok",
    );
  };

  return (
    <section className="bk-screen bk-page scr-waitlist">
      <div className="scr-waitlist__head">
        <h1 className="bk-h1">Wait list</h1>
        <p className="bk-sub scr-waitlist__lede">
          Cancellations happen most days. Tell us what you’re after and we’ll
          text you the moment something opens.
        </p>
      </div>

      <div className="scr-waitlist__cols">
        {/* ---- the join form ---- */}
        <div className="bk-panel scr-waitlist__form">
          <span className="scr-waitlist__formtitle">Join the list</span>

          <ChipGroup label="Which service?">
            {SERVICE_CHOICES.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                active={wlSvc === c.id}
                onClick={() => set({ wlSvc: c.id })}
              />
            ))}
          </ChipGroup>

          <ChipGroup label="Days that work">
            {DAY_CHOICES.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                active={wlDays.includes(c.id)}
                onClick={() => toggleDay(c.id)}
              />
            ))}
          </ChipGroup>

          <ChipGroup label="Time of day">
            {WINDOW_CHOICES.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                active={wlWin === c.id}
                onClick={() => set({ wlWin: c.id })}
              />
            ))}
          </ChipGroup>

          <ChipGroup label="Tell me by">
            {NOTIFY_CHOICES.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                active={wlNotify === c.id}
                onClick={() => set({ wlNotify: c.id })}
              />
            ))}
          </ChipGroup>

          <Banner tone="info">{oddsCopy(wlDays.length)}</Banner>

          <Button icon="bell-plus" iconSize={17} size="lg" full onClick={join}>
            Add me to the list
          </Button>
        </div>

        {/* ---- what they're already waiting on ---- */}
        <div className="scr-waitlist__side">
          <div className="scr-waitlist__sidehead">
            <span className="scr-waitlist__sidetitle">You’re waiting on</span>
            <span className="scr-waitlist__count">
              {plural(entries.length, "entry", "entries")}
            </span>
          </div>

          {entries.length === 0 ? (
            <EmptyState
              icon="bell-off"
              title="Nothing yet"
              body="Add yourself on the left and it’ll show up here with your place in line."
            />
          ) : (
            entries.map((entry) => (
              <EntryCard
                key={entry.key}
                entry={entry}
                onNudge={() =>
                  showToast("Window widened · we’ll look at more days", "ok")
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
  const svc = data.getService(entry.svc);
  const staff = data.getStaffMember(entry.staff);
  const tint = svc?.tint ?? "#0d9488";
  /* Stable per key, so a place in line does not shuffle on every render. */
  const pos = (hash(entry.key) % 4) + 1;

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
            {svc?.name ?? "Any service"}
          </span>
          <span className="scr-waitlist__entrysub">
            {staff ? `with ${staff.name}` : "any specialist"} ·{" "}
            {entry.iso ? formatShortISO(entry.iso) : "flexible"}
          </span>
        </span>
        <span className="scr-waitlist__pos">#{pos} in line</span>
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
            ? "You’re next — we’ll text you the moment it opens."
            : `About ${pos * 2} days’ wait at this time of year.`}
        </div>
      </div>

      <div className="scr-waitlist__entryfoot">
        <button
          type="button"
          className="bk-gi scr-waitlist__widen"
          onClick={onNudge}
        >
          Widen my window
        </button>
        <button
          type="button"
          className="bk-gi scr-waitlist__leave"
          onClick={onLeave}
        >
          Leave
        </button>
      </div>
    </div>
  );
}
