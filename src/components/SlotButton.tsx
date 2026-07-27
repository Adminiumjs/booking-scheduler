/*
 * Slot button (spec §4.10) — one 30-minute start in the time grid.
 * Taken slots are disabled and struck through.
 */

import type { Slot } from "../lib/slots.ts";

export interface SlotButtonProps {
  slot: Slot;
  selected: boolean;
  /** Receives the start minute and the staff member it resolved to. */
  onSelect: (min: number, staffId: string | null) => void;
  className?: string;
}

export function SlotButton({
  slot,
  selected,
  onSelect,
  className,
}: SlotButtonProps) {
  const state = selected ? "selected" : slot.free ? "free" : "taken";
  return (
    <button
      type="button"
      className={["sm-slot", "sm-slot-btn", className].filter(Boolean).join(" ")}
      data-state={state}
      disabled={!slot.free}
      aria-pressed={selected}
      aria-label={slot.free ? slot.label : `${slot.label} — unavailable`}
      onClick={() => onSelect(slot.min, slot.staff)}
    >
      {slot.label}
    </button>
  );
}

export interface SlotSkeletonProps {
  /** Number of shimmer blocks (12 in the comp). */
  count?: number;
  className?: string;
}

/** The 560 ms shimmer shown after any day or staff change. */
export function SlotSkeleton({ count = 12, className }: SlotSkeletonProps) {
  return (
    <div
      className={["sm-slot-grid", className].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <div className="sm-skel" key={i} />
      ))}
    </div>
  );
}
