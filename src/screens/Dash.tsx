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
import type { ActivityRow } from "../data/screens/dash.ts";
import {
  ACCOUNT_TINT,
  findPackage,
  GIFTS_SENT_TOTAL,
  RECENT_ACTIVITY,
} from "../data/screens/dash.ts";
import { data } from "../data/source.ts";
import type { OwnedPackage } from "../data/types.ts";
import { useI18n } from "../i18n/index.tsx";
import type { TFunction } from "../i18n/index.tsx";
import {
  durationLabel,
  firstName,
  formatLongDate,
  formatLongISO,
  formatMediumDate,
  formatMediumISO,
  formatNumber,
  initialsOf,
  minutesToTime,
  wholeMoney,
} from "../lib/format.ts";
import { selectUpcoming, useStore } from "../state/store.ts";

import "../styles/screen-dash.css";

/* ------------------------------------------------------------------ *
 * Derivations
 * ------------------------------------------------------------------ */

/**
 * One "Recent activity" sentence.
 *
 * The row stores ids and figures, never a phrase: the service and the
 * specialist come back through the seam so they read as the studio wrote them,
 * while the points count goes through `t()`'s plural rather than a `+ 's'`.
 */
function activityLabel(t: TFunction, row: ActivityRow): string {
  return t(
    row.labelKey,
    {
      ...(row.svc === undefined
        ? null
        : { service: data.getService(row.svc)?.name ?? row.svc }),
      ...(row.staff === undefined
        ? null
        : { staff: data.getStaffMember(row.staff)?.name ?? row.staff }),
      ...(row.points === undefined ? null : { count: formatNumber(row.points) }),
      ...(row.name === undefined ? null : { name: row.name }),
    },
    row.points,
  );
}

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

type NumberFn = (n: number, opts?: Intl.NumberFormatOptions) => string;

function ownedCards(
  owned: readonly OwnedPackage[],
  t: TFunction,
  number: NumberFn,
): OwnedCard[] {
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
        sub: t("screensA.dash.pkgSub", {
          qty: number(p.qty),
          service:
            data.getService(p.svc)?.name ?? t("screensA.dash.pkgFallback"),
        }),
        usedLabel: t("screensA.dash.pkgUsed", {
          used: number(used),
          total: number(p.qty),
        }),
        left: p.qty - used,
        pct: Math.round((used / p.qty) * 100),
        svc: p.svc,
      },
    ];
  });
}

/** Packages run twelve months from purchase; the demo dates them from today. */
function packageExpiry(t: TFunction): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return t("screensA.dash.pkgExpires", { date: formatMediumDate(d) });
}

/* One key per part of the day: a greeting is a whole sentence in most
 * languages, not a salutation with a name bolted on the end. */
