/*
 * CHECKOUT (view: 'checkout') — settle the bag, then the receipt.
 *
 * Two modes on one view, keyed off `store.ckStep`: the pay form, and the
 * "payment received" panel once it flips to 'done'. Paying clears the bag, so
 * the amount charged is snapshotted here before the totals recompute — see
 * `paidTotal` below.
 *
 * Money is demo fiction end to end: nothing leaves the browser, and the card
 * fields are ordinary text inputs.
 */

import { useState } from "react";

import {
  BackLink,
  Card,
  Chip,
  Eyebrow,
  Field,
  Icon,
  IconTile,
  Radio,
  SuccessTile,
  TextInput,
} from "../components/index.ts";
import { cartLines } from "../data/screens/shop.ts";
import { data } from "../data/source.ts";
import { useI18n } from "../i18n/index.tsx";
import type { MessageKey, TFunction } from "../i18n/index.tsx";
import { hash } from "../lib/codes.ts";
import { durationLabel, minutesToTime, money, weekdayName } from "../lib/format.ts";
import type { StoreState } from "../state/store.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-checkout.css";

interface PayMethod {
  id: string;
  icon: string;
  label: string;
  sub: string;
}

/** The gift-card balance the demo pretends is on file. */
const GIFT_BALANCE = 40;

function payMethods(t: TFunction): readonly PayMethod[] {
  return [
    {
      id: "visa",
      icon: "credit-card",
      label: t("screensA.checkout.methodVisa"),
      sub: t("screensA.checkout.methodVisaSub"),
    },
    {
      id: "apple",
      icon: "smartphone",
      /* A product name, not a phrase — never translated. */
      label: "Apple Pay",
      sub: t("screensA.checkout.methodAppleSub"),
    },
    {
      id: "gift",
      icon: "gift",
      label: t("screensA.checkout.methodGift"),
      sub: t("screensA.checkout.methodGiftSub", { amount: money(GIFT_BALANCE) }),
    },
    {
      id: "new",
      icon: "plus",
      label: t("screensA.checkout.methodNew"),
      sub: t("screensA.checkout.methodNewSub"),
    },
  ];
}

/** The four card fields, and which store key each writes. */
type CardKey = "ckNum" | "ckExp" | "ckCvc" | "ckZip";

const CARD_FIELDS: readonly {
  key: CardKey;
  labelKey: MessageKey;
  ph: string;
  wide?: boolean;
}[] = [
  {
    key: "ckNum",
    labelKey: "screensA.checkout.cardNumber",
    ph: "4242 4242 4242 4242",
    wide: true,
  },
  { key: "ckExp", labelKey: "screensA.checkout.expiry", ph: "04/29" },
  { key: "ckCvc", labelKey: "screensA.checkout.cvc", ph: "123" },
  { key: "ckZip", labelKey: "screensA.checkout.postcode", ph: "94110" },
];

const TIPS = [0, 15, 18, 20];

/** Every code the demo accepts takes the same 25% off. */
const PROMO_CODES = ["PAIRUP25", "MORNING20", "DUONAILS"];
const PROMO_RATE = 0.25;
const MEMBER_RATE = 0.1;
const TAX_RATE = 0.085;

interface SummaryItem {
  key: string;
  name: string;
  sub: string;
  icon: string;
  tint: string;
  amount: number;
}

