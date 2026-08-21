/*
 * COMPANION APP SHOWCASE (view: 'mobile') — the Mobile comp.
 *
 * This screen showcases the companion app's DESIGN. It is not the companion
 * app running: the phone is a mockup on a web page, and nothing inside it
 * reaches the account. What it does do is behave — the five tabs (Home, Book,
 * Visits, Offers, You) and the booking flow are live, because a still image
 * cannot show that the design works for thumbs.
 *
 * The Mobile comp is not a breakpoint of the web app either: it is a separate
 * native design drawn inside a 402×874 phone, with an Android sibling at
 * 412×892. Both frames are reachable from the switch above the device; the
 * tabs and their content are identical between them, only the device chrome
 * changes. The chrome itself lives in ../components/DeviceFrame.tsx — read
 * that file's header for what was ported from the comps and what had to be
 * reconstructed, because the comps imported their frame from a file that was
 * never supplied.
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

import {
  DeviceFrame,
  type DevicePlatform,
} from "../components/DeviceFrame.tsx";
import { BRAND } from "../components/chrome.ts";
import {
  Avatar,
  Icon,
  IconTile,
  PlaceholderTile,
  Segmented,
} from "../components/index.ts";
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
  DETAIL_KEY,
  type AccountRow,
  QUICK_CHIPS,
  REWARD_AMOUNT,
  REWARD_LABEL_KEY,
  SLOT_MINUTES,
  START_POINTS,
  TAB_TITLE_KEYS,
  UPCOMING_VISITS,
  YOU_STATS,
  type MobileTabKey,
} from "../data/screens/mobile.ts";
import {
  journalCategoryLabel,
  journalReadLabel,
  type JournalCategory,
} from "../data/screens/blog.ts";
import { data } from "../data/source.ts";
import type { CategoryFilter, Service, ToastKind } from "../data/types.ts";
import { useI18n, useT, type MessageKey, type TFunction } from "../i18n/index.tsx";
import {
  weekdayName,
  durationLabel,
  formatMediumISO,
  formatShortDate,
  initialsOf,
  minutesToTime,
  money,
  wholeMoney,
} from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-mobile.css";

/**
 * The trailing grey figure on a You-tab row.
 *
 * Two of the six kinds carry a word as well as a number ("2 sent", "4 open"),
 * so those go through a key; the rest are a figure the reader's own `Intl`
 * shapes — a rating with one decimal, a total in their currency.
 */
function detailLabel(
  t: TFunction,
  number: (n: number, opts?: Intl.NumberFormatOptions) => string,
  row: AccountRow,
): string {
  if (row.detail === "none" || row.value === undefined) return "";
  const key = DETAIL_KEY[row.detail];
  if (key) return t(key, { count: number(row.value) }, row.value);
  if (row.detail === "money") return wholeMoney(row.value);
  if (row.detail === "rating")
    return number(row.value, { minimumFractionDigits: 1 });
  return number(row.value);
}

type Toaster = (msg: string, kind?: ToastKind) => void;
type VisitTab = "upcoming" | "past";

/*
 * The comps declare two device frames — IOSDevice at 402×874 and
 * AndroidDevice at 412×892 — and this switches between them.
 *
 * It switches the HANDSET only. The Android comp also specifies a different
 * app design (Material 3: no top border on the nav bar, 56px items with an
 * accent-soft pill behind the active icon, a 14px top-bar inset against iOS's
 * 58px, and an M3 snackbar instead of the pill toast). None of that is ported
 * — the app inside this frame is the iOS design either way. The labels are
 * hardware names and the note under the control says so, because "Android"
 * over the iOS design would be a claim the screen cannot back up.
 */
const DEVICE_OPTIONS: { value: DevicePlatform; labelKey: MessageKey }[] = [
  { value: "ios", labelKey: "screensB.mobile.deviceIphone" },
  { value: "android", labelKey: "screensB.mobile.deviceAndroid" },
];

interface PhoneToast {
  id: number;
  msg: string;
  kind: ToastKind;
}

