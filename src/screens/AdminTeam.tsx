/*
 * TEAM (view: 'admin-team') — Admin comp, template lines 496–537.
 *
 * One card per specialist showing how their day is filling up, then the
 * time-off queue.
 *
 * The four people come from the shared seam, so the studio and the guest half
 * can never list a different team. Only today's roster is page-local — it keys
 * off the same appointment ids the comp used, so checking a guest in on Today
 * flips the matching card to "With a guest" here through `apptState`.
 *
 * Time-off decisions ride on `apptState` too, under an `off_` prefix. That is
 * the comp's own trick and it keeps approvals in the one place the studio
 * screens already share, with no chance of colliding with a booking id.
 */

import type { CSSProperties } from "react";
import { useMemo } from "react";

import { Avatar } from "../components/index.ts";
import { data } from "../data/source.ts";
import type { StaffMember } from "../data/types.ts";
import {
  STANDARD_DAY_MINUTES,
  TEAM_ROSTER,
  TIME_OFF,
} from "../data/screens/admin-team.ts";
import type { TimeOffRequest } from "../data/screens/admin-team.ts";
import { minutesToTime, money } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-admin-team.css";

/** Latest minute this specialist is ever rostered until, across the week. */
function shiftEnd(staff: StaffMember): string {
  const ends = Object.values(staff.hours).flatMap((windows) =>
    (windows ?? []).map(([, end]) => end),
  );
  return ends.length > 0 ? minutesToTime(Math.max(...ends)) : "—";
}

export default function AdminTeam() {
  const apptState = useStore((s) => s.apptState);

  /* One pass over the roster: the live rows (a cancellation frees the chair)
   * bucketed by specialist. */
  const byStaff = useMemo(() => {
    const out = new Map<string, { count: number; mins: number; takings: number; inChair: boolean }>();
    for (const row of TEAM_ROSTER) {
      const status = apptState[row.id] ?? row.status;
      if (status === "cancelled") continue;
      const svc = data.getService(row.svcId);
      if (!svc) continue;
      const acc = out.get(row.staffId) ?? {
        count: 0,
        mins: 0,
        takings: 0,
        inChair: false,
      };
      acc.count += 1;
      acc.mins += svc.dur;
      acc.takings += svc.price;
      acc.inChair = acc.inChair || status === "arrived";
      out.set(row.staffId, acc);
    }
    return out;
  }, [apptState]);

  return (
    <div className="scr-admin-team">
      <div className="scr-admin-team__grid">
        {data.getStaff().map((staff) => (
          <TeamCard
            key={staff.id}
            staff={staff}
            day={
              byStaff.get(staff.id) ?? {
                count: 0,
                mins: 0,
                takings: 0,
                inChair: false,
              }
            }
          />
        ))}
      </div>

      <section className="scr-admin-team__panel">
        <h2 className="scr-admin-team__paneltitle">Time off &amp; cover requests</h2>
        {TIME_OFF.map((req) => (
          <TimeOffRow key={req.key} req={req} />
        ))}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * One specialist
 * ------------------------------------------------------------------ */

interface DayTotals {
  count: number;
  mins: number;
  takings: number;
  inChair: boolean;
}

function TeamCard({ staff, day }: { staff: StaffMember; day: DayTotals }) {
  const set = useStore((s) => s.set);
  const go = useStore((s) => s.go);
  const showToast = useStore((s) => s.showToast);

  const pct = Math.min(100, Math.round((day.mins / STANDARD_DAY_MINUTES) * 100));
  const stats = [
    { label: "Bookings", value: String(day.count) },
    { label: "Takings", value: money(day.takings) },
    { label: "Finishes", value: shiftEnd(staff) },
  ];

  return (
    <article className="scr-admin-team__card">
      <div className="scr-admin-team__who">
        <Avatar
          initials={staff.initials}
          tint={staff.tint}
          size={40}
          fontSize={14}
          radius={999}
        />
        <span className="scr-admin-team__id">
          <span className="scr-admin-team__name">{staff.name}</span>
          <span className="scr-admin-team__role">{staff.role}</span>
        </span>
        <span
          className="scr-admin-team__state"
          data-busy={day.inChair ? "true" : "false"}
        >
          {day.inChair ? "With a guest" : "Free now"}
        </span>
      </div>

      <div className="scr-admin-team__stats">
        {stats.map((s) => (
          <div key={s.label} className="scr-admin-team__stat">
            <span className="scr-admin-team__statval bk-mono">{s.value}</span>
            <span className="scr-admin-team__statlabel">{s.label}</span>
          </div>
        ))}
      </div>

      <div>
        <div className="scr-admin-team__barhead">
          <span className="scr-admin-team__barlabel">Booked today</span>
          <span className="scr-admin-team__barpct bk-mono">{pct}%</span>
        </div>
        {/* The comp drew a bare div; a progressbar role makes the same picture
            readable to assistive tech. */}
        <div
          className="scr-admin-team__track"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${staff.name} booked today`}
        >
          <span
            className="scr-admin-team__bar"
            style={
              { inlineSize: `${pct}%`, "--bar-tint": staff.tint } as CSSProperties
            }
          />
        </div>
      </div>

      <div className="scr-admin-team__actions">
        <button
          type="button"
          className="bk-gi scr-admin-team__act"
          onClick={() => {
            set({ staffFilter: staff.id });
            go("admin-cal");
          }}
        >
          Schedule
        </button>
        <button
          type="button"
          className="bk-gi scr-admin-team__act scr-admin-team__act--quiet"
          onClick={() => showToast(`Message sent to ${staff.name}`)}
        >
          Message
        </button>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ *
 * One time-off request
 * ------------------------------------------------------------------ */

function TimeOffRow({ req }: { req: TimeOffRequest }) {
  const apptState = useStore((s) => s.apptState);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const key = `off_${req.key}`;
  const decision = apptState[key];

  /* Merged against the live store, not this render's snapshot: two decisions
   * inside one React batch would otherwise lose the first. */
  const settle = (verdict: "ok" | "no") =>
    set({ apptState: { ...useStore.getState().apptState, [key]: verdict } });

  return (
    <div className="scr-admin-team__req">
      <Avatar
        initials={req.initials}
        tint={req.tint}
        size={32}
        fontSize={11}
        radius={999}
      />
      <span className="scr-admin-team__reqid">
        <span className="scr-admin-team__reqwho">
          {req.who} · {req.what}
        </span>
        <span className="scr-admin-team__reqwhen">
          {req.when} · {req.impact}
        </span>
      </span>

      {decision ? (
        <span
          className="scr-admin-team__verdict"
          data-approved={decision === "ok" ? "true" : "false"}
        >
          {decision === "ok" ? "Approved" : "Declined"}
        </span>
      ) : (
        <span className="scr-admin-team__reqacts">
          <button
            type="button"
            className="bk-btn scr-admin-team__approve"
            onClick={() => {
              settle("ok");
              showToast(`${req.who}’s ${req.what} approved`);
            }}
          >
            Approve
          </button>
          <button
            type="button"
            className="bk-gi scr-admin-team__decline"
            onClick={() => {
              settle("no");
              showToast(`${req.who} told — declined`, "warn");
            }}
          >
            Decline
          </button>
        </span>
      )}
    </div>
  );
}
