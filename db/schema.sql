-- Booking Scheduler — PostgreSQL schema (§10.3 contract).
--
-- This is the real database that backs the full self-host stack: the booking
-- site reads it (through Adminium's records API) and the auto-generated
-- Adminium admin dashboard manages it. Applied automatically on first boot of
-- the `booking-db` container via /docker-entrypoint-initdb.d/01-schema.sql,
-- then seeded by 02-seed.sql. The seed catalog mirrors the frontend demo data
-- in src/data/ one-for-one (same services, durations, prices, staff and
-- appointments) so the booking site and the dashboard run the same studio.
--
-- Time-of-day note: `availability_rules.opens`/`closes` are zero-padded 24-hour
-- "HH:MM" text rather than `time`, per the §10.3 contract (Adminium's manifest
-- schema has no time-of-day type yet). Appointment instants are `timestamptz`.

DROP TABLE IF EXISTS loyalty_ledger CASCADE;
DROP TABLE IF EXISTS waitlist_entries CASCADE;
DROP TABLE IF EXISTS gift_cards CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS time_off CASCADE;
DROP TABLE IF EXISTS availability_rules CASCADE;
DROP TABLE IF EXISTS staff_services CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS service_categories CASCADE;

-- Service menu ---------------------------------------------------------------

CREATE TABLE service_categories (
  id         serial PRIMARY KEY,
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  icon       text,
  sort_order integer NOT NULL DEFAULT 0
);

COMMENT ON TABLE service_categories IS
  'Menu sections the booking site filters by (Hair, Spa, Nails, Movement).';

CREATE TABLE services (
  id           serial PRIMARY KEY,
  slug         text NOT NULL UNIQUE,
  name         text NOT NULL,
  category_id  integer NOT NULL REFERENCES service_categories (id) ON DELETE RESTRICT,
  description  text,
  duration_min integer NOT NULL CHECK (duration_min > 0 AND duration_min % 5 = 0),
  price        numeric(10, 2) NOT NULL CHECK (price >= 0),
  image_url    text,
  icon         text,
  tint         text CHECK (tint IS NULL OR tint ~ '^#[0-9a-f]{6}$'),
  active       boolean NOT NULL DEFAULT true,
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE services IS
  'Bookable services: what is offered, how long it runs, and what it costs.';

-- Staff & availability -------------------------------------------------------

CREATE TABLE staff (
  id          serial PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  role        text NOT NULL,
  bio         text,
  initials    text CHECK (initials IS NULL OR char_length(initials) BETWEEN 1 AND 3),
  avatar_url  text,
  tint        text CHECK (tint IS NULL OR tint ~ '^#[0-9a-f]{6}$'),
  category_id integer REFERENCES service_categories (id) ON DELETE SET NULL,
  active      boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE staff IS
  'Specialists guests can book. category_id is the section they headline.';

CREATE TABLE staff_services (
  staff_id   integer NOT NULL REFERENCES staff (id) ON DELETE CASCADE,
  service_id integer NOT NULL REFERENCES services (id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, service_id)
);

COMMENT ON TABLE staff_services IS
  'Which specialist offers which service; drives the staff step of booking.';

CREATE TABLE availability_rules (
  id       serial PRIMARY KEY,
  staff_id integer NOT NULL REFERENCES staff (id) ON DELETE CASCADE,
  weekday  text NOT NULL
           CHECK (weekday IN ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')),
  opens    text NOT NULL CHECK (opens  ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  closes   text NOT NULL CHECK (closes ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  CHECK (closes > opens),
  UNIQUE (staff_id, weekday, opens)
);

COMMENT ON TABLE availability_rules IS
  'Recurring weekly working windows per specialist, as "HH:MM" local time.';

CREATE TABLE time_off (
  id        serial PRIMARY KEY,
  staff_id  integer NOT NULL REFERENCES staff (id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at   timestamptz NOT NULL,
  reason    text,
  CHECK (ends_at > starts_at)
);

COMMENT ON TABLE time_off IS
  'One-off absences that subtract from availability_rules for a date range.';

-- Guests & appointments ------------------------------------------------------

CREATE TABLE customers (
  id         serial PRIMARY KEY,
  name       text NOT NULL,
  email      text NOT NULL UNIQUE,
  phone      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE customers IS
  'Guests, identified by email; no password — bookings are found by code + email.';

CREATE TABLE appointments (
  id            serial PRIMARY KEY,
  code          text NOT NULL UNIQUE,
  service_id    integer NOT NULL REFERENCES services (id) ON DELETE RESTRICT,
  staff_id      integer REFERENCES staff (id) ON DELETE SET NULL,
  customer_id   integer NOT NULL REFERENCES customers (id) ON DELETE RESTRICT,
  starts_at     timestamptz NOT NULL,
  ends_at       timestamptz NOT NULL,
  price         numeric(10, 2) NOT NULL CHECK (price >= 0),
  status        text NOT NULL DEFAULT 'booked'
                CHECK (status IN ('booked', 'completed', 'cancelled', 'no_show')),
  notes         text,
  remind_email  boolean NOT NULL DEFAULT true,
  remind_sms    boolean NOT NULL DEFAULT true,
  remind_when   text NOT NULL DEFAULT '24h'
                CHECK (remind_when IN ('24h', '2h', 'both')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

COMMENT ON TABLE appointments IS
  'Booked visits. staff_id NULL means the guest chose "first available".';

-- Gift cards, waitlist & loyalty ---------------------------------------------

CREATE TABLE gift_cards (
  id              serial PRIMARY KEY,
  code            text NOT NULL UNIQUE,
  amount          numeric(10, 2) NOT NULL CHECK (amount > 0),
  balance         numeric(10, 2) NOT NULL CHECK (balance >= 0),
  purchaser_id    integer REFERENCES customers (id) ON DELETE SET NULL,
  recipient_name  text NOT NULL,
  recipient_email text NOT NULL,
  sender_name     text,
  message         text,
  theme           text NOT NULL DEFAULT 'bloom'
                  CHECK (theme IN ('bloom', 'sea', 'sage', 'amber')),
  status          text NOT NULL DEFAULT 'sent'
                  CHECK (status IN ('scheduled', 'sent', 'redeemed', 'expired')),
  scheduled_for   date,
  issued_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (balance <= amount),
  CHECK ((status = 'scheduled') = (scheduled_for IS NOT NULL))
);

COMMENT ON TABLE gift_cards IS
  'Studio gift cards: never expire, redeemable against any service.';

CREATE TABLE waitlist_entries (
  id             serial PRIMARY KEY,
  customer_id    integer NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  service_id     integer NOT NULL REFERENCES services (id) ON DELETE CASCADE,
  staff_id       integer REFERENCES staff (id) ON DELETE SET NULL,
  requested_date date NOT NULL,
  status         text NOT NULL DEFAULT 'waiting'
                 CHECK (status IN ('waiting', 'notified', 'converted', 'released')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, service_id, requested_date)
);

COMMENT ON TABLE waitlist_entries IS
  'Guests waiting on a full day; staff_id NULL means any qualified specialist.';

CREATE TABLE loyalty_ledger (
  id             serial PRIMARY KEY,
  customer_id    integer NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  appointment_id integer REFERENCES appointments (id) ON DELETE SET NULL,
  label          text NOT NULL,
  kind           text NOT NULL DEFAULT 'earn'
                 CHECK (kind IN ('earn', 'redeem', 'bonus', 'adjustment')),
  delta_points   integer NOT NULL CHECK (delta_points <> 0),
  occurred_on    date NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind = 'redeem') = (delta_points < 0))
);

COMMENT ON TABLE loyalty_ledger IS
  'Append-only points history; a guest balance is the SUM of their deltas.';

-- Indexes --------------------------------------------------------------------

CREATE INDEX idx_services_category      ON services (category_id);
CREATE INDEX idx_services_active        ON services (active);
CREATE INDEX idx_staff_active           ON staff (active);
CREATE INDEX idx_staff_services_service ON staff_services (service_id);
CREATE INDEX idx_availability_staff     ON availability_rules (staff_id, weekday);
CREATE INDEX idx_time_off_staff         ON time_off (staff_id, starts_at);
CREATE INDEX idx_appointments_starts    ON appointments (starts_at);
CREATE INDEX idx_appointments_status    ON appointments (status);
CREATE INDEX idx_appointments_staff_day ON appointments (staff_id, starts_at);
CREATE INDEX idx_appointments_customer  ON appointments (customer_id);
CREATE INDEX idx_gift_cards_status      ON gift_cards (status);
CREATE INDEX idx_waitlist_date          ON waitlist_entries (requested_date, status);
CREATE INDEX idx_loyalty_customer       ON loyalty_ledger (customer_id, occurred_on);
