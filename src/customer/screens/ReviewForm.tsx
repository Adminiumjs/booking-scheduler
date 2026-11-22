/**
 * G10, How was it? (the comp's lines 711–751). Two ways in: from a booking the
 * person holds (signed in, or a proved link), or from the review mail's own link
 * (`/review#<token>`, cQ23's re-ruling), which opens no session and reviews that
 * one visit.
 *
 * Everyone who sends a review, whatever the stars, gets the same Google button.
 */
import { PublicApiError } from "@adminiumjs/public-client";
import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";

import { useApp } from "../app.tsx";
import type { ReviewLink } from "../door.ts";
import { firstName, fmtDay } from "../format.ts";
import { Blank, Err, Icon } from "../parts.tsx";
import { tokenOf } from "../route.ts";

type View = "loading" | "form" | "thanks" | "already" | "expired";

function Form({ what, shownAs, onSend, onStop }: { what: string; shownAs: string; onSend: (stars: number, body: string) => Promise<void>; onStop: (() => Promise<void>) | null }) {
  const { t, toast } = useApp();
  const [stars, setStars] = useState(0);
  const [text, setText] = useState("");
  const [err, setErr] = useState<"stars" | "address" | "failed" | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (stars === 0) {
      setErr("stars");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await onSend(stars, text);
    } catch (error) {
      setErr(error instanceof PublicApiError && error.code === "PUBLIC_WRITE_REJECTED" ? "address" : "failed");
    } finally {
      setBusy(false);
    }
  };

  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (step === 0) return;
    e.preventDefault();
    const rtl = document.documentElement.dir === "rtl" && (e.key === "ArrowRight" || e.key === "ArrowLeft");
    const next = Math.min(5, Math.max(1, (stars || (step > 0 ? 0 : 6)) + (rtl ? -step : step)));
    setStars(next);
    setErr(null);
    e.currentTarget.querySelector<HTMLElement>(`[data-star="${String(next)}"]`)?.focus();
  };

  return (
    <>
      <form noValidate onSubmit={(e) => void submit(e)} className="lm-card lm-col" style={{ borderRadius: 22, padding: "clamp(22px,4cqi,30px)", gap: 18 }}>
        <div>
          <h1 style={{ fontSize: "clamp(24px,4cqi,30px)", fontWeight: 800, letterSpacing: "-.03em" }}>{t("howWas")}</h1>
          <p className="lm-muted" style={{ marginTop: 6, fontSize: 14 }}>
            {what}
          </p>
        </div>
        <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
          <legend className="lm-label" style={{ marginBottom: 9 }}>
            {t("rating")}
          </legend>
          <div role="radiogroup" aria-label={t("rating")} {...(err === "stars" ? { "aria-describedby": "lm-rate-err" } : {})} style={{ display: "flex", gap: 6 }} onKeyDown={keys}>
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                data-star={v}
                aria-checked={v === stars}
                aria-label={t("star", { n: v })}
                tabIndex={v === stars || (stars === 0 && v === 1) ? 0 : -1}
                className={`lm-rate-star${v <= stars ? " on" : ""}`}
                onClick={() => {
                  setStars(v);
                  setErr(null);
                }}
              >
                ★
              </button>
            ))}
          </div>
          {err === "stars" ? <Err id="lm-rate-err">{t("errStars")}</Err> : null}
        </fieldset>
        <div className="lm-field">
          <label htmlFor="lm-rate-text">{t("fewWords")}</label>
          <textarea id="lm-rate-text" className="lm-input" style={{ minHeight: 110 }} rows={4} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />
          {err === "address" ? <Err>{t("reviewNoAddress")}</Err> : null}
        </div>
        {shownAs === "" ? null : (
          <div className="lm-muted" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <Icon name="user" size={15} />
            {t("shownAs")} <strong style={{ color: "var(--fg)" }}>{shownAs}</strong>
          </div>
        )}
        <p className="lm-muted" style={{ fontSize: 13, lineHeight: 1.55 }}>
          {t("reviewPromise")}
        </p>
        {err === "failed" ? (
          <div role="alert" className="lm-note danger">
            <Icon name="circle-alert" size={16} />
            {t("somethingWrong")}
          </div>
        ) : null}
        <button type="submit" className="lm-btn primary large" disabled={busy}>
          {t("send")}
        </button>
      </form>
      {onStop === null ? null : (
        <p style={{ marginTop: 16, textAlign: "center" }}>
          <button
            type="button"
            className="lm-muted"
            style={{ whiteSpace: "normal", minHeight: 44, border: "none", background: "transparent", textDecoration: "underline", fontSize: 12.5 }}
            onClick={() => {
              void onStop().then(() => toast(t("reviewsOff")));
            }}
          >
            {t("stopAsking")}
          </button>
        </p>
      )}
    </>
  );
}

