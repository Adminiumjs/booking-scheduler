/*
 * Week strip + day chip (spec §4.9). One component for both call sites — the
 * booking date step and the group screen's "Preferred date" — driven by the
 * `DaySummary[]` the slot engine produces (`daySummaries` / `simpleDaySummaries`).
 */

import { useI18n } from "../i18n/index.tsx";
import type { DaySummary } from "../lib/slots.ts";

export interface DayChipProps {
  day: DaySummary;
  active: boolean;
  onSelect: (index: number) => void;
  className?: string;
}

export function DayChip({ day, active, onSelect, className }: DayChipProps) {
  const { t, number } = useI18n();
  /* Two whole messages rather than one plus an optional tail: a comma is not
     the separator every locale would pick, and ar-EG wants its own. */
  const dayNum = number(day.dayNum);
  const label = day.subLabel
    ? t("chrome.dayChip.labelNote", {
        dow: day.dow,
        day: dayNum,
        note: day.subLabel,
      })
    : t("chrome.dayChip.label", { dow: day.dow, day: dayNum });
  return (
    <button
      type="button"
      className={["bk-day-chip", className].filter(Boolean).join(" ")}
      data-active={active ? "true" : "false"}
      disabled={day.disabled}
      aria-pressed={active}
      aria-label={label}
      onClick={() => onSelect(day.index)}
    >
      <span className="bk-day-chip__dow">{day.dow}</span>
      <span className="bk-mono bk-day-chip__num">{dayNum}</span>
      <span className="bk-day-chip__sub">{day.subLabel || " "}</span>
    </button>
  );
}

export interface WeekStripProps {
  days: readonly DaySummary[];
  /** Index of the selected day. */
  value: number;
  onSelect: (index: number) => void;
  /** Accessible name; defaults to the translated "Pick a date". */
  label?: string;
  className?: string;
}

export function WeekStrip({
  days,
  value,
  onSelect,
  label,
  className,
}: WeekStripProps) {
  const { t } = useI18n();
  return (
    <div
      className={["bk-scroll", "bk-weekstrip", className].filter(Boolean).join(" ")}
      role="group"
      aria-label={label ?? t("chrome.weekStrip.label")}
    >
      {days.map((d) => (
        <DayChip
          key={d.iso}
          day={d}
          active={d.index === value}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
