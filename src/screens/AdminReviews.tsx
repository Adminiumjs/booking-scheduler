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
import { useStore } from "../state/store.ts";

import "../styles/screen-admin-reviews.css";

export default function AdminReviews() {
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
      label: "Average rating",
      value: average.toFixed(1),
      sub: `${all.length} reviews all-time`,
    },
    {
      label: "Waiting on a reply",
      value: String(all.filter((r) => !r.reply).length),
      sub: "Aim for under 48 hours",
    },
    {
      label: "Under four stars",
      value: String(all.filter((r) => r.rating < LOW_RATING).length),
      sub: "Worth a personal call",
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
            label={f.label}
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
          title="You’re all caught up"
          body="Every review has a reply. Switch to All reviews to read them back."
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
  const replyOpen = useStore((s) => s.replyOpen);
  const replyDraft = useStore((s) => s.replyDraft);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const open = replyOpen === review.id;

  const send = () => {
    if (!replyDraft.trim()) {
      showToast("Write a line first", "warn");
      return;
    }
    /* Merged against the live store, so a reply posted while another card's
     * write is still in flight cannot drop it. */
    set({
      replied: { ...useStore.getState().replied, [review.id]: replyDraft },
      replyOpen: null,
      replyDraft: "",
    });
    showToast("Reply posted publicly");
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
            {review.svc} · {review.staff} · {review.date}
          </span>
        </span>
        <StarBar
          value={review.rating}
          size={13}
          gap={1}
          label={`${review.rating} out of 5`}
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
              {review.replyBy} replied
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
            placeholder="Reply as the studio…"
            rows={3}
            ariaLabel={`Reply to ${review.name}`}
          />
          <div className="scr-admin-reviews__actions">
            <button
              type="button"
              className="bk-btn scr-admin-reviews__post"
              onClick={send}
            >
              Post reply
            </button>
            <button
              type="button"
              className="bk-gi scr-admin-reviews__cancel"
              onClick={() => set({ replyOpen: null, replyDraft: "" })}
            >
              Cancel
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
            Reply
          </button>
          <button
            type="button"
            className="bk-gi scr-admin-reviews__act scr-admin-reviews__act--quiet"
            onClick={() => showToast("Flagged for the platform to review", "warn")}
          >
            Flag
          </button>
        </div>
      ) : null}
    </article>
  );
}