function Thanks({ onPressed }: { onPressed?: () => void }) {
  const { t, studio, go } = useApp();
  return (
    <div role="status" className="lm-pay-card">
      <div className="lm-badge pos">
        <Icon name="heart" size={28} />
      </div>
      <h1 style={{ fontSize: "clamp(22px,3.6cqi,26px)", fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.3, textWrap: "balance" }}>{studio.googleLink === null ? t("thanksPlain") : t("thanksGoogle")}</h1>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
        {studio.googleLink === null ? null : (
          <a className="lm-btn primary mid" href={studio.googleLink} target="_blank" rel="noopener noreferrer" {...(onPressed === undefined ? {} : { onClick: onPressed })}>
            {t("reviewOnGoogle")}
            <Icon name="external-link" size={15} />
          </a>
        )}
        <button type="button" className="lm-btn mid" onClick={() => go("/")}>
          {t("notNow")}
        </button>
      </div>
    </div>
  );
}

function Other({ word, icon }: { word: "alreadyReviewed" | "reviewExpired"; icon: string }) {
  const { t, studio, go } = useApp();
  return (
    <div role="status" className="lm-empty">
      <div className="lm-empty-mark">
        <Icon name={icon} size={24} />
      </div>
      <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.02em", textWrap: "balance" }}>{t(word)}</h1>
      <button type="button" className="lm-btn" onClick={() => go("/")}>
        {t("goStudio", { studio: studio.name })}
      </button>
    </div>
  );
}

/** A visit of a booking the person holds. */
export default function ReviewForm({ bookingId, signedIn, serviceId, teamId, day, onBack }: { bookingId: unknown; signedIn: boolean; serviceId: string; teamId: string | null; day: string; onBack: () => void }) {
  const { t, door, studio, clock, me, setMe } = useApp();
  const [view, setView] = useState<View>("loading");
  const [shownAs, setShownAs] = useState("");
  const service = studio.services.find((s) => s.id === serviceId);
  const person = studio.team.find((p) => p.id === teamId);

  useEffect(() => {
    let on = true;
    door
      .reviewState(bookingId, signedIn)
      .then((state) => {
        if (!on) return;
        if (state === null) return setView("expired");
        setShownAs(state.shownName);
        setView(state.reviewedAt !== null ? "already" : state.open ? "form" : "expired");
      })
      .catch(() => on && setView("expired"));
    return () => {
      on = false;
    };
  }, [door, bookingId, signedIn]);

  const what = t("reviewWithWho", { svc: service?.name ?? "", who: firstName(person?.name ?? ""), day: fmtDay(clock, day) });
  return (
    <main id="lm-main" className="lm-narrow-page" style={{ maxWidth: 560 }}>
      <button type="button" className="lm-link quiet" style={{ marginBottom: 6 }} onClick={onBack}>
        <Icon name="arrow-left" size={15} />
        {t("back")}
      </button>
      {view === "loading" ? <div className="lm-skel" style={{ height: 420, borderRadius: 22 }} /> : null}
      {view === "form" ? (
        <Form
          what={what}
          shownAs={shownAs}
          onSend={async (stars, body) => {
            await door.sendReview(bookingId, signedIn, stars, body);
            setView("thanks");
          }}
          onStop={
            signedIn && me !== null
              ? async () => {
                  await door.setAskReviews(me["id"], false);
                  setMe({ ...me, review_requests: false });
                }
              : null
          }
        />
      ) : null}
      {view === "thanks" ? <Thanks onPressed={() => void door.pressedGoogle(bookingId, signedIn)} /> : null}
      {view === "already" ? <Other word="alreadyReviewed" icon="badge-check" /> : null}
      {view === "expired" ? <Other word="reviewExpired" icon="link-2-off" /> : null}
    </main>
  );
}

/** The review mail's own link: `/review#<token>`. */
export function ReviewLinkPage() {
  const { t, door } = useApp();
  const [view, setView] = useState<View>("loading");
  const [token] = useState(() => tokenOf(window.location.hash));
  const [link, setLink] = useState<ReviewLink | null>(null);

  useEffect(() => {
    if (token !== null) window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    if (token === null) {
      setView("expired");
      return;
    }
    let on = true;
    door
      .readReviewLink(token)
      .then((l) => {
        if (!on) return;
        setLink(l);
        setView(l.reviewedAt !== null ? "already" : l.open ? "form" : "expired");
      })
      .catch(() => on && setView("expired"));
    return () => {
      on = false;
    };
  }, [door, token]);

  if (view === "loading") return <Blank icon="loader-circle" title={t("loading")} />;
  const what = link === null ? "" : link.detail === null ? link.about : t("withWho", { svc: link.about, who: firstName(link.detail) });
  return (
    <main id="lm-main" className="lm-narrow-page" style={{ maxWidth: 560 }}>
      {view === "form" && token !== null ? (
        <Form
          what={what}
          shownAs={link?.shownName ?? ""}
          onSend={async (stars, body) => {
            await door.sendReviewLink(token, stars, body);
            setView("thanks");
          }}
          onStop={null}
        />
      ) : null}
      {view === "thanks" ? <Thanks /> : null}
      {view === "already" ? <Other word="alreadyReviewed" icon="badge-check" /> : null}
      {view === "expired" ? <Other word="reviewExpired" icon="link-2-off" /> : null}
    </main>
  );
}
