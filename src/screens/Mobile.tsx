/*
 * COMPANION APP SHOWCASE (view: 'mobile') — the Mobile comp.
 *
 * The Mobile comp is not a breakpoint of the web app: it is a separate native
 * design — five tabs (Home, Book, Visits, Offers, You) drawn inside a 402×874
 * phone. It ships as one showcase screen: a device-framed mockup the visitor
 * can flip between the five tabs of.
 *
 * Everything inside the frame is component state on purpose. The mockup must
 * not move the real app's booking draft, cart or loyalty balance — a visitor
 * poking at the phone should not find the web app changed underneath them.
 * The single exception is "Dark appearance": the device inherits the page's
 * tokens, so a phone-local theme is not expressible, and that row drives the
 * app's own theme instead.
 *
 * The comp's nine sub-routes (team, wait list, checkout, gift cards, reviews,
 * careers, the shelf, export) are out of scope here — they already ship as
 * full guest screens on the web. Taps that led to them fall back to the
 * comp's own "demo only" toast.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { Avatar, Icon, IconTile, PlaceholderTile } from "../components/index.ts";
import {
  ACCOUNT_ROWS,
  APP_VERSION,
  COPIED_MS,
  FEATURED_OFFER,
  HOME_SERVICE_IDS,
  isSlotOpen,
  JOURNAL_TEASER,
  MOBILE_TABS,
  PAST_VISITS,
  PHONE_OFFERS,
  PHONE_TOAST_MS,
  POINTS_GOAL,
  PROFILE_TINT,
  QUICK_CHIPS,
  REWARD_LABEL,
  SLOT_MINUTES,
  START_POINTS,
  TAB_TITLES,
  UPCOMING_VISITS,
  YOU_STATS,
  type MobileTabKey,
} from "../data/screens/mobile.ts";
import { data } from "../data/source.ts";
import type { CategoryFilter, Service, ToastKind } from "../data/types.ts";
import {
  DOW_SHORT,
  durationLabel,
  formatShortDate,
  initialsOf,
  minutesToTime,
  money,
} from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-mobile.css";

type Toaster = (msg: string, kind?: ToastKind) => void;
type VisitTab = "upcoming" | "past";

interface PhoneToast {
  id: number;
  msg: string;
  kind: ToastKind;
}

/* ------------------------------------------------------------------ *
 * Screen
 * ------------------------------------------------------------------ */

