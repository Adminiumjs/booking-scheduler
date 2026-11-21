/**
 * G11, Reviews (the comp's lines 649–709): every published review, newest
 * first, with the same five reasons the desk hides by. Google's reviews stay
 * apart, and load only when asked for, in the add-on's own sandboxed page (cQ8).
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { useApp } from "../app.tsx";
import type { ReviewPage, Row } from "../door.ts";
import { Icon, Stars } from "../parts.tsx";
import { RatingBars, ReviewCardBody } from "./Home.tsx";

const PAGE = 10;

const CHANNEL = "adminium-google-reviews";

/** The Google reviews add-on's own page, made only when the guest asks: until then nothing loads from Google (cQ8). */
function GoogleBox({ auto }: { auto: boolean }) {
  const { t, door, studio, locale, frame } = useApp();
  const [state, setState] = useState<"idle" | "loading" | "shown" | "error">(auto ? "loading" : "idle");
  const [place, setPlace] = useState<Row | null>(null);
  const [height, setHeight] = useState(0);
  const box = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    let on = true;
    door.googlePlace().then((row) => on && setPlace(row)).catch(() => undefined);
    return () => {
      on = false;
    };
  }, [door]);

  useEffect(() => {
    if (state !== "loading" && state !== "shown") return;
    const onMessage = (e: MessageEvent) => {
      if (box.current === null || e.source !== box.current.contentWindow) return;
      const data = e.data as { channel?: string; event?: string; px?: number } | null;
      if (data?.channel !== CHANNEL) return;
      if (data.event === "ready" && place !== null) {
        box.current.contentWindow?.postMessage(
          {
            channel: CHANNEL,
            event: "show",
            placeId: place["place_id"],
            browserKey: place["browser_key"],
            language: locale,
            ...(studio.googleLink === null ? {} : { reviewLink: studio.googleLink }),
            dark: document.documentElement.dataset["theme"] === "dark",
          },
          "*",
        );
      }
      if (data.event === "height" && typeof data.px === "number") {
        setHeight(Math.min(2400, data.px));
        setState("shown");
      }
      if (data.event === "failed") setState("error");
    };
    window.addEventListener("message", onMessage);
    const timer = setTimeout(() => setState((s) => (s === "loading" ? "error" : s)), 15000);
    return () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
    };
  }, [state, place, locale, studio.googleLink]);

  const has = place !== null;
  if (studio.googleLink === null && !has) return null;
  return (
    <section aria-labelledby="lm-h-google" style={{ marginTop: 36, padding: 20, border: "1px dashed var(--border-strong)", borderRadius: 20, background: "var(--surface-2)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px 16px" }}>
        <div>
          <h2 id="lm-h-google" style={{ fontSize: 17, fontWeight: 800 }}>
            {t("googleBoxTitle")}
          </h2>
          <div className="lm-muted" style={{ fontSize: 12.5, marginTop: 3 }}>
            {t("googleSub")}
          </div>
        </div>
        {studio.googleLink === null || frame !== null ? null : (
          <a href={studio.googleLink} target="_blank" rel="noopener noreferrer" className="lm-link">
            {t("reviewOnGoogle")}
            <Icon name="external-link" size={14} />
          </a>
        )}
      </div>
      {has ? (
        <div aria-live="polite" style={{ marginTop: 16 }}>
          {state === "idle" ? (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
              <button type="button" className="lm-btn" onClick={() => setState("loading")}>
                {t("seeGoogle")}
              </button>
              <span className="lm-muted" style={{ fontSize: 12.5 }}>
                {t("loadsFromGoogle")}
              </span>
            </div>
          ) : null}
          {state === "loading" ? (
            <div aria-busy="true" className="lm-col" style={{ gap: 10 }}>
              <div className="lm-muted" style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, fontWeight: 600 }}>
                <Icon name="loader-circle" size={16} className="lm-spin" />
                {t("loadingGoogle")}
              </div>
              {[0, 1, 2].map((k) => (
                <div key={k} className="lm-skel" style={{ height: 74, borderRadius: 14 }} />
              ))}
            </div>
          ) : null}
          {state === "loading" || state === "shown" ? (
            <iframe
              ref={box}
              title={t("googleBoxTitle")}
              src={`${door.served.baseUrl}/x/add-on-frame/google-reviews`}
              sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="strict-origin-when-cross-origin"
              style={{ width: "100%", height: state === "shown" ? height : 0, border: "none", display: "block" }}
            />
          ) : null}
          {state === "error" ? (
            <div role="alert" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 14, background: "var(--surface)" }}>
              <Icon name="cloud-off" size={18} />
              <span style={{ flex: "1 1 200px", fontSize: 13.5, fontWeight: 600 }}>{t("googleError")}</span>
              <button type="button" className="lm-btn" onClick={() => setState("loading")}>
                {t("tryAgain")}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default function Reviews() {
  const { t, door, studio, route } = useApp();
  const [page, setPage] = useState<ReviewPage | null>(null);
  const [list, setList] = useState<Row[]>([]);
  const [off, setOff] = useState(false);

  useEffect(() => {
    let on = true;
    door
      .reviews(PAGE)
      .then((r) => {
        if (!on) return;
        if (r === null) setOff(true);
        else {
          setPage(r);
          setList(r.list);
        }
      })
      .catch(() => on && setOff(true));
    return () => {
      on = false;
    };
  }, [door]);

  const more = useCallback(async () => {
    if (page?.next == null) return;
    const next = await door.reviews(PAGE, page.next);
    if (next === null) return;
    setPage(next);
    setList((l) => [...l, ...next.list]);
  }, [door, page]);

  const empty = off || (page !== null && page.count === 0);
  const left = page === null ? 0 : Math.max(0, page.count - list.length);

  return (
    <main id="lm-main" className="lm-narrow-page" style={{ maxWidth: 880, paddingBlock: "clamp(24px,4cqi,44px)" }}>
      <h1 className="lm-title" style={{ fontSize: "clamp(26px,4cqi,36px)" }}>
        {t("reviewsTitle")}
      </h1>
      <p className="lm-sub">{t("reviewsIntro")}</p>
      {page === null && !off ? <div className="lm-skel" style={{ height: 180, borderRadius: 20 }} /> : null}
      {empty ? (
        <div className="lm-empty">
          <div className="lm-empty-mark">
            <Icon name="star" size={24} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>{t("noReviews")}</h2>
          <p className="lm-muted" style={{ fontSize: 14 }}>
            {t("noReviewsSub")}
          </p>
        </div>
      ) : null}
      {page !== null && page.count > 0 ? (
        <>
          <div className="lm-card lm-pad" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(240px,100%),1fr))", alignItems: "center", gap: "18px 28px", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span className="lm-mono6" style={{ fontSize: 40, letterSpacing: "-.03em", lineHeight: 1 }}>
                {page.average.toFixed(1)}
              </span>
              <div>
                <Stars value={page.average} label={t("starsOf", { n: page.average.toFixed(1) })} />
                <div className="lm-muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                  {t("fromReviews", { n: page.count })}
                </div>
              </div>
            </div>
            <RatingBars page={page} />
          </div>
          <ul className="lm-col" style={{ gap: 12 }}>
            {list.map((r) => (
              <li key={String(r["id"])} className="lm-card lm-col" style={{ padding: "18px 20px", borderRadius: 18, gap: 10, boxShadow: "none" }}>
                <ReviewCardBody row={r} />
                {r["reply"] ? (
                  <div style={{ marginTop: 2, padding: "12px 14px", borderRadius: 12, background: "var(--surface-2)", fontSize: 13.5, lineHeight: 1.5 }}>
                    <div className="lm-eyebrow" style={{ marginBottom: 4 }}>
                      {t("replyFrom", { studio: studio.name })}
                    </div>
                    {String(r["reply"])}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          {page.next !== null && left > 0 ? (
            <button type="button" className="lm-btn" style={{ margin: "16px auto 0", display: "flex" }} onClick={() => void more()}>
              {t("showMore", { n: left })}
            </button>
          ) : null}
        </>
      ) : null}
      <GoogleBox auto={route.query.get("google") === "1"} />
    </main>
  );
}
