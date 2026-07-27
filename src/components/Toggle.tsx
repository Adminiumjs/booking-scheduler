/* Switch (spec §4.16) — 42×24 track, 20px knob, logical-property offset. */

import type { CSSProperties } from "react";

export interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Accessible name — required, the control has no visible label of its own. */
  label: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  className,
  style,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={["sm-toggle", className].filter(Boolean).join(" ")}
      data-on={checked ? "true" : "false"}
      style={style}
    >
      <span className="sm-toggle__knob" />
    </button>
  );
}
