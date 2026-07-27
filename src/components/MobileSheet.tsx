/*
 * Mobile menu sheet (spec §4.22) — drops from the top below 900px.
 * Ruling R10: `role="dialog"` + `aria-modal`, focus trapped, Escape closes,
 * focus restored to the hamburger on close.
 */

import type { View } from "../data/types.ts";
import { useStore } from "../state/store.ts";
import type { HomeAnchor } from "../state/store.ts";
import { Button, IconButton } from "./Button.tsx";
import { Icon } from "./Icon.tsx";
import { useFocusTrap } from "./useFocusTrap.ts";

interface SheetItem {
  label: string;
  icon: string;
  view?: View;
  anchor?: HomeAnchor;
}

const ITEMS: SheetItem[] = [
  { label: "Services", icon: "sparkles", view: "services" },
  { label: "Membership", icon: "gem", view: "loyalty" },
  { label: "Team", icon: "users", anchor: "team" },
  { label: "Visit us", icon: "map-pin", anchor: "visit" },
];

export function MobileSheet() {
  const open = useStore((s) => s.menuOpen);
  const setMenu = useStore((s) => s.setMenu);
  const go = useStore((s) => s.go);
  const goHomeScroll = useStore((s) => s.goHomeScroll);
  const startBooking = useStore((s) => s.startBooking);

  const close = () => setMenu(false);
  const ref = useFocusTrap<HTMLDivElement>(open, close);

  if (!open) return null;

  return (
    <div
      className="bk-sheet-scrim"
      onClick={close}
      role="presentation"
    >
      <div
        ref={ref}
        className="bk-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bk-sheet__head">
          <span className="bk-sheet__title">Menu</span>
          <IconButton icon="x" label="Close menu" size={36} onClick={close} />
        </div>
        <nav className="bk-sheet__nav" aria-label="Mobile">
          {ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              className="bk-gi bk-sheet__item"
              onClick={() =>
                item.anchor ? goHomeScroll(item.anchor) : go(item.view as View)
              }
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <Button
          icon="calendar-plus"
          full
          size="lg"
          onClick={() => startBooking(null)}
          style={{ marginBlockStart: "12px" }}
        >
          Book now
        </Button>
      </div>
    </div>
  );
}
