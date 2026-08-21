/*
 * Booking stepper (spec §4.8) and the simpler gift-card variant.
 *
 * Reachability is computed by the caller: `maxReachable` comes from
 * `reachMax(state)` in the store, and `lockedBelow` is 2 during a reschedule
 * (service + staff are frozen).
 */

import { useT } from "../i18n/index.tsx";
import type { MessageKey } from "../i18n/index.tsx";
import { Icon } from "./Icon.tsx";

export interface StepperProps {
  /**
   * `STEP_LABELS` from the store — message keys, resolved here. A caller that
   * passes ready-made text instead still works: an unknown key resolves to
   * itself, so already-translated labels pass straight through.
   */
  steps: readonly MessageKey[];
  current: number;
  /** Highest index the user may jump to. */
  maxReachable: number;
  /** Indices below this are not clickable (reschedule locks 0 and 1). */
  lockedBelow?: number;
  onGo: (index: number) => void;
  className?: string;
}

export function Stepper({
  steps,
  current,
  maxReachable,
  lockedBelow = 0,
  onGo,
  className,
}: StepperProps) {
  const t = useT();
  const limit = Math.max(maxReachable, current);
  return (
    <nav
      className={["bk-scroll", "bk-stepper", className].filter(Boolean).join(" ")}
      aria-label={t("chrome.stepper.booking")}
    >
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const canGo = i >= lockedBelow && i <= limit;
        return (
          <div className="bk-stepper__item" key={label}>
            <button
              type="button"
              className="bk-stepper__btn"
              onClick={() => canGo && onGo(i)}
              disabled={!canGo}
              aria-current={active ? "step" : undefined}
              data-state={done ? "done" : active ? "active" : "future"}
              data-reachable={canGo ? "true" : "false"}
            >
              <span className="bk-stepper__bubble">
                {done ? <Icon name="check" size={14} /> : i + 1}
              </span>
              <span className="bk-stepper__label">{t(label)}</span>
            </button>
            {i < steps.length - 1 ? <span className="bk-stepper__bar" /> : null}
          </div>
        );
      })}
    </nav>
  );
}

export interface GiftStepperProps {
  /** e.g. `['Design', 'Message', 'Payment']`. */
  steps: readonly MessageKey[];
  current: number;
  className?: string;
}

/** Read-only 26px-dot variant used by the gift-card flow (spec §4.8). */
export function GiftStepper({ steps, current, className }: GiftStepperProps) {
  const t = useT();
  return (
    <div
      className={["bk-gift-stepper", className].filter(Boolean).join(" ")}
      aria-label={t("chrome.stepper.gift")}
      role="group"
    >
      {steps.map((label, i) => (
        <div className="bk-gift-stepper__item" key={label}>
          <span
            className="bk-gift-stepper__dot"
            data-state={i < current ? "done" : i === current ? "active" : "future"}
            aria-current={i === current ? "step" : undefined}
          >
            {i < current ? <Icon name="check" size={13} /> : i + 1}
          </span>
          <span className="bk-gift-stepper__label">{t(label)}</span>
          {i < steps.length - 1 ? <span className="bk-gift-stepper__bar" /> : null}
        </div>
      ))}
    </div>
  );
}
