/**
 * Area bundle: **screens, second half** — `screens/Help.tsx` through
 * `screens/WaitlistStatus.tsx` alphabetically: the guest-facing portal
 * (Help, Home, Intake, Join, Location, Loyalty, LoyaltyHistory, Manage,
 * MyGifts, NotFound, NotifPrefs, Offers, Orders, Packages, Policy, Post,
 * Refer, Reviews, Rewards, Services, Shop, SignIn, Staff, Visits, Waitlist,
 * WaitlistStatus) and the native-app tabs in `Mobile.tsx`.
 *
 * Add keys to all eight locales at once. See `chrome.ts` for the plural-variant
 * order each locale expects; shared counted nouns (`count.*`) already live
 * there — reuse them rather than re-declaring them here.
 *
 * In-fiction demo content is deliberately absent (18-marketplace-launch.md
 * §3.4): treatment names, staff and client names, journal bodies, review text,
 * promo codes, package names and the studio address stay English. So do the
 * brand names — `Lumen Studio`, `Studio Circle`, `Circle`, `iPhone`,
 * `Android` — which are never translated in any locale.
 */
import type { LocaleTag } from '../locales';

export const screensB = {
  'en-US': {
    /* --- shared inside this area --- */
    'screensB.common.all': 'All',
    'screensB.common.anyService': 'Any service',
    'screensB.common.backHome': 'Back home',
    'screensB.common.backToDashboard': 'Back to dashboard',
    'screensB.common.book': 'Book',
    'screensB.common.bookNamed': 'Book {name}',
    'screensB.common.bookWith': 'Book with {name}',
    'screensB.common.cancel': 'Cancel',
    'screensB.common.codeCopied': '{code} copied',
    'screensB.common.copyCode': 'Copy the code {code}',
    'screensB.common.demoOnly': '{label} — demo only',
    'screensB.common.email': 'Email',
    'screensB.common.firstAvailable': 'First available',
    'screensB.common.fullName': 'Full name',
    'screensB.common.howItWorks': 'How it works',
    'screensB.common.leave': 'Leave',
    'screensB.common.optional': '(optional)',
    'screensB.common.phEmail': 'you@email.com',
    'screensB.common.phone': 'Phone',
    'screensB.common.pointsUnit': 'point|points',
    'screensB.common.ptsCount': '{count} pt|{count} pts',
    'screensB.common.ptsUnit': 'pt|pts',
    'screensB.common.receipt': 'Receipt',
    'screensB.common.reschedule': 'Reschedule',
    'screensB.common.seeAll': 'See all',
    'screensB.common.time': 'Time',
    'screensB.common.timeDur': '{time} · {duration}',
    'screensB.common.toastMaps': 'Opening Maps — demo only',
    'screensB.common.total': 'Total',
    'screensB.common.when': 'When',
    'screensB.common.with': 'With',

    /* --- Help --- */
    'screensB.help.title': 'How can we help?',
    'screensB.help.sub': 'Answers to the things guests ask us most.',
    'screensB.help.searchPlaceholder': 'Search help articles…',
    'screensB.help.searchLabel': 'Search help articles',
    'screensB.help.results':
      '{count} answer for “{query}”|{count} answers for “{query}”',
    'screensB.help.common': 'Common questions',
    'screensB.help.emptyTitle': 'No matches',
    'screensB.help.emptyBody':
      'Try a shorter search, or text us — a real person answers between 9 and 6.',
    'screensB.help.stuckTitle': 'Still stuck?',
    'screensB.help.stuckBody':
      'Our cancellation policy covers most booking questions in plain language.',
    'screensB.help.readPolicy': 'Read the policy',

    /* --- Home --- */
    'screensB.home.eyebrow': 'Boutique beauty & wellness',
    'screensB.home.title': 'Feel like the best version of you.',
    'screensB.home.lede':
      'Hair, spa, nails, and movement under one calm roof. Book a chair or a treatment room in a few taps — no phone tag, no account needed.',
    'screensB.home.bookNow': 'Book now',
    'screensB.home.viewServices': 'View services',
    'screensB.home.trustOpenings': 'Same-week openings',
    'screensB.home.trustDowntown': 'Downtown studio',
    'screensB.home.trustWalkins': 'Walk-ins welcome',
    'screensB.home.popularTitle': 'Popular services',
    'screensB.home.popularSub': 'A little something from every corner of the studio.',
    'screensB.home.teamTitle': 'Meet the team',
    'screensB.home.teamSub': 'Four specialists, one very tidy calendar.',
    'screensB.home.lovedTitle': 'Loved by regulars',
    'screensB.home.lovedSub': 'What guests say once they’re back in the real world.',
    'screensB.home.ratingFrom': 'from {count} review|from {count} reviews',
    'screensB.home.hoursTitle': 'Weekly hours',
    'screensB.home.hoursNote':
      'Individual specialists keep their own hours — you’ll see live openings when you book.',

    /* --- Intake --- */
    'screensB.intake.doneTitle': 'Intake form saved',
    'screensB.intake.doneBody':
      'Thank you — your specialist will review this before your visit. This is a demo, so nothing is actually stored.',
    'screensB.intake.editAnswers': 'Edit answers',
    'screensB.intake.title': 'Digital intake form',
    'screensB.intake.sub':
      'A few quick things so your specialist can tailor the visit. Takes about a minute.',
    'screensB.intake.concernsLegend': 'Anything that applies to you?',
    'screensB.intake.allergiesLabel': 'Allergies or sensitivities',
    'screensB.intake.allergiesPlaceholder': 'Fragrances, latex, specific products…',
    'screensB.intake.pressureLabel': 'Preferred pressure / intensity',
    'screensB.intake.consent':
      'I confirm the above is accurate and consent to treatment. I understand I can update this any time before my visit.',
    'screensB.intake.submit': 'Save intake form',

    /* --- Join --- */
    'screensB.join.cycleMonthly': 'Monthly',
    'screensB.join.cycleAnnual': 'Annual · 2 months free',
    'screensB.join.startToday': 'Start today',
    'screensB.join.startFirst': 'Start on the 1st',
    'screensB.join.title': 'Join the Circle',
    'screensB.join.sub':
      'A monthly treatment, ten per cent off everything else, and first refusal on cancellations. Cancel whenever — no notice period.',
    'screensB.join.billingCycle': 'Billing cycle',
    'screensB.join.mostJoined': 'Most joined',
    'screensB.join.perYear': '/year',
    'screensB.join.perMonth': '/month',
    'screensB.join.selected': 'Selected · continue',
    'screensB.join.choose': 'Choose {name}',
    'screensB.join.note':
      'Membership pays for itself in one visit a month. Unused monthly treatments roll over once. Demo signup — no card is charged.',
    'screensB.join.otherPlans': 'Other plans',
    'screensB.join.payTitle': 'Confirm your membership',
    'screensB.join.yourDetails': 'Your details',
    'screensB.join.mobile': 'Mobile',
    'screensB.join.starts': 'Starts',
    'screensB.join.lineAnnual': '{name} · 12 months',
    'screensB.join.lineFirstMonth': '{name} · first month',
    'screensB.join.startsToday': 'Starts today',
    'screensB.join.prorata': 'Pro-rata credit',
    'screensB.join.joiningFee': 'Joining fee',
    'screensB.join.waived': 'Waived',
    'screensB.join.errEmail': 'Add an email so we can send the card',
    'screensB.join.welcome': 'Welcome to the Circle',
    'screensB.join.summaryAnnual': '{name} · annual',
    'screensB.join.summaryMonthly': '{name} · monthly',
    'screensB.join.dueToday': 'Due today',
    'screensB.join.startMembership': 'Start my membership',
    'screensB.join.fine':
      'Cancel any time from your account. Demo only — nothing is charged.',
    'screensB.join.doneTitle': 'You’re in the Circle',
    'screensB.join.doneSub':
      'Your first treatment credit is already sitting in your account, and every booking from now takes ten per cent off automatically.',
    'screensB.join.rowPlan': 'Plan',
    'screensB.join.rowBilling': 'Billing',
    'screensB.join.billingAnnually': 'Annually · {amount}',
    'screensB.join.billingMonthly': 'Monthly · {amount}',
    'screensB.join.rowMemberNo': 'Member number',
    'screensB.join.seeRewards': 'See your rewards',
    'screensB.join.useCredit': 'Use my credit',

    /* --- LoyaltyHistory --- */
    'screensB.lhistory.title': 'Loyalty history',
    'screensB.lhistory.sub': 'Every point you’ve earned and spent with Studio Circle.',
    'screensB.lhistory.currentBalance': 'Current balance',
    'screensB.lhistory.redeemRewards': 'Redeem rewards',

    /* --- Location --- */
    'screensB.location.title': 'Find us',
    'screensB.location.lede':
      'Two floors above the bakery on Alder Lane. Ring the bell marked Studio if the street door is shut.',
    'screensB.location.rowAddress': 'Address',
    'screensB.location.rowGettingIn': 'Getting in',
    'screensB.location.addressValue': '{line1}, {line2}',
    'screensB.location.getDirections': 'Get directions',
    'screensB.location.callStudio': 'Call the studio',
    'screensB.location.toastDial': 'Dialling {phone} — demo only',
    'screensB.location.openingHours': 'Opening hours',
    'screensB.location.openToday': 'Open today',
    'screensB.location.closedToday': 'Closed today',
    'screensB.location.beforeYouArrive': 'Before you arrive',

    /* --- Loyalty --- */
    'screensB.loyalty.h1': 'A little glow with every visit.',
    'screensB.loyalty.sub':
      'Earn a point for every dollar, redeem for services you love, and unlock more as a member. It’s free to join.',
    'screensB.loyalty.yourPoints': 'Your points',
    'screensB.loyalty.member': 'Member',
    'screensB.loyalty.progressLabel': 'Progress to your next free service',
    'screensB.loyalty.unlocked': 'You’ve unlocked a free service — redeem below.',
    'screensB.loyalty.toGo':
      '{count} pt until your next free service|{count} pts until your next free service',
    'screensB.loyalty.redeemTitle': 'Redeem your points',
    'screensB.loyalty.locked': 'Locked',
    'screensB.loyalty.redeem': 'Redeem',
    'screensB.loyalty.becomeMember': 'Become a member',
    'screensB.loyalty.becomeSub':
      'Go further with Studio Circle membership — cancel anytime.',
    'screensB.loyalty.mostLoved': 'Most loved',
    'screensB.loyalty.youreMember': 'You’re a member ✓',
    'screensB.loyalty.joinPlan': 'Join {name}',

    /* --- Manage --- */
    'screensB.manage.title': 'Manage booking',
    'screensB.manage.sub':
      'Reschedule or cancel an appointment with your code and email.',
    'screensB.manage.fieldCode': 'Booking code',
    'screensB.manage.fieldEmail': 'Email on the booking',
    'screensB.manage.find': 'Find my booking',
    'screensB.manage.tip':
      'Demo tip: the fields are pre-filled with a booking that already exists — just hit Find.',
    'screensB.manage.withRole': '{name} · {role}',
    'screensB.manage.cancelled': 'Cancelled',
    'screensB.manage.confirmed': 'Confirmed',
    'screensB.manage.cancelledNote':
      'This appointment was cancelled. Book again any time — we’d love to have you.',
    'screensB.manage.findAnother': 'Find another booking',

    /* --- Mobile --- */
    'screensB.mobile.deviceIphone': 'iPhone',
    'screensB.mobile.deviceAndroid': 'Android phone',
    'screensB.mobile.deviceFrame': 'Device frame',
    'screensB.mobile.eyebrow': 'Companion app',
    'screensB.mobile.h1': '{brand} in your pocket',
    'screensB.mobile.sub':
      'The phone app is its own design, not a squeezed-down website — five tabs, a booking flow built for thumbs, and your points on the home screen. What follows is a showcase of that design rather than the shipping app, but it is not a screenshot: tap through it.',
    'screensB.mobile.switchNote':
      'This switches the handset, not the app. The Android build has its own Material design — a different nav bar, tighter top spacing — which is a separate comp and is not shown here.',
    'screensB.mobile.yourProfile': 'Your profile',
    'screensB.mobile.appTabs': 'App tabs',
    'screensB.mobile.greetMorning': 'Good morning, {name}',
    'screensB.mobile.greetAfternoon': 'Good afternoon, {name}',
    'screensB.mobile.greetEvening': 'Good evening, {name}',
    'screensB.mobile.toastPickTime': 'Pick a time first',
    'screensB.mobile.toastBooked': 'Booking confirmed',
    'screensB.mobile.toastPickNewTime': 'Pick a new time',
    'screensB.mobile.ctaConfirm': 'Confirm · {time}',
    'screensB.mobile.ctaPickTime': 'Pick a time to continue',
    'screensB.mobile.note':
      'A design showcase, not the running app — nothing you tap here reaches your account. The tabs, the booking flow and the promo codes are live so the design can be felt; rows that opened the app’s deeper screens (the team, the shelf, gift cards) answer with a toast instead, and those flows ship in full on the web. The phone itself is a reconstruction: the comps imported a device frame that was never handed over with them.',
    'screensB.mobile.nextVisit': 'Next visit',
    'screensB.mobile.manage': 'Manage',
    'screensB.mobile.directions': 'Directions',
    'screensB.mobile.bookAgain': 'Book again',
    'screensB.mobile.durPrice': '{duration} · {price}',
    'screensB.mobile.durStaff': '{duration} · {staff}',
    'screensB.mobile.durWithStaff': '{duration} · with {staff}',
    'screensB.mobile.pointsGoal':
      '{count} point to your next {reward}|{count} points to your next {reward}',
    'screensB.mobile.pointsReady': 'Your {reward} is ready to redeem',
    'screensB.mobile.toastJournal': 'Opening the journal — demo only',
    'screensB.mobile.allServices': 'All services',
    'screensB.mobile.pickDay': 'Pick a day',
    'screensB.mobile.pickTime': 'Pick a time',
    'screensB.mobile.toastTaken': 'That slot is taken',
    'screensB.mobile.upcoming': 'Upcoming',
    'screensB.mobile.past': 'Past',
    'screensB.mobile.dateTime': '{date} · {time}',
    'screensB.mobile.whenWho': '{when} · {who}',
    'screensB.mobile.toastCancelled': 'Cancelled — demo only',
    'screensB.mobile.toastReceipt': 'Receipt emailed',
    'screensB.mobile.circle': 'Circle',
    'screensB.mobile.statPoints': 'Points',
    'screensB.mobile.preferences': 'Preferences',
    'screensB.mobile.account': 'Account',
    'screensB.mobile.pushNotifications': 'Push notifications',
    'screensB.mobile.darkAppearance': 'Dark appearance',
    'screensB.mobile.toastPushOn': 'Push on',
    'screensB.mobile.toastPushOff': 'Push off',
    'screensB.mobile.signOut': 'Sign out',
    'screensB.mobile.toastSignedOut': 'Signed out — demo only',
    'screensB.mobile.version': '{brand} · {version}',
    'screensB.mobile.booked': 'You’re booked',
    'screensB.mobile.sheetSub': 'We’ve got you down for {service} with {staff}.',
    'screensB.mobile.firstSpecialistFree': 'the first specialist free',
    'screensB.mobile.seeMyVisits': 'See my visits',

    /* --- MyGifts --- */
    'screensB.mygifts.title': 'Purchased gift cards',
    'screensB.mygifts.sub': 'Gift cards you’ve bought and sent.',
    'screensB.mygifts.buy': 'Buy a gift card',
    'screensB.mygifts.emptyTitle': 'No gift cards yet',
    'screensB.mygifts.emptyBody':
      'Gift a little calm — the cards you buy will live here.',
    'screensB.mygifts.to': 'To {name} · {date}',
    'screensB.mygifts.sent': 'Sent',
    'screensB.mygifts.redeemed': 'Redeemed',

    /* --- NotFound --- */
    'screensB.notfound.h1': 'This page took a day off.',
    'screensB.notfound.body':
      'We couldn’t find what you were looking for — but there’s always a fresh look or a little calm waiting on the home page.',

    /* --- NotifPrefs --- */
    'screensB.notifprefs.title': 'Notification preferences',
    'screensB.notifprefs.sub':
      'Choose what reaches you, and how. Changes save as you go.',
    'screensB.notifprefs.channels': 'Channels',
    'screensB.notifprefs.whatWeSend': 'What we send',
    'screensB.notifprefs.timing': 'Timing',
    'screensB.notifprefs.remindMe': 'Remind me',
    'screensB.notifprefs.remindSub': 'How far ahead of a visit we get in touch.',
    'screensB.notifprefs.reminderTiming': 'Reminder timing',
    'screensB.notifprefs.quietHours': 'Quiet hours',
    'screensB.notifprefs.quietSub': 'Hold anything non-urgent until morning.',
    'screensB.notifprefs.quietWindow': 'Quiet window',
    'screensB.notifprefs.pauseTitle': 'Pause everything',
    'screensB.notifprefs.pauseBody':
      'Turns off every channel. Booking confirmations still arrive by email.',
    'screensB.notifprefs.pauseAll': 'Pause all',
    'screensB.notifprefs.toastPaused': 'All notifications paused',

    /* --- Offers --- */
    'screensB.offers.eyebrow': 'Autumn 2026',
    'screensB.offers.h1': 'Seasonal offers',
    'screensB.offers.sub':
      'A handful of things worth booking this season. Copy a code and it’ll apply at checkout — one per visit.',
    'screensB.offers.ends': 'Ends {date}',
    'screensB.offers.bookPairing': 'Book the pairing',
    'screensB.offers.toastCopied': '{code} copied to clipboard',
    'screensB.offers.note':
      'One offer per visit, not combinable with package sessions or gift-card top-ups. Members always get their 10% on top. Demo codes — nothing is discounted for real.',

    /* --- Orders --- */
    'screensB.orders.title': 'Order history',
    'screensB.orders.sub': 'Every visit, package and gift card you’ve paid for.',
    'screensB.orders.spent': 'Spent in 2026',
    'screensB.orders.emptyTitle': 'Nothing in this filter',
    'screensB.orders.emptyBody':
      'Try another category — your other orders are still there.',
    'screensB.orders.toastReceipt': 'Receipt {code} emailed to {email}',

    /* --- Packages --- */
    'screensB.packages.subject': '{qty} × {name}',
    'screensB.packages.studioServices': 'studio services',
    'screensB.packages.expires': 'Expires {date}',
    'screensB.packages.eyebrow': 'Prepaid bundles',
    'screensB.packages.h1': 'Package deals',
    'screensB.packages.sub':
      'Buy a few visits at once and pay less per session. Sessions sit in your account until you book them — no monthly fee, no expiry games.',
    'screensB.packages.yourPackages': 'Your packages',
    'screensB.packages.left': 'left',
    'screensB.packages.sessionsUsed': '{name} sessions used',
    'screensB.packages.usedOf': '{used} of {total} used',
    'screensB.packages.bookSession': 'Book a session',
    'screensB.packages.available': 'Available packages',
    'screensB.packages.mostPopular': 'Most popular',
    'screensB.packages.save': 'Save {amount}',
    'screensB.packages.perSession': '{amount} / session',
    'screensB.packages.inAccount': 'In your account',
    'screensB.packages.buy': 'Buy package',
    'screensB.packages.toastAlready': '{name} is already in your account',
    'screensB.packages.toastAdded': '{name} added — demo only, no charge',
    'screensB.packages.note':
      'Sessions stay valid for 12 months, can be gifted to a friend once, and are refundable pro-rata. This is a demo — nothing is charged.',

    /* --- Policy --- */
    'screensB.policy.title': 'Cancellation policy',
    'screensB.policy.sub':
      'Plans change — we get it. Here’s how ours works, in plain language.',
    'screensB.policy.windowTitle': 'A 24-hour window',
    'screensB.policy.windowBody':
      'Cancel or reschedule up to 24 hours before your start time, free of charge, straight from Manage booking.',
    'screensB.policy.lateTitle': 'Late cancellations & no-shows',
    'screensB.policy.lateBody':
      'Inside 24 hours, a 50% fee applies. No-shows are charged in full so the chair doesn’t sit empty.',
    'screensB.policy.howTitle': 'How to cancel',
    'screensB.policy.howBody':
      'Head to Manage booking, enter your code and email, and choose Reschedule or Cancel — no phone call needed.',
    'screensB.policy.membersTitle': 'Members & packages',
    'screensB.policy.membersBody':
      'Studio Circle members get one fee-free late cancel each month. Package sessions are simply returned to your balance.',
    'screensB.policy.banner':
      'This is a demo policy for illustration — no fees are ever actually charged.',

    /* --- Post --- */
    'screensB.post.back': 'Back to journal',
    'screensB.post.emptyTitle': 'That post isn’t here',
    'screensB.post.emptyBody':
      'It may have been unpublished. Everything we’ve written is on the journal index.',
    'screensB.post.browse': 'Browse the journal',
    'screensB.post.byline': '{date} · {read}',
    'screensB.post.more': 'More from the journal',

    /* --- Refer --- */
    'screensB.refer.title': 'Refer a friend',
    'screensB.refer.sub': 'Give {amount}, get {amount}. Everyone leaves glowing.',
    'screensB.refer.yourCode': 'Your invite code',
    'screensB.refer.copyLink': 'Copy invite link',
    'screensB.refer.toastCopied': 'Invite link copied to clipboard',
    'screensB.refer.yourInvites': 'Your invites',

    /* --- Reviews --- */
    'screensB.reviews.justNow': 'just now',
    'screensB.reviews.total': '{reviews} reviews · {specialists} specialists',
    'screensB.reviews.starRow': '{stars}★',
    'screensB.reviews.composeSent': 'Your review is up',
    'screensB.reviews.composeTitle': 'Been in recently? Tell us how it went',
    'screensB.reviews.thanks':
      'Thank you — your review is live at the top of the list. You can edit it for the next 24 hours.',
    'screensB.reviews.starsAria': '{count} star|{count} stars',
    'screensB.reviews.placeholder':
      'What was the visit like? Anything the next guest should know?',
    'screensB.reviews.textareaLabel': 'Your review',
    'screensB.reviews.postingAs': 'Posting as {name} · your last visit was {date}',
    'screensB.reviews.post': 'Post review',
    'screensB.reviews.errEmpty': 'Add a line or two first',
    'screensB.reviews.toastPosted': 'Review posted · demo only',
    'screensB.reviews.showing': '{shown} of {total} shown',
    'screensB.reviews.metaStaff': '{service} · with {staff} · {date}',
    'screensB.reviews.metaStudio': '{service} · studio · {date}',
    'screensB.reviews.replyBy': '{name} replied',
    'screensB.reviews.helpful': 'Helpful · {n}',
    'screensB.reviews.report': 'Report',
    'screensB.reviews.toastFlagged': 'Flagged for the team to read',

    /* --- Rewards --- */
    'screensB.rewards.srTitle': 'Loyalty rewards',
    'screensB.rewards.yourSpecialist': 'your specialist',
    'screensB.rewards.yourBalance': 'Your balance',
    'screensB.rewards.progressLabel': 'Progress to your next {amount} reward',
    'screensB.rewards.canRedeem': 'You can redeem the {amount} reward now.',
    'screensB.rewards.toGo':
      '{count} point to your next {amount} reward|{count} points to your next {amount} reward',
    'screensB.rewards.factEarned': 'Earned this year',
    'screensB.rewards.factRedeemed': 'Redeemed',
    'screensB.rewards.factTier': 'Tier',
    'screensB.rewards.tierCircle': 'Circle',
    'screensB.rewards.tierGuest': 'Guest',
    'screensB.rewards.spendTitle': 'Spend your points',
    'screensB.rewards.redeemed': 'Redeemed · in your account',
    'screensB.rewards.redeem': 'Redeem',
    'screensB.rewards.pointsToGo': '{count} point to go|{count} points to go',
    'screensB.rewards.toastRedeemed': '{name} · added to your account',
    'screensB.rewards.recentPoints': 'Recent points',
    'screensB.rewards.howPointsWork': 'How points work',

    /* --- Services --- */
    'screensB.services.title': 'Services',
    'screensB.services.sub':
      'Pick what you’re in the mood for. Every booking is confirmed instantly — pick a specialist and a time next.',
    'screensB.services.filterLabel': 'Filter by category',

    /* --- Shop --- */
    'screensB.shop.title': 'The shelf',
    'screensB.shop.sub':
      'Everything we actually use on you, in the sizes we’d buy ourselves. Collect in studio or have it posted.',
    'screensB.shop.removeOne': 'Remove one {name}',
    'screensB.shop.addAnother': 'Add another {name}',
    'screensB.shop.addToBag': 'Add to bag',
    'screensB.shop.toastAdded': '{name} added to your bag',
    'screensB.shop.yourBag': 'Your bag',
    'screensB.shop.cartEmpty':
      'Nothing in the bag yet. Products can go on your visit’s bill if you’d rather pay in studio.',
    'screensB.shop.lineQty': '{qty} × {price}',
    'screensB.shop.subtotal': 'Subtotal',
    'screensB.shop.checkout': 'Checkout',
    'screensB.shop.ship': 'Free collection in studio · {amount} posted',

    /* --- SignIn --- */
    'screensB.signin.errEmail': 'Enter a valid email address.',
    'screensB.signin.toastCodeSent': 'Code sent · any six digits work',
    'screensB.signin.errCode': 'Enter all six digits to continue.',
    'screensB.signin.toastSignedIn': 'Signed in as {name}',
    'screensB.signin.welcome': 'Welcome back',
    'screensB.signin.lede':
      'Enter your email and we’ll send a six-digit code. No passwords to forget.',
    'screensB.signin.fieldEmail': 'Email address',
    'screensB.signin.remember': 'Keep me signed in on this device',
    'screensB.signin.emailCode': 'Email me a code',
    'screensB.signin.or': 'or',
    'screensB.signin.bookWithoutAccount': 'Book without an account',
    'screensB.signin.foot':
      'This is a demo sign-in — any email works and no code is really sent.',
    'screensB.signin.differentEmail': 'Use a different email',
    'screensB.signin.checkInbox': 'Check your inbox',
    'screensB.signin.sentTo': 'We sent a six-digit code to {email}',
    'screensB.signin.yourInbox': 'your inbox',
    'screensB.signin.codeLabel': 'Six-digit sign-in code',
    'screensB.signin.verify': 'Verify & sign in',
    'screensB.signin.didntGet': 'Didn’t get it?',
    'screensB.signin.resend': 'Resend code',
    'screensB.signin.toastNewCode': 'New code on its way',
    'screensB.signin.demoHint': 'Demo hint: any six digits will do.',

    /* --- Staff --- */
    'screensB.staff.dirTitle': 'The people in the chairs',
    'screensB.staff.dirLede':
      'Four specialists, each with their own hours and their own way of working. Pick whoever suits you — or let us match you.',
    'screensB.staff.nextFree': 'Next free · {when}',
    'screensB.staff.viewProfile': 'View profile',
    'screensB.staff.allSpecialists': 'All specialists',
    'screensB.staff.since': '{role} · with the studio since {year}',
    'screensB.staff.knownFor': 'Known for',
    'screensB.staff.guestsSay': 'What guests say',
    'screensB.staff.quoteMeta': '{service} · {date}',
    'screensB.staff.statRating': 'Average rating',
    'screensB.staff.statReviews': 'Reviews',
    'screensB.staff.statYears': 'At the studio',
    'screensB.staff.joinWaitlist': 'Join their wait list',
    'screensB.staff.usualWeek': 'Usual week',
    'screensB.staff.hourRange': '{from} – {to}',
    'screensB.staff.off': 'Off',
    'screensB.staff.servicesOffered': 'Services {name} offers',

    /* --- Visits --- */
    'screensB.visits.title': 'My upcoming visits',
    'screensB.visits.sub': 'Everything you’ve got booked with us.',
    'screensB.visits.emptyTitle': 'Nothing booked yet',
    'screensB.visits.emptyBody':
      'When you book a visit it’ll show up here with all the details.',
    'screensB.visits.bookVisit': 'Book a visit',
    'screensB.visits.appointment': 'Appointment',
    'screensB.visits.repeats':
      'Repeats {freq} · {count} visit|Repeats {freq} · {count} visits',
    'screensB.visits.manage': 'Reschedule or cancel',

    /* --- Waitlist --- */
    'screensB.waitlist.title': 'Wait list',
    'screensB.waitlist.lede':
      'Cancellations happen most days. Tell us what you’re after and we’ll text you the moment something opens.',
    'screensB.waitlist.joinTitle': 'Join the list',
    'screensB.waitlist.groupService': 'Which service?',
    'screensB.waitlist.groupDays': 'Days that work',
    'screensB.waitlist.groupTime': 'Time of day',
    'screensB.waitlist.groupNotify': 'Tell me by',
    'screensB.waitlist.winMornings': 'Mornings',
    'screensB.waitlist.winAfternoons': 'Afternoons',
    'screensB.waitlist.winEvenings': 'Evenings',
    'screensB.waitlist.notifyText': 'Text',
    'screensB.waitlist.notifyEmail': 'Email',
    'screensB.waitlist.notifyPush': 'Push',
    'screensB.waitlist.oddsMany':
      'With that many days open, most guests hear from us within 48 hours.',
    'screensB.waitlist.oddsSome':
      'Two or three days is usually a few days’ wait this time of year.',
    'screensB.waitlist.oddsOne':
      'One day only can take a couple of weeks — add another if you can.',
    'screensB.waitlist.addMe': 'Add me to the list',
    'screensB.waitlist.errPickDay': 'Pick at least one day that works',
    'screensB.waitlist.toastJoinedText': 'On the list · we’ll be in touch by text',
    'screensB.waitlist.toastJoinedEmail': 'On the list · we’ll be in touch by email',
    'screensB.waitlist.toastJoinedPush': 'On the list · we’ll be in touch by push',
    'screensB.waitlist.waitingOn': 'You’re waiting on',
    'screensB.waitlist.emptyTitle': 'Nothing yet',
    'screensB.waitlist.emptyBody':
      'Add yourself using the form and it’ll show up here with your place in line.',
    'screensB.waitlist.toastWidened': 'Window widened · we’ll look at more days',
    'screensB.waitlist.flexible': 'flexible',
    'screensB.waitlist.entryStaffDate': 'with {staff} · {date}',
    'screensB.waitlist.entryAnyDate': 'any specialist · {date}',
    'screensB.waitlist.inLine': '#{pos} in line',
    'screensB.waitlist.oddsNext': 'You’re next — we’ll text you the moment it opens.',
    'screensB.waitlist.oddsWait':
      'About {count} day’s wait at this time of year.|About {count} days’ wait at this time of year.',
    'screensB.waitlist.widen': 'Widen my window',

    /* --- WaitlistStatus --- */
    'screensB.wstatus.title': 'Waitlist status',
    'screensB.wstatus.sub':
      'Days you’re waiting on — we’ll text you the moment a spot opens.',
    'screensB.wstatus.emptyTitle': 'You’re not on any waitlists',
    'screensB.wstatus.emptyBody':
      'If a day is fully booked, join its waitlist from the date & time step and it’ll appear here.',
    'screensB.wstatus.flexible': 'Flexible',
    'screensB.wstatus.whenWho': '{date} · {who}',
    'screensB.wstatus.waiting': 'Waiting for an opening',
  },

  'de-DE': {
    /* --- shared inside this area --- */
    'screensB.common.all': 'Alle',
    'screensB.common.anyService': 'Beliebige Leistung',
    'screensB.common.backHome': 'Zur Startseite',
    'screensB.common.backToDashboard': 'Zurück zum Dashboard',
    'screensB.common.book': 'Buchen',
    'screensB.common.bookNamed': '{name} buchen',
    'screensB.common.bookWith': 'Bei {name} buchen',
    'screensB.common.cancel': 'Stornieren',
    'screensB.common.codeCopied': '{code} kopiert',
    'screensB.common.copyCode': 'Code {code} kopieren',
    'screensB.common.demoOnly': '{label} — nur Demo',
    'screensB.common.email': 'E-Mail',
    'screensB.common.firstAvailable': 'Wer frei ist',
    'screensB.common.fullName': 'Vollständiger Name',
    'screensB.common.howItWorks': 'So funktioniert es',
    'screensB.common.leave': 'Verlassen',
    'screensB.common.optional': '(optional)',
    'screensB.common.phEmail': 'du@email.de',
    'screensB.common.phone': 'Telefon',
    'screensB.common.pointsUnit': 'Punkt|Punkte',
    'screensB.common.ptsCount': '{count} Punkt|{count} Punkte',
    'screensB.common.ptsUnit': 'Pkt.|Pkt.',
    'screensB.common.receipt': 'Beleg',
    'screensB.common.reschedule': 'Verschieben',
    'screensB.common.seeAll': 'Alle ansehen',
    'screensB.common.time': 'Uhrzeit',
    'screensB.common.timeDur': '{time} · {duration}',
    'screensB.common.toastMaps': 'Maps wird geöffnet — nur Demo',
    'screensB.common.total': 'Gesamt',
    'screensB.common.when': 'Wann',
    'screensB.common.with': 'Bei',

    /* --- Help --- */
    'screensB.help.title': 'Wie können wir helfen?',
    'screensB.help.sub': 'Antworten auf das, was Gäste uns am häufigsten fragen.',
    'screensB.help.searchPlaceholder': 'Hilfeartikel durchsuchen…',
    'screensB.help.searchLabel': 'Hilfeartikel durchsuchen',
    'screensB.help.results':
      '{count} Antwort zu „{query}“|{count} Antworten zu „{query}“',
    'screensB.help.common': 'Häufige Fragen',
    'screensB.help.emptyTitle': 'Keine Treffer',
    'screensB.help.emptyBody':
      'Versuch es mit einem kürzeren Suchbegriff oder schreib uns — zwischen 9 und 18 Uhr antwortet ein Mensch.',
    'screensB.help.stuckTitle': 'Immer noch offen?',
    'screensB.help.stuckBody':
      'Unsere Stornobedingungen beantworten die meisten Fragen zur Buchung in klaren Worten.',
    'screensB.help.readPolicy': 'Bedingungen lesen',

    /* --- Home --- */
    'screensB.home.eyebrow': 'Boutique für Beauty & Wellness',
    'screensB.home.title': 'Fühl dich wie die beste Version von dir.',
    'screensB.home.lede':
      'Haare, Spa, Nägel und Bewegung unter einem ruhigen Dach. Buche einen Stuhl oder einen Behandlungsraum mit wenigen Tipps — kein Telefonieren, kein Konto nötig.',
    'screensB.home.bookNow': 'Jetzt buchen',
    'screensB.home.viewServices': 'Leistungen ansehen',
    'screensB.home.trustOpenings': 'Termine noch diese Woche',
    'screensB.home.trustDowntown': 'Studio in der Innenstadt',
    'screensB.home.trustWalkins': 'Ohne Termin willkommen',
    'screensB.home.popularTitle': 'Beliebte Leistungen',
    'screensB.home.popularSub': 'Aus jeder Ecke des Studios etwas.',
    'screensB.home.teamTitle': 'Das Team',
    'screensB.home.teamSub': 'Vier Fachkräfte, ein sehr aufgeräumter Kalender.',
    'screensB.home.lovedTitle': 'Von Stammgästen geliebt',
    'screensB.home.lovedSub': 'Was Gäste sagen, wenn sie wieder draußen sind.',
    'screensB.home.ratingFrom': 'aus {count} Bewertung|aus {count} Bewertungen',
    'screensB.home.hoursTitle': 'Öffnungszeiten',
    'screensB.home.hoursNote':
      'Jede Fachkraft hat eigene Zeiten — freie Termine siehst du beim Buchen live.',

    /* --- Intake --- */
    'screensB.intake.doneTitle': 'Anamnesebogen gespeichert',
    'screensB.intake.doneBody':
      'Danke — deine Fachkraft schaut sich das vor deinem Termin an. Dies ist eine Demo, es wird nichts wirklich gespeichert.',
    'screensB.intake.editAnswers': 'Antworten ändern',
    'screensB.intake.title': 'Digitaler Anamnesebogen',
    'screensB.intake.sub':
      'Ein paar kurze Angaben, damit deine Fachkraft den Termin abstimmen kann. Dauert etwa eine Minute.',
    'screensB.intake.concernsLegend': 'Trifft etwas davon auf dich zu?',
    'screensB.intake.allergiesLabel': 'Allergien oder Empfindlichkeiten',
    'screensB.intake.allergiesPlaceholder': 'Düfte, Latex, bestimmte Produkte…',
    'screensB.intake.pressureLabel': 'Gewünschter Druck / gewünschte Intensität',
    'screensB.intake.consent':
      'Ich bestätige, dass die Angaben stimmen, und willige in die Behandlung ein. Mir ist klar, dass ich das jederzeit vor dem Termin ändern kann.',
    'screensB.intake.submit': 'Anamnesebogen speichern',

    /* --- Join --- */
    'screensB.join.cycleMonthly': 'Monatlich',
    'screensB.join.cycleAnnual': 'Jährlich · 2 Monate gratis',
    'screensB.join.startToday': 'Heute starten',
    'screensB.join.startFirst': 'Am 1. starten',
    'screensB.join.title': 'Circle beitreten',
    'screensB.join.sub':
      'Eine Behandlung im Monat, zehn Prozent auf alles andere und Vorrang bei Absagen. Jederzeit kündbar — ohne Frist.',
    'screensB.join.billingCycle': 'Abrechnung',
    'screensB.join.mostJoined': 'Am häufigsten gewählt',
    'screensB.join.perYear': '/Jahr',
    'screensB.join.perMonth': '/Monat',
    'screensB.join.selected': 'Gewählt · weiter',
    'screensB.join.choose': '{name} wählen',
    'screensB.join.note':
      'Die Mitgliedschaft rechnet sich ab einem Besuch im Monat. Nicht genutzte Behandlungen werden einmal übertragen. Demo-Anmeldung — es wird keine Karte belastet.',
    'screensB.join.otherPlans': 'Andere Tarife',
    'screensB.join.payTitle': 'Mitgliedschaft bestätigen',
    'screensB.join.yourDetails': 'Deine Daten',
    'screensB.join.mobile': 'Mobil',
    'screensB.join.starts': 'Beginn',
    'screensB.join.lineAnnual': '{name} · 12 Monate',
    'screensB.join.lineFirstMonth': '{name} · erster Monat',
    'screensB.join.startsToday': 'Beginnt heute',
    'screensB.join.prorata': 'Anteilige Gutschrift',
    'screensB.join.joiningFee': 'Aufnahmegebühr',
    'screensB.join.waived': 'Entfällt',
    'screensB.join.errEmail': 'Gib eine E-Mail an, damit wir die Karte senden können',
    'screensB.join.welcome': 'Willkommen im Circle',
    'screensB.join.summaryAnnual': '{name} · jährlich',
    'screensB.join.summaryMonthly': '{name} · monatlich',
    'screensB.join.dueToday': 'Heute fällig',
    'screensB.join.startMembership': 'Mitgliedschaft starten',
    'screensB.join.fine':
      'Jederzeit über dein Konto kündbar. Nur Demo — es wird nichts berechnet.',
    'screensB.join.doneTitle': 'Du bist im Circle',
    'screensB.join.doneSub':
      'Dein erstes Behandlungsguthaben liegt schon auf deinem Konto, und ab jetzt gehen bei jeder Buchung zehn Prozent automatisch ab.',
    'screensB.join.rowPlan': 'Tarif',
    'screensB.join.rowBilling': 'Abrechnung',
    'screensB.join.billingAnnually': 'Jährlich · {amount}',
    'screensB.join.billingMonthly': 'Monatlich · {amount}',
    'screensB.join.rowMemberNo': 'Mitgliedsnummer',
    'screensB.join.seeRewards': 'Prämien ansehen',
    'screensB.join.useCredit': 'Guthaben einlösen',

    /* --- LoyaltyHistory --- */
    'screensB.lhistory.title': 'Punkteverlauf',
    'screensB.lhistory.sub':
      'Jeder Punkt, den du bei Studio Circle gesammelt und ausgegeben hast.',
    'screensB.lhistory.currentBalance': 'Aktueller Stand',
    'screensB.lhistory.redeemRewards': 'Prämien einlösen',

    /* --- Location --- */
    'screensB.location.title': 'So findest du uns',
    'screensB.location.lede':
      'Zwei Etagen über der Bäckerei in der Alder Lane. Klingle bei „Studio“, wenn die Haustür zu ist.',
    'screensB.location.rowAddress': 'Adresse',
    'screensB.location.rowGettingIn': 'Zugang',
    'screensB.location.addressValue': '{line1}, {line2}',
    'screensB.location.getDirections': 'Route planen',
    'screensB.location.callStudio': 'Studio anrufen',
    'screensB.location.toastDial': '{phone} wird gewählt — nur Demo',
    'screensB.location.openingHours': 'Öffnungszeiten',
    'screensB.location.openToday': 'Heute geöffnet',
    'screensB.location.closedToday': 'Heute geschlossen',
    'screensB.location.beforeYouArrive': 'Vor deinem Besuch',

    /* --- Loyalty --- */
    'screensB.loyalty.h1': 'Ein bisschen Glow bei jedem Besuch.',
    'screensB.loyalty.sub':
      'Sammle einen Punkt pro Dollar, löse sie für Lieblingsleistungen ein und schalte als Mitglied mehr frei. Der Beitritt ist kostenlos.',
    'screensB.loyalty.yourPoints': 'Deine Punkte',
    'screensB.loyalty.member': 'Mitglied',
    'screensB.loyalty.progressLabel': 'Fortschritt zur nächsten Gratisleistung',
    'screensB.loyalty.unlocked':
      'Du hast eine Gratisleistung freigeschaltet — jetzt einlösen.',
    'screensB.loyalty.toGo':
      'Noch {count} Punkt bis zur nächsten Gratisleistung|Noch {count} Punkte bis zur nächsten Gratisleistung',
    'screensB.loyalty.redeemTitle': 'Punkte einlösen',
    'screensB.loyalty.locked': 'Gesperrt',
    'screensB.loyalty.redeem': 'Einlösen',
    'screensB.loyalty.becomeMember': 'Mitglied werden',
    'screensB.loyalty.becomeSub':
      'Mehr rausholen mit der Studio-Circle-Mitgliedschaft — jederzeit kündbar.',
    'screensB.loyalty.mostLoved': 'Am beliebtesten',
    'screensB.loyalty.youreMember': 'Du bist Mitglied ✓',
    'screensB.loyalty.joinPlan': '{name} beitreten',

    /* --- Manage --- */
    'screensB.manage.title': 'Buchung verwalten',
    'screensB.manage.sub':
      'Termin mit Code und E-Mail verschieben oder stornieren.',
    'screensB.manage.fieldCode': 'Buchungscode',
    'screensB.manage.fieldEmail': 'E-Mail der Buchung',
    'screensB.manage.find': 'Buchung finden',
    'screensB.manage.tip':
      'Demo-Tipp: Die Felder sind mit einer bestehenden Buchung vorbelegt — einfach auf Finden tippen.',
    'screensB.manage.withRole': '{name} · {role}',
    'screensB.manage.cancelled': 'Storniert',
    'screensB.manage.confirmed': 'Bestätigt',
    'screensB.manage.cancelledNote':
      'Dieser Termin wurde storniert. Buche jederzeit neu — wir freuen uns auf dich.',
    'screensB.manage.findAnother': 'Andere Buchung suchen',

    /* --- Mobile --- */
    'screensB.mobile.deviceIphone': 'iPhone',
    'screensB.mobile.deviceAndroid': 'Android-Handy',
    'screensB.mobile.deviceFrame': 'Geräterahmen',
    'screensB.mobile.eyebrow': 'Begleit-App',
    'screensB.mobile.h1': '{brand} für die Hosentasche',
    'screensB.mobile.sub':
      'Die Handy-App ist ein eigenes Design, keine gequetschte Website — fünf Tabs, ein Buchungsablauf für Daumen und deine Punkte auf dem Startbildschirm. Was folgt, zeigt dieses Design und nicht die ausgelieferte App, ist aber kein Screenshot: tipp dich durch.',
    'screensB.mobile.switchNote':
      'Das wechselt das Gerät, nicht die App. Der Android-Build hat sein eigenes Material-Design — andere Navigationsleiste, engerer Abstand oben — das ist ein eigener Entwurf und hier nicht zu sehen.',
    'screensB.mobile.yourProfile': 'Dein Profil',
    'screensB.mobile.appTabs': 'App-Tabs',
    'screensB.mobile.greetMorning': 'Guten Morgen, {name}',
    'screensB.mobile.greetAfternoon': 'Guten Tag, {name}',
    'screensB.mobile.greetEvening': 'Guten Abend, {name}',
    'screensB.mobile.toastPickTime': 'Wähl zuerst eine Uhrzeit',
    'screensB.mobile.toastBooked': 'Buchung bestätigt',
    'screensB.mobile.toastPickNewTime': 'Wähl eine neue Uhrzeit',
    'screensB.mobile.ctaConfirm': 'Bestätigen · {time}',
    'screensB.mobile.ctaPickTime': 'Uhrzeit wählen, um fortzufahren',
    'screensB.mobile.note':
      'Eine Design-Schau, nicht die laufende App — nichts, was du hier antippst, erreicht dein Konto. Die Tabs, der Buchungsablauf und die Aktionscodes sind aktiv, damit das Design spürbar wird; Zeilen, die zu tieferen Screens führten (Team, Regal, Geschenkkarten), antworten stattdessen mit einem Hinweis, und diese Abläufe gibt es im Web vollständig. Das Handy selbst ist eine Rekonstruktion: Die Entwürfe importierten einen Geräterahmen, der nie mitgeliefert wurde.',
    'screensB.mobile.nextVisit': 'Nächster Termin',
    'screensB.mobile.manage': 'Verwalten',
    'screensB.mobile.directions': 'Route',
    'screensB.mobile.bookAgain': 'Erneut buchen',
    'screensB.mobile.durPrice': '{duration} · {price}',
    'screensB.mobile.durStaff': '{duration} · {staff}',
    'screensB.mobile.durWithStaff': '{duration} · bei {staff}',
    'screensB.mobile.pointsGoal':
      'Noch {count} Punkt bis zu deiner nächsten Prämie {reward}|Noch {count} Punkte bis zu deiner nächsten Prämie {reward}',
    'screensB.mobile.pointsReady': 'Deine Prämie {reward} ist einlösebereit',
    'screensB.mobile.toastJournal': 'Journal wird geöffnet — nur Demo',
    'screensB.mobile.allServices': 'Alle Leistungen',
    'screensB.mobile.pickDay': 'Tag wählen',
    'screensB.mobile.pickTime': 'Uhrzeit wählen',
    'screensB.mobile.toastTaken': 'Dieser Termin ist vergeben',
    'screensB.mobile.upcoming': 'Anstehend',
    'screensB.mobile.past': 'Vergangen',
    'screensB.mobile.dateTime': '{date} · {time}',
    'screensB.mobile.whenWho': '{when} · {who}',
    'screensB.mobile.toastCancelled': 'Storniert — nur Demo',
    'screensB.mobile.toastReceipt': 'Beleg per E-Mail geschickt',
    'screensB.mobile.circle': 'Circle',
    'screensB.mobile.statPoints': 'Punkte',
    'screensB.mobile.preferences': 'Einstellungen',
    'screensB.mobile.account': 'Konto',
    'screensB.mobile.pushNotifications': 'Push-Mitteilungen',
    'screensB.mobile.darkAppearance': 'Dunkles Design',
    'screensB.mobile.toastPushOn': 'Push an',
    'screensB.mobile.toastPushOff': 'Push aus',
    'screensB.mobile.signOut': 'Abmelden',
    'screensB.mobile.toastSignedOut': 'Abgemeldet — nur Demo',
    'screensB.mobile.version': '{brand} · {version}',
    'screensB.mobile.booked': 'Termin steht',
    'screensB.mobile.sheetSub':
      'Wir haben dich für {service} bei {staff} eingetragen.',
    'screensB.mobile.firstSpecialistFree': 'der ersten freien Fachkraft',
    'screensB.mobile.seeMyVisits': 'Meine Termine ansehen',

    /* --- MyGifts --- */
    'screensB.mygifts.title': 'Gekaufte Geschenkkarten',
    'screensB.mygifts.sub': 'Geschenkkarten, die du gekauft und verschickt hast.',
    'screensB.mygifts.buy': 'Geschenkkarte kaufen',
    'screensB.mygifts.emptyTitle': 'Noch keine Geschenkkarten',
    'screensB.mygifts.emptyBody':
      'Verschenk ein bisschen Ruhe — gekaufte Karten liegen dann hier.',
    'screensB.mygifts.to': 'An {name} · {date}',
    'screensB.mygifts.sent': 'Verschickt',
    'screensB.mygifts.redeemed': 'Eingelöst',

    /* --- NotFound --- */
    'screensB.notfound.h1': 'Diese Seite hat sich freigenommen.',
    'screensB.notfound.body':
      'Wir konnten nicht finden, was du gesucht hast — auf der Startseite warten aber immer ein frischer Look oder ein bisschen Ruhe.',

    /* --- NotifPrefs --- */
    'screensB.notifprefs.title': 'Benachrichtigungen',
    'screensB.notifprefs.sub':
      'Entscheide, was dich erreicht und wie. Änderungen werden sofort gespeichert.',
    'screensB.notifprefs.channels': 'Kanäle',
    'screensB.notifprefs.whatWeSend': 'Was wir senden',
    'screensB.notifprefs.timing': 'Zeitpunkt',
    'screensB.notifprefs.remindMe': 'Erinnere mich',
    'screensB.notifprefs.remindSub': 'Wie lange vor einem Termin wir uns melden.',
    'screensB.notifprefs.reminderTiming': 'Erinnerungszeitpunkt',
    'screensB.notifprefs.quietHours': 'Ruhezeiten',
    'screensB.notifprefs.quietSub': 'Alles Unwichtige wartet bis zum Morgen.',
    'screensB.notifprefs.quietWindow': 'Ruhefenster',
    'screensB.notifprefs.pauseTitle': 'Alles pausieren',
    'screensB.notifprefs.pauseBody':
      'Schaltet jeden Kanal ab. Buchungsbestätigungen kommen weiterhin per E-Mail.',
    'screensB.notifprefs.pauseAll': 'Alle pausieren',
    'screensB.notifprefs.toastPaused': 'Alle Benachrichtigungen pausiert',

    /* --- Offers --- */
    'screensB.offers.eyebrow': 'Herbst 2026',
    'screensB.offers.h1': 'Saisonale Angebote',
    'screensB.offers.sub':
      'Ein paar Dinge, die diese Saison eine Buchung wert sind. Code kopieren, er wird an der Kasse angerechnet — einer pro Besuch.',
    'screensB.offers.ends': 'Endet {date}',
    'screensB.offers.bookPairing': 'Kombi buchen',
    'screensB.offers.toastCopied': '{code} in die Zwischenablage kopiert',
    'screensB.offers.note':
      'Ein Angebot pro Besuch, nicht mit Paketstunden oder Geschenkkarten-Aufladungen kombinierbar. Mitglieder bekommen ihre 10 % immer obendrauf. Demo-Codes — es wird nichts wirklich rabattiert.',

    /* --- Orders --- */
    'screensB.orders.title': 'Bestellverlauf',
    'screensB.orders.sub':
      'Jeder Besuch, jedes Paket und jede Geschenkkarte, die du bezahlt hast.',
    'screensB.orders.spent': 'Ausgaben 2026',
    'screensB.orders.emptyTitle': 'Nichts in diesem Filter',
    'screensB.orders.emptyBody':
      'Probier eine andere Kategorie — deine übrigen Bestellungen sind noch da.',
    'screensB.orders.toastReceipt': 'Beleg {code} an {email} geschickt',

    /* --- Packages --- */
    'screensB.packages.subject': '{qty} × {name}',
    'screensB.packages.studioServices': 'Studioleistungen',
    'screensB.packages.expires': 'Gültig bis {date}',
    'screensB.packages.eyebrow': 'Vorausbezahlte Pakete',
    'screensB.packages.h1': 'Paketangebote',
    'screensB.packages.sub':
      'Kauf mehrere Besuche auf einmal und zahl pro Sitzung weniger. Die Sitzungen liegen auf deinem Konto, bis du sie buchst — keine Monatsgebühr, keine Ablauftricks.',
    'screensB.packages.yourPackages': 'Deine Pakete',
    'screensB.packages.left': 'übrig',
    'screensB.packages.sessionsUsed': 'Genutzte Sitzungen von {name}',
    'screensB.packages.usedOf': '{used} von {total} genutzt',
    'screensB.packages.bookSession': 'Sitzung buchen',
    'screensB.packages.available': 'Verfügbare Pakete',
    'screensB.packages.mostPopular': 'Am beliebtesten',
    'screensB.packages.save': '{amount} sparen',
    'screensB.packages.perSession': '{amount} / Sitzung',
    'screensB.packages.inAccount': 'Auf deinem Konto',
    'screensB.packages.buy': 'Paket kaufen',
    'screensB.packages.toastAlready': '{name} liegt schon auf deinem Konto',
    'screensB.packages.toastAdded':
      '{name} hinzugefügt — nur Demo, ohne Berechnung',
    'screensB.packages.note':
      'Sitzungen bleiben 12 Monate gültig, können einmal verschenkt werden und sind anteilig erstattbar. Dies ist eine Demo — es wird nichts berechnet.',

    /* --- Policy --- */
    'screensB.policy.title': 'Stornobedingungen',
    'screensB.policy.sub':
      'Pläne ändern sich — verstehen wir. So läuft es bei uns, in klaren Worten.',
    'screensB.policy.windowTitle': 'Ein Fenster von 24 Stunden',
    'screensB.policy.windowBody':
      'Storniere oder verschiebe bis 24 Stunden vor Beginn kostenlos, direkt über „Buchung verwalten“.',
    'screensB.policy.lateTitle': 'Späte Absagen & Nichterscheinen',
    'screensB.policy.lateBody':
      'Innerhalb von 24 Stunden fallen 50 % an. Wer nicht erscheint, zahlt voll, damit der Platz nicht leer bleibt.',
    'screensB.policy.howTitle': 'So stornierst du',
    'screensB.policy.howBody':
      'Geh zu „Buchung verwalten“, gib Code und E-Mail ein und wähl Verschieben oder Stornieren — kein Anruf nötig.',
    'screensB.policy.membersTitle': 'Mitglieder & Pakete',
    'screensB.policy.membersBody':
      'Studio-Circle-Mitglieder haben pro Monat eine gebührenfreie späte Absage. Paketstunden gehen einfach auf dein Guthaben zurück.',
    'screensB.policy.banner':
      'Dies sind Demo-Bedingungen zur Veranschaulichung — es werden nie wirklich Gebühren berechnet.',

    /* --- Post --- */
    'screensB.post.back': 'Zurück zum Journal',
    'screensB.post.emptyTitle': 'Dieser Beitrag ist nicht hier',
    'screensB.post.emptyBody':
      'Vielleicht wurde er zurückgezogen. Alles, was wir geschrieben haben, steht in der Journal-Übersicht.',
    'screensB.post.browse': 'Journal durchstöbern',
    'screensB.post.byline': '{date} · {read}',
    'screensB.post.more': 'Mehr aus dem Journal',

    /* --- Refer --- */
    'screensB.refer.title': 'Freundin oder Freund werben',
    'screensB.refer.sub':
      'Schenk {amount}, bekomm {amount}. Alle gehen strahlend raus.',
    'screensB.refer.yourCode': 'Dein Einladungscode',
    'screensB.refer.copyLink': 'Einladungslink kopieren',
    'screensB.refer.toastCopied': 'Einladungslink in die Zwischenablage kopiert',
    'screensB.refer.yourInvites': 'Deine Einladungen',

    /* --- Reviews --- */
    'screensB.reviews.justNow': 'gerade eben',
    'screensB.reviews.total': '{reviews} Bewertungen · {specialists} Fachkräfte',
    'screensB.reviews.starRow': '{stars}★',
    'screensB.reviews.composeSent': 'Deine Bewertung steht',
    'screensB.reviews.composeTitle':
      'Warst du kürzlich da? Erzähl uns, wie es war',
    'screensB.reviews.thanks':
      'Danke — deine Bewertung steht ganz oben in der Liste. Du kannst sie 24 Stunden lang bearbeiten.',
    'screensB.reviews.starsAria': '{count} Stern|{count} Sterne',
    'screensB.reviews.placeholder':
      'Wie war der Besuch? Etwas, das der nächste Gast wissen sollte?',
    'screensB.reviews.textareaLabel': 'Deine Bewertung',
    'screensB.reviews.postingAs':
      'Veröffentlicht als {name} · dein letzter Besuch war am {date}',
    'screensB.reviews.post': 'Bewertung senden',
    'screensB.reviews.errEmpty': 'Schreib zuerst ein, zwei Zeilen',
    'screensB.reviews.toastPosted': 'Bewertung veröffentlicht · nur Demo',
    'screensB.reviews.showing': '{shown} von {total} angezeigt',
    'screensB.reviews.metaStaff': '{service} · bei {staff} · {date}',
    'screensB.reviews.metaStudio': '{service} · Studio · {date}',
    'screensB.reviews.replyBy': '{name} hat geantwortet',
    'screensB.reviews.helpful': 'Hilfreich · {n}',
    'screensB.reviews.report': 'Melden',
    'screensB.reviews.toastFlagged': 'Zur Prüfung an das Team gemeldet',

    /* --- Rewards --- */
    'screensB.rewards.srTitle': 'Treueprämien',
    'screensB.rewards.yourSpecialist': 'deiner Fachkraft',
    'screensB.rewards.yourBalance': 'Dein Guthaben',
    'screensB.rewards.progressLabel':
      'Fortschritt zu deiner nächsten Prämie über {amount}',
    'screensB.rewards.canRedeem':
      'Du kannst die Prämie über {amount} jetzt einlösen.',
    'screensB.rewards.toGo':
      'Noch {count} Punkt bis zu deiner nächsten Prämie über {amount}|Noch {count} Punkte bis zu deiner nächsten Prämie über {amount}',
    'screensB.rewards.factEarned': 'Dieses Jahr gesammelt',
    'screensB.rewards.factRedeemed': 'Eingelöst',
    'screensB.rewards.factTier': 'Stufe',
    'screensB.rewards.tierCircle': 'Circle',
    'screensB.rewards.tierGuest': 'Gast',
    'screensB.rewards.spendTitle': 'Punkte ausgeben',
    'screensB.rewards.redeemed': 'Eingelöst · auf deinem Konto',
    'screensB.rewards.redeem': 'Einlösen',
    'screensB.rewards.pointsToGo': 'Noch {count} Punkt|Noch {count} Punkte',
    'screensB.rewards.toastRedeemed': '{name} · deinem Konto hinzugefügt',
    'screensB.rewards.recentPoints': 'Letzte Punkte',
    'screensB.rewards.howPointsWork': 'So funktionieren Punkte',

    /* --- Services --- */
    'screensB.services.title': 'Leistungen',
    'screensB.services.sub':
      'Wähl, worauf du Lust hast. Jede Buchung wird sofort bestätigt — Fachkraft und Uhrzeit kommen als Nächstes.',
    'screensB.services.filterLabel': 'Nach Kategorie filtern',

    /* --- Shop --- */
    'screensB.shop.title': 'Das Regal',
    'screensB.shop.sub':
      'Alles, was wir wirklich an dir verwenden, in den Größen, die wir selbst kaufen würden. Im Studio abholen oder zuschicken lassen.',
    'screensB.shop.removeOne': 'Ein Stück {name} entfernen',
    'screensB.shop.addAnother': 'Noch ein Stück {name} hinzufügen',
    'screensB.shop.addToBag': 'In die Tasche',
    'screensB.shop.toastAdded': '{name} in deine Tasche gelegt',
    'screensB.shop.yourBag': 'Deine Tasche',
    'screensB.shop.cartEmpty':
      'Noch nichts in der Tasche. Produkte können auch auf die Rechnung deines Besuchs, wenn du lieber im Studio zahlst.',
    'screensB.shop.lineQty': '{qty} × {price}',
    'screensB.shop.subtotal': 'Zwischensumme',
    'screensB.shop.checkout': 'Zur Kasse',
    'screensB.shop.ship': 'Abholung im Studio gratis · Versand {amount}',

    /* --- SignIn --- */
    'screensB.signin.errEmail': 'Gib eine gültige E-Mail-Adresse ein.',
    'screensB.signin.toastCodeSent':
      'Code gesendet · beliebige sechs Ziffern gehen',
    'screensB.signin.errCode': 'Gib alle sechs Ziffern ein, um fortzufahren.',
    'screensB.signin.toastSignedIn': 'Angemeldet als {name}',
    'screensB.signin.welcome': 'Willkommen zurück',
    'screensB.signin.lede':
      'Gib deine E-Mail ein, wir senden einen sechsstelligen Code. Kein Passwort zum Vergessen.',
    'screensB.signin.fieldEmail': 'E-Mail-Adresse',
    'screensB.signin.remember': 'Auf diesem Gerät angemeldet bleiben',
    'screensB.signin.emailCode': 'Code per E-Mail schicken',
    'screensB.signin.or': 'oder',
    'screensB.signin.bookWithoutAccount': 'Ohne Konto buchen',
    'screensB.signin.foot':
      'Dies ist eine Demo-Anmeldung — jede E-Mail geht und es wird kein Code verschickt.',
    'screensB.signin.differentEmail': 'Andere E-Mail verwenden',
    'screensB.signin.checkInbox': 'Schau in dein Postfach',
    'screensB.signin.sentTo':
      'Wir haben einen sechsstelligen Code an {email} geschickt',
    'screensB.signin.yourInbox': 'dein Postfach',
    'screensB.signin.codeLabel': 'Sechsstelliger Anmeldecode',
    'screensB.signin.verify': 'Prüfen & anmelden',
    'screensB.signin.didntGet': 'Nichts bekommen?',
    'screensB.signin.resend': 'Code erneut senden',
    'screensB.signin.toastNewCode': 'Neuer Code ist unterwegs',
    'screensB.signin.demoHint': 'Demo-Hinweis: Beliebige sechs Ziffern genügen.',

    /* --- Staff --- */
    'screensB.staff.dirTitle': 'Die Menschen an den Stühlen',
    'screensB.staff.dirLede':
      'Vier Fachkräfte, jede mit eigenen Zeiten und eigener Handschrift. Wähl, wer zu dir passt — oder lass uns vermitteln.',
    'screensB.staff.nextFree': 'Nächster freier Termin · {when}',
    'screensB.staff.viewProfile': 'Profil ansehen',
    'screensB.staff.allSpecialists': 'Alle Fachkräfte',
    'screensB.staff.since': '{role} · im Studio seit {year}',
    'screensB.staff.knownFor': 'Bekannt für',
    'screensB.staff.guestsSay': 'Was Gäste sagen',
    'screensB.staff.quoteMeta': '{service} · {date}',
    'screensB.staff.statRating': 'Durchschnitt',
    'screensB.staff.statReviews': 'Bewertungen',
    'screensB.staff.statYears': 'Im Studio',
    'screensB.staff.joinWaitlist': 'Auf die Warteliste',
    'screensB.staff.usualWeek': 'Übliche Woche',
    'screensB.staff.hourRange': '{from} – {to}',
    'screensB.staff.off': 'Frei',
    'screensB.staff.servicesOffered': 'Leistungen von {name}',

    /* --- Visits --- */
    'screensB.visits.title': 'Meine nächsten Termine',
    'screensB.visits.sub': 'Alles, was du bei uns gebucht hast.',
    'screensB.visits.emptyTitle': 'Noch nichts gebucht',
    'screensB.visits.emptyBody':
      'Sobald du einen Termin buchst, steht er mit allen Details hier.',
    'screensB.visits.bookVisit': 'Termin buchen',
    'screensB.visits.appointment': 'Termin',
    'screensB.visits.repeats':
      'Wiederholt sich {freq} · {count} Termin|Wiederholt sich {freq} · {count} Termine',
    'screensB.visits.manage': 'Verschieben oder stornieren',

    /* --- Waitlist --- */
    'screensB.waitlist.title': 'Warteliste',
    'screensB.waitlist.lede':
      'An den meisten Tagen wird etwas abgesagt. Sag uns, was du suchst, und wir schreiben dir, sobald etwas frei wird.',
    'screensB.waitlist.joinTitle': 'Auf die Liste',
    'screensB.waitlist.groupService': 'Welche Leistung?',
    'screensB.waitlist.groupDays': 'Passende Tage',
    'screensB.waitlist.groupTime': 'Tageszeit',
    'screensB.waitlist.groupNotify': 'Benachrichtigung per',
    'screensB.waitlist.winMornings': 'Vormittags',
    'screensB.waitlist.winAfternoons': 'Nachmittags',
    'screensB.waitlist.winEvenings': 'Abends',
    'screensB.waitlist.notifyText': 'SMS',
    'screensB.waitlist.notifyEmail': 'E-Mail',
    'screensB.waitlist.notifyPush': 'Push',
    'screensB.waitlist.oddsMany':
      'Bei so vielen offenen Tagen hören die meisten Gäste innerhalb von 48 Stunden von uns.',
    'screensB.waitlist.oddsSome':
      'Zwei oder drei Tage bedeuten um diese Jahreszeit meist ein paar Tage Wartezeit.',
    'screensB.waitlist.oddsOne':
      'Nur ein Tag kann ein paar Wochen dauern — nimm noch einen dazu, wenn es geht.',
    'screensB.waitlist.addMe': 'Setz mich auf die Liste',
    'screensB.waitlist.errPickDay': 'Wähl mindestens einen passenden Tag',
    'screensB.waitlist.toastJoinedText':
      'Du stehst auf der Liste · wir melden uns per SMS',
    'screensB.waitlist.toastJoinedEmail':
      'Du stehst auf der Liste · wir melden uns per E-Mail',
    'screensB.waitlist.toastJoinedPush':
      'Du stehst auf der Liste · wir melden uns per Push',
    'screensB.waitlist.waitingOn': 'Du wartest auf',
    'screensB.waitlist.emptyTitle': 'Noch nichts',
    'screensB.waitlist.emptyBody':
      'Trag dich über das Formular ein, dann steht hier dein Platz in der Schlange.',
    'screensB.waitlist.toastWidened':
      'Zeitfenster erweitert · wir schauen auf mehr Tage',
    'screensB.waitlist.flexible': 'flexibel',
    'screensB.waitlist.entryStaffDate': 'bei {staff} · {date}',
    'screensB.waitlist.entryAnyDate': 'beliebige Fachkraft · {date}',
    'screensB.waitlist.inLine': 'Platz {pos} in der Schlange',
    'screensB.waitlist.oddsNext':
      'Du bist als Nächstes dran — wir schreiben dir, sobald etwas frei wird.',
    'screensB.waitlist.oddsWait':
      'Um diese Jahreszeit etwa {count} Tag Wartezeit.|Um diese Jahreszeit etwa {count} Tage Wartezeit.',
    'screensB.waitlist.widen': 'Zeitfenster erweitern',

    /* --- WaitlistStatus --- */
    'screensB.wstatus.title': 'Wartelisten-Status',
    'screensB.wstatus.sub':
      'Tage, auf die du wartest — wir schreiben dir, sobald ein Platz frei wird.',
    'screensB.wstatus.emptyTitle': 'Du stehst auf keiner Warteliste',
    'screensB.wstatus.emptyBody':
      'Ist ein Tag ausgebucht, trag dich im Schritt „Datum & Uhrzeit“ in die Warteliste ein, dann erscheint er hier.',
    'screensB.wstatus.flexible': 'Flexibel',
    'screensB.wstatus.whenWho': '{date} · {who}',
    'screensB.wstatus.waiting': 'Wartet auf einen freien Platz',
  },
  'fr-FR': {
    /* --- shared inside this area --- */
    'screensB.common.all': 'Tout',
    'screensB.common.anyService': 'N’importe quelle prestation',
    'screensB.common.backHome': 'Retour à l’accueil',
    'screensB.common.backToDashboard': 'Retour au tableau de bord',
    'screensB.common.book': 'Réserver',
    'screensB.common.bookNamed': 'Réserver {name}',
    'screensB.common.bookWith': 'Réserver avec {name}',
    'screensB.common.cancel': 'Annuler',
    'screensB.common.codeCopied': '{code} copié',
    'screensB.common.copyCode': 'Copier le code {code}',
    'screensB.common.demoOnly': '{label} — démo seulement',
    'screensB.common.email': 'E-mail',
    'screensB.common.firstAvailable': 'Premier disponible',
    'screensB.common.fullName': 'Nom complet',
    'screensB.common.howItWorks': 'Comment ça marche',
    'screensB.common.leave': 'Quitter',
    'screensB.common.optional': '(facultatif)',
    'screensB.common.phEmail': 'vous@email.fr',
    'screensB.common.phone': 'Téléphone',
    'screensB.common.pointsUnit': 'point|points',
    'screensB.common.ptsCount': '{count} pt|{count} pts',
    'screensB.common.ptsUnit': 'pt|pts',
    'screensB.common.receipt': 'Reçu',
    'screensB.common.reschedule': 'Reprogrammer',
    'screensB.common.seeAll': 'Tout voir',
    'screensB.common.time': 'Heure',
    'screensB.common.timeDur': '{time} · {duration}',
    'screensB.common.toastMaps': 'Ouverture de Maps — démo seulement',
    'screensB.common.total': 'Total',
    'screensB.common.when': 'Quand',
    'screensB.common.with': 'Avec',

    /* --- Help --- */
    'screensB.help.title': 'Comment pouvons-nous vous aider ?',
    'screensB.help.sub': 'Les réponses aux questions que l’on nous pose le plus.',
    'screensB.help.searchPlaceholder': 'Rechercher dans l’aide…',
    'screensB.help.searchLabel': 'Rechercher dans l’aide',
    'screensB.help.results':
      '{count} réponse pour « {query} »|{count} réponses pour « {query} »',
    'screensB.help.common': 'Questions fréquentes',
    'screensB.help.emptyTitle': 'Aucun résultat',
    'screensB.help.emptyBody':
      'Essayez une recherche plus courte, ou écrivez-nous — une vraie personne répond entre 9 h et 18 h.',
    'screensB.help.stuckTitle': 'Toujours bloqué ?',
    'screensB.help.stuckBody':
      'Nos conditions d’annulation répondent en clair à la plupart des questions sur les réservations.',
    'screensB.help.readPolicy': 'Lire les conditions',

    /* --- Home --- */
    'screensB.home.eyebrow': 'Beauté & bien-être en boutique',
    'screensB.home.title': 'Sentez-vous comme la meilleure version de vous.',
    'screensB.home.lede':
      'Cheveux, spa, ongles et mouvement sous un même toit paisible. Réservez un fauteuil ou une cabine en quelques gestes — sans coup de fil, sans compte.',
    'screensB.home.bookNow': 'Réserver',
    'screensB.home.viewServices': 'Voir les prestations',
    'screensB.home.trustOpenings': 'Créneaux dans la semaine',
    'screensB.home.trustDowntown': 'Studio en centre-ville',
    'screensB.home.trustWalkins': 'Sans rendez-vous bienvenu',
    'screensB.home.popularTitle': 'Prestations populaires',
    'screensB.home.popularSub': 'Un aperçu de chaque coin du studio.',
    'screensB.home.teamTitle': 'L’équipe',
    'screensB.home.teamSub': 'Quatre spécialistes, un agenda très bien tenu.',
    'screensB.home.lovedTitle': 'Adoré des habitués',
    'screensB.home.lovedSub':
      'Ce que disent les client·es une fois de retour dans le vrai monde.',
    'screensB.home.ratingFrom': 'sur {count} avis|sur {count} avis',
    'screensB.home.hoursTitle': 'Horaires de la semaine',
    'screensB.home.hoursNote':
      'Chaque spécialiste a ses propres horaires — vous verrez les créneaux réels au moment de réserver.',

    /* --- Intake --- */
    'screensB.intake.doneTitle': 'Fiche d’accueil enregistrée',
    'screensB.intake.doneBody':
      'Merci — votre spécialiste la lira avant votre venue. Ceci est une démo, rien n’est réellement enregistré.',
    'screensB.intake.editAnswers': 'Modifier mes réponses',
    'screensB.intake.title': 'Fiche d’accueil numérique',
    'screensB.intake.sub':
      'Quelques questions rapides pour que votre spécialiste adapte la séance. Une minute environ.',
    'screensB.intake.concernsLegend': 'Quelque chose vous concerne-t-il ?',
    'screensB.intake.allergiesLabel': 'Allergies ou sensibilités',
    'screensB.intake.allergiesPlaceholder': 'Parfums, latex, produits précis…',
    'screensB.intake.pressureLabel': 'Pression / intensité souhaitée',
    'screensB.intake.consent':
      'Je confirme l’exactitude de ces informations et consens au soin. Je peux les modifier à tout moment avant ma venue.',
    'screensB.intake.submit': 'Enregistrer la fiche',

    /* --- Join --- */
    'screensB.join.cycleMonthly': 'Mensuel',
    'screensB.join.cycleAnnual': 'Annuel · 2 mois offerts',
    'screensB.join.startToday': 'Commencer aujourd’hui',
    'screensB.join.startFirst': 'Commencer le 1er',
    'screensB.join.title': 'Rejoindre le Circle',
    'screensB.join.sub':
      'Un soin par mois, dix pour cent sur tout le reste et la priorité sur les annulations. Résiliable quand vous voulez — sans préavis.',
    'screensB.join.billingCycle': 'Cycle de facturation',
    'screensB.join.mostJoined': 'Le plus choisi',
    'screensB.join.perYear': '/an',
    'screensB.join.perMonth': '/mois',
    'screensB.join.selected': 'Sélectionné · continuer',
    'screensB.join.choose': 'Choisir {name}',
    'screensB.join.note':
      'L’abonnement est rentable dès une visite par mois. Un soin mensuel non utilisé est reporté une fois. Inscription de démo — aucune carte n’est débitée.',
    'screensB.join.otherPlans': 'Autres formules',
    'screensB.join.payTitle': 'Confirmer votre abonnement',
    'screensB.join.yourDetails': 'Vos coordonnées',
    'screensB.join.mobile': 'Mobile',
    'screensB.join.starts': 'Début',
    'screensB.join.lineAnnual': '{name} · 12 mois',
    'screensB.join.lineFirstMonth': '{name} · premier mois',
    'screensB.join.startsToday': 'Commence aujourd’hui',
    'screensB.join.prorata': 'Crédit au prorata',
    'screensB.join.joiningFee': 'Frais d’adhésion',
    'screensB.join.waived': 'Offerts',
    'screensB.join.errEmail':
      'Ajoutez un e-mail pour que nous puissions envoyer la carte',
    'screensB.join.welcome': 'Bienvenue dans le Circle',
    'screensB.join.summaryAnnual': '{name} · annuel',
    'screensB.join.summaryMonthly': '{name} · mensuel',
    'screensB.join.dueToday': 'À payer aujourd’hui',
    'screensB.join.startMembership': 'Démarrer mon abonnement',
    'screensB.join.fine':
      'Résiliable à tout moment depuis votre compte. Démo seulement — rien n’est débité.',
    'screensB.join.doneTitle': 'Vous êtes dans le Circle',
    'screensB.join.doneSub':
      'Votre premier crédit de soin est déjà sur votre compte, et chaque réservation à partir de maintenant est remisée de dix pour cent automatiquement.',
    'screensB.join.rowPlan': 'Formule',
    'screensB.join.rowBilling': 'Facturation',
    'screensB.join.billingAnnually': 'Annuelle · {amount}',
    'screensB.join.billingMonthly': 'Mensuelle · {amount}',
    'screensB.join.rowMemberNo': 'Numéro d’adhérent',
    'screensB.join.seeRewards': 'Voir vos récompenses',
    'screensB.join.useCredit': 'Utiliser mon crédit',

    /* --- LoyaltyHistory --- */
    'screensB.lhistory.title': 'Historique de fidélité',
    'screensB.lhistory.sub':
      'Chaque point gagné et dépensé avec Studio Circle.',
    'screensB.lhistory.currentBalance': 'Solde actuel',
    'screensB.lhistory.redeemRewards': 'Utiliser mes récompenses',

    /* --- Location --- */
    'screensB.location.title': 'Nous trouver',
    'screensB.location.lede':
      'Deux étages au-dessus de la boulangerie, Alder Lane. Sonnez à « Studio » si la porte de la rue est fermée.',
    'screensB.location.rowAddress': 'Adresse',
    'screensB.location.rowGettingIn': 'Accès',
    'screensB.location.addressValue': '{line1}, {line2}',
    'screensB.location.getDirections': 'Itinéraire',
    'screensB.location.callStudio': 'Appeler le studio',
    'screensB.location.toastDial': 'Appel de {phone} — démo seulement',
    'screensB.location.openingHours': 'Horaires d’ouverture',
    'screensB.location.openToday': 'Ouvert aujourd’hui',
    'screensB.location.closedToday': 'Fermé aujourd’hui',
    'screensB.location.beforeYouArrive': 'Avant de venir',

    /* --- Loyalty --- */
    'screensB.loyalty.h1': 'Un peu d’éclat à chaque visite.',
    'screensB.loyalty.sub':
      'Gagnez un point par dollar, échangez-les contre les prestations que vous aimez et débloquez plus en devenant membre. L’adhésion est gratuite.',
    'screensB.loyalty.yourPoints': 'Vos points',
    'screensB.loyalty.member': 'Membre',
    'screensB.loyalty.progressLabel':
      'Progression vers votre prochaine prestation offerte',
    'screensB.loyalty.unlocked':
      'Vous avez débloqué une prestation offerte — utilisez-la ci-dessous.',
    'screensB.loyalty.toGo':
      'Encore {count} pt avant votre prochaine prestation offerte|Encore {count} pts avant votre prochaine prestation offerte',
    'screensB.loyalty.redeemTitle': 'Utilisez vos points',
    'screensB.loyalty.locked': 'Verrouillé',
    'screensB.loyalty.redeem': 'Échanger',
    'screensB.loyalty.becomeMember': 'Devenir membre',
    'screensB.loyalty.becomeSub':
      'Allez plus loin avec l’abonnement Studio Circle — résiliable à tout moment.',
    'screensB.loyalty.mostLoved': 'Le plus apprécié',
    'screensB.loyalty.youreMember': 'Vous êtes membre ✓',
    'screensB.loyalty.joinPlan': 'Rejoindre {name}',

    /* --- Manage --- */
    'screensB.manage.title': 'Gérer la réservation',
    'screensB.manage.sub':
      'Reprogrammez ou annulez un rendez-vous avec votre code et votre e-mail.',
    'screensB.manage.fieldCode': 'Code de réservation',
    'screensB.manage.fieldEmail': 'E-mail de la réservation',
    'screensB.manage.find': 'Trouver ma réservation',
    'screensB.manage.tip':
      'Astuce démo : les champs sont pré-remplis avec une réservation existante — appuyez simplement sur Trouver.',
    'screensB.manage.withRole': '{name} · {role}',
    'screensB.manage.cancelled': 'Annulé',
    'screensB.manage.confirmed': 'Confirmé',
    'screensB.manage.cancelledNote':
      'Ce rendez-vous a été annulé. Réservez à nouveau quand vous voulez — au plaisir de vous revoir.',
    'screensB.manage.findAnother': 'Chercher une autre réservation',

    /* --- Mobile --- */
    'screensB.mobile.deviceIphone': 'iPhone',
    'screensB.mobile.deviceAndroid': 'Téléphone Android',
    'screensB.mobile.deviceFrame': 'Cadre de l’appareil',
    'screensB.mobile.eyebrow': 'Application compagnon',
    'screensB.mobile.h1': '{brand} dans votre poche',
    'screensB.mobile.sub':
      'L’application mobile a son propre design, ce n’est pas un site compressé — cinq onglets, un parcours de réservation pensé pour le pouce et vos points sur l’écran d’accueil. Ce qui suit présente ce design plutôt que l’application livrée, mais ce n’est pas une capture : appuyez dessus.',
    'screensB.mobile.switchNote':
      'Cela change le téléphone, pas l’application. La version Android a son propre design Material — autre barre de navigation, marges hautes plus serrées — c’est une maquette distincte, non montrée ici.',
    'screensB.mobile.yourProfile': 'Votre profil',
    'screensB.mobile.appTabs': 'Onglets de l’application',
    'screensB.mobile.greetMorning': 'Bonjour, {name}',
    'screensB.mobile.greetAfternoon': 'Bon après-midi, {name}',
    'screensB.mobile.greetEvening': 'Bonsoir, {name}',
    'screensB.mobile.toastPickTime': 'Choisissez d’abord une heure',
    'screensB.mobile.toastBooked': 'Réservation confirmée',
    'screensB.mobile.toastPickNewTime': 'Choisissez une nouvelle heure',
    'screensB.mobile.ctaConfirm': 'Confirmer · {time}',
    'screensB.mobile.ctaPickTime': 'Choisissez une heure pour continuer',
    'screensB.mobile.note':
      'Une vitrine du design, pas l’application en service — rien de ce que vous touchez ici n’atteint votre compte. Les onglets, le parcours de réservation et les codes promo sont actifs pour que le design se ressente ; les lignes qui menaient aux écrans plus profonds (l’équipe, l’étagère, les cartes cadeaux) répondent par un message, et ces parcours existent en entier sur le web. Le téléphone lui-même est une reconstitution : les maquettes importaient un cadre d’appareil qui n’a jamais été fourni.',
    'screensB.mobile.nextVisit': 'Prochaine visite',
    'screensB.mobile.manage': 'Gérer',
    'screensB.mobile.directions': 'Itinéraire',
    'screensB.mobile.bookAgain': 'Réserver à nouveau',
    'screensB.mobile.durPrice': '{duration} · {price}',
    'screensB.mobile.durStaff': '{duration} · {staff}',
    'screensB.mobile.durWithStaff': '{duration} · avec {staff}',
    'screensB.mobile.pointsGoal':
      'Encore {count} point avant votre prochaine récompense {reward}|Encore {count} points avant votre prochaine récompense {reward}',
    'screensB.mobile.pointsReady': 'Votre récompense {reward} est disponible',
    'screensB.mobile.toastJournal': 'Ouverture du journal — démo seulement',
    'screensB.mobile.allServices': 'Toutes les prestations',
    'screensB.mobile.pickDay': 'Choisissez un jour',
    'screensB.mobile.pickTime': 'Choisissez une heure',
    'screensB.mobile.toastTaken': 'Ce créneau est pris',
    'screensB.mobile.upcoming': 'À venir',
    'screensB.mobile.past': 'Passées',
    'screensB.mobile.dateTime': '{date} · {time}',
    'screensB.mobile.whenWho': '{when} · {who}',
    'screensB.mobile.toastCancelled': 'Annulé — démo seulement',
    'screensB.mobile.toastReceipt': 'Reçu envoyé par e-mail',
    'screensB.mobile.circle': 'Circle',
    'screensB.mobile.statPoints': 'Points',
    'screensB.mobile.preferences': 'Préférences',
    'screensB.mobile.account': 'Compte',
    'screensB.mobile.pushNotifications': 'Notifications push',
    'screensB.mobile.darkAppearance': 'Apparence sombre',
    'screensB.mobile.toastPushOn': 'Push activé',
    'screensB.mobile.toastPushOff': 'Push désactivé',
    'screensB.mobile.signOut': 'Se déconnecter',
    'screensB.mobile.toastSignedOut': 'Déconnecté — démo seulement',
    'screensB.mobile.version': '{brand} · {version}',
    'screensB.mobile.booked': 'C’est réservé',
    'screensB.mobile.sheetSub':
      'Nous vous avons inscrit pour {service} avec {staff}.',
    'screensB.mobile.firstSpecialistFree': 'le premier spécialiste libre',
    'screensB.mobile.seeMyVisits': 'Voir mes visites',

    /* --- MyGifts --- */
    'screensB.mygifts.title': 'Cartes cadeaux achetées',
    'screensB.mygifts.sub': 'Les cartes cadeaux que vous avez achetées et envoyées.',
    'screensB.mygifts.buy': 'Acheter une carte cadeau',
    'screensB.mygifts.emptyTitle': 'Aucune carte cadeau',
    'screensB.mygifts.emptyBody':
      'Offrez un peu de calme — les cartes achetées apparaîtront ici.',
    'screensB.mygifts.to': 'À {name} · {date}',
    'screensB.mygifts.sent': 'Envoyée',
    'screensB.mygifts.redeemed': 'Utilisée',

    /* --- NotFound --- */
    'screensB.notfound.h1': 'Cette page a pris sa journée.',
    'screensB.notfound.body':
      'Nous n’avons pas trouvé ce que vous cherchiez — mais il y a toujours un nouveau look ou un peu de calme qui attend sur la page d’accueil.',

    /* --- NotifPrefs --- */
    'screensB.notifprefs.title': 'Préférences de notification',
    'screensB.notifprefs.sub':
      'Choisissez ce qui vous parvient, et comment. Les changements sont enregistrés au fil de l’eau.',
    'screensB.notifprefs.channels': 'Canaux',
    'screensB.notifprefs.whatWeSend': 'Ce que nous envoyons',
    'screensB.notifprefs.timing': 'Moment',
    'screensB.notifprefs.remindMe': 'Me rappeler',
    'screensB.notifprefs.remindSub':
      'Combien de temps avant une visite nous vous contactons.',
    'screensB.notifprefs.reminderTiming': 'Moment du rappel',
    'screensB.notifprefs.quietHours': 'Heures calmes',
    'screensB.notifprefs.quietSub':
      'Tout ce qui n’est pas urgent attend le matin.',
    'screensB.notifprefs.quietWindow': 'Plage calme',
    'screensB.notifprefs.pauseTitle': 'Tout mettre en pause',
    'screensB.notifprefs.pauseBody':
      'Coupe tous les canaux. Les confirmations de réservation arrivent toujours par e-mail.',
    'screensB.notifprefs.pauseAll': 'Tout mettre en pause',
    'screensB.notifprefs.toastPaused': 'Toutes les notifications sont en pause',

    /* --- Offers --- */
    'screensB.offers.eyebrow': 'Automne 2026',
    'screensB.offers.h1': 'Offres de saison',
    'screensB.offers.sub':
      'Quelques idées à réserver cette saison. Copiez un code, il s’applique au paiement — un par visite.',
    'screensB.offers.ends': 'Se termine le {date}',
    'screensB.offers.bookPairing': 'Réserver le duo',
    'screensB.offers.toastCopied': '{code} copié dans le presse-papiers',
    'screensB.offers.note':
      'Une offre par visite, non cumulable avec les séances de forfait ni les recharges de carte cadeau. Les membres gardent toujours leurs 10 % en plus. Codes de démo — aucune remise réelle.',

    /* --- Orders --- */
    'screensB.orders.title': 'Historique des commandes',
    'screensB.orders.sub':
      'Chaque visite, forfait et carte cadeau que vous avez payés.',
    'screensB.orders.spent': 'Dépensé en 2026',
    'screensB.orders.emptyTitle': 'Rien dans ce filtre',
    'screensB.orders.emptyBody':
      'Essayez une autre catégorie — vos autres commandes sont toujours là.',
    'screensB.orders.toastReceipt': 'Reçu {code} envoyé à {email}',

    /* --- Packages --- */
    'screensB.packages.subject': '{qty} × {name}',
    'screensB.packages.studioServices': 'prestations du studio',
    'screensB.packages.expires': 'Expire le {date}',
    'screensB.packages.eyebrow': 'Forfaits prépayés',
    'screensB.packages.h1': 'Offres de forfaits',
    'screensB.packages.sub':
      'Achetez plusieurs visites d’un coup et payez moins par séance. Les séances restent sur votre compte jusqu’à ce que vous les réserviez — aucun frais mensuel, aucune date piège.',
    'screensB.packages.yourPackages': 'Vos forfaits',
    'screensB.packages.left': 'restantes',
    'screensB.packages.sessionsUsed': 'Séances utilisées de {name}',
    'screensB.packages.usedOf': '{used} sur {total} utilisées',
    'screensB.packages.bookSession': 'Réserver une séance',
    'screensB.packages.available': 'Forfaits disponibles',
    'screensB.packages.mostPopular': 'Le plus populaire',
    'screensB.packages.save': 'Économisez {amount}',
    'screensB.packages.perSession': '{amount} / séance',
    'screensB.packages.inAccount': 'Sur votre compte',
    'screensB.packages.buy': 'Acheter le forfait',
    'screensB.packages.toastAlready': '{name} est déjà sur votre compte',
    'screensB.packages.toastAdded':
      '{name} ajouté — démo seulement, aucun débit',
    'screensB.packages.note':
      'Les séances restent valables 12 mois, peuvent être offertes une fois et sont remboursables au prorata. Ceci est une démo — rien n’est débité.',

    /* --- Policy --- */
    'screensB.policy.title': 'Conditions d’annulation',
    'screensB.policy.sub':
      'Les plans changent — on comprend. Voici comment ça marche chez nous, en clair.',
    'screensB.policy.windowTitle': 'Une fenêtre de 24 heures',
    'screensB.policy.windowBody':
      'Annulez ou reprogrammez jusqu’à 24 heures avant l’heure de début, sans frais, directement depuis Gérer la réservation.',
    'screensB.policy.lateTitle': 'Annulations tardives et absences',
    'screensB.policy.lateBody':
      'Moins de 24 heures avant, 50 % sont facturés. Les absences sont facturées en entier pour que le fauteuil ne reste pas vide.',
    'screensB.policy.howTitle': 'Comment annuler',
    'screensB.policy.howBody':
      'Allez dans Gérer la réservation, saisissez votre code et votre e-mail, puis choisissez Reprogrammer ou Annuler — aucun appel nécessaire.',
    'screensB.policy.membersTitle': 'Membres et forfaits',
    'screensB.policy.membersBody':
      'Les membres Studio Circle ont droit à une annulation tardive sans frais par mois. Les séances de forfait reviennent simplement sur votre solde.',
    'screensB.policy.banner':
      'Ces conditions sont une démo à titre d’illustration — aucun frais n’est jamais réellement facturé.',

    /* --- Post --- */
    'screensB.post.back': 'Retour au journal',
    'screensB.post.emptyTitle': 'Cet article n’est pas là',
    'screensB.post.emptyBody':
      'Il a peut-être été dépublié. Tout ce que nous avons écrit se trouve dans le sommaire du journal.',
    'screensB.post.browse': 'Parcourir le journal',
    'screensB.post.byline': '{date} · {read}',
    'screensB.post.more': 'Plus dans le journal',

    /* --- Refer --- */
    'screensB.refer.title': 'Parrainer un ami',
    'screensB.refer.sub':
      'Offrez {amount}, recevez {amount}. Tout le monde repart rayonnant.',
    'screensB.refer.yourCode': 'Votre code d’invitation',
    'screensB.refer.copyLink': 'Copier le lien d’invitation',
    'screensB.refer.toastCopied':
      'Lien d’invitation copié dans le presse-papiers',
    'screensB.refer.yourInvites': 'Vos invitations',

    /* --- Reviews --- */
    'screensB.reviews.justNow': 'à l’instant',
    'screensB.reviews.total': '{reviews} avis · {specialists} spécialistes',
    'screensB.reviews.starRow': '{stars}★',
    'screensB.reviews.composeSent': 'Votre avis est en ligne',
    'screensB.reviews.composeTitle':
      'Vous êtes venu récemment ? Dites-nous comment c’était',
    'screensB.reviews.thanks':
      'Merci — votre avis est en ligne, en haut de la liste. Vous pouvez le modifier pendant 24 heures.',
    'screensB.reviews.starsAria': '{count} étoile|{count} étoiles',
    'screensB.reviews.placeholder':
      'Comment s’est passée la visite ? Quelque chose à savoir pour le prochain client ?',
    'screensB.reviews.textareaLabel': 'Votre avis',
    'screensB.reviews.postingAs':
      'Publié en tant que {name} · votre dernière visite était le {date}',
    'screensB.reviews.post': 'Publier l’avis',
    'screensB.reviews.errEmpty': 'Écrivez d’abord une ligne ou deux',
    'screensB.reviews.toastPosted': 'Avis publié · démo seulement',
    'screensB.reviews.showing': '{shown} sur {total} affichés',
    'screensB.reviews.metaStaff': '{service} · avec {staff} · {date}',
    'screensB.reviews.metaStudio': '{service} · studio · {date}',
    'screensB.reviews.replyBy': '{name} a répondu',
    'screensB.reviews.helpful': 'Utile · {n}',
    'screensB.reviews.report': 'Signaler',
    'screensB.reviews.toastFlagged': 'Signalé à l’équipe',

    /* --- Rewards --- */
    'screensB.rewards.srTitle': 'Récompenses de fidélité',
    'screensB.rewards.yourSpecialist': 'votre spécialiste',
    'screensB.rewards.yourBalance': 'Votre solde',
    'screensB.rewards.progressLabel':
      'Progression vers votre prochaine récompense de {amount}',
    'screensB.rewards.canRedeem':
      'Vous pouvez utiliser la récompense de {amount} dès maintenant.',
    'screensB.rewards.toGo':
      'Encore {count} point avant votre prochaine récompense de {amount}|Encore {count} points avant votre prochaine récompense de {amount}',
    'screensB.rewards.factEarned': 'Gagnés cette année',
    'screensB.rewards.factRedeemed': 'Utilisés',
    'screensB.rewards.factTier': 'Niveau',
    'screensB.rewards.tierCircle': 'Circle',
    'screensB.rewards.tierGuest': 'Visiteur',
    'screensB.rewards.spendTitle': 'Dépensez vos points',
    'screensB.rewards.redeemed': 'Utilisée · sur votre compte',
    'screensB.rewards.redeem': 'Échanger',
    'screensB.rewards.pointsToGo':
      'Encore {count} point|Encore {count} points',
    'screensB.rewards.toastRedeemed': '{name} · ajouté à votre compte',
    'screensB.rewards.recentPoints': 'Points récents',
    'screensB.rewards.howPointsWork': 'Comment fonctionnent les points',

    /* --- Services --- */
    'screensB.services.title': 'Prestations',
    'screensB.services.sub':
      'Choisissez ce dont vous avez envie. Chaque réservation est confirmée aussitôt — le spécialiste et l’heure viennent ensuite.',
    'screensB.services.filterLabel': 'Filtrer par catégorie',

    /* --- Shop --- */
    'screensB.shop.title': 'L’étagère',
    'screensB.shop.sub':
      'Tout ce que nous utilisons vraiment sur vous, dans les formats que nous achèterions nous-mêmes. À retirer au studio ou à recevoir chez vous.',
    'screensB.shop.removeOne': 'Retirer un {name}',
    'screensB.shop.addAnother': 'Ajouter un {name}',
    'screensB.shop.addToBag': 'Ajouter au panier',
    'screensB.shop.toastAdded': '{name} ajouté à votre panier',
    'screensB.shop.yourBag': 'Votre panier',
    'screensB.shop.cartEmpty':
      'Rien dans le panier pour l’instant. Les produits peuvent aussi être ajoutés à la note de votre visite si vous préférez payer au studio.',
    'screensB.shop.lineQty': '{qty} × {price}',
    'screensB.shop.subtotal': 'Sous-total',
    'screensB.shop.checkout': 'Payer',
    'screensB.shop.ship': 'Retrait au studio offert · envoi {amount}',

    /* --- SignIn --- */
    'screensB.signin.errEmail': 'Saisissez une adresse e-mail valide.',
    'screensB.signin.toastCodeSent':
      'Code envoyé · six chiffres au choix fonctionnent',
    'screensB.signin.errCode': 'Saisissez les six chiffres pour continuer.',
    'screensB.signin.toastSignedIn': 'Connecté en tant que {name}',
    'screensB.signin.welcome': 'Bon retour',
    'screensB.signin.lede':
      'Saisissez votre e-mail et nous enverrons un code à six chiffres. Aucun mot de passe à retenir.',
    'screensB.signin.fieldEmail': 'Adresse e-mail',
    'screensB.signin.remember': 'Rester connecté sur cet appareil',
    'screensB.signin.emailCode': 'M’envoyer un code',
    'screensB.signin.or': 'ou',
    'screensB.signin.bookWithoutAccount': 'Réserver sans compte',
    'screensB.signin.foot':
      'Ceci est une connexion de démo — n’importe quel e-mail marche et aucun code n’est vraiment envoyé.',
    'screensB.signin.differentEmail': 'Utiliser un autre e-mail',
    'screensB.signin.checkInbox': 'Regardez votre boîte de réception',
    'screensB.signin.sentTo':
      'Nous avons envoyé un code à six chiffres à {email}',
    'screensB.signin.yourInbox': 'votre boîte de réception',
    'screensB.signin.codeLabel': 'Code de connexion à six chiffres',
    'screensB.signin.verify': 'Vérifier et se connecter',
    'screensB.signin.didntGet': 'Rien reçu ?',
    'screensB.signin.resend': 'Renvoyer le code',
    'screensB.signin.toastNewCode': 'Un nouveau code arrive',
    'screensB.signin.demoHint':
      'Astuce démo : six chiffres au choix suffisent.',

    /* --- Staff --- */
    'screensB.staff.dirTitle': 'Les personnes derrière les fauteuils',
    'screensB.staff.dirLede':
      'Quatre spécialistes, chacun avec ses horaires et sa façon de travailler. Choisissez qui vous convient — ou laissez-nous vous orienter.',
    'screensB.staff.nextFree': 'Prochaine dispo · {when}',
    'screensB.staff.viewProfile': 'Voir le profil',
    'screensB.staff.allSpecialists': 'Tous les spécialistes',
    'screensB.staff.since': '{role} · au studio depuis {year}',
    'screensB.staff.knownFor': 'Reconnu pour',
    'screensB.staff.guestsSay': 'Ce que disent les client·es',
    'screensB.staff.quoteMeta': '{service} · {date}',
    'screensB.staff.statRating': 'Note moyenne',
    'screensB.staff.statReviews': 'Avis',
    'screensB.staff.statYears': 'Au studio',
    'screensB.staff.joinWaitlist': 'Rejoindre sa liste d’attente',
    'screensB.staff.usualWeek': 'Semaine type',
    'screensB.staff.hourRange': '{from} – {to}',
    'screensB.staff.off': 'Repos',
    'screensB.staff.servicesOffered': 'Prestations de {name}',

    /* --- Visits --- */
    'screensB.visits.title': 'Mes prochaines visites',
    'screensB.visits.sub': 'Tout ce que vous avez réservé chez nous.',
    'screensB.visits.emptyTitle': 'Rien de réservé pour l’instant',
    'screensB.visits.emptyBody':
      'Dès que vous réservez une visite, elle apparaît ici avec tous les détails.',
    'screensB.visits.bookVisit': 'Réserver une visite',
    'screensB.visits.appointment': 'Rendez-vous',
    'screensB.visits.repeats':
      'Se répète {freq} · {count} visite|Se répète {freq} · {count} visites',
    'screensB.visits.manage': 'Reprogrammer ou annuler',

    /* --- Waitlist --- */
    'screensB.waitlist.title': 'Liste d’attente',
    'screensB.waitlist.lede':
      'Il y a des annulations presque tous les jours. Dites-nous ce que vous cherchez et nous vous écrivons dès qu’une place se libère.',
    'screensB.waitlist.joinTitle': 'S’inscrire sur la liste',
    'screensB.waitlist.groupService': 'Quelle prestation ?',
    'screensB.waitlist.groupDays': 'Jours qui conviennent',
    'screensB.waitlist.groupTime': 'Moment de la journée',
    'screensB.waitlist.groupNotify': 'Me prévenir par',
    'screensB.waitlist.winMornings': 'Matins',
    'screensB.waitlist.winAfternoons': 'Après-midi',
    'screensB.waitlist.winEvenings': 'Soirs',
    'screensB.waitlist.notifyText': 'SMS',
    'screensB.waitlist.notifyEmail': 'E-mail',
    'screensB.waitlist.notifyPush': 'Push',
    'screensB.waitlist.oddsMany':
      'Avec autant de jours ouverts, la plupart des clients ont une réponse sous 48 heures.',
    'screensB.waitlist.oddsSome':
      'Deux ou trois jours, c’est en général quelques jours d’attente à cette période.',
    'screensB.waitlist.oddsOne':
      'Un seul jour peut prendre deux ou trois semaines — ajoutez-en un autre si vous pouvez.',
    'screensB.waitlist.addMe': 'M’ajouter à la liste',
    'screensB.waitlist.errPickDay': 'Choisissez au moins un jour qui convient',
    'screensB.waitlist.toastJoinedText':
      'Vous êtes sur la liste · nous vous écrirons par SMS',
    'screensB.waitlist.toastJoinedEmail':
      'Vous êtes sur la liste · nous vous écrirons par e-mail',
    'screensB.waitlist.toastJoinedPush':
      'Vous êtes sur la liste · nous vous préviendrons par push',
    'screensB.waitlist.waitingOn': 'Vous attendez',
    'screensB.waitlist.emptyTitle': 'Rien pour l’instant',
    'screensB.waitlist.emptyBody':
      'Inscrivez-vous via le formulaire et votre place dans la file apparaîtra ici.',
    'screensB.waitlist.toastWidened':
      'Plage élargie · nous regarderons plus de jours',
    'screensB.waitlist.flexible': 'flexible',
    'screensB.waitlist.entryStaffDate': 'avec {staff} · {date}',
    'screensB.waitlist.entryAnyDate': 'n’importe quel spécialiste · {date}',
    'screensB.waitlist.inLine': '{pos}e dans la file',
    'screensB.waitlist.oddsNext':
      'Vous êtes le prochain — nous vous écrivons dès qu’une place se libère.',
    'screensB.waitlist.oddsWait':
      'Environ {count} jour d’attente à cette période de l’année.|Environ {count} jours d’attente à cette période de l’année.',
    'screensB.waitlist.widen': 'Élargir ma plage',

    /* --- WaitlistStatus --- */
    'screensB.wstatus.title': 'Statut de la liste d’attente',
    'screensB.wstatus.sub':
      'Les jours que vous attendez — nous vous écrivons dès qu’une place se libère.',
    'screensB.wstatus.emptyTitle': 'Vous n’êtes sur aucune liste d’attente',
    'screensB.wstatus.emptyBody':
      'Si un jour est complet, inscrivez-vous sur sa liste d’attente à l’étape date et heure : il apparaîtra ici.',
    'screensB.wstatus.flexible': 'Flexible',
    'screensB.wstatus.whenWho': '{date} · {who}',
    'screensB.wstatus.waiting': 'En attente d’une place',
  },
  'cs-CZ': {
    /* --- shared inside this area --- */
    'screensB.common.all': 'Vše',
    'screensB.common.anyService': 'Jakákoli služba',
    'screensB.common.backHome': 'Zpět na úvod',
    'screensB.common.backToDashboard': 'Zpět na přehled',
    'screensB.common.book': 'Rezervovat',
    'screensB.common.bookNamed': 'Rezervovat {name}',
    'screensB.common.bookWith': 'Rezervovat u {name}',
    'screensB.common.cancel': 'Zrušit',
    'screensB.common.codeCopied': '{code} zkopírován',
    'screensB.common.copyCode': 'Zkopírovat kód {code}',
    'screensB.common.demoOnly': '{label} — jen ukázka',
    'screensB.common.email': 'E-mail',
    'screensB.common.firstAvailable': 'Kdo bude volný',
    'screensB.common.fullName': 'Celé jméno',
    'screensB.common.howItWorks': 'Jak to funguje',
    'screensB.common.leave': 'Opustit',
    'screensB.common.optional': '(nepovinné)',
    'screensB.common.phEmail': 'vy@email.cz',
    'screensB.common.phone': 'Telefon',
    'screensB.common.pointsUnit': 'bod|body|bodů',
    'screensB.common.ptsCount': '{count} bod|{count} body|{count} bodů',
    'screensB.common.ptsUnit': 'b.|b.|b.',
    'screensB.common.receipt': 'Účtenka',
    'screensB.common.reschedule': 'Přeobjednat',
    'screensB.common.seeAll': 'Zobrazit vše',
    'screensB.common.time': 'Čas',
    'screensB.common.timeDur': '{time} · {duration}',
    'screensB.common.toastMaps': 'Otevírám Mapy — jen ukázka',
    'screensB.common.total': 'Celkem',
    'screensB.common.when': 'Kdy',
    'screensB.common.with': 'U koho',

    /* --- Help --- */
    'screensB.help.title': 'S čím vám můžeme pomoct?',
    'screensB.help.sub': 'Odpovědi na to, na co se hosté ptají nejčastěji.',
    'screensB.help.searchPlaceholder': 'Hledat v nápovědě…',
    'screensB.help.searchLabel': 'Hledat v nápovědě',
    'screensB.help.results':
      '{count} odpověď na „{query}“|{count} odpovědi na „{query}“|{count} odpovědí na „{query}“',
    'screensB.help.common': 'Časté dotazy',
    'screensB.help.emptyTitle': 'Žádné výsledky',
    'screensB.help.emptyBody':
      'Zkuste kratší dotaz nebo nám napište — mezi 9. a 18. hodinou odpovídá skutečný člověk.',
    'screensB.help.stuckTitle': 'Pořád nejasné?',
    'screensB.help.stuckBody':
      'Naše storno podmínky srozumitelně odpovídají na většinu otázek k rezervacím.',
    'screensB.help.readPolicy': 'Přečíst podmínky',

    /* --- Home --- */
    'screensB.home.eyebrow': 'Butiková krása a wellness',
    'screensB.home.title': 'Ciťte se jako nejlepší verze sebe.',
    'screensB.home.lede':
      'Vlasy, spa, nehty a pohyb pod jednou klidnou střechou. Rezervujte křeslo nebo ošetřovnu na pár klepnutí — bez telefonování, bez účtu.',
    'screensB.home.bookNow': 'Rezervovat',
    'screensB.home.viewServices': 'Zobrazit služby',
    'screensB.home.trustOpenings': 'Volno ještě tento týden',
    'screensB.home.trustDowntown': 'Studio v centru',
    'screensB.home.trustWalkins': 'I bez objednání',
    'screensB.home.popularTitle': 'Oblíbené služby',
    'screensB.home.popularSub': 'Kousek z každého koutu studia.',
    'screensB.home.teamTitle': 'Náš tým',
    'screensB.home.teamSub': 'Čtyři specialisté, jeden velmi uklizený kalendář.',
    'screensB.home.lovedTitle': 'Milované stálými hosty',
    'screensB.home.lovedSub': 'Co hosté říkají, když se vrátí do reálného světa.',
    'screensB.home.ratingFrom':
      'z {count} hodnocení|z {count} hodnocení|z {count} hodnocení',
    'screensB.home.hoursTitle': 'Otevírací doba',
    'screensB.home.hoursNote':
      'Každý specialista má vlastní hodiny — volné termíny uvidíte živě při rezervaci.',

    /* --- Intake --- */
    'screensB.intake.doneTitle': 'Vstupní dotazník uložen',
    'screensB.intake.doneBody':
      'Děkujeme — váš specialista si ho projde před vaší návštěvou. Toto je ukázka, nic se ve skutečnosti neukládá.',
    'screensB.intake.editAnswers': 'Upravit odpovědi',
    'screensB.intake.title': 'Digitální vstupní dotazník',
    'screensB.intake.sub':
      'Pár rychlých otázek, aby vám specialista mohl návštěvu přizpůsobit. Zabere asi minutu.',
    'screensB.intake.concernsLegend': 'Týká se vás něco z toho?',
    'screensB.intake.allergiesLabel': 'Alergie nebo citlivost',
    'screensB.intake.allergiesPlaceholder': 'Vůně, latex, konkrétní přípravky…',
    'screensB.intake.pressureLabel': 'Preferovaný tlak / intenzita',
    'screensB.intake.consent':
      'Potvrzuji, že údaje jsou správné, a souhlasím s ošetřením. Beru na vědomí, že je mohu kdykoli před návštěvou upravit.',
    'screensB.intake.submit': 'Uložit dotazník',

    /* --- Join --- */
    'screensB.join.cycleMonthly': 'Měsíčně',
    'screensB.join.cycleAnnual': 'Ročně · 2 měsíce zdarma',
    'screensB.join.startToday': 'Začít dnes',
    'screensB.join.startFirst': 'Začít prvního',
    'screensB.join.title': 'Vstupte do Circle',
    'screensB.join.sub':
      'Jedno ošetření měsíčně, deset procent na vše ostatní a přednost při uvolněných termínech. Zrušíte kdykoli — bez výpovědní lhůty.',
    'screensB.join.billingCycle': 'Fakturační cyklus',
    'screensB.join.mostJoined': 'Nejčastější volba',
    'screensB.join.perYear': '/rok',
    'screensB.join.perMonth': '/měsíc',
    'screensB.join.selected': 'Vybráno · pokračovat',
    'screensB.join.choose': 'Vybrat {name}',
    'screensB.join.note':
      'Členství se vyplatí už při jedné návštěvě měsíčně. Nevyužité měsíční ošetření se jednou převede. Ukázková registrace — žádná karta se nestrhává.',
    'screensB.join.otherPlans': 'Jiné tarify',
    'screensB.join.payTitle': 'Potvrďte členství',
    'screensB.join.yourDetails': 'Vaše údaje',
    'screensB.join.mobile': 'Mobil',
    'screensB.join.starts': 'Začátek',
    'screensB.join.lineAnnual': '{name} · 12 měsíců',
    'screensB.join.lineFirstMonth': '{name} · první měsíc',
    'screensB.join.startsToday': 'Začíná dnes',
    'screensB.join.prorata': 'Poměrný kredit',
    'screensB.join.joiningFee': 'Vstupní poplatek',
    'screensB.join.waived': 'Odpuštěn',
    'screensB.join.errEmail': 'Zadejte e-mail, ať vám můžeme poslat kartu',
    'screensB.join.welcome': 'Vítejte v Circle',
    'screensB.join.summaryAnnual': '{name} · ročně',
    'screensB.join.summaryMonthly': '{name} · měsíčně',
    'screensB.join.dueToday': 'K úhradě dnes',
    'screensB.join.startMembership': 'Zahájit členství',
    'screensB.join.fine':
      'Zrušíte kdykoli ve svém účtu. Jen ukázka — nic se neúčtuje.',
    'screensB.join.doneTitle': 'Jste v Circle',
    'screensB.join.doneSub':
      'První kredit na ošetření už máte na účtu a z každé další rezervace se deset procent odečte automaticky.',
    'screensB.join.rowPlan': 'Tarif',
    'screensB.join.rowBilling': 'Fakturace',
    'screensB.join.billingAnnually': 'Ročně · {amount}',
    'screensB.join.billingMonthly': 'Měsíčně · {amount}',
    'screensB.join.rowMemberNo': 'Členské číslo',
    'screensB.join.seeRewards': 'Zobrazit odměny',
    'screensB.join.useCredit': 'Využít kredit',

    /* --- LoyaltyHistory --- */
    'screensB.lhistory.title': 'Historie věrnostních bodů',
    'screensB.lhistory.sub':
      'Každý bod, který jste ve Studio Circle získali a utratili.',
    'screensB.lhistory.currentBalance': 'Aktuální zůstatek',
    'screensB.lhistory.redeemRewards': 'Uplatnit odměny',

    /* --- Location --- */
    'screensB.location.title': 'Kde nás najdete',
    'screensB.location.lede':
      'Dvě patra nad pekárnou v Alder Lane. Pokud jsou dveře z ulice zavřené, zazvoňte na „Studio“.',
    'screensB.location.rowAddress': 'Adresa',
    'screensB.location.rowGettingIn': 'Vstup',
    'screensB.location.addressValue': '{line1}, {line2}',
    'screensB.location.getDirections': 'Navigovat',
    'screensB.location.callStudio': 'Zavolat do studia',
    'screensB.location.toastDial': 'Vytáčím {phone} — jen ukázka',
    'screensB.location.openingHours': 'Otevírací doba',
    'screensB.location.openToday': 'Dnes otevřeno',
    'screensB.location.closedToday': 'Dnes zavřeno',
    'screensB.location.beforeYouArrive': 'Než dorazíte',

    /* --- Loyalty --- */
    'screensB.loyalty.h1': 'Trochu záře s každou návštěvou.',
    'screensB.loyalty.sub':
      'Za každý dolar získáte bod, uplatníte ho na služby, které máte rádi, a jako člen odemknete víc. Vstup je zdarma.',
    'screensB.loyalty.yourPoints': 'Vaše body',
    'screensB.loyalty.member': 'Člen',
    'screensB.loyalty.progressLabel': 'Postup k další službě zdarma',
    'screensB.loyalty.unlocked':
      'Odemkli jste službu zdarma — uplatněte ji níže.',
    'screensB.loyalty.toGo':
      'Ještě {count} bod k další službě zdarma|Ještě {count} body k další službě zdarma|Ještě {count} bodů k další službě zdarma',
    'screensB.loyalty.redeemTitle': 'Uplatněte své body',
    'screensB.loyalty.locked': 'Uzamčeno',
    'screensB.loyalty.redeem': 'Uplatnit',
    'screensB.loyalty.becomeMember': 'Staňte se členem',
    'screensB.loyalty.becomeSub':
      'Získejte víc s členstvím Studio Circle — zrušíte kdykoli.',
    'screensB.loyalty.mostLoved': 'Nejoblíbenější',
    'screensB.loyalty.youreMember': 'Jste členem ✓',
    'screensB.loyalty.joinPlan': 'Vstoupit do {name}',

    /* --- Manage --- */
    'screensB.manage.title': 'Správa rezervace',
    'screensB.manage.sub':
      'Přeobjednejte nebo zrušte termín pomocí kódu a e-mailu.',
    'screensB.manage.fieldCode': 'Kód rezervace',
    'screensB.manage.fieldEmail': 'E-mail z rezervace',
    'screensB.manage.find': 'Najít rezervaci',
    'screensB.manage.tip':
      'Tip k ukázce: pole jsou předvyplněná existující rezervací — stačí klepnout na Najít.',
    'screensB.manage.withRole': '{name} · {role}',
    'screensB.manage.cancelled': 'Zrušeno',
    'screensB.manage.confirmed': 'Potvrzeno',
    'screensB.manage.cancelledNote':
      'Tento termín byl zrušen. Rezervujte znovu kdykoli — rádi vás uvidíme.',
    'screensB.manage.findAnother': 'Najít jinou rezervaci',

    /* --- Mobile --- */
    'screensB.mobile.deviceIphone': 'iPhone',
    'screensB.mobile.deviceAndroid': 'Telefon s Androidem',
    'screensB.mobile.deviceFrame': 'Rám zařízení',
    'screensB.mobile.eyebrow': 'Doprovodná aplikace',
    'screensB.mobile.h1': '{brand} v kapse',
    'screensB.mobile.sub':
      'Mobilní aplikace má vlastní design, není to zmenšený web — pět záložek, rezervace pro palce a body hned na úvodní obrazovce. Následuje ukázka toho designu, ne vydané aplikace, ale není to snímek obrazovky: klepejte do ní.',
    'screensB.mobile.switchNote':
      'Tohle přepíná telefon, ne aplikaci. Verze pro Android má vlastní design Material — jiný navigační pruh, těsnější horní okraj — to je samostatný návrh a tady ho nevidíte.',
    'screensB.mobile.yourProfile': 'Váš profil',
    'screensB.mobile.appTabs': 'Záložky aplikace',
    'screensB.mobile.greetMorning': 'Dobré ráno, {name}',
    'screensB.mobile.greetAfternoon': 'Dobré odpoledne, {name}',
    'screensB.mobile.greetEvening': 'Dobrý večer, {name}',
    'screensB.mobile.toastPickTime': 'Nejdřív vyberte čas',
    'screensB.mobile.toastBooked': 'Rezervace potvrzena',
    'screensB.mobile.toastPickNewTime': 'Vyberte nový čas',
    'screensB.mobile.ctaConfirm': 'Potvrdit · {time}',
    'screensB.mobile.ctaPickTime': 'Vyberte čas a pokračujte',
    'screensB.mobile.note':
      'Ukázka designu, ne běžící aplikace — nic, na co tu klepnete, se nedostane k vašemu účtu. Záložky, rezervace i slevové kódy fungují, aby design šel osahat; řádky, které vedly do hlubších obrazovek (tým, regál, dárkové poukazy), místo toho odpoví hláškou a tyto části najdete v plné podobě na webu. Samotný telefon je rekonstrukce: návrhy importovaly rám zařízení, který nikdy nebyl dodán.',
    'screensB.mobile.nextVisit': 'Příští návštěva',
    'screensB.mobile.manage': 'Spravovat',
    'screensB.mobile.directions': 'Navigace',
    'screensB.mobile.bookAgain': 'Rezervovat znovu',
    'screensB.mobile.durPrice': '{duration} · {price}',
    'screensB.mobile.durStaff': '{duration} · {staff}',
    'screensB.mobile.durWithStaff': '{duration} · u {staff}',
    'screensB.mobile.pointsGoal':
      'Ještě {count} bod k odměně {reward}|Ještě {count} body k odměně {reward}|Ještě {count} bodů k odměně {reward}',
    'screensB.mobile.pointsReady': 'Odměnu {reward} můžete uplatnit',
    'screensB.mobile.toastJournal': 'Otevírám magazín — jen ukázka',
    'screensB.mobile.allServices': 'Všechny služby',
    'screensB.mobile.pickDay': 'Vyberte den',
    'screensB.mobile.pickTime': 'Vyberte čas',
    'screensB.mobile.toastTaken': 'Tenhle termín je obsazený',
    'screensB.mobile.upcoming': 'Nadcházející',
    'screensB.mobile.past': 'Minulé',
    'screensB.mobile.dateTime': '{date} · {time}',
    'screensB.mobile.whenWho': '{when} · {who}',
    'screensB.mobile.toastCancelled': 'Zrušeno — jen ukázka',
    'screensB.mobile.toastReceipt': 'Účtenka odeslána e-mailem',
    'screensB.mobile.circle': 'Circle',
    'screensB.mobile.statPoints': 'Body',
    'screensB.mobile.preferences': 'Předvolby',
    'screensB.mobile.account': 'Účet',
    'screensB.mobile.pushNotifications': 'Push oznámení',
    'screensB.mobile.darkAppearance': 'Tmavý vzhled',
    'screensB.mobile.toastPushOn': 'Push zapnuto',
    'screensB.mobile.toastPushOff': 'Push vypnuto',
    'screensB.mobile.signOut': 'Odhlásit se',
    'screensB.mobile.toastSignedOut': 'Odhlášeno — jen ukázka',
    'screensB.mobile.version': '{brand} · {version}',
    'screensB.mobile.booked': 'Máte zarezervováno',
    'screensB.mobile.sheetSub':
      'Zapsali jsme vás na {service} u {staff}.',
    'screensB.mobile.firstSpecialistFree': 'prvního volného specialisty',
    'screensB.mobile.seeMyVisits': 'Zobrazit mé návštěvy',

    /* --- MyGifts --- */
    'screensB.mygifts.title': 'Zakoupené dárkové poukazy',
    'screensB.mygifts.sub': 'Poukazy, které jste koupili a odeslali.',
    'screensB.mygifts.buy': 'Koupit poukaz',
    'screensB.mygifts.emptyTitle': 'Zatím žádné poukazy',
    'screensB.mygifts.emptyBody':
      'Darujte trochu klidu — koupené poukazy najdete tady.',
    'screensB.mygifts.to': 'Pro {name} · {date}',
    'screensB.mygifts.sent': 'Odesláno',
    'screensB.mygifts.redeemed': 'Uplatněno',

    /* --- NotFound --- */
    'screensB.notfound.h1': 'Tahle stránka si vzala volno.',
    'screensB.notfound.body':
      'Nenašli jsme, co jste hledali — na úvodní stránce ale vždycky čeká nový look nebo trocha klidu.',

    /* --- NotifPrefs --- */
    'screensB.notifprefs.title': 'Nastavení oznámení',
    'screensB.notifprefs.sub':
      'Vyberte, co se k vám dostane a jak. Změny se ukládají průběžně.',
    'screensB.notifprefs.channels': 'Kanály',
    'screensB.notifprefs.whatWeSend': 'Co posíláme',
    'screensB.notifprefs.timing': 'Načasování',
    'screensB.notifprefs.remindMe': 'Připomenout',
    'screensB.notifprefs.remindSub': 'Jak dlouho před návštěvou se ozveme.',
    'screensB.notifprefs.reminderTiming': 'Načasování připomínky',
    'screensB.notifprefs.quietHours': 'Tichý režim',
    'screensB.notifprefs.quietSub': 'Vše nenaléhavé počká do rána.',
    'screensB.notifprefs.quietWindow': 'Tiché okno',
    'screensB.notifprefs.pauseTitle': 'Pozastavit vše',
    'screensB.notifprefs.pauseBody':
      'Vypne všechny kanály. Potvrzení rezervací stále chodí e-mailem.',
    'screensB.notifprefs.pauseAll': 'Pozastavit vše',
    'screensB.notifprefs.toastPaused': 'Všechna oznámení pozastavena',

    /* --- Offers --- */
    'screensB.offers.eyebrow': 'Podzim 2026',
    'screensB.offers.h1': 'Sezónní nabídky',
    'screensB.offers.sub':
      'Pár věcí, které stojí za rezervaci právě teď. Zkopírujte kód a uplatní se při platbě — jeden na návštěvu.',
    'screensB.offers.ends': 'Končí {date}',
    'screensB.offers.bookPairing': 'Rezervovat kombinaci',
    'screensB.offers.toastCopied': '{code} zkopírován do schránky',
    'screensB.offers.note':
      'Jedna nabídka na návštěvu, nelze kombinovat s balíčky ani dobitím poukazu. Členové mají svých 10 % vždy navíc. Ukázkové kódy — nic se doopravdy neslevňuje.',

    /* --- Orders --- */
    'screensB.orders.title': 'Historie objednávek',
    'screensB.orders.sub':
      'Každá návštěva, balíček i dárkový poukaz, které jste zaplatili.',
    'screensB.orders.spent': 'Utraceno v roce 2026',
    'screensB.orders.emptyTitle': 'V tomto filtru nic není',
    'screensB.orders.emptyBody':
      'Zkuste jinou kategorii — ostatní objednávky tam stále jsou.',
    'screensB.orders.toastReceipt': 'Účtenka {code} odeslána na {email}',

    /* --- Packages --- */
    'screensB.packages.subject': '{qty} × {name}',
    'screensB.packages.studioServices': 'služby studia',
    'screensB.packages.expires': 'Platí do {date}',
    'screensB.packages.eyebrow': 'Předplacené balíčky',
    'screensB.packages.h1': 'Zvýhodněné balíčky',
    'screensB.packages.sub':
      'Kupte několik návštěv najednou a plaťte méně za sezení. Sezení zůstanou na účtu, dokud si je nerezervujete — bez měsíčního poplatku a bez hrátek s expirací.',
    'screensB.packages.yourPackages': 'Vaše balíčky',
    'screensB.packages.left': 'zbývá',
    'screensB.packages.sessionsUsed': 'Využitá sezení balíčku {name}',
    'screensB.packages.usedOf': 'Využito {used} z {total}',
    'screensB.packages.bookSession': 'Rezervovat sezení',
    'screensB.packages.available': 'Dostupné balíčky',
    'screensB.packages.mostPopular': 'Nejoblíbenější',
    'screensB.packages.save': 'Ušetříte {amount}',
    'screensB.packages.perSession': '{amount} / sezení',
    'screensB.packages.inAccount': 'Na vašem účtu',
    'screensB.packages.buy': 'Koupit balíček',
    'screensB.packages.toastAlready': '{name} už na účtu máte',
    'screensB.packages.toastAdded':
      '{name} přidán — jen ukázka, nic se neúčtuje',
    'screensB.packages.note':
      'Sezení platí 12 měsíců, jednou je lze darovat a vracejí se poměrnou částí. Toto je ukázka — nic se neúčtuje.',

    /* --- Policy --- */
    'screensB.policy.title': 'Storno podmínky',
    'screensB.policy.sub':
      'Plány se mění — chápeme. Takhle to u nás funguje, srozumitelně.',
    'screensB.policy.windowTitle': 'Lhůta 24 hodin',
    'screensB.policy.windowBody':
      'Zrušte nebo přeobjednejte až 24 hodin před začátkem zdarma, přímo ve Správě rezervace.',
    'screensB.policy.lateTitle': 'Pozdní zrušení a neomluvená absence',
    'screensB.policy.lateBody':
      'Do 24 hodin před termínem účtujeme 50 %. Neomluvená absence se hradí v plné výši, aby křeslo nezůstalo prázdné.',
    'screensB.policy.howTitle': 'Jak zrušit',
    'screensB.policy.howBody':
      'Otevřete Správu rezervace, zadejte kód a e-mail a zvolte Přeobjednat nebo Zrušit — telefonovat není třeba.',
    'screensB.policy.membersTitle': 'Členové a balíčky',
    'screensB.policy.membersBody':
      'Členové Studio Circle mají každý měsíc jedno pozdní zrušení bez poplatku. Sezení z balíčku se jednoduše vrátí na zůstatek.',
    'screensB.policy.banner':
      'Toto jsou ukázkové podmínky pro ilustraci — žádné poplatky se nikdy neúčtují.',

    /* --- Post --- */
    'screensB.post.back': 'Zpět na magazín',
    'screensB.post.emptyTitle': 'Tenhle článek tu není',
    'screensB.post.emptyBody':
      'Možná byl stažen. Všechno, co jsme napsali, najdete v přehledu magazínu.',
    'screensB.post.browse': 'Procházet magazín',
    'screensB.post.byline': '{date} · {read}',
    'screensB.post.more': 'Další z magazínu',

    /* --- Refer --- */
    'screensB.refer.title': 'Doporučte nás příteli',
    'screensB.refer.sub':
      'Dejte {amount}, dostanete {amount}. Všichni odcházejí zářiví.',
    'screensB.refer.yourCode': 'Váš kód pozvánky',
    'screensB.refer.copyLink': 'Kopírovat odkaz pozvánky',
    'screensB.refer.toastCopied': 'Odkaz pozvánky zkopírován do schránky',
    'screensB.refer.yourInvites': 'Vaše pozvánky',

    /* --- Reviews --- */
    'screensB.reviews.justNow': 'právě teď',
    'screensB.reviews.total': '{reviews} hodnocení · {specialists} specialistů',
    'screensB.reviews.starRow': '{stars}★',
    'screensB.reviews.composeSent': 'Vaše hodnocení je online',
    'screensB.reviews.composeTitle': 'Byli jste tu nedávno? Napište, jaké to bylo',
    'screensB.reviews.thanks':
      'Děkujeme — vaše hodnocení je nahoře v seznamu. Dalších 24 hodin ho můžete upravit.',
    'screensB.reviews.starsAria':
      '{count} hvězdička|{count} hvězdičky|{count} hvězdiček',
    'screensB.reviews.placeholder':
      'Jaká byla návštěva? Něco, co by měl další host vědět?',
    'screensB.reviews.textareaLabel': 'Vaše hodnocení',
    'screensB.reviews.postingAs':
      'Publikuje {name} · vaše poslední návštěva byla {date}',
    'screensB.reviews.post': 'Odeslat hodnocení',
    'screensB.reviews.errEmpty': 'Napište nejdřív řádek nebo dva',
    'screensB.reviews.toastPosted': 'Hodnocení odesláno · jen ukázka',
    'screensB.reviews.showing': 'Zobrazeno {shown} z {total}',
    'screensB.reviews.metaStaff': '{service} · u {staff} · {date}',
    'screensB.reviews.metaStudio': '{service} · studio · {date}',
    'screensB.reviews.replyBy': '{name} odpověděl',
    'screensB.reviews.helpful': 'Užitečné · {n}',
    'screensB.reviews.report': 'Nahlásit',
    'screensB.reviews.toastFlagged': 'Označeno k přečtení pro tým',

    /* --- Rewards --- */
    'screensB.rewards.srTitle': 'Věrnostní odměny',
    'screensB.rewards.yourSpecialist': 'váš specialista',
    'screensB.rewards.yourBalance': 'Váš zůstatek',
    'screensB.rewards.progressLabel': 'Postup k další odměně {amount}',
    'screensB.rewards.canRedeem': 'Odměnu {amount} můžete uplatnit hned.',
    'screensB.rewards.toGo':
      'Ještě {count} bod k odměně {amount}|Ještě {count} body k odměně {amount}|Ještě {count} bodů k odměně {amount}',
    'screensB.rewards.factEarned': 'Získáno letos',
    'screensB.rewards.factRedeemed': 'Uplatněno',
    'screensB.rewards.factTier': 'Úroveň',
    'screensB.rewards.tierCircle': 'Circle',
    'screensB.rewards.tierGuest': 'Host',
    'screensB.rewards.spendTitle': 'Utraťte své body',
    'screensB.rewards.redeemed': 'Uplatněno · na vašem účtu',
    'screensB.rewards.redeem': 'Uplatnit',
    'screensB.rewards.pointsToGo':
      'Ještě {count} bod|Ještě {count} body|Ještě {count} bodů',
    'screensB.rewards.toastRedeemed': '{name} · přidáno na váš účet',
    'screensB.rewards.recentPoints': 'Poslední body',
    'screensB.rewards.howPointsWork': 'Jak body fungují',

    /* --- Services --- */
    'screensB.services.title': 'Služby',
    'screensB.services.sub':
      'Vyberte, na co máte chuť. Každá rezervace se potvrdí okamžitě — specialistu a čas zvolíte hned potom.',
    'screensB.services.filterLabel': 'Filtrovat podle kategorie',

    /* --- Shop --- */
    'screensB.shop.title': 'Regál',
    'screensB.shop.sub':
      'Vše, co na vás skutečně používáme, v balení, které bychom si koupili sami. Vyzvedněte si to ve studiu nebo si nechte poslat.',
    'screensB.shop.removeOne': 'Odebrat jeden kus: {name}',
    'screensB.shop.addAnother': 'Přidat další kus: {name}',
    'screensB.shop.addToBag': 'Do košíku',
    'screensB.shop.toastAdded': '{name} přidán do košíku',
    'screensB.shop.yourBag': 'Váš košík',
    'screensB.shop.cartEmpty':
      'Košík je zatím prázdný. Produkty můžeme připsat i k účtu za návštěvu, pokud raději platíte ve studiu.',
    'screensB.shop.lineQty': '{qty} × {price}',
    'screensB.shop.subtotal': 'Mezisoučet',
    'screensB.shop.checkout': 'K pokladně',
    'screensB.shop.ship': 'Vyzvednutí ve studiu zdarma · zaslání {amount}',

    /* --- SignIn --- */
    'screensB.signin.errEmail': 'Zadejte platnou e-mailovou adresu.',
    'screensB.signin.toastCodeSent':
      'Kód odeslán · projde libovolných šest číslic',
    'screensB.signin.errCode': 'Zadejte všech šest číslic a pokračujte.',
    'screensB.signin.toastSignedIn': 'Přihlášeni jako {name}',
    'screensB.signin.welcome': 'Vítejte zpět',
    'screensB.signin.lede':
      'Zadejte e-mail a pošleme vám šestimístný kód. Žádné heslo, které by šlo zapomenout.',
    'screensB.signin.fieldEmail': 'E-mailová adresa',
    'screensB.signin.remember': 'Zůstat přihlášen na tomto zařízení',
    'screensB.signin.emailCode': 'Poslat kód e-mailem',
    'screensB.signin.or': 'nebo',
    'screensB.signin.bookWithoutAccount': 'Rezervovat bez účtu',
    'screensB.signin.foot':
      'Toto je ukázkové přihlášení — projde jakýkoli e-mail a žádný kód se doopravdy neposílá.',
    'screensB.signin.differentEmail': 'Použít jiný e-mail',
    'screensB.signin.checkInbox': 'Podívejte se do schránky',
    'screensB.signin.sentTo': 'Šestimístný kód jsme poslali na {email}',
    'screensB.signin.yourInbox': 'vaši schránku',
    'screensB.signin.codeLabel': 'Šestimístný přihlašovací kód',
    'screensB.signin.verify': 'Ověřit a přihlásit',
    'screensB.signin.didntGet': 'Nedorazil?',
    'screensB.signin.resend': 'Poslat kód znovu',
    'screensB.signin.toastNewCode': 'Nový kód je na cestě',
    'screensB.signin.demoHint':
      'Tip k ukázce: stačí libovolných šest číslic.',

    /* --- Staff --- */
    'screensB.staff.dirTitle': 'Lidé u křesel',
    'screensB.staff.dirLede':
      'Čtyři specialisté, každý s vlastními hodinami i vlastním rukopisem. Vyberte si, kdo vám sedne — nebo to necháme na nás.',
    'screensB.staff.nextFree': 'Nejbližší volno · {when}',
    'screensB.staff.viewProfile': 'Zobrazit profil',
    'screensB.staff.allSpecialists': 'Všichni specialisté',
    'screensB.staff.since': '{role} · ve studiu od roku {year}',
    'screensB.staff.knownFor': 'Známý díky',
    'screensB.staff.guestsSay': 'Co říkají hosté',
    'screensB.staff.quoteMeta': '{service} · {date}',
    'screensB.staff.statRating': 'Průměr',
    'screensB.staff.statReviews': 'Hodnocení',
    'screensB.staff.statYears': 'Ve studiu',
    'screensB.staff.joinWaitlist': 'Zapsat se k němu do pořadníku',
    'screensB.staff.usualWeek': 'Běžný týden',
    'screensB.staff.hourRange': '{from} – {to}',
    'screensB.staff.off': 'Volno',
    'screensB.staff.servicesOffered': 'Služby, které nabízí {name}',

    /* --- Visits --- */
    'screensB.visits.title': 'Mé nadcházející návštěvy',
    'screensB.visits.sub': 'Vše, co u nás máte zarezervováno.',
    'screensB.visits.emptyTitle': 'Zatím nic zarezervováno',
    'screensB.visits.emptyBody':
      'Jakmile si rezervujete návštěvu, objeví se tu se všemi detaily.',
    'screensB.visits.bookVisit': 'Rezervovat návštěvu',
    'screensB.visits.appointment': 'Termín',
    'screensB.visits.repeats':
      'Opakuje se {freq} · {count} návštěva|Opakuje se {freq} · {count} návštěvy|Opakuje se {freq} · {count} návštěv',
    'screensB.visits.manage': 'Přeobjednat nebo zrušit',

    /* --- Waitlist --- */
    'screensB.waitlist.title': 'Pořadník',
    'screensB.waitlist.lede':
      'Skoro každý den se něco uvolní. Řekněte nám, o co stojíte, a napíšeme vám, jakmile se místo uvolní.',
    'screensB.waitlist.joinTitle': 'Zapsat se',
    'screensB.waitlist.groupService': 'Jakou službu?',
    'screensB.waitlist.groupDays': 'Dny, které vám vyhovují',
    'screensB.waitlist.groupTime': 'Denní doba',
    'screensB.waitlist.groupNotify': 'Dejte mi vědět přes',
    'screensB.waitlist.winMornings': 'Dopoledne',
    'screensB.waitlist.winAfternoons': 'Odpoledne',
    'screensB.waitlist.winEvenings': 'Večery',
    'screensB.waitlist.notifyText': 'SMS',
    'screensB.waitlist.notifyEmail': 'E-mail',
    'screensB.waitlist.notifyPush': 'Push',
    'screensB.waitlist.oddsMany':
      'Při takovém počtu dnů se většina hostů dočká odpovědi do 48 hodin.',
    'screensB.waitlist.oddsSome':
      'Dva nebo tři dny znamenají v tomhle období obvykle pár dní čekání.',
    'screensB.waitlist.oddsOne':
      'Jediný den může trvat i pár týdnů — přidejte další, pokud to jde.',
    'screensB.waitlist.addMe': 'Zapsat mě do pořadníku',
    'screensB.waitlist.errPickDay': 'Vyberte alespoň jeden vyhovující den',
    'screensB.waitlist.toastJoinedText':
      'Jste v pořadníku · ozveme se vám SMS zprávou',
    'screensB.waitlist.toastJoinedEmail':
      'Jste v pořadníku · ozveme se vám e-mailem',
    'screensB.waitlist.toastJoinedPush':
      'Jste v pořadníku · ozveme se vám push oznámením',
    'screensB.waitlist.waitingOn': 'Čekáte na',
    'screensB.waitlist.emptyTitle': 'Zatím nic',
    'screensB.waitlist.emptyBody':
      'Zapište se přes formulář a vaše místo ve frontě se objeví tady.',
    'screensB.waitlist.toastWidened':
      'Okno rozšířeno · podíváme se na víc dnů',
    'screensB.waitlist.flexible': 'flexibilně',
    'screensB.waitlist.entryStaffDate': 'u {staff} · {date}',
    'screensB.waitlist.entryAnyDate': 'kterýkoli specialista · {date}',
    'screensB.waitlist.inLine': '{pos}. ve frontě',
    'screensB.waitlist.oddsNext':
      'Jste na řadě — napíšeme vám, jakmile se místo uvolní.',
    'screensB.waitlist.oddsWait':
      'V tomhle období asi {count} den čekání.|V tomhle období asi {count} dny čekání.|V tomhle období asi {count} dnů čekání.',
    'screensB.waitlist.widen': 'Rozšířit mé okno',

    /* --- WaitlistStatus --- */
    'screensB.wstatus.title': 'Stav pořadníku',
    'screensB.wstatus.sub':
      'Dny, na které čekáte — napíšeme vám, jakmile se místo uvolní.',
    'screensB.wstatus.emptyTitle': 'Nejste v žádném pořadníku',
    'screensB.wstatus.emptyBody':
      'Pokud je den plně obsazený, zapište se do pořadníku v kroku s datem a časem a objeví se tady.',
    'screensB.wstatus.flexible': 'Flexibilně',
    'screensB.wstatus.whenWho': '{date} · {who}',
    'screensB.wstatus.waiting': 'Čeká na uvolněné místo',
  },
  'da-DK': {
    /* --- shared inside this area --- */
    'screensB.common.all': 'Alle',
    'screensB.common.anyService': 'Enhver ydelse',
    'screensB.common.backHome': 'Tilbage til forsiden',
    'screensB.common.backToDashboard': 'Tilbage til oversigten',
    'screensB.common.book': 'Book',
    'screensB.common.bookNamed': 'Book {name}',
    'screensB.common.bookWith': 'Book hos {name}',
    'screensB.common.cancel': 'Aflys',
    'screensB.common.codeCopied': '{code} kopieret',
    'screensB.common.copyCode': 'Kopiér koden {code}',
    'screensB.common.demoOnly': '{label} — kun demo',
    'screensB.common.email': 'E-mail',
    'screensB.common.firstAvailable': 'Først ledige',
    'screensB.common.fullName': 'Fulde navn',
    'screensB.common.howItWorks': 'Sådan virker det',
    'screensB.common.leave': 'Forlad',
    'screensB.common.optional': '(valgfrit)',
    'screensB.common.phEmail': 'dig@email.dk',
    'screensB.common.phone': 'Telefon',
    'screensB.common.pointsUnit': 'point|point',
    'screensB.common.ptsCount': '{count} point|{count} point',
    'screensB.common.ptsUnit': 'point|point',
    'screensB.common.receipt': 'Kvittering',
    'screensB.common.reschedule': 'Flyt',
    'screensB.common.seeAll': 'Se alle',
    'screensB.common.time': 'Tid',
    'screensB.common.timeDur': '{time} · {duration}',
    'screensB.common.toastMaps': 'Åbner Maps — kun demo',
    'screensB.common.total': 'I alt',
    'screensB.common.when': 'Hvornår',
    'screensB.common.with': 'Hos',

    /* --- Help --- */
    'screensB.help.title': 'Hvad kan vi hjælpe med?',
    'screensB.help.sub': 'Svar på det, gæsterne spørger os om oftest.',
    'screensB.help.searchPlaceholder': 'Søg i hjælpen…',
    'screensB.help.searchLabel': 'Søg i hjælpen',
    'screensB.help.results':
      '{count} svar på “{query}”|{count} svar på “{query}”',
    'screensB.help.common': 'Ofte stillede spørgsmål',
    'screensB.help.emptyTitle': 'Ingen resultater',
    'screensB.help.emptyBody':
      'Prøv en kortere søgning, eller skriv til os — et rigtigt menneske svarer mellem 9 og 18.',
    'screensB.help.stuckTitle': 'Stadig i tvivl?',
    'screensB.help.stuckBody':
      'Vores afbudsregler besvarer de fleste spørgsmål om booking i et klart sprog.',
    'screensB.help.readPolicy': 'Læs reglerne',

    /* --- Home --- */
    'screensB.home.eyebrow': 'Boutique skønhed & velvære',
    'screensB.home.title': 'Føl dig som den bedste udgave af dig selv.',
    'screensB.home.lede':
      'Hår, spa, negle og bevægelse under ét roligt tag. Book en stol eller et behandlingsrum med få tryk — ingen telefonkø, ingen konto.',
    'screensB.home.bookNow': 'Book nu',
    'screensB.home.viewServices': 'Se ydelser',
    'screensB.home.trustOpenings': 'Ledige tider i denne uge',
    'screensB.home.trustDowntown': 'Studie i centrum',
    'screensB.home.trustWalkins': 'Drop-in er velkomment',
    'screensB.home.popularTitle': 'Populære ydelser',
    'screensB.home.popularSub': 'Lidt fra hvert hjørne af studiet.',
    'screensB.home.teamTitle': 'Mød teamet',
    'screensB.home.teamSub': 'Fire specialister, én meget velordnet kalender.',
    'screensB.home.lovedTitle': 'Elsket af stamgæsterne',
    'screensB.home.lovedSub':
      'Hvad gæsterne siger, når de er tilbage i den virkelige verden.',
    'screensB.home.ratingFrom': 'ud fra {count} anmeldelse|ud fra {count} anmeldelser',
    'screensB.home.hoursTitle': 'Ugens åbningstider',
    'screensB.home.hoursNote':
      'Hver specialist har sine egne tider — du ser de ledige tider live, når du booker.',

    /* --- Intake --- */
    'screensB.intake.doneTitle': 'Indledende skema gemt',
    'screensB.intake.doneBody':
      'Tak — din specialist læser det inden dit besøg. Dette er en demo, så intet gemmes reelt.',
    'screensB.intake.editAnswers': 'Ret svar',
    'screensB.intake.title': 'Digitalt indledende skema',
    'screensB.intake.sub':
      'Et par hurtige spørgsmål, så din specialist kan tilpasse besøget. Tager cirka et minut.',
    'screensB.intake.concernsLegend': 'Er der noget, der gælder for dig?',
    'screensB.intake.allergiesLabel': 'Allergier eller overfølsomhed',
    'screensB.intake.allergiesPlaceholder': 'Dufte, latex, bestemte produkter…',
    'screensB.intake.pressureLabel': 'Foretrukket tryk / intensitet',
    'screensB.intake.consent':
      'Jeg bekræfter, at ovenstående er korrekt, og giver samtykke til behandling. Jeg kan opdatere det når som helst inden mit besøg.',
    'screensB.intake.submit': 'Gem skemaet',

    /* --- Join --- */
    'screensB.join.cycleMonthly': 'Månedligt',
    'screensB.join.cycleAnnual': 'Årligt · 2 måneder gratis',
    'screensB.join.startToday': 'Start i dag',
    'screensB.join.startFirst': 'Start den 1.',
    'screensB.join.title': 'Bliv en del af Circle',
    'screensB.join.sub':
      'En behandling om måneden, ti procent på alt andet og første ret til afbud. Opsig når du vil — ingen binding.',
    'screensB.join.billingCycle': 'Betalingsperiode',
    'screensB.join.mostJoined': 'Flest vælger denne',
    'screensB.join.perYear': '/år',
    'screensB.join.perMonth': '/måned',
    'screensB.join.selected': 'Valgt · fortsæt',
    'screensB.join.choose': 'Vælg {name}',
    'screensB.join.note':
      'Medlemskabet betaler sig selv ved ét besøg om måneden. Ubrugte månedlige behandlinger overføres én gang. Demo-tilmelding — intet kort trækkes.',
    'screensB.join.otherPlans': 'Andre planer',
    'screensB.join.payTitle': 'Bekræft dit medlemskab',
    'screensB.join.yourDetails': 'Dine oplysninger',
    'screensB.join.mobile': 'Mobil',
    'screensB.join.starts': 'Starter',
    'screensB.join.lineAnnual': '{name} · 12 måneder',
    'screensB.join.lineFirstMonth': '{name} · første måned',
    'screensB.join.startsToday': 'Starter i dag',
    'screensB.join.prorata': 'Forholdsmæssig kredit',
    'screensB.join.joiningFee': 'Oprettelsesgebyr',
    'screensB.join.waived': 'Bortfalder',
    'screensB.join.errEmail': 'Tilføj en e-mail, så vi kan sende kortet',
    'screensB.join.welcome': 'Velkommen til Circle',
    'screensB.join.summaryAnnual': '{name} · årligt',
    'screensB.join.summaryMonthly': '{name} · månedligt',
    'screensB.join.dueToday': 'Skal betales i dag',
    'screensB.join.startMembership': 'Start mit medlemskab',
    'screensB.join.fine':
      'Opsig når som helst fra din konto. Kun demo — der trækkes intet.',
    'screensB.join.doneTitle': 'Du er med i Circle',
    'screensB.join.doneSub':
      'Din første behandlingskredit ligger allerede på din konto, og fra nu af trækkes ti procent automatisk fra hver booking.',
    'screensB.join.rowPlan': 'Plan',
    'screensB.join.rowBilling': 'Betaling',
    'screensB.join.billingAnnually': 'Årligt · {amount}',
    'screensB.join.billingMonthly': 'Månedligt · {amount}',
    'screensB.join.rowMemberNo': 'Medlemsnummer',
    'screensB.join.seeRewards': 'Se dine belønninger',
    'screensB.join.useCredit': 'Brug min kredit',

    /* --- LoyaltyHistory --- */
    'screensB.lhistory.title': 'Pointhistorik',
    'screensB.lhistory.sub':
      'Hvert point, du har optjent og brugt hos Studio Circle.',
    'screensB.lhistory.currentBalance': 'Nuværende saldo',
    'screensB.lhistory.redeemRewards': 'Indløs belønninger',

    /* --- Location --- */
    'screensB.location.title': 'Find os',
    'screensB.location.lede':
      'To etager over bageriet på Alder Lane. Ring på klokken mærket Studio, hvis gadedøren er lukket.',
    'screensB.location.rowAddress': 'Adresse',
    'screensB.location.rowGettingIn': 'Adgang',
    'screensB.location.addressValue': '{line1}, {line2}',
    'screensB.location.getDirections': 'Vis rute',
    'screensB.location.callStudio': 'Ring til studiet',
    'screensB.location.toastDial': 'Ringer til {phone} — kun demo',
    'screensB.location.openingHours': 'Åbningstider',
    'screensB.location.openToday': 'Åbent i dag',
    'screensB.location.closedToday': 'Lukket i dag',
    'screensB.location.beforeYouArrive': 'Inden du kommer',

    /* --- Loyalty --- */
    'screensB.loyalty.h1': 'Lidt glød ved hvert besøg.',
    'screensB.loyalty.sub':
      'Optjen et point pr. dollar, indløs dem til de ydelser du holder af, og lås mere op som medlem. Det er gratis at være med.',
    'screensB.loyalty.yourPoints': 'Dine point',
    'screensB.loyalty.member': 'Medlem',
    'screensB.loyalty.progressLabel': 'Vej til din næste gratis ydelse',
    'screensB.loyalty.unlocked':
      'Du har låst op for en gratis ydelse — indløs den nedenfor.',
    'screensB.loyalty.toGo':
      '{count} point til din næste gratis ydelse|{count} point til din næste gratis ydelse',
    'screensB.loyalty.redeemTitle': 'Indløs dine point',
    'screensB.loyalty.locked': 'Låst',
    'screensB.loyalty.redeem': 'Indløs',
    'screensB.loyalty.becomeMember': 'Bliv medlem',
    'screensB.loyalty.becomeSub':
      'Få mere ud af det med Studio Circle-medlemskab — opsig når som helst.',
    'screensB.loyalty.mostLoved': 'Mest elsket',
    'screensB.loyalty.youreMember': 'Du er medlem ✓',
    'screensB.loyalty.joinPlan': 'Vælg {name}',

    /* --- Manage --- */
    'screensB.manage.title': 'Administrér booking',
    'screensB.manage.sub': 'Flyt eller aflys en tid med din kode og e-mail.',
    'screensB.manage.fieldCode': 'Bookingkode',
    'screensB.manage.fieldEmail': 'E-mail på bookingen',
    'screensB.manage.find': 'Find min booking',
    'screensB.manage.tip':
      'Demo-tip: felterne er udfyldt på forhånd med en booking, der allerede findes — tryk bare Find.',
    'screensB.manage.withRole': '{name} · {role}',
    'screensB.manage.cancelled': 'Aflyst',
    'screensB.manage.confirmed': 'Bekræftet',
    'screensB.manage.cancelledNote':
      'Denne tid blev aflyst. Book igen når som helst — vi vil gerne se dig.',
    'screensB.manage.findAnother': 'Find en anden booking',

    /* --- Mobile --- */
    'screensB.mobile.deviceIphone': 'iPhone',
    'screensB.mobile.deviceAndroid': 'Android-telefon',
    'screensB.mobile.deviceFrame': 'Enhedsramme',
    'screensB.mobile.eyebrow': 'Ledsagerapp',
    'screensB.mobile.h1': '{brand} i lommen',
    'screensB.mobile.sub':
      'Telefonappen har sit eget design, ikke et sammenpresset website — fem faner, et bookingforløb bygget til tommelfingre og dine point på startskærmen. Det følgende viser designet frem, ikke den udgivne app, men det er ikke et skærmbillede: tryk dig igennem.',
    'screensB.mobile.switchNote':
      'Det skifter telefonen, ikke appen. Android-versionen har sit eget Material-design — en anden navigationslinje, strammere topafstand — det er et separat design og vises ikke her.',
    'screensB.mobile.yourProfile': 'Din profil',
    'screensB.mobile.appTabs': 'App-faner',
    'screensB.mobile.greetMorning': 'Godmorgen, {name}',
    'screensB.mobile.greetAfternoon': 'God eftermiddag, {name}',
    'screensB.mobile.greetEvening': 'Godaften, {name}',
    'screensB.mobile.toastPickTime': 'Vælg et tidspunkt først',
    'screensB.mobile.toastBooked': 'Booking bekræftet',
    'screensB.mobile.toastPickNewTime': 'Vælg et nyt tidspunkt',
    'screensB.mobile.ctaConfirm': 'Bekræft · {time}',
    'screensB.mobile.ctaPickTime': 'Vælg et tidspunkt for at fortsætte',
    'screensB.mobile.note':
      'Et designudstillingsvindue, ikke den kørende app — intet af det, du trykker på her, når din konto. Fanerne, bookingforløbet og rabatkoderne er levende, så designet kan mærkes; rækker, der førte til appens dybere skærme (teamet, hylden, gavekort), svarer i stedet med en besked, og de forløb findes i fuld længde på nettet. Selve telefonen er en rekonstruktion: designene importerede en enhedsramme, der aldrig blev leveret med.',
    'screensB.mobile.nextVisit': 'Næste besøg',
    'screensB.mobile.manage': 'Administrér',
    'screensB.mobile.directions': 'Rute',
    'screensB.mobile.bookAgain': 'Book igen',
    'screensB.mobile.durPrice': '{duration} · {price}',
    'screensB.mobile.durStaff': '{duration} · {staff}',
    'screensB.mobile.durWithStaff': '{duration} · hos {staff}',
    'screensB.mobile.pointsGoal':
      '{count} point til din næste belønning {reward}|{count} point til din næste belønning {reward}',
    'screensB.mobile.pointsReady': 'Din belønning {reward} er klar til indløsning',
    'screensB.mobile.toastJournal': 'Åbner journalen — kun demo',
    'screensB.mobile.allServices': 'Alle ydelser',
    'screensB.mobile.pickDay': 'Vælg en dag',
    'screensB.mobile.pickTime': 'Vælg et tidspunkt',
    'screensB.mobile.toastTaken': 'Den tid er taget',
    'screensB.mobile.upcoming': 'Kommende',
    'screensB.mobile.past': 'Tidligere',
    'screensB.mobile.dateTime': '{date} · {time}',
    'screensB.mobile.whenWho': '{when} · {who}',
    'screensB.mobile.toastCancelled': 'Aflyst — kun demo',
    'screensB.mobile.toastReceipt': 'Kvittering sendt på e-mail',
    'screensB.mobile.circle': 'Circle',
    'screensB.mobile.statPoints': 'Point',
    'screensB.mobile.preferences': 'Indstillinger',
    'screensB.mobile.account': 'Konto',
    'screensB.mobile.pushNotifications': 'Push-beskeder',
    'screensB.mobile.darkAppearance': 'Mørkt udseende',
    'screensB.mobile.toastPushOn': 'Push slået til',
    'screensB.mobile.toastPushOff': 'Push slået fra',
    'screensB.mobile.signOut': 'Log ud',
    'screensB.mobile.toastSignedOut': 'Logget ud — kun demo',
    'screensB.mobile.version': '{brand} · {version}',
    'screensB.mobile.booked': 'Du er booket',
    'screensB.mobile.sheetSub':
      'Vi har skrevet dig op til {service} hos {staff}.',
    'screensB.mobile.firstSpecialistFree': 'den først ledige specialist',
    'screensB.mobile.seeMyVisits': 'Se mine besøg',

    /* --- MyGifts --- */
    'screensB.mygifts.title': 'Købte gavekort',
    'screensB.mygifts.sub': 'Gavekort, du har købt og sendt.',
    'screensB.mygifts.buy': 'Køb et gavekort',
    'screensB.mygifts.emptyTitle': 'Ingen gavekort endnu',
    'screensB.mygifts.emptyBody':
      'Giv lidt ro i gave — de kort, du køber, lander her.',
    'screensB.mygifts.to': 'Til {name} · {date}',
    'screensB.mygifts.sent': 'Sendt',
    'screensB.mygifts.redeemed': 'Indløst',

    /* --- NotFound --- */
    'screensB.notfound.h1': 'Denne side har taget en fridag.',
    'screensB.notfound.body':
      'Vi kunne ikke finde det, du ledte efter — men der venter altid et friskt look eller lidt ro på forsiden.',

    /* --- NotifPrefs --- */
    'screensB.notifprefs.title': 'Beskedindstillinger',
    'screensB.notifprefs.sub':
      'Vælg hvad der når dig, og hvordan. Ændringer gemmes undervejs.',
    'screensB.notifprefs.channels': 'Kanaler',
    'screensB.notifprefs.whatWeSend': 'Hvad vi sender',
    'screensB.notifprefs.timing': 'Timing',
    'screensB.notifprefs.remindMe': 'Mind mig om',
    'screensB.notifprefs.remindSub': 'Hvor længe før et besøg vi kontakter dig.',
    'screensB.notifprefs.reminderTiming': 'Tidspunkt for påmindelse',
    'screensB.notifprefs.quietHours': 'Stilletimer',
    'screensB.notifprefs.quietSub': 'Alt ikke-hastende venter til morgenen.',
    'screensB.notifprefs.quietWindow': 'Stillevindue',
    'screensB.notifprefs.pauseTitle': 'Sæt alt på pause',
    'screensB.notifprefs.pauseBody':
      'Slår alle kanaler fra. Bookingbekræftelser kommer stadig på e-mail.',
    'screensB.notifprefs.pauseAll': 'Sæt alt på pause',
    'screensB.notifprefs.toastPaused': 'Alle beskeder er sat på pause',

    /* --- Offers --- */
    'screensB.offers.eyebrow': 'Efterår 2026',
    'screensB.offers.h1': 'Sæsontilbud',
    'screensB.offers.sub':
      'Et par ting, der er værd at booke i denne sæson. Kopiér en kode, så gælder den ved betaling — én pr. besøg.',
    'screensB.offers.ends': 'Slutter {date}',
    'screensB.offers.bookPairing': 'Book kombinationen',
    'screensB.offers.toastCopied': '{code} kopieret til udklipsholderen',
    'screensB.offers.note':
      'Ét tilbud pr. besøg, kan ikke kombineres med klippekort eller optankning af gavekort. Medlemmer får altid deres 10 % oveni. Demo-koder — der gives ingen rigtig rabat.',

    /* --- Orders --- */
    'screensB.orders.title': 'Ordrehistorik',
    'screensB.orders.sub':
      'Hvert besøg, klippekort og gavekort, du har betalt for.',
    'screensB.orders.spent': 'Brugt i 2026',
    'screensB.orders.emptyTitle': 'Intet i dette filter',
    'screensB.orders.emptyBody':
      'Prøv en anden kategori — dine øvrige ordrer er der stadig.',
    'screensB.orders.toastReceipt': 'Kvittering {code} sendt til {email}',

    /* --- Packages --- */
    'screensB.packages.subject': '{qty} × {name}',
    'screensB.packages.studioServices': 'studiets ydelser',
    'screensB.packages.expires': 'Udløber {date}',
    'screensB.packages.eyebrow': 'Forudbetalte klippekort',
    'screensB.packages.h1': 'Klippekort',
    'screensB.packages.sub':
      'Køb flere besøg på én gang og betal mindre pr. gang. Klippene bliver på din konto, til du booker dem — intet månedsgebyr, ingen udløbstricks.',
    'screensB.packages.yourPackages': 'Dine klippekort',
    'screensB.packages.left': 'tilbage',
    'screensB.packages.sessionsUsed': 'Brugte klip på {name}',
    'screensB.packages.usedOf': '{used} af {total} brugt',
    'screensB.packages.bookSession': 'Book et klip',
    'screensB.packages.available': 'Tilgængelige klippekort',
    'screensB.packages.mostPopular': 'Mest populære',
    'screensB.packages.save': 'Spar {amount}',
    'screensB.packages.perSession': '{amount} / gang',
    'screensB.packages.inAccount': 'På din konto',
    'screensB.packages.buy': 'Køb klippekort',
    'screensB.packages.toastAlready': '{name} ligger allerede på din konto',
    'screensB.packages.toastAdded':
      '{name} tilføjet — kun demo, intet trækkes',
    'screensB.packages.note':
      'Klip gælder i 12 måneder, kan gives væk én gang og refunderes forholdsmæssigt. Dette er en demo — der trækkes intet.',

    /* --- Policy --- */
    'screensB.policy.title': 'Afbudsregler',
    'screensB.policy.sub':
      'Planer ændrer sig — det forstår vi. Sådan fungerer vores, i et klart sprog.',
    'screensB.policy.windowTitle': 'Et vindue på 24 timer',
    'screensB.policy.windowBody':
      'Aflys eller flyt indtil 24 timer før din starttid, uden gebyr, direkte fra Administrér booking.',
    'screensB.policy.lateTitle': 'Sene afbud og udeblivelse',
    'screensB.policy.lateBody':
      'Inden for 24 timer opkræves 50 %. Udeblivelse koster fuld pris, så stolen ikke står tom.',
    'screensB.policy.howTitle': 'Sådan aflyser du',
    'screensB.policy.howBody':
      'Gå til Administrér booking, indtast din kode og e-mail, og vælg Flyt eller Aflys — ingen telefonopkald nødvendigt.',
    'screensB.policy.membersTitle': 'Medlemmer og klippekort',
    'screensB.policy.membersBody':
      'Studio Circle-medlemmer får ét gebyrfrit sent afbud om måneden. Klip går simpelthen tilbage på din saldo.',
    'screensB.policy.banner':
      'Dette er demo-regler til illustration — der opkræves aldrig rigtige gebyrer.',

    /* --- Post --- */
    'screensB.post.back': 'Tilbage til journalen',
    'screensB.post.emptyTitle': 'Det indlæg er her ikke',
    'screensB.post.emptyBody':
      'Det er måske afpubliceret. Alt, vi har skrevet, står i journalens oversigt.',
    'screensB.post.browse': 'Se journalen',
    'screensB.post.byline': '{date} · {read}',
    'screensB.post.more': 'Mere fra journalen',

    /* --- Refer --- */
    'screensB.refer.title': 'Henvis en ven',
    'screensB.refer.sub':
      'Giv {amount}, få {amount}. Alle går strålende herfra.',
    'screensB.refer.yourCode': 'Din invitationskode',
    'screensB.refer.copyLink': 'Kopiér invitationslink',
    'screensB.refer.toastCopied': 'Invitationslink kopieret til udklipsholderen',
    'screensB.refer.yourInvites': 'Dine invitationer',

    /* --- Reviews --- */
    'screensB.reviews.justNow': 'lige nu',
    'screensB.reviews.total': '{reviews} anmeldelser · {specialists} specialister',
    'screensB.reviews.starRow': '{stars}★',
    'screensB.reviews.composeSent': 'Din anmeldelse er oppe',
    'screensB.reviews.composeTitle':
      'Har du været her for nylig? Fortæl, hvordan det gik',
    'screensB.reviews.thanks':
      'Tak — din anmeldelse ligger øverst på listen. Du kan rette den de næste 24 timer.',
    'screensB.reviews.starsAria': '{count} stjerne|{count} stjerner',
    'screensB.reviews.placeholder':
      'Hvordan var besøget? Er der noget, den næste gæst bør vide?',
    'screensB.reviews.textareaLabel': 'Din anmeldelse',
    'screensB.reviews.postingAs':
      'Skrives som {name} · dit seneste besøg var {date}',
    'screensB.reviews.post': 'Send anmeldelse',
    'screensB.reviews.errEmpty': 'Skriv et par linjer først',
    'screensB.reviews.toastPosted': 'Anmeldelse sendt · kun demo',
    'screensB.reviews.showing': '{shown} af {total} vist',
    'screensB.reviews.metaStaff': '{service} · hos {staff} · {date}',
    'screensB.reviews.metaStudio': '{service} · studiet · {date}',
    'screensB.reviews.replyBy': '{name} svarede',
    'screensB.reviews.helpful': 'Hjælpsom · {n}',
    'screensB.reviews.report': 'Anmeld',
    'screensB.reviews.toastFlagged': 'Markeret, så teamet læser den',

    /* --- Rewards --- */
    'screensB.rewards.srTitle': 'Loyalitetsbelønninger',
    'screensB.rewards.yourSpecialist': 'din specialist',
    'screensB.rewards.yourBalance': 'Din saldo',
    'screensB.rewards.progressLabel': 'Vej til din næste belønning på {amount}',
    'screensB.rewards.canRedeem':
      'Du kan indløse belønningen på {amount} nu.',
    'screensB.rewards.toGo':
      '{count} point til din næste belønning på {amount}|{count} point til din næste belønning på {amount}',
    'screensB.rewards.factEarned': 'Optjent i år',
    'screensB.rewards.factRedeemed': 'Indløst',
    'screensB.rewards.factTier': 'Niveau',
    'screensB.rewards.tierCircle': 'Circle',
    'screensB.rewards.tierGuest': 'Gæst',
    'screensB.rewards.spendTitle': 'Brug dine point',
    'screensB.rewards.redeemed': 'Indløst · på din konto',
    'screensB.rewards.redeem': 'Indløs',
    'screensB.rewards.pointsToGo': '{count} point mangler|{count} point mangler',
    'screensB.rewards.toastRedeemed': '{name} · lagt på din konto',
    'screensB.rewards.recentPoints': 'Seneste point',
    'screensB.rewards.howPointsWork': 'Sådan virker point',

    /* --- Services --- */
    'screensB.services.title': 'Ydelser',
    'screensB.services.sub':
      'Vælg det, du har lyst til. Hver booking bekræftes med det samme — specialist og tid vælger du bagefter.',
    'screensB.services.filterLabel': 'Filtrér efter kategori',

    /* --- Shop --- */
    'screensB.shop.title': 'Hylden',
    'screensB.shop.sub':
      'Alt det, vi faktisk bruger på dig, i de størrelser vi selv ville købe. Hent i studiet eller få det sendt.',
    'screensB.shop.removeOne': 'Fjern én {name}',
    'screensB.shop.addAnother': 'Tilføj én {name} mere',
    'screensB.shop.addToBag': 'Læg i kurven',
    'screensB.shop.toastAdded': '{name} lagt i kurven',
    'screensB.shop.yourBag': 'Din kurv',
    'screensB.shop.cartEmpty':
      'Intet i kurven endnu. Produkter kan også sættes på regningen for dit besøg, hvis du hellere vil betale i studiet.',
    'screensB.shop.lineQty': '{qty} × {price}',
    'screensB.shop.subtotal': 'Subtotal',
    'screensB.shop.checkout': 'Til betaling',
    'screensB.shop.ship': 'Gratis afhentning i studiet · forsendelse {amount}',

    /* --- SignIn --- */
    'screensB.signin.errEmail': 'Indtast en gyldig e-mailadresse.',
    'screensB.signin.toastCodeSent':
      'Kode sendt · vilkårlige seks cifre virker',
    'screensB.signin.errCode': 'Indtast alle seks cifre for at fortsætte.',
    'screensB.signin.toastSignedIn': 'Logget ind som {name}',
    'screensB.signin.welcome': 'Velkommen tilbage',
    'screensB.signin.lede':
      'Indtast din e-mail, så sender vi en sekscifret kode. Ingen adgangskode at glemme.',
    'screensB.signin.fieldEmail': 'E-mailadresse',
    'screensB.signin.remember': 'Hold mig logget ind på denne enhed',
    'screensB.signin.emailCode': 'Send mig en kode',
    'screensB.signin.or': 'eller',
    'screensB.signin.bookWithoutAccount': 'Book uden konto',
    'screensB.signin.foot':
      'Dette er et demo-login — enhver e-mail virker, og der sendes ingen rigtig kode.',
    'screensB.signin.differentEmail': 'Brug en anden e-mail',
    'screensB.signin.checkInbox': 'Tjek din indbakke',
    'screensB.signin.sentTo': 'Vi sendte en sekscifret kode til {email}',
    'screensB.signin.yourInbox': 'din indbakke',
    'screensB.signin.codeLabel': 'Sekscifret loginkode',
    'screensB.signin.verify': 'Bekræft og log ind',
    'screensB.signin.didntGet': 'Fik du den ikke?',
    'screensB.signin.resend': 'Send koden igen',
    'screensB.signin.toastNewCode': 'Ny kode er på vej',
    'screensB.signin.demoHint': 'Demo-tip: vilkårlige seks cifre er nok.',

    /* --- Staff --- */
    'screensB.staff.dirTitle': 'Menneskene i stolene',
    'screensB.staff.dirLede':
      'Fire specialister, hver med egne tider og egen måde at arbejde på. Vælg den, der passer dig — eller lad os matche dig.',
    'screensB.staff.nextFree': 'Næste ledige · {when}',
    'screensB.staff.viewProfile': 'Se profil',
    'screensB.staff.allSpecialists': 'Alle specialister',
    'screensB.staff.since': '{role} · i studiet siden {year}',
    'screensB.staff.knownFor': 'Kendt for',
    'screensB.staff.guestsSay': 'Hvad gæsterne siger',
    'screensB.staff.quoteMeta': '{service} · {date}',
    'screensB.staff.statRating': 'Gennemsnit',
    'screensB.staff.statReviews': 'Anmeldelser',
    'screensB.staff.statYears': 'I studiet',
    'screensB.staff.joinWaitlist': 'Kom på ventelisten',
    'screensB.staff.usualWeek': 'Almindelig uge',
    'screensB.staff.hourRange': '{from} – {to}',
    'screensB.staff.off': 'Fri',
    'screensB.staff.servicesOffered': 'Ydelser hos {name}',

    /* --- Visits --- */
    'screensB.visits.title': 'Mine kommende besøg',
    'screensB.visits.sub': 'Alt, du har booket hos os.',
    'screensB.visits.emptyTitle': 'Intet booket endnu',
    'screensB.visits.emptyBody':
      'Når du booker et besøg, dukker det op her med alle detaljer.',
    'screensB.visits.bookVisit': 'Book et besøg',
    'screensB.visits.appointment': 'Aftale',
    'screensB.visits.repeats':
      'Gentages {freq} · {count} besøg|Gentages {freq} · {count} besøg',
    'screensB.visits.manage': 'Flyt eller aflys',

    /* --- Waitlist --- */
    'screensB.waitlist.title': 'Venteliste',
    'screensB.waitlist.lede':
      'Der kommer afbud næsten hver dag. Fortæl os, hvad du er ude efter, så skriver vi, så snart noget bliver ledigt.',
    'screensB.waitlist.joinTitle': 'Kom på listen',
    'screensB.waitlist.groupService': 'Hvilken ydelse?',
    'screensB.waitlist.groupDays': 'Dage der passer',
    'screensB.waitlist.groupTime': 'Tidspunkt på dagen',
    'screensB.waitlist.groupNotify': 'Giv mig besked via',
    'screensB.waitlist.winMornings': 'Formiddage',
    'screensB.waitlist.winAfternoons': 'Eftermiddage',
    'screensB.waitlist.winEvenings': 'Aftener',
    'screensB.waitlist.notifyText': 'SMS',
    'screensB.waitlist.notifyEmail': 'E-mail',
    'screensB.waitlist.notifyPush': 'Push',
    'screensB.waitlist.oddsMany':
      'Med så mange åbne dage hører de fleste gæster fra os inden for 48 timer.',
    'screensB.waitlist.oddsSome':
      'To eller tre dage betyder typisk et par dages ventetid på denne tid af året.',
    'screensB.waitlist.oddsOne':
      'Kun én dag kan tage et par uger — tilføj en mere, hvis du kan.',
    'screensB.waitlist.addMe': 'Sæt mig på listen',
    'screensB.waitlist.errPickDay': 'Vælg mindst én dag, der passer',
    'screensB.waitlist.toastJoinedText':
      'Du er på listen · vi skriver på SMS',
    'screensB.waitlist.toastJoinedEmail':
      'Du er på listen · vi skriver på e-mail',
    'screensB.waitlist.toastJoinedPush':
      'Du er på listen · vi giver besked via push',
    'screensB.waitlist.waitingOn': 'Du venter på',
    'screensB.waitlist.emptyTitle': 'Ikke noget endnu',
    'screensB.waitlist.emptyBody':
      'Skriv dig på via formularen, så viser din plads i køen sig her.',
    'screensB.waitlist.toastWidened':
      'Vinduet er udvidet · vi kigger på flere dage',
    'screensB.waitlist.flexible': 'fleksibel',
    'screensB.waitlist.entryStaffDate': 'hos {staff} · {date}',
    'screensB.waitlist.entryAnyDate': 'enhver specialist · {date}',
    'screensB.waitlist.inLine': 'Nr. {pos} i køen',
    'screensB.waitlist.oddsNext':
      'Du er den næste — vi skriver, så snart der bliver ledigt.',
    'screensB.waitlist.oddsWait':
      'Cirka {count} dags ventetid på denne tid af året.|Cirka {count} dages ventetid på denne tid af året.',
    'screensB.waitlist.widen': 'Udvid mit vindue',

    /* --- WaitlistStatus --- */
    'screensB.wstatus.title': 'Ventelistestatus',
    'screensB.wstatus.sub':
      'De dage, du venter på — vi skriver, så snart der bliver en plads.',
    'screensB.wstatus.emptyTitle': 'Du står ikke på nogen venteliste',
    'screensB.wstatus.emptyBody':
      'Er en dag fuldt booket, så kom på dens venteliste i trinnet med dato og tid, så dukker den op her.',
    'screensB.wstatus.flexible': 'Fleksibel',
    'screensB.wstatus.whenWho': '{date} · {who}',
    'screensB.wstatus.waiting': 'Venter på en ledig plads',
  },
  'zh-CN': {
    /* --- shared inside this area --- */
    'screensB.common.all': '全部',
    'screensB.common.anyService': '任意服务',
    'screensB.common.backHome': '返回首页',
    'screensB.common.backToDashboard': '返回仪表板',
    'screensB.common.book': '预约',
    'screensB.common.bookNamed': '预约{name}',
    'screensB.common.bookWith': '预约 {name}',
    'screensB.common.cancel': '取消',
    'screensB.common.codeCopied': '已复制 {code}',
    'screensB.common.copyCode': '复制优惠码 {code}',
    'screensB.common.demoOnly': '{label} — 仅为演示',
    'screensB.common.email': '邮箱',
    'screensB.common.firstAvailable': '最早有空的人',
    'screensB.common.fullName': '姓名',
    'screensB.common.howItWorks': '规则说明',
    'screensB.common.leave': '退出',
    'screensB.common.optional': '（选填）',
    'screensB.common.phEmail': 'you@email.com',
    'screensB.common.phone': '电话',
    'screensB.common.pointsUnit': '积分',
    'screensB.common.ptsCount': '{count} 积分',
    'screensB.common.ptsUnit': '积分',
    'screensB.common.receipt': '收据',
    'screensB.common.reschedule': '改期',
    'screensB.common.seeAll': '查看全部',
    'screensB.common.time': '时间',
    'screensB.common.timeDur': '{time} · {duration}',
    'screensB.common.toastMaps': '正在打开地图 — 仅为演示',
    'screensB.common.total': '合计',
    'screensB.common.when': '日期',
    'screensB.common.with': '服务人员',

    /* --- Help --- */
    'screensB.help.title': '需要什么帮助？',
    'screensB.help.sub': '客人问得最多的问题，都在这里。',
    'screensB.help.searchPlaceholder': '搜索帮助文章…',
    'screensB.help.searchLabel': '搜索帮助文章',
    'screensB.help.results': '“{query}”的 {count} 条解答',
    'screensB.help.common': '常见问题',
    'screensB.help.emptyTitle': '没有匹配结果',
    'screensB.help.emptyBody':
      '试试更短的关键词，或者发短信给我们 — 上午 9 点到下午 6 点有真人回复。',
    'screensB.help.stuckTitle': '还是没解决？',
    'screensB.help.stuckBody': '我们的取消政策用大白话回答了大部分预约问题。',
    'screensB.help.readPolicy': '阅读政策',

    /* --- Home --- */
    'screensB.home.eyebrow': '精品美容与养护',
    'screensB.home.title': '遇见状态最好的自己。',
    'screensB.home.lede':
      '美发、水疗、美甲与身体训练，都在一个安静的空间里。轻点几下就能预约座位或理疗室 — 不用来回打电话，也不用注册账号。',
    'screensB.home.bookNow': '立即预约',
    'screensB.home.viewServices': '查看服务',
    'screensB.home.trustOpenings': '本周即可到店',
    'screensB.home.trustDowntown': '市中心工作室',
    'screensB.home.trustWalkins': '欢迎随到随做',
    'screensB.home.popularTitle': '热门服务',
    'screensB.home.popularSub': '工作室每个角落的招牌项目。',
    'screensB.home.teamTitle': '认识团队',
    'screensB.home.teamSub': '四位专家，一份井井有条的日程。',
    'screensB.home.lovedTitle': '常客的最爱',
    'screensB.home.lovedSub': '客人回到日常之后说的话。',
    'screensB.home.ratingFrom': '来自 {count} 条评价',
    'screensB.home.hoursTitle': '每周营业时间',
    'screensB.home.hoursNote':
      '每位专家有各自的工作时间 — 预约时会显示实时空档。',

    /* --- Intake --- */
    'screensB.intake.doneTitle': '问诊表已保存',
    'screensB.intake.doneBody':
      '谢谢 — 专家会在您到店前查看。这是演示，不会真正保存任何内容。',
    'screensB.intake.editAnswers': '修改答案',
    'screensB.intake.title': '电子问诊表',
    'screensB.intake.sub': '几个小问题，方便专家为您调整流程。约需一分钟。',
    'screensB.intake.concernsLegend': '以下哪些情况符合您？',
    'screensB.intake.allergiesLabel': '过敏或敏感情况',
    'screensB.intake.allergiesPlaceholder': '香精、乳胶、特定产品…',
    'screensB.intake.pressureLabel': '偏好的力度／强度',
    'screensB.intake.consent':
      '我确认以上信息属实，并同意接受服务。我知道在到店前随时可以修改。',
    'screensB.intake.submit': '保存问诊表',

    /* --- Join --- */
    'screensB.join.cycleMonthly': '按月',
    'screensB.join.cycleAnnual': '按年 · 免 2 个月',
    'screensB.join.startToday': '今天开始',
    'screensB.join.startFirst': '从 1 号开始',
    'screensB.join.title': '加入 Circle',
    'screensB.join.sub':
      '每月一次护理，其余全部九折，取消的空位优先给您。随时退出 — 没有通知期。',
    'screensB.join.billingCycle': '计费周期',
    'screensB.join.mostJoined': '最多人选择',
    'screensB.join.perYear': '/年',
    'screensB.join.perMonth': '/月',
    'screensB.join.selected': '已选择 · 继续',
    'screensB.join.choose': '选择{name}',
    'screensB.join.note':
      '每月来一次就能回本。当月未用的护理可顺延一次。演示注册 — 不会扣任何卡。',
    'screensB.join.otherPlans': '其他方案',
    'screensB.join.payTitle': '确认会籍',
    'screensB.join.yourDetails': '您的资料',
    'screensB.join.mobile': '手机',
    'screensB.join.starts': '起始',
    'screensB.join.lineAnnual': '{name} · 12 个月',
    'screensB.join.lineFirstMonth': '{name} · 首月',
    'screensB.join.startsToday': '今天生效',
    'screensB.join.prorata': '按比例抵扣',
    'screensB.join.joiningFee': '入会费',
    'screensB.join.waived': '已免除',
    'screensB.join.errEmail': '请填写邮箱，我们才能把会员卡发给您',
    'screensB.join.welcome': '欢迎加入 Circle',
    'screensB.join.summaryAnnual': '{name} · 年付',
    'screensB.join.summaryMonthly': '{name} · 月付',
    'screensB.join.dueToday': '今日应付',
    'screensB.join.startMembership': '开通会籍',
    'screensB.join.fine': '随时可在账户中退出。仅为演示 — 不会实际扣款。',
    'screensB.join.doneTitle': '您已加入 Circle',
    'screensB.join.doneSub':
      '首次护理额度已存入您的账户，从现在起每次预约都会自动打九折。',
    'screensB.join.rowPlan': '方案',
    'screensB.join.rowBilling': '计费',
    'screensB.join.billingAnnually': '年付 · {amount}',
    'screensB.join.billingMonthly': '月付 · {amount}',
    'screensB.join.rowMemberNo': '会员编号',
    'screensB.join.seeRewards': '查看奖励',
    'screensB.join.useCredit': '使用额度',

    /* --- LoyaltyHistory --- */
    'screensB.lhistory.title': '积分记录',
    'screensB.lhistory.sub': '您在 Studio Circle 获得和使用过的每一分。',
    'screensB.lhistory.currentBalance': '当前余额',
    'screensB.lhistory.redeemRewards': '兑换奖励',

    /* --- Location --- */
    'screensB.location.title': '找到我们',
    'screensB.location.lede':
      '位于 Alder Lane 面包店楼上两层。若临街门关着，请按写着 Studio 的门铃。',
    'screensB.location.rowAddress': '地址',
    'screensB.location.rowGettingIn': '进门方式',
    'screensB.location.addressValue': '{line1}，{line2}',
    'screensB.location.getDirections': '获取路线',
    'screensB.location.callStudio': '致电工作室',
    'screensB.location.toastDial': '正在拨打 {phone} — 仅为演示',
    'screensB.location.openingHours': '营业时间',
    'screensB.location.openToday': '今日营业',
    'screensB.location.closedToday': '今日休息',
    'screensB.location.beforeYouArrive': '到店前须知',

    /* --- Loyalty --- */
    'screensB.loyalty.h1': '每次到店，都多一点光彩。',
    'screensB.loyalty.sub':
      '每消费一美元得一分，兑换您喜欢的服务，成为会员还能解锁更多。加入免费。',
    'screensB.loyalty.yourPoints': '您的积分',
    'screensB.loyalty.member': '会员',
    'screensB.loyalty.progressLabel': '距离下一次免费服务的进度',
    'screensB.loyalty.unlocked': '您已解锁一次免费服务 — 在下方兑换。',
    'screensB.loyalty.toGo': '再得 {count} 积分即可享受下一次免费服务',
    'screensB.loyalty.redeemTitle': '兑换积分',
    'screensB.loyalty.locked': '未解锁',
    'screensB.loyalty.redeem': '兑换',
    'screensB.loyalty.becomeMember': '成为会员',
    'screensB.loyalty.becomeSub': '加入 Studio Circle 会籍，享受更多 — 随时可退。',
    'screensB.loyalty.mostLoved': '最受欢迎',
    'screensB.loyalty.youreMember': '您已是会员 ✓',
    'screensB.loyalty.joinPlan': '加入{name}',

    /* --- Manage --- */
    'screensB.manage.title': '管理预约',
    'screensB.manage.sub': '用预约码和邮箱改期或取消预约。',
    'screensB.manage.fieldCode': '预约码',
    'screensB.manage.fieldEmail': '预约所用邮箱',
    'screensB.manage.find': '查找我的预约',
    'screensB.manage.tip': '演示提示：字段已预填一条现有预约 — 直接点查找即可。',
    'screensB.manage.withRole': '{name} · {role}',
    'screensB.manage.cancelled': '已取消',
    'screensB.manage.confirmed': '已确认',
    'screensB.manage.cancelledNote': '这次预约已取消。随时欢迎再次预约。',
    'screensB.manage.findAnother': '查找其他预约',

    /* --- Mobile --- */
    'screensB.mobile.deviceIphone': 'iPhone',
    'screensB.mobile.deviceAndroid': 'Android 手机',
    'screensB.mobile.deviceFrame': '设备外框',
    'screensB.mobile.eyebrow': '随行应用',
    'screensB.mobile.h1': '把 {brand} 装进口袋',
    'screensB.mobile.sub':
      '手机应用有自己的设计，不是把网页压小 — 五个标签页、为拇指打造的预约流程，积分就在首页。下面展示的是这套设计而非已上架的应用，但它不是截图：请动手点点看。',
    'screensB.mobile.switchNote':
      '这里切换的是手机，不是应用。Android 版本有自己的 Material 设计 — 导航栏不同、顶部间距更紧 — 那是另一份稿件，这里不展示。',
    'screensB.mobile.yourProfile': '您的资料',
    'screensB.mobile.appTabs': '应用标签页',
    'screensB.mobile.greetMorning': '早上好，{name}',
    'screensB.mobile.greetAfternoon': '下午好，{name}',
    'screensB.mobile.greetEvening': '晚上好，{name}',
    'screensB.mobile.toastPickTime': '请先选择时间',
    'screensB.mobile.toastBooked': '预约已确认',
    'screensB.mobile.toastPickNewTime': '请选择新的时间',
    'screensB.mobile.ctaConfirm': '确认 · {time}',
    'screensB.mobile.ctaPickTime': '选择时间后继续',
    'screensB.mobile.note':
      '这是设计展示，不是正在运行的应用 — 您在这里点的任何内容都不会影响账户。标签页、预约流程和优惠码都是活的，让设计可以被感受；原本通往更深层页面的条目（团队、货架、礼品卡）改为提示，这些流程在网页版有完整实现。手机本身是重建的：稿件引用的设备外框从未随稿交付。',
    'screensB.mobile.nextVisit': '下次到店',
    'screensB.mobile.manage': '管理',
    'screensB.mobile.directions': '路线',
    'screensB.mobile.bookAgain': '再次预约',
    'screensB.mobile.durPrice': '{duration} · {price}',
    'screensB.mobile.durStaff': '{duration} · {staff}',
    'screensB.mobile.durWithStaff': '{duration} · 由 {staff} 服务',
    'screensB.mobile.pointsGoal': '再得 {count} 积分即可兑换 {reward}',
    'screensB.mobile.pointsReady': '您的 {reward} 已可兑换',
    'screensB.mobile.toastJournal': '正在打开日志 — 仅为演示',
    'screensB.mobile.allServices': '全部服务',
    'screensB.mobile.pickDay': '选择日期',
    'screensB.mobile.pickTime': '选择时间',
    'screensB.mobile.toastTaken': '该时段已被预订',
    'screensB.mobile.upcoming': '即将到来',
    'screensB.mobile.past': '过往',
    'screensB.mobile.dateTime': '{date} · {time}',
    'screensB.mobile.whenWho': '{when} · {who}',
    'screensB.mobile.toastCancelled': '已取消 — 仅为演示',
    'screensB.mobile.toastReceipt': '收据已发送至邮箱',
    'screensB.mobile.circle': 'Circle',
    'screensB.mobile.statPoints': '积分',
    'screensB.mobile.preferences': '偏好设置',
    'screensB.mobile.account': '账户',
    'screensB.mobile.pushNotifications': '推送通知',
    'screensB.mobile.darkAppearance': '深色外观',
    'screensB.mobile.toastPushOn': '推送已开启',
    'screensB.mobile.toastPushOff': '推送已关闭',
    'screensB.mobile.signOut': '退出登录',
    'screensB.mobile.toastSignedOut': '已退出登录 — 仅为演示',
    'screensB.mobile.version': '{brand} · {version}',
    'screensB.mobile.booked': '预约成功',
    'screensB.mobile.sheetSub': '已为您安排 {service}，由 {staff} 服务。',
    'screensB.mobile.firstSpecialistFree': '最早有空的专家',
    'screensB.mobile.seeMyVisits': '查看我的预约',

    /* --- MyGifts --- */
    'screensB.mygifts.title': '已购礼品卡',
    'screensB.mygifts.sub': '您购买并送出的礼品卡。',
    'screensB.mygifts.buy': '购买礼品卡',
    'screensB.mygifts.emptyTitle': '还没有礼品卡',
    'screensB.mygifts.emptyBody': '送出一点安宁 — 购买的卡片会显示在这里。',
    'screensB.mygifts.to': '赠予 {name} · {date}',
    'screensB.mygifts.sent': '已送出',
    'screensB.mygifts.redeemed': '已兑换',

    /* --- NotFound --- */
    'screensB.notfound.h1': '这个页面今天休假了。',
    'screensB.notfound.body':
      '我们没找到您要的内容 — 不过首页永远备着新造型和一点安宁。',

    /* --- NotifPrefs --- */
    'screensB.notifprefs.title': '通知偏好',
    'screensB.notifprefs.sub': '选择哪些消息发给您，以及用什么方式。改动即时保存。',
    'screensB.notifprefs.channels': '渠道',
    'screensB.notifprefs.whatWeSend': '发送内容',
    'screensB.notifprefs.timing': '时间安排',
    'screensB.notifprefs.remindMe': '提醒我',
    'screensB.notifprefs.remindSub': '到店前多久联系您。',
    'screensB.notifprefs.reminderTiming': '提醒时间',
    'screensB.notifprefs.quietHours': '免打扰时段',
    'screensB.notifprefs.quietSub': '非紧急消息一律留到早上。',
    'screensB.notifprefs.quietWindow': '免打扰区间',
    'screensB.notifprefs.pauseTitle': '暂停全部',
    'screensB.notifprefs.pauseBody': '关闭所有渠道。预约确认仍会通过邮件发送。',
    'screensB.notifprefs.pauseAll': '全部暂停',
    'screensB.notifprefs.toastPaused': '已暂停所有通知',

    /* --- Offers --- */
    'screensB.offers.eyebrow': '2026 年秋季',
    'screensB.offers.h1': '当季优惠',
    'screensB.offers.sub':
      '这一季值得预约的几件事。复制优惠码，结账时自动生效 — 每次到店限用一个。',
    'screensB.offers.ends': '{date} 截止',
    'screensB.offers.bookPairing': '预约组合',
    'screensB.offers.toastCopied': '已复制 {code} 到剪贴板',
    'screensB.offers.note':
      '每次到店限用一个优惠，不可与套餐次数或礼品卡充值叠加。会员的 9 折始终另计。演示优惠码 — 不会真正打折。',

    /* --- Orders --- */
    'screensB.orders.title': '订单记录',
    'screensB.orders.sub': '您付过款的每次到店、每份套餐和每张礼品卡。',
    'screensB.orders.spent': '2026 年消费',
    'screensB.orders.emptyTitle': '此筛选下没有内容',
    'screensB.orders.emptyBody': '换个类别试试 — 其他订单都还在。',
    'screensB.orders.toastReceipt': '收据 {code} 已发送至 {email}',

    /* --- Packages --- */
    'screensB.packages.subject': '{qty} × {name}',
    'screensB.packages.studioServices': '工作室服务',
    'screensB.packages.expires': '{date} 到期',
    'screensB.packages.eyebrow': '预付套餐',
    'screensB.packages.h1': '套餐优惠',
    'screensB.packages.sub':
      '一次买多次到店，单次更便宜。次数会留在账户里，直到您预约 — 没有月费，也没有到期套路。',
    'screensB.packages.yourPackages': '我的套餐',
    'screensB.packages.left': '剩余',
    'screensB.packages.sessionsUsed': '{name} 已使用次数',
    'screensB.packages.usedOf': '已用 {used}／{total}',
    'screensB.packages.bookSession': '预约一次',
    'screensB.packages.available': '可购套餐',
    'screensB.packages.mostPopular': '最受欢迎',
    'screensB.packages.save': '省 {amount}',
    'screensB.packages.perSession': '{amount} / 次',
    'screensB.packages.inAccount': '已在账户中',
    'screensB.packages.buy': '购买套餐',
    'screensB.packages.toastAlready': '{name} 已在您的账户中',
    'screensB.packages.toastAdded': '已添加{name} — 仅为演示，不会扣款',
    'screensB.packages.note':
      '次数有效期 12 个月，可转赠一次，并按比例退款。这是演示 — 不会实际扣款。',

    /* --- Policy --- */
    'screensB.policy.title': '取消政策',
    'screensB.policy.sub': '计划会变 — 我们理解。以下是我们的规则，说得明明白白。',
    'screensB.policy.windowTitle': '24 小时窗口',
    'screensB.policy.windowBody':
      '开始时间前 24 小时内可免费取消或改期，直接在“管理预约”里操作。',
    'screensB.policy.lateTitle': '临时取消与爽约',
    'screensB.policy.lateBody':
      '24 小时以内取消收取 50% 费用。爽约按全额收费，以免座位空着。',
    'screensB.policy.howTitle': '如何取消',
    'screensB.policy.howBody':
      '进入“管理预约”，输入预约码和邮箱，选择改期或取消 — 无需打电话。',
    'screensB.policy.membersTitle': '会员与套餐',
    'screensB.policy.membersBody':
      'Studio Circle 会员每月可免费临时取消一次。套餐次数会直接退回您的余额。',
    'screensB.policy.banner': '这是用于演示的示例政策 — 从不会真正收取任何费用。',

    /* --- Post --- */
    'screensB.post.back': '返回日志',
    'screensB.post.emptyTitle': '找不到这篇文章',
    'screensB.post.emptyBody': '它可能已下架。我们写过的内容都在日志目录里。',
    'screensB.post.browse': '浏览日志',
    'screensB.post.byline': '{date} · {read}',
    'screensB.post.more': '更多日志文章',

    /* --- Refer --- */
    'screensB.refer.title': '推荐好友',
    'screensB.refer.sub': '送 {amount}，得 {amount}。人人容光焕发地离开。',
    'screensB.refer.yourCode': '您的邀请码',
    'screensB.refer.copyLink': '复制邀请链接',
    'screensB.refer.toastCopied': '已复制邀请链接到剪贴板',
    'screensB.refer.yourInvites': '您的邀请',

    /* --- Reviews --- */
    'screensB.reviews.justNow': '刚刚',
    'screensB.reviews.total': '{reviews} 条评价 · {specialists} 位专家',
    'screensB.reviews.starRow': '{stars}★',
    'screensB.reviews.composeSent': '您的评价已发布',
    'screensB.reviews.composeTitle': '最近来过？说说体验如何',
    'screensB.reviews.thanks':
      '谢谢 — 您的评价已置顶显示。24 小时内还可以修改。',
    'screensB.reviews.starsAria': '{count} 星',
    'screensB.reviews.placeholder': '这次体验怎么样？有什么想告诉下一位客人的？',
    'screensB.reviews.textareaLabel': '您的评价',
    'screensB.reviews.postingAs': '以 {name} 的身份发布 · 您上次到店是 {date}',
    'screensB.reviews.post': '发布评价',
    'screensB.reviews.errEmpty': '请先写上一两句',
    'screensB.reviews.toastPosted': '评价已发布 · 仅为演示',
    'screensB.reviews.showing': '显示 {shown}／{total}',
    'screensB.reviews.metaStaff': '{service} · 由 {staff} 服务 · {date}',
    'screensB.reviews.metaStudio': '{service} · 工作室 · {date}',
    'screensB.reviews.replyBy': '{name} 已回复',
    'screensB.reviews.helpful': '有用 · {n}',
    'screensB.reviews.report': '举报',
    'screensB.reviews.toastFlagged': '已标记，团队会查看',

    /* --- Rewards --- */
    'screensB.rewards.srTitle': '会员奖励',
    'screensB.rewards.yourSpecialist': '您的专家',
    'screensB.rewards.yourBalance': '您的余额',
    'screensB.rewards.progressLabel': '距离下一份 {amount} 奖励的进度',
    'screensB.rewards.canRedeem': '您现在可以兑换 {amount} 奖励了。',
    'screensB.rewards.toGo': '再得 {count} 积分即可兑换下一份 {amount} 奖励',
    'screensB.rewards.factEarned': '今年获得',
    'screensB.rewards.factRedeemed': '已兑换',
    'screensB.rewards.factTier': '等级',
    'screensB.rewards.tierCircle': 'Circle',
    'screensB.rewards.tierGuest': '访客',
    'screensB.rewards.spendTitle': '使用积分',
    'screensB.rewards.redeemed': '已兑换 · 存入账户',
    'screensB.rewards.redeem': '兑换',
    'screensB.rewards.pointsToGo': '还差 {count} 积分',
    'screensB.rewards.toastRedeemed': '{name} · 已存入您的账户',
    'screensB.rewards.recentPoints': '最近积分',
    'screensB.rewards.howPointsWork': '积分怎么算',

    /* --- Services --- */
    'screensB.services.title': '服务',
    'screensB.services.sub':
      '挑一个您此刻想做的。每次预约都会即时确认 — 接下来再选专家和时间。',
    'screensB.services.filterLabel': '按类别筛选',

    /* --- Shop --- */
    'screensB.shop.title': '货架',
    'screensB.shop.sub':
      '我们真正用在您身上的产品，规格也是我们自己会买的。到店自取或寄送到家。',
    'screensB.shop.removeOne': '减少一件{name}',
    'screensB.shop.addAnother': '增加一件{name}',
    'screensB.shop.addToBag': '加入购物袋',
    'screensB.shop.toastAdded': '已把{name}加入购物袋',
    'screensB.shop.yourBag': '您的购物袋',
    'screensB.shop.cartEmpty':
      '购物袋还是空的。如果您更想到店付款，产品也可以算进本次到店的账单。',
    'screensB.shop.lineQty': '{qty} × {price}',
    'screensB.shop.subtotal': '小计',
    'screensB.shop.checkout': '去结算',
    'screensB.shop.ship': '到店自取免费 · 寄送 {amount}',

    /* --- SignIn --- */
    'screensB.signin.errEmail': '请输入有效的邮箱地址。',
    'screensB.signin.toastCodeSent': '验证码已发送 · 任意六位数字都可以',
    'screensB.signin.errCode': '请输入全部六位数字后继续。',
    'screensB.signin.toastSignedIn': '已以 {name} 的身份登录',
    'screensB.signin.welcome': '欢迎回来',
    'screensB.signin.lede': '输入邮箱，我们会发送六位验证码。没有密码需要记。',
    'screensB.signin.fieldEmail': '邮箱地址',
    'screensB.signin.remember': '在此设备上保持登录',
    'screensB.signin.emailCode': '给我发送验证码',
    'screensB.signin.or': '或',
    'screensB.signin.bookWithoutAccount': '不注册直接预约',
    'screensB.signin.foot': '这是演示登录 — 任意邮箱都可以，也不会真正发送验证码。',
    'screensB.signin.differentEmail': '换一个邮箱',
    'screensB.signin.checkInbox': '请查收邮件',
    'screensB.signin.sentTo': '我们已把六位验证码发送到 {email}',
    'screensB.signin.yourInbox': '您的邮箱',
    'screensB.signin.codeLabel': '六位登录验证码',
    'screensB.signin.verify': '验证并登录',
    'screensB.signin.didntGet': '没收到？',
    'screensB.signin.resend': '重新发送',
    'screensB.signin.toastNewCode': '新验证码正在路上',
    'screensB.signin.demoHint': '演示提示：任意六位数字即可。',

    /* --- Staff --- */
    'screensB.staff.dirTitle': '座位后的人',
    'screensB.staff.dirLede':
      '四位专家，各有各的时间和手法。挑一位合您心意的 — 也可以让我们帮您搭配。',
    'screensB.staff.nextFree': '最近空档 · {when}',
    'screensB.staff.viewProfile': '查看资料',
    'screensB.staff.allSpecialists': '全部专家',
    'screensB.staff.since': '{role} · {year} 年加入工作室',
    'screensB.staff.knownFor': '擅长',
    'screensB.staff.guestsSay': '客人怎么说',
    'screensB.staff.quoteMeta': '{service} · {date}',
    'screensB.staff.statRating': '平均评分',
    'screensB.staff.statReviews': '评价',
    'screensB.staff.statYears': '在店年数',
    'screensB.staff.joinWaitlist': '加入其候补名单',
    'screensB.staff.usualWeek': '常规一周',
    'screensB.staff.hourRange': '{from} – {to}',
    'screensB.staff.off': '休息',
    'screensB.staff.servicesOffered': '{name} 提供的服务',

    /* --- Visits --- */
    'screensB.visits.title': '我的近期预约',
    'screensB.visits.sub': '您在我们这里预约的全部内容。',
    'screensB.visits.emptyTitle': '还没有预约',
    'screensB.visits.emptyBody': '预约之后，详细信息会显示在这里。',
    'screensB.visits.bookVisit': '预约到店',
    'screensB.visits.appointment': '预约',
    'screensB.visits.repeats': '每{freq}重复 · 共 {count} 次',
    'screensB.visits.manage': '改期或取消',

    /* --- Waitlist --- */
    'screensB.waitlist.title': '候补名单',
    'screensB.waitlist.lede':
      '几乎每天都有人取消。告诉我们您想要什么，一有空位我们就发短信给您。',
    'screensB.waitlist.joinTitle': '加入名单',
    'screensB.waitlist.groupService': '哪项服务？',
    'screensB.waitlist.groupDays': '方便的日子',
    'screensB.waitlist.groupTime': '时段',
    'screensB.waitlist.groupNotify': '通知方式',
    'screensB.waitlist.winMornings': '上午',
    'screensB.waitlist.winAfternoons': '下午',
    'screensB.waitlist.winEvenings': '晚上',
    'screensB.waitlist.notifyText': '短信',
    'screensB.waitlist.notifyEmail': '邮箱',
    'screensB.waitlist.notifyPush': '推送',
    'screensB.waitlist.oddsMany': '可选日子这么多，大多数客人 48 小时内就会收到消息。',
    'screensB.waitlist.oddsSome': '选两三天的话，这个季节通常要等几天。',
    'screensB.waitlist.oddsOne': '只选一天可能要等上两三周 — 可以的话再加一天。',
    'screensB.waitlist.addMe': '把我加入名单',
    'screensB.waitlist.errPickDay': '请至少选择一个方便的日子',
    'screensB.waitlist.toastJoinedText': '已加入名单 · 我们会发短信联系您',
    'screensB.waitlist.toastJoinedEmail': '已加入名单 · 我们会发邮件联系您',
    'screensB.waitlist.toastJoinedPush': '已加入名单 · 我们会推送通知您',
    'screensB.waitlist.waitingOn': '您正在等待',
    'screensB.waitlist.emptyTitle': '暂时还没有',
    'screensB.waitlist.emptyBody': '在表单里登记，您的排队位置就会显示在这里。',
    'screensB.waitlist.toastWidened': '时段已放宽 · 我们会看更多日子',
    'screensB.waitlist.flexible': '不限',
    'screensB.waitlist.entryStaffDate': '由 {staff} 服务 · {date}',
    'screensB.waitlist.entryAnyDate': '不限专家 · {date}',
    'screensB.waitlist.inLine': '排队第 {pos} 位',
    'screensB.waitlist.oddsNext': '下一个就是您 — 一有空位我们马上发短信。',
    'screensB.waitlist.oddsWait': '这个季节大约要等 {count} 天。',
    'screensB.waitlist.widen': '放宽我的时段',

    /* --- WaitlistStatus --- */
    'screensB.wstatus.title': '候补状态',
    'screensB.wstatus.sub': '您正在等待的日子 — 一有空位我们马上发短信。',
    'screensB.wstatus.emptyTitle': '您还没有加入任何候补名单',
    'screensB.wstatus.emptyBody':
      '如果某天已约满，可在“日期与时间”步骤加入该日的候补名单，之后会显示在这里。',
    'screensB.wstatus.flexible': '不限',
    'screensB.wstatus.whenWho': '{date} · {who}',
    'screensB.wstatus.waiting': '正在等待空位',
  },
  'zh-TW': {
    /* --- shared inside this area --- */
    'screensB.common.all': '全部',
    'screensB.common.anyService': '任一項服務',
    'screensB.common.backHome': '回到首頁',
    'screensB.common.backToDashboard': '回到儀表板',
    'screensB.common.book': '預約',
    'screensB.common.bookNamed': '預約{name}',
    'screensB.common.bookWith': '預約 {name}',
    'screensB.common.cancel': '取消',
    'screensB.common.codeCopied': '已複製 {code}',
    'screensB.common.copyCode': '複製優惠碼 {code}',
    'screensB.common.demoOnly': '{label} — 僅為示範',
    'screensB.common.email': '電子郵件',
    'screensB.common.firstAvailable': '最快有空的人',
    'screensB.common.fullName': '姓名',
    'screensB.common.howItWorks': '規則說明',
    'screensB.common.leave': '離開',
    'screensB.common.optional': '（選填）',
    'screensB.common.phEmail': 'you@email.com',
    'screensB.common.phone': '電話',
    'screensB.common.pointsUnit': '點數',
    'screensB.common.ptsCount': '{count} 點',
    'screensB.common.ptsUnit': '點',
    'screensB.common.receipt': '收據',
    'screensB.common.reschedule': '改期',
    'screensB.common.seeAll': '查看全部',
    'screensB.common.time': '時間',
    'screensB.common.timeDur': '{time} · {duration}',
    'screensB.common.toastMaps': '正在開啟地圖 — 僅為示範',
    'screensB.common.total': '合計',
    'screensB.common.when': '日期',
    'screensB.common.with': '服務人員',

    /* --- Help --- */
    'screensB.help.title': '需要什麼協助？',
    'screensB.help.sub': '客人最常問的問題，答案都在這裡。',
    'screensB.help.searchPlaceholder': '搜尋說明文章…',
    'screensB.help.searchLabel': '搜尋說明文章',
    'screensB.help.results': '「{query}」的 {count} 則解答',
    'screensB.help.common': '常見問題',
    'screensB.help.emptyTitle': '沒有符合的結果',
    'screensB.help.emptyBody':
      '試試更短的關鍵字，或傳訊息給我們 — 上午 9 點到下午 6 點有真人回覆。',
    'screensB.help.stuckTitle': '還是沒解決？',
    'screensB.help.stuckBody': '我們的取消條款用白話回答了大部分預約問題。',
    'screensB.help.readPolicy': '閱讀條款',

    /* --- Home --- */
    'screensB.home.eyebrow': '精品美容與養生',
    'screensB.home.title': '遇見狀態最好的自己。',
    'screensB.home.lede':
      '美髮、水療、美甲與身體訓練，都在同一個安靜的空間。輕點幾下就能預約座位或療程室 — 不必來回打電話，也不必註冊帳號。',
    'screensB.home.bookNow': '立即預約',
    'screensB.home.viewServices': '查看服務',
    'screensB.home.trustOpenings': '本週就有空檔',
    'screensB.home.trustDowntown': '市中心工作室',
    'screensB.home.trustWalkins': '歡迎現場候位',
    'screensB.home.popularTitle': '熱門服務',
    'screensB.home.popularSub': '工作室每個角落的招牌項目。',
    'screensB.home.teamTitle': '認識團隊',
    'screensB.home.teamSub': '四位專員，一份整齊的行事曆。',
    'screensB.home.lovedTitle': '常客的最愛',
    'screensB.home.lovedSub': '客人回到日常之後說的話。',
    'screensB.home.ratingFrom': '來自 {count} 則評價',
    'screensB.home.hoursTitle': '每週營業時間',
    'screensB.home.hoursNote':
      '每位專員有各自的工作時間 — 預約時會顯示即時空檔。',

    /* --- Intake --- */
    'screensB.intake.doneTitle': '諮詢表已儲存',
    'screensB.intake.doneBody':
      '謝謝 — 專員會在您到店前先看過。這是示範，不會真的儲存任何內容。',
    'screensB.intake.editAnswers': '修改答案',
    'screensB.intake.title': '數位諮詢表',
    'screensB.intake.sub': '幾個小問題，讓專員為您調整流程。大約一分鐘。',
    'screensB.intake.concernsLegend': '以下哪些狀況符合您？',
    'screensB.intake.allergiesLabel': '過敏或敏感狀況',
    'screensB.intake.allergiesPlaceholder': '香精、乳膠、特定產品…',
    'screensB.intake.pressureLabel': '偏好的力道／強度',
    'screensB.intake.consent':
      '我確認以上資料屬實，並同意接受服務。我知道在到店前隨時可以修改。',
    'screensB.intake.submit': '儲存諮詢表',

    /* --- Join --- */
    'screensB.join.cycleMonthly': '按月',
    'screensB.join.cycleAnnual': '按年 · 免 2 個月',
    'screensB.join.startToday': '今天開始',
    'screensB.join.startFirst': '從 1 號開始',
    'screensB.join.title': '加入 Circle',
    'screensB.join.sub':
      '每月一次療程，其餘一律九折，取消的空位優先保留給您。隨時可退 — 沒有通知期。',
    'screensB.join.billingCycle': '計費週期',
    'screensB.join.mostJoined': '最多人選擇',
    'screensB.join.perYear': '/年',
    'screensB.join.perMonth': '/月',
    'screensB.join.selected': '已選擇 · 繼續',
    'screensB.join.choose': '選擇{name}',
    'screensB.join.note':
      '每月來一次就回本。當月未用的療程可順延一次。示範註冊 — 不會扣任何卡。',
    'screensB.join.otherPlans': '其他方案',
    'screensB.join.payTitle': '確認會籍',
    'screensB.join.yourDetails': '您的資料',
    'screensB.join.mobile': '行動電話',
    'screensB.join.starts': '起始',
    'screensB.join.lineAnnual': '{name} · 12 個月',
    'screensB.join.lineFirstMonth': '{name} · 首月',
    'screensB.join.startsToday': '今天生效',
    'screensB.join.prorata': '按比例折抵',
    'screensB.join.joiningFee': '入會費',
    'screensB.join.waived': '已免除',
    'screensB.join.errEmail': '請填寫電子郵件，我們才能把會員卡寄給您',
    'screensB.join.welcome': '歡迎加入 Circle',
    'screensB.join.summaryAnnual': '{name} · 年繳',
    'screensB.join.summaryMonthly': '{name} · 月繳',
    'screensB.join.dueToday': '今日應付',
    'screensB.join.startMembership': '開通會籍',
    'screensB.join.fine': '隨時可在帳戶中退出。僅為示範 — 不會實際扣款。',
    'screensB.join.doneTitle': '您已加入 Circle',
    'screensB.join.doneSub':
      '首次療程額度已存入您的帳戶，從現在起每次預約都會自動打九折。',
    'screensB.join.rowPlan': '方案',
    'screensB.join.rowBilling': '計費',
    'screensB.join.billingAnnually': '年繳 · {amount}',
    'screensB.join.billingMonthly': '月繳 · {amount}',
    'screensB.join.rowMemberNo': '會員編號',
    'screensB.join.seeRewards': '查看獎勵',
    'screensB.join.useCredit': '使用額度',

    /* --- LoyaltyHistory --- */
    'screensB.lhistory.title': '點數紀錄',
    'screensB.lhistory.sub': '您在 Studio Circle 累積與使用過的每一點。',
    'screensB.lhistory.currentBalance': '目前餘額',
    'screensB.lhistory.redeemRewards': '兌換獎勵',

    /* --- Location --- */
    'screensB.location.title': '找到我們',
    'screensB.location.lede':
      '位於 Alder Lane 麵包店樓上兩層。若臨街大門關著，請按標示 Studio 的門鈴。',
    'screensB.location.rowAddress': '地址',
    'screensB.location.rowGettingIn': '入口',
    'screensB.location.addressValue': '{line1}，{line2}',
    'screensB.location.getDirections': '取得路線',
    'screensB.location.callStudio': '致電工作室',
    'screensB.location.toastDial': '正在撥打 {phone} — 僅為示範',
    'screensB.location.openingHours': '營業時間',
    'screensB.location.openToday': '今日營業',
    'screensB.location.closedToday': '今日休息',
    'screensB.location.beforeYouArrive': '到店前提醒',

    /* --- Loyalty --- */
    'screensB.loyalty.h1': '每次到店，都多一點光采。',
    'screensB.loyalty.sub':
      '每消費一美元累積一點，兌換您喜歡的服務，成為會員還能解鎖更多。加入免費。',
    'screensB.loyalty.yourPoints': '您的點數',
    'screensB.loyalty.member': '會員',
    'screensB.loyalty.progressLabel': '距離下一次免費服務的進度',
    'screensB.loyalty.unlocked': '您已解鎖一次免費服務 — 請在下方兌換。',
    'screensB.loyalty.toGo': '再 {count} 點就能享受下一次免費服務',
    'screensB.loyalty.redeemTitle': '兌換點數',
    'screensB.loyalty.locked': '未解鎖',
    'screensB.loyalty.redeem': '兌換',
    'screensB.loyalty.becomeMember': '成為會員',
    'screensB.loyalty.becomeSub': '加入 Studio Circle 會籍，享受更多 — 隨時可退。',
    'screensB.loyalty.mostLoved': '最受喜愛',
    'screensB.loyalty.youreMember': '您已是會員 ✓',
    'screensB.loyalty.joinPlan': '加入{name}',

    /* --- Manage --- */
    'screensB.manage.title': '管理預約',
    'screensB.manage.sub': '用預約代碼和電子郵件改期或取消預約。',
    'screensB.manage.fieldCode': '預約代碼',
    'screensB.manage.fieldEmail': '預約時填的電子郵件',
    'screensB.manage.find': '尋找我的預約',
    'screensB.manage.tip': '示範提示：欄位已預先填入一筆現有預約 — 直接按尋找即可。',
    'screensB.manage.withRole': '{name} · {role}',
    'screensB.manage.cancelled': '已取消',
    'screensB.manage.confirmed': '已確認',
    'screensB.manage.cancelledNote': '這次預約已取消。隨時歡迎再次預約。',
    'screensB.manage.findAnother': '尋找其他預約',

    /* --- Mobile --- */
    'screensB.mobile.deviceIphone': 'iPhone',
    'screensB.mobile.deviceAndroid': 'Android 手機',
    'screensB.mobile.deviceFrame': '裝置外框',
    'screensB.mobile.eyebrow': '隨行應用程式',
    'screensB.mobile.h1': '把 {brand} 放進口袋',
    'screensB.mobile.sub':
      '手機應用程式有自己的設計，不是把網站壓小 — 五個分頁、為拇指設計的預約流程，點數就在首頁。以下展示的是這套設計，而非已上架的軟體，但它不是截圖：請動手點點看。',
    'screensB.mobile.switchNote':
      '這裡切換的是手機，不是應用程式。Android 版有自己的 Material 設計 — 導覽列不同、上方間距更緊 — 那是另一份設計稿，這裡不呈現。',
    'screensB.mobile.yourProfile': '您的個人資料',
    'screensB.mobile.appTabs': '應用程式分頁',
    'screensB.mobile.greetMorning': '早安，{name}',
    'screensB.mobile.greetAfternoon': '午安，{name}',
    'screensB.mobile.greetEvening': '晚安，{name}',
    'screensB.mobile.toastPickTime': '請先選擇時間',
    'screensB.mobile.toastBooked': '預約已確認',
    'screensB.mobile.toastPickNewTime': '請選擇新的時間',
    'screensB.mobile.ctaConfirm': '確認 · {time}',
    'screensB.mobile.ctaPickTime': '選擇時間後繼續',
    'screensB.mobile.note':
      '這是設計展示，不是實際運行的軟體 — 您在這裡點的任何內容都不會影響帳戶。分頁、預約流程和優惠碼都是活的，好讓設計可以被感受；原本通往更深層畫面的項目（團隊、貨架、禮物卡）改以提示回應，這些流程在網頁版有完整實作。手機本身是重建的：設計稿引用的裝置外框從未一起交付。',
    'screensB.mobile.nextVisit': '下次到店',
    'screensB.mobile.manage': '管理',
    'screensB.mobile.directions': '路線',
    'screensB.mobile.bookAgain': '再次預約',
    'screensB.mobile.durPrice': '{duration} · {price}',
    'screensB.mobile.durStaff': '{duration} · {staff}',
    'screensB.mobile.durWithStaff': '{duration} · 由 {staff} 服務',
    'screensB.mobile.pointsGoal': '再 {count} 點就能兌換 {reward}',
    'screensB.mobile.pointsReady': '您的 {reward} 已可兌換',
    'screensB.mobile.toastJournal': '正在開啟誌記 — 僅為示範',
    'screensB.mobile.allServices': '全部服務',
    'screensB.mobile.pickDay': '選擇日期',
    'screensB.mobile.pickTime': '選擇時間',
    'screensB.mobile.toastTaken': '這個時段已被預訂',
    'screensB.mobile.upcoming': '即將到來',
    'screensB.mobile.past': '過往',
    'screensB.mobile.dateTime': '{date} · {time}',
    'screensB.mobile.whenWho': '{when} · {who}',
    'screensB.mobile.toastCancelled': '已取消 — 僅為示範',
    'screensB.mobile.toastReceipt': '收據已寄出',
    'screensB.mobile.circle': 'Circle',
    'screensB.mobile.statPoints': '點數',
    'screensB.mobile.preferences': '偏好設定',
    'screensB.mobile.account': '帳戶',
    'screensB.mobile.pushNotifications': '推播通知',
    'screensB.mobile.darkAppearance': '深色外觀',
    'screensB.mobile.toastPushOn': '推播已開啟',
    'screensB.mobile.toastPushOff': '推播已關閉',
    'screensB.mobile.signOut': '登出',
    'screensB.mobile.toastSignedOut': '已登出 — 僅為示範',
    'screensB.mobile.version': '{brand} · {version}',
    'screensB.mobile.booked': '預約完成',
    'screensB.mobile.sheetSub': '已為您安排 {service}，由 {staff} 服務。',
    'screensB.mobile.firstSpecialistFree': '最快有空的專員',
    'screensB.mobile.seeMyVisits': '查看我的預約',

    /* --- MyGifts --- */
    'screensB.mygifts.title': '已購禮物卡',
    'screensB.mygifts.sub': '您購買並送出的禮物卡。',
    'screensB.mygifts.buy': '購買禮物卡',
    'screensB.mygifts.emptyTitle': '還沒有禮物卡',
    'screensB.mygifts.emptyBody': '送出一點安寧 — 您買的卡片會出現在這裡。',
    'screensB.mygifts.to': '贈予 {name} · {date}',
    'screensB.mygifts.sent': '已送出',
    'screensB.mygifts.redeemed': '已兌換',

    /* --- NotFound --- */
    'screensB.notfound.h1': '這個頁面今天休假了。',
    'screensB.notfound.body':
      '我們找不到您要的內容 — 不過首頁永遠備著新造型和一點安寧。',

    /* --- NotifPrefs --- */
    'screensB.notifprefs.title': '通知偏好',
    'screensB.notifprefs.sub': '選擇哪些訊息會傳給您，以及用什麼方式。變更即時儲存。',
    'screensB.notifprefs.channels': '管道',
    'screensB.notifprefs.whatWeSend': '傳送內容',
    'screensB.notifprefs.timing': '時間安排',
    'screensB.notifprefs.remindMe': '提醒我',
    'screensB.notifprefs.remindSub': '到店前多久與您聯絡。',
    'screensB.notifprefs.reminderTiming': '提醒時間',
    'screensB.notifprefs.quietHours': '勿擾時段',
    'screensB.notifprefs.quietSub': '非緊急訊息一律留到早上。',
    'screensB.notifprefs.quietWindow': '勿擾區間',
    'screensB.notifprefs.pauseTitle': '全部暫停',
    'screensB.notifprefs.pauseBody': '關閉所有管道。預約確認仍會以電子郵件寄出。',
    'screensB.notifprefs.pauseAll': '全部暫停',
    'screensB.notifprefs.toastPaused': '已暫停所有通知',

    /* --- Offers --- */
    'screensB.offers.eyebrow': '2026 年秋季',
    'screensB.offers.h1': '當季優惠',
    'screensB.offers.sub':
      '這一季值得預約的幾件事。複製優惠碼，結帳時自動套用 — 每次到店限用一個。',
    'screensB.offers.ends': '{date} 截止',
    'screensB.offers.bookPairing': '預約組合',
    'screensB.offers.toastCopied': '已複製 {code} 到剪貼簿',
    'screensB.offers.note':
      '每次到店限用一個優惠，不可與套裝堂數或禮物卡儲值合併。會員的九折一律另計。示範優惠碼 — 不會真的折價。',

    /* --- Orders --- */
    'screensB.orders.title': '訂單紀錄',
    'screensB.orders.sub': '您付款過的每次到店、每份套裝與每張禮物卡。',
    'screensB.orders.spent': '2026 年消費',
    'screensB.orders.emptyTitle': '此篩選下沒有內容',
    'screensB.orders.emptyBody': '換個類別看看 — 其他訂單都還在。',
    'screensB.orders.toastReceipt': '收據 {code} 已寄至 {email}',

    /* --- Packages --- */
    'screensB.packages.subject': '{qty} × {name}',
    'screensB.packages.studioServices': '工作室服務',
    'screensB.packages.expires': '{date} 到期',
    'screensB.packages.eyebrow': '預付套裝',
    'screensB.packages.h1': '套裝優惠',
    'screensB.packages.sub':
      '一次買下多次到店，單次更划算。堂數會留在您的帳戶裡，直到您預約 — 沒有月費，也沒有到期陷阱。',
    'screensB.packages.yourPackages': '我的套裝',
    'screensB.packages.left': '剩餘',
    'screensB.packages.sessionsUsed': '{name} 已使用堂數',
    'screensB.packages.usedOf': '已用 {used}／{total}',
    'screensB.packages.bookSession': '預約一堂',
    'screensB.packages.available': '可購套裝',
    'screensB.packages.mostPopular': '最受歡迎',
    'screensB.packages.save': '省下 {amount}',
    'screensB.packages.perSession': '{amount} / 堂',
    'screensB.packages.inAccount': '已在帳戶中',
    'screensB.packages.buy': '購買套裝',
    'screensB.packages.toastAlready': '{name} 已在您的帳戶中',
    'screensB.packages.toastAdded': '已加入{name} — 僅為示範，不會扣款',
    'screensB.packages.note':
      '堂數效期 12 個月，可轉贈一次，並按比例退款。這是示範 — 不會實際扣款。',

    /* --- Policy --- */
    'screensB.policy.title': '取消條款',
    'screensB.policy.sub': '計畫會變 — 我們理解。以下是我們的規則，說得清清楚楚。',
    'screensB.policy.windowTitle': '24 小時緩衝',
    'screensB.policy.windowBody':
      '開始時間前 24 小時以上可免費取消或改期，直接在「管理預約」操作。',
    'screensB.policy.lateTitle': '臨時取消與未到',
    'screensB.policy.lateBody':
      '24 小時內取消將收取 50% 費用。未到者全額收費，以免座位空著。',
    'screensB.policy.howTitle': '如何取消',
    'screensB.policy.howBody':
      '前往「管理預約」，輸入代碼與電子郵件，再選擇改期或取消 — 不必打電話。',
    'screensB.policy.membersTitle': '會員與套裝',
    'screensB.policy.membersBody':
      'Studio Circle 會員每月可免費臨時取消一次。套裝堂數會直接退回您的餘額。',
    'screensB.policy.banner': '這是示範用的條款 — 從不會真的收取任何費用。',

    /* --- Post --- */
    'screensB.post.back': '回到誌記',
    'screensB.post.emptyTitle': '找不到這篇文章',
    'screensB.post.emptyBody': '它可能已下架。我們寫過的內容都在誌記目錄裡。',
    'screensB.post.browse': '瀏覽誌記',
    'screensB.post.byline': '{date} · {read}',
    'screensB.post.more': '更多誌記文章',

    /* --- Refer --- */
    'screensB.refer.title': '推薦朋友',
    'screensB.refer.sub': '送 {amount}，得 {amount}。人人容光煥發地離開。',
    'screensB.refer.yourCode': '您的邀請碼',
    'screensB.refer.copyLink': '複製邀請連結',
    'screensB.refer.toastCopied': '已複製邀請連結到剪貼簿',
    'screensB.refer.yourInvites': '您的邀請',

    /* --- Reviews --- */
    'screensB.reviews.justNow': '剛剛',
    'screensB.reviews.total': '{reviews} 則評價 · {specialists} 位專員',
    'screensB.reviews.starRow': '{stars}★',
    'screensB.reviews.composeSent': '您的評價已發布',
    'screensB.reviews.composeTitle': '最近來過嗎？說說感受如何',
    'screensB.reviews.thanks':
      '謝謝 — 您的評價已置頂顯示。24 小時內還可以修改。',
    'screensB.reviews.starsAria': '{count} 星',
    'screensB.reviews.placeholder': '這次體驗如何？有什麼想告訴下一位客人的？',
    'screensB.reviews.textareaLabel': '您的評價',
    'screensB.reviews.postingAs': '以 {name} 的身分發布 · 您上次到店是 {date}',
    'screensB.reviews.post': '發布評價',
    'screensB.reviews.errEmpty': '請先寫上一兩句',
    'screensB.reviews.toastPosted': '評價已發布 · 僅為示範',
    'screensB.reviews.showing': '顯示 {shown}／{total}',
    'screensB.reviews.metaStaff': '{service} · 由 {staff} 服務 · {date}',
    'screensB.reviews.metaStudio': '{service} · 工作室 · {date}',
    'screensB.reviews.replyBy': '{name} 已回覆',
    'screensB.reviews.helpful': '有幫助 · {n}',
    'screensB.reviews.report': '檢舉',
    'screensB.reviews.toastFlagged': '已標記，團隊會查看',

    /* --- Rewards --- */
    'screensB.rewards.srTitle': '會員獎勵',
    'screensB.rewards.yourSpecialist': '您的專員',
    'screensB.rewards.yourBalance': '您的餘額',
    'screensB.rewards.progressLabel': '距離下一份 {amount} 獎勵的進度',
    'screensB.rewards.canRedeem': '您現在可以兌換 {amount} 獎勵了。',
    'screensB.rewards.toGo': '再 {count} 點就能兌換下一份 {amount} 獎勵',
    'screensB.rewards.factEarned': '今年累積',
    'screensB.rewards.factRedeemed': '已兌換',
    'screensB.rewards.factTier': '等級',
    'screensB.rewards.tierCircle': 'Circle',
    'screensB.rewards.tierGuest': '訪客',
    'screensB.rewards.spendTitle': '使用您的點數',
    'screensB.rewards.redeemed': '已兌換 · 存入帳戶',
    'screensB.rewards.redeem': '兌換',
    'screensB.rewards.pointsToGo': '還差 {count} 點',
    'screensB.rewards.toastRedeemed': '{name} · 已存入您的帳戶',
    'screensB.rewards.recentPoints': '最近點數',
    'screensB.rewards.howPointsWork': '點數怎麼算',

    /* --- Services --- */
    'screensB.services.title': '服務',
    'screensB.services.sub':
      '挑一個您此刻想做的。每次預約都會立即確認 — 接著再選專員和時間。',
    'screensB.services.filterLabel': '依類別篩選',

    /* --- Shop --- */
    'screensB.shop.title': '貨架',
    'screensB.shop.sub':
      '我們真正用在您身上的產品，容量也是我們自己會買的。到店自取或宅配到府。',
    'screensB.shop.removeOne': '減少一件{name}',
    'screensB.shop.addAnother': '增加一件{name}',
    'screensB.shop.addToBag': '加入購物袋',
    'screensB.shop.toastAdded': '已將{name}加入購物袋',
    'screensB.shop.yourBag': '您的購物袋',
    'screensB.shop.cartEmpty':
      '購物袋還是空的。若您想在店裡付款，產品也可以算進這次到店的帳單。',
    'screensB.shop.lineQty': '{qty} × {price}',
    'screensB.shop.subtotal': '小計',
    'screensB.shop.checkout': '前往結帳',
    'screensB.shop.ship': '到店自取免費 · 宅配 {amount}',

    /* --- SignIn --- */
    'screensB.signin.errEmail': '請輸入有效的電子郵件地址。',
    'screensB.signin.toastCodeSent': '驗證碼已寄出 · 任意六位數字都可以',
    'screensB.signin.errCode': '請輸入全部六位數字後繼續。',
    'screensB.signin.toastSignedIn': '已以 {name} 的身分登入',
    'screensB.signin.welcome': '歡迎回來',
    'screensB.signin.lede':
      '輸入電子郵件，我們會寄出六位數驗證碼。沒有密碼要記。',
    'screensB.signin.fieldEmail': '電子郵件地址',
    'screensB.signin.remember': '在這台裝置保持登入',
    'screensB.signin.emailCode': '寄驗證碼給我',
    'screensB.signin.or': '或',
    'screensB.signin.bookWithoutAccount': '不註冊直接預約',
    'screensB.signin.foot':
      '這是示範登入 — 任何電子郵件都可以，也不會真的寄出驗證碼。',
    'screensB.signin.differentEmail': '換一個電子郵件',
    'screensB.signin.checkInbox': '請查看收件匣',
    'screensB.signin.sentTo': '我們已將六位數驗證碼寄到 {email}',
    'screensB.signin.yourInbox': '您的收件匣',
    'screensB.signin.codeLabel': '六位數登入驗證碼',
    'screensB.signin.verify': '驗證並登入',
    'screensB.signin.didntGet': '沒收到嗎？',
    'screensB.signin.resend': '重新寄送',
    'screensB.signin.toastNewCode': '新的驗證碼正在路上',
    'screensB.signin.demoHint': '示範提示：任意六位數字即可。',

    /* --- Staff --- */
    'screensB.staff.dirTitle': '座位後的人',
    'screensB.staff.dirLede':
      '四位專員，各有各的時間與手法。挑一位合您心意的 — 也可以讓我們幫您安排。',
    'screensB.staff.nextFree': '最近空檔 · {when}',
    'screensB.staff.viewProfile': '查看檔案',
    'screensB.staff.allSpecialists': '全部專員',
    'screensB.staff.since': '{role} · {year} 年加入工作室',
    'screensB.staff.knownFor': '擅長',
    'screensB.staff.guestsSay': '客人怎麼說',
    'screensB.staff.quoteMeta': '{service} · {date}',
    'screensB.staff.statRating': '平均評分',
    'screensB.staff.statReviews': '評價',
    'screensB.staff.statYears': '在店年資',
    'screensB.staff.joinWaitlist': '加入其候補名單',
    'screensB.staff.usualWeek': '一般一週',
    'screensB.staff.hourRange': '{from} – {to}',
    'screensB.staff.off': '休息',
    'screensB.staff.servicesOffered': '{name} 提供的服務',

    /* --- Visits --- */
    'screensB.visits.title': '我的近期預約',
    'screensB.visits.sub': '您在我們這裡預約的所有項目。',
    'screensB.visits.emptyTitle': '還沒有預約',
    'screensB.visits.emptyBody': '預約之後，詳細資訊會顯示在這裡。',
    'screensB.visits.bookVisit': '預約到店',
    'screensB.visits.appointment': '預約',
    'screensB.visits.repeats': '每{freq}重複 · 共 {count} 次',
    'screensB.visits.manage': '改期或取消',

    /* --- Waitlist --- */
    'screensB.waitlist.title': '候補名單',
    'screensB.waitlist.lede':
      '幾乎每天都有人取消。告訴我們您想要什麼，一有空位我們就傳訊息給您。',
    'screensB.waitlist.joinTitle': '加入名單',
    'screensB.waitlist.groupService': '哪一項服務？',
    'screensB.waitlist.groupDays': '方便的日子',
    'screensB.waitlist.groupTime': '時段',
    'screensB.waitlist.groupNotify': '通知方式',
    'screensB.waitlist.winMornings': '上午',
    'screensB.waitlist.winAfternoons': '下午',
    'screensB.waitlist.winEvenings': '晚上',
    'screensB.waitlist.notifyText': '簡訊',
    'screensB.waitlist.notifyEmail': '電子郵件',
    'screensB.waitlist.notifyPush': '推播',
    'screensB.waitlist.oddsMany': '可選的日子這麼多，多數客人 48 小時內就會收到消息。',
    'screensB.waitlist.oddsSome': '只選兩三天的話，這個季節通常要等上幾天。',
    'screensB.waitlist.oddsOne': '只選一天可能要等兩三週 — 可以的話再加一天。',
    'screensB.waitlist.addMe': '把我加入名單',
    'screensB.waitlist.errPickDay': '請至少選擇一個方便的日子',
    'screensB.waitlist.toastJoinedText': '已加入名單 · 我們會用簡訊聯絡您',
    'screensB.waitlist.toastJoinedEmail': '已加入名單 · 我們會用電子郵件聯絡您',
    'screensB.waitlist.toastJoinedPush': '已加入名單 · 我們會用推播通知您',
    'screensB.waitlist.waitingOn': '您正在等待',
    'screensB.waitlist.emptyTitle': '目前還沒有',
    'screensB.waitlist.emptyBody': '在表單裡登記，您的排隊位置就會顯示在這裡。',
    'screensB.waitlist.toastWidened': '時段已放寬 · 我們會看更多日子',
    'screensB.waitlist.flexible': '不限',
    'screensB.waitlist.entryStaffDate': '由 {staff} 服務 · {date}',
    'screensB.waitlist.entryAnyDate': '不限專員 · {date}',
    'screensB.waitlist.inLine': '排隊第 {pos} 位',
    'screensB.waitlist.oddsNext': '下一位就是您 — 一有空位我們馬上傳訊息。',
    'screensB.waitlist.oddsWait': '這個季節大約要等 {count} 天。',
    'screensB.waitlist.widen': '放寬我的時段',

    /* --- WaitlistStatus --- */
    'screensB.wstatus.title': '候補狀態',
    'screensB.wstatus.sub': '您正在等待的日子 — 一有空位我們馬上傳訊息。',
    'screensB.wstatus.emptyTitle': '您尚未加入任何候補名單',
    'screensB.wstatus.emptyBody':
      '若某天已額滿，可在「日期與時間」步驟加入該日候補名單，之後會顯示在這裡。',
    'screensB.wstatus.flexible': '不限',
    'screensB.wstatus.whenWho': '{date} · {who}',
    'screensB.wstatus.waiting': '正在等待空位',
  },
  'ar-EG': {
    /* --- shared inside this area --- */
    'screensB.common.all': 'الكل',
    'screensB.common.anyService': 'أي خدمة',
    'screensB.common.backHome': 'العودة إلى الرئيسية',
    'screensB.common.backToDashboard': 'العودة إلى لوحة المعلومات',
    'screensB.common.book': 'احجز',
    'screensB.common.bookNamed': 'احجز {name}',
    'screensB.common.bookWith': 'احجز مع {name}',
    'screensB.common.cancel': 'إلغاء',
    'screensB.common.codeCopied': 'تم نسخ {code}',
    'screensB.common.copyCode': 'انسخ الرمز {code}',
    'screensB.common.demoOnly': '{label} — عرض توضيحي فقط',
    'screensB.common.email': 'البريد الإلكتروني',
    'screensB.common.firstAvailable': 'أول متاح',
    'screensB.common.fullName': 'الاسم الكامل',
    'screensB.common.howItWorks': 'كيف يعمل',
    'screensB.common.leave': 'مغادرة',
    'screensB.common.optional': '(اختياري)',
    'screensB.common.phEmail': 'you@email.com',
    'screensB.common.phone': 'الهاتف',
    'screensB.common.pointsUnit': 'نقطة|نقطة|نقطتان|نقاط|نقطة|نقطة',
    'screensB.common.ptsCount':
      '{count} نقطة|{count} نقطة|{count} نقطتان|{count} نقاط|{count} نقطة|{count} نقطة',
    'screensB.common.ptsUnit': 'نقطة|نقطة|نقطتان|نقاط|نقطة|نقطة',
    'screensB.common.receipt': 'الإيصال',
    'screensB.common.reschedule': 'إعادة الجدولة',
    'screensB.common.seeAll': 'عرض الكل',
    'screensB.common.time': 'الوقت',
    'screensB.common.timeDur': '{time} · {duration}',
    'screensB.common.toastMaps': 'جارٍ فتح Maps — عرض توضيحي فقط',
    'screensB.common.total': 'الإجمالي',
    'screensB.common.when': 'التاريخ',
    'screensB.common.with': 'مع',

    /* --- Help --- */
    'screensB.help.title': 'كيف يمكننا مساعدتك؟',
    'screensB.help.sub': 'إجابات عن أكثر ما يسألنا عنه الضيوف.',
    'screensB.help.searchPlaceholder': 'ابحث في مقالات المساعدة…',
    'screensB.help.searchLabel': 'ابحث في مقالات المساعدة',
    'screensB.help.results':
      '{count} إجابة عن «{query}»|{count} إجابة عن «{query}»|{count} إجابتان عن «{query}»|{count} إجابات عن «{query}»|{count} إجابة عن «{query}»|{count} إجابة عن «{query}»',
    'screensB.help.common': 'أسئلة شائعة',
    'screensB.help.emptyTitle': 'لا توجد نتائج',
    'screensB.help.emptyBody':
      'جرّب بحثًا أقصر، أو راسلنا برسالة نصية — يرد عليك شخص حقيقي بين التاسعة صباحًا والسادسة مساءً.',
    'screensB.help.stuckTitle': 'ما زال الأمر غامضًا؟',
    'screensB.help.stuckBody':
      'سياسة الإلغاء لدينا تجيب عن معظم أسئلة الحجز بلغة واضحة.',
    'screensB.help.readPolicy': 'اقرأ السياسة',

    /* --- Home --- */
    'screensB.home.eyebrow': 'جمال وعناية بأسلوب البوتيك',
    'screensB.home.title': 'اشعري بأنك أفضل نسخة من نفسك.',
    'screensB.home.lede':
      'الشعر والسبا والأظافر والحركة تحت سقف واحد هادئ. احجز كرسيًا أو غرفة علاج بلمسات قليلة — دون مكالمات متكررة ودون حساب.',
    'screensB.home.bookNow': 'احجز الآن',
    'screensB.home.viewServices': 'اعرض الخدمات',
    'screensB.home.trustOpenings': 'مواعيد خلال الأسبوع نفسه',
    'screensB.home.trustDowntown': 'استوديو في وسط المدينة',
    'screensB.home.trustWalkins': 'الزيارة دون موعد مرحّب بها',
    'screensB.home.popularTitle': 'الخدمات الأكثر طلبًا',
    'screensB.home.popularSub': 'لمحة من كل ركن في الاستوديو.',
    'screensB.home.teamTitle': 'تعرّف على الفريق',
    'screensB.home.teamSub': 'أربعة متخصصين، وجدول مرتب للغاية.',
    'screensB.home.lovedTitle': 'محبوب من الزبائن الدائمين',
    'screensB.home.lovedSub': 'ما يقوله الضيوف بعد عودتهم إلى الحياة اليومية.',
    'screensB.home.ratingFrom':
      'من {count} تقييم|من {count} تقييم|من {count} تقييمين|من {count} تقييمات|من {count} تقييمًا|من {count} تقييم',
    'screensB.home.hoursTitle': 'ساعات العمل الأسبوعية',
    'screensB.home.hoursNote':
      'لكل متخصص ساعاته الخاصة — سترى المواعيد المتاحة مباشرة عند الحجز.',

    /* --- Intake --- */
    'screensB.intake.doneTitle': 'تم حفظ استمارة الاستقبال',
    'screensB.intake.doneBody':
      'شكرًا لك — سيطّلع عليها المتخصص قبل زيارتك. هذا عرض توضيحي، فلا يُحفَظ شيء فعليًا.',
    'screensB.intake.editAnswers': 'تعديل الإجابات',
    'screensB.intake.title': 'استمارة استقبال رقمية',
    'screensB.intake.sub':
      'أسئلة سريعة تتيح للمتخصص تكييف الزيارة. تستغرق دقيقة تقريبًا.',
    'screensB.intake.concernsLegend': 'هل ينطبق عليك أي مما يلي؟',
    'screensB.intake.allergiesLabel': 'الحساسية أو التحسس',
    'screensB.intake.allergiesPlaceholder': 'العطور، اللاتكس، منتجات بعينها…',
    'screensB.intake.pressureLabel': 'الضغط أو الشدة المفضلة',
    'screensB.intake.consent':
      'أؤكد صحة ما سبق وأوافق على تلقي الخدمة. أدرك أن بإمكاني تحديث ذلك في أي وقت قبل زيارتي.',
    'screensB.intake.submit': 'حفظ الاستمارة',

    /* --- Join --- */
    'screensB.join.cycleMonthly': 'شهريًا',
    'screensB.join.cycleAnnual': 'سنويًا · شهران مجانًا',
    'screensB.join.startToday': 'ابدأ اليوم',
    'screensB.join.startFirst': 'ابدأ في الأول من الشهر',
    'screensB.join.title': 'انضم إلى Circle',
    'screensB.join.sub':
      'جلسة شهرية، وخصم عشرة بالمئة على كل ما عداها، وأولوية في المواعيد الملغاة. ألغِ متى شئت — دون مدة إشعار.',
    'screensB.join.billingCycle': 'دورة الفوترة',
    'screensB.join.mostJoined': 'الأكثر اشتراكًا',
    'screensB.join.perYear': '/سنة',
    'screensB.join.perMonth': '/شهر',
    'screensB.join.selected': 'مختار · متابعة',
    'screensB.join.choose': 'اختر {name}',
    'screensB.join.note':
      'العضوية تعوّض قيمتها بزيارة واحدة شهريًا. الجلسة الشهرية غير المستخدمة تُرحّل مرة واحدة. تسجيل توضيحي — لا يُخصم من أي بطاقة.',
    'screensB.join.otherPlans': 'خطط أخرى',
    'screensB.join.payTitle': 'أكّد عضويتك',
    'screensB.join.yourDetails': 'بياناتك',
    'screensB.join.mobile': 'الجوال',
    'screensB.join.starts': 'يبدأ',
    'screensB.join.lineAnnual': '{name} · 12 شهرًا',
    'screensB.join.lineFirstMonth': '{name} · الشهر الأول',
    'screensB.join.startsToday': 'يبدأ اليوم',
    'screensB.join.prorata': 'رصيد بالتناسب',
    'screensB.join.joiningFee': 'رسوم الانضمام',
    'screensB.join.waived': 'معفاة',
    'screensB.join.errEmail': 'أضف بريدًا إلكترونيًا كي نرسل البطاقة',
    'screensB.join.welcome': 'أهلًا بك في Circle',
    'screensB.join.summaryAnnual': '{name} · سنوي',
    'screensB.join.summaryMonthly': '{name} · شهري',
    'screensB.join.dueToday': 'المستحق اليوم',
    'screensB.join.startMembership': 'ابدأ عضويتي',
    'screensB.join.fine':
      'ألغِ في أي وقت من حسابك. عرض توضيحي فقط — لا يُخصم شيء.',
    'screensB.join.doneTitle': 'أنت الآن في Circle',
    'screensB.join.doneSub':
      'رصيد جلستك الأولى موجود بالفعل في حسابك، وكل حجز من الآن يُخصم منه عشرة بالمئة تلقائيًا.',
    'screensB.join.rowPlan': 'الخطة',
    'screensB.join.rowBilling': 'الفوترة',
    'screensB.join.billingAnnually': 'سنويًا · {amount}',
    'screensB.join.billingMonthly': 'شهريًا · {amount}',
    'screensB.join.rowMemberNo': 'رقم العضوية',
    'screensB.join.seeRewards': 'اعرض مكافآتك',
    'screensB.join.useCredit': 'استخدم رصيدي',

    /* --- LoyaltyHistory --- */
    'screensB.lhistory.title': 'سجل نقاط الولاء',
    'screensB.lhistory.sub':
      'كل نقطة جمعتها وأنفقتها مع Studio Circle.',
    'screensB.lhistory.currentBalance': 'الرصيد الحالي',
    'screensB.lhistory.redeemRewards': 'استبدل المكافآت',

    /* --- Location --- */
    'screensB.location.title': 'موقعنا',
    'screensB.location.lede':
      'طابقان فوق المخبز في Alder Lane. اضغط الجرس المكتوب عليه Studio إذا كان باب الشارع مغلقًا.',
    'screensB.location.rowAddress': 'العنوان',
    'screensB.location.rowGettingIn': 'الدخول',
    'screensB.location.addressValue': '{line1}، {line2}',
    'screensB.location.getDirections': 'احصل على الاتجاهات',
    'screensB.location.callStudio': 'اتصل بالاستوديو',
    'screensB.location.toastDial': 'جارٍ الاتصال بـ {phone} — عرض توضيحي فقط',
    'screensB.location.openingHours': 'ساعات العمل',
    'screensB.location.openToday': 'مفتوح اليوم',
    'screensB.location.closedToday': 'مغلق اليوم',
    'screensB.location.beforeYouArrive': 'قبل وصولك',

    /* --- Loyalty --- */
    'screensB.loyalty.h1': 'إشراقة صغيرة مع كل زيارة.',
    'screensB.loyalty.sub':
      'اكسب نقطة عن كل دولار، واستبدلها بالخدمات التي تحبها، واحصل على المزيد كعضو. الانضمام مجاني.',
    'screensB.loyalty.yourPoints': 'نقاطك',
    'screensB.loyalty.member': 'عضو',
    'screensB.loyalty.progressLabel': 'التقدم نحو خدمتك المجانية التالية',
    'screensB.loyalty.unlocked':
      'حصلت على خدمة مجانية — استبدلها في الأسفل.',
    'screensB.loyalty.toGo':
      'بقيت {count} نقطة حتى خدمتك المجانية التالية|بقيت {count} نقطة حتى خدمتك المجانية التالية|بقيت {count} نقطتان حتى خدمتك المجانية التالية|بقيت {count} نقاط حتى خدمتك المجانية التالية|بقيت {count} نقطة حتى خدمتك المجانية التالية|بقيت {count} نقطة حتى خدمتك المجانية التالية',
    'screensB.loyalty.redeemTitle': 'استبدل نقاطك',
    'screensB.loyalty.locked': 'مقفل',
    'screensB.loyalty.redeem': 'استبدال',
    'screensB.loyalty.becomeMember': 'كن عضوًا',
    'screensB.loyalty.becomeSub':
      'استفد أكثر مع عضوية Studio Circle — ألغِ في أي وقت.',
    'screensB.loyalty.mostLoved': 'الأكثر تفضيلًا',
    'screensB.loyalty.youreMember': 'أنت عضو ✓',
    'screensB.loyalty.joinPlan': 'انضم إلى {name}',

    /* --- Manage --- */
    'screensB.manage.title': 'إدارة الحجز',
    'screensB.manage.sub':
      'أعد جدولة موعد أو ألغِه باستخدام رمزك وبريدك الإلكتروني.',
    'screensB.manage.fieldCode': 'رمز الحجز',
    'screensB.manage.fieldEmail': 'البريد الإلكتروني المسجل في الحجز',
    'screensB.manage.find': 'ابحث عن حجزي',
    'screensB.manage.tip':
      'ملاحظة توضيحية: الحقول مملوءة مسبقًا بحجز موجود بالفعل — اضغط بحث فقط.',
    'screensB.manage.withRole': '{name} · {role}',
    'screensB.manage.cancelled': 'ملغى',
    'screensB.manage.confirmed': 'مؤكد',
    'screensB.manage.cancelledNote':
      'أُلغي هذا الموعد. احجز مرة أخرى في أي وقت — يسعدنا استقبالك.',
    'screensB.manage.findAnother': 'ابحث عن حجز آخر',

    /* --- Mobile --- */
    'screensB.mobile.deviceIphone': 'iPhone',
    'screensB.mobile.deviceAndroid': 'هاتف Android',
    'screensB.mobile.deviceFrame': 'إطار الجهاز',
    'screensB.mobile.eyebrow': 'التطبيق المرافق',
    'screensB.mobile.h1': '{brand} في جيبك',
    'screensB.mobile.sub':
      'تطبيق الهاتف تصميم قائم بذاته، وليس موقعًا مضغوطًا — خمسة تبويبات، ومسار حجز مصمم للإبهام، ونقاطك على الشاشة الرئيسية. ما يلي عرض لهذا التصميم لا للتطبيق المنشور، لكنه ليس صورة ثابتة: جرّب الضغط فيه.',
    'screensB.mobile.switchNote':
      'هذا يبدّل الهاتف لا التطبيق. نسخة Android لها تصميم Material خاص بها — شريط تنقل مختلف ومسافات علوية أضيق — وهي مقترح منفصل لا يظهر هنا.',
    'screensB.mobile.yourProfile': 'ملفك الشخصي',
    'screensB.mobile.appTabs': 'تبويبات التطبيق',
    'screensB.mobile.greetMorning': 'صباح الخير يا {name}',
    'screensB.mobile.greetAfternoon': 'طاب يومك يا {name}',
    'screensB.mobile.greetEvening': 'مساء الخير يا {name}',
    'screensB.mobile.toastPickTime': 'اختر وقتًا أولًا',
    'screensB.mobile.toastBooked': 'تم تأكيد الحجز',
    'screensB.mobile.toastPickNewTime': 'اختر وقتًا جديدًا',
    'screensB.mobile.ctaConfirm': 'تأكيد · {time}',
    'screensB.mobile.ctaPickTime': 'اختر وقتًا للمتابعة',
    'screensB.mobile.note':
      'عرض للتصميم لا للتطبيق العامل — لا شيء تضغطه هنا يصل إلى حسابك. التبويبات ومسار الحجز ورموز العروض تعمل فعلًا حتى يمكن تلمّس التصميم؛ أما الصفوف التي كانت تفتح شاشات أعمق (الفريق، الرف، بطاقات الهدايا) فتردّ برسالة، وتلك المسارات متوفرة كاملة على الويب. الهاتف نفسه إعادة بناء: المقترحات استوردت إطار جهاز لم يُسلَّم معها قط.',
    'screensB.mobile.nextVisit': 'الزيارة القادمة',
    'screensB.mobile.manage': 'إدارة',
    'screensB.mobile.directions': 'الاتجاهات',
    'screensB.mobile.bookAgain': 'احجز مجددًا',
    'screensB.mobile.durPrice': '{duration} · {price}',
    'screensB.mobile.durStaff': '{duration} · {staff}',
    'screensB.mobile.durWithStaff': '{duration} · مع {staff}',
    'screensB.mobile.pointsGoal':
      'بقيت {count} نقطة حتى مكافأة {reward}|بقيت {count} نقطة حتى مكافأة {reward}|بقيت {count} نقطتان حتى مكافأة {reward}|بقيت {count} نقاط حتى مكافأة {reward}|بقيت {count} نقطة حتى مكافأة {reward}|بقيت {count} نقطة حتى مكافأة {reward}',
    'screensB.mobile.pointsReady': 'مكافأة {reward} جاهزة للاستبدال',
    'screensB.mobile.toastJournal': 'جارٍ فتح المدوّنة — عرض توضيحي فقط',
    'screensB.mobile.allServices': 'كل الخدمات',
    'screensB.mobile.pickDay': 'اختر يومًا',
    'screensB.mobile.pickTime': 'اختر وقتًا',
    'screensB.mobile.toastTaken': 'هذا الموعد محجوز',
    'screensB.mobile.upcoming': 'القادمة',
    'screensB.mobile.past': 'السابقة',
    'screensB.mobile.dateTime': '{date} · {time}',
    'screensB.mobile.whenWho': '{when} · {who}',
    'screensB.mobile.toastCancelled': 'أُلغي — عرض توضيحي فقط',
    'screensB.mobile.toastReceipt': 'أُرسل الإيصال بالبريد الإلكتروني',
    'screensB.mobile.circle': 'Circle',
    'screensB.mobile.statPoints': 'النقاط',
    'screensB.mobile.preferences': 'التفضيلات',
    'screensB.mobile.account': 'الحساب',
    'screensB.mobile.pushNotifications': 'الإشعارات الفورية',
    'screensB.mobile.darkAppearance': 'المظهر الداكن',
    'screensB.mobile.toastPushOn': 'الإشعارات مفعّلة',
    'screensB.mobile.toastPushOff': 'الإشعارات موقوفة',
    'screensB.mobile.signOut': 'تسجيل الخروج',
    'screensB.mobile.toastSignedOut': 'تم تسجيل الخروج — عرض توضيحي فقط',
    'screensB.mobile.version': '{brand} · {version}',
    'screensB.mobile.booked': 'تم حجزك',
    'screensB.mobile.sheetSub': 'سجّلناك لـ {service} مع {staff}.',
    'screensB.mobile.firstSpecialistFree': 'أول متخصص متاح',
    'screensB.mobile.seeMyVisits': 'اعرض زياراتي',

    /* --- MyGifts --- */
    'screensB.mygifts.title': 'بطاقات الهدايا المشتراة',
    'screensB.mygifts.sub': 'بطاقات الهدايا التي اشتريتها وأرسلتها.',
    'screensB.mygifts.buy': 'اشترِ بطاقة هدية',
    'screensB.mygifts.emptyTitle': 'لا توجد بطاقات هدايا بعد',
    'screensB.mygifts.emptyBody':
      'أهدِ قليلًا من الهدوء — ستظهر البطاقات التي تشتريها هنا.',
    'screensB.mygifts.to': 'إلى {name} · {date}',
    'screensB.mygifts.sent': 'أُرسلت',
    'screensB.mygifts.redeemed': 'استُبدلت',

    /* --- NotFound --- */
    'screensB.notfound.h1': 'هذه الصفحة أخذت إجازة اليوم.',
    'screensB.notfound.body':
      'لم نعثر على ما تبحث عنه — لكن هناك دائمًا إطلالة جديدة أو قليل من الهدوء في انتظارك على الصفحة الرئيسية.',

    /* --- NotifPrefs --- */
    'screensB.notifprefs.title': 'تفضيلات الإشعارات',
    'screensB.notifprefs.sub':
      'اختر ما يصلك وكيف يصلك. تُحفظ التغييرات فور إجرائها.',
    'screensB.notifprefs.channels': 'القنوات',
    'screensB.notifprefs.whatWeSend': 'ما نرسله',
    'screensB.notifprefs.timing': 'التوقيت',
    'screensB.notifprefs.remindMe': 'ذكّرني',
    'screensB.notifprefs.remindSub': 'كم من الوقت قبل الزيارة نتواصل معك.',
    'screensB.notifprefs.reminderTiming': 'توقيت التذكير',
    'screensB.notifprefs.quietHours': 'ساعات الهدوء',
    'screensB.notifprefs.quietSub': 'كل ما ليس عاجلًا ينتظر حتى الصباح.',
    'screensB.notifprefs.quietWindow': 'نافذة الهدوء',
    'screensB.notifprefs.pauseTitle': 'إيقاف كل شيء مؤقتًا',
    'screensB.notifprefs.pauseBody':
      'يوقف كل القنوات. تأكيدات الحجز تصل بالبريد الإلكتروني كالمعتاد.',
    'screensB.notifprefs.pauseAll': 'إيقاف الكل',
    'screensB.notifprefs.toastPaused': 'تم إيقاف كل الإشعارات مؤقتًا',

    /* --- Offers --- */
    'screensB.offers.eyebrow': 'خريف 2026',
    'screensB.offers.h1': 'عروض الموسم',
    'screensB.offers.sub':
      'بعض ما يستحق الحجز هذا الموسم. انسخ الرمز ليُطبَّق عند الدفع — رمز واحد لكل زيارة.',
    'screensB.offers.ends': 'ينتهي في {date}',
    'screensB.offers.bookPairing': 'احجز الباقة',
    'screensB.offers.toastCopied': 'تم نسخ {code} إلى الحافظة',
    'screensB.offers.note':
      'عرض واحد لكل زيارة، ولا يُجمع مع جلسات الباقات أو شحن بطاقات الهدايا. يحصل الأعضاء دائمًا على خصم 10% إضافي. رموز توضيحية — لا خصم فعلي.',

    /* --- Orders --- */
    'screensB.orders.title': 'سجل الطلبات',
    'screensB.orders.sub':
      'كل زيارة وباقة وبطاقة هدية دفعت ثمنها.',
    'screensB.orders.spent': 'الإنفاق في 2026',
    'screensB.orders.emptyTitle': 'لا شيء ضمن هذا التصفية',
    'screensB.orders.emptyBody':
      'جرّب فئة أخرى — بقية طلباتك ما زالت موجودة.',
    'screensB.orders.toastReceipt': 'أُرسل الإيصال {code} إلى {email}',

    /* --- Packages --- */
    'screensB.packages.subject': '{qty} × {name}',
    'screensB.packages.studioServices': 'خدمات الاستوديو',
    'screensB.packages.expires': 'تنتهي في {date}',
    'screensB.packages.eyebrow': 'باقات مدفوعة مسبقًا',
    'screensB.packages.h1': 'عروض الباقات',
    'screensB.packages.sub':
      'اشترِ عدة زيارات دفعة واحدة وادفع أقل لكل جلسة. تبقى الجلسات في حسابك حتى تحجزها — بلا رسوم شهرية وبلا ألاعيب انتهاء.',
    'screensB.packages.yourPackages': 'باقاتك',
    'screensB.packages.left': 'متبقية',
    'screensB.packages.sessionsUsed': 'الجلسات المستخدمة من {name}',
    'screensB.packages.usedOf': 'استُخدمت {used} من {total}',
    'screensB.packages.bookSession': 'احجز جلسة',
    'screensB.packages.available': 'الباقات المتاحة',
    'screensB.packages.mostPopular': 'الأكثر رواجًا',
    'screensB.packages.save': 'وفّر {amount}',
    'screensB.packages.perSession': '{amount} / جلسة',
    'screensB.packages.inAccount': 'في حسابك',
    'screensB.packages.buy': 'اشترِ الباقة',
    'screensB.packages.toastAlready': '{name} موجودة في حسابك بالفعل',
    'screensB.packages.toastAdded':
      'تمت إضافة {name} — عرض توضيحي فقط، بلا خصم',
    'screensB.packages.note':
      'تبقى الجلسات صالحة 12 شهرًا، ويمكن إهداؤها مرة واحدة، وتُردّ قيمتها بالتناسب. هذا عرض توضيحي — لا يُخصم شيء.',

    /* --- Policy --- */
    'screensB.policy.title': 'سياسة الإلغاء',
    'screensB.policy.sub':
      'الخطط تتغير — نتفهم ذلك. إليك كيف تعمل سياستنا، بلغة واضحة.',
    'screensB.policy.windowTitle': 'مهلة 24 ساعة',
    'screensB.policy.windowBody':
      'ألغِ أو أعد الجدولة حتى 24 ساعة قبل موعد البدء مجانًا، مباشرة من إدارة الحجز.',
    'screensB.policy.lateTitle': 'الإلغاء المتأخر وعدم الحضور',
    'screensB.policy.lateBody':
      'خلال آخر 24 ساعة تُطبَّق رسوم 50%. ويُحتسب عدم الحضور بالكامل حتى لا يبقى الكرسي فارغًا.',
    'screensB.policy.howTitle': 'كيفية الإلغاء',
    'screensB.policy.howBody':
      'اذهب إلى إدارة الحجز، وأدخل رمزك وبريدك الإلكتروني، ثم اختر إعادة الجدولة أو الإلغاء — دون حاجة إلى مكالمة.',
    'screensB.policy.membersTitle': 'الأعضاء والباقات',
    'screensB.policy.membersBody':
      'يحصل أعضاء Studio Circle على إلغاء متأخر واحد بلا رسوم كل شهر. أما جلسات الباقات فتعود ببساطة إلى رصيدك.',
    'screensB.policy.banner':
      'هذه سياسة توضيحية للعرض فقط — لا تُحصَّل أي رسوم فعليًا.',

    /* --- Post --- */
    'screensB.post.back': 'العودة إلى المدوّنة',
    'screensB.post.emptyTitle': 'هذه المقالة ليست هنا',
    'screensB.post.emptyBody':
      'ربما أُلغي نشرها. كل ما كتبناه موجود في فهرس المدوّنة.',
    'screensB.post.browse': 'تصفّح المدوّنة',
    'screensB.post.byline': '{date} · {read}',
    'screensB.post.more': 'المزيد من المدوّنة',

    /* --- Refer --- */
    'screensB.refer.title': 'ادعُ صديقًا',
    'screensB.refer.sub':
      'امنح {amount} واحصل على {amount}. الجميع يخرج مشرقًا.',
    'screensB.refer.yourCode': 'رمز دعوتك',
    'screensB.refer.copyLink': 'انسخ رابط الدعوة',
    'screensB.refer.toastCopied': 'تم نسخ رابط الدعوة إلى الحافظة',
    'screensB.refer.yourInvites': 'دعواتك',

    /* --- Reviews --- */
    'screensB.reviews.justNow': 'الآن',
    'screensB.reviews.total': '{reviews} تقييمات · {specialists} متخصصين',
    'screensB.reviews.starRow': '{stars}★',
    'screensB.reviews.composeSent': 'تقييمك منشور',
    'screensB.reviews.composeTitle': 'زرتنا مؤخرًا؟ أخبرنا كيف كانت التجربة',
    'screensB.reviews.thanks':
      'شكرًا لك — تقييمك منشور في أعلى القائمة. يمكنك تعديله خلال 24 ساعة.',
    'screensB.reviews.starsAria':
      '{count} نجمة|{count} نجمة|{count} نجمتان|{count} نجوم|{count} نجمة|{count} نجمة',
    'screensB.reviews.placeholder':
      'كيف كانت الزيارة؟ هل من شيء ينبغي أن يعرفه الضيف التالي؟',
    'screensB.reviews.textareaLabel': 'تقييمك',
    'screensB.reviews.postingAs':
      'يُنشر باسم {name} · كانت زيارتك الأخيرة في {date}',
    'screensB.reviews.post': 'انشر التقييم',
    'screensB.reviews.errEmpty': 'اكتب سطرًا أو سطرين أولًا',
    'screensB.reviews.toastPosted': 'نُشر التقييم · عرض توضيحي فقط',
    'screensB.reviews.showing': 'عرض {shown} من {total}',
    'screensB.reviews.metaStaff': '{service} · مع {staff} · {date}',
    'screensB.reviews.metaStudio': '{service} · الاستوديو · {date}',
    'screensB.reviews.replyBy': 'ردّ {name}',
    'screensB.reviews.helpful': 'مفيد · {n}',
    'screensB.reviews.report': 'إبلاغ',
    'screensB.reviews.toastFlagged': 'تم الإبلاغ ليطّلع عليه الفريق',

    /* --- Rewards --- */
    'screensB.rewards.srTitle': 'مكافآت الولاء',
    'screensB.rewards.yourSpecialist': 'المتخصص الخاص بك',
    'screensB.rewards.yourBalance': 'رصيدك',
    'screensB.rewards.progressLabel': 'التقدم نحو مكافأتك التالية بقيمة {amount}',
    'screensB.rewards.canRedeem':
      'يمكنك استبدال المكافأة بقيمة {amount} الآن.',
    'screensB.rewards.toGo':
      'بقيت {count} نقطة حتى مكافأتك التالية بقيمة {amount}|بقيت {count} نقطة حتى مكافأتك التالية بقيمة {amount}|بقيت {count} نقطتان حتى مكافأتك التالية بقيمة {amount}|بقيت {count} نقاط حتى مكافأتك التالية بقيمة {amount}|بقيت {count} نقطة حتى مكافأتك التالية بقيمة {amount}|بقيت {count} نقطة حتى مكافأتك التالية بقيمة {amount}',
    'screensB.rewards.factEarned': 'المكتسبة هذا العام',
    'screensB.rewards.factRedeemed': 'المستبدلة',
    'screensB.rewards.factTier': 'المستوى',
    'screensB.rewards.tierCircle': 'Circle',
    'screensB.rewards.tierGuest': 'ضيف',
    'screensB.rewards.spendTitle': 'أنفق نقاطك',
    'screensB.rewards.redeemed': 'استُبدلت · في حسابك',
    'screensB.rewards.redeem': 'استبدال',
    'screensB.rewards.pointsToGo':
      'بقيت {count} نقطة|بقيت {count} نقطة|بقيت {count} نقطتان|بقيت {count} نقاط|بقيت {count} نقطة|بقيت {count} نقطة',
    'screensB.rewards.toastRedeemed': '{name} · أُضيفت إلى حسابك',
    'screensB.rewards.recentPoints': 'أحدث النقاط',
    'screensB.rewards.howPointsWork': 'كيف تعمل النقاط',

    /* --- Services --- */
    'screensB.services.title': 'الخدمات',
    'screensB.services.sub':
      'اختر ما يناسب مزاجك. يُؤكَّد كل حجز فورًا — ثم تختار المتخصص والوقت.',
    'screensB.services.filterLabel': 'تصفية حسب الفئة',

    /* --- Shop --- */
    'screensB.shop.title': 'الرف',
    'screensB.shop.sub':
      'كل ما نستخدمه فعلًا معك، بالأحجام التي نشتريها لأنفسنا. استلمه من الاستوديو أو اطلب شحنه.',
    'screensB.shop.removeOne': 'أزل واحدة من {name}',
    'screensB.shop.addAnother': 'أضف واحدة أخرى من {name}',
    'screensB.shop.addToBag': 'أضف إلى الحقيبة',
    'screensB.shop.toastAdded': 'أُضيفت {name} إلى حقيبتك',
    'screensB.shop.yourBag': 'حقيبتك',
    'screensB.shop.cartEmpty':
      'لا شيء في الحقيبة بعد. يمكن إضافة المنتجات إلى فاتورة زيارتك إن كنت تفضّل الدفع في الاستوديو.',
    'screensB.shop.lineQty': '{qty} × {price}',
    'screensB.shop.subtotal': 'المجموع الفرعي',
    'screensB.shop.checkout': 'إتمام الشراء',
    'screensB.shop.ship': 'الاستلام من الاستوديو مجانًا · الشحن {amount}',

    /* --- SignIn --- */
    'screensB.signin.errEmail': 'أدخل بريدًا إلكترونيًا صالحًا.',
    'screensB.signin.toastCodeSent': 'أُرسل الرمز · أي ستة أرقام تعمل',
    'screensB.signin.errCode': 'أدخل الأرقام الستة كلها للمتابعة.',
    'screensB.signin.toastSignedIn': 'تم تسجيل الدخول باسم {name}',
    'screensB.signin.welcome': 'أهلًا بعودتك',
    'screensB.signin.lede':
      'أدخل بريدك الإلكتروني وسنرسل رمزًا من ستة أرقام. لا كلمة مرور تُنسى.',
    'screensB.signin.fieldEmail': 'عنوان البريد الإلكتروني',
    'screensB.signin.remember': 'أبقني مسجل الدخول على هذا الجهاز',
    'screensB.signin.emailCode': 'أرسل لي رمزًا',
    'screensB.signin.or': 'أو',
    'screensB.signin.bookWithoutAccount': 'احجز دون حساب',
    'screensB.signin.foot':
      'هذا تسجيل دخول توضيحي — أي بريد إلكتروني يعمل ولا يُرسَل رمز فعليًا.',
    'screensB.signin.differentEmail': 'استخدم بريدًا إلكترونيًا آخر',
    'screensB.signin.checkInbox': 'تفقّد صندوق الوارد',
    'screensB.signin.sentTo': 'أرسلنا رمزًا من ستة أرقام إلى {email}',
    'screensB.signin.yourInbox': 'صندوق الوارد لديك',
    'screensB.signin.codeLabel': 'رمز تسجيل الدخول المكوّن من ستة أرقام',
    'screensB.signin.verify': 'تحقق وسجّل الدخول',
    'screensB.signin.didntGet': 'لم يصلك؟',
    'screensB.signin.resend': 'أعد إرسال الرمز',
    'screensB.signin.toastNewCode': 'رمز جديد في الطريق',
    'screensB.signin.demoHint': 'ملاحظة توضيحية: أي ستة أرقام تكفي.',

    /* --- Staff --- */
    'screensB.staff.dirTitle': 'من يقفون خلف الكراسي',
    'screensB.staff.dirLede':
      'أربعة متخصصين، لكل منهم ساعاته وأسلوبه. اختر من يناسبك — أو دعنا نرشّح لك.',
    'screensB.staff.nextFree': 'أقرب موعد متاح · {when}',
    'screensB.staff.viewProfile': 'اعرض الملف',
    'screensB.staff.allSpecialists': 'كل المتخصصين',
    'screensB.staff.since': '{role} · في الاستوديو منذ {year}',
    'screensB.staff.knownFor': 'يتميّز بـ',
    'screensB.staff.guestsSay': 'ما يقوله الضيوف',
    'screensB.staff.quoteMeta': '{service} · {date}',
    'screensB.staff.statRating': 'متوسط التقييم',
    'screensB.staff.statReviews': 'التقييمات',
    'screensB.staff.statYears': 'في الاستوديو',
    'screensB.staff.joinWaitlist': 'انضم إلى قائمة انتظاره',
    'screensB.staff.usualWeek': 'الأسبوع المعتاد',
    'screensB.staff.hourRange': '{from} – {to}',
    'screensB.staff.off': 'إجازة',
    'screensB.staff.servicesOffered': 'الخدمات التي يقدمها {name}',

    /* --- Visits --- */
    'screensB.visits.title': 'زياراتي القادمة',
    'screensB.visits.sub': 'كل ما حجزته لدينا.',
    'screensB.visits.emptyTitle': 'لا حجوزات بعد',
    'screensB.visits.emptyBody':
      'حين تحجز زيارة ستظهر هنا بكل تفاصيلها.',
    'screensB.visits.bookVisit': 'احجز زيارة',
    'screensB.visits.appointment': 'موعد',
    'screensB.visits.repeats':
      'يتكرر {freq} · {count} زيارة|يتكرر {freq} · {count} زيارة|يتكرر {freq} · {count} زيارتان|يتكرر {freq} · {count} زيارات|يتكرر {freq} · {count} زيارة|يتكرر {freq} · {count} زيارة',
    'screensB.visits.manage': 'إعادة الجدولة أو الإلغاء',

    /* --- Waitlist --- */
    'screensB.waitlist.title': 'قائمة الانتظار',
    'screensB.waitlist.lede':
      'تحدث الإلغاءات في معظم الأيام. أخبرنا بما تريد وسنراسلك فور توفر موعد.',
    'screensB.waitlist.joinTitle': 'انضم إلى القائمة',
    'screensB.waitlist.groupService': 'أي خدمة؟',
    'screensB.waitlist.groupDays': 'الأيام المناسبة',
    'screensB.waitlist.groupTime': 'وقت اليوم',
    'screensB.waitlist.groupNotify': 'أبلغني عبر',
    'screensB.waitlist.winMornings': 'الصباح',
    'screensB.waitlist.winAfternoons': 'بعد الظهر',
    'screensB.waitlist.winEvenings': 'المساء',
    'screensB.waitlist.notifyText': 'رسالة نصية',
    'screensB.waitlist.notifyEmail': 'البريد الإلكتروني',
    'screensB.waitlist.notifyPush': 'إشعار فوري',
    'screensB.waitlist.oddsMany':
      'مع هذا العدد من الأيام المتاحة، يصل الرد إلى معظم الضيوف خلال 48 ساعة.',
    'screensB.waitlist.oddsSome':
      'يومان أو ثلاثة يعني عادة انتظار بضعة أيام في هذا الوقت من السنة.',
    'screensB.waitlist.oddsOne':
      'يوم واحد فقط قد يستغرق أسبوعين — أضف يومًا آخر إن أمكن.',
    'screensB.waitlist.addMe': 'أضفني إلى القائمة',
    'screensB.waitlist.errPickDay': 'اختر يومًا مناسبًا واحدًا على الأقل',
    'screensB.waitlist.toastJoinedText':
      'أنت على القائمة · سنتواصل معك برسالة نصية',
    'screensB.waitlist.toastJoinedEmail':
      'أنت على القائمة · سنتواصل معك بالبريد الإلكتروني',
    'screensB.waitlist.toastJoinedPush':
      'أنت على القائمة · سنتواصل معك بإشعار فوري',
    'screensB.waitlist.waitingOn': 'أنت في انتظار',
    'screensB.waitlist.emptyTitle': 'لا شيء بعد',
    'screensB.waitlist.emptyBody':
      'سجّل نفسك عبر النموذج وسيظهر ترتيبك في الصف هنا.',
    'screensB.waitlist.toastWidened':
      'وُسِّعت النافذة · سننظر في أيام أكثر',
    'screensB.waitlist.flexible': 'مرن',
    'screensB.waitlist.entryStaffDate': 'مع {staff} · {date}',
    'screensB.waitlist.entryAnyDate': 'أي متخصص · {date}',
    'screensB.waitlist.inLine': 'الترتيب {pos} في الصف',
    'screensB.waitlist.oddsNext':
      'أنت التالي — سنراسلك فور توفر موعد.',
    'screensB.waitlist.oddsWait':
      'انتظار نحو {count} يوم في هذا الوقت من السنة.|انتظار نحو {count} يوم في هذا الوقت من السنة.|انتظار نحو {count} يومين في هذا الوقت من السنة.|انتظار نحو {count} أيام في هذا الوقت من السنة.|انتظار نحو {count} يومًا في هذا الوقت من السنة.|انتظار نحو {count} يوم في هذا الوقت من السنة.',
    'screensB.waitlist.widen': 'وسّع نافذتي',

    /* --- WaitlistStatus --- */
    'screensB.wstatus.title': 'حالة قائمة الانتظار',
    'screensB.wstatus.sub':
      'الأيام التي تنتظرها — سنراسلك فور توفر مكان.',
    'screensB.wstatus.emptyTitle': 'لست على أي قائمة انتظار',
    'screensB.wstatus.emptyBody':
      'إذا كان اليوم محجوزًا بالكامل، انضم إلى قائمة انتظاره من خطوة التاريخ والوقت وسيظهر هنا.',
    'screensB.wstatus.flexible': 'مرن',
    'screensB.wstatus.whenWho': '{date} · {who}',
    'screensB.wstatus.waiting': 'في انتظار موعد شاغر',
  },
} satisfies Record<LocaleTag, Record<string, string>>;
