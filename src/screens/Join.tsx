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
import { hash } from "../lib/codes.ts";
import { money } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-join.css";

const CYCLES = [
  { value: "month", label: "Monthly" },
  { value: "year", label: "Annual · 2 months free" },
] as const;

const STARTS = [
  { value: "today", label: "Start today" },
  { value: "next", label: "Start on the 1st" },
] as const;

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
  const planSel = useStore((s) => s.planSel);
  const planCycle = useStore((s) => s.planCycle);
  const set = useStore((s) => s.set);

  const annual = planCycle === "year";

  return (
    <>
      <header className="scr-join__intro">
        <h1 className="scr-join__h1">Join the Circle</h1>
        <p className="scr-join__sub">
          A monthly treatment, ten per cent off everything else, and first
          refusal on cancellations. Cancel whenever — no notice period.
        </p>
        <Segmented
          className="scr-join__cycle"
          label="Billing cycle"
          options={CYCLES}
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
                <span className="scr-join-plan__badge">Most joined</span>
              ) : null}
              <span className="scr-join-plan__name">{p.name}</span>
              <span className="scr-join-plan__pricerow">
                <span className="bk-mono scr-join-plan__price">
                  ${annual ? p.y : p.m}
                </span>
                <span className="scr-join-plan__cadence">
                  {annual ? "/year" : "/month"}
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
                {sel ? "Selected · continue" : `Choose ${p.name}`}
              </span>
            </button>
          );
        })}
      </div>

      <p className="scr-join__note">
        <Icon name="info" size={17} className="scr-join__noteicon" />
        <span>
          Membership pays for itself in one visit a month. Unused monthly
          treatments roll over once. Demo signup — no card is charged.
        </span>
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Step 2 — details and the bill
 * ------------------------------------------------------------------ */

function PayMode() {
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
      label: `${tier.name}${annual ? " · 12 months" : " · first month"}`,
      value: money(base),
      accent: false,
    },
    {
      label: planStart === "today" ? "Starts today" : "Pro-rata credit",
      value: prorata ? `−${money(-prorata)}` : "—",
      accent: false,
    },
    { label: "Joining fee", value: "Waived", accent: true },
  ];

  const confirm = (): void => {
    if (!planEmail.trim()) {
      showToast("Add an email so we can send the card", "warn");
      return;
    }
    set({ planStep: "done", member: true });
    showToast("Welcome to the Circle");
  };

  return (
    <>
      <BackLink onClick={() => set({ planStep: "pick" })}>Other plans</BackLink>
      <h1 className="scr-join__payh1">Confirm your membership</h1>

      <div className="scr-join__pay">
        <div className="scr-join__details">
          <h2 className="scr-join__panellabel">Your details</h2>
          <div className="scr-join__fields">
            <Field label="Full name" className="scr-join__field--wide">
              {(control) => (
                <TextInput
                  {...control}
                  value={planName}
                  placeholder="Ava Reyes"
                  onChange={(v) => set({ planName: v })}
                />
              )}
            </Field>
            <Field label="Email">
              {(control) => (
                <TextInput
                  {...control}
                  type="email"
                  inputMode="email"
                  value={planEmail}
                  placeholder="you@email.com"
                  onChange={(v) => set({ planEmail: v })}
                />
              )}
            </Field>
            <Field label="Mobile">
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

          <h2 className="scr-join__panellabel">Starts</h2>
          <div className="scr-join__starts">
            {STARTS.map((s) => (
              <Chip
                key={s.value}
                label={s.label}
                active={planStart === s.value}
                onClick={() => set({ planStart: s.value })}
              />
            ))}
          </div>
        </div>

        <div className="scr-join__summary">
          <h2 className="scr-join__summaryname">
            {tier.name} · {annual ? "annual" : "monthly"}
          </h2>
          <dl className="scr-join__totals">
            {totals.map((t) => (
              <div className="scr-join__total" key={t.label}>
                <dt className="scr-join__totallabel">{t.label}</dt>
                <dd
                  className="bk-mono scr-join__totalvalue"
                  data-accent={t.accent ? "true" : "false"}
                >
                  {t.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="scr-join__rule" />
          <div className="scr-join__due">
            <span className="scr-join__duelabel">Due today</span>
            <span className="bk-mono scr-join__duevalue">{money(due)}</span>
          </div>
          <Button icon="gem" iconSize={17} size="lg" full onClick={confirm}>
            Start my membership
          </Button>
          <p className="scr-join__fine">
            Cancel any time from your account. Demo only — nothing is charged.
          </p>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Step 3 — welcome
 * ------------------------------------------------------------------ */

function DoneMode() {
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
    { label: "Plan", value: tier.name, mono: false },
    {
      label: "Billing",
      value: `${annual ? "Annually" : "Monthly"} · ${money(base)}`,
      mono: true,
    },
    { label: "Member number", value: memberNo, mono: true },
  ];

  return (
    <div className="scr-join__done">
      <span className="scr-join__gem">
        <Icon name="gem" size={32} />
      </span>
      <h1 className="scr-join__doneh1">You're in the Circle</h1>
      <p className="scr-join__donesub">
        Your first treatment credit is already sitting in your account, and
        every booking from now takes ten per cent off automatically.
      </p>

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
        <Button onClick={() => go("rewards")}>See your rewards</Button>
        <Button variant="ghost" onClick={() => startBooking(null)}>
          Use my credit
        </Button>
      </div>
    </div>
  );
}
