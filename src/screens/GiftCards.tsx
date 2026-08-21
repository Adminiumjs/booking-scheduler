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
import { useT } from "../i18n/index.tsx";
import type { MessageKey, TFunction } from "../i18n/index.tsx";
import { formatMediumISO, money } from "../lib/format.ts";
import { giftAmountValue, useStore } from "../state/store.ts";

import "../styles/screen-giftcards.css";

const GC_STEP_KEYS = [
  "screensA.gift.stepDesign",
  "screensA.gift.stepMessage",
  "screensA.gift.stepPayment",
] as const;

const STEP_INDEX: Record<string, number> = {
  design: 0,
  details: 1,
  pay: 2,
  done: 2,
};

const SEND_KEYS: readonly { value: GiftSend; key: MessageKey }[] = [
  { value: "now", key: "screensA.gift.sendNow" },
  { value: "schedule", key: "screensA.gift.schedule" },
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
  const t = useT();
  const dark = useIsDark();
  return (
    <div
      className={["bk-gift-preview", className].filter(Boolean).join(" ")}
      style={{ background: placeholderBackground(tint, "145deg", dark) }}
    >
      <div className="bk-gift-preview__top">
        <span className="bk-gift-preview__brand">Lumen</span>
        <Icon name="gift" size={20} />
      </div>
      <div>
        <div className="bk-mono bk-gift-preview__amount">{money(amount)}</div>
        <div className="bk-gift-preview__caption">
          {t("screensA.gift.caption")}
        </div>
      </div>
      <div className="bk-gift-preview__to">
        {to ? t("screensA.gift.to", { name: to }) : t("screensA.gift.toAnyone")}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Screen
 * ------------------------------------------------------------------ */

export default function GiftCards() {
  const t = useT();
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
        ? t("screensA.gift.doneScheduled", { date: formatMediumISO(gcDate) })
        : t("screensA.gift.doneNow");

    return (
      <main className="bk-screen bk-page bk-gift-page">
        <div className="bk-gift-done">
          <SuccessTile icon="gift" iconSize={36} />
          <h1 className="bk-h1">{t("screensA.gift.doneTitle")}</h1>
          <p className="bk-gift-done__sub">{doneSub}</p>
          <CodePill
            label={t("screensA.gift.codeLabel")}
            code={gcCode ?? ""}
            codeSize={20}
          />
          <GiftPreview
            className="bk-gift-preview--done"
            tint={theme.tint}
            amount={amount}
            to={gcTo}
          />
          <Banner tone="info" className="bk-gift-done__banner">
            {t("screensA.gift.banner")}
          </Banner>
          <div className="bk-gift-done__actions">
            <Button
              variant="ghost"
              size="lg"
              icon="gift"
              className="bk-gift-done__btn"
              onClick={gcReset}
            >
              {t("screensA.gift.buyAnother")}
            </Button>
            <Button
              size="lg"
              icon="home"
              className="bk-gift-done__btn"
              onClick={() => go("home")}
            >
              {t("screensA.common.backHome")}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------- flow ---------------- */

  const ctaLabel =
    gcStep === "pay"
      ? t("screensA.gift.pay", { amount: money(amount) })
      : t("screensA.common.continue");

  return (
    <main className="bk-screen bk-page bk-gift-page">
      <BackLink onClick={gcBack}>
        {t(
          gcStep === "design" ? "screensA.common.backHome" : "screensA.common.back",
        )}
      </BackLink>

      <div className="bk-gift-head">
        <h1 className="bk-h1">{t("screensA.gift.title")}</h1>
        <p className="bk-sub">{t("screensA.gift.sub")}</p>
      </div>

      <GiftStepper
        steps={GC_STEP_KEYS}
        current={STEP_INDEX[gcStep] ?? 0}
        className="bk-gift-steps"
      />

      <div className="bk-gift-cols">
        <div className="bk-gift-form">
          {gcStep === "design" ? (
            <>
              <div className="bk-gift-block">
                <span className="bk-label bk-label--strong" id={amountLabelId}>
                  {t("screensA.gift.amount")}
                </span>
                <div
                  className="bk-gift-chips"
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
                    label={t("screensA.gift.custom")}
                    active={gcAmount === "custom"}
                    onClick={() => setGiftAmount("custom")}
                  />
                </div>
                {gcAmount === "custom" ? (
                  <div className="bk-gift-custom">
                    <span className="bk-mono bk-gift-custom__prefix">$</span>
                    <TextInput
                      className="bk-gift-custom__input"
                      value={gcCustom}
                      onChange={setGiftCustom}
                      placeholder="120"
                      mono
                      inputMode="decimal"
                      ariaLabel={t("screensA.gift.customAria")}
                    />
                  </div>
                ) : null}
              </div>

              <div className="bk-gift-block">
                <span className="bk-label bk-label--strong" id={themeLabelId}>
                  {t("screensA.gift.design")}
                </span>
                <div
                  className="bk-gift-swatches"
                  role="group"
                  aria-labelledby={themeLabelId}
                >
                  {themes.map((swatch) => (
                    <ThemeSwatch
                      key={swatch.id}
                      name={t(swatch.nameKey)}
                      tint={swatch.tint}
                      active={gcTheme === swatch.id}
                      onSelect={() => setGift({ gcTheme: swatch.id })}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {gcStep === "details" ? (
            <>
              <Field label={t("screensA.gift.toLabel")}>
                {(c) => (
                  <TextInput
                    {...c}
                    value={gcTo}
                    onChange={(v) => setGift({ gcTo: v })}
                    placeholder="Robin Alvarez"
                  />
                )}
              </Field>
              <Field label={t("screensA.gift.theirEmail")}>
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
              <Field label={t("screensA.gift.from")}>
                {(c) => (
                  <TextInput
                    {...c}
                    value={gcFrom}
                    onChange={(v) => setGift({ gcFrom: v })}
                    placeholder={t("screensA.common.yourName")}
                  />
                )}
              </Field>
              <Field
                label={t("screensA.gift.message")}
                hint={t("screensA.common.optional")}
              >
                {(c) => (
                  <TextArea
                    {...c}
                    value={gcMsg}
                    onChange={(v) => setGift({ gcMsg: v })}
                    rows={3}
                    placeholder={t("screensA.gift.messagePlaceholder")}
                  />
                )}
              </Field>
              <div className="bk-gift-block">
                <span className="bk-label">{t("screensA.gift.delivery")}</span>
                <Segmented
                  label={t("screensA.gift.delivery")}
                  value={gcSend}
                  onChange={(v) => setGift({ gcSend: v })}
                  options={sendOptions(t)}
                />
                {gcSend === "schedule" ? (
                  <TextInput
                    className="bk-gift-date"
                    type="date"
                    value={gcDate}
                    onChange={(v) => setGift({ gcDate: v })}
                    ariaLabel={t("screensA.gift.deliveryDate")}
                  />
                ) : null}
              </div>
            </>
          ) : null}

          {gcStep === "pay" ? (
            <>
              <Field label={t("screensA.gift.cardNumber")}>
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
              <div className="bk-gift-pair">
                <Field label={t("screensA.gift.expiry")}>
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
                <Field label={t("screensA.gift.cvc")}>
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
              <Field label={t("screensA.gift.nameOnCard")}>
                {(c) => (
                  <TextInput
                    {...c}
                    value={gcName}
                    onChange={(v) => setGift({ gcName: v })}
                    placeholder={t("screensA.common.yourName")}
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
            className="bk-gift-cta"
            onClick={gcStep === "pay" ? gcPay : gcNext}
          >
            {ctaLabel}
          </Button>
        </div>

        <div className="bk-gift-aside">
          <GiftPreview tint={theme.tint} amount={amount} to={gcTo} />
          <div className="bk-gift-aside__caption">
            {t("screensA.gift.previewCaption")}
          </div>
        </div>
      </div>
    </main>
  );
}

function sendOptions(t: TFunction): readonly { value: GiftSend; label: string }[] {
  return SEND_KEYS.map((o) => ({ value: o.value, label: t(o.key) }));
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
      className="bk-gift-swatch"
      data-active={active ? "true" : "false"}
      aria-pressed={active}
      onClick={onSelect}
    >
      <span
        className="bk-gift-swatch__tile"
        style={{ background: placeholderBackground(tint, "158deg", dark) }}
      />
      <span className="bk-gift-swatch__label">{name}</span>
    </button>
  );
}
