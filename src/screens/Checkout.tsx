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
import { hash } from "../lib/codes.ts";
import { money } from "../lib/format.ts";
import type { StoreState } from "../state/store.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-checkout.css";

interface PayMethod {
  id: string;
  icon: string;
  label: string;
  sub: string;
}

const METHODS: readonly PayMethod[] = [
  {
    id: "visa",
    icon: "credit-card",
    label: "Visa ending 4242",
    sub: "Saved · expires 04/29",
  },
  { id: "apple", icon: "smartphone", label: "Apple Pay", sub: "Face ID on this device" },
  {
    id: "gift",
    icon: "gift",
    label: "Gift card balance",
    sub: "$40.00 available · rest on card",
  },
  { id: "new", icon: "plus", label: "New card", sub: "Add a different card" },
];

/** The four card fields, and which store key each writes. */
type CardKey = "ckNum" | "ckExp" | "ckCvc" | "ckZip";

const CARD_FIELDS: readonly {
  key: CardKey;
  label: string;
  ph: string;
  wide?: boolean;
}[] = [
  { key: "ckNum", label: "Card number", ph: "4242 4242 4242 4242", wide: true },
  { key: "ckExp", label: "Expiry", ph: "04/29" },
  { key: "ckCvc", label: "CVC", ph: "123" },
  { key: "ckZip", label: "Postcode", ph: "94110" },
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

  const lines = cartLines(cart);

  /* An empty bag still has something to pay for: the upcoming appointment. */
  const upcoming = data.getService("gloss");
  const items: SummaryItem[] = lines.length
    ? lines.map((l) => ({
        key: l.product.id,
        name: l.product.name,
        sub: `${l.qty} × ${money(l.product.price)} · collect in studio`,
        icon: l.product.icon,
        tint: l.product.tint,
        amount: l.amount,
      }))
    : upcoming
      ? [
          {
            key: "svc",
            name: upcoming.name,
            sub: `${upcoming.dur} min with Selma · Tue 2:00 PM`,
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
    (METHODS.find((m) => m.id === ckMethod) ?? METHODS[0]).label;

  const applyPromo = (): void => {
    const code = ckPromo.trim().toUpperCase();
    if (PROMO_CODES.includes(code)) {
      set({ ckPromoOk: true });
      showToast("Code applied", "ok");
    } else {
      set({ ckPromoOk: false });
      showToast("That code isn’t valid on this order", "warn");
    }
  };

  const pay = (): void => {
    setPaidTotal(total);
    set({
      ckStep: "done",
      ckCode: `PAY-${4820 + (hash(String(total)) % 140)}`,
      cart: {},
    });
    showToast("Payment received · demo only", "ok");
    window.scrollTo(0, 0);
  };

  if (ckStep === "done" && paidTotal !== null) {
    return (
      <section className="bk-screen bk-page scr-checkout scr-checkout--done">
        <div className="scr-checkout__done">
          <SuccessTile icon="check" size={70} iconSize={34} />
          <h1 className="bk-h1 scr-checkout__donetitle">Payment received</h1>
          <p className="scr-checkout__donesub">
            A receipt is on its way to{" "}
            <span className="scr-checkout__doneemail">{email}</span>.
          </p>

          <div className="bk-panel scr-checkout__donecard">
            <ReceiptRow label="Reference" value={ckCode ?? "PAY-4821"} mono />
            <ReceiptRow label="Paid with" value={methodLabel} />
            <ReceiptRow label="Amount" value={money(paidTotal)} mono large />
          </div>

          <div className="scr-checkout__doneactions">
            <button
              type="button"
              className="bk-btn scr-checkout__donecta"
              onClick={() => go("orders")}
            >
              See order history
            </button>
            <button
              type="button"
              className="bk-gi scr-checkout__doneghost"
              onClick={() => go("shop")}
            >
              Back to the shop
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bk-screen bk-page scr-checkout">
      <BackLink onClick={() => go(lines.length ? "shop" : "services")}>
        Keep browsing
      </BackLink>
      <h1 className="bk-h1 scr-checkout__title">Checkout</h1>

      <div className="scr-checkout__grid">
        <div className="scr-checkout__col">
          <Card radius={20} padding={22} className="scr-checkout__card">
            <Eyebrow>Pay with</Eyebrow>
            <div
              className="scr-checkout__methods"
              role="radiogroup"
              aria-label="Payment method"
            >
              {METHODS.map((m) => {
                const selected = ckMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    /* Named explicitly: the label is two nested spans, and a
                     * content-derived name reads as one run-on string. */
                    aria-label={`${m.label} — ${m.sub}`}
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
                    label={f.label}
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
            <Eyebrow>Add a tip for the team</Eyebrow>
            <div className="scr-checkout__tips">
              {TIPS.map((n) => (
                <Chip
                  key={n}
                  label={n === 0 ? "No tip" : `${n}%`}
                  active={ckTip === n}
                  onClick={() => set({ ckTip: n })}
                />
              ))}
            </div>
            <p className="scr-checkout__note">
              Tips go straight to the specialist who saw you, in full.
            </p>
          </Card>

          <Card radius={20} padding={22} className="scr-checkout__card">
            <Eyebrow>Promo code</Eyebrow>
            <div className="scr-checkout__promo">
              <TextInput
                value={ckPromo}
                onChange={(v) => set({ ckPromo: v.toUpperCase() })}
                placeholder="PAIRUP25"
                mono
                ariaLabel="Promo code"
                className="scr-checkout__promoinput"
              />
              <button
                type="button"
                className="bk-gi scr-checkout__apply"
                onClick={applyPromo}
              >
                Apply
              </button>
            </div>
            {ckPromoOk ? (
              <p className="scr-checkout__promook">
                <Icon name="check-circle-2" size={14} />
                PAIRUP25 applied — 25% off this order.
              </p>
            ) : null}
          </Card>
        </div>

        <Card radius={22} padding={24} className="scr-checkout__summary">
          <h2 className="scr-checkout__sumtitle">Order summary</h2>

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
            <TotalRow label="Subtotal" value={money(sub)} />
            {discount > 0 ? (
              <TotalRow
                label="Member discount · 10%"
                value={`−${money(discount)}`}
                accent
              />
            ) : null}
            {promo > 0 ? (
              <TotalRow label="PAIRUP25" value={`−${money(promo)}`} accent />
            ) : null}
            <TotalRow label={`Tip · ${ckTip}%`} value={money(tip)} />
            <TotalRow label="Tax" value={money(tax)} />
          </div>

          <div className="scr-checkout__rule" />

          <div className="scr-checkout__grand">
            <span className="scr-checkout__grandlabel">Total</span>
            <span className="bk-mono scr-checkout__grandval">{money(total)}</span>
          </div>

          <button type="button" className="bk-btn scr-checkout__pay" onClick={pay}>
            <Icon name="lock" size={17} />
            Pay {money(total)}
          </button>

          <p className="scr-checkout__demo">
            <Icon name="shield-check" size={15} />
            <span>Demo checkout — no card is charged and nothing is stored.</span>
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
