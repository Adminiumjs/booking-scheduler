/*
 * Focus management for the modal and the mobile sheet (ruling R10 — the comp
 * had none). While `active` is true the hook:
 *   - moves focus into the container,
 *   - cycles Tab / Shift+Tab inside it,
 *   - calls `onEscape` on Escape,
 *   - restores focus to whatever was focused before, on close.
 */

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function useFocusTrap<T extends HTMLElement>(
  active: boolean,
  onEscape?: () => void,
) {
  const ref = useRef<T>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    restoreTo.current = document.activeElement as HTMLElement | null;

    const node = ref.current;
    const focusables = (): HTMLElement[] =>
      node ? Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];

    const first = focusables()[0];
    (first ?? node)?.focus();

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onEscape?.();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const current = document.activeElement;
      if (e.shiftKey && (current === firstItem || current === node)) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && current === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      restoreTo.current?.focus?.();
    };
  }, [active, onEscape]);

  return ref;
}
