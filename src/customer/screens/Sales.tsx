/**
 * G12 Gift cards and G13 Packs (the comp's lines 753–807), bought through
 * `purchases` on the pay page (cQ25). The amount and the pack are the studio's
 * rows; the page names which one and never sends a figure. A pack needs someone
 * to hold it, so Buy asks for sign-in first.
 */
import { rememberPayReturn } from "@adminiumjs/public-client/frame";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { A, useApp } from "../app.tsx";
import { addDays, dayOf, fmtDay, fmtMoney } from "../format.ts";
import { Err, Icon } from "../parts.tsx";
import { GIFT_MESSAGE_MAX, NAME_MAX } from "../../limits.ts";
import { looksLikeEmail, refusalOf } from "../rules.ts";
import { PURCHASE_SLOT } from "../session.ts";

const KEPT = PURCHASE_SLOT;

interface KeptPurchase {
  kind: "card" | "pack";
  id: string;
  to?: string;
  toEmail?: string;
  sendOn?: string | null;
  pack?: string;
}

const keep = (p: KeptPurchase) => {
  try {
    sessionStorage.setItem(KEPT, JSON.stringify(p));
  } catch {
    // the way back then says a plain thank you
  }
};
const kept = (): KeptPurchase | null => {
  try {
    const raw = sessionStorage.getItem(KEPT);
    return raw === null ? null : (JSON.parse(raw) as KeptPurchase);
  } catch {
    return null;
  }
};

/** The purchase, back from the pay page: paid, still with the bank, or not finished. */
function usePurchaseBack(active: boolean) {
  const { door } = useApp();
  const [state, setState] = useState<"checking" | "paid" | "confirming" | "failed">("checking");
  const [purchase] = useState(kept);
  useEffect(() => {
    if (!active || purchase === null) return;
    let on = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let tries = 0;
    const ask = async () => {
      tries += 1;
      const word = await door.purchaseState(purchase.id).catch(() => null);
      if (!on) return;
      if (word === "paid") return setState("paid");
      if (word === "failed" || word === "expired") return setState("failed");
      if (word === "confirming") setState("confirming");
      if (tries < 40) timer = setTimeout(() => void ask(), 2500);
    };
    void ask();
    return () => {
      on = false;
      if (timer !== null) clearTimeout(timer);
    };
  }, [active, door, purchase]);
  return { state, purchase };
}

function Back({ active }: { active: boolean }) {
  const { t, clock, studio, go } = useApp();
  const { state, purchase } = usePurchaseBack(active);
  if (purchase === null) {
    return (
      <div role="status" className="lm-pay-card">
        <div className="lm-badge pos">
          <Icon name="gift" size={28} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>{t("paidThanks")}</h1>
      </div>
    );
  }
  if (state !== "paid") {
    const title = state === "failed" ? t("failed") : state === "confirming" ? t("confirming") : t("checking");
    return (
      <div role="status" className="lm-pay-card">
        <div className={`lm-badge ${state === "failed" ? "danger" : state === "confirming" ? "warn" : ""}`}>
          <Icon name={state === "failed" ? "circle-x" : state === "confirming" ? "hourglass" : "loader-circle"} size={28} {...(state === "checking" ? { className: "lm-spin" } : {})} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, textWrap: "balance" }}>{title}</h1>
        {state === "confirming" ? <p className="lm-muted">{t("confirmingSub")}</p> : null}
        {state === "failed" ? (
          <button type="button" className="lm-btn primary" onClick={() => go(purchase.kind === "pack" ? "/packs" : "/gift-cards", { replace: true })}>
            {t("tryAgain")}
          </button>
        ) : null}
      </div>
    );
  }
  const title = purchase.kind === "pack" ? t("packDone", { pack: purchase.pack ?? "" }) : purchase.sendOn ? t("gDoneDate", { name: purchase.to ?? "", day: fmtDay(clock, purchase.sendOn) }) : t("gDoneNow", { name: purchase.to ?? "" });
  return (
    <div role="status" className="lm-pay-card" style={{ gap: 12 }}>
      <div className="lm-badge pos">
        <Icon name={purchase.kind === "pack" ? "package" : "gift"} size={28} />
      </div>
      <h1 style={{ fontSize: "clamp(22px,3.6cqi,26px)", fontWeight: 800, letterSpacing: "-.02em", textWrap: "balance" }}>{title}</h1>
      <p className="lm-muted" style={{ fontSize: 14 }}>
        {purchase.kind === "pack" ? t("packDoneSub") : t("gDoneSub", { email: purchase.toEmail ?? "" })}
      </p>
      {purchase.kind === "pack" ? (
        <A to="/account" className="lm-btn" style={{ marginTop: 6 }}>
          {t("seeVisits")}
        </A>
      ) : (
        <A to="/" className="lm-btn" style={{ marginTop: 6 }}>
          {t("backHome", { studio: studio.name })}
        </A>
      )}
    </div>
  );
}

