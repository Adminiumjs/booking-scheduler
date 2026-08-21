/*
 * REVIEWS (view: 'admin-reviews') — Admin comp, template lines 568–606.
 *
 * The moderation queue: three KPIs, a filter row, then every review with the
 * studio's reply underneath or a reply box in its place.
 *
 * A reply posted here is stored in `replied[id]` rather than mutating the
 * seed, so the KPI counts, the filter and the card all recompute from one
 * fact. The comp left the queue blank once the last reply went out — this adds
 * the caught-up empty state it was missing.
 */

import { useMemo } from "react";

import { Avatar, Chip, EmptyState, Icon, StarBar, TextArea } from "../components/index.ts";
import {
  ADMIN_REVIEWS,
  LOW_RATING,
  REPLY_AUTHOR,
  REVIEW_FILTERS,
} from "../data/screens/admin-reviews.ts";
import type { AdminReview } from "../data/screens/admin-reviews.ts";
import { useI18n, useT } from "../i18n/index.tsx";
import { relativeAgo } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-admin-reviews.css";

export default function AdminReviews() {
  const { t, number } = useI18n();
  const revFilter = useStore((s) => s.revFilter);
  const replied = useStore((s) => s.replied);
  const set = useStore((s) => s.set);

  /* One derived list: a posted reply overlays the seeded record, and the KPIs
   * and the filter both read off it. */
  const all = useMemo<AdminReview[]>(
    () =>
      ADMIN_REVIEWS.map((r) => {
        const posted = replied[r.id];
        return posted ? { ...r, reply: posted, replyBy: REPLY_AUTHOR } : { ...r };
      }),
    [replied],
  );

  const average = all.reduce((n, r) => n + r.rating, 0) / all.length;
  const kpis = [
    {
      label: t("screensA.reviews.kpiAvg"),
      value: number(average, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
      sub: t("screensA.reviews.kpiAvgSub", {}, all.length),
    },
    {
      label: t("screensA.reviews.kpiWaiting"),
      value: number(all.filter((r) => !r.reply).length),
      sub: t("screensA.reviews.kpiWaitingSub"),
    },
    {
      label: t("screensA.reviews.kpiLow"),
      value: number(all.filter((r) => r.rating < LOW_RATING).length),
      sub: t("screensA.reviews.kpiLowSub"),
    },
  ];

  const list = all.filter((r) => {
    if (revFilter === "all") return true;
    if (revFilter === "low") return r.rating < LOW_RATING;
    return !r.reply;
  });

  return (
    <div className="scr-admin-reviews">
      <div className="scr-admin-reviews__kpis">
        {kpis.map((k) => (
          <div key={k.label} className="scr-admin-reviews__kpi">
            <span className="scr-admin-reviews__kpilabel">{k.label}</span>
            <span className="scr-admin-reviews__kpival bk-mono">{k.value}</span>
            <span className="scr-admin-reviews__kpisub">{k.sub}</span>
          </div>
        ))}
      </div>

      <div className="scr-admin-reviews__filters">
        {REVIEW_FILTERS.map((f) => (
          <Chip
            key={f.id}
            label={t(f.labelKey, f.count === undefined ? undefined : { count: number(f.count) }, f.count)}
            active={revFilter === f.id}
            /* Closing any open draft: it belonged to a card that may be about
             * to disappear behind the new filter. */
            onClick={() => set({ revFilter: f.id, replyOpen: null, replyDraft: "" })}
          />
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon="check-circle-2"
          title={t("screensA.reviews.caughtUpTitle")}
          body={t("screensA.reviews.caughtUpBody")}
        />
      ) : (
        <div className="scr-admin-reviews__list">
          {list.map((r) => (
            <ReviewRow key={r.id} review={r} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * One review
 * ------------------------------------------------------------------ */

function ReviewRow({ review }: { review: AdminReview }) {
  const t = useT();
  const replyOpen = useStore((s) => s.replyOpen);
  const replyDraft = useStore((s) => s.replyDraft);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const open = replyOpen === review.id;

  const send = () => {
    if (!replyDraft.trim()) {
      showToast(t("screensA.reviews.writeFirst"), "warn");
      return;
    }
    /* Merged against the live store, so a reply posted while another card's
     * write is still in flight cannot drop it. */
    set({
      replied: { ...useStore.getState().replied, [review.id]: replyDraft },
      replyOpen: null,
      replyDraft: "",
    });
    showToast(t("screensA.reviews.posted"));
  };

  return (
    <article className="scr-admin-reviews__card">
      <div className="scr-admin-reviews__head">
        <Avatar
          initials={review.initials}
          tint={review.tint}
          size={34}
          fontSize={12}
          radius={999}
        />
        <span className="scr-admin-reviews__id">
          <span className="scr-admin-reviews__name">{review.name}</span>
          <span className="scr-admin-reviews__meta">
            {review.svc} · {review.staff} ·{" "}
            {relativeAgo(review.ago, review.agoUnit)}
          </span>
        </span>
        <StarBar
          value={review.rating}
          size={13}
          gap={1}
          label={t("screensA.reviews.stars", {
            rating: review.rating,
            max: 5,
          })}
        />
      </div>

      <p className="scr-admin-reviews__quote">“{review.quote}”</p>

      {review.reply ? (
        <div className="scr-admin-reviews__reply">
          <Icon
            name="corner-down-right"
            size={15}
            className="scr-admin-reviews__replyico"
          />
          <span className="scr-admin-reviews__replybody">
            <span className="scr-admin-reviews__replyby">
              {t("screensA.reviews.repliedBy", { name: review.replyBy ?? "" })}
            </span>
            <span className="scr-admin-reviews__replytext">{review.reply}</span>
          </span>
        </div>
      ) : null}

      {open ? (
        <div className="scr-admin-reviews__compose">
          <TextArea
            value={replyDraft}
            onChange={(v) => set({ replyDraft: v })}
            placeholder={t("screensA.reviews.replyPlaceholder")}
            rows={3}
            ariaLabel={t("screensA.reviews.replyAria", { name: review.name })}
          />
          <div className="scr-admin-reviews__actions">
            <button
              type="button"
              className="bk-btn scr-admin-reviews__post"
              onClick={send}
            >
              {t("screensA.reviews.post")}
            </button>
            <button
              type="button"
              className="bk-gi scr-admin-reviews__cancel"
              onClick={() => set({ replyOpen: null, replyDraft: "" })}
            >
              {t("screensA.common.cancel")}
            </button>
          </div>
        </div>
      ) : null}

      {!review.reply && !open ? (
        <div className="scr-admin-reviews__actions">
          <button
            type="button"
            className="bk-gi scr-admin-reviews__act"
            onClick={() => set({ replyOpen: review.id, replyDraft: "" })}
          >
            <Icon name="reply" size={14} />
            {t("screensA.reviews.reply")}
          </button>
          <button
            type="button"
            className="bk-gi scr-admin-reviews__act scr-admin-reviews__act--quiet"
            onClick={() => showToast(t("screensA.reviews.flagged"), "warn")}
          >
            {t("screensA.reviews.flag")}
          </button>
        </div>
      ) : null}
    </article>
  );
}
