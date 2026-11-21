/**
 * G3, the way back from the pay page (`/paid`, MON-15). It carries no booking
 * and works with no session: what this tab remembered says where to go on, and
 * a guest who arrives in a new tab or on another device is simply thanked.
 *
 * The row decides what is shown (`payViewOf`): a booked row is paid, whatever
 * the payment service last said, and money landing after the time was let go
 * is said as it is (MON-8).
 */
import { takePayReturn } from "@adminiumjs/public-client/frame";
import { useEffect, useMemo, useRef, useState } from "react";

import { useApp } from "../app.tsx";
import type { Row } from "../door.ts";
import { fmtMoney, fmtWhen } from "../format.ts";
import { Blank, Icon, Rows } from "../parts.tsx";
import { letGoLine, payViewOf, type BookingState, type PayView } from "../rules.ts";
import { keptBooking } from "../session.ts";
import { factsOf } from "./Booking.tsx";

const ASK_EVERY_MS = 2500;
/** After this long with no word, the page stops asking and says what it knows. */
const ASK_FOR_MS = 90_000;

export default function Paid() {
  const { t, door, go } = useApp();
  const kept = useMemo(keptBooking, []);
  const [target] = useState(() => takePayReturn());
  const [row, setRow] = useState<Row | null>(null);
  const [view, setView] = useState<PayView>("checking");
  const [none, setNone] = useState(false);
  const started = useRef(Date.now());

  useEffect(() => {
    if (target !== null && target !== "/b") {
      go(target, { replace: true });
      return;
    }
    if (kept === null) {
      setNone(true);
      return;
    }
    let on = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const ask = async () => {
      try {
        const read = await door.linkBooking();
        if (!on) return;
        if (read === null) {
          setNone(true);
          return;
        }
        setRow(read);
        const pay = await door.payState(read["id"], false).catch(() => null);
        if (!on) return;
        const next = payViewOf(pay?.state ?? null, String(read["state"]) as BookingState);
        setView(next);
        if (next === "paid") {
          go("/b?new=1", { replace: true });
          return;
        }
        if (next === "letGo" || next === "failed") return;
      } catch {
        // Asked again below.
      }
      if (on && Date.now() - started.current < ASK_FOR_MS) timer = setTimeout(() => void ask(), ASK_EVERY_MS);
    };
    void ask();
    return () => {
      on = false;
      if (timer !== null) clearTimeout(timer);
    };
  }, [door, go, kept, target]);

  if (none) {
    return (
      <Blank icon="circle-check" title={t("paidThanks")}>
        <button type="button" className="lm-btn primary mid" onClick={() => go("/")}>
          {t("nfCta")}
        </button>
      </Blank>
    );
  }
  return <PayCard row={row} view={view} />;
}

function PayCard({ row, view }: { row: Row | null; view: PayView }) {
  const { t, clock, studio, door, go } = useApp();
  const [busy, setBusy] = useState(false);
  const [refused, setRefused] = useState(false);
  const b = row === null ? null : factsOf(row);
  const service = studio.services.find((s) => s.id === String(row?.["service_id"] ?? ""));
  const person = studio.team.find((p) => p.id === String(row?.["team_id"] ?? ""));
  const full = b?.payMode === "full";

  const again = async () => {
    if (row === null) return;
    setBusy(true);
    setRefused(false);
    try {
      window.location.assign(await door.startPaying(row["id"], false));
    } catch {
      setRefused(true);
      setBusy(false);
    }
  };

  const letGo = b === null ? null : letGoLine(b);
  const titles: Record<PayView, string> = {
    checking: t("checking"),
    paid: t("checking"),
    confirming: t("confirming"),
    failed: t("failed"),
    letGo: letGo?.word === "lateMoney" ? t("letGoMoney", { amt: fmtMoney(clock, letGo.amount) }) : t("letGoTitle", { n: studio.holdMin }),
  };
  const badge = view === "failed" ? "danger" : view === "letGo" ? "mute" : view === "confirming" ? "warn" : "";
  const icon = view === "failed" ? "circle-x" : view === "letGo" ? "timer-off" : view === "confirming" ? "hourglass" : "loader-circle";

  return (
    <main id="lm-main" className="lm-narrow-page" style={{ maxWidth: 600, paddingBlock: "clamp(24px,5cqi,56px)" }}>
      <div role="status" className="lm-pay-card">
        <div className={`lm-badge ${badge}`}>
          <Icon name={icon} size={28} {...(icon === "loader-circle" ? { className: "lm-spin" } : {})} />
        </div>
        <h1 style={{ fontSize: "clamp(20px,3cqi,24px)", fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.3, textWrap: "balance" }}>{titles[view]}</h1>
        {view === "confirming" ? (
          <p className="lm-muted" style={{ fontSize: 14.5, lineHeight: 1.55, maxWidth: 420 }}>
            {t("confirmingSub")}
          </p>
        ) : null}
        {row !== null && b !== null ? (
          <Rows
            rows={[
              { label: t("rWhat"), value: service?.name ?? "" },
              { label: t("rWho"), value: person?.name ?? t("anyone") },
              { label: t("rWhen"), value: fmtWhen(clock, b.startsAt, Number(row["minutes"] ?? service?.minutes ?? 60)), mono: 5 },
              { label: full ? t("rPayment") : t("rDeposit"), value: fmtMoney(clock, b.asked), mono: 6 },
            ]}
          />
        ) : null}
        {refused ? (
          <div role="alert" className="lm-note danger">
            <Icon name="circle-alert" size={16} />
            {t("payRefused")}
          </div>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 4 }}>
          {view === "failed" ? (
            <>
              <button type="button" className="lm-btn primary" disabled={busy} onClick={() => void again()}>
                {full ? t("payFullAmt", { amt: fmtMoney(clock, b?.payDue ?? 0) }) : t("payDep")}
              </button>
              <button type="button" className="lm-btn" onClick={() => go(`/book?service=${String(row?.["service_id"] ?? "")}`)}>
                {t("chooseOther")}
              </button>
            </>
          ) : null}
          {view === "letGo" ? (
            <button type="button" className="lm-btn primary" onClick={() => go(`/book?service=${String(row?.["service_id"] ?? "")}`)}>
              {t("bookAgain")}
            </button>
          ) : null}
          {view === "confirming" ? (
            <button type="button" className="lm-btn" onClick={() => go("/")}>
              {t("backHome", { studio: studio.name })}
            </button>
          ) : null}
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-subtle)", lineHeight: 1.5 }}>{t("payVia")}</div>
      </div>
    </main>
  );
}
