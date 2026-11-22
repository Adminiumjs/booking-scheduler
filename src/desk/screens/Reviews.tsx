/**
 * K9 Reviews (comp L2 326–374): to read, published and hidden, the request
 * figures and the Google part. Good and bad reviews are treated alike: a review
 * is hidden only for one of Forms' five reasons, and there is no star filter.
 * Who may moderate is the person's grant on Forms' table.
 */
import { Check, EyeOff, Reply, Star } from "lucide-react";
import { useState } from "react";

import { useData, useEnv, useRun } from "../env.tsx";
import { byId, firstName } from "../facts.ts";
import { useFmt } from "../format.ts";
import { useDeskT } from "../i18n/index.ts";
import { openBooking, openSheet, useDesk } from "../store.ts";
import { Fig } from "../ui.tsx";
import { num, text, type Row } from "../wire.ts";
import { HIDE_REASONS } from "./Sheets.tsx";
import { webLink } from "../../safeLink.ts";

const PAGE = 8;

function Stars({ n, label }: { n: number; label: string }) {
  return (
    <span role="img" aria-label={label} className="lm-stars">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} size={15} aria-hidden="true" className={i < n ? "is-on" : ""} />
      ))}
    </span>
  );
}

function ReviewCard({ review, moderates }: { review: Row; moderates: boolean }) {
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const { busy, run } = useRun();
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState("");
  const state = String(review["state"]);
  const stars = num(review["stars"]) ?? 0;
  const name = text(review["shown_name"]) ?? "";
  const booking = byId(data.bookings, review["subject_key"]);
  const reply = text(review["reply"]);
  const reason = HIDE_REASONS.find((r) => r.value === review["hide_reason"]);
  const publish = () =>
    void run(async (d) => {
      await d.saveReview(review, { state: "published", hide_reason: null });
      return t("toast.published", { name });
    });
  const send = () => {
    const words = draft.trim();
    if (words === "") return;
    void run(async (d) => {
      await d.saveReview(review, { reply: words });
      setReplying(false);
      setDraft("");
      return t("toast.replied", { name });
    });
  };
  const visit = `${text(review["about_name"]) ?? ""}${text(review["about_detail"]) !== null ? ` ${t("reviews.with", { who: firstName(review["about_detail"]) })}` : ""}`;
  return (
    <article className="lm-review">
      <div className="lm-review-head">
        <Stars n={stars} label={t("reviews.stars", { n: stars })} />
        <strong>{name}</strong>
        <span className="lm-spacer" />
        <Fig>{fmt.day(review["submitted_at"])}</Fig>
      </div>
      {booking !== undefined ? (
        <button type="button" className="lm-review-visit" onClick={() => openBooking(booking.id)}>
          {visit} · <Fig>{fmt.day(booking["starts_at"])}</Fig>
        </button>
      ) : (
        <span className="lm-muted-sm">{visit}</span>
      )}
      {text(review["title"]) !== null && <strong>{text(review["title"])}</strong>}
      {text(review["body"]) !== null && <p>{text(review["body"])}</p>}
      {state === "hidden" && <span className="lm-review-hidden">{t("reviews.hiddenLine", { why: reason === undefined ? "" : t(reason.word) })}</span>}
      {reply !== null && (
        <div className="lm-reply">
          <small>{t("reviews.replyFrom", { studio: text(data.settings?.["studio_name"]) ?? "" })}</small>
          <span>{reply}</span>
        </div>
      )}
      {replying && (
        <div className="lm-field">
          <label htmlFor={`lm-reply-${String(review.id)}`}>{t("reviews.yourReply")}</label>
          <textarea id={`lm-reply-${String(review.id)}`} rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} />
          <div className="lm-row-gap">
            <button type="button" className="lm-btn lm-btn--primary" disabled={busy || draft.trim() === ""} onClick={send}>
              {t("reviews.postReply")}
            </button>
            <button type="button" className="lm-btn" onClick={() => setReplying(false)}>
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}
      {moderates && !replying && (
        <div className="lm-row-gap">
          {state === "waiting" && (
            <button type="button" className="lm-btn lm-btn--primary" disabled={busy} onClick={publish}>
              <Check size={14} aria-hidden="true" />
              {t("reviews.publish")}
            </button>
          )}
          {state !== "hidden" && (
            <button type="button" className="lm-btn" onClick={() => openSheet({ kind: "hide", reviewId: review.id })}>
              <EyeOff size={14} aria-hidden="true" />
              {t("reviews.hide")}
            </button>
          )}
          {state !== "hidden" && reply === null && (
            <button type="button" className="lm-btn" onClick={() => setReplying(true)}>
              <Reply size={14} aria-hidden="true" />
              {t("reviews.reply")}
            </button>
          )}
          {state === "hidden" && (
            <button type="button" className="lm-btn" disabled={busy} onClick={publish}>
              <Check size={14} aria-hidden="true" />
              {t("reviews.publish")}
            </button>
          )}
        </div>
      )}
    </article>
  );
}

