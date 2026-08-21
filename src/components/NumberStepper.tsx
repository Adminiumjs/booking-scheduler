/* −/+ stepper (spec §4.19) — the recurrence visit count. */

import type { CSSProperties } from "react";

import { useT } from "../i18n/index.tsx";
import { Icon } from "./Icon.tsx";

export interface NumberStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Full label shown between the buttons, e.g. `'4 visits'`. */
  format?: (value: number) => string;
  /** Accessible name for the pair of buttons, e.g. `'How many visits'`. */
  label: string;
  className?: string;
  style?: CSSProperties;
}

export function NumberStepper({
  value,
  onChange,
  min = 2,
  max = 8,
  step = 1,
  format = (v) => `${v}`,
  label,
  className,
  style,
}: NumberStepperProps) {
  const t = useT();
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div
      className={["bk-stepper-num", className].filter(Boolean).join(" ")}
      style={style}
    >
      <button
        type="button"
        className="bk-gi bk-stepper-num__btn"
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        aria-label={t("chrome.stepper.decrease", { label })}
      >
        <Icon name="minus" size={15} />
      </button>
      <span className="bk-stepper-num__value" aria-live="polite">
        {format(value)}
      </span>
      <button
        type="button"
        className="bk-gi bk-stepper-num__btn"
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        aria-label={t("chrome.stepper.increase", { label })}
      >
        <Icon name="plus" size={15} />
      </button>
    </div>
  );
}
