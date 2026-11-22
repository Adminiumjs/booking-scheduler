/**
 * What the website's demo card offers for Lumen Studio: the guest's fifteen
 * screens and the studio desk's nine (no Overview, no Calendars: C1), the
 * shortcuts that do something on them, the two people, the clock, and the
 * card's words in its eight languages. `vite.config.ts` writes `demo.json` from
 * it in the demo build; the bridge answers to its ids.
 *
 * A LABEL THAT NAMES A FIGURE READS IT FROM THE SAMPLE (L4-F9). "Gel, Anyone,
 * Thu 10 AM", "Sat is full", "Fill LMN-1807 and Ava's e-mail", "Let go after 15
 * min", "Offer Sat 10 AM to Theo": each is a whole sentence in eight languages
 * filled with values read from the sample's own world when the file is
 * written, with the weekday and the time in that language's form, so they
 * cannot drift from the data. `card.test.ts` holds them to `figures.md`.
 *
 * DEMO ONLY: no surface bundle imports it.
 */
import type { DemoEmitOptions } from "../../demo-emit.ts";
import { DEMO_LOCALES } from "../demo-types.ts";
import { fmtDay, fmtTime, type Clock } from "../customer/format.ts";
import { AVA, ANCHOR_DAY, DEMO_ZONE, WORLD, dayAt } from "./sample.ts";

type Locale = (typeof DEMO_LOCALES)[number];
type Eight = [string, string, string, string, string, string, string, string];

// ── the sample's own values ─────────────────────────────────────────────────

const first = (name: string) => name.split(" ")[0]!;
const hhmm = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
const serviceName = (id: string) => WORLD.services.find((s) => s.id === id)!.name;
const person = (id: string) => WORLD.team.find((t) => t.id === id)!;
const bookingOf = (code: string) => WORLD.bookings.find((b) => b.code === code)!;

/** Ava's next visit, the one "Your booking" and "Find your booking" open. */
const AVA_NEXT = WORLD.bookings.filter((b) => b.customer === AVA.id && b.state === "booked" && b.day >= 0).sort((a, b) => a.day - b.day || a.start.localeCompare(b.start))[0]!;
/** Ava's last visit, done and not yet reviewed: "How was it?" (BN-01). */
const AVA_LAST = WORLD.bookings.filter((b) => b.customer === AVA.id && b.state === "done" && b.review !== "reviewed").sort((a, b) => b.day - a.day)[0]!;
const DANA = WORLD.bookings.find((b) => b.day === 0 && b.state === "paying")!;
const MARCUS = WORLD.bookings.find((b) => b.day === 0 && b.state === "no_show")!;
const CLASH = bookingOf(WORLD.demoOnly.clash);
const THEO = WORLD.waitlist.find((w) => w.state === "waiting" && w.service === "cut")!;
const RECONNECTS = WORLD.team.find((t) => (WORLD.demoOnly.calendars as Record<string, { state: string }>)[t.id]?.state === "reconnect")!;
const UNLINKED = WORLD.team.find((t) => (WORLD.demoOnly.calendars as Record<string, { state: string }>)[t.id]?.state === "not-connected")!;

/** What the shortcuts act on, by the sample's own rows. */
export const SAMPLE_PICKS = {
  gel: { service: "gel", day: dayAt(2), minute: 600 },
  full: { service: "balayage", team: "elin", day: dayAt(4) },
  avaNext: AVA_NEXT.code,
  avaLast: AVA_LAST.code,
  avaEmail: AVA.email,
  avaName: AVA.name,
  dana: DANA.code,
  marcus: MARCUS.code,
  clash: CLASH.code,
  clashDay: dayAt(CLASH.day),
  rafa: RECONNECTS.id,
  marco: UNLINKED.id,
  theoName: THEO.customer,
  theoService: THEO.service,
  theoDay: dayAt(THEO.day),
  theoClock: hhmm(600),
  theoPerson: "rafa",
} as const;

const clockFor = (locale: string): Clock => ({ locale, timezone: DEMO_ZONE, currency: "USD" });
const noon = (day: string) => new Date(`${day}T12:00:00Z`);
const weekday = (locale: string, day: string) => {
  const text = new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: "short" }).format(noon(day));
  return locale.startsWith("en") ? text.replace(/\.$/, "") : text;
};
const whenOf = (locale: string, day: string, minute: number) => `${weekday(locale, day)} ${fmtTime(clockFor(locale), minute)}`;

