/*
 * The single Zustand store (port spec §6.0), minus the window width — ruling
 * R8 makes the 900px breakpoint a real CSS media query, so no viewport size
 * lives in state.
 *
 * Everything the comp mutated imperatively (`this.week`, `this.booked`,
 * `this.myBookings`, `this.myGifts`) lives here too, so React always sees the
 * change.
 *
 * Screens are pure views: they call actions and read fields, never touch
 * `demo.ts`, and never compute availability themselves — use the `useSlots*`
 * hooks at the bottom of this file.
 */

import { useMemo } from "react";
import { create } from "zustand";

import { data } from "../data/source.ts";
import type {
  AccountProfile,
  Appointment,
  Booking,
  CategoryFilter,
  GiftAmount,
  GiftCard,
  GiftSend,
  GiftStep,
  IntakePressure,
  IntakeState,
  GroupGuest,
  NotifPrefs,
  OwnedPackage,
  Persona,
  RecurFreq,
  ReminderWhen,
  SignInStep,
  StaffSelection,
  Theme,
  Toast,
  ToastKind,
  View,
  WaitlistEntry,
} from "../data/types.ts";
import { bookingCode, giftCode, groupCode } from "../lib/codes.ts";
import { isoOf, isValidEmail, isValidPhone } from "../lib/format.ts";
import type { DaySummary, Slot, SlotContext, SlotGroup } from "../lib/slots.ts";
import {
  daySummaries,
  firstOpenIndex,
  groupSlots,
  isDayFull,
  resolveStaffId,
  seriesDates,
  slotsFor,
} from "../lib/slots.ts";

/* ------------------------------------------------------------------ *
 * Constants
 * ------------------------------------------------------------------ */

/** Artificial slot-grid latency, in ms (spec §6.4). */
export const SKELETON_MS = 560;

/**
 * Which half of the product a view belongs to.
 *
 * Derived from the id rather than stored beside it, so the two can never
 * disagree: every studio view is `admin-` prefixed.
 */
export function personaOf(view: View): Persona {
  return view.startsWith("admin-") ? "studio" : "guest";
}
/** Toast lifetime, in ms (spec §6.13). */
export const TOAST_MS = 2600;
/** Where a "smooth scroll to section" lands: 66px header + 16px. */
export const SCROLL_OFFSET = 82;

/** The four booking-step labels. */
export const STEP_LABELS = ["Service", "Staff", "Date & time", "Your details"] as const;

/** Sections on the home screen the header/footer can scroll to. */
export type HomeAnchor = "team" | "visit";

export interface BookingForm {
  name: string;
  email: string;
  phone: string;
  note: string;
}

export type FormErrors = Partial<Record<"name" | "email" | "phone", string>>;

/* ------------------------------------------------------------------ *
 * Shape
 * ------------------------------------------------------------------ */

export interface StoreState {
  /* ---- chrome ---- */
  theme: Theme;
  view: View;
  menuOpen: boolean;
  /** Set by `goHomeScroll`; the home screen consumes and clears it. */
  homeScroll: HomeAnchor | null;
  toast: Toast | null;

  /* ---- catalogue filters ---- */
  /** Services screen category chip. */
  sCat: CategoryFilter;
  /** Booking step-0 category chip. */
  bCat: CategoryFilter;

  /* ---- booking draft ---- */
  step: number;
  svcId: string | null;
  staffSel: StaffSelection;
  /** Which specialist the picked slot resolved to under "first available". */
  slotStaff: string | null;
  dateIdx: number;
  /** Chosen start, minutes from midnight. */
  time: number | null;
  slotsLoading: boolean;
  rescheduleCode: string | null;
  form: BookingForm;
  errs: FormErrors;

  /* ---- reminders & recurrence ---- */
  remEmail: boolean;
  remSms: boolean;
  remWhen: ReminderWhen;
  recurOn: boolean;
  recurFreq: RecurFreq;
  recurCount: number;

  /* ---- session data ---- */
  week: Date[];
  appointments: Appointment[];
  bookings: Record<string, Booking>;
  waitlist: Record<string, WaitlistEntry>;
  gifts: GiftCard[];
  nextNum: number;
  lastCode: string | null;

  /* ---- manage ---- */
  mgCode: string;
  mgEmail: string;
  mgErr: string;
  foundCode: string | null;
  cancelCode: string | null;

  /* ---- loyalty ---- */
  member: boolean;
  points: number;

  /* ---- gift cards ---- */
  gcStep: GiftStep;
  gcAmount: GiftAmount;
  gcCustom: string;
  gcTheme: string;
  gcTo: string;
  gcToEmail: string;
  gcFrom: string;
  gcMsg: string;
  gcSend: GiftSend;
  gcDate: string;
  gcErr: string;
  gcNum: string;
  gcExp: string;
  gcCvc: string;
  gcName: string;
  gcCode: string | null;

