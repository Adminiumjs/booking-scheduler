/*
 * STUDIO EVENT (view: 'event') — the Autumn Open House RSVP.
 *
 * The capacity bar counts the guest's own party, so the "spots taken" figure
 * and the progress bar both move the moment they RSVP.
 */

import {
  BackLink,
  Button,
  Icon,
  NumberStepper,
  PlaceholderTile,
} from "../components/index.ts";
import { data } from "../data/source.ts";
import { useI18n } from "../i18n/index.tsx";
import type { MessageKey } from "../i18n/index.tsx";
import { formatLongDate, minutesToTime, monthName, money } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-event.css";

/** Room for sixty; forty-two were already spoken for when the page was built. */
const CAPACITY = 60;
const ALREADY_TAKEN = 42;

/**
 * The event's placeholder-tile tint. A hex, not a token, for the same reason
 * `Service.tint` is one: it belongs to the entity palette the procedural tiles
 * are built from, and it has to read the same in both themes.
 */
const EVENT_TINT = "#b07d9a";

const INCLUDED_KEYS: readonly MessageKey[] = [
  "screensA.event.inc1",
  "screensA.event.inc2",
  "screensA.event.inc3",
  "screensA.event.inc4",
];

/* The evening itself, as real dates rather than pre-rendered English: the
 * weekday, the month and the clock all belong to the reader's locale. */
const EVENT_DATE = new Date(2026, 9, 9);
const EVENT_OPENS = 18 * 60;
const EVENT_CLOSES = 21 * 60;
const EVENT_GUEST_PRICE = 15;

const UPCOMING: readonly {
  day: number;
  month: number;
  titleKey: MessageKey;
  subKey: MessageKey;
}[] = [
  {
    day: 14,
    month: 10,
    titleKey: "screensA.event.up1Title",
    subKey: "screensA.event.up1Sub",
  },
  {
    day: 5,
    month: 11,
    titleKey: "screensA.event.up2Title",
    subKey: "screensA.event.up2Sub",
  },
];

