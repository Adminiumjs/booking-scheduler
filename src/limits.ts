/**
 * How long what a guest types may run. The form stops here, the public door takes this much, the column holds it, and Offers
 * keeps a gift card's and a pack's names to the same, so nobody fills in a form that is then refused.
 */
export const NAME_MAX = 80;
export const GIFT_MESSAGE_MAX = 200;
/** A gift message may say "Happy 30th" or a date, never a phone number. */
export const GIFT_MESSAGE_DIGITS = 4;
