/*
 * OUR SPECIALISTS (view: 'staff').
 *
 * One view, two modes: the four-card directory and a single profile. Which one
 * renders is derived from the `staffId` store field rather than a second view
 * id, so "All specialists" is a state change and the dock still has one chip.
 */

import {
  Avatar,
  BackLink,
  Button,
  Icon,
  PlaceholderTile,
  StarBar,
} from "../components/index.ts";
import { STUDIO_REVIEWS } from "../data/screens/reviews.ts";
import { nextFreeLabel, staffProfile } from "../data/screens/staff.ts";
import { data } from "../data/source.ts";
import type { StaffMember, Weekday } from "../data/types.ts";
import { useI18n, useT } from "../i18n/index.tsx";
import {
  formatNumber,
  minutesToTime,
  money,
  relativeAgo,
  weekdayName,
} from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-staff.css";

/** Monday-first, the way a rota is read. `Date.getDay()` puts Sunday at 0. */
const WEEK_ORDER: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export default function Staff() {
  const staffId = useStore((s) => s.staffId);
  const selected = data.getStaffMember(staffId);

  return (
    <section className="bk-screen bk-page scr-staff">
      {selected ? <Profile staff={selected} /> : <Directory />}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The four-card directory
 * ------------------------------------------------------------------ */

function Directory() {
  const t = useT();
  const set = useStore((s) => s.set);

  return (
    <>
      <div className="scr-staff__head">
        <h1 className="bk-h1">{t("screensB.staff.dirTitle")}</h1>
        <p className="bk-sub scr-staff__lede">{t("screensB.staff.dirLede")}</p>
      </div>

      <div className="scr-staff__grid">
        {data.getStaff().map((s) => {
          const x = staffProfile(s.id);
          return (
            <button
              key={s.id}
              type="button"
              className="bk-card scr-staff__card"
              onClick={() => set({ staffId: s.id })}
            >
              <PlaceholderTile
                tint={s.tint}
                icon={x.icon}
                iconSize={48}
                minHeight={150}
                filename={x.fname}
                className="scr-staff__cardtile"
              />
              <span className="scr-staff__cardbody">
                <span className="scr-staff__cardhead">
                  <Avatar
                    initials={s.initials}
                    tint={s.tint}
                    size={46}
                    fontSize={15}
                  />
                  <span className="scr-staff__cardid">
                    <span className="scr-staff__cardname">{s.name}</span>
                    <span className="scr-staff__cardrole">{s.role}</span>
                  </span>
                  <span className="scr-staff__cardrating">
                    <Icon name="star" size={13} />
                    {formatNumber(x.rating, { minimumFractionDigits: 1 })}
                  </span>
                </span>

                <span className="scr-staff__cardbio">{s.bio}</span>

                <span className="scr-staff__tags">
                  {x.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="scr-staff__tag">
                      {tag}
                    </span>
                  ))}
                </span>

                <span className="scr-staff__cardfoot">
                  <span className="scr-staff__next">
                    {t("screensB.staff.nextFree", { when: nextFreeLabel(t, x) })}
                  </span>
                  <span className="scr-staff__view">
                    {t("screensB.staff.viewProfile")}
                    <Icon name="arrow-right" size={14} />
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * One specialist's profile
 * ------------------------------------------------------------------ */

interface ProfileProps {
  staff: StaffMember;
}

function Profile({ staff }: ProfileProps) {
  const { t, number } = useI18n();
  const set = useStore((s) => s.set);
  const go = useStore((s) => s.go);
  const startBooking = useStore((s) => s.startBooking);

  const x = staffProfile(staff.id);
  const quotes = STUDIO_REVIEWS.filter((r) => r.staff === staff.id).slice(0, 2);
  const services = data
    .getServices()
    .filter((s) => s.staff.includes(staff.id))
    .slice(0, 5);
  const years = Math.max(1, new Date().getFullYear() - x.since);

  /*
   * The comp's "Book with X" wrote the staff id straight after `startBooking`,
   * which `selectSvc` then clears the moment a service is picked — the
   * specialist never reached the draft. Filtering step 0 to this person's
   * category carries the intent through the whole flow instead, and every
   * service in that category is one they perform.
   */
  const book = () => {
    startBooking(null);
    set({ bCat: staff.cat });
  };

  return (
    <>
      <BackLink onClick={() => set({ staffId: null })}>
        {t("screensB.staff.allSpecialists")}
      </BackLink>

      <PlaceholderTile
        tint={staff.tint}
        icon={x.icon}
        iconSize={62}
        minHeight={260}
        angle="150deg"
        radius={22}
        bordered
        borderBlockEnd={false}
        filename={x.fname}
      />

      <div className="scr-staff__cols">
        <div className="scr-staff__main">
          <div className="scr-staff__who">
            <Avatar
              initials={staff.initials}
              tint={staff.tint}
              size={62}
              fontSize={20}
            />
            <div className="scr-staff__whotext">
              <h1 className="bk-h1 scr-staff__name">{staff.name}</h1>
              <div className="scr-staff__since">
                {t("screensB.staff.since", {
                  role: staff.role,
                  year: x.since,
                })}
              </div>
            </div>
          </div>

          <p className="scr-staff__long">{x.long || staff.bio}</p>

          <h2 className="scr-staff__section">{t("screensB.staff.knownFor")}</h2>
          <div className="scr-staff__known">
            {x.tags.map((tag) => (
              <span key={tag} className="scr-staff__knowntag">
                <Icon name="check" size={14} />
                {tag}
              </span>
            ))}
          </div>

          <h2 className="scr-staff__section">
            {t("screensB.staff.guestsSay")}
          </h2>
          <div className="scr-staff__quotes">
            {quotes.map((r) => (
              <article key={r.quote} className="bk-panel scr-staff__quote">
                <header className="scr-staff__quotehead">
                  <Avatar
                    initials={r.initials}
                    tint={r.tint}
                    size={40}
                    fontSize={13}
                  />
                  <span className="scr-staff__quotewho">
                    <span className="scr-staff__quotename">{r.name}</span>
                    <span className="scr-staff__quotemeta">
                      {t("screensB.staff.quoteMeta", {
                        service: r.svc,
                        date: relativeAgo(r.ago, r.agoUnit),
                      })}
                    </span>
                  </span>
                  <StarBar value={r.rating} size={13} gap={1} />
                </header>
                <p className="scr-staff__quotetext">{`“${r.quote}”`}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="scr-staff__side">
          <div className="bk-panel scr-staff__cta">
            <div className="scr-staff__stats">
              <Stat
                value={number(x.rating, { minimumFractionDigits: 1 })}
                label={t("screensB.staff.statRating")}
              />
              <Stat
                value={number(x.reviews)}
                label={t("screensB.staff.statReviews")}
              />
              {/* `Intl` names the unit, so "yrs" needs no message of its own. */}
              <Stat
                value={number(years, {
                  style: "unit",
                  unit: "year",
                  unitDisplay: "short",
                })}
                label={t("screensB.staff.statYears")}
              />
            </div>
            <Button
              icon="calendar-plus"
              iconSize={17}
              size="lg"
              full
              onClick={book}
            >
              {t("screensB.common.bookWith", { name: staff.name })}
            </Button>
            <Button variant="ghost" full onClick={() => go("waitlist")}>
              {t("screensB.staff.joinWaitlist")}
            </Button>
          </div>

          <div className="bk-panel scr-staff__hours">
            <div className="bk-eyebrow scr-staff__hourshead">
              {t("screensB.staff.usualWeek")}
            </div>
            {WEEK_ORDER.map((d) => {
              const wins = staff.hours[d] ?? [];
              const open = wins.length > 0;
              return (
                <div key={d} className="scr-staff__hourrow" data-open={open}>
                  <span className="scr-staff__hourday">{weekdayName(d)}</span>
                  <span className="scr-staff__hourval bk-mono">
                    {open
                      ? wins
                          .map(([from, to]) =>
                            t("screensB.staff.hourRange", {
                              from: minutesToTime(from),
                              to: minutesToTime(to),
                            }),
                          )
                          .join(", ")
                      : t("screensB.staff.off")}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="scr-staff__svcs">
            <span className="scr-staff__svcstitle">
              {t("screensB.staff.servicesOffered", { name: staff.name })}
            </span>
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                className="bk-gi scr-staff__svc"
                onClick={() => startBooking(s.id)}
              >
                <Icon name={s.icon} size={16} className="scr-staff__svcicon" />
                <span className="scr-staff__svcname">{s.name}</span>
                <span className="scr-staff__svcprice bk-mono">
                  {money(s.price)}
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="scr-staff__stat">
      <span className="scr-staff__statval bk-mono">{value}</span>
      <span className="scr-staff__statlabel">{label}</span>
    </div>
  );
}
