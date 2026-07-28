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
  RATING_WORDS,
  REVIEW_FILTERS,
  STUDIO_REVIEWS,
} from "../data/screens/reviews.ts";
import type { StudioReview } from "../data/screens/reviews.ts";
import { data } from "../data/source.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-reviews.css";

/** The guest's own review, appended to the seed once they post. */
function ownReview(stars: number, text: string): StudioReview {
  return {
    name: "Ava R.",
    initials: "AR",
    tint: "#b07d9a",
    rating: stars,
    svc: "Gloss & Tone",
    staff: "elin",
    date: "just now",
    helpful: 0,
    quote: text || "Lovely as always.",
    reply: "",
    replyBy: "",
    replyInitials: "",
  };
}

export default function Reviews() {
  const rvFilter = useStore((s) => s.rvFilter);
  const rvStars = useStore((s) => s.rvStars);
  const rvText = useStore((s) => s.rvText);
  const rvSent = useStore((s) => s.rvSent);
  const rvHelpful = useStore((s) => s.rvHelpful);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const all = useMemo(
    () =>
      rvSent
        ? [ownReview(rvStars, rvText), ...STUDIO_REVIEWS]
        : STUDIO_REVIEWS.slice(),
    [rvSent, rvStars, rvText],
  );

  const average = all.reduce((sum, r) => sum + r.rating, 0) / all.length;
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
      showToast("Add a line or two first", "warn");
      return;
    }
    set({ rvSent: true });
    showToast("Review posted · demo only", "ok");
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
          <div className="scr-reviews__avg bk-mono">{average.toFixed(1)}</div>
          <div className="scr-reviews__avgstars">
            <StarBar
              value={average}
              size={20}
              gap={3}
              label={`${average.toFixed(1)} out of 5`}
            />
          </div>
          <div className="scr-reviews__total">
            {all.length} reviews · {data.getStaff().length} specialists
          </div>
        </div>

        <div className="scr-reviews__dist">
          {[5, 4, 3, 2, 1].map((n, i) => (
            <div key={n} className="scr-reviews__distrow">
              <span className="scr-reviews__distlabel">{n}★</span>
              <span className="scr-reviews__disttrack">
                <span
                  className="scr-reviews__distbar"
                  style={{
                    inlineSize: `${Math.round((counts[i] / all.length) * 100)}%`,
                  }}
                />
              </span>
              <span className="scr-reviews__distcount bk-mono">
                {counts[i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ---- compose ---- */}
      <div className="scr-reviews__compose">
        <span className="scr-reviews__composetitle">
          {rvSent ? "Your review is up" : "Been in recently? Tell us how it went"}
        </span>

        {rvSent ? (
          <div className="scr-reviews__thanks">
            <Icon name="check-circle-2" size={20} />
            <span>
              Thank you — your review is live at the top of the list. You can
              edit it for the next 24 hours.
            </span>
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
                  aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
                  onClick={() => set({ rvStars: n })}
                >
                  ★
                </button>
              ))}
              <span className="scr-reviews__starword">
                {RATING_WORDS[rvStars] ?? ""}
              </span>
            </div>

            <TextArea
              value={rvText}
              onChange={(v) => set({ rvText: v })}
              placeholder="What was the visit like? Anything the next guest should know?"
              rows={4}
              ariaLabel="Your review"
              className="scr-reviews__textarea"
            />

            <div className="scr-reviews__composefoot">
              <span className="scr-reviews__posting">
                Posting as Ava R. · your last visit was Jul 14
              </span>
              <button
                type="button"
                className="bk-btn scr-reviews__post"
                onClick={submit}
              >
                Post review
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
              label={f.label}
              active={rvFilter === f.id}
              onClick={() => set({ rvFilter: f.id })}
            />
          ))}
        </div>
        <span className="scr-reviews__showing">
          {filtered.length} of {all.length} shown
        </span>
      </div>

      {/* ---- the list ---- */}
      <div className="scr-reviews__list">
        {filtered.map((r, i) => {
          const key = `${r.name}${r.date}`;
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
                    {r.svc} · {staff ? `with ${staff.name}` : "studio"} ·{" "}
                    {r.date}
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
                      {r.replyBy} replied
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
                  Helpful · {r.helpful + (bumped ? 1 : 0)}
                </button>
                <button
                  type="button"
                  className="bk-nav scr-reviews__report"
                  onClick={() => showToast("Flagged for the team to read", "ok")}
                >
                  Report
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