const HOLD = Number((WORLD.settings as Record<string, unknown>)["hold_min"] ?? 15);
const CANCEL = Number((WORLD.settings as Record<string, unknown>)["cancel_hours"] ?? 24);

/** A sentence's values in a language. */
function valuesIn(locale: string): Record<string, string> {
  const cut = person(SAMPLE_PICKS.full.team).name;
  return {
    gel: first(serviceName("gel")),
    gelWhen: whenOf(locale, SAMPLE_PICKS.gel.day, SAMPLE_PICKS.gel.minute),
    balayage: serviceName("balayage"),
    elin: first(cut),
    satDay: weekday(locale, SAMPLE_PICKS.full.day),
    code: SAMPLE_PICKS.avaNext,
    ava: first(AVA.name),
    reformer: first(serviceName(AVA_NEXT.service)),
    hold: String(HOLD),
    cancel: String(CANCEL),
    dana: first(WORLD.customers.find((c) => c.id === DANA.customer)!.name),
    marcus: first(WORLD.customers.find((c) => c.id === MARCUS.customer)!.name),
    noor: first(person(CLASH.team).name),
    clashDay: fmtDay(clockFor(locale), dayAt(CLASH.day)),
    rafa: first(RECONNECTS.name),
    marco: first(UNLINKED.name),
    theo: first(THEO.customer),
    offerWhen: whenOf(locale, dayAt(THEO.day), 600),
  };
}

// ── the card's words ────────────────────────────────────────────────────────

