/*
 * Toast layer (spec §4.20). One toast at a time, auto-dismissed by the store
 * after 2600 ms. Ruling R10: the region is always mounted and announced with
 * `aria-live="polite"` so the message is read when it appears.
 */

import { useStore } from "../state/store.ts";
import { Icon } from "./Icon.tsx";

export function ToastLayer() {
  const toast = useStore((s) => s.toast);

  return (
    <div className="bk-toast-layer" aria-live="polite" aria-atomic="true">
      {toast ? (
        <div className="bk-toast" key={toast.id} data-kind={toast.kind}>
          <Icon
            name={toast.kind === "warn" ? "alert-triangle" : "check-circle-2"}
            size={16}
          />
          {toast.msg}
        </div>
      ) : null}
    </div>
  );
}
