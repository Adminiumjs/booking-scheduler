/*
 * Page-local seed for the account screen.
 *
 * None of this belongs in the DataSource seam: the editable fields are a form
 * description, and the saved card is fixed demo fiction with no record behind
 * it. Only the account screen reads any of it.
 */

import type { AccountProfile } from "../types.ts";

/** The four `AccountProfile` fields the screen exposes as text inputs. */
export type AccountTextKey = Extract<
  keyof AccountProfile,
  "name" | "email" | "phone" | "bday"
>;

export interface AccountFieldSpec {
  key: AccountTextKey;
  label: string;
  placeholder: string;
}

export const ACCOUNT_FIELDS: readonly AccountFieldSpec[] = [
  { key: "name", label: "Full name", placeholder: "Ava Reyes" },
  { key: "email", label: "Email", placeholder: "you@email.com" },
  { key: "phone", label: "Phone", placeholder: "(415) 555-0142" },
  { key: "bday", label: "Birthday", placeholder: "Mar 12" },
];

/** `AccountProfile.contact` — how the studio reaches the client first. */
export const CONTACT_OPTIONS = [
  { value: "sms", label: "Text" },
  { value: "email", label: "Email" },
  { value: "call", label: "Phone call" },
] as const;

/**
 * The client avatar's tint. It lives here rather than in the screen because a
 * tint is data — the one thing a `.tsx` may not spell as a hex literal.
 */
export const ACCOUNT_TINT = "#b07d9a";

/** How long the demo client has been a member, shown beside their name. */
export const MEMBER_SINCE = "Member since Mar 2024";

/** The single card on file. Buying or editing one is disabled in the demo. */
export const SAVED_CARD = {
  label: "Visa ending 4242",
  meta: "Expires 08/29 · used for deposits and late fees",
} as const;
