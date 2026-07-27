/*
 * WAITLIST STATUS (view: 'waitliststatus') — port spec §3.7 and §6.10.
 *
 * Every day the visitor is waiting on, keyed `${iso}|${staffId}`. The staff id
 * may be the literal 'first', which reads back as "First available".
 */

import { useMemo } from "react";

import { BackLink, Button, EmptyState, Icon, IconTile } from "../components/index.ts";
import { data } from "../data/source.ts";
import type { WaitlistEntry } from "../data/types.ts";
import { formatLongISO } from "../lib/format.ts";
import { selectWaitlist, useStore } from "../state/store.ts";

import "../styles/screen-waitliststatus.css";

export default function WaitlistStatus() {
  const waitlist = useStore((s) => s.waitlist);
  const go = useStore((s) => s.go);
  const leaveWaitlist = useStore((s) => s.leaveWaitlist);

  /* `selectWaitlist` builds a fresh array — memoise it rather than run it
   * inside the selector. */
  const entries = useMemo(
    () => selectWaitlist(useStore.getState()),
    [waitlist],
  );

  return (
    <main className="bk-screen bk-page bk-wstatus">
      <BackLink onClick={() => go("home")}>Back home</BackLink>

      <div className="bk-wstatus__head">
        <h1 className="bk-h1">Waitlist status</h1>
        <p className="bk-sub">
          Days you’re waiting on — we’ll text you the moment a spot opens.
        </p>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon="bell-off"
          title="You’re not on any waitlists"
          body="If a day is fully booked, join its waitlist from the date & time step and it’ll appear here."
        />
      ) : (
        <div className="bk-wstatus__list">
          {entries.map((entry) => (
            <WaitlistRow
              key={entry.key}
              entry={entry}
              onLeave={() => leaveWaitlist(entry.key)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ *
 * One waiting day (local to this screen)
 * ------------------------------------------------------------------ */

interface WaitlistRowProps {
  entry: WaitlistEntry;
  onLeave: () => void;
}

function WaitlistRow({ entry, onLeave }: WaitlistRowProps) {
  const svc = data.getService(entry.svc);
  const staff = data.getStaffMember(entry.staff);
  const tint = svc?.tint ?? "#0d9488";

  return (
    <div className="bk-card bk-panel bk-wstatus-row">
      <IconTile
        icon={svc?.icon ?? "bell"}
        tint={tint}
        size={44}
        iconSize={19}
        radius={12}
      />
      <div className="bk-wstatus-row__text">
        <div className="bk-wstatus-row__svc">{svc?.name ?? "Any service"}</div>
        <div className="bk-wstatus-row__when">
          {entry.iso ? formatLongISO(entry.iso) : "Flexible"} ·{" "}
          {staff ? staff.name : "First available"}
        </div>
        <span className="bk-wstatus-row__pill">
          <Icon name="clock" size={12} />
          Waiting for an opening
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onLeave}
        className="bk-wstatus-row__leave"
      >
        Leave
      </Button>
    </div>
  );
}
