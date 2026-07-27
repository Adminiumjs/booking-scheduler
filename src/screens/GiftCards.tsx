/*
 * Gift cards (spec §3.6, §6.9) — view `giftcards`.
 *
 * Four sub-steps driven by `gcStep`: design → details → pay → done. The store
 * owns every transition, validation string and the collision-free code (R7);
 * this screen is a pure view over it.
 *
 * Ruling R9: the amount chips keep the comp's `money()` formatting, so they
 * read "$50.00" rather than "$50" — deliberate fidelity, not a bug.
 */

import { useId } from "react";

import {
  Banner,
  Button,
  BackLink,
  Chip,
  CodePill,
  Field,
  GiftStepper,
  Icon,
  Segmented,
  SuccessTile,
  TextArea,
  TextInput,
  placeholderBackground,
  useIsDark,
} from "../components/index.ts";
import { data } from "../data/source.ts";
import type { GiftSend } from "../data/types.ts";
import { formatMediumISO, money } from "../lib/format.ts";
import { giftAmountValue, useStore } from "../state/store.ts";

import "../styles/screen-giftcards.css";

const GC_STEPS = ["Design", "Message", "Payment"] as const;

const STEP_INDEX: Record<string, number> = {
  design: 0,
  details: 1,
  pay: 2,
  done: 2,
};

const SEND_OPTIONS: readonly { value: GiftSend; label: string }[] = [
  { value: "now", label: "Send now" },
  { value: "schedule", label: "Schedule" },
];

/* ------------------------------------------------------------------ *
 * The live card preview (spec §4.15 "Gift preview")
 * ------------------------------------------------------------------ */

interface GiftPreviewProps {
  tint: string;
  amount: number;
  to: string;
  className?: string;
}

