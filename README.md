# Booking Scheduler

A complete, production-shaped appointment-booking app — built with Vite + React
+ TypeScript, no CSS framework, no backend required. It's the scheduling example
app that ships with [Adminium](https://adminium.dev): browse a service menu,
pick a stylist and a real open time slot, book, reschedule or cancel, buy a gift
card, and manage the whole day from a staff-side calendar — all from built-in
demo data.

**Live demo → [adminium.dev/demo/booking-scheduler](https://adminium.dev/demo/booking-scheduler)**

## Local development

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

## Deploy

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Adminiumjs/booking-scheduler&project-name=booking-scheduler&repository-name=booking-scheduler)
&nbsp;
[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/Adminiumjs/booking-scheduler/tree/main)

- **Vercel** — click the button above, or import the repo. Build command
  `npm run build`, output `dist`.
- **DigitalOcean App Platform** — click the button above, or use the included
  [`.do/deploy.template.yaml`](.do/deploy.template.yaml).
- **Host anywhere** — `npm run build` produces a fully static `dist/` you can
  drop on any static host (Netlify, Cloudflare Pages, S3, GitHub Pages…). Or
  build the container:

  ```bash
  docker build -t booking-scheduler .
  docker run -p 8080:80 booking-scheduler
  ```

### Build scripts

| Script               | What it does                                                        |
| -------------------- | ------------------------------------------------------------------- |
| `npm run dev`        | Start the Vite dev server.                                           |
| `npm run build`      | Type-check + build to `dist/` at base `/` (root deploys).            |
| `npm run build:demo` | Build to `dist/` at base `/demo/booking-scheduler/` (Adminium demo). |
| `npm run preview`    | Preview a production build locally.                                  |

## Connecting to Adminium

All scheduling data goes through a thin `DataSource` interface
([`src/data/source.ts`](src/data/source.ts)) with a single `demoSource`
implementation backed by the bundled demo business. To be honest about what runs
today: **nothing is persisted and nothing is charged** — bookings, gift cards and
cancellations live in memory for the length of the session, and reloading the
page resets everything.

Once Adminium's browser-safe **publishable key** (`adm_pub_…`) ships, the
frontend will read and write **live** data — your real services, staff,
availability and appointments from an Adminium-managed database — through the
Adminium records API via a second `DataSource` implementation, without touching
any of the screens or the store. The seam is already in place.

## License

[AGPL-3.0](LICENSE) © 2026 Booking Scheduler. A demo shipped with Adminium.