/** Each label in the eight languages, in the order of `DEMO_LOCALES`: en, de, fr, da, cs, ar, zh-CN, zh-TW. */
const WORDS: Record<string, Eight> = {
  "screen.page": ["Booking page", "Buchungsseite", "Page de réservation", "Bookingside", "Rezervační stránka", "صفحة الحجز", "预约页面", "預約頁面"],
  "screen.book": ["Book", "Buchen", "Réserver", "Book", "Rezervovat", "احجز", "预约", "預約"],
  "screen.paying": ["Paying", "Bezahlen", "Paiement", "Betaling", "Platba", "الدفع", "付款", "付款"],
  "screen.booked": ["Booked", "Gebucht", "Réservé", "Booket", "Rezervováno", "تم الحجز", "已预约", "已預約"],
  "screen.yours": ["Your booking", "Deine Buchung", "Votre réservation", "Din booking", "Vaše rezervace", "حجزك", "你的预约", "你的預約"],
  "screen.find": ["Find your booking", "Buchung finden", "Retrouver sa réservation", "Find din booking", "Najít rezervaci", "ابحث عن حجزك", "查找预约", "查詢預約"],
  "screen.visits": ["Your visits", "Deine Besuche", "Vos visites", "Dine besøg", "Vaše návštěvy", "زياراتك", "你的到访", "你的到訪"],
  "screen.wait": ["Waiting list", "Warteliste", "Liste d'attente", "Venteliste", "Čekací listina", "قائمة الانتظار", "候补名单", "候補名單"],
  "screen.how": ["How was it?", "Wie war es?", "C'était comment ?", "Hvordan var det?", "Jaké to bylo?", "كيف كانت؟", "体验如何？", "體驗如何？"],
  "screen.reviews": ["Reviews", "Bewertungen", "Avis", "Anmeldelser", "Recenze", "التقييمات", "评价", "評價"],
  "screen.gifts": ["Gift cards", "Geschenkkarten", "Cartes cadeaux", "Gavekort", "Dárkové karty", "بطاقات الهدايا", "礼品卡", "禮物卡"],
  "screen.packs": ["Packs", "Pakete", "Forfaits", "Klippekort", "Balíčky", "الباقات", "套餐", "套餐"],
  "screen.web": ["On your website", "Auf deiner Website", "Sur votre site", "På din hjemmeside", "Na vašem webu", "على موقعك", "在你的网站上", "在你的網站上"],
  "screen.help": ["Help", "Hilfe", "Aide", "Hjælp", "Nápověda", "المساعدة", "帮助", "說明"],
  "screen.404": ["404", "404", "404", "404", "404", "404", "404", "404"],

  "screen.today": ["Today", "Heute", "Aujourd'hui", "I dag", "Dnes", "اليوم", "今天", "今天"],
  "screen.cal": ["Calendar", "Kalender", "Calendrier", "Kalender", "Kalendář", "التقويم", "日历", "行事曆"],
  "screen.new": ["New booking", "Neue Buchung", "Nouvelle réservation", "Ny booking", "Nová rezervace", "حجز جديد", "新建预约", "新增預約"],
  "screen.clients": ["Clients", "Kundschaft", "Clients", "Kunder", "Klienti", "العملاء", "客户", "客戶"],
  "screen.services": ["Services", "Leistungen", "Prestations", "Behandlinger", "Služby", "الخدمات", "服务", "服務"],
  "screen.team": ["Team", "Team", "Équipe", "Team", "Tým", "الفريق", "团队", "團隊"],
  "screen.dwait": ["Waiting list", "Warteliste", "Liste d'attente", "Venteliste", "Čekací listina", "قائمة الانتظار", "候补名单", "候補名單"],
  "screen.dreviews": ["Reviews", "Bewertungen", "Avis", "Anmeldelser", "Recenze", "التقييمات", "评价", "評價"],
  "screen.settings": ["Settings", "Einstellungen", "Paramètres", "Indstillinger", "Nastavení", "الإعدادات", "设置", "設定"],

  "do.taken": ["Someone takes your time", "Jemand nimmt deinen Termin", "Quelqu'un prend votre créneau", "En anden tager din tid", "Někdo vám vezme termín", "شخص آخر يأخذ موعدك", "有人抢先订了这个时间", "有人搶先訂了這個時間"],
  "do.paid": ["Paid", "Bezahlt", "Payé", "Betalt", "Zaplaceno", "تم الدفع", "已付款", "已付款"],
  "do.bank": ["Bank is confirming", "Die Bank bestätigt noch", "La banque confirme", "Banken bekræfter", "Banka platbu potvrzuje", "البنك يؤكد الدفع", "银行正在确认", "銀行正在確認"],
  "do.didnt": ["Didn't finish", "Nicht abgeschlossen", "Paiement non terminé", "Ikke gennemført", "Platba nedokončena", "لم يكتمل الدفع", "付款未完成", "付款未完成"],
  "do.after": ["After the visit", "Nach dem Besuch", "Après la visite", "Efter besøget", "Po návštěvě", "بعد الزيارة", "到访之后", "到訪之後"],
  "do.fillcode": ["Fill the code", "Code eintragen", "Saisir le code", "Udfyld koden", "Vyplnit kód", "املأ الرمز", "填入验证码", "填入驗證碼"],
  "do.inline": ["Inline", "Eingebettet", "Intégré", "Indlejret", "Vložené", "مضمّن", "内嵌", "內嵌"],
  "do.button": ["Button", "Schaltfläche", "Bouton", "Knap", "Tlačítko", "زر", "按钮", "按鈕"],
  "do.floating": ["Floating", "Schwebend", "Flottant", "Svævende", "Plovoucí", "عائم", "悬浮", "懸浮"],
  "do.drag": ["Drag onto a clean-up — refused", "Auf eine Aufräumzeit ziehen — abgelehnt", "Glisser sur un temps de remise en ordre — refusé", "Træk til en oprydning — afvist", "Přetáhnout na úklid — odmítnuto", "السحب إلى وقت التنظيف — مرفوض", "拖到整理时间 — 被拒绝", "拖到整理時間 — 被拒絕"],

  "persona.guest": ["Guest", "Gast", "Client", "Gæst", "Host", "الضيف", "顾客", "顧客"],
  "persona.desk": ["Studio desk", "Studio-Empfang", "Accueil du studio", "Studiets skranke", "Recepce studia", "مكتب الاستوديو", "工作室前台", "工作室櫃檯"],
  "clock.hour": ["+1 hour", "+1 Stunde", "+1 heure", "+1 time", "+1 hodina", "+1 ساعة", "+1 小时", "+1 小時"],
  "clock.morning": ["Next morning", "Nächster Morgen", "Lendemain matin", "Næste morgen", "Další ráno", "الصباح التالي", "第二天早上", "隔天早上"],
  "clock.reset": ["Back to Tuesday morning", "Zurück zum Dienstagmorgen", "Retour à mardi matin", "Tilbage til tirsdag morgen", "Zpět na úterní ráno", "العودة إلى صباح الثلاثاء", "回到星期二上午", "回到星期二上午"],
  "web.book": ["Book a visit", "Termin buchen", "Prendre rendez-vous", "Book en tid", "Rezervovat termín", "احجز موعدًا", "预约到访", "預約到訪"],
  "web.close": ["Close", "Schließen", "Fermer", "Luk", "Zavřít", "إغلاق", "关闭", "關閉"],
  "note.line": [
    "Demo: no money moves, no e-mail is sent, no calendar is touched",
    "Demo: Es fließt kein Geld, keine E-Mail geht raus, kein Kalender wird berührt",
    "Démo : aucun argent ne circule, aucun e-mail ne part, aucun calendrier n'est touché",
    "Demo: Ingen penge flyttes, ingen e-mail sendes, ingen kalender røres",
    "Demo: nepohnou se žádné peníze, neodejde žádný e-mail, žádný kalendář se nezmění",
    "عرض تجريبي: لا تتحرك أموال، ولا يُرسل بريد، ولا يُمس أي تقويم",
    "演示：不会扣款，不会发送邮件，也不会改动任何日历",
    "示範：不會扣款，不會寄出電子郵件，也不會更動任何行事曆",
  ],
  "google.note": [
    "In the demo, Google reviews aren't loaded.",
    "In der Demo werden keine Google-Bewertungen geladen.",
    "Dans la démo, les avis Google ne sont pas chargés.",
    "I demoen indlæses Google-anmeldelser ikke.",
    "V ukázce se recenze Google nenačítají.",
    "في العرض التجريبي لا يتم تحميل تقييمات Google.",
    "演示中不会加载 Google 评价。",
    "示範中不會載入 Google 評論。",
  ],
};

