/*
 * YOUR DASHBOARD (view: 'dash') — the signed-in home of the guest half.
 *
 * Nothing here is its own source of truth: the stat tiles, the next-visit
 * panel and the package panel are all views over store state the other guest
 * screens write (`points`, `bookings`, `pkgOwned`). That is why the numbers
 * move when you book, cancel or buy elsewhere in the demo.
 *
 * Signed out, the whole body collapses to a single "sign back in" prompt —
 * there is no half-populated dashboard state.
 */

import { useMemo } from "react";

import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Eyebrow,
  Icon,
  IconTile,
} from "../components/index.ts";
import {
  ACCOUNT_TINT,
  findPackage,
  GIFTS_SENT_LABEL,
  RECENT_ACTIVITY,
} from "../data/screens/dash.ts";
import { data } from "../data/source.ts";
import type { OwnedPackage } from "../data/types.ts";
import {
  durationLabel,
  firstName,
  formatLongDate,
  formatLongISO,
  initialsOf,
  minutesToTime,
  MONTH_SHORT,
} from "../lib/format.ts";
import { selectUpcoming, useStore } from "../state/store.ts";

import "../styles/screen-dash.css";

/* ------------------------------------------------------------------ *
 * Derivations
 * ------------------------------------------------------------------ */

interface OwnedCard {
  name: string;
  /** `'5 × Signature Facial'`. */
  sub: string;
  usedLabel: string;
  /** Sessions still on the card — the "sessions left" stat sums these. */
  left: number;
  /** Progress, 0–100. */
  pct: number;
  /** What "Use a session" books; `null` sends you to the full catalogue. */
  svc: string | null;
}

function ownedCards(owned: readonly OwnedPackage[]): OwnedCard[] {
  return owned.flatMap((o) => {
    const p = findPackage(o.id);
    /* An id with no catalogue row is dropped rather than rendered blank. */
    if (!p) return [];
    /* Clamped: a bad `used` count must not draw a bar past 100% or a
     * negative "sessions left" total. */
    const used = Math.min(Math.max(o.used, 0), p.qty);
    return [
      {
        name: p.name,
        sub: `${p.qty} × ${data.getService(p.svc)?.name ?? "studio services"}`,
        usedLabel: `${used} of ${p.qty} used`,
        left: p.qty - used,
        pct: Math.round((used / p.qty) * 100),
        svc: p.svc,
      },
    ];
  });
}

/** Packages run twelve months from purchase; the demo dates them from today. */
function packageExpiry(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return `Expires ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function greetingFor(name: string): string {
  const hour = new Date().getHours();
  const part =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${part}, ${firstName(name)}`;
}

interface QuickAction {
  icon: string;
  label: string;
  onClick: () => void;
}

/* ------------------------------------------------------------------ *
 * Screen
 * ------------------------------------------------------------------ */