export function GiftCards() {
  const { t, clock, studio, door, me, route, locale, now } = useApp();
  const back = route.query.get("paid") === "1";
  const amounts = studio.rows.giftAmounts;
  const [amountId, setAmountId] = useState<string | null>(amounts[1] !== undefined ? String(amounts[1]["id"]) : amounts[0] !== undefined ? String(amounts[0]["id"]) : null);
  const [f, setF] = useState({ to: "", toEmail: "", from: String(me?.["name"] ?? ""), buyer: String(me?.["email"] ?? ""), msg: "", when: "now" as "now" | "date", date: "" });
  const [errs, setErrs] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  // Kept while the order is the same, so a lost reply is not a second card; new as soon as anything in it changes.
  const clientKey = useRef<{ sig: string; key: string } | null>(null);
  const today = dayOf(clock, new Date(now()).toISOString());
  const lastDay = addDays(today, 365);
  const amount = amounts.find((a) => String(a["id"]) === amountId);
  const set = (k: keyof typeof f, v: string) => {
    setF({ ...f, [k]: v });
    setErrs({ ...errs, [k]: false });
  };
  const canPay = studio.ownerSwitch === "on" && studio.rows.paymentsOnline;

  const keyFor = (amount_: string, sendOn: string | null) => {
    const sig = JSON.stringify([amount_, f.to.trim(), f.toEmail.trim(), f.from.trim(), f.buyer.trim(), f.msg.trim(), sendOn]);
    if (clientKey.current?.sig !== sig) clientKey.current = { sig, key: door.newKey() };
    return clientKey.current.key;
  };

  const pay = async (e: FormEvent) => {
    e.preventDefault();
    const bad: Record<string, boolean> = {};
    if (f.to.trim() === "") bad["to"] = true;
    if (!looksLikeEmail(f.toEmail)) bad["toEmail"] = true;
    if (f.from.trim() === "") bad["from"] = true;
    if (!looksLikeEmail(f.buyer)) bad["buyer"] = true;
    if (f.when === "date" && (f.date === "" || f.date < today || f.date > lastDay)) bad["date"] = true;
    setErrs(bad);
    const first = ["to", "toEmail", "from", "buyer", "date"].find((k) => bad[k]);
    if (first !== undefined) {
      document.getElementById(`lm-g-${first}`)?.focus();
      return;
    }
    if (amountId === null) return;
    setBusy(true);
    setProblem(null);
    try {
      const sendOn = f.when === "date" ? f.date : null;
      const made = await door.buyCard({ gift_amount_id: amountId, to_name: f.to.trim(), to_email: f.toEmail.trim(), ...(f.msg.trim() === "" ? {} : { message: f.msg.trim() }), ...(sendOn === null ? {} : { send_on: sendOn }) }, { buyer_name: f.from.trim(), buyer_email: f.buyer.trim(), language: locale }, keyFor(amountId, sendOn));
      keep({ kind: "card", id: String(made.row["id"]), to: f.to.trim(), toEmail: f.toEmail.trim(), sendOn });
      if (made.payUrl === null && !door.holdsSale()) {
        // A retry of an order whose reply was lost: its way to pay went by e-mail, not in this reply.
        setProblem(t("saleReplay"));
        setBusy(false);
        return;
      }
      rememberPayReturn("/gift-cards?paid=1");
      window.location.assign(made.payUrl ?? (await door.payPurchase(made.row["id"])));
    } catch (error) {
      const why = refusalOf(error, me !== null);
      setProblem(why === "paused" || why === "off" ? t("gOff") : why === "limit-guest" || why === "rate" ? t("rateLimited") : why === "network" ? t("offline") : t("somethingWrong"));
      setBusy(false);
    }
  };

  if (back) {
    return (
      <main id="lm-main" className="lm-narrow-page" style={{ maxWidth: 640, paddingBlock: "clamp(24px,4cqi,44px)" }}>
        <Back active />
      </main>
    );
  }
  const field = (k: "to" | "toEmail" | "from" | "buyer", label: string, error: string, type = "text") => (
    <div className="lm-field">
      <label htmlFor={`lm-g-${k}`}>{label}</label>
      <input id={`lm-g-${k}`} className="lm-input" type={type} dir={type === "email" ? "ltr" : "auto"} maxLength={type === "email" ? 254 : NAME_MAX} value={f[k]} aria-invalid={errs[k] === true} {...(errs[k] === true ? { "aria-describedby": `lm-g-${k}-err` } : {})} onChange={(e) => set(k, e.target.value)} />
      {errs[k] === true ? <Err id={`lm-g-${k}-err`}>{error}</Err> : null}
    </div>
  );
  return (
    <main id="lm-main" className="lm-narrow-page" style={{ maxWidth: 640, paddingBlock: "clamp(24px,4cqi,44px)" }}>
      <h1 className="lm-title">{t("giftsTitle")}</h1>
      <p className="lm-sub">{t("giftsIntro")}</p>
      {!canPay || !door.addOn("offers") ? (
        <div className="lm-note warn">
          <Icon name="info" size={16} />
          {t("gOff")}
        </div>
      ) : (
        <form noValidate onSubmit={(e) => void pay(e)} className="lm-card lm-col" style={{ padding: "clamp(20px,3cqi,26px)", gap: 18 }}>
          <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
            <legend className="lm-label" style={{ marginBottom: 9 }}>
              {t("gAmount")}
            </legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {amounts.map((a) => (
                <button key={String(a["id"])} type="button" className="lm-chip lm-mono6" style={{ minWidth: 72 }} aria-pressed={String(a["id"]) === amountId} onClick={() => setAmountId(String(a["id"]))}>
                  {fmtMoney(clock, a["amount"])}
                </button>
              ))}
            </div>
          </fieldset>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(220px,100%),1fr))", gap: 14 }}>
            {field("to", t("gTo"), t("errTo"))}
            {field("toEmail", t("gToEmail"), t("errEmail"), "email")}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(220px,100%),1fr))", gap: 14 }}>
            {field("from", t("gFrom"), t("errFrom"))}
            {field("buyer", t("gYourEmail"), t("errEmail"), "email")}
          </div>
          <div className="lm-field">
            <label htmlFor="lm-g-msg">{t("gMsg")}</label>
            <textarea id="lm-g-msg" className="lm-input" dir="auto" rows={3} maxLength={GIFT_MESSAGE_MAX} value={f.msg} onChange={(e) => set("msg", e.target.value)} />
          </div>
          <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
            <legend className="lm-label" style={{ marginBottom: 9 }}>
              {t("gWhen")}
            </legend>
            <div role="radiogroup" aria-label={t("gWhen")} className="lm-seg">
              {(["now", "date"] as const).map((w) => (
                <button key={w} type="button" role="radio" aria-checked={f.when === w} onClick={() => set("when", w)}>
                  {w === "now" ? t("gNow") : t("gOnDate")}
                </button>
              ))}
            </div>
            {f.when === "date" ? (
              <div className="lm-field" style={{ marginTop: 12 }}>
                <label htmlFor="lm-g-date">{t("gDate")}</label>
                <input id="lm-g-date" className="lm-input" style={{ maxWidth: 220 }} type="date" min={today} max={lastDay} value={f.date} aria-invalid={errs["date"] === true} onChange={(e) => set("date", e.target.value)} />
                {f.date !== "" && errs["date"] !== true ? <div className="lm-hint">{fmtDay(clock, f.date)}</div> : null}
                {errs["date"] === true ? <Err>{f.date > lastDay ? t("errDateFar") : t("errDate")}</Err> : null}
              </div>
            ) : null}
          </fieldset>
          {problem === null ? null : (
            <div role="alert" className="lm-note danger">
              <Icon name="circle-alert" size={16} />
              {problem}
            </div>
          )}
          <button type="submit" className="lm-btn primary large" disabled={busy || amount === undefined}>
            {t("payAmt", { amt: fmtMoney(clock, amount?.["amount"]) })}
          </button>
          <div style={{ fontSize: 12, color: "var(--fg-subtle)", lineHeight: 1.5 }}>{t("gPayVia")}</div>
        </form>
      )}
    </main>
  );
}