/** The labels that carry the sample's own values: a whole sentence per language, with its gaps named. */
const SENTENCES: Record<string, Eight> = {
  "do.gel": ["{gel}, Anyone, {gelWhen}", "{gel}, beliebig, {gelWhen}", "{gel}, peu importe, {gelWhen}", "{gel}, hvem som helst, {gelWhen}", "{gel}, kdokoli, {gelWhen}", "{gel}، أي شخص، {gelWhen}", "{gel}，任意人员，{gelWhen}", "{gel}，任意人員，{gelWhen}"],
  "do.full": ["{balayage} with {elin} — {satDay} is full", "{balayage} bei {elin} — {satDay} ist voll", "{balayage} avec {elin} — {satDay} est complet", "{balayage} med {elin} — {satDay} er fuldt", "{balayage} s {elin} — {satDay} je plno", "{balayage} مع {elin} — {satDay} محجوز بالكامل", "{balayage}，{elin} — {satDay}已满", "{balayage}，{elin} — {satDay}已滿"],
  "do.letgo": ["Let go after {hold} min", "Nach {hold} Min. freigegeben", "Libéré après {hold} min", "Frigivet efter {hold} min", "Uvolněno po {hold} min", "يُلغى الحجز بعد {hold} دقيقة", "{hold} 分钟后释放", "{hold} 分鐘後釋出"],
  "do.reformer": ["{ava}'s {reformer}", "{ava}s {reformer}", "{reformer} d'{ava}", "{ava}s {reformer}", "{reformer} pro {ava}", "{reformer} لـ {ava}", "{ava} 的 {reformer}", "{ava} 的 {reformer}"],
  "do.inside": ["Inside {cancel} hours", "Innerhalb von {cancel} Stunden", "Moins de {cancel} heures avant", "Inden for {cancel} timer", "Do {cancel} hodin", "خلال {cancel} ساعة", "{cancel} 小时内", "{cancel} 小時內"],
  "do.fill": ["Fill {code} and {ava}'s e-mail", "{code} und {ava}s E-Mail eintragen", "Saisir {code} et l'e-mail d'{ava}", "Udfyld {code} og {ava}s e-mail", "Vyplnit {code} a e-mail {ava}", "املأ {code} وبريد {ava}", "填入 {code} 和 {ava} 的邮箱", "填入 {code} 和 {ava} 的電子郵件"],
  "do.rate5": ["Rate it 5", "Mit 5 bewerten", "Noter 5", "Giv 5", "Ohodnotit 5", "قيّمها 5", "评 5 分", "評 5 分"],
  "do.rate2": ["Rate it 2", "Mit 2 bewerten", "Noter 2", "Giv 2", "Ohodnotit 2", "قيّمها 2", "评 2 分", "評 2 分"],
  "do.dana": ["{dana}'s deposit lands", "{dana}s Anzahlung kommt an", "L'acompte de {dana} arrive", "{dana}s depositum lander", "Záloha od {dana} dorazí", "وصل عربون {dana}", "{dana} 的定金到账", "{dana} 的訂金入帳"],
  "do.marcus": ["{marcus}'s no-show", "{marcus} ist nicht gekommen", "Absence de {marcus}", "{marcus} mødte ikke op", "{marcus} nepřišel", "غياب {marcus}", "{marcus} 未到场", "{marcus} 未到場"],
  "do.noor": ["{noor}'s calendar clash", "Kalenderkonflikt bei {noor}", "Conflit d'agenda de {noor}", "{noor}s kalenderkonflikt", "Kolize v kalendáři: {noor}", "تعارض في تقويم {noor}", "{noor} 的日历冲突", "{noor} 的行事曆衝突"],
  "do.show": ["Show {clashDay}", "{clashDay} zeigen", "Afficher {clashDay}", "Vis {clashDay}", "Zobrazit {clashDay}", "اعرض {clashDay}", "显示 {clashDay}", "顯示 {clashDay}"],
  "do.rafa": ["{rafa} reconnects", "{rafa} verbindet neu", "{rafa} se reconnecte", "{rafa} forbinder igen", "{rafa} se znovu připojí", "{rafa} يعيد الربط", "{rafa} 重新连接", "{rafa} 重新連接"],
  "do.marco": ["{marco} connects Google", "{marco} verbindet Google", "{marco} connecte Google", "{marco} forbinder Google", "{marco} připojí Google", "{marco} يربط Google", "{marco} 连接 Google", "{marco} 連接 Google"],
  "do.theo": ["Offer {offerWhen} to {theo}", "{theo} {offerWhen} anbieten", "Proposer {offerWhen} à {theo}", "Tilbyd {theo} {offerWhen}", "Nabídnout {theo} {offerWhen}", "اعرض {offerWhen} على {theo}", "向 {theo} 提供 {offerWhen}", "向 {theo} 提供 {offerWhen}"],
};

