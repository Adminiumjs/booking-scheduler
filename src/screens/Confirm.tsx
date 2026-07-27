/*
 * Confirm (view: 'confirm') — port spec §3.4.
 *
 * The success screen for the booking that was just written: code pill,
 * appointment card, the optional recurring series, mock email/SMS previews of
 * the reminders that were switched on, and the "this is a demo" banner.
 *
 * Everything is read from `store.bookings[store.lastCode]`, so a reload or a
 * direct visit with no booking falls back to an empty state instead of
 * throwing.
 */

import {
  Banner,
  Button,
  Card,
  CodePill,
  EmptyState,
  Eyebrow,
  Icon,
  IconTile,
  SuccessTile,
} from "../components/index.ts";
import { data } from "../data/source.ts";
import type { ReminderWhen } from "../data/types.ts";
import {
  firstName,
  formatLongISO,
  formatShortISO,
  minutesToTime,
  money,
} from "../lib/format.ts";
import { recurLabel } from "../lib/slots.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-confirm.css";

const SEND_LABEL: Record<ReminderWhen, string> = {
  "24h": "24 hours before",
  "2h": "2 hours before",
  both: "24 hours & 2 hours before",
};

export default function Confirm() {
  const lastCode = useStore((s) => s.lastCode);
  const bookings = useStore((s) => s.bookings);
  const openManage = useStore((s) => s.openManage);
  const startBooking = useStore((s) => s.startBooking);

  const booking = lastCode ? bookings[lastCode] : undefined;
  const svc = data.getService(booking?.svc);
  const staff = data.getStaffMember(booking?.staff);

  if (!booking || !svc) {
    return (
      <main className="sm-screen sm-page sm-confirm">
        <EmptyState
          icon="calendar"
          title="Nothing booked yet"
          body="Pick a service and your confirmation will show up here."
          action={
            <Button icon="calendar-plus" onClick={() => startBooking(null)}>
              Book now
            </Button>
          }
        />
      </main>
    );
  }

  const first = firstName(booking.name);
  const category = data.getCategory(svc.cat)?.name ?? "";
  const staffName = staff?.name ?? "your specialist";
  const longDate = formatLongISO(booking.dateISO);
  const timeLabel = minutesToTime(booking.time);
  /* The from-address is the studio's own; nothing is actually sent. */
  const loc = data.getLocation();
  const studio = loc.name;

  return (
    <main className="sm-screen sm-page sm-confirm">
      <header className="sm-confirm__head">
        <SuccessTile icon="check" size={78} iconSize={38} />
        <h1 className="sm-h1">You’re booked, {first}!</h1>
        <p className="sm-sub sm-confirm__lede">
          We can’t wait to see you. Your booking code is below — keep it handy if you
          need to make changes.
        </p>
        <CodePill label="Booking code" code={booking.code} codeSize={22} />
      </header>

      <Card radius={20} className="sm-confirm__appt">
        <div className="sm-confirm__appt-head">
          <IconTile icon={svc.icon} tint={svc.tint} size={48} iconSize={21} radius={13} />
          <div className="sm-confirm__appt-text">
            <div className="sm-confirm__appt-name">{svc.name}</div>
            <div className="sm-confirm__appt-meta">
              {booking.dur} min · {category}
            </div>
          </div>
          <div className="sm-mono sm-confirm__appt-price">{money(booking.price)}</div>
        </div>

        <div className="sm-confirm__rows">
          <div className="sm-confirm__row">
            <span className="sm-confirm__row-key">
              <Icon name="user" size={15} />
              With
            </span>
            <span className="sm-confirm__row-val">
              {staff ? `${staff.name} · ${staff.role}` : staffName}
            </span>
          </div>
          <div className="sm-confirm__row">
            <span className="sm-confirm__row-key">
              <Icon name="calendar" size={15} />
              When
            </span>
            <span className="sm-confirm__row-val">{longDate}</span>
          </div>
          <div className="sm-confirm__row">
            <span className="sm-confirm__row-key">
              <Icon name="clock" size={15} />
              Time
            </span>
            <span className="sm-mono sm-confirm__row-val">{timeLabel}</span>
          </div>
        </div>
      </Card>

      {booking.recurOn ? (
        <Card radius={18} className="sm-confirm__recur">
          <div className="sm-confirm__recur-head">
            <Icon name="repeat" size={16} />
            Repeats {recurLabel(booking.recurFreq)} · {booking.recurCount} visits
          </div>
          <ul className="sm-confirm__series">
            {booking.series.map((iso) => (
              <li className="sm-confirm__series-row" key={iso}>
                <span className="sm-confirm__dot" aria-hidden="true" />
                <span className="sm-confirm__series-date">{formatLongISO(iso)}</span>
                <span className="sm-mono sm-confirm__series-time">{timeLabel}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {booking.remEmail || booking.remSms ? (
        <section className="sm-confirm__send">
          <Eyebrow icon="send">
            Here’s what we’ll send · {SEND_LABEL[booking.remWhen]}
          </Eyebrow>

          {booking.remEmail ? (
            <Card radius={16} clip className="sm-confirm__mail">
              <div className="sm-confirm__mail-head">
                <span className="sm-confirm__mail-logo" aria-hidden="true">
                  S
                </span>
                <div className="sm-confirm__mail-who">
                  <div className="sm-confirm__mail-name">{studio}</div>
                  <div className="sm-mono sm-confirm__mail-from">{loc.email}</div>
                </div>
                <Icon name="mail" size={16} />
              </div>
              <div className="sm-confirm__mail-body">
                <div className="sm-confirm__mail-subject">
                  Your appointment is confirmed · {booking.code}
                </div>
                <p className="sm-confirm__mail-text">
                  Hi {first} — you’re all set for {svc.name} with {staffName} on{" "}
                  {longDate} at {timeLabel}. Reply to this email if anything changes.
                  See you soon!
                </p>
              </div>
            </Card>
          ) : null}

          {booking.remSms ? (
            <div className="sm-confirm__sms">
              <span className="sm-confirm__sms-avatar" aria-hidden="true">
                <Icon name="message-square" size={16} />
              </span>
              <div className="sm-confirm__sms-col">
                <div className="sm-confirm__sms-bubble">
                  Selma’s: Reminder — {svc.name} with {staffName}{" "}
                  {formatShortISO(booking.dateISO)} at {timeLabel}. Reply R to
                  reschedule, C to cancel.
                </div>
                <div className="sm-mono sm-confirm__sms-cap">SMS · text message</div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <Banner tone="info" className="sm-confirm__banner">
        This is a demo — no real appointment is booked, and no email or text is
        actually sent.
      </Banner>

      <div className="sm-confirm__actions">
        <Button
          variant="ghost"
          size="lg"
          icon="settings-2"
          onClick={() => openManage(booking.code, booking.email)}
        >
          Manage booking
        </Button>
        <Button
          size="lg"
          icon="calendar-plus"
          onClick={() => startBooking(null)}
        >
          Book another
        </Button>
      </div>
    </main>
  );
}
