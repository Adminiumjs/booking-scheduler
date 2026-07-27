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
import { SCROLL_OFFSET, useStore } from "../state/store.ts";
import "../styles/screen-home.css";

export default function Home() {
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

  return (
    <main className="bk-screen bk-home">
      {/* ---------------- A. Hero ---------------- */}
      <section className="bk-home-section bk-home-hero">
        <div className="bk-home-hero__grid">
          <div className="bk-home-hero__copy">
            <span className="bk-home-eyebrow">
              <Icon name="sparkles" size={14} />
              Boutique beauty &amp; wellness
            </span>
            <h1 className="bk-home-hero__title">
              Feel like the
              <br />
              best version of you.
            </h1>
            <p className="bk-home-hero__lede">
              Hair, spa, nails, and movement under one calm roof. Book a chair or a
              treatment room in a few taps — no phone tag, no account needed.
            </p>
            <div className="bk-home-hero__actions">
              <Button
                className="bk-home-cta"
                icon="calendar-plus"
                iconSize={17}
                onClick={() => startBooking(null)}
              >
                Book now
              </Button>
              <Button
                className="bk-home-cta bk-home-cta--ghost"
                variant="ghost"
                iconEnd="arrow-right"
                onClick={() => go("services")}
              >
                View services
              </Button>
            </div>
            <div className="bk-home-trust">
              <span className="bk-home-trust__item">
                <Icon name="clock" size={15} color="var(--accent)" />
                Same-week openings
              </span>
              <span className="bk-home-trust__item">
                <Icon name="map-pin" size={15} color="var(--accent)" />
                Downtown studio
              </span>
              <span className="bk-home-trust__item">
                <Icon name="heart-handshake" size={15} color="var(--accent)" />
                Walk-ins welcome
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
            <h2 className="bk-h2">Popular services</h2>
            <p className="bk-home-sub">
              A little something from every corner of the studio.
            </p>
          </div>
          <button
            type="button"
            className="bk-nav bk-home-seeall"
            onClick={() => go("services")}
          >
            See all
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
              Meet the team
            </h2>
            <p className="bk-home-sub">Four specialists, one very tidy calendar.</p>
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
            <h2 className="bk-h2">Loved by regulars</h2>
            <p className="bk-home-sub">
              What guests say once they're back in the real world.
            </p>
          </div>
          <div className="bk-home-rating">
            <span className="bk-mono bk-home-rating__avg">{summary.averageLabel}</span>
            <div>
              <StarBar
                value={summary.average}
                size={16}
                gap={2}
                label={`${summary.averageLabel} out of 5`}
              />
              <div className="bk-home-rating__caption">from {summary.countLabel}</div>
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
                Weekly hours
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
                      {h.day}
                      {isToday ? (
                        <span className="bk-home-today-pill">Today</span>
                      ) : null}
                    </span>
                    <span
                      className="bk-mono bk-home-hours-val"
                      data-today={isToday ? "true" : "false"}
                      data-closed={h.closed ? "true" : "false"}
                    >
                      {h.value}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="bk-home-hours-note">
              <Icon name="info" size={14} />
              Individual specialists keep their own hours — you'll see live openings when
              you book.
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
                  {loc.transit}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
