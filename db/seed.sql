-- Booking Scheduler — seed data.
--
-- Mirrors the frontend demo business in src/data/ exactly: the same 4 menu
-- sections, the same 12 services (name, duration, price, blurb, icon, tint),
-- the same 4 specialists with the same weekly hours, the same two seeded
-- bookings (SLM-1039, SLM-1041), the same waitlist entry and the same gift
-- card (GIFT-4821). The booking site and the auto-generated Adminium dashboard
-- MUST show one studio, so this file and the frontend demo data have to stay in
-- sync — change one, change the other.
--
-- Rows the frontend cannot show are added on top for a realistic dashboard:
-- other guests' past and upcoming appointments, their gift cards, and staff
-- time off. The site only ever renders the demo guest's own records (Ava
-- Reyes), so these extras are invisible there and cannot drift from it.
--
-- Demo week: 2026-07-27 (Mon) … 2026-08-02 (Sun); "today" is 2026-07-27 and the
-- seeded bookings sit on Wed 2026-07-29. Instants are stored with the studio's
-- -07:00 offset (America/Los_Angeles, PDT).
--
-- Ids are assigned explicitly for readable foreign-key references; the serial
-- sequences are advanced at the end so future inserts continue cleanly.

-- Menu sections --------------------------------------------------------------

INSERT INTO service_categories (id, name, slug, icon, sort_order) VALUES
  (1, 'Hair',     'hair',  'scissors',  1),
  (2, 'Spa',      'spa',   'flower-2',  2),
  (3, 'Nails',    'nails', 'hand',      3),
  (4, 'Movement', 'move',  'activity',  4);

-- Services (12: Hair 4, Spa 3, Nails 3, Movement 2) ---------------------------
--
-- image_url stays NULL on purpose: the booking site renders generated
-- placeholder tiles from `icon` + `tint` rather than photography. Upload real
-- images from the dashboard and they light up on both sides.

INSERT INTO services (id, slug, name, category_id, description, duration_min, price, icon, tint, sort_order) VALUES
  (1,  'cut',      'Cut & Style',         1, 'A precision cut and a finish you can actually redo at home.', 60, 78.00,  'scissors',        '#b07d9a', 1),
  (2,  'root',     'Root Color',          1, 'Seamless root coverage matched right to your tone.',          90, 135.00, 'paintbrush',      '#a06f96', 2),
  (3,  'balayage', 'Balayage',            1, 'Hand-painted, sun-kissed dimension that grows out soft.',     90, 190.00, 'palette',         '#b58a6a', 3),
  (4,  'gloss',    'Gloss & Tone',        1, 'A quick shine-and-tone refresh between color visits.',        45, 60.00,  'droplet',         '#9a7fb0', 4),
  (5,  'facial',   'Signature Facial',    2, 'A deep-clean, glow-forward facial tuned to your skin.',       60, 110.00, 'flower-2',        '#6f8bb0', 5),
  (6,  'deep',     'Deep-Tissue Massage', 2, 'Firm, focused work on the knots that keep nagging.',          60, 115.00, 'hand',            '#6a86ab', 6),
  (7,  'aroma',    'Aromatherapy Ritual', 2, 'Ninety unhurried minutes of warm scent and stillness.',       90, 155.00, 'leaf',            '#7d9179', 7),
  (8,  'mani',     'Classic Manicure',    3, 'Tidy shape, real cuticle care, and a color that lasts.',      45, 45.00,  'hand',            '#b0836a', 8),
  (9,  'gel',      'Gel Manicure',        3, 'High-shine gel that stays glossy for weeks, not days.',       60, 58.00,  'sparkles',        '#c08a6a', 9),
  (10, 'pedi',     'Deluxe Pedicure',     3, 'A soak, scrub, and massage your feet will thank you for.',    60, 70.00,  'footprints',      '#a8846f', 10),
  (11, 'reformer', 'Reformer Pilates',    4, 'A low-impact reformer session tuned to where you are.',       45, 40.00,  'activity',        '#7d9166', 11),
  (12, 'yoga',     'Private Yoga',        4, 'One-on-one flow, breath, and mobility, at your pace.',        60, 70.00,  'person-standing', '#8a9a6a', 12);