export default function Event() {
  const { t, number } = useI18n();
  const evtGuests = useStore((s) => s.evtGuests);
  const evtRsvp = useStore((s) => s.evtRsvp);
  const go = useStore((s) => s.go);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const taken = ALREADY_TAKEN + (evtRsvp ? evtGuests : 0);
  const pct = Math.round((taken / CAPACITY) * 100);
  const guestsLabel = t("count.guest", {}, evtGuests);

  const meta = [
    {
      icon: "calendar",
      label: t("screensA.event.metaDate"),
      value: formatLongDate(EVENT_DATE),
    },
    {
      icon: "clock",
      label: t("screensA.event.metaTime"),
      value: t("screensA.event.timeRange", {
        start: minutesToTime(EVENT_OPENS),
        end: minutesToTime(EVENT_CLOSES),
      }),
    },
    {
      icon: "map-pin",
      label: t("screensA.event.metaWhere"),
      value: data.getLocation().addressLine1,
    },
    {
      icon: "users",
      label: t("screensA.event.metaSize"),
      value: t("screensA.event.sizeValue"),
    },
  ];

  return (
    <section className="bk-screen bk-page scr-event">
      <BackLink onClick={() => go("home")}>
        {t("screensA.common.backHome")}
      </BackLink>

      <PlaceholderTile
        tint={EVENT_TINT}
        icon="glass-water"
        iconSize={66}
        minHeight={300}
        angle="150deg"
        radius={22}
        bordered
        borderBlockEnd={false}
        filename="open_house_evening.jpg"
      />

      <div className="scr-event__cols">
        <div>
          <span className="scr-event__eyebrow">
            <Icon name="sparkles" size={14} />
            {t("screensA.event.eyebrow")}
          </span>

          <h1 className="bk-h1 scr-event__title">{t("screensA.event.title")}</h1>
          <p className="scr-event__lede">{t("screensA.event.lede")}</p>

          <div className="scr-event__meta">
            {meta.map((m) => (
              <div key={m.label} className="scr-event__metarow">
                <span className="scr-event__metatile">
                  <Icon name={m.icon} size={16} />
                </span>
                <span className="scr-event__metatext">
                  <span className="scr-event__metalabel">{m.label}</span>
                  <span className="scr-event__metavalue">{m.value}</span>
                </span>
              </div>
            ))}
          </div>

          <h2 className="scr-event__section">{t("screensA.event.included")}</h2>
          <ul className="scr-event__includes">
            {INCLUDED_KEYS.map((key) => (
              <li key={key} className="scr-event__include">
                <Icon name="check" size={16} />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        <aside className="scr-event__side">
          <div className="bk-panel scr-event__rsvp">
            <div className="scr-event__price">
              <span className="scr-event__pricefig bk-mono">
                {t("screensA.event.free")}
              </span>
              <span className="scr-event__pricenote">
                {t("screensA.event.priceNote", {
                  amount: money(EVENT_GUEST_PRICE),
                })}
              </span>
            </div>

            <div>
              <div className="scr-event__track">
                <div
                  className="scr-event__bar"
                  style={{ inlineSize: `${pct}%` }}
                />
              </div>
              <div className="scr-event__capacity">
                <span>
                  {t("screensA.event.taken", {
                    taken: number(taken),
                    total: number(CAPACITY),
                  })}
                </span>
                <span>
                  {t("screensA.event.left", { count: number(CAPACITY - taken) })}
                </span>
              </div>
            </div>

            {evtRsvp ? (
              <>
                <div className="scr-event__confirmed">
                  <Icon name="check-circle-2" size={20} />
                  <span>
                    {t("screensA.event.onList", { guests: guestsLabel })}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  full
                  onClick={() => {
                    set({ evtRsvp: false });
                    showToast(t("screensA.event.rsvpCancelled"), "warn");
                  }}
                >
                  {t("screensA.event.cancelRsvp")}
                </Button>
              </>
            ) : (
              <>
                <div>
                  <span className="scr-event__steplabel">
                    {t("screensA.event.howMany")}
                  </span>
                  <NumberStepper
                    value={evtGuests}
                    onChange={(n) => set({ evtGuests: n })}
                    min={1}
                    max={4}
                    label={t("screensA.event.guestsLabel")}
                    format={(v) => t("count.guest", {}, v)}
                  />
                </div>
                <Button
                  icon="calendar-check"
                  iconSize={17}
                  size="lg"
                  full
                  onClick={() => {
                    set({ evtRsvp: true });
                    showToast(
                      t("screensA.event.savedToast", {
                        date: formatLongDate(EVENT_DATE),
                      }),
                      "ok",
                    );
                  }}
                >
                  {t("screensA.event.save")}
                </Button>
              </>
            )}

            <span className="scr-event__disclaimer">
              {t("screensA.event.disclaimer")}
            </span>
          </div>

          <div className="bk-panel scr-event__upcoming">
            <div className="bk-eyebrow scr-event__upcominghead">
              {t("screensA.event.alsoComing")}
            </div>
            {UPCOMING.map((u) => (
              <div key={u.titleKey} className="scr-event__uprow">
                <span className="scr-event__update">
                  <span className="scr-event__upday bk-mono">
                    {number(u.day)}
                  </span>
                  <span className="scr-event__upmon">
                    {monthName(u.month, "short")}
                  </span>
                </span>
                <span className="scr-event__uptext">
                  <span className="scr-event__uptitle">{t(u.titleKey)}</span>
                  <span className="scr-event__upsub">{t(u.subKey)}</span>
                </span>
                <button
                  type="button"
                  className="bk-gi scr-event__notify"
                  onClick={() => showToast(t("screensA.event.notifyToast"), "ok")}
                >
                  {t("screensA.event.notify")}
                </button>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
