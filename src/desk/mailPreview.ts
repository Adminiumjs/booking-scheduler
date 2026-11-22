/**
 * A template's own words on a desk preview (BN-19): the sheet shows the offer as
 * it is sent, in the guest's language, from the words the outbox sends. The seven
 * other languages load only when a sheet needs one.
 */
import { useEffect, useState } from "react";

import { EMAIL_EN, type Words } from "../manifest/email-en.ts";

async function wordsFor(tag: string): Promise<Words> {
  if (tag === "en-US") return EMAIL_EN;
  const { EMAIL_BY_TAG } = await import("../manifest/email-words.ts");
  return EMAIL_BY_TAG[tag] ?? EMAIL_EN;
}

export function useMailWords(language: string | null): { words: Words; tag: string } {
  const tag = language ?? "en-US";
  const [words, setWords] = useState<Words>(EMAIL_EN);
  useEffect(() => {
    let on = true;
    void wordsFor(tag).then((w) => {
      if (on) setWords(w);
    });
    return () => {
      on = false;
    };
  }, [tag]);
  return { words, tag: words === EMAIL_EN ? "en-US" : tag };
}

/** The offer as the server writes it: its day and time in the guest's language, on the studio's clock. */
export function offerText(words: Words, tag: string, at: number, zone: string, facts: { service: string; person: string; first: string }) {
  const day = new Intl.DateTimeFormat(tag, { dateStyle: "full", timeZone: zone }).format(at);
  const time = new Intl.DateTimeFormat(tag, { timeStyle: "short", timeZone: zone }).format(at);
  const marks: Record<string, string> = { S: facts.service, D: day, T: time, P: facts.person, N: facts.first };
  const fill = (text: string) => text.replace(/\{([A-Z]+)\}/g, (whole, mark: string) => marks[mark] ?? whole);
  return { subject: fill(words.offerSubject), heading: words.offerHeading, intro: fill(words.offerIntro), button: words.offerButton, first: words.offerFirst, leave: words.offerLeave };
}