-- Specialists ----------------------------------------------------------------

INSERT INTO staff (id, slug, name, role, bio, initials, tint, category_id, sort_order) VALUES
  (1, 'selma', 'Selma', 'Color specialist', 'Balayage & lived-in color, ten years in the chair.', 'SE', '#b07d9a', 1, 1),
  (2, 'noor',  'Noor',  'Spa therapist',    'Facials & massage — mornings only, always calm.',    'NO', '#6f8bb0', 2, 2),
  (3, 'ivy',   'Ivy',   'Nail artist',      'Gel sets & detailed nail art. Off Sundays & Mondays.', 'IV', '#b0836a', 3, 3),
  (4, 'marco', 'Marco', 'Movement coach',   'Pilates, yoga & bodywork. Takes Mondays off.',       'MA', '#7d9166', 4, 4);

-- Who offers what ------------------------------------------------------------

INSERT INTO staff_services (staff_id, service_id) VALUES
  (1, 1), (1, 2), (1, 3), (1, 4),           -- Selma  — all four hair services
  (2, 5), (2, 6), (2, 7),                   -- Noor   — the spa menu
  (3, 8), (3, 9), (3, 10),                  -- Ivy    — the nail menu
  (4, 6), (4, 11), (4, 12);                 -- Marco  — movement + deep tissue

-- Weekly working windows -----------------------------------------------------
--
-- Selma  Mon 10–14 · Tue–Fri 09–13 + 14–18 · Sat 09–13
-- Noor   Mon–Sat 09–13 (mornings only)
-- Ivy    Tue–Fri 10–14 + 15–19 · Sat 10–14 (off Sun & Mon)
-- Marco  Tue–Fri 08–12 + 16–20 · Sat 08–12 (off Sun & Mon)
-- Nobody works Sunday — the studio is closed.

INSERT INTO availability_rules (staff_id, weekday, opens, closes) VALUES
  (1, 'mon', '10:00', '14:00'),
  (1, 'tue', '09:00', '13:00'), (1, 'tue', '14:00', '18:00'),
  (1, 'wed', '09:00', '13:00'), (1, 'wed', '14:00', '18:00'),
  (1, 'thu', '09:00', '13:00'), (1, 'thu', '14:00', '18:00'),
  (1, 'fri', '09:00', '13:00'), (1, 'fri', '14:00', '18:00'),
  (1, 'sat', '09:00', '13:00'),

  (2, 'mon', '09:00', '13:00'),
  (2, 'tue', '09:00', '13:00'),
  (2, 'wed', '09:00', '13:00'),
  (2, 'thu', '09:00', '13:00'),
  (2, 'fri', '09:00', '13:00'),
  (2, 'sat', '09:00', '13:00'),

  (3, 'tue', '10:00', '14:00'), (3, 'tue', '15:00', '19:00'),
  (3, 'wed', '10:00', '14:00'), (3, 'wed', '15:00', '19:00'),
  (3, 'thu', '10:00', '14:00'), (3, 'thu', '15:00', '19:00'),
  (3, 'fri', '10:00', '14:00'), (3, 'fri', '15:00', '19:00'),
  (3, 'sat', '10:00', '14:00'),

  (4, 'tue', '08:00', '12:00'), (4, 'tue', '16:00', '20:00'),
  (4, 'wed', '08:00', '12:00'), (4, 'wed', '16:00', '20:00'),
  (4, 'thu', '08:00', '12:00'), (4, 'thu', '16:00', '20:00'),
  (4, 'fri', '08:00', '12:00'), (4, 'fri', '16:00', '20:00'),
  (4, 'sat', '08:00', '12:00');

-- Time off (after the demo week, so it never collides with a seeded booking) --

