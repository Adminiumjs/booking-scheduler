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
import { categoryName, data } from "../data/source.ts";
import type { ReminderWhen } from "../data/types.ts";
import { useT } from "../i18n/index.tsx";
import type { MessageKey } from "../i18n/index.tsx";
import {
  durationLabel,
  firstName,
  formatLongISO,
  formatShortISO,
  minutesToTime,
  money,
} from "../lib/format.ts";
import { recurLabel } from "../lib/slots.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-confirm.css";

const SEND_KEY: Record<ReminderWhen, MessageKey> = {
  "24h": "screensA.confirm.send24",
  "2h": "screensA.confirm.send2",
  both: "screensA.confirm.sendBoth",
};

export default function Confirm() {
  const t = useT();
  const lastCode = useStore((s) => s.lastCode);
  const bookings = useStore((s) => s.bookings);
  const openManage = useStore((s) => s.openManage);
  const startBooking = useStore((s) => s.startBooking);

  const booking = lastCode ? bookings[lastCode] : undefined;
  const svc = data.getService(booking?.svc);
  const staff = data.getStaffMember(booking?.staff);

  if (!booking || !svc) {
    return (
      <main className="bk-screen bk-page bk-confirm">
        <EmptyState
          icon="calendar"
          title={t("screensA.confirm.emptyTitle")}
          body={t("screensA.confirm.emptyBody")}
          action={
            <Button icon="calendar-plus" onClick={() => startBooking(null)}>
              {t("screensA.confirm.bookNow")}
            </Button>
          }
        />
      </main>
    );
  }

  const first = firstName(booking.name);
  const category = categoryName(t, svc.cat);
  const staffName = staff?.name ?? t("screensA.confirm.yourSpecialist");
  const longDate = formatLongISO(booking.dateISO);
  const timeLabel = minutesToTime(booking.time);
  /* The from-address is the studio's own; nothing is actually sent. */
  const loc = data.getLocation();
  const studio = loc.name;

  return (
    <main className="bk-screen bk-page bk-confirm">
      <header className="bk-confirm__head">
        <SuccessTile icon="check" size={78} iconSize={38} />
        <h1 className="bk-h1">{t("screensA.confirm.title", { name: first })}</h1>
        <p className="bk-sub bk-confirm__lede">{t("screensA.confirm.lede")}</p>
        <CodePill
          label={t("screensA.confirm.codeLabel")}
          code={booking.code}
          codeSize={22}
        />
      </header>

      <Card radius={20} className="bk-confirm__appt">
        <div className="bk-confirm__appt-head">
          <IconTile icon={svc.icon} tint={svc.tint} size={48} iconSize={21} radius={13} />
          <div className="bk-confirm__appt-text">
            <div className="bk-confirm__appt-name">{svc.name}</div>
            <div className="bk-confirm__appt-meta">
              {t("screensA.confirm.apptMeta", {
                duration: durationLabel(booking.dur),
                category,
              })}
            </div>
          </div>
          <div className="bk-mono bk-confirm__appt-price">{money(booking.price)}</div>
        </div>

        <div className="bk-confirm__rows">
          <div className="bk-confirm__row">
            <span className="bk-confirm__row-key">
              <Icon name="user" size={15} />
              {t("screensA.confirm.rowWith")}
            </span>
            <span className="bk-confirm__row-val">
              {staff ? `${staff.name} · ${staff.role}` : staffName}
            </span>
          </div>
          <div className="bk-confirm__row">
            <span className="bk-confirm__row-key">
              <Icon name="calendar" size={15} />
              {t("screensA.confirm.rowWhen")}
            </span>
            <span className="bk-confirm__row-val">{longDate}</span>
          </div>
          <div className="bk-confirm__row">
            <span className="bk-confirm__row-key">
              <Icon name="clock" size={15} />
              {t("screensA.confirm.rowTime")}
            </span>
            <span className="bk-mono bk-confirm__row-val">{timeLabel}</span>
          </div>
        </div>
      </Card>

      {booking.recurOn ? (
        <Card radius={18} className="bk-confirm__recur">
          <div className="bk-confirm__recur-head">
            <Icon name="repeat" size={16} />
            {t(
              "screensA.confirm.repeats",
              { frequency: recurLabel(booking.recurFreq) },
              booking.recurCount,
            )}
          </div>
          <ul className="bk-confirm__series">
            {booking.series.map((iso) => (
              <li className="bk-confirm__series-row" key={iso}>
                <span className="bk-confirm__dot" aria-hidden="true" />
                <span className="bk-confirm__series-date">{formatLongISO(iso)}</span>
                <span className="bk-mono bk-confirm__series-time">{timeLabel}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {booking.remEmail || booking.remSms ? (
        <section className="bk-confirm__send">
          <Eyebrow icon="send">
            {t("screensA.confirm.sendEyebrow", {
              when: t(SEND_KEY[booking.remWhen]),
            })}
          </Eyebrow>

          {booking.remEmail ? (
            <Card radius={16} clip className="bk-confirm__mail">
              <div className="bk-confirm__mail-head">
                <span className="bk-confirm__mail-logo" aria-hidden="true">
                  S
                </span>
                <div className="bk-confirm__mail-who">
                  <div className="bk-confirm__mail-name">{studio}</div>
                  <div className="bk-mono bk-confirm__mail-from">{loc.email}</div>
                </div>
                <Icon name="mail" size={16} />
              </div>
              <div className="bk-confirm__mail-body">
                <div className="bk-confirm__mail-subject">
                  {t("screensA.confirm.mailSubject", { code: booking.code })}
                </div>
                <p className="bk-confirm__mail-text">
                  {t("screensA.confirm.mailBody", {
                    name: first,
                    service: svc.name,
                    staff: staffName,
                    date: longDate,
                    time: timeLabel,
                  })}
                </p>
              </div>
            </Card>
          ) : null}

          {booking.remSms ? (
            <div className="bk-confirm__sms">
              <span className="bk-confirm__sms-avatar" aria-hidden="true">
                <Icon name="message-square" size={16} />
              </span>
              <div className="bk-confirm__sms-col">
                <div className="bk-confirm__sms-bubble">
                  {t("screensA.confirm.smsBody", {
                    service: svc.name,
                    staff: staffName,
                    date: formatShortISO(booking.dateISO),
                    time: timeLabel,
                  })}
                </div>
                <div className="bk-mono bk-confirm__sms-cap">
                  {t("screensA.confirm.smsCaption")}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <Banner tone="info" className="bk-confirm__banner">
        {t("screensA.confirm.banner")}
      </Banner>

      <div className="bk-confirm__actions">
        <Button
          variant="ghost"
          size="lg"
          icon="settings-2"
          onClick={() => openManage(booking.code, booking.email)}
        >
          {t("screensA.confirm.manage")}
        </Button>
        <Button
          size="lg"
          icon="calendar-plus"
          onClick={() => startBooking(null)}
        >
          {t("screensA.confirm.bookAnother")}
        </Button>
      </div>
    </main>
  );
}
