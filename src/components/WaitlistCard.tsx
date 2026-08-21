/*
 * Waitlist nudge under the slot grid (spec §4.13). Three copy states —
 * already joined, day fully booked, and the neutral "don't see the right
 * time?" — are chosen by the caller and passed in.
 */

import { useT } from "../i18n/index.tsx";
import { Icon } from "./Icon.tsx";

export interface WaitlistCardProps {
  title: string;
  sub: string;
  /** True once the user is on this day's waitlist. */
  joined: boolean;
  /** True when the day has windows but nothing free — highlights the card. */
  full: boolean;
  onJoin: () => void;
  className?: string;
}

export function WaitlistCard({
  title,
  sub,
  joined,
  full,
  onJoin,
  className,
}: WaitlistCardProps) {
  const t = useT();
  return (
    <div
      className={["bk-waitlist", className].filter(Boolean).join(" ")}
      data-full={full && !joined ? "true" : "false"}
    >
      <span className="bk-waitlist__tile">
        <Icon name={joined ? "check-circle-2" : "bell-plus"} size={20} />
      </span>
      <div className="bk-waitlist__text">
        <div className="bk-waitlist__title">{title}</div>
        <div className="bk-waitlist__sub">{sub}</div>
      </div>
      <button
        type="button"
        className={joined ? "bk-waitlist__btn" : "bk-btn bk-waitlist__btn"}
        data-joined={joined ? "true" : "false"}
        disabled={joined}
        onClick={onJoin}
      >
        {joined ? (
          <>
            <Icon name="check-circle-2" size={15} />
            {t("chrome.waitlist.joined")}
          </>
        ) : (
          <>
            <Icon name="bell-plus" size={15} />
            {t("chrome.waitlist.join")}
          </>
        )}
      </button>
    </div>
  );
}
