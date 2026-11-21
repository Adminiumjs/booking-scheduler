/** G1, the booking page (the comp's lines 108–245). */
import { useEffect, useMemo, useState } from "react";

import { A, useApp, type Service } from "../app.tsx";
import type { ReviewPage, Row } from "../door.ts";
import { dayOf, fmtDay, fmtMoney, initials, weekdayOf } from "../format.ts";
import { Icon, Stars, Tile } from "../parts.tsx";
import { doorFor } from "../rules.ts";
import { addressLine2, useHours } from "../Shell.tsx";

export function ReviewCardBody({ row }: { row: Row }) {
  const { t, clock } = useApp();
  const stars = Number(row["stars"] ?? 0);
  const name = String(row["shown_name"] ?? "") || t("aCustomer");
  const about = String(row["about_name"] ?? row["about"] ?? "");
  const detail = String(row["about_detail"] ?? row["detail"] ?? "");
  const who = detail.trim().split(/\s+/)[0] ?? "";
  const when = row["submitted_at"] ? fmtDay(clock, dayOf(clock, String(row["submitted_at"]))) : "";
  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontSize: 14.5, fontWeight: 800 }}>{name}</span>
        <Stars value={stars} label={t("starsOf", { n: stars })} />
      </div>
      {row["body"] ? <p style={{ fontSize: 14, lineHeight: 1.55, textWrap: "pretty" }}>{String(row["body"])}</p> : null}
      <div style={{ marginTop: "auto", display: "flex", flexWrap: "wrap", gap: "4px 10px", fontSize: 12, color: "var(--fg-subtle)" }}>
        <span>{who === "" ? about : t("withWho", { svc: about, who })}</span>
        <span className="lm-mono">{when}</span>
      </div>
    </>
  );
}

