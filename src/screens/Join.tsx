/*
 * JOIN THE CIRCLE (view: 'join') — membership signup, three modes.
 *
 * `planStep` drives the whole screen: 'pick' → 'pay' → 'done'. The comp made
 * that a single template with three `sc-if` blocks; here each mode is its own
 * component so nothing from one leaks into another, and the money arithmetic
 * lives once in `quote()` because both 'pay' and 'done' need it.
 *
 * Picking is deliberately two taps — the first selects a tier, the second
 * (on the already-selected card) advances — so the three cards stay
 * comparable while you make up your mind.
 */

import { useEffect } from "react";

import {
  BackLink,
  Button,
  Chip,
  Field,
  Icon,
  Segmented,
  TextInput,
} from "../components/index.ts";
import {
  MEMBERSHIP_TIERS,
  MEMBER_NUMBER_BASE,
  MEMBER_NUMBER_SPAN,
  PRO_RATA_SHARE,
  type MembershipTier,
} from "../data/screens/join.ts";
import { useT, type MessageKey, type TFunction } from "../i18n/index.tsx";
import { hash } from "../lib/codes.ts";
import { money, wholeMoney } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-join.css";

/* Module scope has no hook, so the options carry keys and the render site
 * translates them. */
const CYCLES: { value: "month" | "year"; labelKey: MessageKey }[] = [
  { value: "month", labelKey: "screensB.join.cycleMonthly" },
  { value: "year", labelKey: "screensB.join.cycleAnnual" },
];

const STARTS: { value: "today" | "next"; labelKey: MessageKey }[] = [
  { value: "today", labelKey: "screensB.join.startToday" },
  { value: "next", labelKey: "screensB.join.startFirst" },
];

interface Quote {
  /** The selected tier, falling back to the featured one. */
  tier: MembershipTier;
  annual: boolean;
  /** Headline price for the chosen cycle. */
  base: number;
  /** Credit for the unused part of the period — zero when starting today. */
  prorata: number;
  due: number;
}

function quote(planSel: string, planCycle: string, planStart: string): Quote {
  const tier =
    MEMBERSHIP_TIERS.find((p) => p.id === planSel) ?? MEMBERSHIP_TIERS[1];
  const annual = planCycle === "year";
  const base = annual ? tier.y : tier.m;
  const prorata =
    planStart === "today" ? 0 : -Math.round(base * PRO_RATA_SHARE);
  return { tier, annual, base, prorata, due: base + prorata };
}

/** Both money rows read the same way; the sentence lives in one message. */
function billingLine(t: TFunction, annual: boolean, amount: string): string {
  return t(
    annual ? "screensB.join.billingAnnually" : "screensB.join.billingMonthly",
    { amount },
  );
}

