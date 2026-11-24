/**
 * What the desk says about a text (plan 80). Adminium writes each outbox row's
 * outcome as one fixed English sentence (`error`), which never holds a number
 * or a word of the text. The desk reads the ones it knows into its own words,
 * and shows any other as "Not sent". The sentences are Adminium 0.3.76's.
 */
import { TEXT_KINDS } from "../manifest/outbox.ts";

export const TEXT_NOT_CONNECTED = "No text provider is connected";
/** A text held for the studio's sending hours reads `sent`, with this at the start of its line, until it goes. */
export const TEXT_WAITING_PREFIX = "Waiting for the sending hours";

/** The engine's sentence, by the desk's word for it. */
const SENTENCES: Record<string, string> = {
  [TEXT_NOT_CONNECTED]: "text.notConnected",
  "No sender is set for texts": "text.notConnected",
  "Texts are switched off on this server": "text.switchedOff",
  "No mobile number on file": "text.noNumber",
  "Not sent: the mobile number cannot be read": "text.badNumber",
  "Not sent: the provider says the number is invalid": "text.badNumber",
  "Not sent: this number cannot receive a text": "text.badNumber",
  "Not sent: this number is not a mobile": "text.badNumber",
  "Not sent: no texts go to this country": "text.country",
  "Not sent: this person replied STOP": "text.stopped",
  "Not sent: this person opted out at the provider": "text.stopped",
  "Not sent: this person has not agreed to texts": "text.noConsent",
  "Not sent: the daily text limit is reached": "text.dailyLimit",
  "Not sent: the send window would hold it past its moment": "text.tooLate",
  "No longer needed": "text.noLongerNeeded",
  "Sample data (never sent)": "text.sample",
  "Unknown: check with the provider before resending": "text.unknown",
  "An earlier send is still open: check it before resending": "text.unknown",
  "Not sent: the business has no phone or email to stop by": "text.noContact",
};

export const isTextKind = (kind: unknown): boolean => (TEXT_KINDS as readonly unknown[]).includes(kind);

export type TextOutcome =
  | { state: "going" }
  | { state: "waiting" }
  | { state: "sent" }
  | { state: "not-sent"; word: string | null }
  | { state: "unknown" };

/** How a text's row reads: going out, waiting for its hours, handed to the provider, not sent and why, or unknown. */
export function textOutcome(row: Readonly<Record<string, unknown>>): TextOutcome {
  const status = String(row["status"] ?? "");
  const error = typeof row["error"] === "string" ? row["error"].trim() : "";
  if (status === "queued") return { state: "going" };
  if (status === "sent") {
    if (error.startsWith(TEXT_WAITING_PREFIX)) return { state: "waiting" };
    if (SENTENCES[error] === "text.unknown") return { state: "unknown" };
    return { state: "sent" };
  }
  if (SENTENCES[error] === "text.unknown") return { state: "unknown" };
  return { state: "not-sent", word: SENTENCES[error] ?? null };
}