export function RatingBars({ page }: { page: ReviewPage }) {
  const max = Math.max(...page.bars, 1);
  return (
    <div className="lm-col" style={{ gap: 7 }}>
      {page.bars.map((count, i) => (
        <div key={5 - i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="lm-mono lm-muted" style={{ width: 22, fontSize: 12 }}>
            {5 - i}
          </span>
          <span className="lm-bar">
            <span style={{ width: `${String((count / max) * 100)}%` }} />
          </span>
          <span className="lm-mono lm-muted" style={{ width: 34, textAlign: "end", fontSize: 12 }}>
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}

function ServiceCard({ s, icon }: { s: Service; icon: string }) {
  const { t, clock, studio } = useApp();
  const door = doorFor(s, studio.ownerSwitch, studio.rows.paymentsOnline);
  const money = door === "money";
  return (
    <div className="lm-svc">
      <Tile icon={icon} />
      <div className="lm-col" style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <div className="lm-svc-name">{s.name}</div>
        {s.blurb === "" ? null : <p className="lm-svc-blurb">{s.blurb}</p>}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 14px", marginTop: 2 }}>
          <span className="lm-mono lm-dur">{t("minutes", { n: s.minutes })}</span>
          <span className="lm-mono6 lm-price">{fmtMoney(clock, s.price)}</span>
          {money && s.online === "deposit" ? <span className="lm-pill">{t("depositOnline", { amt: fmtMoney(clock, s.deposit) })}</span> : null}
          {money && s.online === "full" ? <span className="lm-pill">{t("fullOnline", { amt: fmtMoney(clock, s.price) })}</span> : null}
        </div>
      </div>
      <A to={`/book?service=${s.id}`} aria-label={t("bookLabel", { service: s.name })} className="lm-btn primary" style={{ alignSelf: "center", flexShrink: 0 }}>
        {t("book")}
      </A>
    </div>
  );
}

export default function Home() {
  const { t, clock, studio, door, now, go, frame } = useApp();
  const hours = useHours();
  const [reviews, setReviews] = useState<ReviewPage | null>(null);
  const today = dayOf(clock, new Date(now()).toISOString());
  const todayKey = weekdayOf(today);
  const s = studio.rows.settings;

  useEffect(() => {
    if (!studio.reviewsOn) return;
    let on = true;
    door.reviews(3).then((r) => on && setReviews(r)).catch(() => undefined);
    return () => {
      on = false;
    };
  }, [door, studio.reviewsOn]);

  // A guest arriving at "/#team" lands on that part.
  useEffect(() => {
    const part = window.location.hash.replace(/^#/, "");
    if (["services", "team", "find"].includes(part)) document.getElementById(`lm-${part}`)?.scrollIntoView({ block: "start" });
  }, []);

  const todayRow = hours.find((h) => h.key === todayKey);
  const closedToday = studio.rows.closures.some((c) => String(c["from_date"]).slice(0, 10) <= today && String(c["to_date"]).slice(0, 10) >= today);
  const openLine = todayRow?.time == null || closedToday ? t("closedToday") : t("openToday", { hours: todayRow.time });
  const paysDeposit = studio.ownerSwitch === "on" && studio.services.some((v) => v.online !== "none");
  const address = String(s["address_line1"] ?? "");
  const line2 = addressLine2(s);
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${line2}`)}`;
  const iconOf = useMemo(() => new Map(studio.categories.map((c) => [c.id, c.icon])), [studio.categories]);
  const doesOf = (id: string) => studio.services.filter((v) => studio.doers.get(v.id)?.includes(id)).map((v) => v.name).join(" · ");
  const notice = studio.noticeMin % 60 === 0 ? t("gtkNotice", { n: studio.noticeMin / 60 }) : t("gtkNoticeMinutes", { n: studio.noticeMin });

  return (
    <main id="lm-main" style={{ animation: "lm-fade .3s ease" }}>
      <section className="lm-hero">
        <div className="lm-hero-grid">
          <div className="lm-col" style={{ gap: 20 }}>
            <h1>{studio.name}</h1>
            {s["tagline"] ? <p className="lm-hero-line">{String(s["tagline"])}</p> : null}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <A to="/book" className="lm-btn primary large">
                <Icon name="calendar-plus" size={17} />
                {t("bookNow")}
              </A>
              <a
                href="#lm-services"
                className="lm-btn large"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("lm-services")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {t("seeServices")}
                <Icon name="arrow-right" size={16} />
              </a>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 18px" }}>
              <span className="lm-meta">
                <Icon name="map-pin" size={15} />
                <bdi>{`${address}, ${String(s["city"] ?? "")}`}</bdi>
              </span>
              <span className="lm-meta">
                <Icon name="clock" size={15} />
                {openLine}
              </span>
            </div>
          </div>
          <div aria-hidden="true" className="lm-hero-tile">
            <Icon name="sparkles" size={72} />
          </div>
        </div>
      </section>

      <section id="lm-services" aria-labelledby="lm-h-services" className="lm-sec">
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
          <div>
            <h2 id="lm-h-services" className="lm-h2">
              {t("servicesTitle")}
            </h2>
            <p className="lm-muted" style={{ marginTop: 6, fontSize: 14 }}>
              {t("servicesSub")}
            </p>
          </div>
          {studio.rows.packs.length > 0 ? (
            <A to="/packs" className="lm-link">
              <Icon name="package" size={16} />
              {t("packsLink")}
            </A>
          ) : null}
        </div>
        <div className="lm-col" style={{ gap: 28 }}>
          {studio.categories
            .map((c) => ({ c, list: studio.services.filter((v) => v.categoryId === c.id) }))
            .filter((g) => g.list.length > 0)
            .map(({ c, list }) => (
              <div key={c.id}>
                <h3 className="lm-cat-h">
                  <span className="lm-cat-mark">
                    <Icon name={c.icon} size={16} />
                  </span>
                  {c.name}
                </h3>
                <div className="lm-svc-grid">
                  {list.map((v) => (
                    <ServiceCard key={v.id} s={v} icon={iconOf.get(v.categoryId) ?? "sparkles"} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      </section>

      <section id="lm-team" aria-labelledby="lm-h-team" className="lm-sec">
        <h2 id="lm-h-team" className="lm-h2" style={{ marginBottom: 20 }}>
          {t("teamTitle")}
        </h2>
        <div className="lm-team-grid">
          {studio.team.map((p) => (
            <div key={p.id} className="lm-card" style={{ display: "flex", gap: 14, padding: 18, borderRadius: 18 }}>
              <div aria-hidden="true" className="lm-avatar" style={{ "--tint": p.tint } as Record<string, string>}>
                {initials(p.name)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 800, letterSpacing: "-.01em" }}>{p.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--accent)", fontWeight: 700, marginTop: 2 }}>{p.role}</div>
                <div className="lm-muted" style={{ fontSize: 12.5, marginTop: 7, lineHeight: 1.45 }}>
                  {doesOf(p.id)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="lm-find" aria-labelledby="lm-h-find" className="lm-sec">
        <h2 id="lm-h-find" className="lm-h2" style={{ marginBottom: 20 }}>
          {t("findTitle")}
        </h2>
        <div className="lm-three">
          <div className="lm-card lm-pad">
            <h3 style={{ marginBottom: 12, fontSize: 15, fontWeight: 800 }}>{t("hoursTitle")}</h3>
            <div className="lm-col">
              {hours.map((h) => (
                <div key={h.key} className={`lm-hours-row${h.key === todayKey ? " today" : ""}`}>
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{h.day}</span>
                  {h.key === todayKey ? <span className="lm-today">{t("today")}</span> : null}
                  <span className="lm-mono" style={{ marginInlineStart: "auto", fontSize: 12.5, whiteSpace: "nowrap" }}>
                    {h.time ?? t("closedDay")}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="lm-card lm-col" style={{ overflow: "hidden" }}>
            <div aria-hidden="true" className="lm-map">
              <Icon name="map-pin" size={30} />
            </div>
            <div className="lm-col" style={{ padding: "18px 20px", gap: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{studio.name}</div>
              <div className="lm-muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                <bdi>{address}</bdi>
                <br />
                <bdi>{line2}</bdi>
              </div>
              <a href={`mailto:${studio.email}`} dir="ltr" style={{ fontSize: 13.5, fontWeight: 600 }}>
                {studio.email}
              </a>
              <a href={maps} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 700, marginTop: 4 }}>
                {t("directions")}
                <Icon name="external-link" size={14} />
              </a>
            </div>
          </div>
          <div className="lm-card lm-pad">
            <h3 style={{ marginBottom: 12, fontSize: 15, fontWeight: 800 }}>{t("goodToKnow")}</h3>
            <ul className="lm-col" style={{ gap: 12 }}>
              <li style={{ display: "flex", gap: 10, fontSize: 13.5, lineHeight: 1.5 }}>
                <Icon name="calendar-check" size={16} />
                <span>{t("gtkFree", { n: studio.cancelHours })}</span>
              </li>
              <li style={{ display: "flex", gap: 10, fontSize: 13.5, lineHeight: 1.5 }}>
                <Icon name="clock" size={16} />
                <span>{notice}</span>
              </li>
              {paysDeposit ? (
                <li style={{ display: "flex", gap: 10, fontSize: 13.5, lineHeight: 1.5 }}>
                  <Icon name="info" size={16} />
                  <span>{t("gtkDeposit")}</span>
                </li>
              ) : null}
            </ul>
            <A to="/policy" className="lm-link" style={{ marginTop: 14 }}>
              {t("policyLink")}
            </A>
          </div>
        </div>
      </section>

      {reviews !== null && reviews.count > 0 ? (
        <section aria-labelledby="lm-h-reviews" className="lm-sec">
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
            <h2 id="lm-h-reviews" className="lm-h2">
              {t("reviewsTitle")}
            </h2>
            <A to="/reviews" className="lm-link">
              {t("readAll")}
              <Icon name="arrow-right" size={15} />
            </A>
          </div>
          <div className="lm-rv-grid">
            <div className="lm-card lm-pad lm-col" style={{ gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span className="lm-mono6" style={{ fontSize: 34, letterSpacing: "-.03em", lineHeight: 1 }}>
                  {reviews.average.toFixed(1)}
                </span>
                <div>
                  <Stars value={reviews.average} label={t("starsOf", { n: reviews.average.toFixed(1) })} />
                  <div className="lm-muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                    {t("fromReviews", { n: reviews.count })}
                  </div>
                </div>
              </div>
              <RatingBars page={reviews} />
            </div>
            {reviews.list.slice(0, 3).map((r) => (
              <div key={String(r["id"])} className="lm-card lm-pad lm-col" style={{ gap: 10 }}>
                <ReviewCardBody row={r} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {studio.googleLink === null ? null : (
        <section aria-label={t("googleBoxTitle")} className="lm-sec" style={{ paddingBlock: "clamp(12px,2cqi,20px) clamp(28px,4cqi,48px)" }}>
          <div className="lm-google">
            <div style={{ flex: "1 1 240px", minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800 }}>{t("googleBoxTitle")}</div>
              <div className="lm-muted" style={{ fontSize: 12.5, marginTop: 3 }}>
                {t("googleBoxSub")}
              </div>
            </div>
            {door.addOn("google-reviews") ? (
              <button type="button" className="lm-btn" onClick={() => go("/reviews?google=1")}>
                {t("seeGoogle")}
              </button>
            ) : null}
            {frame === null ? (
              <a href={studio.googleLink} target="_blank" rel="noopener noreferrer" className="lm-link">
                {t("reviewOnGoogle")}
                <Icon name="external-link" size={14} />
              </a>
            ) : null}
          </div>
        </section>
      )}
    </main>
  );
}
