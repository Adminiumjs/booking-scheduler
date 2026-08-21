/*
 * Mobile menu sheet (spec §4.22) — drops from the top below 900px.
 * Ruling R10: `role="dialog"` + `aria-modal`, focus trapped, Escape closes,
 * focus restored to the hamburger on close.
 */

import type { View } from "../data/types.ts";
import { useT } from "../i18n/index.tsx";
import type { MessageKey } from "../i18n/index.tsx";
import { useStore } from "../state/store.ts";
import type { HomeAnchor } from "../state/store.ts";
import { Button, IconButton } from "./Button.tsx";
import { Icon } from "./Icon.tsx";
import { useFocusTrap } from "./useFocusTrap.ts";

interface SheetItem {
  labelKey: MessageKey;
  icon: string;
  view?: View;
  anchor?: HomeAnchor;
}

const ITEMS: SheetItem[] = [
  { labelKey: "chrome.menu.services", icon: "sparkles", view: "services" },
  { labelKey: "chrome.menu.membership", icon: "gem", view: "loyalty" },
  { labelKey: "chrome.menu.team", icon: "users", anchor: "team" },
  { labelKey: "chrome.menu.visit", icon: "map-pin", anchor: "visit" },
];

export function MobileSheet() {
  const t = useT();
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
        aria-label={t("chrome.sheet.title")}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bk-sheet__head">
          <span className="bk-sheet__title">{t("chrome.sheet.title")}</span>
          <IconButton icon="x" label={t("chrome.sheet.close")} size={36} onClick={close} />
        </div>
        <nav className="bk-sheet__nav" aria-label={t("chrome.sheet.nav")}>
          {ITEMS.map((item) => (
            <button
              key={item.labelKey}
              type="button"
              className="bk-gi bk-sheet__item"
              onClick={() =>
                item.anchor ? goHomeScroll(item.anchor) : go(item.view as View)
              }
            >
              <Icon name={item.icon} size={18} />
              {t(item.labelKey)}
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
          {t("chrome.header.book")}
        </Button>
      </div>
    </div>
  );
}
