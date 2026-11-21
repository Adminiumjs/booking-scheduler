/**
 * Taking money online, through the payments Adminium takes (cT10, Hotel's shape).
 *
 * A booking is payable while it is being paid: what is left of its deposit or
 * price (`pay_due`), written into the app's own `payments`. The amount was
 * frozen when the booking was made (MON-2). A purchase of gift cards or packs
 * is payable the same way. Payables arrive switched off: whoever manages
 * payments in Adminium switches the studio on.
 *
 * A customer's cancel in time is refunded by itself. A late one keeps the
 * money. A studio's cancel is refunded by itself whenever it is made and
 * whoever at the studio pressed it (cQ28): the window binds the customer only.
 */
const setting = (column: string) => ({ table: "settings", column });

const PAYMENT_COLUMNS = {
  kind: "table",
  table: "payments",
  amount: "amount",
  paidAt: "paid_at",
  method: { column: "method", values: { "*": "online" } },
  reference: "payment_ref",
  refunded: "refunded",
  provider: "provider",
  currency: "currency",
} as const;

export const PAYMENTS = {
  payables: [
    {
      table: "bookings",
      label: "code",
      amount: { column: "asked" },
      currency: { connection: true },
      due: { column: "pay_due" },
      payments: { ...PAYMENT_COLUMNS, link: "booking_id" },
      status: { column: "state", paid: "booked", from: ["paying"] },
      customerEmail: "email",
      payableWhen: [{ column: "state", eq: "paying" }],
      returnTo: "/paid",
      receipt: "engine",
      instantOnly: true,
      refunds: { model: "column" },
      refundOn: {
        moves: [{ from: ["booked"], to: "cancelled", by: ["customer", "staff"] }],
        before: { column: "starts_at", hours: setting("cancel_hours"), binds: ["customer"] },
      },
    },
    {
      table: "purchases",
      label: "code",
      amount: { column: "total" },
      currency: { connection: true },
      due: { column: "due" },
      payments: { ...PAYMENT_COLUMNS, link: "purchase_id" },
      status: { column: "state", paid: "paid", from: ["paying"] },
      customerEmail: "buyer_email",
      payableWhen: [{ column: "state", eq: "paying" }],
      returnTo: "/paid",
      receipt: "engine",
      instantOnly: true,
      // Kept as rows so a sale is refunded only by the owner's cancel: that cancel also takes back the pack or the card.
      refunds: {
        model: "rows",
        table: "purchase_refunds",
        payment: "payment_id",
        amount: "amount",
        when: [{ column: "method", eq: "online" }],
        providerRef: "provider_ref",
        state: "refund_state",
        auto: { values: { automatic: true } },
      },
      refundOn: { moves: [{ from: ["paid"], to: "cancelled", by: ["staff"] }] },
    },
  ],
};
