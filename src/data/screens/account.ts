/*
 * Page-local seed for the account screen.
 *
 * None of this belongs in the DataSource seam: the editable fields are a form
 * description, and the saved card is fixed demo fiction with no record behind
 * it. Only the account screen reads any of it.
 */

import type { AccountProfile } from "../types.ts";
import type { MessageKey } from "../../i18n/index.tsx";

/** The four `AccountProfile` fields the screen exposes as text inputs. */
export type AccountTextKey = Extract<
  keyof AccountProfile,
  "name" | "email" | "phone" | "bday"
>;

export interface AccountFieldSpec {
  key: AccountTextKey;
  labelKey: MessageKey;
  /**
   * Placeholder. The name and phone hints stay literal — they are the demo
   * client's own details, fiction rather than chrome — while the email and
   * birthday hints are keyed, because "you@email.com" and a `Mar 12` date
   * shape are both things a locale writes its own way.
   */
  placeholder?: string;
  placeholderKey?: MessageKey;
}

export const ACCOUNT_FIELDS: readonly AccountFieldSpec[] = [
  { key: "name", labelKey: "screensA.account.fieldFullName", placeholder: "Ava Reyes" },
  { key: "email", labelKey: "screensA.account.fieldEmail", placeholderKey: "screensA.account.phEmail" },
  { key: "phone", labelKey: "screensA.account.fieldPhone", placeholder: "(415) 555-0142" },
  { key: "bday", labelKey: "screensA.account.fieldBirthday", placeholderKey: "screensA.account.phBday" },
];

/** `AccountProfile.contact` — how the studio reaches the client first. */
export const CONTACT_OPTIONS = [
  { value: "sms", labelKey: "screensA.account.contactText" },
  { value: "email", labelKey: "screensA.account.contactEmail" },
  { value: "call", labelKey: "screensA.account.contactCall" },
] as const satisfies readonly { value: string; labelKey: MessageKey }[];

/**
 * The client avatar's tint. It lives here rather than in the screen because a
 * tint is data — the one thing a `.tsx` may not spell as a hex literal.
 */
export const ACCOUNT_TINT = "#b07d9a";

/**
 * When the demo client joined, shown beside their name. An ISO date rather
 * than `"Mar 2024"` — the screen formats the month through `Intl`.
 */
export const MEMBER_SINCE_ISO = "2024-03-01";

/**
 * The single card on file. Buying or editing one is disabled in the demo.
 * Brand and digits are data; the sentence around them is a message key.
 */
export const SAVED_CARD = {
  brand: "Visa",
  last4: "4242",
  expires: "08/29",
} as const;
