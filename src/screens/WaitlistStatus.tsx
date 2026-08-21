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
import { useT } from "../i18n/index.tsx";
import { formatLongISO } from "../lib/format.ts";
import { selectWaitlist, useStore } from "../state/store.ts";

import "../styles/screen-waitliststatus.css";

export default function WaitlistStatus() {
  const t = useT();
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
      <BackLink onClick={() => go("home")}>
        {t("screensB.common.backHome")}
      </BackLink>

      <div className="bk-wstatus__head">
        <h1 className="bk-h1">{t("screensB.wstatus.title")}</h1>
        <p className="bk-sub">{t("screensB.wstatus.sub")}</p>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon="bell-off"
          title={t("screensB.wstatus.emptyTitle")}
          body={t("screensB.wstatus.emptyBody")}
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
  const t = useT();
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
        <div className="bk-wstatus-row__svc">
          {svc?.name ?? t("screensB.common.anyService")}
        </div>
        <div className="bk-wstatus-row__when">
          {t("screensB.wstatus.whenWho", {
            date: entry.iso
              ? formatLongISO(entry.iso)
              : t("screensB.wstatus.flexible"),
            who: staff ? staff.name : t("screensB.common.firstAvailable"),
          })}
        </div>
        <span className="bk-wstatus-row__pill">
          <Icon name="clock" size={12} />
          {t("screensB.wstatus.waiting")}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onLeave}
        className="bk-wstatus-row__leave"
      >
        {t("screensB.common.leave")}
      </Button>
    </div>
  );
}
