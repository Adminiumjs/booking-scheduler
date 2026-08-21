/*
 * REVIEWS & RATINGS (view: 'reviews').
 *
 * The average, the star distribution and the "N of M shown" caption are all
 * derived from the seed rather than written down, so a posted review moves
 * every number on the screen at once.
 */

import { useMemo } from "react";

import { Avatar, Chip, Icon, StarBar, TextArea } from "../components/index.ts";
import {
  RATING_WORD_KEYS,
  REVIEW_FILTERS,
  STUDIO_REVIEWS,
} from "../data/screens/reviews.ts";
import type { StudioReview } from "../data/screens/reviews.ts";
import { data } from "../data/source.ts";
import { useI18n } from "../i18n/index.tsx";
import { parseISO, relativeAgo } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-reviews.css";

/** The rating scale the bars draw against. */
const STAR_MAX = 5;

/** The demo guest's last visit — a seeded date, spelled the reader's way. */
const LAST_VISIT_ISO = "2026-07-14";

/** The guest's own review, appended to the seed once they post. */
function ownReview(stars: number, text: string): StudioReview {
  return {
    name: "Ava R.",
    initials: "AR",
    tint: "#b07d9a",
    rating: stars,
    svc: "Gloss & Tone",
    staff: "elin",
    /* Zero seconds ago — `numeric: 'auto'` renders that as "now" in every
     * locale, so the freshest review needs no message of its own. */
    ago: 0,
    agoUnit: "second",
    helpful: 0,
    /* Review prose is in-fiction demo content and stays English. */
    quote: text || "Lovely as always.",
    reply: "",
    replyBy: "",
    replyInitials: "",
  };
}