export default function Mobile() {
  const week = useStore((s) => s.week);
  const acct = useStore((s) => s.acct);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);

  const [tab, setTab] = useState<MobileTabKey>("home");
  const [cat, setCat] = useState<CategoryFilter>("all");
  const [svcId, setSvcId] = useState<string | null>(null);
  const [dayIdx, setDayIdx] = useState(1);
  const [time, setTime] = useState<number | null>(null);
  const [visitTab, setVisitTab] = useState<VisitTab>("upcoming");
  const [points, setPoints] = useState(START_POINTS);
  const [push, setPush] = useState(true);
  const [copied, setCopied] = useState("");
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState<PhoneToast | null>(null);

  /* Both flash states own their timer here, so it dies with the screen
   * instead of firing into an unmounted tree the way the comp's did. */
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), PHONE_TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(""), COPIED_MS);
    return () => clearTimeout(t);
  }, [copied]);

  const showToast = useCallback<Toaster>((msg, kind = "ok") => {
    setToast((prev) => ({ id: (prev?.id ?? 0) + 1, msg, kind }));
  }, []);

  const svc = data.getService(svcId);

  /** Jump into the booking tab already pointed at a service. */
  const pick = useCallback((id: string) => {
    setTab("book");
    setSvcId(id);
    setTime(null);
    setDayIdx(1);
  }, []);

  const goTab = useCallback((next: MobileTabKey) => {
    setTab(next);
    if (next === "book") setSvcId(null);
  }, []);

  const confirm = (): void => {
    if (!svc) return;
    if (time === null) {
      showToast("Pick a time first", "warn");
      return;
    }
    /* The comp routed Confirm into a checkout sub-route, and only that route
     * ever opened the success sheet — so in a five-tab build the sheet is
     * dead markup. Confirm opens it directly and credits the same points. */
    setPoints((p) => p + svc.price);
    setDone(true);
  };

  const closeSheet = (): void => {
    setDone(false);
    setSvcId(null);
    setTime(null);
    setTab("visits");
    setVisitTab("upcoming");
    showToast("Booking confirmed");
  };

  const greeting = useMemo(() => {
    const hr = new Date().getHours();
    const part =
      hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
    return `${part}, ${acct.name.split(" ")[0]}`;
  }, [acct.name]);

  return (
    <section className="bk-screen bk-page scr-mobile">
      <header className="scr-mobile__intro">
        <span className="scr-mobile__eyebrow">
          <Icon name="smartphone" size={14} />
          Companion app
        </span>
        <h1 className="scr-mobile__h1">Lumen Studio in your pocket</h1>
        <p className="scr-mobile__sub">
          The phone app is its own design, not a squeezed-down website — five
          tabs, a booking flow built for thumbs, and your points on the home
          screen. Tap through it below.
        </p>
      </header>

      <div className="scr-mobile__stage">
        <div
          className="scr-mobile__device"
          role="group"
          aria-label="Companion app mockup"
        >
          <div className="scr-mobile__screen">
            {/* --- status bar: the comp got this from its device frame --- */}
            <div className="scr-mobile__status" aria-hidden="true">
              <span className="bk-mono scr-mobile__clock">9:41</span>
              <span className="scr-mobile__island" />
              <span className="scr-mobile__meters">
                <span className="scr-mobile__bars">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <span className="scr-mobile__battery" />
              </span>
            </div>

            {/* --- header --- */}
            <div className="scr-mobile__header">
              <div className="scr-mobile__headid">
                {tab === "home" ? (
                  <div className="scr-mobile__kicker">Lumen Studio</div>
                ) : null}
                <div className="scr-mobile__title">
                  {tab === "home" ? greeting : TAB_TITLES[tab]}
                </div>
              </div>
              {tab !== "you" ? (
                <button
                  type="button"
                  className="scr-mobile__avatarbtn"
                  onClick={() => goTab("you")}
                  aria-label="Your profile"
                >
                  <Avatar
                    initials={initialsOf(acct.name)}
                    tint={PROFILE_TINT}
                    size={42}
                    fontSize={14}
                    radius={999}
                  />
                </button>
              ) : null}
            </div>

            {/* --- scrolling body --- */}
            <div className="scr-mobile__body">
              {tab === "home" ? (
                <HomeTab
                  points={points}
                  week={week}
                  onTab={goTab}
                  onPick={pick}
                  toast={showToast}
                />
              ) : null}

              {tab === "book" ? (
                <BookTab
                  cat={cat}
                  onCat={setCat}
                  svc={svc}
                  onPick={pick}
                  onBack={() => {
                    setSvcId(null);
                    setTime(null);
                  }}
                  week={week}
                  dayIdx={dayIdx}
                  onDay={(i) => {
                    setDayIdx(i);
                    setTime(null);
                  }}
                  time={time}
                  onTime={setTime}
                  toast={showToast}
                />
              ) : null}

              {tab === "visits" ? (
                <VisitsTab
                  visitTab={visitTab}
                  onVisitTab={setVisitTab}
                  week={week}
                  onReschedule={(id) => {
                    pick(id);
                    showToast("Pick a new time");
                  }}
                  onPick={pick}
                  toast={showToast}
                />
              ) : null}

              {tab === "offers" ? (
                <OffersTab
                  copied={copied}
                  onCopy={(code) => {
                    setCopied(code);
                    showToast(`${code} copied`);
                  }}
                  onPick={pick}
                />
              ) : null}

              {tab === "you" ? (
                <YouTab
                  points={points}
                  name={acct.name}
                  email={acct.email}
                  push={push}
                  onPush={() => {
                    setPush(!push);
                    showToast(push ? "Push off" : "Push on");
                  }}
                  dark={theme === "dark"}
                  onDark={toggleTheme}
                  toast={showToast}
                />
              ) : null}
            </div>

            {/* --- sticky booking CTA --- */}
            {tab === "book" && svc ? (
              <div className="scr-mobile__ctawrap">
                <button
                  type="button"
                  className="scr-mobile__cta"
                  data-ready={time !== null ? "true" : "false"}
                  onClick={confirm}
                >
                  <Icon name="calendar-check" size={17} />
                  {time !== null
                    ? `Confirm · ${minutesToTime(time)}`
                    : "Pick a time to continue"}
                </button>
              </div>
            ) : null}

            {/* --- tab bar --- */}
            <nav className="scr-mobile__tabs" aria-label="App tabs">
              {MOBILE_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className="scr-mobile__tab"
                  data-on={t.key === tab ? "true" : "false"}
                  aria-current={t.key === tab ? "page" : undefined}
                  onClick={() => goTab(t.key)}
                >
                  <Icon name={t.icon} size={21} />
                  {t.label}
                </button>
              ))}
              <span className="scr-mobile__indicator" aria-hidden="true" />
            </nav>

            {/* --- in-device toast --- */}
            {toast ? (
              <div className="scr-mobile__toastwrap" role="status">
                <span className="scr-mobile__toast" key={toast.id}>
                  <Icon
                    name={
                      toast.kind === "warn" ? "alert-triangle" : "check-circle-2"
                    }
                    size={15}
                  />
                  {toast.msg}
                </span>
              </div>
            ) : null}

            {/* --- booking success sheet --- */}
            {done && svc ? (
              <SuccessSheet
                svc={svc}
                date={week[dayIdx] ?? week[0]}
                time={time ?? SLOT_MINUTES[0]}
                onClose={closeSheet}
              />
            ) : null}
          </div>
        </div>
      </div>

      <p className="scr-mobile__note">
        <Icon name="info" size={17} className="scr-mobile__noteicon" />
        <span>
          A live mockup, not a screenshot — the tabs, the booking flow and the
          promo codes all work. Rows that opened the app's deeper screens (the
          team, the shelf, gift cards) answer with a toast here; those flows
          ship in full on the web.
        </span>
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Home
 * ------------------------------------------------------------------ */

