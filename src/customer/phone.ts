/**
 * What the booking form makes of a typed phone number, for the box for texts
 * (plan 80, the App rules 5 and 6). Only a first look in the page: Adminium
 * reads the number properly when it records the yes and at every send.
 *
 *   none        nothing typed: the box stays hidden (A5, L03);
 *   china       a mainland China number (+86): the box is off, and the form
 *               still books with it, for a phone call. +852 and +886 are not;
 *   unreadable  not a phone number as typed: with the box ticked, the page
 *               asks the guest to check it, and still books;
 *   ok          looks like one.
 */
export type PhoneLook = "none" | "china" | "unreadable" | "ok";

/** The marks people type between digits. */
const MARKS = /[\s().\-/ ]/g;

export function lookAtPhone(typed: string): PhoneLook {
  const compact = typed.trim().replace(MARKS, "");
  if (compact === "") return "none";
  if (/^(?:\+|00)86/.test(compact)) return "china";
  // E.164 allows 15 digits after the country code's "+"; a local number is read in the studio's country by Adminium.
  if (/^(?:\+|00)[1-9]\d{6,14}$/.test(compact) || /^\d{6,15}$/.test(compact)) return "ok";
  return "unreadable";
}

/** Whether a tick on the box can stand for this number: a number is typed, and it is not one texts never go to. */
export const textsPossible = (look: PhoneLook): boolean => look === "ok" || look === "unreadable";
