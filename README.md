# Booking Scheduler

Online booking for a studio of specialists, installed into
[Adminium](https://adminium.dev). Guests pick a service, a person and an open
time, and look after their own booking. The studio runs the day from a desk
inside Adminium. Your own database holds the bookings, and Adminium applies the
booking rules when a booking is saved, so a page cannot book a time that is
taken.

The demo is dressed as **Lumen Studio**, a fictional studio with six
specialists and twelve services across hair, spa, nails and movement.

**Live demo → [adminium.dev/demo/booking-scheduler](https://adminium.dev/demo/booking-scheduler)**

## What it needs

- Adminium **0.3.76** or later, on SQLite, Postgres or MySQL.
- A working mail setup in Adminium, for the confirmations and reminders.
- For text messages, which are optional: the studio's own Twilio or Telnyx
  account, connected in Adminium under **Studio → Texts**. Without one,
  everything else works and no text is sent.
- Nothing else. Six add-ons are offered at install, and booking, the desk and
  the mails all work with none of them:

| Add-on | Offered | What it adds | Without it |
|---|---|---|---|
| **Forms & surveys** | ticked | Reviews after a visit, which the studio can publish, hide and answer. | No review requests and no reviews page. |
| **Offers & gift cards** | ticked | Gift cards and packs of visits, sold online and used at booking. | No gift card or pack pages and no code box. |
| **Holiday calendars** | unticked | Public holidays as closures. | Closures are entered by hand. |
| **Google Calendar** | unticked | Each person connects their calendar: bookings go out, busy times come in. | The person's private calendar feed still works. |
| **Outlook Calendar** | unticked | The same, for Microsoft accounts. | The same. |
| **Google reviews** | unticked | Up to five of the studio's Google reviews, loaded in the visitor's browser only when they ask. Adminium neither fetches nor stores them. | Only the studio's "Review us on Google" link, if it has set one. |

To take deposits online, connect a payment provider in Adminium. Without one,
every service is paid at the studio. The money goes through the studio's own
provider account.

## What it does

**For guests**, at the studio's own booking page:

- Browse services, the team, reviews, opening hours and how to find the studio.
- Book a service with a chosen person or with "Anyone", at a time that is
  really open.
- Pay a deposit or the full price where the service asks for one.
- Find a booking by its code and e-mail, then move or cancel it.
- Join a waiting list for a day that is full.
- Sign in with a code sent by e-mail to see their visits, leave a review, turn
  review requests off, or delete their details.
- Book from the studio's own website, through an embedded page, a button or a
  floating button.

**For the studio**, in the Bookings section of Adminium:

- **Today:** the day's visits and what needs attention.
- **Calendar:** each person's day, with moves that follow the booking rules.
- **Clients, Services and Team:** the people, the menu, each person's services
  and hours, their time off and their calendar connection.
- **Waiting list:** offer a time that opens up to someone waiting.
- **Reviews:** publish, hide and answer them.
- **Settings:** the studio's details, booking rules, payments, review requests,
  the website snippet and the e-mails.
- **Overview:** the studio's numbers, for the owner.

**Three roles** come with it: owner, front desk and specialist. Each is limited
by Adminium on the server, including what it can read of a guest's details.

**Thirteen e-mails** go out from the app's outbox. Twelve go to guests, in their
language: booked, deposit receipt, deposit link, time let go, reminder, moved,
three kinds of cancellation, a waiting-list offer, a review request and its
reminder. One tells the specialist about a new booking.

**Two text messages** go out too, only through the studio's own text provider
and only to a guest who agreed:

- **A reminder** before the visit, beside the reminder e-mail. A guest agrees
  with a box of its own when they book, under the phone field. It is never
  ticked for them and never needed to book. A reminder that the studio's
  sending hours would push past the visit is skipped, never sent late.
- **A waiting-list offer**, beside the offer e-mail. It names the service, the
  day and the time and until when it can be taken, and sends the guest to the
  e-mail or to the phone, because a text carries no link.

Adminium adds the way to stop to every text and keeps the do-not-text list.
Review requests stay e-mail only. The owner can read and answer guests'
replies on Adminium's Texts page.

**Eight languages:** English, German, French, Danish, Czech, Egyptian Arabic
(right to left), and Simplified and Traditional Chinese.

## Installing it

Install Bookings from Adminium's app catalog and choose the database it should
use. Adminium creates its 21 `bookings_*` tables, 16 pages, the three roles, the
guests' browser keys, the e-mails and the texts. Tick sample data at the install step to
start with Lumen Studio, or leave it off to start empty.

Once installed, the desk opens at `/a/bookings/` inside Adminium and the booking
pages are served at `/apps/bookings/customer/`.

**Coming from the old example.** The earlier version of this repo was a
standalone example with its own tables. This version installs beside those
tables under its own `bookings_` names and leaves them and their rows as they
were. It does not copy them across. An install of the 0.1.0 package cannot be
updated to this version.

## Updating to 0.2.1

0.2.1 needs Adminium 0.3.76, the release that sends text messages through a business's own
Twilio or Telnyx account. The add-ons it asks for are unchanged. Every row is kept as it was;
what changes:

- **Two texts beside two e-mails:** a reminder before the visit, beside the reminder e-mail, and
  a waiting-list offer, beside the offer e-mail. Each goes only through the studio's own text
  provider, and only to a guest who agreed and has not said STOP. With no provider set up,
  nothing is sent, and the desk says so on each booking.
- **A box of its own in step 4**, under the phone field: "Text me about my booking". It is never
  ticked for the guest and never needed to book. It shows only once a number is typed, and only
  while the studio can send texts. Adminium keeps the yes with the words the guest saw, for the
  number they typed, and a text goes to that number. No booking made before the update counts as
  a yes.
- **The desk** shows each booking's texts beside its e-mails, with what became of each one: sent,
  waiting for the sending hours, or not sent and why. The list and its page are now "E-mails and
  texts".
- **Studio phone**, a new setting. A text sent from a sender name, which cannot take a reply,
  gives this number for stopping, or the studio's e-mail when it is empty.
- **Replies:** the owner can read and answer what guests text back, on Adminium's Texts page.
  The front desk and specialists cannot.
- **The Help and Privacy pages** say when the studio texts.

## Local development

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173). It runs the demo:
the guest pages and the desk over a copy of Lumen Studio held in the page, which
keeps nothing.

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server (the demo). |
| `npm run build` | Type-check and build to `dist/`. |
| `npm run build:demo` | Build the website's demo, at base `/demo/booking-scheduler/app/`. |
| `npm run build:surface` | Build the two sides Adminium serves (`dist-surface/`). |
| `npm run manifest` | Write `manifest.json` from `src/manifest/`. |
| `npm run manifest:check` | Check `manifest.json` with Adminium's validator. |
| `npm run sample` | Write the sample in `seeds/`. |
| `npm test` | Run the unit tests. |
| `npm run contract` | Run the contract tests against a built Adminium. |

The contract tests install the app on a real server and drive it as each role.
They need a built Adminium checkout and a built add-ons checkout. SQLite always
runs. Postgres and MySQL run when their URLs are set:

```bash
ADMINIUM_REPO=../adminium ADD_ONS_REPO=../add-ons \
TEST_POSTGRES_URL=postgres://… TEST_MYSQL_URL=mysql://… \
npm run contract
```

## Project structure

```
manifest.json  what Adminium installs (written from src/manifest/)
seeds/         the Lumen Studio sample
src/
  manifest/    the tables and rules, pages, roles, public doors and e-mails
  customer/    the guest's booking pages
  desk/        the studio's desk
  demo/        the in-page studio the demo runs on, and the demo card's words
  sample/      the sample's figures
  contract/    the contract tests
  testing/     Adminium's manifest validator, vendored for the tests
public/fonts/  the app's fonts (woff2)
```

## License

[AGPL-3.0](LICENSE) © 2026 Booking Scheduler. A demo shipped with Adminium.

## Building on this app with a coding agent

The Adminium skills teach Claude Code, Codex and other agents to build and change an app:
`npx skills add Adminiumjs/skills` — https://github.com/Adminiumjs/skills