function GiftPreview({ tint, amount, to, className }: GiftPreviewProps) {
  const dark = useIsDark();
  return (
    <div
      className={["sm-gift-preview", className].filter(Boolean).join(" ")}
      style={{ background: placeholderBackground(tint, "145deg", dark) }}
    >
      <div className="sm-gift-preview__top">
        <span className="sm-gift-preview__brand">Selma&apos;s</span>
        <Icon name="gift" size={20} />
      </div>
      <div>
        <div className="sm-mono sm-gift-preview__amount">{money(amount)}</div>
        <div className="sm-gift-preview__caption">Studio gift card</div>
      </div>
      <div className="sm-gift-preview__to">
        {to ? `To ${to}` : "To someone lovely"}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Screen
 * ------------------------------------------------------------------ */

export default function GiftCards() {
  const amountLabelId = useId();
  const themeLabelId = useId();

  const gcStep = useStore((s) => s.gcStep);
  const gcAmount = useStore((s) => s.gcAmount);
  const gcCustom = useStore((s) => s.gcCustom);
  const gcTheme = useStore((s) => s.gcTheme);
  const gcTo = useStore((s) => s.gcTo);
  const gcToEmail = useStore((s) => s.gcToEmail);
  const gcFrom = useStore((s) => s.gcFrom);
  const gcMsg = useStore((s) => s.gcMsg);
  const gcSend = useStore((s) => s.gcSend);
  const gcDate = useStore((s) => s.gcDate);
  const gcErr = useStore((s) => s.gcErr);
  const gcNum = useStore((s) => s.gcNum);
  const gcExp = useStore((s) => s.gcExp);
  const gcCvc = useStore((s) => s.gcCvc);
  const gcName = useStore((s) => s.gcName);
  const gcCode = useStore((s) => s.gcCode);

  const setGift = useStore((s) => s.setGift);
  const setGiftAmount = useStore((s) => s.setGiftAmount);
  const setGiftCustom = useStore((s) => s.setGiftCustom);
  const gcNext = useStore((s) => s.gcNext);
  const gcBack = useStore((s) => s.gcBack);
  const gcPay = useStore((s) => s.gcPay);
  const gcReset = useStore((s) => s.gcReset);
  const go = useStore((s) => s.go);

  const amount = giftAmountValue({ gcAmount, gcCustom });
  const theme = data.getGiftTheme(gcTheme) ?? data.getGiftThemes()[0];
  const themes = data.getGiftThemes();
  const amounts = data.getGiftAmounts();

  /* ---------------- done ---------------- */

  if (gcStep === "done") {
    const doneSub =
      gcSend === "schedule" && gcDate
        ? `Scheduled to send on ${formatMediumISO(gcDate)}.`
        : "Delivered to their inbox the moment you’re done.";

    return (
      <main className="sm-screen sm-page sm-gift-page">
        <div className="sm-gift-done">
          <SuccessTile icon="gift" iconSize={36} />
          <h1 className="sm-h1">Your gift is on its way!</h1>
          <p className="sm-gift-done__sub">{doneSub}</p>
          <CodePill label="Gift code" code={gcCode ?? ""} codeSize={20} />
          <GiftPreview
            className="sm-gift-preview--done"
            tint={theme.tint}
            amount={amount}
            to={gcTo}
          />
          <Banner tone="info" className="sm-gift-done__banner">
            This is a demo — no card was charged and nothing was emailed.
          </Banner>
          <div className="sm-gift-done__actions">
            <Button
              variant="ghost"
              size="lg"
              icon="gift"
              className="sm-gift-done__btn"
              onClick={gcReset}
            >
              Buy another
            </Button>
            <Button
              size="lg"
              icon="home"
              className="sm-gift-done__btn"
              onClick={() => go("home")}
            >
              Back home
            </Button>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------- flow ---------------- */

  const ctaLabel = gcStep === "pay" ? `Pay ${money(amount)}` : "Continue";

  return (
    <main className="sm-screen sm-page sm-gift-page">
      <BackLink onClick={gcBack}>
        {gcStep === "design" ? "Back home" : "Back"}
      </BackLink>

      <div className="sm-gift-head">
        <h1 className="sm-h1">Gift a little calm.</h1>
        <p className="sm-sub">
          A Selma&apos;s gift card never expires and works on any service.
        </p>
      </div>

      <GiftStepper
        steps={GC_STEPS}
        current={STEP_INDEX[gcStep] ?? 0}
        className="sm-gift-steps"
      />

      <div className="sm-gift-cols">
        <div className="sm-gift-form">
          {gcStep === "design" ? (
            <>
              <div className="sm-gift-block">
                <span className="sm-label sm-label--strong" id={amountLabelId}>
                  Amount
                </span>
                <div
                  className="sm-gift-chips"
                  role="group"
                  aria-labelledby={amountLabelId}
                >
                  {amounts.map((a) => (
                    <Chip
                      key={a}
                      label={money(a)}
                      active={gcAmount === a}
                      onClick={() => setGiftAmount(a)}
                    />
                  ))}
                  <Chip
                    label="Custom"
                    active={gcAmount === "custom"}
                    onClick={() => setGiftAmount("custom")}
                  />
                </div>
                {gcAmount === "custom" ? (
                  <div className="sm-gift-custom">
                    <span className="sm-mono sm-gift-custom__prefix">$</span>
                    <TextInput
                      className="sm-gift-custom__input"
                      value={gcCustom}
                      onChange={setGiftCustom}
                      placeholder="120"
                      mono
                      inputMode="decimal"
                      ariaLabel="Custom amount"
                    />
                  </div>
                ) : null}
              </div>

              <div className="sm-gift-block">
                <span className="sm-label sm-label--strong" id={themeLabelId}>
                  Card design
                </span>
                <div
                  className="sm-gift-swatches"
                  role="group"
                  aria-labelledby={themeLabelId}
                >
                  {themes.map((t) => (
                    <ThemeSwatch
                      key={t.id}
                      name={t.name}
                      tint={t.tint}
                      active={gcTheme === t.id}
                      onSelect={() => setGift({ gcTheme: t.id })}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {gcStep === "details" ? (
            <>
              <Field label="To (recipient name)">
                {(c) => (
                  <TextInput
                    {...c}
                    value={gcTo}
                    onChange={(v) => setGift({ gcTo: v })}
                    placeholder="Robin Alvarez"
                  />
                )}
              </Field>
              <Field label="Their email">
                {(c) => (
                  <TextInput
                    {...c}
                    value={gcToEmail}
                    onChange={(v) => setGift({ gcToEmail: v })}
                    placeholder="robin@email.com"
                    type="email"
                    inputMode="email"
                  />
                )}
              </Field>
              <Field label="From">
                {(c) => (
                  <TextInput
                    {...c}
                    value={gcFrom}
                    onChange={(v) => setGift({ gcFrom: v })}
                    placeholder="Your name"
                  />
                )}
              </Field>
              <Field label="Message" hint="(optional)">
                {(c) => (
                  <TextArea
                    {...c}
                    value={gcMsg}
                    onChange={(v) => setGift({ gcMsg: v })}
                    rows={3}
                    placeholder="Treat yourself — you've earned it."
                  />
                )}
              </Field>
              <div className="sm-gift-block">
                <span className="sm-label">Delivery</span>
                <Segmented
                  label="Delivery"
                  value={gcSend}
                  onChange={(v) => setGift({ gcSend: v })}
                  options={SEND_OPTIONS}
                />
                {gcSend === "schedule" ? (
                  <TextInput
                    className="sm-gift-date"
                    type="date"
                    value={gcDate}
                    onChange={(v) => setGift({ gcDate: v })}
                    ariaLabel="Delivery date"
                  />
                ) : null}
              </div>
            </>
          ) : null}

          {gcStep === "pay" ? (
            <>
              <Field label="Card number">
                {(c) => (
                  <TextInput
                    {...c}
                    value={gcNum}
                    onChange={(v) => setGift({ gcNum: v })}
                    placeholder="4242 4242 4242 4242"
                    mono
                    inputMode="numeric"
                  />
                )}
              </Field>
              <div className="sm-gift-pair">
                <Field label="Expiry">
                  {(c) => (
                    <TextInput
                      {...c}
                      value={gcExp}
                      onChange={(v) => setGift({ gcExp: v })}
                      placeholder="MM / YY"
                      mono
                    />
                  )}
                </Field>
                <Field label="CVC">
                  {(c) => (
                    <TextInput
                      {...c}
                      value={gcCvc}
                      onChange={(v) => setGift({ gcCvc: v })}
                      placeholder="123"
                      mono
                      inputMode="numeric"
                    />
                  )}
                </Field>
              </div>
              <Field label="Name on card">
                {(c) => (
                  <TextInput
                    {...c}
                    value={gcName}
                    onChange={(v) => setGift({ gcName: v })}
                    placeholder="Your name"
                  />
                )}
              </Field>
            </>
          ) : null}

          {gcErr ? <Banner tone="danger">{gcErr}</Banner> : null}

          <Button
            size="lg"
            full
            icon="arrow-right"
            className="sm-gift-cta"
            onClick={gcStep === "pay" ? gcPay : gcNext}
          >
            {ctaLabel}
          </Button>
        </div>

        <div className="sm-gift-aside">
          <GiftPreview tint={theme.tint} amount={amount} to={gcTo} />
          <div className="sm-gift-aside__caption">
            Preview · updates as you choose
          </div>
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ *
 * Card-design swatch (local — nothing else in the app uses it)
 * ------------------------------------------------------------------ */

interface ThemeSwatchProps {
  name: string;
  tint: string;
  active: boolean;
  onSelect: () => void;
}

function ThemeSwatch({ name, tint, active, onSelect }: ThemeSwatchProps) {
  const dark = useIsDark();
  return (
    <button
      type="button"
      className="sm-gift-swatch"
      data-active={active ? "true" : "false"}
      aria-pressed={active}
      onClick={onSelect}
    >
      <span
        className="sm-gift-swatch__tile"
        style={{ background: placeholderBackground(tint, "158deg", dark) }}
      />
      <span className="sm-gift-swatch__label">{name}</span>
    </button>
  );
}
