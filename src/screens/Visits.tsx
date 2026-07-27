/*
 * MY UPCOMING VISITS (view: 'visits') — port spec §3.7.
 *
 * A read-only list of confirmed bookings. "Reschedule or cancel" hands the
 * booking to the Manage screen with the lookup already satisfied
 * (`openManage` pre-fills the code + email and sets `foundCode`), which is
 * where reschedule (R3) and the cancel modal live.
 */

import { useMemo } from "react";

import {
  BackLink,
  Button,
  EmptyState,
  Icon,
  IconTile,
} from "../components/index.ts";
import { data } from "../data/source.ts";
import type { Booking } from "../data/types.ts";
import { durationLabel, formatLongISO, minutesToTime, money } from "../lib/format.ts";
import { recurLabel } from "../lib/slots.ts";
import { selectUpcoming, useStore } from "../state/store.ts";

import "../styles/screen-visits.css";

export default function Visits() {
  const bookings = useStore((s) => s.bookings);
  const go = useStore((s) => s.go);
  const startBooking = useStore((s) => s.startBooking);
  const openManage = useStore((s) => s.openManage);

  /* `selectUpcoming` builds a fresh array, so it is memoised on `bookings`
   * rather than run inside the selector. */
  const visits = useMemo(
    () => selectUpcoming(useStore.getState()),
    [bookings],
  );

  return (
    <main className="sm-screen sm-page sm-visits">
      <BackLink onClick={() => go("home")}>Back home</BackLink>

      <div className="sm-visits__head">
        <h1 className="sm-h1">My upcoming visits</h1>
        <p className="sm-sub">Everything you’ve got booked with us.</p>
      </div>

      {visits.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="Nothing booked yet"
          body="When you book a visit it’ll show up here with all the details."
          action={
            <Button
              onClick={() => startBooking(null)}
              className="sm-visits__empty-cta"
            >
              Book a visit
            </Button>
          }
        />
      ) : (
        <div className="sm-visits__list">
          {visits.map((b) => (
            <VisitCard
              key={b.code}
              booking={b}
              onManage={() => openManage(b.code, b.email)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ *
 * One visit (local to this screen)
 * ------------------------------------------------------------------ */

interface VisitCardProps {
  booking: Booking;
  onManage: () => void;
}

function VisitCard({ booking, onManage }: VisitCardProps) {
  const svc = data.getService(booking.svc);
  const staff = data.getStaffMember(booking.staff);

  return (
    <article className="sm-card sm-panel sm-visits-card">
      <div className="sm-visits-card__head">
        <IconTile
          icon={svc?.icon ?? "sparkles"}
          tint={svc?.tint ?? "#0d9488"}
          size={46}
          iconSize={20}
          radius={12}
        />
        <div className="sm-visits-card__id">
          <h2 className="sm-visits-card__svc">{svc?.name ?? "Appointment"}</h2>
          <div className="sm-visits-card__code sm-mono">{booking.code}</div>
        </div>
        <span className="sm-visits-card__price sm-mono">{money(booking.price)}</span>
      </div>

      <div className="sm-visits-card__body">
        <dl className="sm-visits-card__rows">
          <div className="sm-visits-card__row">
            <Icon name="calendar" size={15} className="sm-visits-card__rowicon" />
            <dt className="sm-visits-card__rowlabel">When</dt>
            <dd className="sm-visits-card__rowval">{formatLongISO(booking.dateISO)}</dd>
          </div>
          <div className="sm-visits-card__row">
            <Icon name="clock" size={15} className="sm-visits-card__rowicon" />
            <dt className="sm-visits-card__rowlabel">Time</dt>
            <dd className="sm-visits-card__rowval sm-visits-card__rowval--mono sm-mono">
              {minutesToTime(booking.time)} · {durationLabel(booking.dur)}
            </dd>
          </div>
          <div className="sm-visits-card__row">
            <Icon name="user" size={15} className="sm-visits-card__rowicon" />
            <dt className="sm-visits-card__rowlabel">With</dt>
            <dd className="sm-visits-card__rowval">{staff?.name ?? "First available"}</dd>
          </div>
        </dl>

        {booking.recurOn ? (
          <span className="sm-visits-card__recur">
            <Icon name="repeat" size={12} />
            Repeats {recurLabel(booking.recurFreq)} · {booking.recurCount} visits
          </span>
        ) : null}
      </div>

      <div className="sm-visits-card__foot">
        <Button
          variant="ghost"
          icon="settings-2"
          iconSize={15}
          size="sm"
          onClick={onManage}
          className="sm-visits-card__manage"
        >
          Reschedule or cancel
        </Button>
      </div>
    </article>
  );
}
