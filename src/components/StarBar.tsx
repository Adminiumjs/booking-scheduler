/*
 * Star rating (spec §4.6): two ★★★★★ runs, the filled one clipped to
 * `value / max` of the width. Fill colour is `--star` (#f5a623), which is
 * deliberately theme-independent.
 */

import type { CSSProperties } from "react";

export interface StarBarProps {
  /** Rating out of `max` — accepts fractions (4.75 renders 95% filled). */
  value: number;
  max?: number;
  /** Font size in px (16 on the home rating box, 13 on a review card). */
  size?: number;
  /** Letter spacing in px. */
  gap?: number;
  /** Accessible text; defaults to `"4.8 out of 5"`. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

const RUN = "★★★★★";

export function StarBar({
  value,
  max = 5,
  size = 13,
  gap = 1,
  label,
  className,
  style,
}: StarBarProps) {
  const pct = Math.max(0, Math.min(1, value / max)) * 100;
  return (
    <span
      className={["bk-stars", className].filter(Boolean).join(" ")}
      role="img"
      aria-label={label ?? `${value} out of ${max}`}
      style={{ fontSize: `${size}px`, letterSpacing: `${gap}px`, ...style }}
    >
      <span className="bk-stars__back" aria-hidden="true">
        {RUN}
      </span>
      <span
        className="bk-stars__front"
        aria-hidden="true"
        style={{ width: `${pct}%` }}
      >
        {RUN}
      </span>
    </span>
  );
}