  /* ---- group booking ---- */
  groupGuests: GroupGuest[];
  grpName: string;
  grpEmail: string;
  grpPhone: string;
  grpDateIdx: number;
  grpErr: string;
  grpCode: string | null;

  /* ---- intake ---- */
  intake: IntakeState;
  intakeDone: boolean;

  /* ================================================================== *
   * Added by the 2026-07-28 comp revision.
   *
   * The original sixteen screens above are untouched — the revision was
   * purely additive (37 guest screens where there were 16, plus a studio-side
   * Admin comp). Everything below backs one of the new screens.
   * ================================================================== */

  /** Which half of the product the dock is showing. */
  persona: Persona;

  /* ---- account, sign-in, notification preferences ---- */
  signedIn: boolean;
  acctMenu: boolean;
  acct: AccountProfile;
  np: NotifPrefs;
  siStep: SignInStep;
  siEmail: string;
  siCode: string;
  siErr: string;
  siRemember: boolean;

  /* ---- shop, cart, checkout ---- */
  shopCat: string;
  cart: Record<string, number>;
  ckMethod: string;
  ckTip: number;
  ckPromo: string;
  ckPromoOk: boolean;
  ckStep: string;
  ckCode: string | null;
  ckNum: string;
  ckExp: string;
  ckCvc: string;
  ckZip: string;

  /* ---- packages, rewards, offers ---- */
  planSel: string;
  planCycle: string;
  planStep: string;
  planStart: string;
  planName: string;
  planEmail: string;
  planPhone: string;
  pkgOwned: OwnedPackage[];
  rwRedeemed: Record<string, number>;
  rwPoints: number;

  /* ---- waitlist join form ---- */
  wlSvc: string;
  wlDays: string[];
  wlWin: string;
  wlNotify: string;

  /* ---- reviews ---- */
  rvFilter: string;
  rvStars: number;
  rvText: string;
  rvSent: boolean;
  rvHelpful: Record<string, number>;

  /* ---- careers ---- */
  carRole: string | null;
  carName: string;
  carEmail: string;
  carNote: string;
  carFile: boolean;
  carSent: boolean;

  /* ---- data export ---- */
  exFrom: string;
  exTo: string;
  exRange: string;
  exFmt: string;
  exState: string;
  exEmail: boolean;
  exInc: Record<string, boolean>;

  /* ---- blog, orders, help, event ---- */
  blogCat: string;
  post: string | null;
  blogEmail: string;
  ordFilter: string;
  helpQ: string;
  helpOpen: string;
  evtGuests: number;
  evtRsvp: boolean;
  /** Which code the copy button last copied, for the "Copied" flash. */
  copiedCode: string;
  /** Staff directory selection. */
  staffId: string | null;

  /* ================================================================== *
   * The studio half (Admin comp).
   * ================================================================== */

  /** Topbar search, shared across the studio screens. */
  query: string;

  /* ---- today + calendar ---- */
  dayOff: number;
  staffFilter: string;
  selAppt: string | null;
  apptState: Record<string, string>;
  apptTime: Record<string, number>;
  calMode: string;
  rooms: boolean;

  /* ---- point of sale ---- */
  posCat: string;
  posCart: Record<string, number>;
  posTip: number;
  posMethod: string;
  posDone: boolean;
  posGuest: string;

  /* ---- service pricing ---- */
  svcCat: string;
  prices: Record<string, string>;
  svcOff: Record<string, boolean>;

  /* ---- marketing, payroll, reports ---- */
  mkFilter: string;
  payPeriod: string;
  payRun: boolean;
  repRange: string;

  /* ---- clients ---- */
  clientFilter: string;
  clientSel: string | null;
  notes: Record<string, string>;

  /* ---- stock ---- */
  stockFilter: string;
  ordered: Record<string, number>;

  /* ---- studio-side review replies ---- */
  revFilter: string;
  replyOpen: string | null;
  replyDraft: string;
  replied: Record<string, string>;

  /* ---- studio settings ---- */
  setName: string;
  setAddr: string;
  setPhone: string;
  setEmail: string;
  setClosed: Record<number, boolean>;
  setWindow: string;
  setFee: string;
  setMsg: Record<string, boolean>;
}

export interface StoreActions {
  /* chrome */
  initTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  go: (view: View) => void;
  /** Switch halves. Lands on that persona's home screen. */
  setPersona: (persona: Persona) => void;
  /** The general-purpose patch the new screens use for their own fields. */
  set: (patch: Partial<StoreState>) => void;
  goHomeScroll: (anchor: HomeAnchor) => void;
  clearHomeScroll: () => void;
  setMenu: (open: boolean) => void;
  showToast: (msg: string, kind?: ToastKind) => void;
  dismissToast: () => void;
  /** Document-level Escape: closes the sheet and the cancel modal. */
  escape: () => void;

