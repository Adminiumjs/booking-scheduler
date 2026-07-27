/*
 * Segmented control (spec §4.17): reminder timing, recurrence frequency,
 * gift delivery, intake pressure.
 */

import type { CSSProperties } from "react";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible group name, e.g. `'Reminder timing'`. */
  label: string;
  className?: string;
  style?: CSSProperties;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  style,
}: SegmentedProps<T>) {
  return (
    <div
      className={["sm-seg", className].filter(Boolean).join(" ")}
      role="radiogroup"
      aria-label={label}
      style={style}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className="sm-seg__chip"
          data-active={o.value === value ? "true" : "false"}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
