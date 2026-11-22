/**
 * The e-mails' English words and their shape. A module of its own, with nothing
 * of the manifest in it, so the desk's preview can show a template's own words
 * (BN-19) without carrying the manifest into the page.
 */
import type { Kind } from "./outbox.ts";

export interface Words {
  names: Record<Kind | "staff", string>;
  minutes: string;
  when: string;
  with: string;
  code: string;
  price: string;
  atStudio: string;
  paidOnline: string;
  toPayStudio: string;
  toPayOnline: string;
  addToCalendar: string;
  fileAttached: string;
  fileRemoves: string;
  freeUntil: string;
  tooLate: string;
  freeUntilPaid: string;
  tooLatePaid: string;
  manage: string;
  bookAnother: string;
  anyone: string;
  bookedSubject: string;
  bookedPre: string;
  bookedHeading: string;
  bookedThanks: string;
  paidPre: string;
  paidThanks: string;
  linkSubject: string;
  linkPre: string;
  linkHeading: string;
  linkIntro: string;
  linkHold: string;
  linkUntil: string;
  linkPay: string;
  linkSecure: string;
  linkNoCard: string;
  letSubject: string;
  letPre: string;
  letHeading: string;
  letBody: string;
  remSubject: string;
  remPre: string;
  remHeading: string;
  remIntro: string;
  remBring: string;
  remFree: string;
  remLate: string;
  movedSubject: string;
  movedPre: string;
  movedHeading: string;
  movedIntro: string;
  movedFile: string;
  movedOld: string;
  cancelSubject: string;
  cancelHeading: string;
  cancelPre: string;
  cancelIntro: string;
  cancelBack: string;
  cancelBackNote: string;
  latePre: string;
  lateIntro: string;
  lateKept: string;
  lateNote: string;
  studioSubject: string;
  studioPre: string;
  studioHeading: string;
  studioIntro: string;
  studioBack: string;
  studioNothing: string;
  reviewSubject: string;
  reviewPre: string;
  reviewHeading: string;
  reviewIntro: string;
  againSubject: string;
  againLine: string;
  starsHint: string;
  star: string;
  reviewButton: string;
  reviewAlike: string;
  reviewStop: string;
  reviewStopNote: string;
  offerSubject: string;
  offerHeading: string;
  offerIntro: string;
  offerButton: string;
  offerFirst: string;
  offerLeave: string;
  staffSubject: string;
  staffPre: string;
  staffHeading: string;
  staffAnyone: string;
  staffOpen: string;
}

