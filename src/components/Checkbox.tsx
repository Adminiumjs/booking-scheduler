/*
 * Checkbox (spec §4.18). `Checkbox` is the 22px box on its own; `CheckboxRow`
 * is the tappable row that wraps it (intake concerns, the consent notice).
 */

import type { CSSProperties, ReactNode } from "react";

import { Icon } from "./Icon.tsx";

export interface CheckboxProps {
  checked: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Presentational box — put it inside a `CheckboxRow` or your own button. */
export function Checkbox({ checked, className, style }: CheckboxProps) {
  return (
    <span
      className={["sm-check", className].filter(Boolean).join(" ")}
      data-on={checked ? "true" : "false"}
      style={style}
      aria-hidden="true"
    >
      {checked ? <Icon name="check" size={14} /> : null}
    </span>
  );
}

export interface CheckboxRowProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
  /** Overrides the derived accessible name when `children` is rich markup. */
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

export function CheckboxRow({
  checked,
  onChange,
  children,
  ariaLabel,
  className,
  style,
}: CheckboxRowProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={["sm-check-row", className].filter(Boolean).join(" ")}
      data-on={checked ? "true" : "false"}
      style={style}
    >
      <Checkbox checked={checked} />
      <span className="sm-check-row__label">{children}</span>
    </button>
  );
}
