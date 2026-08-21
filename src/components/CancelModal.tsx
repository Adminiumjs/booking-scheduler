/*
 * Cancel-appointment modal (spec §4.21). Open iff `store.cancelCode` is set.
 * Ruling R10: `role="dialog"` + `aria-modal`, focus trapped and restored,
 * Escape and scrim click close it.
 */

import { data } from "../data/source.ts";
import { useT } from "../i18n/index.tsx";
import { formatShortISO, minutesToTime } from "../lib/format.ts";
import { useStore } from "../state/store.ts";
import { Icon } from "./Icon.tsx";
import { useFocusTrap } from "./useFocusTrap.ts";

export function CancelModal() {
  const t = useT();
  const code = useStore((s) => s.cancelCode);
  const bookings = useStore((s) => s.bookings);
  const closeCancel = useStore((s) => s.closeCancel);
  const confirmCancel = useStore((s) => s.confirmCancel);

  const open = Boolean(code);
  const ref = useFocusTrap<HTMLDivElement>(open, closeCancel);

  const booking = code ? bookings[code] : undefined;
  if (!open || !booking) return null;

  const svc = data.getService(booking.svc);

  /*
   * `{service}` is left unsubstituted and the sentence split on it, so the
   * bold run stays inline without the renderer owning any word order: where
   * the service name sits in the sentence is the translator's decision, and
   * languages that front it (or drop the preposition) still read correctly.
   */
  const [before, after = ""] = t("chrome.cancel.body", {
    date: formatShortISO(booking.dateISO),
    time: minutesToTime(booking.time),
  }).split("{service}");

  return (
    <div className="bk-modal-scrim" role="presentation" onClick={closeCancel}>
      <div
        ref={ref}
        className="bk-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bk-cancel-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bk-modal__body">
          <span className="bk-modal__tile">
            <Icon name="calendar-x" size={23} />
          </span>
          <h2 className="bk-modal__title" id="bk-cancel-title">
            {t("chrome.cancel.title")}
          </h2>
          <p className="bk-modal__text">
            {before}
            <strong>{svc?.name ?? booking.svc}</strong>
            {after} {t("chrome.cancel.note")}
          </p>
          <div className="bk-modal__actions">
            <button
              type="button"
              className="bk-gi bk-modal__btn bk-modal__btn--ghost"
              onClick={closeCancel}
            >
              {t("chrome.cancel.keep")}
            </button>
            <button
              type="button"
              className="bk-btn bk-modal__btn bk-modal__btn--danger"
              onClick={confirmCancel}
            >
              {t("chrome.cancel.confirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
