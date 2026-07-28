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
import { useStore } from "../state/store.ts";

const PERSONAS: { id: Persona; label: string; icon: IconName }[] = [
  { id: "guest", label: "Guest", icon: "user-round" },
  { id: "studio", label: "Studio", icon: "scissors" },
];

export default function DemoDock() {
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
            Demo
          </span>

          <div className="bk-dock__seg" role="group" aria-label="Persona">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`bk-gi bk-dock__segbtn${p.id === persona ? " is-active" : ""}`}
                onClick={() => setPersona(p.id)}
                aria-pressed={p.id === persona}
              >
                <Icon name={p.icon} size={14} />
                {p.label}
              </button>
            ))}
          </div>

          <span className="bk-dock__hint">
            {persona === "guest"
              ? "What a client sees"
              : "What the people running the salon see"}
          </span>

          <button
            type="button"
            className="bk-gi bk-dock__theme"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title="Toggle theme"
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
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