  /* filters */
  setSCat: (cat: CategoryFilter) => void;
  setBCat: (cat: CategoryFilter) => void;

  /* booking flow */
  startBooking: (serviceId?: string | null) => void;
  selectSvc: (serviceId: string) => void;
  pickStaff: (selection: StaffSelection) => void;
  changeDay: (index: number) => void;
  pickSlot: (min: number, staffId: string | null) => void;
  setStep: (step: number) => void;
  bookBack: () => void;
  step2Next: () => void;
  setField: (field: keyof BookingForm, value: string) => void;
  setRemEmail: (on: boolean) => void;
  setRemSms: (on: boolean) => void;
  setRemWhen: (when: ReminderWhen) => void;
  setRecurOn: (on: boolean) => void;
  setRecurFreq: (freq: RecurFreq) => void;
  setRecurCount: (n: number) => void;
  confirmBooking: () => void;

  /* manage */
  setMgCode: (v: string) => void;
  setMgEmail: (v: string) => void;
  findBooking: () => void;
  mgReset: () => void;
  openManage: (code: string, email: string) => void;
  startReschedule: () => void;
  confirmReschedule: () => void;
  openCancel: (code?: string) => void;
  closeCancel: () => void;
  confirmCancel: () => void;

  /* waitlist */
  joinWaitlist: (iso: string, staff: string) => void;
  leaveWaitlist: (key: string) => void;

  /* loyalty */
  loyaltyJoin: () => void;
  loyaltyRedeem: (cost: number, label: string) => void;

  /* gift cards */
  setGift: (patch: Partial<StoreState>) => void;
  setGiftAmount: (amount: GiftAmount) => void;
  setGiftCustom: (raw: string) => void;
  gcNext: () => void;
  gcBack: () => void;
  gcPay: () => void;
  gcReset: () => void;

  /* group */
  setGroupGuest: (index: number, patch: Partial<GroupGuest>) => void;
  addGuest: () => void;
  removeGuest: (index: number) => void;
  setGrpField: (field: "grpName" | "grpEmail" | "grpPhone", value: string) => void;
  setGrpDateIdx: (index: number) => void;
  grpSubmit: () => void;
  grpReset: () => void;

  /* intake */
  toggleConcern: (concern: string) => void;
  setAllergies: (v: string) => void;
  setPressure: (p: IntakePressure) => void;
  setConsent: (on: boolean) => void;
  intakeSubmit: () => void;
  intakeEdit: () => void;
}

export type Store = StoreState & StoreActions;

/* ------------------------------------------------------------------ *
 * Helpers (module-local)
 * ------------------------------------------------------------------ */

let toastTimer: ReturnType<typeof setTimeout> | null = null;
let skeletonTimer: ReturnType<typeof setTimeout> | null = null;
let toastSeq = 0;

function scrollTop(): void {
  if (typeof window !== "undefined") window.scrollTo(0, 0);
}

function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("bs-theme", theme);
  } catch {
    /* private mode — the toggle still works for the session. */
  }
}

function initialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem("bs-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* ignore */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** The context the slot engine needs, built from any store snapshot. */
export function selectSlotContext(state: StoreState): SlotContext {
  return {
    services: data.getServices(),
    staff: data.getStaff(),
    appointments: state.appointments,
    excludeCode: state.rescheduleCode,
  };
}

/** How far the stepper may jump (spec §4.8). */
export function reachMax(state: Pick<StoreState, "svcId" | "staffSel" | "time">): number {
  if (state.svcId && state.staffSel && state.time !== null) return 3;
  if (state.svcId && state.staffSel) return 2;
  if (state.svcId) return 1;
  return 0;
}

const EMPTY_FORM: BookingForm = { name: "", email: "", phone: "", note: "" };

const DEFAULT_GUESTS: GroupGuest[] = [
  { name: "", svc: "cut" },
  { name: "", svc: "facial" },
];

const seedWeek = data.getWeek();

/* ------------------------------------------------------------------ *
 * Store
 * ------------------------------------------------------------------ */

export const useStore = create<Store>()((set, get) => {
  /* -- internal helpers that need set/get -------------------------- */

  const pulseSkeleton = (): void => {
    if (skeletonTimer) clearTimeout(skeletonTimer);
    set({ slotsLoading: true });
    skeletonTimer = setTimeout(() => {
      skeletonTimer = null;
      set({ slotsLoading: false });
    }, SKELETON_MS);
  };

  const jumpToFirstOpen = (): void => {
    const s = get();
    const idx = firstOpenIndex(
      selectSlotContext(s),
      s.svcId,
      s.staffSel,
      s.week,
    );
    set({ dateIdx: idx, time: null, slotStaff: null });
    pulseSkeleton();
  };

  const toast = (msg: string, kind: ToastKind = "ok"): void => {
    if (toastTimer) clearTimeout(toastTimer);
    toastSeq += 1;
    set({ toast: { id: toastSeq, msg, kind } });
    toastTimer = setTimeout(() => {
      toastTimer = null;
      set({ toast: null });
    }, TOAST_MS);
  };

  return {
    /* ---------------- initial state ---------------- */
    theme: "light",
    view: "home",
    menuOpen: false,
    homeScroll: null,
    toast: null,

    sCat: "all",
    bCat: "all",

    step: 0,
    svcId: null,
    staffSel: null,
    slotStaff: null,
    dateIdx: 0,
    time: null,
    slotsLoading: false,
    rescheduleCode: null,
    form: { ...EMPTY_FORM },
    errs: {},

    remEmail: true,
    remSms: true,
    remWhen: "24h",
    recurOn: false,
    recurFreq: "1w",
    recurCount: 4,

    week: seedWeek,
    appointments: data.getSeedAppointments(),
    bookings: Object.fromEntries(
      data.getSeedBookings().map((b) => [b.code, b]),
    ),
    waitlist: Object.fromEntries(
      data.getSeedWaitlist().map((w) => [w.key, w]),
    ),
    gifts: data.getSeedGiftCards(),
    nextNum: data.getFirstCodeNumber(),
    lastCode: null,

    mgCode: "LMN-1039",
    mgEmail: "ava@example.com",
    mgErr: "",
    foundCode: null,
    cancelCode: null,

    member: false,
    points: data.getLoyaltyStartPoints(),

    gcStep: "design",
    gcAmount: 100,
    gcCustom: "",
    gcTheme: "bloom",
    gcTo: "",
    gcToEmail: "",
    gcFrom: "",
    gcMsg: "",
    gcSend: "now",
    gcDate: "",
    gcErr: "",
    gcNum: "",
    gcExp: "",
    gcCvc: "",
    gcName: "",
    gcCode: null,

    groupGuests: DEFAULT_GUESTS.map((g) => ({ ...g })),
    grpName: "",
    grpEmail: "",
    grpPhone: "",
    grpDateIdx: 0,
    grpErr: "",
    grpCode: null,

    intake: { concerns: {}, allergies: "", pressure: "medium", consent: false },
    intakeDone: false,

    /* ---- added by the 2026-07-28 revision (guest half) ---- */
    persona: "guest",

    signedIn: true,
    acctMenu: false,
    acct: {
      name: "Ava Reyes",
      email: "ava@example.com",
      phone: "(415) 555-0142",
      bday: "Mar 12",
      pref: "selma",
      contact: "sms",
      twofa: false,
    },
    np: {
      email: true,
      sms: true,
      push: false,
      when: "24h",
      quiet: true,
      quietWin: "10p8a",
      cat: {
        reminders: true,
        waitlist: true,
        loyalty: true,
        packages: true,
        journal: true,
        offers: false,
      },
    },
    siStep: "email",
    siEmail: "ava@example.com",
    siCode: "",
    siErr: "",
    siRemember: true,

    shopCat: "all",
    cart: {},
    ckMethod: "visa",
    ckTip: 18,
    ckPromo: "",
    ckPromoOk: false,
    ckStep: "pay",
    ckCode: null,
    ckNum: "",
    ckExp: "",
    ckCvc: "",
    ckZip: "",

    planSel: "glow",
    planCycle: "month",
    planStep: "pick",
    planStart: "today",
    planName: "Ava Reyes",
    planEmail: "ava@example.com",
    planPhone: "(415) 555-0182",
    pkgOwned: [{ id: "glow5", used: 2 }],
    rwRedeemed: {},
    rwPoints: 340,

    wlSvc: "gel",
    wlDays: ["tue", "thu"],
    wlWin: "afternoon",
    wlNotify: "sms",

    rvFilter: "all",
    rvStars: 5,
    rvText: "",
    rvSent: false,
    rvHelpful: {},

    carRole: null,
    carName: "",
    carEmail: "",
    carNote: "",
    carFile: false,
    carSent: false,

    exFrom: "2026-01-01",
    exTo: "2026-07-27",
    exRange: "ytd",
    exFmt: "csv",
    exState: "idle",
    exEmail: false,
    exInc: { visits: true, packages: true, gifts: false, products: false },

    blogCat: "all",
    post: null,
    blogEmail: "",
    ordFilter: "all",
    helpQ: "",
    helpOpen: "",
    evtGuests: 1,
    evtRsvp: false,
    copiedCode: "",
    staffId: null,

    /* ---- the studio half (Admin comp) ---- */
    query: "",

    dayOff: 0,
    staffFilter: "all",
    selAppt: null,
    apptState: {},
    apptTime: {},
    calMode: "day",
    rooms: false,

    posCat: "svc",
    posCart: {},
    posTip: 18,
    posMethod: "card",
    posDone: false,
    posGuest: "ava",

    svcCat: "all",
    prices: {},
    svcOff: {},

    mkFilter: "all",
    payPeriod: "week",
    payRun: false,
    repRange: "7d",

    clientFilter: "all",
    clientSel: null,
    notes: {},

    stockFilter: "all",
    ordered: {},

    revFilter: "todo",
    replyOpen: null,
    replyDraft: "",
    replied: {},

    /*
     * The studio's own details. The comp seeded these with the fictional
     * salon's name; the shipped app runs the Lumen Studio rebrand, so they
     * carry the rebranded strings — the comp is the visual spec, not the
     * naming one.
     */
    setName: "Lumen Studio",
    setAddr: "148 Alder Lane, Suite 2",
    setPhone: "(415) 555-0148",
    setEmail: "hello@lumenstudio.demo",
    setClosed: { 0: true },
    setWindow: "24h",
    setFee: "50",
    setMsg: { remind: true, followup: true, rebook: false, birthday: true },

    /* ---------------- chrome ---------------- */

    initTheme: () => {
      const theme = initialTheme();
      applyTheme(theme);
      set({ theme });
    },

    setTheme: (theme) => {
      applyTheme(theme);
      set({ theme });
    },

    toggleTheme: () => {
      const theme: Theme = get().theme === "dark" ? "light" : "dark";
      applyTheme(theme);
      set({ theme });
    },

    go: (view) => {
      /* Persona is derived from the view, never set alongside it — so a deep
       * link or a footer link into the other half switches the chrome too. */
      set({ view, menuOpen: false, persona: personaOf(view) });
      scrollTop();
    },

    setPersona: (persona) => {
      set({
        persona,
        view: persona === "guest" ? "home" : "admin-today",
        menuOpen: false,
      });
      scrollTop();
    },

    set: (patch) => set(patch),

    goHomeScroll: (anchor) => {
      set({ view: "home", menuOpen: false, homeScroll: anchor });
    },

    clearHomeScroll: () => set({ homeScroll: null }),

    setMenu: (open) => set({ menuOpen: open }),

    showToast: (msg, kind = "ok") => toast(msg, kind),

    dismissToast: () => {
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = null;
      set({ toast: null });
    },

    escape: () => set({ menuOpen: false, cancelCode: null }),

    /* ---------------- filters ---------------- */

    setSCat: (cat) => set({ sCat: cat }),
    setBCat: (cat) => set({ bCat: cat }),

    /* ---------------- booking flow ---------------- */

    startBooking: (serviceId = null) => {
      set({
        view: "booking",
        menuOpen: false,
        rescheduleCode: null,
        svcId: serviceId ?? null,
        staffSel: null,
        slotStaff: null,
        time: null,
        dateIdx: 0,
        step: serviceId ? 1 : 0,
        errs: {},
        bCat: "all",
      });
      scrollTop();
    },

    selectSvc: (serviceId) => {
      set({
        svcId: serviceId,
        staffSel: null,
        slotStaff: null,
        time: null,
        step: 1,
        errs: {},
      });
      scrollTop();
    },

    pickStaff: (selection) => {
      set({ staffSel: selection, slotStaff: null, time: null, step: 2 });
      jumpToFirstOpen();
      scrollTop();
    },

    changeDay: (index) => {
      if (get().dateIdx === index) return;
      set({ dateIdx: index, time: null, slotStaff: null });
      pulseSkeleton();
    },

    pickSlot: (min, staffId) => set({ time: min, slotStaff: staffId }),

    setStep: (step) => {
      const s = get();
      const locked = s.rescheduleCode !== null && step < 2;
      if (locked) return;
      if (step > Math.max(reachMax(s), s.step)) return;
      set({ step });
      scrollTop();
    },

    bookBack: () => {
      const s = get();
      if (s.rescheduleCode) {
        set({ rescheduleCode: null, view: "manage", time: null, slotStaff: null });
        scrollTop();
        return;
      }
      if (s.step > 0) {
        set({ step: s.step - 1 });
        scrollTop();
        return;
      }
      set({ view: "services" });
      scrollTop();
    },

    step2Next: () => {
      const s = get();
      if (s.time === null) return;
      if (s.rescheduleCode) {
        get().confirmReschedule();
        return;
      }
      set({ step: 3 });
      scrollTop();
    },

    setField: (field, value) => {
      const s = get();
      const errs = { ...s.errs };
      if (field !== "note") delete errs[field];
      set({ form: { ...s.form, [field]: value }, errs });
    },

    setRemEmail: (on) => set({ remEmail: on }),
    setRemSms: (on) => set({ remSms: on }),
    setRemWhen: (when) => set({ remWhen: when }),
    setRecurOn: (on) => set({ recurOn: on }),
    setRecurFreq: (freq) => set({ recurFreq: freq }),
    setRecurCount: (n) => set({ recurCount: Math.min(8, Math.max(2, n)) }),

    confirmBooking: () => {
      const s = get();
      const errs: FormErrors = {};
      if (!s.form.name.trim()) errs.name = "Please enter your name";
      if (!isValidEmail(s.form.email)) errs.email = "Enter a valid email address";
      if (!isValidPhone(s.form.phone)) errs.phone = "Enter a valid phone number";
      if (Object.keys(errs).length > 0) {
        set({ errs });
        toast("Please fix the highlighted fields", "warn");
        return;
      }

      const svc = data.getService(s.svcId);
      if (!svc || s.time === null) return;

      const ctx = selectSlotContext(s);
      const staffId = resolveStaffId(ctx, s.svcId, s.staffSel, s.slotStaff);
      if (!staffId) return;

      const iso = isoOf(s.week[s.dateIdx]);
      const code = bookingCode(s.nextNum);
      const series = s.recurOn
        ? seriesDates(iso, s.recurFreq, s.recurCount)
        : [iso];

      const added: Appointment[] = series.map((dateISO) => ({
        staffId,
        dateISO,
        start: s.time as number,
        dur: svc.dur,
        bookingCode: code,
      }));

      const booking: Booking = {
        code,
        svc: svc.id,
        staff: staffId,
        dateISO: iso,
        time: s.time,
        dur: svc.dur,
        price: svc.price,
        name: s.form.name.trim(),
        email: s.form.email.trim(),
        phone: s.form.phone.trim(),
        note: s.form.note.trim(),
        status: "confirmed",
        remEmail: s.remEmail,
        remSms: s.remSms,
        remWhen: s.remWhen,
        recurOn: s.recurOn,
        recurFreq: s.recurFreq,
        recurCount: s.recurOn ? s.recurCount : 1,
        series,
      };

      set({
        appointments: [...s.appointments, ...added],
        bookings: { ...s.bookings, [code]: booking },
        view: "confirm",
        lastCode: code,
        nextNum: s.nextNum + 1,
        errs: {},
      });
      scrollTop();
    },

    /* ---------------- manage ---------------- */

    setMgCode: (v) => set({ mgCode: v, mgErr: "" }),
    setMgEmail: (v) => set({ mgEmail: v, mgErr: "" }),

    findBooking: () => {
      const s = get();
      const code = (s.mgCode || "").toUpperCase().trim();
      const b = s.bookings[code];
      if (b && b.email.toLowerCase() === (s.mgEmail || "").toLowerCase().trim()) {
        set({ foundCode: code, mgErr: "" });
      } else {
        set({
          mgErr:
            "We couldn’t find a booking with that code and email. Double-check and try again.",
        });
      }
    },

    mgReset: () => set({ foundCode: null, mgErr: "" }),

    openManage: (code, email) => {
      set({
        view: "manage",
        menuOpen: false,
        mgCode: code,
        mgEmail: email,
        foundCode: code,
        mgErr: "",
      });
      scrollTop();
    },

    /*
     * R3 — nothing is deleted up front. The booking keeps its appointment and
     * the slot engine simply ignores it while `rescheduleCode` is set, so
     * backing out of the flow leaks nothing.
     */
    startReschedule: () => {
      const s = get();
      const code = s.foundCode;
      const b = code ? s.bookings[code] : undefined;
      if (!b) return;
      set({
        view: "booking",
        svcId: b.svc,
        staffSel: b.staff,
        slotStaff: null,
        time: null,
        step: 2,
        rescheduleCode: b.code,
        errs: {},
      });
      jumpToFirstOpen();
      scrollTop();
    },

    confirmReschedule: () => {
      const s = get();
      const code = s.rescheduleCode;
      const b = code ? s.bookings[code] : undefined;
      if (!b || !code || s.time === null) return;

      const ctx = selectSlotContext(s);
      const staffId = resolveStaffId(ctx, s.svcId, s.staffSel, s.slotStaff);
      if (!staffId) return;

      const iso = isoOf(s.week[s.dateIdx]);
      const series = b.recurOn
        ? seriesDates(iso, b.recurFreq, b.recurCount)
        : [iso];
      const moved: Booking = {
        ...b,
        staff: staffId,
        dateISO: iso,
        time: s.time,
        status: "confirmed",
        series,
      };
      const rebuilt: Appointment[] = series.map((dateISO) => ({
        staffId,
        dateISO,
        start: s.time as number,
        dur: b.dur,
        bookingCode: code,
      }));

      set({
        appointments: [
          ...s.appointments.filter((a) => a.bookingCode !== code),
          ...rebuilt,
        ],
        bookings: { ...s.bookings, [code]: moved },
        view: "manage",
        foundCode: code,
        rescheduleCode: null,
        time: null,
        slotStaff: null,
      });
      toast("Booking rescheduled", "ok");
      scrollTop();
    },

    openCancel: (code) => set({ cancelCode: code ?? get().foundCode }),

    closeCancel: () => set({ cancelCode: null }),

    /*
     * Cancelling releases the *whole* series, not just the first occurrence —
     * a cancelled booking should never keep blocking future slots.
     */
    confirmCancel: () => {
      const s = get();
      const code = s.cancelCode;
      const b = code ? s.bookings[code] : undefined;
      if (!b || !code) {
        set({ cancelCode: null });
        return;
      }
      set({
        appointments: s.appointments.filter((a) => a.bookingCode !== code),
        bookings: { ...s.bookings, [code]: { ...b, status: "cancelled" } },
        cancelCode: null,
      });
      toast("Appointment cancelled", "ok");
    },

    /* ---------------- waitlist ---------------- */

    joinWaitlist: (iso, staff) => {
      const s = get();
      if (!s.svcId) return;
      const key = `${iso}|${staff}`;
      set({
        waitlist: { ...s.waitlist, [key]: { key, staff, svc: s.svcId, iso } },
      });
      toast("You're on the waitlist — we'll text you", "ok");
    },

    leaveWaitlist: (key) => {
      const next = { ...get().waitlist };
      delete next[key];
      set({ waitlist: next });
      toast("Left the waitlist", "ok");
    },

    /* ---------------- loyalty ---------------- */

    loyaltyJoin: () => {
      set({ member: true });
      toast("Welcome to Studio Circle ✨", "ok");
    },

    loyaltyRedeem: (cost, label) => {
      const s = get();
      if (s.points < cost) {
        toast("Not enough points yet", "warn");
        return;
      }
      set({ points: s.points - cost });
      toast(`Redeemed: ${label}`, "ok");
    },

    /* ---------------- gift cards ---------------- */

    setGift: (patch) => set(patch as Partial<Store>),

    setGiftAmount: (amount) => set({ gcAmount: amount, gcErr: "" }),

    setGiftCustom: (raw) =>
      set({ gcCustom: raw.replace(/[^0-9.]/g, ""), gcAmount: "custom", gcErr: "" }),

    gcNext: () => {
      const s = get();
      if (s.gcStep === "design") {
        if (giftAmountValue(s) < 10) {
          set({ gcErr: "Choose an amount of at least $10." });
          return;
        }
        set({ gcStep: "details", gcErr: "" });
      } else if (s.gcStep === "details") {
        if (!s.gcTo.trim() || !s.gcFrom.trim() || !isValidEmail(s.gcToEmail)) {
          set({ gcErr: "Add the recipient’s name, a valid email, and your name." });
          return;
        }
        set({ gcStep: "pay", gcErr: "" });
      }
      scrollTop();
    },

    gcBack: () => {
      const s = get();
      if (s.gcStep === "pay") set({ gcStep: "details", gcErr: "" });
      else if (s.gcStep === "details") set({ gcStep: "design", gcErr: "" });
      else set({ view: "home" });
      scrollTop();
    },

    gcPay: () => {
      const s = get();
      if (
        s.gcNum.replace(/\D/g, "").length < 12 ||
        !s.gcExp.trim() ||
        s.gcCvc.replace(/\D/g, "").length < 3 ||
        !s.gcName.trim()
      ) {
        set({ gcErr: "Enter valid demo card details to continue." });
        return;
      }
      const amount = giftAmountValue(s);
      const code = giftCode(
        `${s.gcTo}${s.gcToEmail}${amount}`,
        s.gifts.map((g) => g.code),
      );
      const card: GiftCard = {
        code,
        amount,
        to: s.gcTo || "A friend",
        toEmail: s.gcToEmail,
        status: "sent",
        date: "Just now",
      };
      set({
        gifts: [card, ...s.gifts],
        gcStep: "done",
        gcErr: "",
        gcCode: code,
      });
      scrollTop();
    },

    gcReset: () =>
      set({
        gcStep: "design",
        gcCode: null,
        gcErr: "",
        gcTo: "",
        gcToEmail: "",
        gcFrom: "",
        gcMsg: "",
        gcNum: "",
        gcExp: "",
        gcCvc: "",
        gcName: "",
      }),

    /* ---------------- group ---------------- */

    setGroupGuest: (index, patch) => {
      const guests = get().groupGuests.map((g, i) =>
        i === index ? { ...g, ...patch } : g,
      );
      set({ groupGuests: guests, grpErr: "" });
    },

    addGuest: () => {
      const s = get();
      if (s.groupGuests.length >= 8) return;
      set({ groupGuests: [...s.groupGuests, { name: "", svc: "cut" }] });
    },

    removeGuest: (index) => {
      const s = get();
      if (s.groupGuests.length <= 2) return;
      set({ groupGuests: s.groupGuests.filter((_, i) => i !== index) });
    },

    setGrpField: (field, value) => set({ [field]: value, grpErr: "" } as Partial<Store>),

    setGrpDateIdx: (index) => set({ grpDateIdx: index }),

    grpSubmit: () => {
      const s = get();
      if (s.groupGuests.some((g) => !g.name.trim())) {
        set({ grpErr: "Give every guest a name." });
        return;
      }
      if (
        !s.grpName.trim() ||
        !isValidEmail(s.grpEmail) ||
        !isValidPhone(s.grpPhone)
      ) {
        set({
          grpErr: "Add your name, a valid email, and phone so we can confirm.",
        });
        return;
      }
      set({ grpCode: groupCode(s.nextNum), nextNum: s.nextNum + 1, grpErr: "" });
      scrollTop();
    },

    grpReset: () =>
      set({
        groupGuests: DEFAULT_GUESTS.map((g) => ({ ...g })),
        grpName: "",
        grpEmail: "",
        grpPhone: "",
        grpDateIdx: 0,
        grpErr: "",
        grpCode: null,
      }),

    /* ---------------- intake ---------------- */

    toggleConcern: (concern) => {
      const s = get();
      const concerns = { ...s.intake.concerns, [concern]: !s.intake.concerns[concern] };
      set({ intake: { ...s.intake, concerns } });
    },

    setAllergies: (v) => set({ intake: { ...get().intake, allergies: v } }),

    setPressure: (p) => set({ intake: { ...get().intake, pressure: p } }),

    setConsent: (on) => set({ intake: { ...get().intake, consent: on } }),

    intakeSubmit: () => {
      const s = get();
      if (!s.intake.consent) {
        toast("Please agree to the consent notice first", "warn");
        return;
      }
      set({ intakeDone: true });
      toast("Intake form saved", "ok");
      scrollTop();
    },

    intakeEdit: () => set({ intakeDone: false }),
  };
});

/* ------------------------------------------------------------------ *
 * Derived selectors (plain functions — usable outside React too)
 * ------------------------------------------------------------------ */

/** The gift amount as a number (`'custom'` reads `gcCustom`). */
export function giftAmountValue(
  state: Pick<StoreState, "gcAmount" | "gcCustom">,
): number {
  return state.gcAmount === "custom"
    ? parseFloat(state.gcCustom) || 0
    : state.gcAmount;
}

/** Bookings the visits screen shows: confirmed, newest code first. */
export function selectUpcoming(state: StoreState): Booking[] {
  return Object.values(state.bookings)
    .filter((b) => b.status === "confirmed")
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.time - b.time);
}

