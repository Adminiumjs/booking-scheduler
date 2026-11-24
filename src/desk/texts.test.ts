import { describe, expect, it } from "vitest";

import { en } from "./i18n/en.ts";
import { isTextKind, TEXT_NOT_CONNECTED, textOutcome } from "./texts.ts";

describe("a text's line on the desk", () => {
  it("knows the text kinds from the e-mails", () => {
    expect(isTextKind("reminder_text")).toBe(true);
    expect(isTextKind("offer_text")).toBe(true);
    expect(isTextKind("reminder")).toBe(false);
  });

  it("reads Adminium's fixed sentences into its own words", () => {
    expect(textOutcome({ status: "skipped", error: TEXT_NOT_CONNECTED })).toEqual({ state: "not-sent", word: "text.notConnected" });
    expect(textOutcome({ status: "skipped", error: "Not sent: this person has not agreed to texts" })).toEqual({ state: "not-sent", word: "text.noConsent" });
    expect(textOutcome({ status: "failed", error: "Not sent: this person replied STOP" })).toEqual({ state: "not-sent", word: "text.stopped" });
    expect(textOutcome({ status: "skipped", error: "Not sent: the send window would hold it past its moment" })).toEqual({ state: "not-sent", word: "text.tooLate" });
    expect(textOutcome({ status: "failed", error: "Not sent: the daily text limit is reached" })).toEqual({ state: "not-sent", word: "text.dailyLimit" });
    expect(textOutcome({ status: "failed", error: "Something new" })).toEqual({ state: "not-sent", word: null });
    for (const word of ["text.notConnected", "text.noConsent", "text.stopped", "text.tooLate", "text.dailyLimit", "text.otherReason"]) expect(en).toHaveProperty([word]);
  });

  it("tells a text held for the sending hours, and an unknown one, from one that went", () => {
    expect(textOutcome({ status: "sent", error: null })).toEqual({ state: "sent" });
    expect(textOutcome({ status: "sent", error: "Waiting for the sending hours: goes at 2026-09-16 12:00 UTC" })).toEqual({ state: "waiting" });
    expect(textOutcome({ status: "sent", error: "Unknown: check with the provider before resending" })).toEqual({ state: "unknown" });
    expect(textOutcome({ status: "queued" })).toEqual({ state: "going" });
  });
});