export default function Dash() {
  const signedIn = useStore((s) => s.signedIn);
  const acct = useStore((s) => s.acct);
  const points = useStore((s) => s.points);
  const pkgOwned = useStore((s) => s.pkgOwned);
  const bookings = useStore((s) => s.bookings);
  const go = useStore((s) => s.go);
  const set = useStore((s) => s.set);
  const startBooking = useStore((s) => s.startBooking);
  const openManage = useStore((s) => s.openManage);

  /* `selectUpcoming` allocates, so it is memoised on `bookings` (as Visits). */
  const upcoming = useMemo(
    () => selectUpcoming(useStore.getState()),
    [bookings],
  );
  const owned = useMemo(() => ownedCards(pkgOwned), [pkgOwned]);

  if (!signedIn) {
    return (
      <section className="bk-screen bk-page scr-dash">
        <EmptyState
          className="scr-dash__signedout"
          icon="user-round"
          title="You’re signed out"
          body="Sign back in to see your visits, points and packages. It’s a demo — one tap, no password."
          action={
            <Button
              icon="log-in"
              onClick={() => {
                /* Land on a clean sign-in form, not a half-typed one. */
                set({ acctMenu: false, siStep: "email", siCode: "", siErr: "" });
                go("signin");
              }}
            >
              Sign in as Ava
            </Button>
          }
        />
      </section>
    );
  }

  const next = upcoming[0];
  const nextSvc = data.getService(next?.svc);
  const nextStaff = data.getStaffMember(next?.staff);
  const pkg = owned[0];
  const sessionsLeft = owned.reduce((sum, o) => sum + o.left, 0);

  const stats = [
    {
      icon: "gem",
      value: String(points),
      label: "Loyalty points",
      onClick: () => go("lhistory"),
    },
    {
      icon: "layers",
      value: String(sessionsLeft),
      label: "Package sessions left",
      onClick: () => go("packages"),
    },
    {
      icon: "calendar-check",
      value: String(upcoming.length),
      label: "Upcoming visits",
      onClick: () => go("visits"),
    },
    {
      icon: "gift",
      value: GIFTS_SENT_LABEL,
      label: "Gift cards sent",
      onClick: () => go("mygifts"),
    },
  ];

  const actions: QuickAction[] = [
    { icon: "calendar-plus", label: "Book a visit", onClick: () => startBooking(null) },
    {
      icon: "settings-2",
      label: "Manage booking",
      onClick: () => {
        /* The lookup form, not a result — clear whatever was found before. */
        set({ foundCode: null });
        go("manage");
      },
    },
    { icon: "bell", label: "Notifications", onClick: () => go("notifprefs") },
    { icon: "clipboard-check", label: "Intake form", onClick: () => go("intake") },
    { icon: "share-2", label: "Refer a friend", onClick: () => go("refer") },
    {
      icon: "users",
      label: "Staff profiles",
      onClick: () => {
        /* The comp reset `staffSel` here; on this store the directory's own
         * selection is `staffId` — `staffSel` belongs to the booking draft. */
        set({ staffId: null });
        go("staff");
      },
    },
    { icon: "shopping-bag", label: "Retail products", onClick: () => go("shop") },
    { icon: "star", label: "Reviews & ratings", onClick: () => go("reviews") },
    { icon: "file-down", label: "Export bookings", onClick: () => go("export") },
    {
      icon: "credit-card",
      label: "Checkout & payment",
      onClick: () => {
        set({ ckStep: "pay" });
        go("checkout");
      },
    },
    { icon: "receipt", label: "Order history", onClick: () => go("orders") },
    { icon: "tag", label: "Seasonal offers", onClick: () => go("offers") },
    { icon: "life-buoy", label: "Help & FAQ", onClick: () => go("help") },
    {
      icon: "gift",
      label: "Gift cards",
      onClick: () => {
        set({ gcStep: "design", gcCode: null, gcErr: "" });
        go("giftcards");
      },
    },
  ];

  return (
    <section className="bk-screen bk-page scr-dash">
      <header className="scr-dash__head">
        <Avatar
          initials={initialsOf(acct.name)}
          tint={ACCOUNT_TINT}
          size={60}
          fontSize={21}
          className="scr-dash__avatar"
        />
        <div className="scr-dash__id">
          <h1 className="bk-h1 scr-dash__title">{greetingFor(acct.name)}</h1>
          <p className="bk-sub scr-dash__sub">
            {formatLongDate(new Date())} · Studio Circle member
          </p>
        </div>
        <div className="scr-dash__headbtns">
          <Button variant="ghost" icon="settings" onClick={() => go("account")}>
            Settings
          </Button>
          <Button icon="calendar-plus" onClick={() => startBooking(null)}>
            Book a visit
          </Button>
        </div>
      </header>

      <div className="scr-dash__stats">
        {stats.map((st) => (
          <button
            key={st.label}
            type="button"
            className="bk-card scr-dash__stat"
            onClick={st.onClick}
          >
            <span className="scr-dash__staticon">
              <Icon name={st.icon} size={17} />
            </span>
            <span>
              <span className="bk-mono scr-dash__statvalue">{st.value}</span>
              <span className="scr-dash__statlabel">{st.label}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="scr-dash__panels">
        <Card radius={20} clip className="scr-dash__panel">
          <Eyebrow icon="calendar-clock" className="scr-dash__phead">
            Next visit
          </Eyebrow>
          {next ? (
            <div className="scr-dash__pbody">
              <div className="scr-dash__nextid">
                <IconTile
                  icon={nextSvc?.icon ?? "sparkles"}
                  tint={nextSvc?.tint ?? ACCOUNT_TINT}
                  size={48}
                  iconSize={22}
                  radius={15}
                />
                <div className="scr-dash__nexttext">
                  <div className="scr-dash__cardtitle">
                    {nextSvc?.name ?? "Appointment"}
                  </div>
                  <div className="scr-dash__cardsub">
                    with {nextStaff?.name ?? "first available"} ·{" "}
                    {durationLabel(next.dur)}
                  </div>
                </div>
              </div>
              <div className="scr-dash__facts">
                <span className="scr-dash__fact">
                  <Icon name="calendar" size={14} />
                  {formatLongISO(next.dateISO)}
                </span>
                <span className="bk-mono scr-dash__fact scr-dash__fact--time">
                  <Icon name="clock" size={14} />
                  {minutesToTime(next.time)}
                </span>
              </div>
              <div className="scr-dash__pfoot">
                <Button
                  variant="ghost"
                  icon="settings-2"
                  iconSize={15}
                  onClick={() => openManage(next.code, next.email)}
                >
                  Manage
                </Button>
                <Button
                  variant="ghost"
                  iconEnd="arrow-right"
                  iconSize={15}
                  onClick={() => go("visits")}
                >
                  All visits
                </Button>
              </div>
            </div>
          ) : (
            <div className="scr-dash__pempty">
              <div className="scr-dash__pemptytitle">Nothing on the books</div>
              <p className="scr-dash__pemptybody">
                Your calendar is clear. Want to change that?
              </p>
              <Button onClick={() => startBooking(null)}>Book a visit</Button>
            </div>
          )}
        </Card>

        <Card radius={20} clip className="scr-dash__panel">
          <Eyebrow icon="layers" className="scr-dash__phead">
            Your package
          </Eyebrow>
          {pkg ? (
            <div className="scr-dash__pbody">
              <div>
                <div className="scr-dash__cardtitle">{pkg.name}</div>
                <div className="scr-dash__cardsub">{pkg.sub}</div>
              </div>
              <div>
                <div
                  className="scr-dash__bar"
                  role="progressbar"
                  aria-label={`${pkg.name} sessions used`}
                  aria-valuenow={pkg.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="scr-dash__barfill"
                    style={{ inlineSize: `${pkg.pct}%` }}
                  />
                </div>
                <div className="scr-dash__barmeta">
                  <span>{pkg.usedLabel}</span>
                  <span>{packageExpiry()}</span>
                </div>
              </div>
              <div className="scr-dash__pfoot">
                <Button
                  icon="calendar-plus"
                  iconSize={15}
                  onClick={() => (pkg.svc ? startBooking(pkg.svc) : go("services"))}
                >
                  Use a session
                </Button>
                <Button variant="ghost" onClick={() => go("packages")}>
                  All packages
                </Button>
              </div>
            </div>
          ) : (
            <div className="scr-dash__pempty">
              <div className="scr-dash__pemptytitle">No packages yet</div>
              <p className="scr-dash__pemptybody">
                Bundles save up to 20% when you know you’ll be back.
              </p>
              <Button onClick={() => go("packages")}>See package deals</Button>
            </div>
          )}
        </Card>
      </div>

      <div className="scr-dash__cols">
        <section>
          <h2 className="scr-dash__coltitle">Quick actions</h2>
          <div className="scr-dash__actions">
            {actions.map((a) => (
              <button
                key={a.label}
                type="button"
                className="bk-tile scr-dash__action"
                onClick={a.onClick}
              >
                <span className="scr-dash__smalltile">
                  <Icon name={a.icon} size={16} />
                </span>
                <span className="scr-dash__actionlabel">{a.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="scr-dash__coltitle">Recent activity</h2>
          <Card clip className="scr-dash__activity">
            {RECENT_ACTIVITY.map((row) => (
              <div key={row.label} className="scr-dash__actrow">
                <span className="scr-dash__smalltile">
                  <Icon name={row.icon} size={15} />
                </span>
                <span className="scr-dash__actrowtext">
                  <span className="scr-dash__actrowlabel">{row.label}</span>
                  <span className="scr-dash__actrowdate">{row.date}</span>
                </span>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </section>
  );
}