INSERT INTO time_off (staff_id, starts_at, ends_at, reason) VALUES
  (2, '2026-08-03 09:00:00-07:00', '2026-08-03 13:00:00-07:00', 'Continuing-education morning'),
  (3, '2026-08-10 00:00:00-07:00', '2026-08-15 00:00:00-07:00', 'Vacation');

-- Guests ---------------------------------------------------------------------
-- Ava Reyes (id 1) is the demo guest the booking site signs you in as.

INSERT INTO customers (id, name, email, phone) VALUES
  (1, 'Ava Reyes',     'ava@example.com',            '(415) 555-0142'),
  (2, 'Liam Chen',     'liam.chen@example.com',      '(415) 555-0117'),
  (3, 'Noah Williams', 'noah.w@example.com',         '(415) 555-0163'),
  (4, 'Maya Kapoor',   'maya.kapoor@example.com',    '(415) 555-0128'),
  (5, 'Sofia Diaz',    'sofia.diaz@example.com',     '(415) 555-0175'),
  (6, 'Ethan Brooks',  'ethan.brooks@example.com',   '(415) 555-0106'),
  (7, 'Olivia Martin', 'olivia.martin@example.com',  '(415) 555-0194');

-- Appointments ---------------------------------------------------------------
--
-- SLM-1039 and SLM-1041 are the two bookings the frontend seeds for Ava — the
-- ones "Manage booking" pre-fills and "My upcoming visits" lists. Codes stay
-- below SLM-1043, which is where the site's booking counter starts, so a demo
-- booking can never collide with a seeded one. Every row sits inside its
-- specialist's weekly window and no specialist is ever double-booked.

INSERT INTO appointments (id, code, customer_id, service_id, staff_id, starts_at, ends_at, price, status, notes) VALUES
  (1,  'SLM-1012', 1, 9,  3, '2026-06-02 10:30:00-07:00', '2026-06-02 11:30:00-07:00',  58.00, 'completed', NULL),
  (2,  'SLM-1021', 1, 5,  2, '2026-06-30 09:00:00-07:00', '2026-06-30 10:00:00-07:00', 110.00, 'completed', NULL),
  (3,  'SLM-1029', 1, 3,  1, '2026-07-14 10:00:00-07:00', '2026-07-14 11:30:00-07:00', 190.00, 'completed', NULL),
  (4,  'SLM-1030', 6, 7,  2, '2026-07-16 09:30:00-07:00', '2026-07-16 11:00:00-07:00', 155.00, 'cancelled', 'Cancelled the day before — rebooking in August.'),
  (5,  'SLM-1031', 5, 2,  1, '2026-07-18 09:30:00-07:00', '2026-07-18 11:00:00-07:00', 135.00, 'no_show',   NULL),
  (6,  'SLM-1033', 2, 6,  4, '2026-07-21 08:30:00-07:00', '2026-07-21 09:30:00-07:00', 115.00, 'completed', 'Focus on the left shoulder.'),
  (7,  'SLM-1034', 4, 8,  3, '2026-07-23 15:30:00-07:00', '2026-07-23 16:15:00-07:00',  45.00, 'completed', NULL),
  (8,  'SLM-1035', 3, 12, 4, '2026-07-24 16:30:00-07:00', '2026-07-24 17:30:00-07:00',  70.00, 'completed', NULL),
  (9,  'SLM-1036', 7, 10, 3, '2026-07-25 11:00:00-07:00', '2026-07-25 12:00:00-07:00',  70.00, 'completed', NULL),
  (10, 'SLM-1042', 4, 5,  2, '2026-07-28 09:30:00-07:00', '2026-07-28 10:30:00-07:00', 110.00, 'booked',    NULL),
  (11, 'SLM-1040', 2, 1,  1, '2026-07-28 10:00:00-07:00', '2026-07-28 11:00:00-07:00',  78.00, 'booked',    'Keep the length, tidy the fringe.'),
  (12, 'SLM-1039', 1, 4,  1, '2026-07-29 14:00:00-07:00', '2026-07-29 14:45:00-07:00',  60.00, 'booked',    'Running a few minutes late, sorry!'),
  (13, 'SLM-1041', 1, 11, 4, '2026-07-29 17:00:00-07:00', '2026-07-29 17:45:00-07:00',  40.00, 'booked',    NULL),
  (14, 'SLM-1038', 3, 9,  3, '2026-07-30 10:30:00-07:00', '2026-07-30 11:30:00-07:00',  58.00, 'booked',    NULL),
  (15, 'SLM-1037', 5, 6,  2, '2026-07-31 10:00:00-07:00', '2026-07-31 11:00:00-07:00', 115.00, 'booked',    'First deep-tissue visit.');

