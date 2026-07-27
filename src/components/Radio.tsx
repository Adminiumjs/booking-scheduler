/*
 * The 24px radio dot used by the service rows and staff rows (spec §4.7).
 * Presentational only — the enclosing row owns the click target and the
 * `role="radio"` / `aria-checked` semantics.
 */

import type { CSSProperties } from "react";

import { Icon } from "./Icon.tsx";

export interface RadioProps {
  selected: boolean;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function Radio({ selected, size = 24, className, style }: RadioProps) {
  return (
    <span
      className={["bk-radio", className].filter(Boolean).join(" ")}
      data-on={selected ? "true" : "false"}
      aria-hidden="true"
      style={{ width: `${size}px`, height: `${size}px`, ...style }}
    >
      {selected ? <Icon name="check" size={size >= 24 ? 15 : 14} /> : null}
    </span>
  );
}