export function Packs() {
  const { t, clock, studio, door, me, route, go, locale } = useApp();
  const back = route.query.get("paid") === "1";
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const keys = useRef(new Map<string, string>());
  const canPay = studio.ownerSwitch === "on" && studio.rows.paymentsOnline && door.addOn("offers");

  const buy = async (pack: Record<string, unknown>) => {
    if (me === null) {
      go("/sign-in");
      return;
    }
    const id = String(pack["id"]);
    if (!keys.current.has(id)) keys.current.set(id, door.newKey());
    setBusy(id);
    setProblem(null);
    try {
      const made = await door.buyPack(id, { buyer_name: String(me["name"] ?? ""), buyer_email: String(me["email"] ?? ""), language: locale }, keys.current.get(id)!);
      keep({ kind: "pack", id: String(made.row["id"]), pack: String(pack["name"] ?? "") });
      if (made.payUrl === null && !door.holdsSale()) {
        setProblem(t("saleReplay"));
        setBusy(null);
        return;
      }
      rememberPayReturn("/packs?paid=1");
      window.location.assign(made.payUrl ?? (await door.payPurchase(made.row["id"])));
    } catch (error) {
      const why = refusalOf(error, true);
      setProblem(why === "paused" || why === "off" ? t("packsOff") : why === "network" ? t("offline") : t("somethingWrong"));
      setBusy(null);
    }
  };

  if (back) {
    return (
      <main id="lm-main" className="lm-narrow-page" style={{ maxWidth: 640, paddingBlock: "clamp(24px,4cqi,44px)" }}>
        <Back active />
      </main>
    );
  }
  return (
    <main id="lm-main" className="lm-narrow-page" style={{ maxWidth: 1000, paddingBlock: "clamp(24px,4cqi,44px)" }}>
      <h1 className="lm-title">{t("packsTitle")}</h1>
      <p className="lm-sub">{t("packsIntro")}</p>
      {!canPay ? (
        <div className="lm-note warn" style={{ marginBottom: 16 }}>
          <Icon name="info" size={16} />
          {t("packsOff")}
        </div>
      ) : null}
      {problem === null ? null : (
        <div role="alert" className="lm-note danger" style={{ marginBottom: 16 }}>
          <Icon name="circle-alert" size={16} />
          {problem}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(270px,100%),1fr))", gap: 14 }}>
        {studio.rows.packs.map((p) => {
          const service = studio.services.find((s) => s.id === String(p["service_id"] ?? ""));
          const category = studio.categories.find((c) => c.id === String(p["category_id"] ?? service?.categoryId ?? ""));
          const days = Number(p["valid_days"] ?? 365);
          const months = Math.round(days / 30.4);
          return (
            <div key={String(p["id"])} className="lm-card lm-col" style={{ overflow: "hidden" }}>
              <div aria-hidden="true" style={{ height: 120, borderBottom: "1px solid var(--border)", display: "flex" }}>
                <div style={{ flex: 1, display: "flex" }}>
                  <span style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--accent-soft)", color: "var(--accent)" }}>
                    <Icon name={category?.icon ?? "package"} size={40} />
                  </span>
                </div>
              </div>
              <div className="lm-col" style={{ padding: "16px 18px 18px", gap: 8, flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontSize: 17, fontWeight: 800 }}>{String(p["name"] ?? "")}</span>
                  <span className="lm-mono6" style={{ fontSize: 16 }}>
                    {fmtMoney(clock, p["price"])}
                  </span>
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.5 }}><bdi>{t("packCovers", { n: Number(p["uses"] ?? 0), what: service?.name ?? category?.name ?? "" })}</bdi></div>
                <div className="lm-muted" style={{ fontSize: 12.5 }}>
                  {days % 365 === 0 || Math.abs(days / 30.4 - months) < 0.2 ? t("packValidMonths", { n: months }) : t("packValidFor", { n: days })}
                </div>
                <button type="button" className="lm-btn primary" style={{ marginTop: "auto" }} disabled={!canPay || busy !== null} aria-label={t("buyLabel", { pack: String(p["name"] ?? "") })} onClick={() => void buy(p)}>
                  {me === null ? t("buySignIn") : t("buy")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
