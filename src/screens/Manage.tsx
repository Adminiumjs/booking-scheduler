/*
 * MANAGE BOOKING (view: 'manage') — port spec §3.5, §6.6–6.8.
 *
 * Two modes driven by `store.foundCode`:
 *   find mode — code + email lookup (pre-filled with the seeded LMN-1039)
 *   card mode — the booking, with Reschedule / Cancel, or the cancelled note.
 *
 * Ruling R3: "Reschedule" only calls `startReschedule()`. The store never
 * deletes the original appointment up front — the slot engine excludes the
 * booking being moved — so backing out of the flow leaks nothing.
 * The cancellation-window copy lives in the shared <CancelModal/> (§4.21),
 * which the app shell renders; this screen just opens it.
 */

import {
  BackLink,
  Banner,
  Button,
  Card,
  Field,
  Icon,
  IconTile,
  StatusPill,
  TextInput,
} from "../components/index.ts";
import { data } from "../data/source.ts";
import type { Booking } from "../data/types.ts";
import { durationLabel, formatLongISO, minutesToTime, money } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-manage.css";

interface DetailRow {
  icon: string;
  label: string;
  value: string;
  mono?: boolean;
}

export default function Manage() {
  const mgCode = useStore((s) => s.mgCode);
  const mgEmail = useStore((s) => s.mgEmail);
  const mgErr = useStore((s) => s.mgErr);
  const foundCode = useStore((s) => s.foundCode);
  const bookings = useStore((s) => s.bookings);

  const setMgCode = useStore((s) => s.setMgCode);
  const setMgEmail = useStore((s) => s.setMgEmail);
  const findBooking = useStore((s) => s.findBooking);
  const mgReset = useStore((s) => s.mgReset);
  const startReschedule = useStore((s) => s.startReschedule);
  const openCancel = useStore((s) => s.openCancel);

  const booking = foundCode ? bookings[foundCode] : undefined;

  return (
    <main className="sm-screen sm-page sm-manage">
      <div className="sm-manage__head">
        <h1 className="sm-h1">Manage booking</h1>
        <p className="sm-sub">
          Reschedule or cancel an appointment with your code and email.
        </p>
      </div>

      {booking ? (
        <ManageCard
          booking={booking}
          onReschedule={startReschedule}
          onCancel={() => openCancel()}
          onReset={mgReset}
        />
      ) : (
        <Card radius={20} padding="clamp(20px, 3vw, 26px)">
          <form
            className="sm-manage-find"
            onSubmit={(e) => {
              e.preventDefault();
              findBooking();
            }}
          >
            <Field label="Booking code">
              {(c) => (
                <TextInput
                  {...c}
                  value={mgCode}
                  onChange={setMgCode}
                  placeholder="LMN-1039"
                  mono
                  className="sm-manage-find__code"
                />
              )}
            </Field>

            <Field label="Email on the booking">
              {(c) => (
                <TextInput
                  {...c}
                  value={mgEmail}
                  onChange={setMgEmail}
                  placeholder="you@email.com"
                  type="email"
                />
              )}
            </Field>

            {mgErr ? <Banner tone="danger">{mgErr}</Banner> : null}

            <Button
              type="submit"
              icon="search"
              full
              className="sm-manage-find__cta"
            >
              Find my booking
            </Button>

            <p className="sm-manage-find__tip">
              <Icon name="lightbulb" size={14} />
              Demo tip: the fields are pre-filled with a booking that already
              exists — just hit Find.
            </p>
          </form>
        </Card>
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ *
 * The found-booking card (local to this screen)
 * ------------------------------------------------------------------ */

interface ManageCardProps {
  booking: Booking;
  onReschedule: () => void;
  onCancel: () => void;
  onReset: () => void;
}

function ManageCard({ booking, onReschedule, onCancel, onReset }: ManageCardProps) {
  const svc = data.getService(booking.svc);
  const staff = data.getStaffMember(booking.staff);
  const cancelled = booking.status === "cancelled";

  const rows: DetailRow[] = [
    {
      icon: "user",
      label: "With",
      value: staff ? `${staff.name} · ${staff.role}` : "First available",
    },
    { icon: "calendar", label: "When", value: formatLongISO(booking.dateISO) },
    {
      icon: "clock",
      label: "Time",
      value: `${minutesToTime(booking.time)} · ${durationLabel(booking.dur)}`,
      mono: true,
    },
    { icon: "wallet", label: "Total", value: money(booking.price), mono: true },
  ];

  return (
    <>
      <div className="sm-panel sm-manage-card" data-cancelled={cancelled}>
        <div className="sm-manage-card__head">
          <IconTile
            icon={svc?.icon ?? "sparkles"}
            tint={svc?.tint ?? "#0d9488"}
            size={48}
            iconSize={22}
            radius={13}
            className="sm-manage-card__tile"
          />
          <div className="sm-manage-card__id">
            <div className="sm-manage-card__svc">{svc?.name ?? booking.svc}</div>
            <div className="sm-manage-card__code sm-mono">{booking.code}</div>
          </div>
          <StatusPill
            tone={cancelled ? "muted" : "pos"}
            icon={cancelled ? "x-circle" : "check-circle-2"}
          >
            {cancelled ? "Cancelled" : "Confirmed"}
          </StatusPill>
        </div>

        <dl className="sm-manage-card__rows">
          {rows.map((r) => (
            <div className="sm-manage-card__row" key={r.label}>
              <Icon name={r.icon} size={16} className="sm-manage-card__rowicon" />
              <dt className="sm-manage-card__rowlabel">{r.label}</dt>
              <dd
                className={
                  r.mono
                    ? "sm-manage-card__rowval sm-manage-card__rowval--mono sm-mono"
                    : "sm-manage-card__rowval"
                }
              >
                {r.value}
              </dd>
            </div>
          ))}
        </dl>

        {cancelled ? (
          <p className="sm-manage-card__note">
            <Icon name="info" size={15} />
            This appointment was cancelled. Book again any time — we’d love to
            have you.
          </p>
        ) : (
          <div className="sm-manage-card__foot">
            <Button
              variant="ghost"
              icon="calendar-clock"
              onClick={onReschedule}
              className="sm-manage-card__action"
            >
              Reschedule
            </Button>
            <Button
              variant="ghost"
              icon="calendar-x"
              onClick={onCancel}
              className="sm-manage-card__action sm-manage-card__action--danger"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      <BackLink onClick={onReset} className="sm-manage__another">
        Find another booking
      </BackLink>
    </>
  );
}
