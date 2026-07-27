/*
 * Week strip + day chip (spec §4.9). One component for both call sites — the
 * booking date step and the group screen's "Preferred date" — driven by the
 * `DaySummary[]` the slot engine produces (`daySummaries` / `simpleDaySummaries`).
 */

import type { DaySummary } from "../lib/slots.ts";

export interface DayChipProps {
  day: DaySummary;
  active: boolean;
  onSelect: (index: number) => void;
  className?: string;
}

export function DayChip({ day, active, onSelect, className }: DayChipProps) {
  return (
    <button
      type="button"
      className={["sm-day-chip", className].filter(Boolean).join(" ")}
      data-active={active ? "true" : "false"}
      disabled={day.disabled}
      aria-pressed={active}
      aria-label={`${day.dow} ${day.dayNum}${day.subLabel ? `, ${day.subLabel}` : ""}`}
      onClick={() => onSelect(day.index)}
    >
      <span className="sm-day-chip__dow">{day.dow}</span>
      <span className="sm-mono sm-day-chip__num">{day.dayNum}</span>
      <span className="sm-day-chip__sub">{day.subLabel || " "}</span>
    </button>
  );
}

export interface WeekStripProps {
  days: readonly DaySummary[];
  /** Index of the selected day. */
  value: number;
  onSelect: (index: number) => void;
  /** Accessible name, e.g. `'Pick a date'`. */
  label?: string;
  className?: string;
}

export function WeekStrip({
  days,
  value,
  onSelect,
  label = "Pick a date",
  className,
}: WeekStripProps) {
  return (
    <div
      className={["sm-scroll", "sm-weekstrip", className].filter(Boolean).join(" ")}
      role="group"
      aria-label={label}
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
