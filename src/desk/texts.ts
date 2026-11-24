/**
 * What the desk says about a text (plan 80). Adminium writes each text row's
 * outcome twice: a sentence for people (`error`) and one code for apps
 * (`text_reason`, the outbox's `textReason`). The desk reads the code, in its
 * own words, and shows a code it does not know as "Not sent".
 */
import { TEXT_KINDS } from "../manifest/outbox.ts";

/** The codes the desk words: Adminium 0.3.76's, as `outbox/text-words.ts` lists them. */
const NOT_SENT: Record<string, string> = {
  "not-set-up": "text.notConnected",
  "no-number": "text.noNumber",
  "unreadable-phone": "text.badNumber",
  "bad-number": "text.badNumber",
  "invalid-number": "text.badNumber",
  "cannot-receive-text": "text.badNumber",
  "not-mobile": "text.badNumber",
  "country-blocked": "text.country",
  "country-blocked-cn": "text.country",
  stopped: "text.stopped",
  "opted-out": "text.stopped",
  "no-consent": "text.noConsent",
  "daily-limit": "text.dailyLimit",
  "past-its-moment": "text.tooLate",
  "no-longer-needed": "text.noLongerNeeded",
  sample: "text.sample",
  "no-opt-out-contact": "text.noContact",
};

export const isTextKind = (kind: unknown): boolean => (TEXT_KINDS as readonly unknown[]).includes(kind);

export type TextOutcome =
  | { state: "going" }
  | { state: "waiting" }
  | { state: "sent" }
  | { state: "not-sent"; word: string | null }
  | { state: "unknown" };

/** How a text's row reads, from its code: going out, waiting for its hours, handed to the provider, not sent and why, or unknown. */
export function textOutcome(row: Readonly<Record<string, unknown>>): TextOutcome {
  const code = typeof row["text_reason"] === "string" ? row["text_reason"].trim() : "";
  // A row not yet handed over has no code: the outbox's own status says where it is.
  if (code === "") return row["status"] === "queued" ? { state: "going" } : row["status"] === "sent" ? { state: "sent" } : { state: "not-sent", word: null };
  if (code === "queued") return { state: "going" };
  if (code === "waiting") return { state: "waiting" };
  if (code === "sent") return { state: "sent" };
  if (code === "unknown" || code === "earlier-send-open") return { state: "unknown" };
  return { state: "not-sent", word: NOT_SENT[code] ?? null };
}