export const EMAIL_EN: Words = {
  names: {
    booked: "Booked",
    deposit_receipt: "Booked, deposit paid",
    deposit_link: "Pay your deposit",
    let_go: "We let your time go",
    reminder: "Reminder, the day before",
    moved: "Your booking has moved",
    cancelled: "Cancelled by you, in time",
    cancelled_late: "Cancelled by you, late",
    cancelled_studio: "Cancelled by the studio",
    offer: "A time opened",
    review_request: "Review request",
    review_reminder: "Review reminder",
    staff: "New booking, to the specialist",
  },
  minutes: "min",
  when: "When",
  with: "With",
  code: "Booking code",
  price: "Price",
  atStudio: "Pay at the studio",
  paidOnline: "Paid online",
  toPayStudio: "To pay at the studio",
  toPayOnline: "To pay online now",
  addToCalendar: "Add to calendar",
  fileAttached: "Your calendar file is attached to this e-mail.",
  fileRemoves: "The attached calendar file removes it from your calendar.",
  freeUntil: "Free to cancel or move until {FREE}. After that, moving isn't possible online.",
  tooLate: "This visit is less than {H} hours away, so it can't be moved online. Reply to this e-mail to ask us.",
  freeUntilPaid: "Free to cancel or move until {FREE}, and what you paid comes back automatically. After that, moving isn't possible online and it is kept. If you don't come, it is kept.",
  tooLatePaid: "This visit is less than {H} hours away, so it can't be moved online and what you paid is kept if you cancel. Reply to this e-mail to ask us.",
  manage: "Manage your booking",
  bookAnother: "Book another time",
  anyone: "You chose Anyone, so we booked {P}.",
  bookedSubject: "Booked: {S}, {D} at {T}",
  bookedPre: "{D}, {T} with {P}.",
  bookedHeading: "You're booked, {N}",
  bookedThanks: "Thanks for booking. Keep this e-mail: its link opens your booking.",
  paidPre: "Your payment is in. {D}, {T} with {P}.",
  paidThanks: "We have your payment, so your time is held for you.",
  linkSubject: "Pay your deposit to keep {D}, {T}",
  linkPre: "{S} with {P}. We hold the time for {HOLD} minutes after you open the link.",
  linkHeading: "Pay your deposit to keep your time",
  linkIntro: "Hi {N}, our front desk booked this for you. {S} takes a {DUE} deposit online.",
  linkHold: "We'll hold the time for {HOLD} minutes after you open this link.",
  linkUntil: "This link works until {UNTIL}.",
  linkPay: "Pay {DUE}",
  linkSecure: "You pay on the payment service's own secure page.",
  linkNoCard: "We never ask for card details by e-mail.",
  letSubject: "We let your time go: {D}, {T}",
  letPre: "The payment didn't come in time. Nothing was taken.",
  letHeading: "We let your time go",
  letBody: "The payment for this visit didn't come in time, so the time is free for others again. Nothing was taken.",
  remSubject: "See you tomorrow at {T}",
  remPre: "{S} with {P}, {D}.",
  remHeading: "See you tomorrow at {T}",
  remIntro: "Hi {N}, here are the details of your visit.",
  remBring: "What to bring: {{service.bring}}",
  remFree: "You can still move or cancel it free until {FREE}.",
  remLate: "This visit is less than {H} hours away, so it can't be moved online. Reply to this e-mail to ask us.",
  movedSubject: "Moved: {S}, now {D} at {T}",
  movedPre: "Your new time is {D}, {T} with {P}.",
  movedHeading: "Your booking has moved",
  movedIntro: "Hi {N}, here is your new time. Your booking code stays the same.",
  movedFile: "Your calendar file has been updated.",
  movedOld: "If you added the old time with the Google or Outlook link, remove it: those entries don't change by themselves.",
  cancelSubject: "Cancelled: {S}, {D}",
  cancelHeading: "Your booking is cancelled",
  cancelPre: "You cancelled in time, so nothing is kept.",
  cancelIntro: "Hi {N}, you cancelled in time, so nothing is kept.",
  cancelBack: "The {WAS} you paid is on its way back.",
  cancelBackNote: "It goes back the way you paid. Your bank decides when it shows on your statement.",
  latePre: "We've cancelled your visit as you asked.",
  lateIntro: "Hi {N}, we've cancelled your visit as you asked.",
  lateKept: "The {WAS} you paid is kept, as our policy says.",
  lateNote: "You cancelled less than {H} hours before the visit. There is no other charge.",
  studioSubject: "We've had to cancel your visit on {D}",
  studioPre: "{S} at {T}. We're sorry. Here's why.",
  studioHeading: "We've had to cancel your visit",
  studioIntro: "Hi {N}, we're sorry. Here is the message from our front desk.",
  studioBack: "The {WAS} you paid is refunded in full.",
  studioNothing: "Anything paid online comes back in full. Nothing was paid online for this visit.",
  reviewSubject: "How was your {S}?",
  reviewPre: "Tap a star to tell us how your visit with {P} went.",
  reviewHeading: "How was your {S}?",
  reviewIntro: "Hi {N}, you saw {P} on {D}.",
  againSubject: "One last question about your {S}",
  againLine: "Just once more, and then we'll stop asking about this visit.",
  starsHint: "Tap a star to open the review page.",
  star: "★",
  reviewButton: "Tell us how it went",
  reviewAlike: "We publish good and bad reviews alike.",
  reviewStop: "Stop review requests",
  reviewStopNote: "One click. You won't need to sign in.",
  offerSubject: "A time opened: {S}, {D} at {T}",
  offerHeading: "A time opened",
  offerIntro: "Hi {N}, a time you were waiting for is free: {S}, {D}, {T} with {P}.",
  offerButton: "Book it",
  offerFirst: "First come, first served. If it's gone, you stay on the list.",
  offerLeave: "Leave the waiting list",
  staffSubject: "New booking: {{service_name}}, {{record.starts_at}}",
  staffPre: "{{record.code}}, {{record.starts_at}}.",
  staffHeading: "New booking for you",
  staffAnyone: "Open your diary to see who is coming.",
  staffOpen: "Open your diary",
};
