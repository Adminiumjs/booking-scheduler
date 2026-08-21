/*
 * The demo dock.
 *
 * Sits above the app and carries the persona segment (Guest | Studio), the
 * screen chips for whichever half is showing, and a theme toggle.
 *
 * The persona switch is the point of it. The 2026-07-28 Admin comp gave this
 * app a studio-side surface, so the demo can now show the same booking from
 * both ends: a guest books a slot, the studio sees it land on Today. Without
 * the dock there is no way to reach the studio half at all — the guest chrome
 * has no link to it, because a real salon's client would never see one.
 */

import { screensFor } from "./chrome.ts";
import { Icon } from "./Icon.tsx";
import type { IconName } from "./Icon.tsx";
import type { Persona } from "../data/types.ts";
import { LOCALES, LOCALE_TAGS, useI18n } from "../i18n/index.tsx";
import type { LocaleTag, MessageKey } from "../i18n/index.tsx";
import { useStore } from "../state/store.ts";

const PERSONAS: { id: Persona; labelKey: MessageKey; icon: IconName }[] = [
  { id: "guest", labelKey: "chrome.dock.guest", icon: "user-round" },
  { id: "studio", labelKey: "chrome.dock.studio", icon: "scissors" },
];

export default function DemoDock() {
  const { locale, setLocale, t } = useI18n();
  const view = useStore((s) => s.view);
  const persona = useStore((s) => s.persona);
  const theme = useStore((s) => s.theme);
  const go = useStore((s) => s.go);
  const setPersona = useStore((s) => s.setPersona);
  const toggleTheme = useStore((s) => s.toggleTheme);

  return (
    <div className="bk-dock">
      <div className="bk-dock__panel">
        <div className="bk-dock__top">
          <span className="bk-dock__label">
            <Icon name="app-window" size={14} />
            {t("chrome.dock.label")}
          </span>

          <div className="bk-dock__seg" role="group" aria-label={t("chrome.dock.persona")}>
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`bk-gi bk-dock__segbtn${p.id === persona ? " is-active" : ""}`}
                onClick={() => setPersona(p.id)}
                aria-pressed={p.id === persona}
              >
                <Icon name={p.icon} size={14} />
                {t(p.labelKey)}
              </button>
            ))}
          </div>

          <span className="bk-dock__hint">
            {persona === "guest"
              ? t("chrome.dock.hintGuest")
              : t("chrome.dock.hintStudio")}
          </span>

          {/* Languages are listed by endonym — a reader looking for their own
              language cannot be expected to recognise its English name. */}
          <select
            className="bk-dock__lang"
            value={locale}
            onChange={(e) => setLocale(e.target.value as LocaleTag)}
            aria-label={t("dock.language")}
            title={t("dock.language")}
          >
            {LOCALE_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {LOCALES[tag].native}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="bk-gi bk-dock__theme"
            onClick={toggleTheme}
            aria-label={t("chrome.theme.toggle")}
            title={t("chrome.theme.toggle")}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
          </button>
        </div>

        <div className="bk-dock__bottom">
          <div className="bk-dock__screens">
            {screensFor(persona).map((s) => (
              <button
                key={s.view}
                type="button"
                className={`bk-gi bk-dock__chip${view === s.view ? " is-active" : ""}`}
                onClick={() => go(s.view)}
                aria-pressed={view === s.view}
              >
                <Icon name={s.icon as IconName} size={14} />
                {t(s.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
