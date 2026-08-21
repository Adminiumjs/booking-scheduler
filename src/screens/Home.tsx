/*
 * HOME (spec §3.1) — hero, popular services, team strip, reviews band,
 * hours + location, all inside 1180px sections.
 *
 * The two anchored sections ("team" / "visit") are the scroll targets the
 * header and mobile sheet jump to via `goHomeScroll(anchor)`; this screen
 * performs the scroll and then clears the flag.
 */

import { useEffect, useRef } from "react";

import {
  Button,
  Card,
  Icon,
  PlaceholderTile,
  ReviewCard,
  ServiceCard,
  StaffTile,
  StarBar,
} from "../components/index.ts";
import { data } from "../data/source.ts";
import { useI18n } from "../i18n/index.tsx";
import { durationLabel, hoursLabel, weekdayName } from "../lib/format.ts";
import { SCROLL_OFFSET, useStore } from "../state/store.ts";
import "../styles/screen-home.css";

/** The rating scale the star bar draws, and the one the label quotes. */
const STAR_MAX = 5;

export default function Home() {
  const { t, number } = useI18n();
  const go = useStore((s) => s.go);
  const startBooking = useStore((s) => s.startBooking);
  const setSCat = useStore((s) => s.setSCat);
  const homeScroll = useStore((s) => s.homeScroll);
  const clearHomeScroll = useStore((s) => s.clearHomeScroll);

  const teamRef = useRef<HTMLElement | null>(null);
  const visitRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!homeScroll) return;
    const el = homeScroll === "team" ? teamRef.current : visitRef.current;
    if (el) {
      /* R10 — honour prefers-reduced-motion; the options bag beats the CSS. */
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({
        top: Math.max(0, el.offsetTop - SCROLL_OFFSET),
        behavior: reduce ? "auto" : "smooth",
      });
    }
    clearHomeScroll();
  }, [homeScroll, clearHomeScroll]);

  const popular = data.getPopularServices();
  const team = data.getStaff();
  const reviews = data.getReviews();
  const summary = data.getReviewSummary();
  const hours = data.getStudioHours();
  const todayIdx = data.getTodayHoursIndex();
  const loc = data.getLocation();

  /* One decimal, in the reader's digits and with their decimal separator —
   * `4.9` is `4,9` in de-DE and `٤٫٩` in ar-EG. */
  const averageLabel = number(summary.average, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <main className="bk-screen bk-home">
      {/* ---------------- A. Hero ---------------- */}
      <section className="bk-home-section bk-home-hero">
        <div className="bk-home-hero__grid">
          <div className="bk-home-hero__copy">
            <span className="bk-home-eyebrow">
              <Icon name="sparkles" size={14} />
              {t("screensB.home.eyebrow")}
            </span>
            {/*
             * The comp hard-broke this headline after "the". A forced <br/>
             * only ever lands right for one language, so the line is one
             * message and wraps where the box says it should.
             */}
            <h1 className="bk-home-hero__title">{t("screensB.home.title")}</h1>
            <p className="bk-home-hero__lede">{t("screensB.home.lede")}</p>
            <div className="bk-home-hero__actions">
              <Button
                className="bk-home-cta"
                icon="calendar-plus"
                iconSize={17}
                onClick={() => startBooking(null)}
              >
                {t("screensB.home.bookNow")}
              </Button>
              <Button
                className="bk-home-cta bk-home-cta--ghost"
                variant="ghost"
                iconEnd="arrow-right"
                onClick={() => go("services")}
              >
                {t("screensB.home.viewServices")}
              </Button>
            </div>
            <div className="bk-home-trust">
              <span className="bk-home-trust__item">
                <Icon name="clock" size={15} color="var(--accent)" />
                {t("screensB.home.trustOpenings")}
              </span>
              <span className="bk-home-trust__item">
                <Icon name="map-pin" size={15} color="var(--accent)" />
                {t("screensB.home.trustDowntown")}
              </span>
              <span className="bk-home-trust__item">
                <Icon name="heart-handshake" size={15} color="var(--accent)" />
                {t("screensB.home.trustWalkins")}
              </span>
            </div>
          </div>

          <PlaceholderTile
            className="bk-home-hero__tile"
            tint="#0d9488"
            icon="sparkles"
            iconSize={72}
            minHeight={300}
            angle="150deg"
            filename="studio_hero.jpg"
            imgWidth={1400}
            radius={22}
            bordered
            borderBlockEnd={false}
          />
        </div>
      </section>

      {/* ---------------- B. Popular services ---------------- */}
      <section className="bk-home-section">
        <div className="bk-home-head">
          <div>
            <h2 className="bk-h2">{t("screensB.home.popularTitle")}</h2>
            <p className="bk-home-sub">{t("screensB.home.popularSub")}</p>
          </div>
          <button
            type="button"
            className="bk-nav bk-home-seeall"
            onClick={() => go("services")}
          >
            {t("screensB.common.seeAll")}
            <Icon name="arrow-right" size={15} />
          </button>
        </div>
        <div className="bk-home-grid bk-home-grid--services">
          {popular.map((s) => (
            <ServiceCard key={s.id} service={s} variant="preview" onBook={startBooking} />
          ))}
        </div>
      </section>

      {/* ---------------- C. Meet the team ---------------- */}
      <section
        className="bk-home-section"
        ref={teamRef}
        aria-labelledby="bk-home-team-title"
      >
        <div className="bk-home-head bk-home-head--stack">
          <div>
            <h2 className="bk-h2" id="bk-home-team-title">
              {t("screensB.home.teamTitle")}
            </h2>
            <p className="bk-home-sub">{t("screensB.home.teamSub")}</p>
          </div>
        </div>
        <div className="bk-home-grid bk-home-grid--team">
          {team.map((m) => (
            <StaffTile
              key={m.id}
              staff={m}
              onClick={(picked) => {
                setSCat(picked.cat);
                go("services");
              }}
            />
          ))}
        </div>
      </section>

      {/* ---------------- D. Loved by regulars ---------------- */}
      <section className="bk-home-section">
        <div className="bk-home-head bk-home-head--wrap">
          <div>
            <h2 className="bk-h2">{t("screensB.home.lovedTitle")}</h2>
            <p className="bk-home-sub">{t("screensB.home.lovedSub")}</p>
          </div>
          <div className="bk-home-rating">
            <span className="bk-mono bk-home-rating__avg">{averageLabel}</span>
            <div>
              <StarBar
                value={summary.average}
                size={16}
                gap={2}
                label={t("chrome.stars.rating", {
                  value: averageLabel,
                  max: number(STAR_MAX),
                })}
              />
              <div className="bk-home-rating__caption">
                {t("screensB.home.ratingFrom", { count: number(summary.count) }, summary.count)}
              </div>
            </div>
          </div>
        </div>
        <div className="bk-home-grid bk-home-grid--reviews">
          {reviews.map((r) => (
            <ReviewCard key={r.name} review={r} />
          ))}
        </div>
      </section>

      {/* ---------------- E. Visit us ---------------- */}
      <section
        className="bk-home-section bk-home-visit"
        ref={visitRef}
        aria-labelledby="bk-home-hours-title"
      >
        <div className="bk-home-visit__grid">
          <Card radius={20} padding="clamp(20px,3vw,28px)">
            <div className="bk-home-cardhead">
              <Icon name="clock" size={19} color="var(--accent)" />
              <h2 className="bk-home-cardtitle" id="bk-home-hours-title">
                {t("screensB.home.hoursTitle")}
              </h2>
            </div>
            <div className="bk-home-hours">
              {hours.map((h, i) => {
                const isToday = i === todayIdx;
                return (
                  <div
                    key={h.day}
                    className="bk-home-hours-row"
                    data-today={isToday ? "true" : "false"}
                  >
                    <span className="bk-home-hours-day">
                      {weekdayName(h.day)}
                      {isToday ? (
                        <span className="bk-home-today-pill">
                          {t("chrome.day.today")}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className="bk-mono bk-home-hours-val"
                      data-today={isToday ? "true" : "false"}
                      data-closed={h.closed ? "true" : "false"}
                    >
                      {hoursLabel(h)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="bk-home-hours-note">
              <Icon name="info" size={14} />
              {t("screensB.home.hoursNote")}
            </p>
          </Card>

          <Card radius={20} clip className="bk-home-map">
            <PlaceholderTile
              tint="#6f8bb0"
              icon="map-pin"
              iconSize={52}
              minHeight={210}
              angle="120deg"
              filename="studio_map.jpg"
            />
            <div className="bk-home-map__body">
              <div className="bk-home-map__name">{loc.name}</div>
              <p className="bk-home-map__addr">
                {loc.addressLine1}
                <br />
                {loc.addressLine2}
              </p>
              <div className="bk-home-map__contacts">
                <span className="bk-home-trust__item">
                  <Icon name="phone" size={14} color="var(--accent)" />
                  <span className="bk-mono">{loc.phone}</span>
                </span>
                <span className="bk-home-trust__item">
                  <Icon name="train-front" size={14} color="var(--accent)" />
                  {t("data.location.transit", {
                    minutes: durationLabel(loc.transitMinutes),
                  })}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
