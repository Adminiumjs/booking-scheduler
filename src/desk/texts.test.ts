import { describe, expect, it } from "vitest";

import { en } from "./i18n/en.ts";
import { isTextKind, textOutcome } from "./texts.ts";

describe("a text's line on the desk", () => {
  it("knows the text kinds from the e-mails", () => {
    expect(isTextKind("reminder_text")).toBe(true);
    expect(isTextKind("offer_text")).toBe(true);
    expect(isTextKind("reminder")).toBe(false);
  });

  it("reads Adminium's code, never the English sentence beside it", () => {
    const row = (status: string, text_reason: string | null, error = "whatever the sentence says") => ({ status, text_reason, error });
    expect(textOutcome(row("skipped", "not-set-up"))).toEqual({ state: "not-sent", word: "text.notConnected" });
    expect(textOutcome(row("skipped", "no-consent"))).toEqual({ state: "not-sent", word: "text.noConsent" });
    expect(textOutcome(row("failed", "stopped"))).toEqual({ state: "not-sent", word: "text.stopped" });
    expect(textOutcome(row("skipped", "past-its-moment"))).toEqual({ state: "not-sent", word: "text.tooLate" });
    expect(textOutcome(row("failed", "daily-limit"))).toEqual({ state: "not-sent", word: "text.dailyLimit" });
    expect(textOutcome(row("skipped", "no-number"))).toEqual({ state: "not-sent", word: "text.noNumber" });
    expect(textOutcome(row("failed", "something-new"))).toEqual({ state: "not-sent", word: null });
    for (const word of ["text.notConnected", "text.noConsent", "text.stopped", "text.tooLate", "text.dailyLimit", "text.noNumber", "text.otherReason"]) expect(en).toHaveProperty([word]);
  });

  it("tells a text held for the sending hours, and an unknown one, from one that went", () => {
    expect(textOutcome({ status: "sent", text_reason: "sent" })).toEqual({ state: "sent" });
    expect(textOutcome({ status: "sent", text_reason: "waiting" })).toEqual({ state: "waiting" });
    expect(textOutcome({ status: "sent", text_reason: "unknown" })).toEqual({ state: "unknown" });
    expect(textOutcome({ status: "queued", text_reason: null })).toEqual({ state: "going" });
    expect(textOutcome({ status: "queued", text_reason: "queued" })).toEqual({ state: "going" });
  });
});