/** Which greeting the hour of the day earns. */
function greetingKey(hour: number): MessageKey {
  if (hour < 12) return "screensB.mobile.greetMorning";
  if (hour < 18) return "screensB.mobile.greetAfternoon";
  return "screensB.mobile.greetEvening";
}

/* ------------------------------------------------------------------ *
 * Screen
 * ------------------------------------------------------------------ */

export default function Mobile() {
  const t = useT();
  const week = useStore((s) => s.week);
  const acct = useStore((s) => s.acct);
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);

  const [device, setDevice] = useState<DevicePlatform>("ios");
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
    const timer = setTimeout(() => setToast(null), PHONE_TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(""), COPIED_MS);
    return () => clearTimeout(timer);
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
      showToast(t("screensB.mobile.toastPickTime"), "warn");
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
    showToast(t("screensB.mobile.toastBooked"));
  };

  const greeting = useMemo(
    () =>
      t(greetingKey(new Date().getHours()), {
        name: acct.name.split(" ")[0],
      }),
    [acct.name, t],
  );

  return (
    <section className="bk-screen bk-page scr-mobile">
      <header className="scr-mobile__intro">
        <span className="scr-mobile__eyebrow">
          <Icon name="smartphone" size={14} />
          {t("screensB.mobile.eyebrow")}
        </span>
        <h1 className="scr-mobile__h1">
          {t("screensB.mobile.h1", { brand: BRAND.name })}
        </h1>
        <p className="scr-mobile__sub">{t("screensB.mobile.sub")}</p>
      </header>

      <div className="scr-mobile__stage">
        <div className="scr-mobile__switch">
          <Segmented
            options={DEVICE_OPTIONS.map((o) => ({
              value: o.value,
              label: t(o.labelKey),
            }))}
            value={device}
            onChange={setDevice}
            label={t("screensB.mobile.deviceFrame")}
          />
          <span className="scr-mobile__switchnote">
            {t("screensB.mobile.switchNote")}
          </span>
        </div>

        <DeviceFrame platform={device}>
          <div className="scr-mobile__app">
            {/* --- header --- */}
            <div className="scr-mobile__header">
              <div className="scr-mobile__headid">
                {tab === "home" ? (
                  <div className="scr-mobile__kicker">{BRAND.name}</div>
                ) : null}
                <div className="scr-mobile__title">
                  {tab === "home" || TAB_TITLE_KEYS[tab] === null
                    ? greeting
                    : t(TAB_TITLE_KEYS[tab])}
                </div>
              </div>
              {tab !== "you" ? (
                <button
                  type="button"
                  className="scr-mobile__avatarbtn"
                  onClick={() => goTab("you")}
                  aria-label={t("screensB.mobile.yourProfile")}
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
                    showToast(t("screensB.mobile.toastPickNewTime"));
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
                    showToast(t("screensB.common.codeCopied", { code }));
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
                    showToast(
                      t(
                        push
                          ? "screensB.mobile.toastPushOff"
                          : "screensB.mobile.toastPushOn",
                      ),
                    );
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
                    ? t("screensB.mobile.ctaConfirm", {
                        time: minutesToTime(time),
                      })
                    : t("screensB.mobile.ctaPickTime")}
                </button>
              </div>
            ) : null}

            {/* --- tab bar: app navigation, not device chrome --- */}
            <nav className="scr-mobile__tabs" aria-label={t("screensB.mobile.appTabs")}>
              {MOBILE_TABS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className="scr-mobile__tab"
                  data-on={item.key === tab ? "true" : "false"}
                  aria-current={item.key === tab ? "page" : undefined}
                  onClick={() => goTab(item.key)}
                >
                  <Icon name={item.icon} size={21} />
                  {t(item.labelKey)}
                </button>
              ))}
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
        </DeviceFrame>
      </div>

      <p className="scr-mobile__note">
        <Icon name="info" size={17} className="scr-mobile__noteicon" />
        <span>{t("screensB.mobile.note")}</span>
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
  const { t, number } = useI18n();
  const next = UPCOMING_VISITS[0];
  const nextSvc = data.getService(next.svc);
  const nextStaff = data.getStaffForService(next.svc)[0];
  const pct = Math.min(100, Math.round((points / POINTS_GOAL) * 100));
  const toGo = POINTS_GOAL - points;
  /* "$25 reward" — the figure is whole dollars in the seed so the symbol
   * lands where the reader's locale puts it. */
  const rewardLabel = t(REWARD_LABEL_KEY, { amount: wholeMoney(REWARD_AMOUNT) });
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
            <span className="scr-mobile__nextlabel">
              {t("screensB.mobile.nextVisit")}
            </span>
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
            {nextStaff?.name ?? t("screensB.common.firstAvailable")}
          </span>
        </div>
        <div className="scr-mobile__nextactions">
          <button
            type="button"
            className="scr-mobile__btn scr-mobile__btn--accent"
            onClick={() => onTab("visits")}
          >
            {t("screensB.mobile.manage")}
          </button>
          <button
            type="button"
            className="scr-mobile__btn scr-mobile__btn--outline"
            onClick={() => toast(t("screensB.common.toastMaps"), "warn")}
          >
            {t("screensB.mobile.directions")}
          </button>
        </div>
      </div>

      <div className="scr-mobile__rail">
        {QUICK_CHIPS.map((q) => (
          <button
            key={q.labelKey}
            type="button"
            className="scr-mobile__quick"
            onClick={() =>
              q.tab
                ? onTab(q.tab)
                : toast(
                    t("screensB.common.demoOnly", { label: t(q.labelKey) }),
                    "warn",
                  )
            }
          >
            <Icon name={q.icon} size={15} className="scr-mobile__quickicon" />
            {t(q.labelKey)}
          </button>
        ))}
      </div>

      <div>
        <div className="scr-mobile__sechead">
          <span className="scr-mobile__sectitle">
            {t("screensB.mobile.bookAgain")}
          </span>
          <button
            type="button"
            className="scr-mobile__link"
            onClick={() => onTab("book")}
          >
            {t("screensB.common.seeAll")}
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
                  {t("screensB.mobile.durPrice", {
                    duration: durationLabel(s.dur),
                    price: money(s.price),
                  })}
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
            <span className="bk-mono scr-mobile__pointsnum">
              {number(points)}
            </span>
            <span className="scr-mobile__pointsword">
              {t("screensB.common.pointsUnit", {}, points)}
            </span>
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
              ? t(
                  "screensB.mobile.pointsGoal",
                  { count: number(toGo), reward: rewardLabel },
                  toGo,
                )
              : t("screensB.mobile.pointsReady", { reward: rewardLabel })}
          </span>
        </span>
      </button>

      <button
        type="button"
        className="scr-mobile__journal"
        onClick={() => toast(t("screensB.mobile.toastJournal"), "warn")}
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
            {t(JOURNAL_TEASER.kickerKey, {
              category: journalCategoryLabel(
                t,
                JOURNAL_TEASER.cat as JournalCategory,
              ),
            })}
          </span>
          <span className="scr-mobile__journaltitle">
            {JOURNAL_TEASER.title}
          </span>
          <span className="scr-mobile__journalby">
            {t("screensB.post.byline", {
              date: data.getStaffMember(JOURNAL_TEASER.author)?.name ?? "",
              read: journalReadLabel(t, JOURNAL_TEASER.readMin),
            })}
          </span>
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
  const { t, number } = useI18n();

  if (!svc) {
    const chips: { value: CategoryFilter; label: string }[] = [
      { value: "all", label: t("screensB.common.all") },
      ...data.getCategories().map((c) => ({ value: c.slug, label: t(c.nameKey) })),
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
                  {t("screensB.mobile.durStaff", {
                    duration: durationLabel(s.dur),
                    staff: data.getStaffNames(s.id),
                  })}
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
        {t("screensB.mobile.allServices")}
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
            {t("screensB.mobile.durWithStaff", {
              duration: durationLabel(svc.dur),
              staff: data.getStaffNames(svc.id),
            })}
          </span>
        </span>
        <span className="bk-mono scr-mobile__pickedprice">{money(svc.price)}</span>
      </div>

      <span className="scr-mobile__label">{t("screensB.mobile.pickDay")}</span>
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
            <span className="scr-mobile__daydow">{weekdayName(d.getDay(), "short")}</span>
            <span className="bk-mono scr-mobile__daynum">
              {number(d.getDate())}
            </span>
          </button>
        ))}
      </div>

      <span className="scr-mobile__label">{t("screensB.mobile.pickTime")}</span>
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
              onClick={() =>
                open ? onTime(m) : toast(t("screensB.mobile.toastTaken"), "warn")
              }
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
  const t = useT();
  const upcoming = visitTab === "upcoming";
  /* The comp hardcoded "Tue, Jul 28" in three places; upcoming visits are
   * pinned to the rolling week instead so the demo never shows a past date.
   * Past visits keep their written dates — they are history, not a schedule. */
  const rows = upcoming
    ? UPCOMING_VISITS.map((v) => ({
        code: v.code,
        svc: v.svc,
        price: v.price,
        when: t("screensB.mobile.dateTime", {
          date: formatShortDate(week[v.dayIdx] ?? week[0]),
          time: minutesToTime(v.time),
        }),
      }))
    : PAST_VISITS.map((v) => ({
        code: v.code,
        svc: v.svc,
        price: v.price,
        when: formatMediumISO(v.dateISO),
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
            {t(
              v === "upcoming"
                ? "screensB.mobile.upcoming"
                : "screensB.mobile.past",
            )}
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
                    {t("screensB.mobile.whenWho", {
                      when: v.when,
                      who: staff?.name ?? t("screensB.common.firstAvailable"),
                    })}
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
                  {t(
                    upcoming
                      ? "screensB.common.reschedule"
                      : "screensB.mobile.bookAgain",
                  )}
                </button>
                <button
                  type="button"
                  className="scr-mobile__btn scr-mobile__btn--quiet"
                  onClick={() =>
                    toast(
                      t(
                        upcoming
                          ? "screensB.mobile.toastCancelled"
                          : "screensB.mobile.toastReceipt",
                      ),
                      "warn",
                    )
                  }
                >
                  {t(
                    upcoming
                      ? "screensB.common.cancel"
                      : "screensB.common.receipt",
                  )}
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
  const t = useT();

  /** The copy button's accessible name flips with its state. */
  const codeLabel = (code: string, on: boolean): string =>
    t(on ? "screensB.common.codeCopied" : "screensB.common.copyCode", { code });

  return (
    <div className="scr-mobile__pane">
      <div className="scr-mobile__feature">
        <span className="scr-mobile__featends">
          {t("screensB.offers.ends", {
            date: formatMediumISO(FEATURED_OFFER.endsISO),
          })}
        </span>
        <div className="scr-mobile__feattitle">{FEATURED_OFFER.title}</div>
        <p className="scr-mobile__featblurb">{FEATURED_OFFER.blurb}</p>
        <button
          type="button"
          className="bk-mono scr-mobile__featcode"
          onClick={() => onCopy(FEATURED_OFFER.code)}
          aria-label={codeLabel(
            FEATURED_OFFER.code,
            copied === FEATURED_OFFER.code,
          )}
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
                aria-label={codeLabel(o.code, on)}
              >
                <Icon name={on ? "check" : "copy"} size={14} />
                {o.code}
              </button>
              {/* The comp labelled all four "Book"; the offer title goes back
                  into the accessible name so they stay distinguishable. */}
              <button
                type="button"
                className="scr-mobile__btn scr-mobile__btn--accent scr-mobile__offerbook"
                aria-label={t("screensB.common.bookNamed", { name: o.title })}
                onClick={() => onPick(o.svc)}
              >
                {t("screensB.common.book")}
              </button>
            </div>
            <span className="scr-mobile__offerends">
              {t("screensB.offers.ends", {
                date: formatMediumISO(o.endsISO),
              })}
            </span>
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
  const { t, number } = useI18n();

  const toggles: {
    key: string;
    icon: string;
    labelKey: MessageKey;
    on: boolean;
    act: () => void;
  }[] = [
    {
      key: "push",
      icon: "bell",
      labelKey: "screensB.mobile.pushNotifications",
      on: push,
      act: onPush,
    },
    {
      key: "theme",
      icon: "moon",
      labelKey: "screensB.mobile.darkAppearance",
      on: dark,
      act: onDark,
    },
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
          {t("screensB.mobile.circle")}
        </span>
      </div>

      <div className="scr-mobile__stats">
        <div className="scr-mobile__stat">
          <span className="bk-mono scr-mobile__statval">{number(points)}</span>
          <span className="scr-mobile__statlabel">
            {t("screensB.mobile.statPoints")}
          </span>
        </div>
        {YOU_STATS.map((s) => (
          <div className="scr-mobile__stat" key={s.labelKey}>
            <span className="bk-mono scr-mobile__statval">{number(s.value)}</span>
            <span className="scr-mobile__statlabel">
              {t(
                s.labelKey,
                s.year === undefined
                  ? undefined
                  : { year: number(s.year, { useGrouping: false }) },
              )}
            </span>
          </div>
        ))}
      </div>

      <span className="scr-mobile__label">
        {t("screensB.mobile.preferences")}
      </span>
      <div className="scr-mobile__group">
        {toggles.map((row) => (
          <button
            key={row.key}
            type="button"
            role="switch"
            aria-checked={row.on}
            className="scr-mobile__row"
            onClick={row.act}
          >
            <span className="scr-mobile__rowicon">
              <Icon name={row.icon} size={15} />
            </span>
            <span className="scr-mobile__rowlabel">{t(row.labelKey)}</span>
            <span className="scr-mobile__track" data-on={row.on ? "true" : "false"}>
              <span className="scr-mobile__knob" />
            </span>
          </button>
        ))}
      </div>

      <span className="scr-mobile__label">{t("screensB.mobile.account")}</span>
      <div className="scr-mobile__group">
        {ACCOUNT_ROWS.map((r) => {
          const label = t(r.labelKey);
          return (
          <button
            key={r.labelKey}
            type="button"
            className="scr-mobile__row"
            onClick={() =>
              toast(t("screensB.common.demoOnly", { label }), "warn")
            }
          >
            <span className="scr-mobile__rowicon">
              <Icon name={r.icon} size={15} />
            </span>
            <span className="scr-mobile__rowlabel">{label}</span>
            <span className="scr-mobile__rowdetail">{detailLabel(t, number, r)}</span>
            <Icon name="chevron-right" size={16} className="scr-mobile__rowchev" />
          </button>
          );
        })}
      </div>

      <button
        type="button"
        className="scr-mobile__signout"
        onClick={() => toast(t("screensB.mobile.toastSignedOut"), "warn")}
      >
        {t("screensB.mobile.signOut")}
      </button>
      <div className="scr-mobile__version">
        {t("screensB.mobile.version", {
          brand: BRAND.name,
          version: APP_VERSION,
        })}
      </div>
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
  const t: TFunction = useT();
  const staff = data.getStaffForService(svc.id)[0];
  const rows = [
    {
      icon: "calendar",
      label: t("screensB.common.when"),
      value: formatShortDate(date),
    },
    {
      icon: "clock",
      label: t("screensB.common.time"),
      value: t("screensB.common.timeDur", {
        time: minutesToTime(time),
        duration: durationLabel(svc.dur),
      }),
    },
    {
      icon: "credit-card",
      label: t("screensB.common.total"),
      value: money(svc.price),
    },
  ];

  return (
    <div className="scr-mobile__scrim">
      <div
        className="scr-mobile__sheet"
        role="dialog"
        aria-label={t("screensB.mobile.booked")}
      >
        <span className="scr-mobile__sheeticon">
          <Icon name="check" size={30} />
        </span>
        <div className="scr-mobile__sheettitle">
          {t("screensB.mobile.booked")}
        </div>
        <p className="scr-mobile__sheetsub">
          {t("screensB.mobile.sheetSub", {
            service: svc.name,
            staff: staff?.name ?? t("screensB.mobile.firstSpecialistFree"),
          })}
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
          {t("screensB.mobile.seeMyVisits")}
        </button>
      </div>
    </div>
  );
}
