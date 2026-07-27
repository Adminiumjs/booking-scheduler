/* Filter chip (spec §4.11) — the category rows on Services and booking step 0. */

import type { CSSProperties } from "react";

import { Icon } from "./Icon.tsx";

export interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  /** Lucide name; 15px on Services, 14px inside the booking flow. */
  icon?: string;
  iconSize?: number;
  /** Optional trailing mono count. */
  count?: number;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Chip({
  label,
  active,
  onClick,
  icon,
  iconSize = 15,
  count,
  disabled = false,
  className,
  style,
}: ChipProps) {
  return (
    <button
      type="button"
      className={["sm-chip", "sm-chip-btn", className].filter(Boolean).join(" ")}
      data-active={active ? "true" : "false"}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      style={style}
    >
      {icon ? <Icon name={icon} size={iconSize} /> : null}
      {label}
      {count !== undefined ? (
        <span className="sm-chip-btn__count">{count}</span>
      ) : null}
    </button>
  );
}