-- Reminder preferences on the two frontend-seeded bookings; every other row
-- keeps the column defaults (email + SMS, 24 hours before).

UPDATE appointments SET remind_email = true, remind_sms = false, remind_when = '24h' WHERE code = 'SLM-1039';
UPDATE appointments SET remind_email = true, remind_sms = true,  remind_when = '24h' WHERE code = 'SLM-1041';

-- Waitlist -------------------------------------------------------------------
-- The first row is the entry the frontend seeds: Ava, Gel Manicure with Ivy on
-- the booked-out Wednesday.

INSERT INTO waitlist_entries (customer_id, service_id, staff_id, requested_date, status) VALUES
  (1, 9, 3,    '2026-07-29', 'waiting'),
  (6, 7, NULL, '2026-07-31', 'notified');

-- Gift cards -----------------------------------------------------------------
-- GIFT-4821 is the card the frontend seeds under "Purchased gift cards".

INSERT INTO gift_cards (code, amount, balance, purchaser_id, recipient_name, recipient_email, sender_name, message, theme, status, scheduled_for, issued_at) VALUES
  ('GIFT-4821', 100.00, 100.00, 1, 'Robin Alvarez', 'robin@email.com', 'Ava Reyes',   'Treat yourself — you''ve earned it.', 'bloom', 'sent',      NULL,         '2026-07-12 09:20:00-07:00'),
  ('GIFT-4712', 150.00,   0.00, 2, 'Priya Sharma',  'priya@example.com', 'Liam Chen', NULL,                                  'sage',  'redeemed',  NULL,         '2026-05-04 17:41:00-07:00'),
  ('GIFT-4903',  50.00,  50.00, 4, 'Dana Roth',     'dana@example.com',  'Maya Kapoor', 'Happy birthday!',                   'amber', 'scheduled', '2026-08-14', '2026-07-24 12:05:00-07:00');

-- Loyalty ledger -------------------------------------------------------------
-- Ava's five entries sum to 340 points — the balance the frontend shows on the
-- membership and loyalty-history screens. Earn rows link to the visit that
-- produced them.

INSERT INTO loyalty_ledger (customer_id, appointment_id, label, kind, delta_points, occurred_on) VALUES
  (1, NULL, 'Welcome bonus + early visits',   'bonus',   182, '2026-05-20'),
  (1, 1,    'Gel Manicure with Ivy',          'earn',     58, '2026-06-02'),
  (1, NULL, 'Redeemed — $10 off any service', 'redeem', -200, '2026-06-18'),
  (1, 2,    'Signature Facial with Noor',     'earn',    110, '2026-06-30'),
  (1, 3,    'Balayage with Selma',            'earn',    190, '2026-07-14');

-- Advance serial sequences past the explicit ids above ------------------------

SELECT setval('service_categories_id_seq', (SELECT max(id) FROM service_categories));
SELECT setval('services_id_seq',           (SELECT max(id) FROM services));
SELECT setval('staff_id_seq',              (SELECT max(id) FROM staff));
SELECT setval('customers_id_seq',          (SELECT max(id) FROM customers));
SELECT setval('appointments_id_seq',       (SELECT max(id) FROM appointments));