export default function Reviews() {
  const { t, number, date } = useI18n();
  const rvFilter = useStore((s) => s.rvFilter);
  const rvStars = useStore((s) => s.rvStars);
  const rvText = useStore((s) => s.rvText);
  const rvSent = useStore((s) => s.rvSent);
  const rvHelpful = useStore((s) => s.rvHelpful);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const justNow = t("screensB.reviews.justNow");
  const all = useMemo(
    () =>
      rvSent
        ? [ownReview(rvStars, rvText), ...STUDIO_REVIEWS]
        : STUDIO_REVIEWS.slice(),
    [rvSent, rvStars, rvText, justNow],
  );

  const average = all.reduce((sum, r) => sum + r.rating, 0) / all.length;
  const averageLabel = number(average, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const counts = [5, 4, 3, 2, 1].map(
    (n) => all.filter((r) => r.rating === n).length,
  );

  const filtered = all.filter((r) => {
    if (rvFilter === "all") return true;
    if (rvFilter === "replied") return Boolean(r.reply);
    if (rvFilter === "low") return r.rating <= 3;
    return r.rating === parseInt(rvFilter, 10);
  });

  const submit = () => {
    if (!rvText.trim()) {
      showToast(t("screensB.reviews.errEmpty"), "warn");
      return;
    }
    set({ rvSent: true });
    showToast(t("screensB.reviews.toastPosted"), "ok");
  };

  const toggleHelpful = (key: string) => {
    const on = (rvHelpful[key] ?? 0) > 0;
    set({ rvHelpful: { ...rvHelpful, [key]: on ? 0 : 1 } });
  };

  return (
    <section className="bk-screen bk-page scr-reviews">
      {/* ---- the summary card ---- */}
      <div className="bk-panel scr-reviews__summary">
        <div className="scr-reviews__score">
          <div className="scr-reviews__avg bk-mono">{averageLabel}</div>
          <div className="scr-reviews__avgstars">
            <StarBar
              value={average}
              size={20}
              gap={3}
              label={t("chrome.stars.rating", {
                value: averageLabel,
                max: number(STAR_MAX),
              })}
            />
          </div>
          <div className="scr-reviews__total">
            {t("screensB.reviews.total", {
              reviews: number(all.length),
              specialists: number(data.getStaff().length),
            })}
          </div>
        </div>

        <div className="scr-reviews__dist">
          {[5, 4, 3, 2, 1].map((n, i) => (
            <div key={n} className="scr-reviews__distrow">
              <span className="scr-reviews__distlabel">
                {t("screensB.reviews.starRow", { stars: number(n) })}
              </span>
              <span className="scr-reviews__disttrack">
                <span
                  className="scr-reviews__distbar"
                  style={{
                    inlineSize: `${Math.round((counts[i] / all.length) * 100)}%`,
                  }}
                />
              </span>
              <span className="scr-reviews__distcount bk-mono">
                {number(counts[i])}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ---- compose ---- */}
      <div className="scr-reviews__compose">
        <span className="scr-reviews__composetitle">
          {t(
            rvSent
              ? "screensB.reviews.composeSent"
              : "screensB.reviews.composeTitle",
          )}
        </span>

        {rvSent ? (
          <div className="scr-reviews__thanks">
            <Icon name="check-circle-2" size={20} />
            <span>{t("screensB.reviews.thanks")}</span>
          </div>
        ) : (
          <>
            <div className="scr-reviews__starpick">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="scr-reviews__star"
                  data-on={n <= rvStars}
                  aria-pressed={n === rvStars}
                  aria-label={t("screensB.reviews.starsAria", { count: number(n) }, n)}
                  onClick={() => set({ rvStars: n })}
                >
                  ★
                </button>
              ))}
              <span className="scr-reviews__starword">
                {RATING_WORD_KEYS[rvStars] ? t(RATING_WORD_KEYS[rvStars]) : ""}
              </span>
            </div>

            <TextArea
              value={rvText}
              onChange={(v) => set({ rvText: v })}
              placeholder={t("screensB.reviews.placeholder")}
              rows={4}
              ariaLabel={t("screensB.reviews.textareaLabel")}
              className="scr-reviews__textarea"
            />

            <div className="scr-reviews__composefoot">
              <span className="scr-reviews__posting">
                {t("screensB.reviews.postingAs", {
                  name: "Ava R.",
                  date: date(parseISO(LAST_VISIT_ISO), {
                    month: "short",
                    day: "numeric",
                  }),
                })}
              </span>
              <button
                type="button"
                className="bk-btn scr-reviews__post"
                onClick={submit}
              >
                {t("screensB.reviews.post")}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ---- filters ---- */}
      <div className="scr-reviews__filters">
        <div className="scr-reviews__chips">
          {REVIEW_FILTERS.map((f) => (
            <Chip
              key={f.id}
              label={t(f.labelKey, f.stars === undefined ? undefined : { count: number(f.stars) }, f.stars)}
              active={rvFilter === f.id}
              onClick={() => set({ rvFilter: f.id })}
            />
          ))}
        </div>
        <span className="scr-reviews__showing">
          {t("screensB.reviews.showing", {
            shown: number(filtered.length),
            total: number(all.length),
          })}
        </span>
      </div>

      {/* ---- the list ---- */}
      <div className="scr-reviews__list">
        {filtered.map((r, i) => {
          const when = relativeAgo(r.ago, r.agoUnit);
          const key = `${r.name}${r.ago}${r.agoUnit}`;
          const bumped = (rvHelpful[key] ?? 0) > 0;
          const staff = data.getStaffMember(r.staff);
          return (
            <article key={`${key}${i}`} className="bk-panel scr-reviews__card">
              <header className="scr-reviews__cardhead">
                <Avatar
                  initials={r.initials}
                  tint={r.tint}
                  size={44}
                  fontSize={15}
                />
                <span className="scr-reviews__who">
                  <span className="scr-reviews__name">{r.name}</span>
                  <span className="scr-reviews__meta">
                    {staff
                      ? t("screensB.reviews.metaStaff", {
                          service: r.svc,
                          staff: staff.name,
                          date: when,
                        })
                      : t("screensB.reviews.metaStudio", {
                          service: r.svc,
                          date: when,
                        })}
                  </span>
                </span>
                <StarBar value={r.rating} size={14} gap={1} />
              </header>

              <p className="scr-reviews__quote">{`“${r.quote}”`}</p>

              {r.reply ? (
                <div className="scr-reviews__reply">
                  <Avatar
                    initials={r.replyInitials}
                    tint={staff?.tint ?? "#0d9488"}
                    size={34}
                    fontSize={11}
                  />
                  <span className="scr-reviews__replytext">
                    <span className="scr-reviews__replyby">
                      {t("screensB.reviews.replyBy", { name: r.replyBy })}
                    </span>
                    <span className="scr-reviews__replybody">{r.reply}</span>
                  </span>
                </div>
              ) : null}

              <div className="scr-reviews__actions">
                <button
                  type="button"
                  className="scr-reviews__helpful"
                  data-on={bumped}
                  aria-pressed={bumped}
                  onClick={() => toggleHelpful(key)}
                >
                  <Icon name="thumbs-up" size={14} />
                  {t("screensB.reviews.helpful", {
                    n: number(r.helpful + (bumped ? 1 : 0)),
                  })}
                </button>
                <button
                  type="button"
                  className="bk-nav scr-reviews__report"
                  onClick={() => showToast(t("screensB.reviews.toastFlagged"), "ok")}
                >
                  {t("screensB.reviews.report")}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
