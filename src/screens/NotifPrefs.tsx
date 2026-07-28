/*
 * NOTIFICATION PREFERENCES (view: 'notifprefs') — revised comp, guest half.
 *
 * Three channels, six categories, and the timing block. There is no save step:
 * every control writes straight to `store.np`, which is what the subtitle
 * promises.
 */

import {
  BackLink,
  Card,
  Eyebrow,
  Icon,
  Segmented,
  Toggle,
} from "../components/index.ts";
import {
  NOTIF_CATEGORIES,
  NOTIF_CHANNELS,
  NOTIF_QUIET_OPTIONS,
  NOTIF_WHEN_OPTIONS,
} from "../data/screens/notifprefs.ts";
import type { NotifChannel } from "../data/screens/notifprefs.ts";
import type { NotifPrefs as Prefs } from "../data/types.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-notifprefs.css";

export default function NotifPrefs() {
  const np = useStore((s) => s.np);
  const set = useStore((s) => s.set);
  const go = useStore((s) => s.go);
  const showToast = useStore((s) => s.showToast);

  const patch = (next: Partial<Prefs>): void => set({ np: { ...np, ...next } });

  /* Same reason as the account screen: a computed key would widen the
   * literal, so the write lands on an already-typed copy. */
  const setChannel = (key: NotifChannel, on: boolean): void => {
    const copy: Prefs = { ...np };
    copy[key] = on;
    set({ np: copy });
  };

  const setCategory = (key: string, on: boolean): void =>
    patch({ cat: { ...np.cat, [key]: on } });

  const pauseAll = (): void => {
    patch({
      email: false,
      sms: false,
      push: false,
      /* Derived from the row list so a new category can never be missed by
       * the reset — the comp spelled all six out a second time. */
      cat: Object.fromEntries(NOTIF_CATEGORIES.map((c) => [c.key, false])),
    });
    showToast("All notifications paused", "warn");
  };

  return (
    <section className="bk-screen bk-page scr-notifprefs">
      <BackLink onClick={() => go("dash")}>Back to dashboard</BackLink>

      <header className="scr-notifprefs__head">
        <h1 className="bk-h1">Notification preferences</h1>
        <p className="bk-sub">
          Choose what reaches you, and how. Changes save as you go.
        </p>
      </header>

      <Eyebrow className="scr-notifprefs__eyebrow">Channels</Eyebrow>
      <Card clip className="scr-notifprefs__list">
        {NOTIF_CHANNELS.map((c, i) => (
          <PrefRow
            key={c.key}
            icon={c.icon}
            title={c.label}
            sub={c.sub}
            checked={np[c.key]}
            onChange={(on) => setChannel(c.key, on)}
            last={i === NOTIF_CHANNELS.length - 1}
          />
        ))}
      </Card>

      <Eyebrow className="scr-notifprefs__eyebrow">What we send</Eyebrow>
      <Card clip className="scr-notifprefs__list">
        {NOTIF_CATEGORIES.map((c, i) => (
          <PrefRow
            key={c.key}
            icon={c.icon}
            title={c.label}
            sub={c.sub}
            checked={Boolean(np.cat[c.key])}
            onChange={(on) => setCategory(c.key, on)}
            last={i === NOTIF_CATEGORIES.length - 1}
          />
        ))}
      </Card>

      <Eyebrow className="scr-notifprefs__eyebrow">Timing</Eyebrow>
      <Card padding="18px 20px" className="scr-notifprefs__timing">
        <div>
          <span className="scr-notifprefs__title">Remind me</span>
          <span className="scr-notifprefs__sub scr-notifprefs__sub--spaced">
            How far ahead of a visit we get in touch.
          </span>
          <Segmented
            label="Reminder timing"
            options={NOTIF_WHEN_OPTIONS}
            value={np.when}
            onChange={(v) => patch({ when: v })}
          />
        </div>

        <div className="scr-notifprefs__quiet">
          <div className="scr-notifprefs__quietrow">
            <span className="scr-notifprefs__text">
              <span className="scr-notifprefs__title">Quiet hours</span>
              <span className="scr-notifprefs__sub">
                Hold anything non-urgent until morning.
              </span>
            </span>
            <Toggle
              checked={np.quiet}
              onChange={(on) => patch({ quiet: on })}
              label="Quiet hours"
            />
          </div>
          {np.quiet ? (
            <div className="scr-notifprefs__quietwin">
              <Segmented
                label="Quiet window"
                options={NOTIF_QUIET_OPTIONS}
                value={np.quietWin}
                onChange={(v) => patch({ quietWin: v })}
              />
            </div>
          ) : null}
        </div>
      </Card>

      <div className="scr-notifprefs__pause">
        <div>
          <div className="scr-notifprefs__pausetitle">Pause everything</div>
          <div className="scr-notifprefs__pausebody">
            Turns off every channel. Booking confirmations still arrive by
            email.
          </div>
        </div>
        <button
          type="button"
          className="bk-gi scr-notifprefs__pausebtn"
          onClick={pauseAll}
        >
          Pause all
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * One preference row (local to this screen)
 * ------------------------------------------------------------------ */

interface PrefRowProps {
  icon: string;
  title: string;
  sub: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Drops the separator on the final row of a list. */
  last: boolean;
}

/*
 * The comp made the whole row a `<button>` with a fake toggle inside it, which
 * would nest a button in a button here. The row is a plain container and the
 * `Toggle` is the only control — same hit target on the switch, valid markup,
 * and one thing for a screen reader to announce.
 */
function PrefRow({ icon, title, sub, checked, onChange, last }: PrefRowProps) {
  return (
    <div
      className="scr-notifprefs__row"
      data-last={last ? "true" : "false"}
    >
      <span className="scr-notifprefs__icon">
        <Icon name={icon} size={16} />
      </span>
      <span className="scr-notifprefs__text">
        <span className="scr-notifprefs__title">{title}</span>
        <span className="scr-notifprefs__sub">{sub}</span>
      </span>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}
