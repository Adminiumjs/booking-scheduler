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
import { useT } from "../i18n/index.tsx";
import { formatNumber, minutesToTime } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-notifprefs.css";

export default function NotifPrefs() {
  const t = useT();
  const np = useStore((s) => s.np);
  const set = useStore((s) => s.set);
  const go = useStore((s) => s.go);
  const showToast = useStore((s) => s.showToast);

  const patch = (next: Partial<Prefs>): void => set({ np: { ...np, ...next } });

  /* The two segmented rows are seeded as keys plus numbers — the reminder
   * lead-time needs a plural and the quiet window is two points on the
   * reader's own clock, so both are spelled here rather than in the seed. */
  const whenOptions = NOTIF_WHEN_OPTIONS.map((o) => ({
    value: o.value,
    label:
      o.hours === null
        ? t(o.labelKey)
        : t(o.labelKey, { count: formatNumber(o.hours) }, o.hours),
  }));

  const quietOptions = NOTIF_QUIET_OPTIONS.map((o) => ({
    value: o.value,
    label:
      o.from === null || o.to === null
        ? t(o.labelKey)
        : t(o.labelKey, {
            from: minutesToTime(o.from),
            to: minutesToTime(o.to),
          }),
  }));

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
    showToast(t("screensB.notifprefs.toastPaused"), "warn");
  };

  return (
    <section className="bk-screen bk-page scr-notifprefs">
      <BackLink onClick={() => go("dash")}>
        {t("screensB.common.backToDashboard")}
      </BackLink>

      <header className="scr-notifprefs__head">
        <h1 className="bk-h1">{t("screensB.notifprefs.title")}</h1>
        <p className="bk-sub">{t("screensB.notifprefs.sub")}</p>
      </header>

      <Eyebrow className="scr-notifprefs__eyebrow">
        {t("screensB.notifprefs.channels")}
      </Eyebrow>
      <Card clip className="scr-notifprefs__list">
        {NOTIF_CHANNELS.map((c, i) => (
          <PrefRow
            key={c.key}
            icon={c.icon}
            title={t(c.labelKey)}
            sub={t(c.subKey)}
            checked={np[c.key]}
            onChange={(on) => setChannel(c.key, on)}
            last={i === NOTIF_CHANNELS.length - 1}
          />
        ))}
      </Card>

      <Eyebrow className="scr-notifprefs__eyebrow">
        {t("screensB.notifprefs.whatWeSend")}
      </Eyebrow>
      <Card clip className="scr-notifprefs__list">
        {NOTIF_CATEGORIES.map((c, i) => (
          <PrefRow
            key={c.key}
            icon={c.icon}
            title={t(c.labelKey)}
            sub={t(c.subKey)}
            checked={Boolean(np.cat[c.key])}
            onChange={(on) => setCategory(c.key, on)}
            last={i === NOTIF_CATEGORIES.length - 1}
          />
        ))}
      </Card>

      <Eyebrow className="scr-notifprefs__eyebrow">
        {t("screensB.notifprefs.timing")}
      </Eyebrow>
      <Card padding="18px 20px" className="scr-notifprefs__timing">
        <div>
          <span className="scr-notifprefs__title">
            {t("screensB.notifprefs.remindMe")}
          </span>
          <span className="scr-notifprefs__sub scr-notifprefs__sub--spaced">
            {t("screensB.notifprefs.remindSub")}
          </span>
          <Segmented
            label={t("screensB.notifprefs.reminderTiming")}
            options={whenOptions}
            value={np.when}
            onChange={(v) => patch({ when: v })}
          />
        </div>

        <div className="scr-notifprefs__quiet">
          <div className="scr-notifprefs__quietrow">
            <span className="scr-notifprefs__text">
              <span className="scr-notifprefs__title">
                {t("screensB.notifprefs.quietHours")}
              </span>
              <span className="scr-notifprefs__sub">
                {t("screensB.notifprefs.quietSub")}
              </span>
            </span>
            <Toggle
              checked={np.quiet}
              onChange={(on) => patch({ quiet: on })}
              label={t("screensB.notifprefs.quietHours")}
            />
          </div>
          {np.quiet ? (
            <div className="scr-notifprefs__quietwin">
              <Segmented
                label={t("screensB.notifprefs.quietWindow")}
                options={quietOptions}
                value={np.quietWin}
                onChange={(v) => patch({ quietWin: v })}
              />
            </div>
          ) : null}
        </div>
      </Card>

      <div className="scr-notifprefs__pause">
        <div>
          <div className="scr-notifprefs__pausetitle">
            {t("screensB.notifprefs.pauseTitle")}
          </div>
          <div className="scr-notifprefs__pausebody">
            {t("screensB.notifprefs.pauseBody")}
          </div>
        </div>
        <button
          type="button"
          className="bk-gi scr-notifprefs__pausebtn"
          onClick={pauseAll}
        >
          {t("screensB.notifprefs.pauseAll")}
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