export default function Join() {
  const planStep = useStore((s) => s.planStep);

  /* Each mode is a fresh page as far as the reader is concerned, so it starts
   * at the top — the comp did this imperatively inside its handlers, which
   * missed the back link. */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [planStep]);

  return (
    <section className="bk-screen bk-page scr-join">
      {planStep === "pay" ? <PayMode /> : null}
      {planStep === "done" ? <DoneMode /> : null}
      {planStep !== "pay" && planStep !== "done" ? <PickMode /> : null}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Step 1 — choose a tier
 * ------------------------------------------------------------------ */

function PickMode() {
  const t = useT();
  const planSel = useStore((s) => s.planSel);
  const planCycle = useStore((s) => s.planCycle);
  const set = useStore((s) => s.set);

  const annual = planCycle === "year";
  const cycles = CYCLES.map((c) => ({ value: c.value, label: t(c.labelKey) }));

  return (
    <>
      <header className="scr-join__intro">
        <h1 className="scr-join__h1">{t("screensB.join.title")}</h1>
        <p className="scr-join__sub">{t("screensB.join.sub")}</p>
        <Segmented
          className="scr-join__cycle"
          label={t("screensB.join.billingCycle")}
          options={cycles}
          value={annual ? "year" : "month"}
          onChange={(v) => set({ planCycle: v })}
        />
      </header>

      <div className="scr-join__plans">
        {MEMBERSHIP_TIERS.map((p) => {
          const sel = planSel === p.id;
          return (
            <button
              type="button"
              className="bk-card scr-join-plan"
              data-selected={sel ? "true" : "false"}
              aria-pressed={sel}
              key={p.id}
              onClick={() =>
                set(sel ? { planStep: "pay" } : { planSel: p.id })
              }
            >
              {p.featured ? (
                <span className="scr-join-plan__badge">
                  {t("screensB.join.mostJoined")}
                </span>
              ) : null}
              <span className="scr-join-plan__name">{p.name}</span>
              <span className="scr-join-plan__pricerow">
                {/* The comp wrote `$` by hand, which puts the symbol on the
                    wrong side in fr-FR and uses the wrong digits in ar-EG. */}
                <span className="bk-mono scr-join-plan__price">
                  {wholeMoney(annual ? p.y : p.m)}
                </span>
                <span className="scr-join-plan__cadence">
                  {t(annual ? "screensB.join.perYear" : "screensB.join.perMonth")}
                </span>
              </span>
              <span className="scr-join-plan__blurb">{p.blurb}</span>
              <span className="scr-join-plan__perks">
                {p.perks.map((k) => (
                  <span className="scr-join-plan__perk" key={k}>
                    <Icon
                      name="check"
                      size={15}
                      className="scr-join-plan__tick"
                    />
                    {k}
                  </span>
                ))}
              </span>
              <span className="scr-join-plan__cta">
                {sel
                  ? t("screensB.join.selected")
                  : t("screensB.join.choose", { name: p.name })}
              </span>
            </button>
          );
        })}
      </div>

      <p className="scr-join__note">
        <Icon name="info" size={17} className="scr-join__noteicon" />
        <span>{t("screensB.join.note")}</span>
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Step 2 — details and the bill
 * ------------------------------------------------------------------ */

function PayMode() {
  const t = useT();
  const planSel = useStore((s) => s.planSel);
  const planCycle = useStore((s) => s.planCycle);
  const planStart = useStore((s) => s.planStart);
  const planName = useStore((s) => s.planName);
  const planEmail = useStore((s) => s.planEmail);
  const planPhone = useStore((s) => s.planPhone);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const { tier, annual, base, prorata, due } = quote(
    planSel,
    planCycle,
    planStart,
  );

  const totals = [
    {
      label: t(
        annual ? "screensB.join.lineAnnual" : "screensB.join.lineFirstMonth",
        { name: tier.name },
      ),
      value: money(base),
      accent: false,
    },
    {
      label: t(
        planStart === "today"
          ? "screensB.join.startsToday"
          : "screensB.join.prorata",
      ),
      value: prorata ? `−${money(-prorata)}` : "—",
      accent: false,
    },
    {
      label: t("screensB.join.joiningFee"),
      value: t("screensB.join.waived"),
      accent: true,
    },
  ];

  const confirm = (): void => {
    if (!planEmail.trim()) {
      showToast(t("screensB.join.errEmail"), "warn");
      return;
    }
    set({ planStep: "done", member: true });
    showToast(t("screensB.join.welcome"));
  };

  return (
    <>
      <BackLink onClick={() => set({ planStep: "pick" })}>
        {t("screensB.join.otherPlans")}
      </BackLink>
      <h1 className="scr-join__payh1">{t("screensB.join.payTitle")}</h1>

      <div className="scr-join__pay">
        <div className="scr-join__details">
          <h2 className="scr-join__panellabel">
            {t("screensB.join.yourDetails")}
          </h2>
          <div className="scr-join__fields">
            <Field
              label={t("screensB.common.fullName")}
              className="scr-join__field--wide"
            >
              {(control) => (
                <TextInput
                  {...control}
                  value={planName}
                  /* The demo client's own name — fiction, not chrome. */
                  placeholder="Ava Reyes"
                  onChange={(v) => set({ planName: v })}
                />
              )}
            </Field>
            <Field label={t("screensB.common.email")}>
              {(control) => (
                <TextInput
                  {...control}
                  type="email"
                  inputMode="email"
                  value={planEmail}
                  placeholder={t("screensB.common.phEmail")}
                  onChange={(v) => set({ planEmail: v })}
                />
              )}
            </Field>
            <Field label={t("screensB.join.mobile")}>
              {(control) => (
                <TextInput
                  {...control}
                  type="tel"
                  inputMode="tel"
                  value={planPhone}
                  placeholder="(415) 555-0182"
                  onChange={(v) => set({ planPhone: v })}
                />
              )}
            </Field>
          </div>

          <h2 className="scr-join__panellabel">{t("screensB.join.starts")}</h2>
          <div className="scr-join__starts">
            {STARTS.map((s) => (
              <Chip
                key={s.value}
                label={t(s.labelKey)}
                active={planStart === s.value}
                onClick={() => set({ planStart: s.value })}
              />
            ))}
          </div>
        </div>

        <div className="scr-join__summary">
          <h2 className="scr-join__summaryname">
            {t(
              annual
                ? "screensB.join.summaryAnnual"
                : "screensB.join.summaryMonthly",
              { name: tier.name },
            )}
          </h2>
          <dl className="scr-join__totals">
            {totals.map((row) => (
              <div className="scr-join__total" key={row.label}>
                <dt className="scr-join__totallabel">{row.label}</dt>
                <dd
                  className="bk-mono scr-join__totalvalue"
                  data-accent={row.accent ? "true" : "false"}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="scr-join__rule" />
          <div className="scr-join__due">
            <span className="scr-join__duelabel">
              {t("screensB.join.dueToday")}
            </span>
            <span className="bk-mono scr-join__duevalue">{money(due)}</span>
          </div>
          <Button icon="gem" iconSize={17} size="lg" full onClick={confirm}>
            {t("screensB.join.startMembership")}
          </Button>
          <p className="scr-join__fine">{t("screensB.join.fine")}</p>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Step 3 — welcome
 * ------------------------------------------------------------------ */

function DoneMode() {
  const t = useT();
  const planSel = useStore((s) => s.planSel);
  const planCycle = useStore((s) => s.planCycle);
  const planStart = useStore((s) => s.planStart);
  const planEmail = useStore((s) => s.planEmail);
  const go = useStore((s) => s.go);
  const startBooking = useStore((s) => s.startBooking);

  const { tier, annual, base } = quote(planSel, planCycle, planStart);
  const memberNo = `CIR-${
    MEMBER_NUMBER_BASE + (hash(planEmail || "a") % MEMBER_NUMBER_SPAN)
  }`;

  const rows = [
    { label: t("screensB.join.rowPlan"), value: tier.name, mono: false },
    {
      label: t("screensB.join.rowBilling"),
      value: billingLine(t, annual, money(base)),
      mono: true,
    },
    { label: t("screensB.join.rowMemberNo"), value: memberNo, mono: true },
  ];

  return (
    <div className="scr-join__done">
      <span className="scr-join__gem">
        <Icon name="gem" size={32} />
      </span>
      <h1 className="scr-join__doneh1">{t("screensB.join.doneTitle")}</h1>
      <p className="scr-join__donesub">{t("screensB.join.doneSub")}</p>

      <dl className="scr-join__donecard">
        {rows.map((r) => (
          <div className="scr-join__donerow" key={r.label}>
            <dt className="scr-join__donelabel">{r.label}</dt>
            <dd
              className={
                r.mono
                  ? "bk-mono scr-join__donevalue"
                  : "scr-join__donevalue"
              }
            >
              {r.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="scr-join__doneactions">
        <Button onClick={() => go("rewards")}>
          {t("screensB.join.seeRewards")}
        </Button>
        <Button variant="ghost" onClick={() => startBooking(null)}>
          {t("screensB.join.useCredit")}
        </Button>
      </div>
    </div>
  );
}