const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

export const CARD_MESSAGES: Record<Locale, Record<string, string>> = Object.fromEntries(
  DEMO_LOCALES.map((locale, i) => {
    const values = valuesIn(locale);
    return [locale, { ...Object.fromEntries(Object.entries(WORDS).map(([key, words]) => [key, words[i]!])), ...Object.fromEntries(Object.entries(SENTENCES).map(([key, words]) => [key, fill(words[i]!, values)])) }];
  }),
) as Record<Locale, Record<string, string>>;

/** A card string in a language, English when the language is not one of the card's. */
export function cardWord(locale: string, key: string): string {
  return CARD_MESSAGES[(DEMO_LOCALES as readonly string[]).includes(locale) ? (locale as Locale) : "en-US"][key] ?? key;
}

/** The one line the demo draws where Google's reviews would load. */
export const googleNote = (locale: string): string => cardWord(locale, "google.note");

/** The clock as the card prints it, always with its minutes so the card reads it as a time (L4-F5). */
export function clockLine(instant: number, locale: string): string {
  const at = new Date(instant);
  const zone = { timeZone: DEMO_ZONE };
  if (locale.startsWith("en")) {
    const day = new Intl.DateTimeFormat("en-US", { ...zone, weekday: "short" }).format(at);
    const date = new Intl.DateTimeFormat("en-US", { ...zone, day: "numeric" }).format(at);
    const month = new Intl.DateTimeFormat("en-US", { ...zone, month: "short" }).format(at);
    const time = new Intl.DateTimeFormat("en-US", { ...zone, hour: "numeric", minute: "2-digit" }).format(at).replace(/\s/g, " ");
    return `${day} ${date} ${month} · ${time}`;
  }
  const day = new Intl.DateTimeFormat(locale, { ...zone, weekday: "short", day: "numeric", month: "short" }).format(at);
  const time = new Intl.DateTimeFormat(locale, { ...zone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(at);
  return `${day} · ${time}`;
}

// ── the declaration ─────────────────────────────────────────────────────────

type Screen = DemoEmitOptions["screens"][number];
type Shortcut = [id: string, icon: string];

const shortcutsOf = (list: Shortcut[] | undefined) => (list === undefined ? {} : { shortcuts: list.map(([id, icon]) => ({ id, icon, labelKey: `do.${id}` })) });
const guest = (id: string, view: string, icon: string, shortcuts?: Shortcut[]): Screen => ({ id, view, icon, side: "customer", persona: "guest", labelKey: `screen.${id}`, ...shortcutsOf(shortcuts) });
const desk = (id: string, view: string, icon: string, shortcuts?: Shortcut[]): Screen => ({ id, view, icon, side: "staff", persona: "desk", labelKey: `screen.${id}`, ...shortcutsOf(shortcuts) });

/** The card's declaration; `messages` is added where it is emitted. */
export const DEMO_CARD: Omit<DemoEmitOptions, "messages"> = {
  appKey: "bookings",
  dir: "booking-scheduler",
  frames: ["desktop", "phone"],
  personas: [
    { id: "guest", icon: "user", labelKey: "persona.guest" },
    { id: "desk", icon: "store", labelKey: "persona.desk" },
  ],
  screens: [
    guest("page", "home", "sun"),
    guest("book", "book", "calendar-plus", [
      ["gel", "wand-sparkles"],
      ["full", "calendar-x"],
      ["taken", "users"],
    ]),
    guest("paying", "paid", "credit-card", [
      ["paid", "check"],
      ["bank", "hourglass"],
      ["didnt", "circle-x"],
      ["letgo", "timer-off"],
    ]),
    guest("booked", "booking", "calendar-check"),
    guest("yours", "booking", "calendar-clock", [
      ["reformer", "calendar-clock"],
      ["inside", "alarm-clock"],
      ["after", "star"],
    ]),
    guest("find", "find", "search", [
      ["fill", "wand-sparkles"],
      ["fillcode", "key-round"],
    ]),
    guest("visits", "account", "user"),
    guest("wait", "book", "list-plus"),
    guest("how", "review", "star", [
      ["rate5", "star"],
      ["rate2", "star-half"],
    ]),
    guest("reviews", "reviews", "message-square-quote"),
    guest("gifts", "giftCards", "gift"),
    guest("packs", "packs", "layers"),
    guest("web", "website", "app-window", [
      ["inline", "panel-top"],
      ["button", "mouse-pointer-click"],
      ["floating", "circle-dot"],
    ]),
    guest("help", "help", "life-buoy"),
    guest("404", "notFound", "file-x"),
    desk("today", "today", "sun", [
      ["dana", "check"],
      ["marcus", "user-x"],
      ["noor", "calendar-x"],
    ]),
    desk("cal", "calendar", "calendar-days", [
      ["drag", "ban"],
      ["show", "calendar-days"],
    ]),
    desk("new", "new", "calendar-plus"),
    desk("clients", "clients", "users"),
    desk("services", "services", "scissors"),
    desk("team", "team", "id-card", [
      ["rafa", "refresh-cw"],
      ["marco", "calendar-sync"],
    ]),
    desk("dwait", "waiting", "list-plus", [["theo", "send"]]),
    desk("dreviews", "reviews", "star"),
    desk("settings", "settings", "settings"),
  ],
  clock: {
    advance: [
      { id: "hour", labelKey: "clock.hour" },
      { id: "morning", labelKey: "clock.morning" },
    ],
    reset: { labelKey: "clock.reset" },
  },
};

export const ANCHOR = ANCHOR_DAY;