export function selectWaitlist(state: StoreState): WaitlistEntry[] {
  return Object.values(state.waitlist);
}

/* ------------------------------------------------------------------ *
 * Slot hooks — the only way screens should compute availability
 * ------------------------------------------------------------------ */

export function useSlotContext(): SlotContext {
  const appointments = useStore((s) => s.appointments);
  const excludeCode = useStore((s) => s.rescheduleCode);
  return useMemo(
    () => ({
      services: data.getServices(),
      staff: data.getStaff(),
      appointments,
      excludeCode,
    }),
    [appointments, excludeCode],
  );
}

/** The currently selected day in the rolling window. */
export function useSelectedDate(): Date {
  const week = useStore((s) => s.week);
  const dateIdx = useStore((s) => s.dateIdx);
  return week[dateIdx] ?? week[0];
}

/** Every rendered slot for the current draft + selected day. */
export function useBookingSlots(): Slot[] {
  const ctx = useSlotContext();
  const svcId = useStore((s) => s.svcId);
  const staffSel = useStore((s) => s.staffSel);
  const date = useSelectedDate();
  return useMemo(
    () => slotsFor(ctx, svcId, staffSel, date),
    [ctx, svcId, staffSel, date],
  );
}

/** Those slots bucketed into Morning / Afternoon / Evening. */
export function useSlotGroups(): SlotGroup[] {
  const slots = useBookingSlots();
  return useMemo(() => groupSlots(slots), [slots]);
}

/** One entry per day of the strip, with open counts and disabled state. */
export function useDaySummaries(): DaySummary[] {
  const ctx = useSlotContext();
  const svcId = useStore((s) => s.svcId);
  const staffSel = useStore((s) => s.staffSel);
  const week = useStore((s) => s.week);
  return useMemo(
    () => daySummaries(ctx, svcId, staffSel, week),
    [ctx, svcId, staffSel, week],
  );
}

/** True when the selected day has windows but nothing free. */
export function useDayFull(): boolean {
  const ctx = useSlotContext();
  const svcId = useStore((s) => s.svcId);
  const staffSel = useStore((s) => s.staffSel);
  const date = useSelectedDate();
  return useMemo(
    () => isDayFull(ctx, svcId, staffSel, date),
    [ctx, svcId, staffSel, date],
  );
}