function greetingFor(name: string, t: TFunction): string {
  const hour = new Date().getHours();
  const key =
    hour < 12
      ? "screensA.dash.morning"
      : hour < 18
        ? "screensA.dash.afternoon"
        : "screensA.dash.evening";
  return t(key, { name: firstName(name) });
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
  const { t, number } = useI18n();
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
  const owned = useMemo(
    () => ownedCards(pkgOwned, t, number),
    [pkgOwned, t, number],
  );

  if (!signedIn) {
    return (
      <section className="bk-screen bk-page scr-dash">
        <EmptyState
          className="scr-dash__signedout"
          icon="user-round"
          title={t("screensA.dash.signedOutTitle")}
          body={t("screensA.dash.signedOutBody")}
          action={
            <Button
              icon="log-in"
              onClick={() => {
                /* Land on a clean sign-in form, not a half-typed one. */
                set({ acctMenu: false, siStep: "email", siCode: "", siErr: "" });
                go("signin");
              }}
            >
              {t("screensA.dash.signIn")}
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
      value: number(points),
      label: t("screensA.dash.statPoints"),
      onClick: () => go("lhistory"),
    },
    {
      icon: "layers",
      value: number(sessionsLeft),
      label: t("screensA.dash.statSessions"),
      onClick: () => go("packages"),
    },
    {
      icon: "calendar-check",
      value: number(upcoming.length),
      label: t("screensA.dash.statVisits"),
      onClick: () => go("visits"),
    },
    {
      icon: "gift",
      value: wholeMoney(GIFTS_SENT_TOTAL),
      label: t("screensA.dash.statGifts"),
      onClick: () => go("mygifts"),
    },
  ];

  const actions: QuickAction[] = [
    {
      icon: "calendar-plus",
      label: t("screensA.common.bookAVisit"),
      onClick: () => startBooking(null),
    },
    {
      icon: "settings-2",
      label: t("screensA.dash.actManage"),
      onClick: () => {
        /* The lookup form, not a result — clear whatever was found before. */
        set({ foundCode: null });
        go("manage");
      },
    },
    {
      icon: "bell",
      label: t("screensA.dash.actNotifications"),
      onClick: () => go("notifprefs"),
    },
    {
      icon: "clipboard-check",
      label: t("screensA.dash.actIntake"),
      onClick: () => go("intake"),
    },
    {
      icon: "share-2",
      label: t("screensA.dash.actRefer"),
      onClick: () => go("refer"),
    },
    {
      icon: "users",
      label: t("screensA.dash.actStaff"),
      onClick: () => {
        /* The comp reset `staffSel` here; on this store the directory's own
         * selection is `staffId` — `staffSel` belongs to the booking draft. */
        set({ staffId: null });
        go("staff");
      },
    },
    {
      icon: "shopping-bag",
      label: t("screensA.dash.actShop"),
      onClick: () => go("shop"),
    },
    {
      icon: "star",
      label: t("screensA.dash.actReviews"),
      onClick: () => go("reviews"),
    },
    {
      icon: "file-down",
      label: t("screensA.dash.actExport"),
      onClick: () => go("export"),
    },
    {
      icon: "credit-card",
      label: t("screensA.dash.actCheckout"),
      onClick: () => {
        set({ ckStep: "pay" });
        go("checkout");
      },
    },
    {
      icon: "receipt",
      label: t("screensA.dash.actOrders"),
      onClick: () => go("orders"),
    },
    {
      icon: "tag",
      label: t("screensA.dash.actOffers"),
      onClick: () => go("offers"),
    },
    {
      icon: "life-buoy",
      label: t("screensA.dash.actHelp"),
      onClick: () => go("help"),
    },
    {
      icon: "gift",
      label: t("screensA.dash.actGift"),
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
          <h1 className="bk-h1 scr-dash__title">
            {greetingFor(acct.name, t)}
          </h1>
          <p className="bk-sub scr-dash__sub">
            {t("screensA.dash.subline", { date: formatLongDate(new Date()) })}
          </p>
        </div>
        <div className="scr-dash__headbtns">
          <Button variant="ghost" icon="settings" onClick={() => go("account")}>
            {t("screensA.dash.settings")}
          </Button>
          <Button icon="calendar-plus" onClick={() => startBooking(null)}>
            {t("screensA.common.bookAVisit")}
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
            {t("screensA.dash.nextVisit")}
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
                    {nextSvc?.name ?? t("screensA.dash.appointment")}
                  </div>
                  <div className="scr-dash__cardsub">
                    {t("screensA.dash.nextWith", {
                      staff:
                        nextStaff?.name ?? t("screensA.dash.firstAvailable"),
                      duration: durationLabel(next.dur),
                    })}
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
                  {t("screensA.dash.manage")}
                </Button>
                <Button
                  variant="ghost"
                  iconEnd="arrow-right"
                  iconSize={15}
                  onClick={() => go("visits")}
                >
                  {t("screensA.dash.allVisits")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="scr-dash__pempty">
              <div className="scr-dash__pemptytitle">
                {t("screensA.dash.noBookingsTitle")}
              </div>
              <p className="scr-dash__pemptybody">
                {t("screensA.dash.noBookingsBody")}
              </p>
              <Button onClick={() => startBooking(null)}>
                {t("screensA.common.bookAVisit")}
              </Button>
            </div>
          )}
        </Card>

        <Card radius={20} clip className="scr-dash__panel">
          <Eyebrow icon="layers" className="scr-dash__phead">
            {t("screensA.dash.yourPackage")}
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
                  aria-label={t("screensA.dash.pkgAria", { name: pkg.name })}
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
                  <span>{packageExpiry(t)}</span>
                </div>
              </div>
              <div className="scr-dash__pfoot">
                <Button
                  icon="calendar-plus"
                  iconSize={15}
                  onClick={() => (pkg.svc ? startBooking(pkg.svc) : go("services"))}
                >
                  {t("screensA.dash.useSession")}
                </Button>
                <Button variant="ghost" onClick={() => go("packages")}>
                  {t("screensA.dash.allPackages")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="scr-dash__pempty">
              <div className="scr-dash__pemptytitle">
                {t("screensA.dash.noPackagesTitle")}
              </div>
              <p className="scr-dash__pemptybody">
                {t("screensA.dash.noPackagesBody")}
              </p>
              <Button onClick={() => go("packages")}>
                {t("screensA.dash.seePackages")}
              </Button>
            </div>
          )}
        </Card>
      </div>

      <div className="scr-dash__cols">
        <section>
          <h2 className="scr-dash__coltitle">
            {t("screensA.dash.quickActions")}
          </h2>
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
          <h2 className="scr-dash__coltitle">
            {t("screensA.dash.recentActivity")}
          </h2>
          <Card clip className="scr-dash__activity">
            {RECENT_ACTIVITY.map((row) => (
              <div key={row.dateISO} className="scr-dash__actrow">
                <span className="scr-dash__smalltile">
                  <Icon name={row.icon} size={15} />
                </span>
                <span className="scr-dash__actrowtext">
                  <span className="scr-dash__actrowlabel">
                    {activityLabel(t, row)}
                  </span>
                  <span className="scr-dash__actrowdate">
                    {formatMediumISO(row.dateISO)}
                  </span>
                </span>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </section>
  );
}