interface HomeTabProps {
  points: number;
  week: Date[];
  onTab: (tab: MobileTabKey) => void;
  onPick: (id: string) => void;
  toast: Toaster;
}

function HomeTab({ points, week, onTab, onPick, toast }: HomeTabProps) {
  const next = UPCOMING_VISITS[0];
  const nextSvc = data.getService(next.svc);
  const nextStaff = data.getStaffForService(next.svc)[0];
  const pct = Math.min(100, Math.round((points / POINTS_GOAL) * 100));
  const toGo = POINTS_GOAL - points;
  const cards = HOME_SERVICE_IDS.map((id) => data.getService(id)).filter(
    (s): s is Service => Boolean(s),
  );

  return (
    <div className="scr-mobile__pane scr-mobile__pane--home">
      <div className="scr-mobile__next">
        <div className="scr-mobile__nexthead">
          <IconTile
            icon={nextSvc?.icon ?? "sparkles"}
            tint={nextSvc?.tint ?? PROFILE_TINT}
            size={44}
            iconSize={20}
            radius={14}
          />
          <span className="scr-mobile__nextid">
            <span className="scr-mobile__nextlabel">Next visit</span>
            <span className="scr-mobile__nextsvc">{nextSvc?.name}</span>
          </span>
        </div>
        <div className="scr-mobile__nextfacts">
          <span className="scr-mobile__fact">
            <Icon name="calendar" size={13} className="scr-mobile__facticon" />
            {formatShortDate(week[next.dayIdx] ?? week[0])}
          </span>
          <span className="scr-mobile__fact bk-mono">
            <Icon name="clock" size={13} className="scr-mobile__facticon" />
            {minutesToTime(next.time)}
          </span>
          <span className="scr-mobile__fact">
            <Icon name="user" size={13} className="scr-mobile__facticon" />
            {nextStaff?.name ?? "First available"}
          </span>
        </div>
        <div className="scr-mobile__nextactions">
          <button
            type="button"
            className="scr-mobile__btn scr-mobile__btn--accent"
            onClick={() => onTab("visits")}
          >
            Manage
          </button>
          <button
            type="button"
            className="scr-mobile__btn scr-mobile__btn--outline"
            onClick={() => toast("Opening Maps — demo only", "warn")}
          >
            Directions
          </button>
        </div>
      </div>

      <div className="scr-mobile__rail">
        {QUICK_CHIPS.map((q) => (
          <button
            key={q.label}
            type="button"
            className="scr-mobile__quick"
            onClick={() =>
              q.tab ? onTab(q.tab) : toast(`${q.label} — demo only`, "warn")
            }
          >
            <Icon name={q.icon} size={15} className="scr-mobile__quickicon" />
            {q.label}
          </button>
        ))}
      </div>

      <div>
        <div className="scr-mobile__sechead">
          <span className="scr-mobile__sectitle">Book again</span>
          <button
            type="button"
            className="scr-mobile__link"
            onClick={() => onTab("book")}
          >
            See all
          </button>
        </div>
        <div className="scr-mobile__rail scr-mobile__rail--cards">
          {cards.map((s) => (
            <button
              key={s.id}
              type="button"
              className="scr-mobile__svccard"
              onClick={() => onPick(s.id)}
            >
              <PlaceholderTile
                tint={s.tint}
                icon={s.icon}
                iconSize={30}
                minHeight={84}
              />
              <span className="scr-mobile__svccardbody">
                <span className="scr-mobile__svccardname">{s.name}</span>
                <span className="bk-mono scr-mobile__svccardmeta">
                  {durationLabel(s.dur)} · {money(s.price)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="scr-mobile__points"
        onClick={() => onTab("you")}
      >
        <span className="scr-mobile__pointstile">
          <Icon name="gem" size={21} />
        </span>
        <span className="scr-mobile__pointsbody">
          <span className="scr-mobile__pointsline">
            <span className="bk-mono scr-mobile__pointsnum">{points}</span>
            <span className="scr-mobile__pointsword">points</span>
          </span>
          <span className="scr-mobile__meter">
            <span
              className="scr-mobile__meterfill"
              style={{ inlineSize: `${pct}%` }}
            />
          </span>
          {/* The comp printed "-30 points to go" as soon as a booking pushed
              the balance past the goal; at or over it, say so instead. */}
          <span className="scr-mobile__pointsgoal">
            {toGo > 0
              ? `${toGo} points to your next ${REWARD_LABEL}`
              : `Your ${REWARD_LABEL} is ready to redeem`}
          </span>
        </span>
      </button>

      <button
        type="button"
        className="scr-mobile__journal"
        onClick={() => toast("Opening the journal — demo only", "warn")}
      >
        <PlaceholderTile
          tint={JOURNAL_TEASER.tint}
          icon="sun"
          iconSize={30}
          minHeight={0}
          borderBlockEnd={false}
          className="scr-mobile__journaltile"
        />
        <span className="scr-mobile__journalbody">
          <span className="scr-mobile__journalkicker">
            {JOURNAL_TEASER.kicker}
          </span>
          <span className="scr-mobile__journaltitle">
            {JOURNAL_TEASER.title}
          </span>
          <span className="scr-mobile__journalby">{JOURNAL_TEASER.byline}</span>
        </span>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Book — the service list, then the day + time grid
 * ------------------------------------------------------------------ */

interface BookTabProps {
  cat: CategoryFilter;
  onCat: (cat: CategoryFilter) => void;
  svc: Service | undefined;
  onPick: (id: string) => void;
  onBack: () => void;
  week: Date[];
  dayIdx: number;
  onDay: (index: number) => void;
  time: number | null;
  onTime: (min: number) => void;
  toast: Toaster;
}

function BookTab({
  cat,
  onCat,
  svc,
  onPick,
  onBack,
  week,
  dayIdx,
  onDay,
  time,
  onTime,
  toast,
}: BookTabProps) {
  if (!svc) {
    const chips: { value: CategoryFilter; label: string }[] = [
      { value: "all", label: "All" },
      ...data.getCategories().map((c) => ({ value: c.slug, label: c.name })),
    ];

    return (
      <div className="scr-mobile__pane">
        <div className="scr-mobile__rail scr-mobile__rail--chips">
          {chips.map((c) => (
            <button
              key={c.value}
              type="button"
              className="scr-mobile__chip"
              data-on={c.value === cat ? "true" : "false"}
              aria-pressed={c.value === cat}
              onClick={() => onCat(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="scr-mobile__list">
          {data.getServicesByCategory(cat).map((s) => (
            <button
              key={s.id}
              type="button"
              className="scr-mobile__svcrow"
              onClick={() => onPick(s.id)}
            >
              <IconTile
                icon={s.icon}
                tint={s.tint}
                size={46}
                iconSize={21}
                radius={15}
              />
              <span className="scr-mobile__rowid">
                <span className="scr-mobile__rowname">{s.name}</span>
                <span className="scr-mobile__rowmeta">
                  {durationLabel(s.dur)} · {data.getStaffNames(s.id)}
                </span>
              </span>
              <span className="scr-mobile__rowend">
                <span className="bk-mono scr-mobile__price">{money(s.price)}</span>
                <Icon name="chevron-right" size={16} />
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="scr-mobile__pane">
      <button type="button" className="scr-mobile__back" onClick={onBack}>
        <Icon name="chevron-left" size={16} />
        All services
      </button>

      <div className="scr-mobile__picked">
        <IconTile
          icon={svc.icon}
          tint={svc.tint}
          size={46}
          iconSize={21}
          radius={15}
        />
        <span className="scr-mobile__rowid">
          <span className="scr-mobile__pickedname">{svc.name}</span>
          <span className="scr-mobile__rowmeta">
            {durationLabel(svc.dur)} · with {data.getStaffNames(svc.id)}
          </span>
        </span>
        <span className="bk-mono scr-mobile__pickedprice">{money(svc.price)}</span>
      </div>

      <span className="scr-mobile__label">Pick a day</span>
      <div className="scr-mobile__rail scr-mobile__rail--days">
        {week.map((d, i) => (
          <button
            key={d.getTime()}
            type="button"
            className="scr-mobile__day"
            data-on={i === dayIdx ? "true" : "false"}
            aria-pressed={i === dayIdx}
            onClick={() => onDay(i)}
          >
            <span className="scr-mobile__daydow">{DOW_SHORT[d.getDay()]}</span>
            <span className="bk-mono scr-mobile__daynum">{d.getDate()}</span>
          </button>
        ))}
      </div>

      <span className="scr-mobile__label">Pick a time</span>
      <div className="scr-mobile__slots">
        {SLOT_MINUTES.map((m, i) => {
          const open = isSlotOpen(dayIdx, i);
          return (
            <button
              key={m}
              type="button"
              className="bk-mono scr-mobile__slot"
              data-on={time === m ? "true" : "false"}
              data-open={open ? "true" : "false"}
              /* Taken slots stay tappable so the comp's explanatory toast
                 still fires; screen readers hear them as unavailable. */
              aria-disabled={!open}
              onClick={() => (open ? onTime(m) : toast("That slot is taken", "warn"))}
            >
              {minutesToTime(m)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Visits
 * ------------------------------------------------------------------ */

interface VisitsTabProps {
  visitTab: VisitTab;
  onVisitTab: (tab: VisitTab) => void;
  week: Date[];
  onReschedule: (id: string) => void;
  onPick: (id: string) => void;
  toast: Toaster;
}

function VisitsTab({
  visitTab,
  onVisitTab,
  week,
  onReschedule,
  onPick,
  toast,
}: VisitsTabProps) {
  const upcoming = visitTab === "upcoming";
  /* The comp hardcoded "Tue, Jul 28" in three places; upcoming visits are
   * pinned to the rolling week instead so the demo never shows a past date.
   * Past visits keep their written dates — they are history, not a schedule. */
  const rows = upcoming
    ? UPCOMING_VISITS.map((v) => ({
        code: v.code,
        svc: v.svc,
        price: v.price,
        when: `${formatShortDate(week[v.dayIdx] ?? week[0])} · ${minutesToTime(v.time)}`,
      }))
    : PAST_VISITS.map((v) => ({
        code: v.code,
        svc: v.svc,
        price: v.price,
        when: v.date,
      }));

  return (
    <div className="scr-mobile__pane">
      <div className="scr-mobile__seg">
        {(["upcoming", "past"] as const).map((v) => (
          <button
            key={v}
            type="button"
            className="scr-mobile__segbtn"
            data-on={v === visitTab ? "true" : "false"}
            aria-pressed={v === visitTab}
            onClick={() => onVisitTab(v)}
          >
            {v === "upcoming" ? "Upcoming" : "Past"}
          </button>
        ))}
      </div>

      <div className="scr-mobile__list">
        {rows.map((v) => {
          const s = data.getService(v.svc);
          const staff = data.getStaffForService(v.svc)[0];
          return (
            <article className="scr-mobile__visit" key={v.code}>
              <div className="scr-mobile__visithead">
                <IconTile
                  icon={s?.icon ?? "sparkles"}
                  tint={s?.tint ?? PROFILE_TINT}
                  size={46}
                  iconSize={21}
                  radius={15}
                />
                <span className="scr-mobile__rowid">
                  <span className="scr-mobile__pickedname">{s?.name}</span>
                  <span className="scr-mobile__rowmeta">
                    {v.when} · {staff?.name ?? "First available"}
                  </span>
                </span>
                <span className="bk-mono scr-mobile__price">{money(v.price)}</span>
              </div>
              <div className="scr-mobile__visitactions">
                <button
                  type="button"
                  className="scr-mobile__btn scr-mobile__btn--accent"
                  onClick={() => (upcoming ? onReschedule(v.svc) : onPick(v.svc))}
                >
                  {upcoming ? "Reschedule" : "Book again"}
                </button>
                <button
                  type="button"
                  className="scr-mobile__btn scr-mobile__btn--quiet"
                  onClick={() =>
                    toast(
                      upcoming ? "Cancelled — demo only" : "Receipt emailed",
                      "warn",
                    )
                  }
                >
                  {upcoming ? "Cancel" : "Receipt"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Offers
 * ------------------------------------------------------------------ */

interface OffersTabProps {
  copied: string;
  onCopy: (code: string) => void;
  onPick: (id: string) => void;
}

function OffersTab({ copied, onCopy, onPick }: OffersTabProps) {
  return (
    <div className="scr-mobile__pane">
      <div className="scr-mobile__feature">
        <span className="scr-mobile__featends">{FEATURED_OFFER.ends}</span>
        <div className="scr-mobile__feattitle">{FEATURED_OFFER.title}</div>
        <p className="scr-mobile__featblurb">{FEATURED_OFFER.blurb}</p>
        <button
          type="button"
          className="bk-mono scr-mobile__featcode"
          onClick={() => onCopy(FEATURED_OFFER.code)}
          aria-label={
            copied === FEATURED_OFFER.code
              ? `${FEATURED_OFFER.code} copied`
              : `Copy the code ${FEATURED_OFFER.code}`
          }
        >
          <Icon name={copied === FEATURED_OFFER.code ? "check" : "copy"} size={15} />
          {FEATURED_OFFER.code}
        </button>
      </div>

      {PHONE_OFFERS.map((o) => {
        const on = copied === o.code;
        return (
          <article className="scr-mobile__offer" key={o.code}>
            <div className="scr-mobile__offerhead">
              <IconTile
                icon={o.icon}
                tint={o.tint}
                size={44}
                iconSize={20}
                radius={14}
              />
              <span className="scr-mobile__rowid">
                <span className="scr-mobile__offertitle">{o.title}</span>
                <span className="scr-mobile__offerdeal">{o.deal}</span>
              </span>
            </div>
            <p className="scr-mobile__offerblurb">{o.blurb}</p>
            <div className="scr-mobile__offeractions">
              <button
                type="button"
                className="bk-mono scr-mobile__code"
                data-on={on ? "true" : "false"}
                onClick={() => onCopy(o.code)}
                aria-label={on ? `${o.code} copied` : `Copy the code ${o.code}`}
              >
                <Icon name={on ? "check" : "copy"} size={14} />
                {o.code}
              </button>
              {/* The comp labelled all four "Book"; the offer title goes back
                  into the accessible name so they stay distinguishable. */}
              <button
                type="button"
                className="scr-mobile__btn scr-mobile__btn--accent scr-mobile__offerbook"
                aria-label={`Book ${o.title}`}
                onClick={() => onPick(o.svc)}
              >
                Book
              </button>
            </div>
            <span className="scr-mobile__offerends">{o.ends}</span>
          </article>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * You
 * ------------------------------------------------------------------ */

interface YouTabProps {
  points: number;
  name: string;
  email: string;
  push: boolean;
  onPush: () => void;
  dark: boolean;
  onDark: () => void;
  toast: Toaster;
}

function YouTab({
  points,
  name,
  email,
  push,
  onPush,
  dark,
  onDark,
  toast,
}: YouTabProps) {
  const toggles = [
    { key: "push", icon: "bell", label: "Push notifications", on: push, act: onPush },
    { key: "theme", icon: "moon", label: "Dark appearance", on: dark, act: onDark },
  ];

  return (
    <div className="scr-mobile__pane">
      <div className="scr-mobile__profile">
        <Avatar
          initials={initialsOf(name)}
          tint={PROFILE_TINT}
          size={52}
          fontSize={17}
          radius={999}
        />
        <span className="scr-mobile__rowid">
          <span className="scr-mobile__profilename">{name}</span>
          <span className="scr-mobile__profilemail">{email}</span>
        </span>
        <span className="scr-mobile__circle">
          <Icon name="gem" size={11} />
          Circle
        </span>
      </div>

      <div className="scr-mobile__stats">
        <div className="scr-mobile__stat">
          <span className="bk-mono scr-mobile__statval">{points}</span>
          <span className="scr-mobile__statlabel">Points</span>
        </div>
        {YOU_STATS.map((s) => (
          <div className="scr-mobile__stat" key={s.label}>
            <span className="bk-mono scr-mobile__statval">{s.value}</span>
            <span className="scr-mobile__statlabel">{s.label}</span>
          </div>
        ))}
      </div>

      <span className="scr-mobile__label">Preferences</span>
      <div className="scr-mobile__group">
        {toggles.map((t) => (
          <button
            key={t.key}
            type="button"
            role="switch"
            aria-checked={t.on}
            className="scr-mobile__row"
            onClick={t.act}
          >
            <span className="scr-mobile__rowicon">
              <Icon name={t.icon} size={15} />
            </span>
            <span className="scr-mobile__rowlabel">{t.label}</span>
            <span className="scr-mobile__track" data-on={t.on ? "true" : "false"}>
              <span className="scr-mobile__knob" />
            </span>
          </button>
        ))}
      </div>

      <span className="scr-mobile__label">Account</span>
      <div className="scr-mobile__group">
        {ACCOUNT_ROWS.map((r) => (
          <button
            key={r.label}
            type="button"
            className="scr-mobile__row"
            onClick={() => toast(`${r.label} — demo only`, "warn")}
          >
            <span className="scr-mobile__rowicon">
              <Icon name={r.icon} size={15} />
            </span>
            <span className="scr-mobile__rowlabel">{r.label}</span>
            <span className="scr-mobile__rowdetail">{r.detail}</span>
            <Icon name="chevron-right" size={16} className="scr-mobile__rowchev" />
          </button>
        ))}
      </div>

      <button
        type="button"
        className="scr-mobile__signout"
        onClick={() => toast("Signed out — demo only", "warn")}
      >
        Sign out
      </button>
      <div className="scr-mobile__version">Lumen Studio · {APP_VERSION}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Booking success sheet
 * ------------------------------------------------------------------ */

interface SuccessSheetProps {
  svc: Service;
  date: Date;
  time: number;
  onClose: () => void;
}

function SuccessSheet({ svc, date, time, onClose }: SuccessSheetProps) {
  const staff = data.getStaffForService(svc.id)[0];
  const rows = [
    { icon: "calendar", label: "When", value: formatShortDate(date) },
    {
      icon: "clock",
      label: "Time",
      value: `${minutesToTime(time)} · ${durationLabel(svc.dur)}`,
    },
    { icon: "credit-card", label: "Total", value: money(svc.price) },
  ];

  return (
    <div className="scr-mobile__scrim">
      <div className="scr-mobile__sheet" role="dialog" aria-label="You’re booked">
        <span className="scr-mobile__sheeticon">
          <Icon name="check" size={30} />
        </span>
        <div className="scr-mobile__sheettitle">You’re booked</div>
        <p className="scr-mobile__sheetsub">
          We’ve got you down for {svc.name} with{" "}
          {staff?.name ?? "the first specialist free"}.
        </p>
        <div className="scr-mobile__sheetrows">
          {rows.map((r) => (
            <div className="scr-mobile__sheetrow" key={r.label}>
              <Icon name={r.icon} size={15} className="scr-mobile__sheetrowicon" />
              <span className="scr-mobile__sheetrowlabel">{r.label}</span>
              <span className="scr-mobile__sheetrowval">{r.value}</span>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="scr-mobile__btn scr-mobile__btn--accent scr-mobile__sheetcta"
          onClick={onClose}
        >
          See my visits
        </button>
      </div>
    </div>
  );
}
