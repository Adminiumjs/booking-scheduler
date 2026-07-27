/*
 * Cancel-appointment modal (spec §4.21). Open iff `store.cancelCode` is set.
 * Ruling R10: `role="dialog"` + `aria-modal`, focus trapped and restored,
 * Escape and scrim click close it.
 */

import { data } from "../data/source.ts";
import { formatShortISO, minutesToTime } from "../lib/format.ts";
import { useStore } from "../state/store.ts";
import { Icon } from "./Icon.tsx";
import { useFocusTrap } from "./useFocusTrap.ts";

export function CancelModal() {
  const code = useStore((s) => s.cancelCode);
  const bookings = useStore((s) => s.bookings);
  const closeCancel = useStore((s) => s.closeCancel);
  const confirmCancel = useStore((s) => s.confirmCancel);

  const open = Boolean(code);
  const ref = useFocusTrap<HTMLDivElement>(open, closeCancel);

  const booking = code ? bookings[code] : undefined;
  if (!open || !booking) return null;

  const svc = data.getService(booking.svc);

  return (
    <div className="sm-modal-scrim" role="presentation" onClick={closeCancel}>
      <div
        ref={ref}
        className="sm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sm-cancel-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm-modal__body">
          <span className="sm-modal__tile">
            <Icon name="calendar-x" size={23} />
          </span>
          <h2 className="sm-modal__title" id="sm-cancel-title">
            Cancel this appointment?
          </h2>
          <p className="sm-modal__text">
            You&apos;re cancelling <strong>{svc?.name ?? booking.svc}</strong> on{" "}
            {formatShortISO(booking.dateISO)} at {minutesToTime(booking.time)}. Our
            cancellation window is 24 hours — inside that we may charge a small
            fee. This is a demo, so nothing is really charged.
          </p>
          <div className="sm-modal__actions">
            <button
              type="button"
              className="sm-gi sm-modal__btn sm-modal__btn--ghost"
              onClick={closeCancel}
            >
              Keep it
            </button>
            <button
              type="button"
              className="sm-btn sm-modal__btn sm-modal__btn--danger"
              onClick={confirmCancel}
            >
              Cancel appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
