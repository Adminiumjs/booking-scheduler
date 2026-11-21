/**
 * K8 Waiting list (comp L2 300–325): by day, who waits for what, and the times
 * that fit. Fits follow the guest's rule, so nothing inside the notice is
 * offered (cQ33). An offer names one person and one time (BN-18).
 */
import { Clock, Send, Sparkles } from "lucide-react";

import { useData, useEnv, useRun } from "../env.tsx";
import { byId, firstName, freedBy, type WaitFit } from "../facts.ts";
import { useFmt } from "../format.ts";
import { useDeskT } from "../i18n/index.ts";
import { openSheet, useDesk } from "../store.ts";
import { instantOf } from "../time.ts";
import { Chip, Fig } from "../ui.tsx";
import { same, text, type Id, type Row } from "../wire.ts";

const SHOWN = 8;

function Entry({ entry }: { entry: Row }) {
  const { door } = useEnv();
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const fits = useDesk((s) => s.fits[String(entry.id)]) ?? [];
  const { busy, run } = useRun();
  const { zone } = door.facts();
  const day = String(entry["day"]).slice(0, 10);
  const state = String(entry["state"]);
  const mayOffer = door.who().can("bookings", "create");
  const service = text(byId(data.services, entry["service_id"])?.["name"]) ?? "";
  const named = byId(data.team, entry["team_id"]);
  const offer = (fit: WaitFit, freed: Id | null) => openSheet({ kind: "offer", entryId: entry.id, person: fit.person, day, clock: fit.clock, freedBy: freed });
  const at = (clock: string) => fmt.time(instantOf(day, clock, zone));
  const offered = state === "offered" ? data.bookings.find((b) => same(b["waitlist_id"], entry.id) && b["state"] === "offered") : undefined;
  const freedFit = fits.map((fit) => ({ fit, freed: freedBy(data, entry, fit, zone) })).find((x) => x.freed !== undefined);

  let line;
  if (state === "offered") {
    line = (
      <div className="lm-fit is-info">
        <Send size={15} aria-hidden="true" />
        <span>{offered === undefined ? t("wait.offered") : t("wait.offeredAt", { time: fmt.time(offered["made_at"]) })}</span>
      </div>
    );
  } else if (fits.length === 0) {
    line = (
      <div className="lm-fit">
        <Clock size={15} aria-hidden="true" />
        <span>{t("wait.noFit")}</span>
      </div>
    );
  } else if (freedFit !== undefined) {
    line = (
      <div className="lm-fit is-pos">
        <Sparkles size={15} aria-hidden="true" />
        <span>{t("wait.fitsFreed", { time: at(freedFit.fit.clock), who: firstName(byId(data.team, freedFit.fit.person)?.["name"]), cust: text(freedFit.freed!["name"]) ?? t("common.noName") })}</span>
        {mayOffer && (
          <button type="button" className="lm-btn lm-btn--primary" onClick={() => offer(freedFit.fit, freedFit.freed!.id)}>
            {t("wait.offer")}
          </button>
        )}
      </div>
    );
  } else {
    line = (
      <div className="lm-fit is-pos">
        <Sparkles size={15} aria-hidden="true" />
        <span>{t("wait.fits", {}, fits.length)}</span>
        {mayOffer && (
          <div className="lm-fit-chips">
            {fits.slice(0, SHOWN).map((fit) => (
              <button key={`${fit.clock}-${String(fit.person)}`} type="button" className="lm-slot" aria-label={t("wait.offerAt", { time: at(fit.clock) })} onClick={() => offer(fit, null)}>
                {at(fit.clock)}
              </button>
            ))}
            {fits.length > SHOWN && <span className="lm-muted-sm">{t("wait.more", {}, fits.length - SHOWN)}</span>}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="lm-wait">
      <div className="lm-wait-head">
        <span>
          <strong>{text(entry["name"]) ?? t("common.noName")}</strong>
          <small>
            {service} · {named === undefined ? t("booking.anyone") : t("wait.withWho", { who: firstName(named["name"]) })}
          </small>
        </span>
        <Chip tone={state === "offered" ? "info" : "neutral"}>{t(state === "offered" ? "wait.stateOffered" : "wait.stateWaiting")}</Chip>
        {state === "waiting" && door.who().can("waitlist", "update") && (
          <button
            type="button"
            className="lm-btn"
            disabled={busy}
            onClick={() =>
              void run(async (d) => {
                await d.closeWaiting(entry);
                return t("toast.waitClosed", { name: text(entry["name"]) ?? "" });
              })
            }
          >
            {t("wait.close")}
          </button>
        )}
      </div>
      {line}
    </div>
  );
}

export function WaitingScreen() {
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const open = data.waitlist.filter((entry) => entry["state"] === "waiting" || entry["state"] === "offered");
  const days = [...new Set(open.map((entry) => String(entry["day"]).slice(0, 10)))].sort();
  return (
    <div className="lm-page">
      <h1 className="lm-page-title">{t("nav.waiting")}</h1>
      {days.length === 0 && (
        <div className="lm-empty-box">
          <strong>{t("wait.emptyTitle")}</strong>
          <span>{t("wait.emptySub")}</span>
        </div>
      )}
      {days.map((day) => (
        <section key={day} className="lm-wait-day" aria-label={fmt.day(day)}>
          <h2><Fig>{fmt.day(day)}</Fig></h2>
          {open
            .filter((entry) => String(entry["day"]).slice(0, 10) === day)
            .map((entry) => (
              <Entry key={String(entry.id)} entry={entry} />
            ))}
        </section>
      ))}
      <p className="lm-hint">{t("wait.note")}</p>
    </div>
  );
}