export function ReviewsScreen() {
  const { door } = useEnv();
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const { busy, run } = useRun();
  const tab = useDesk((s) => s.reviewTab);
  const [shown, setShown] = useState(PAGE);
  const moderates = door.moderates();
  const mayEdit = door.who().can("settings", "update");
  const [link, setLink] = useState<string | null>(null);
  const all = data.reviews?.reviews ?? [];
  const inTab = (state: string) => all.filter((r) => r["state"] === state);
  const list = inTab(tab);
  const published = inTab("published");
  const visible = tab === "published" ? list.slice(0, shown) : list;
  const bars = [5, 4, 3, 2, 1].map((n) => ({ n, count: published.filter((r) => num(r["stars"]) === n).length }));
  const most = Math.max(1, ...bars.map((b) => b.count));
  const average = published.length === 0 ? null : published.reduce((sum, r) => sum + (num(r["stars"]) ?? 0), 0) / published.length;
  const sent = data.messages.filter((m) => m["kind"] === "review_request" && m["status"] === "sent").length;
  const saidNo = data.customers.filter((c) => c["review_requests"] === false).length;
  const saved = text(data.settings?.["google_review_link"]) ?? "";
  const value = link ?? saved;
  const linkBad = value.trim() !== "" && webLink(value) === null;
  const testable = webLink(saved);
  const hasBox = door.facts().addOns.includes("google-reviews");
  const tabs = [
    { id: "waiting", label: t("reviews.toRead") },
    { id: "published", label: t("reviews.published") },
    { id: "hidden", label: t("reviews.hidden") },
  ] as const;
  return (
    <div className="lm-page">
      <h1 className="lm-page-title">{t("nav.reviews")}</h1>
      <div className="lm-reviews-grid">
        <div className="lm-reviews-main">
          <div role="tablist" aria-label={t("nav.reviews")} className="lm-seg">
            {tabs.map((x) => (
              <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} className={tab === x.id ? "is-on" : ""} onClick={() => useDesk.setState({ reviewTab: x.id })}>
                {x.label} <Fig>{inTab(x.id).length}</Fig>
              </button>
            ))}
          </div>
          {visible.length === 0 && <div className="lm-empty-box">{tab === "waiting" ? t("reviews.emptyRead") : t("reviews.empty")}</div>}
          {visible.map((review) => (
            <ReviewCard key={String(review.id)} review={review} moderates={moderates} />
          ))}
          {tab === "published" && list.length > shown && (
            <button type="button" className="lm-btn lm-self-start" onClick={() => setShown(shown + 20)}>
              {t("reviews.more")}
            </button>
          )}
        </div>
        <aside className="lm-reviews-side">
          <section className="lm-card lm-pad">
            <dl className="lm-figs">
              <div><dt>{t("reviews.sent")}</dt><dd><Fig strong>{fmt.number(sent)}</Fig></dd></div>
              <div><dt>{t("reviews.count")}</dt><dd><Fig strong>{fmt.number(all.length)}</Fig></dd></div>
              <div><dt>{t("reviews.saidNo")}</dt><dd><Fig strong>{fmt.number(saidNo)}</Fig></dd></div>
            </dl>
            <div className="lm-average">
              <Fig strong>{average === null ? "—" : average.toFixed(1)}</Fig>
              <small>{t("reviews.from", {}, published.length)}</small>
            </div>
            {bars.map((b) => (
              <div key={b.n} className="lm-bar">
                <Fig>{`${String(b.n)}★`}</Fig>
                <span className="lm-bar-track"><span style={{ width: `${String(Math.round((b.count / most) * 100))}%` }} /></span>
                <Fig>{b.count}</Fig>
              </div>
            ))}
            <p className="lm-hint">{t("reviews.alike")}</p>
          </section>
          <section className="lm-card lm-pad">
            <div className="lm-field">
              <label htmlFor="lm-google-link">{t("reviews.googleLink")}</label>
              <input id="lm-google-link" dir="ltr" readOnly={!mayEdit} value={value} aria-invalid={linkBad} {...(linkBad ? { "aria-describedby": "lm-google-link-err" } : {})} onChange={(e) => setLink(e.target.value)} />
            </div>
            {linkBad && (
              <p id="lm-google-link-err" className="lm-hint" role="alert">
                {t("reviews.googleBad")}
              </p>
            )}
            <p className="lm-hint">{value === "" ? t("reviews.googleNone") : t("reviews.googleEvery")}</p>
            <div className="lm-row-gap">
              {mayEdit && link !== null && link !== saved && (
                <button
                  type="button"
                  className="lm-btn lm-btn--primary"
                  disabled={busy || data.settings === null || linkBad}
                  onClick={() =>
                    void run(async (d) => {
                      await d.saveSettings(data.settings!, { google_review_link: link.trim() === "" ? null : webLink(link) });
                      setLink(null);
                      return t("toast.saved");
                    })
                  }
                >
                  {t("common.save")}
                </button>
              )}
              {testable !== null && (
                <a className="lm-btn" href={testable} target="_blank" rel="noopener noreferrer">
                  {t("reviews.testLink")}
                </a>
              )}
            </div>
            <p className="lm-hint">{hasBox ? t("reviews.boxOn") : t("reviews.boxOff")}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
