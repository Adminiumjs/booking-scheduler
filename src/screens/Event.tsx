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
import { plural } from "../lib/format.ts";
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

const INCLUDED: readonly string[] = [
  "Fifteen-minute mini treatments on rotation — hands, scalp, or shoulders.",
  "A color clinic with Elin: bring a photo, leave with a plan.",
  "First look at the autumn menu, with tasting-size versions to try.",
  "Something warm in a glass and a 15% code for anything booked that night.",
];

const UPCOMING: readonly { day: string; mon: string; title: string; sub: string }[] =
  [
    {
      day: "14",
      mon: "Nov",
      title: "Color theory workshop",
      sub: "Two hours with Elin · 12 seats",
    },
    {
      day: "05",
      mon: "Dec",
      title: "Slow morning: breath & mobility",
      sub: "Sunday 9 AM with Marco · free",
    },
  ];

export default function Event() {
  const evtGuests = useStore((s) => s.evtGuests);
  const evtRsvp = useStore((s) => s.evtRsvp);
  const go = useStore((s) => s.go);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const taken = ALREADY_TAKEN + (evtRsvp ? evtGuests : 0);
  const pct = Math.round((taken / CAPACITY) * 100);
  const guestsLabel = plural(evtGuests, "guest");

  const meta = [
    { icon: "calendar", label: "Date", value: "Friday, October 9" },
    { icon: "clock", label: "Time", value: "6:00 – 9:00 PM" },
    { icon: "map-pin", label: "Where", value: data.getLocation().addressLine1 },
    { icon: "users", label: "Size", value: "Sixty guests, come and go" },
  ];

  return (
    <section className="bk-screen bk-page scr-event">
      <BackLink onClick={() => go("home")}>Back home</BackLink>

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
            Studio event
          </span>

          <h1 className="bk-h1 scr-event__title">Autumn Open House</h1>
          <p className="scr-event__lede">
            An evening in the studio with the whole team. Mini treatments on
            rotation, a color clinic with Elin, and the new autumn menu tasted
            early — plus something warm in a glass.
          </p>

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

          <h2 className="scr-event__section">What’s included</h2>
          <ul className="scr-event__includes">
            {INCLUDED.map((text) => (
              <li key={text} className="scr-event__include">
                <Icon name="check" size={16} />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <aside className="scr-event__side">
          <div className="bk-panel scr-event__rsvp">
            <div className="scr-event__price">
              <span className="scr-event__pricefig bk-mono">Free</span>
              <span className="scr-event__pricenote">
                for members · $15 otherwise
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
                  {taken} of {CAPACITY} spots taken
                </span>
                <span>{CAPACITY - taken} left</span>
              </div>
            </div>

            {evtRsvp ? (
              <>
                <div className="scr-event__confirmed">
                  <Icon name="check-circle-2" size={20} />
                  <span>
                    You’re on the list for{" "}
                    <span className="scr-event__strong">{guestsLabel}</span>.
                    We’ll text a reminder that afternoon.
                  </span>
                </div>
                <Button
                  variant="ghost"
                  full
                  onClick={() => {
                    set({ evtRsvp: false });
                    showToast("RSVP cancelled", "warn");
                  }}
                >
                  Cancel my RSVP
                </Button>
              </>
            ) : (
              <>
                <div>
                  <span className="scr-event__steplabel">How many of you?</span>
                  <NumberStepper
                    value={evtGuests}
                    onChange={(n) => set({ evtGuests: n })}
                    min={1}
                    max={4}
                    label="guests"
                    format={(v) => plural(v, "guest")}
                  />
                </div>
                <Button
                  icon="calendar-check"
                  iconSize={17}
                  size="lg"
                  full
                  onClick={() => {
                    set({ evtRsvp: true });
                    showToast("You’re on the list — see you October 9", "ok");
                  }}
                >
                  Save my spot
                </Button>
              </>
            )}

            <span className="scr-event__disclaimer">
              Demo event — nothing is booked and nobody is charged.
            </span>
          </div>

          <div className="bk-panel scr-event__upcoming">
            <div className="bk-eyebrow scr-event__upcominghead">
              Also coming up
            </div>
            {UPCOMING.map((u) => (
              <div key={u.title} className="scr-event__uprow">
                <span className="scr-event__update">
                  <span className="scr-event__upday bk-mono">{u.day}</span>
                  <span className="scr-event__upmon">{u.mon}</span>
                </span>
                <span className="scr-event__uptext">
                  <span className="scr-event__uptitle">{u.title}</span>
                  <span className="scr-event__upsub">{u.sub}</span>
                </span>
                <button
                  type="button"
                  className="bk-gi scr-event__notify"
                  onClick={() =>
                    showToast("We’ll text you when tickets open", "ok")
                  }
                >
                  Notify me
                </button>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