export default function Checkout() {
  const { t, number } = useI18n();
  const ckStep = useStore((s) => s.ckStep);
  const ckMethod = useStore((s) => s.ckMethod);
  const ckTip = useStore((s) => s.ckTip);
  const ckPromo = useStore((s) => s.ckPromo);
  const ckPromoOk = useStore((s) => s.ckPromoOk);
  const ckCode = useStore((s) => s.ckCode);
  const ckNum = useStore((s) => s.ckNum);
  const ckExp = useStore((s) => s.ckExp);
  const ckCvc = useStore((s) => s.ckCvc);
  const ckZip = useStore((s) => s.ckZip);
  const cart = useStore((s) => s.cart);
  const member = useStore((s) => s.member);
  const email = useStore((s) => s.acct.email);
  const set = useStore((s) => s.set);
  const go = useStore((s) => s.go);
  const showToast = useStore((s) => s.showToast);

  /*
   * What was actually charged, and the flag for the receipt mode.
   *
   * Two comp defects hang off this. Paying empties the bag, so re-deriving the
   * receipt amount from the cart (as the comp did) billed the fallback
   * appointment rather than the order that was just paid for. And `ckStep`
   * outlives the screen, so any later visit to Checkout re-opened a stale
   * "Payment received". Keeping the amount in the screen fixes the first and
   * scopes the receipt to the visit that paid, which fixes the second.
   */
  const [paidTotal, setPaidTotal] = useState<number | null>(null);

  const cardValues: Record<CardKey, string> = {
    ckNum,
    ckExp,
    ckCvc,
    ckZip,
  };

  const methods = payMethods(t);
  const lines = cartLines(cart);

  /* An empty bag still has something to pay for: the upcoming appointment. */
  const upcoming = data.getService("gloss");
  const items: SummaryItem[] = lines.length
    ? lines.map((l) => ({
        key: l.product.id,
        name: l.product.name,
        sub: t("screensA.checkout.itemSub", {
          qty: number(l.qty),
          price: money(l.product.price),
        }),
        icon: l.product.icon,
        tint: l.product.tint,
        amount: l.amount,
      }))
    : upcoming
      ? [
          {
            key: "svc",
            name: upcoming.name,
            sub: t("screensA.checkout.apptSub", {
              duration: durationLabel(upcoming.dur),
              staff: "Selma",
              when: `${weekdayName(2, "short")} ${minutesToTime(840)}`,
            }),
            icon: upcoming.icon,
            tint: upcoming.tint,
            amount: upcoming.price,
          },
        ]
      : [];

  const sub = items.reduce((n, i) => n + i.amount, 0);
  const discount = member ? sub * MEMBER_RATE : 0;
  const promo = ckPromoOk ? sub * PROMO_RATE : 0;
  const tip = sub * (ckTip / 100);
  const tax = (sub - discount - promo) * TAX_RATE;
  const total = sub - discount - promo + tip + tax;

  const methodLabel =
    (methods.find((m) => m.id === ckMethod) ?? methods[0]).label;

  const applyPromo = (): void => {
    const code = ckPromo.trim().toUpperCase();
    if (PROMO_CODES.includes(code)) {
      set({ ckPromoOk: true });
      showToast(t("screensA.checkout.promoOk"), "ok");
    } else {
      set({ ckPromoOk: false });
      showToast(t("screensA.checkout.promoBad"), "warn");
    }
  };

  const pay = (): void => {
    setPaidTotal(total);
    set({
      ckStep: "done",
      ckCode: `PAY-${4820 + (hash(String(total)) % 140)}`,
      cart: {},
    });
    showToast(t("screensA.checkout.paidToast"), "ok");
    window.scrollTo(0, 0);
  };

  if (ckStep === "done" && paidTotal !== null) {
    return (
      <section className="bk-screen bk-page scr-checkout scr-checkout--done">
        <div className="scr-checkout__done">
          <SuccessTile icon="check" size={70} iconSize={34} />
          <h1 className="bk-h1 scr-checkout__donetitle">
            {t("screensA.checkout.paidTitle")}
          </h1>
          <p className="scr-checkout__donesub">
            {t("screensA.checkout.receiptTo", { email })}
          </p>

          <div className="bk-panel scr-checkout__donecard">
            <ReceiptRow
              label={t("screensA.checkout.refReference")}
              value={ckCode ?? "PAY-4821"}
              mono
            />
            <ReceiptRow
              label={t("screensA.checkout.refPaidWith")}
              value={methodLabel}
            />
            <ReceiptRow
              label={t("screensA.checkout.refAmount")}
              value={money(paidTotal)}
              mono
              large
            />
          </div>

          <div className="scr-checkout__doneactions">
            <button
              type="button"
              className="bk-btn scr-checkout__donecta"
              onClick={() => go("orders")}
            >
              {t("screensA.checkout.orderHistory")}
            </button>
            <button
              type="button"
              className="bk-gi scr-checkout__doneghost"
              onClick={() => go("shop")}
            >
              {t("screensA.checkout.backToShop")}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bk-screen bk-page scr-checkout">
      <BackLink onClick={() => go(lines.length ? "shop" : "services")}>
        {t("screensA.checkout.keepBrowsing")}
      </BackLink>
      <h1 className="bk-h1 scr-checkout__title">
        {t("screensA.checkout.title")}
      </h1>

      <div className="scr-checkout__grid">
        <div className="scr-checkout__col">
          <Card radius={20} padding={22} className="scr-checkout__card">
            <Eyebrow>{t("screensA.checkout.payWith")}</Eyebrow>
            <div
              className="scr-checkout__methods"
              role="radiogroup"
              aria-label={t("screensA.checkout.payWith")}
            >
              {methods.map((m) => {
                const selected = ckMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    /* Named explicitly: the label is two nested spans, and a
                     * content-derived name reads as one run-on string. */
                    aria-label={t("screensA.checkout.methodAria", {
                      label: m.label,
                      sub: m.sub,
                    })}
                    className="scr-checkout__meth"
                    data-selected={selected ? "true" : "false"}
                    onClick={() => set({ ckMethod: m.id })}
                  >
                    <Radio selected={selected} />
                    <span className="scr-checkout__methicon">
                      <Icon name={m.icon} size={15} />
                    </span>
                    <span className="scr-checkout__methtext">
                      <span className="scr-checkout__methlabel">{m.label}</span>
                      <span className="scr-checkout__methsub">{m.sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {ckMethod === "new" ? (
              <div className="scr-checkout__cardfields">
                {CARD_FIELDS.map((f) => (
                  <Field
                    key={f.key}
                    label={t(f.labelKey)}
                    className={
                      f.wide
                        ? "scr-checkout__cardfield scr-checkout__cardfield--wide"
                        : "scr-checkout__cardfield"
                    }
                  >
                    {(control) => (
                      <TextInput
                        {...control}
                        value={cardValues[f.key]}
                        placeholder={f.ph}
                        onChange={(v) =>
                          set({ [f.key]: v } as Partial<StoreState>)
                        }
                      />
                    )}
                  </Field>
                ))}
              </div>
            ) : null}
          </Card>

          <Card radius={20} padding={22} className="scr-checkout__card">
            <Eyebrow>{t("screensA.checkout.tipTitle")}</Eyebrow>
            <div className="scr-checkout__tips">
              {TIPS.map((n) => (
                <Chip
                  key={n}
                  label={
                    n === 0
                      ? t("screensA.common.noTip")
                      : number(n / 100, { style: "percent" })
                  }
                  active={ckTip === n}
                  onClick={() => set({ ckTip: n })}
                />
              ))}
            </div>
            <p className="scr-checkout__note">
              {t("screensA.checkout.tipNote")}
            </p>
          </Card>

          <Card radius={20} padding={22} className="scr-checkout__card">
            <Eyebrow>{t("screensA.checkout.promo")}</Eyebrow>
            <div className="scr-checkout__promo">
              <TextInput
                value={ckPromo}
                onChange={(v) => set({ ckPromo: v.toUpperCase() })}
                placeholder="PAIRUP25"
                mono
                ariaLabel={t("screensA.checkout.promo")}
                className="scr-checkout__promoinput"
              />
              <button
                type="button"
                className="bk-gi scr-checkout__apply"
                onClick={applyPromo}
              >
                {t("screensA.checkout.apply")}
              </button>
            </div>
            {ckPromoOk ? (
              <p className="scr-checkout__promook">
                <Icon name="check-circle-2" size={14} />
                {t("screensA.checkout.promoApplied", {
                  code: PROMO_CODES[0],
                  percent: number(PROMO_RATE, { style: "percent" }),
                })}
              </p>
            ) : null}
          </Card>
        </div>

        <Card radius={22} padding={24} className="scr-checkout__summary">
          <h2 className="scr-checkout__sumtitle">
            {t("screensA.checkout.summary")}
          </h2>

          <div className="scr-checkout__items">
            {items.map((i) => (
              <div key={i.key} className="scr-checkout__item">
                <IconTile
                  icon={i.icon}
                  tint={i.tint}
                  size={40}
                  iconSize={18}
                  radius={13}
                />
                <span className="scr-checkout__itemtext">
                  <span className="scr-checkout__itemname">{i.name}</span>
                  <span className="scr-checkout__itemsub">{i.sub}</span>
                </span>
                <span className="bk-mono scr-checkout__itemamt">
                  {money(i.amount)}
                </span>
              </div>
            ))}
          </div>

          <div className="scr-checkout__rule" />

          <div className="scr-checkout__totals">
            <TotalRow label={t("screensA.common.subtotal")} value={money(sub)} />
            {discount > 0 ? (
              <TotalRow
                label={t("screensA.checkout.memberDiscount", {
                  percent: number(MEMBER_RATE, { style: "percent" }),
                })}
                value={`−${money(discount)}`}
                accent
              />
            ) : null}
            {promo > 0 ? (
              <TotalRow label={PROMO_CODES[0]} value={`−${money(promo)}`} accent />
            ) : null}
            <TotalRow
              label={t("screensA.checkout.tipRow", {
                percent: number(ckTip / 100, { style: "percent" }),
              })}
              value={money(tip)}
            />
            <TotalRow label={t("screensA.common.tax")} value={money(tax)} />
          </div>

          <div className="scr-checkout__rule" />

          <div className="scr-checkout__grand">
            <span className="scr-checkout__grandlabel">
              {t("screensA.common.total")}
            </span>
            <span className="bk-mono scr-checkout__grandval">{money(total)}</span>
          </div>

          <button type="button" className="bk-btn scr-checkout__pay" onClick={pay}>
            <Icon name="lock" size={17} />
            {t("screensA.checkout.pay", { amount: money(total) })}
          </button>

          <p className="scr-checkout__demo">
            <Icon name="shield-check" size={15} />
            <span>{t("screensA.checkout.demoNote")}</span>
          </p>
        </Card>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Rows (local to this screen)
 * ------------------------------------------------------------------ */

function TotalRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="scr-checkout__total" data-accent={accent ? "true" : "false"}>
      <span className="scr-checkout__totallabel">{label}</span>
      <span className="bk-mono scr-checkout__totalval">{value}</span>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  mono = false,
  large = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  large?: boolean;
}) {
  return (
    <div className="scr-checkout__receipt">
      <span className="scr-checkout__receiptlabel">{label}</span>
      <span
        className={[
          "scr-checkout__receiptval",
          mono ? "bk-mono" : "",
          large ? "scr-checkout__receiptval--lg" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
