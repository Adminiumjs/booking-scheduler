/**
 * G8, Your visits (the comp's lines 558–621): what is coming up, what is past,
 * what the person is waiting for, the packs and cards Offers holds for the
 * address they proved, the review switch, and "Delete my details".
 *
 * A booking somebody made by typing this address proves nothing (ACC-6): it is
 * listed apart, with a way to cancel it.
 */
import { PublicApiError } from "@adminiumjs/public-client";
import { useCallback, useEffect, useMemo, useState } from "react";

import { A, useApp, yes } from "../app.tsx";
import type { Held, Row } from "../door.ts";
import { dayOf, fmtDay, fmtDayYear, fmtMoney, fmtWhen } from "../format.ts";
import { Blank, Icon, Tile } from "../parts.tsx";
import { usesLeft } from "../rules.ts";

const UPCOMING = new Set(["booked", "paying", "offered"]);

function VisitRow({ row, signedIn }: { row: Row; signedIn: boolean }) {
  const { t, clock, studio, go } = useApp();
  const service = studio.services.find((s) => s.id === String(row["service_id"]));
  const person = studio.team.find((p) => p.id === String(row["team_id"] ?? ""));
  const icon = studio.categories.find((c) => c.id === service?.categoryId)?.icon ?? "sparkles";
  const when = fmtWhen(clock, String(row["starts_at"]), Number(row["minutes"] ?? service?.minutes ?? 60));
  return (
    <A to={`/b?id=${String(row["id"])}`} className="lm-visit" onClick={signedIn ? undefined : () => go("/b")}>
      <Tile icon={icon} size={48} iconSize={22} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 800 }}>{service?.name ?? ""}</span>
        <span className="lm-mono lm-muted" style={{ display: "block", fontSize: 12.5, marginTop: 3 }}>
          {when}
        </span>
        <span className="lm-muted" style={{ display: "block", fontSize: 12.5, marginTop: 2 }}>
          {person?.name ?? t("anyone")}
        </span>
      </span>
      <Icon name="chevron-right" size={18} />
    </A>
  );
}

function PastRow({ row }: { row: Row }) {
  const { t, clock, studio, go } = useApp();
  const service = studio.services.find((s) => s.id === String(row["service_id"]));
  const person = studio.team.find((p) => p.id === String(row["team_id"] ?? ""));
  const icon = studio.categories.find((c) => c.id === service?.categoryId)?.icon ?? "sparkles";
  return (
    <div className="lm-visit" style={{ flexWrap: "wrap", boxShadow: "none" }}>
      <A to={`/b?id=${String(row["id"])}`} style={{ flex: "1 1 160px", minWidth: 0, display: "flex", alignItems: "center", gap: 14, color: "var(--fg)" }}>
        <Tile icon={icon} size={48} iconSize={22} />
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 15, fontWeight: 800 }}>{service?.name ?? ""}</span>
          <span className="lm-mono lm-muted" style={{ display: "block", fontSize: 12.5, marginTop: 3 }}>
            {fmtWhen(clock, String(row["starts_at"]), Number(row["minutes"] ?? service?.minutes ?? 60))}
          </span>
          <span className="lm-muted" style={{ display: "block", fontSize: 12.5, marginTop: 2 }}>
            {person?.name ?? ""}
          </span>
        </span>
      </A>
      {service === undefined ? null : (
        <button type="button" className="lm-btn" onClick={() => go(`/book?service=${service.id}`)}>
          {t("bookAgain")}
        </button>
      )}
    </div>
  );
}

const H2 = ({ id, children }: { id: string; children: string }) => (
  <h2 id={id} className="lm-eyebrow" style={{ marginBottom: 10 }}>
    {children}
  </h2>
);

export default function Account() {
  const { t, clock, studio, door, me, setMe, go, now, openSheet, toast } = useApp();
  const [bookings, setBookings] = useState<Row[] | null>(null);
  const [waiting, setWaiting] = useState<Row[]>([]);
  const [held, setHeld] = useState<Held>({ packs: [], cards: [] });
  const [problem, setProblem] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    const [b, w, h] = await Promise.all([door.myBookings(), door.myWaitlist(), door.held()]);
    setBookings(b);
    setWaiting(w.filter((row) => row["state"] === "waiting" || row["state"] === "offered"));
    setHeld(h);
  }, [door]);

  useEffect(() => {
    if (!door.signedIn()) {
      go("/sign-in", { replace: true });
      return;
    }
    load().catch(() => setFailed(true));
  }, [door, go, load]);

  const stamp = now();
  const { upcoming, typed, past } = useMemo(() => {
    const rows = [...(bookings ?? [])].sort((a, b) => String(a["starts_at"]).localeCompare(String(b["starts_at"])));
    const ahead = rows.filter((r) => UPCOMING.has(String(r["state"])) && new Date(String(r["starts_at"])).getTime() > stamp);
    const aheadIds = new Set(ahead.map((r) => r["id"]));
    return {
      upcoming: ahead.filter((r) => yes(r["customer_proved"])),
      typed: ahead.filter((r) => !yes(r["customer_proved"])),
      past: rows.filter((r) => !aheadIds.has(r["id"])).reverse(),
    };
    // The clock is read once per load: a list does not reshuffle while it is read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);

  if (failed) {
    return (
      <Blank icon="cloud-off" title={t("somethingWrong")}>
        <button type="button" className="lm-btn primary" onClick={() => void load().catch(() => setFailed(true))}>
          {t("tryAgain")}
        </button>
      </Blank>
    );
  }
  if (me === null || bookings === null) {
    return (
      <main id="lm-main" className="lm-narrow-page" style={{ maxWidth: 880 }} aria-busy="true" aria-label={t("loading")}>
        <div className="lm-skel" style={{ height: 320, borderRadius: 20 }} />
      </main>
    );
  }

  const asks = yes(me["review_requests"]);
  const toggleAsk = async () => {
    const next = !asks;
    setMe({ ...me, review_requests: next });
    try {
      await door.setAskReviews(me["id"], next);
      toast(t(next ? "reviewsOn" : "reviewsOff"));
    } catch {
      setMe({ ...me, review_requests: asks });
      setProblem(t("somethingWrong"));
    }
  };

  const askDelete = () => {
    const ahead = [...upcoming, ...typed];
    openSheet({
      icon: "trash-2",
      title: t("delTitle"),
      lines: [t("delLine1"), ...(ahead.length > 0 ? [t("delAhead", { n: ahead.length })] : []), t("delKeeps")],
      keep: t("delKeep"),
      go: t("delGo"),
      onGo: async () => {
        setProblem(null);
        try {
          await door.forgetMe(ahead, waiting);
          setMe(null);
          toast(t("deleted"));
          go("/", { replace: true });
        } catch (error) {
          if (error instanceof PublicApiError && error.code === "PUBLIC_CODE_STEP_UP") setProblem(t("delStepUp"));
          else setProblem(t("somethingWrong"));
          await load().catch(() => undefined);
        }
      },
    });
  };

  const leave = async (id: unknown) => {
    try {
      await door.leaveList(id);
      await load();
    } catch {
      setProblem(t("somethingWrong"));
    }
  };

  const packs = held.packs.filter((p) => p["worth"] === "pack");

  return (
    <main id="lm-main" className="lm-narrow-page" style={{ maxWidth: 880, paddingBlock: "clamp(24px,4cqi,44px)" }}>
      <h1 className="lm-title">{t("visitsTitle")}</h1>
      <p className="lm-muted" style={{ marginTop: 6, marginBottom: 24, fontSize: 14.5 }}>
        {`${String(me["name"] ?? "")} · ${String(me["email"] ?? "")}`}
      </p>
      {problem === null ? null : (
        <div role="alert" className="lm-note danger" style={{ marginBottom: 16 }}>
          <Icon name="circle-alert" size={16} />
          {problem}
        </div>
      )}
      <div className="lm-visits">
        <div className="lm-col" style={{ gap: 18 }}>
          <section aria-labelledby="lm-h-up">
            <H2 id="lm-h-up">{t("comingUp")}</H2>
            <div className="lm-col" style={{ gap: 10 }}>
              {upcoming.length === 0 ? (
                <p className="lm-muted" style={{ fontSize: 13.5 }}>
                  {t("noUpcoming")}
                </p>
              ) : null}
              {upcoming.map((r) => (
                <VisitRow key={String(r["id"])} row={r} signedIn />
              ))}
            </div>
          </section>
          {typed.length > 0 ? (
            <section aria-labelledby="lm-h-typed">
              <H2 id="lm-h-typed">{t("bookedWithEmail")}</H2>
              <p className="lm-muted" style={{ fontSize: 12.5, marginBottom: 10, lineHeight: 1.5 }}>
                {t("bookedWithEmailSub")}
              </p>
              <div className="lm-col" style={{ gap: 10 }}>
                {typed.map((r) => (
                  <VisitRow key={String(r["id"])} row={r} signedIn />
                ))}
              </div>
            </section>
          ) : null}
          {waiting.length > 0 ? (
            <section aria-labelledby="lm-h-wait">
              <H2 id="lm-h-wait">{t("waitingFor")}</H2>
              <div className="lm-col" style={{ gap: 10 }}>
                {waiting.map((w) => {
                  const service = studio.services.find((s) => s.id === String(w["service_id"]));
                  const person = studio.team.find((p) => p.id === String(w["team_id"] ?? ""));
                  return (
                    <div key={String(w["id"])} className="lm-visit" style={{ flexWrap: "wrap", boxShadow: "none" }}>
                      <span style={{ flex: "1 1 160px", minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 15, fontWeight: 800 }}>{service?.name ?? ""}</span>
                        <span className="lm-mono lm-muted" style={{ display: "block", fontSize: 12.5, marginTop: 3 }}>
                          {fmtDay(clock, String(w["day"]).slice(0, 10))}
                        </span>
                        <span className="lm-muted" style={{ display: "block", fontSize: 12.5, marginTop: 2 }}>
                          {person?.name ?? t("anyone")}
                        </span>
                      </span>
                      {w["state"] === "waiting" ? (
                        <button type="button" className="lm-btn" onClick={() => void leave(w["id"])}>
                          {t("offList")}
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
          <section aria-labelledby="lm-h-past">
            <H2 id="lm-h-past">{t("past")}</H2>
            <div className="lm-col" style={{ gap: 10 }}>
              {past.length === 0 ? (
                <p className="lm-muted" style={{ fontSize: 13.5 }}>
                  {t("noPast")}
                </p>
              ) : null}
              {past.map((r) => (
                <PastRow key={String(r["id"])} row={r} />
              ))}
            </div>
          </section>
        </div>
        <div className="lm-col" style={{ gap: 18 }}>
          <section aria-labelledby="lm-h-packs">
            <H2 id="lm-h-packs">{t("packsH")}</H2>
            <div className="lm-col" style={{ gap: 10 }}>
              {packs.length === 0 ? (
                <p className="lm-muted" style={{ fontSize: 13.5 }}>
                  {t("noPacks")}
                </p>
              ) : null}
              {packs.map((p) => {
                const total = Number(p["uses_total"] ?? 0);
                const left = usesLeft(p);
                const product = studio.rows.packs.find((row) => row["name"] === p["public_name"]);
                const covers = studio.services.find((s) => s.id === String(product?.["service_id"] ?? ""))?.name ?? studio.categories.find((c) => c.id === String(product?.["category_id"] ?? ""))?.name ?? "";
                const label = t("packLeft", { n: left, total });
                return (
                  <div key={String(p["id"])} className="lm-card lm-col" style={{ padding: "16px 18px", borderRadius: 18, gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ fontSize: 15, fontWeight: 800 }}>{String(p["public_name"] ?? "")}</span>
                      <span className="lm-mono6" style={{ fontSize: 13 }}>
                        {label}
                      </span>
                    </div>
                    <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={left} aria-label={label} className="lm-bar lm-pack-bar" style={{ flex: "none" }}>
                      <span style={{ width: `${String(total === 0 ? 0 : (left / total) * 100)}%` }} />
                    </div>
                    <div className="lm-muted" style={{ fontSize: 12.5 }}>
                      {[covers, p["expires_on"] ? t("packValid", { day: fmtDayYear(clock, String(p["expires_on"]).slice(0, 10)) }) : null].filter((x) => x !== null && x !== "").join(" · ")}
                    </div>
                    {product?.["service_id"] && left > 0 ? (
                      <button type="button" className="lm-btn primary" style={{ alignSelf: "flex-start" }} onClick={() => go(`/book?service=${String(product["service_id"])}&pack=${String(p["id"])}`)}>
                        {t("bookSession")}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
          <section aria-labelledby="lm-h-gifts">
            <H2 id="lm-h-gifts">{t("giftsH")}</H2>
            <div className="lm-col" style={{ gap: 10 }}>
              {held.cards.length === 0 ? (
                <p className="lm-muted" style={{ fontSize: 13.5 }}>
                  {t("noGifts")}
                </p>
              ) : null}
              {held.cards.map((g) => (
                <div key={String(g["id"])} className="lm-card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 18 }}>
                  <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon name="gift" size={20} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14.5, fontWeight: 800 }}>{String(g["label"] ?? t("giftsH"))}</span>
                    {g["expires_on"] ? (
                      <span className="lm-muted" style={{ display: "block", fontSize: 12.5, marginTop: 2 }}>
                        {t("giftUntil", { day: fmtDay(clock, dayOf(clock, `${String(g["expires_on"]).slice(0, 10)}T12:00:00Z`)) })}
                      </span>
                    ) : null}
                  </span>
                  <span className="lm-mono6" style={{ fontSize: 14 }}>
                    {fmtMoney(clock, g["balance"])}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section aria-labelledby="lm-h-prefs" className="lm-card" style={{ borderRadius: 18, overflow: "hidden" }}>
            <h2 id="lm-h-prefs" className="lm-eyebrow" style={{ padding: "14px 18px 0" }}>
              {t("settingsH")}
            </h2>
            <button type="button" role="switch" aria-checked={asks} onClick={() => void toggleAsk()} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", minHeight: 56, padding: "14px 18px", border: "none", borderBottom: "1px solid var(--border)", background: "transparent", color: "var(--fg)", textAlign: "start", whiteSpace: "normal" }}>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{t("askReviews")}</span>
              <span aria-hidden="true" className={`lm-switch-track${asks ? " on" : ""}`}>
                <span className="lm-switch-knob" />
              </span>
            </button>
            <button type="button" onClick={askDelete} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", minHeight: 52, padding: "14px 18px", border: "none", background: "transparent", color: "var(--danger)", fontSize: 14, fontWeight: 700, textAlign: "start" }}>
              <Icon name="trash-2" size={16} />
              {t("deleteDetails")}
            </button>
          </section>
          <button
            type="button"
            className="lm-link quiet"
            style={{ alignSelf: "flex-start", fontWeight: 700 }}
            onClick={() => {
              void door.signOut().finally(() => {
                setMe(null);
                go("/", { replace: true });
              });
            }}
          >
            <Icon name="log-out" size={16} />
            {t("signOut")}
          </button>
        </div>
      </div>
    </main>
  );
}
