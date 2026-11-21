/**
 * The desk's door into Adminium: what the staff screens read and the writes
 * they make, whichever Adminium answers (the real one over the signed-in
 * person's session, or a test's stand-in). Screens never reach past it.
 *
 * Every figure the screens show is a column Adminium worked out: a booking's
 * price, what was paid and refunded, the free times, a clash. The door hands
 * rows back as the API answers them and adds no figure of its own.
 */
import type { Id, Row } from "./wire.ts";

/** The app's tables, by the names the manifest gives them. */
export type Table =
  | "settings"
  | "opening_hours"
  | "closures"
  | "categories"
  | "services"
  | "team"
  | "team_services"
  | "team_hours"
  | "time_off"
  | "customers"
  | "waitlist"
  | "bookings"
  | "payments"
  | "messages";

export type Action = "read" | "create" | "update" | "delete";

/** The person signed in: their name, and what the app's roles let them do. Screens ask `can`, never a role's name (§7). */
export interface Person {
  id: string | null;
  name: string;
  /** The app's roles they hold, by the manifest's key. */
  roles: string[];
  can(table: Table, action: Action): boolean;
}

/** Whether the app takes payments, and what this person may do with them. */
export interface StaffPayments {
  on: boolean;
  online: boolean;
  test: boolean;
  refund: boolean;
}

/** Forms & surveys' reviews of the studio; null without Forms, or for a role that reads none. */
export interface ReviewRows {
  reviews: Row[];
  totals: Row[];
}

export type ConnectionState = "connecting" | "connected" | "partial" | "reconnect" | "disconnecting" | "setup";

/** One outside account on a person's row, as Adminium's connected accounts answer it. */
export interface CalendarAccount {
  id: string;
  provider: string;
  providerName: string;
  state: ConnectionState;
  since: number;
  address: string | null;
  addressDiffers: boolean;
  grantEndsAt: number | null;
}

/** What the sync knows of a person's calendar. */
export interface CalendarSyncState {
  accountId: string;
  state: Exclude<ConnectionState, "setup">;
  address: string | null;
  demo: boolean;
  lastSyncedAt: number | null;
  /** While reconnecting: the moment the kept busy times are as of (cQ16). */
  busyAsOf: number | null;
  busyDropped: boolean;
  paused: string | null;
  readCalendars: string[] | null;
  countAllDay: boolean;
  detail: "first-name+initial" | "none";
  traits: { listsCalendars: boolean; allDayKnown: boolean; busyPush: boolean } | null;
  calendars: { id: string; name: string; primary: boolean; writable: boolean }[] | null;
}

/** A person's calendar part: their accounts, what may be done, and the sync's state. */
export interface PersonCalendar {
  accounts: CalendarAccount[];
  providers: { key: string; name: string }[];
  reach: "cannot-connect" | "poll-only" | "push";
  may: { connect: boolean; sendLink: boolean; copyLink: boolean; disconnect: boolean };
  sync: CalendarSyncState | null;
}

/** A booking that overlaps a busy time: the clipped overlap is what "Keep it" holds on to (SYN-6). */
export interface Clash {
  row: string;
  resource: string;
  overlapStart: number;
  overlapEnd: number;
  kept: boolean;
  /** The whole busy time it sits in, for the sentence "busy 9–11 AM"; the overlap alone when it could not be read. */
  block?: BusyBlock;
}

export interface BusyBlock {
  start: number;
  end: number;
}

/** The studio's listed websites and this app's screens a website may show. */
export interface EmbedFacts {
  origin: string;
  sites: string[];
  app: string;
  mount: string;
  path: string;
  modes: ("inline" | "button" | "floating")[];
  services: { value: string; label: string }[];
  query: string | null;
}

/** A pack or a gift card on a client's panel. */
export interface OfferLine {
  key: string;
  kind: "pack" | "card";
  title: string;
  sub: string;
  figure: string;
}

/** Everything the desk's screens read, at one moment. */
export interface DeskData {
  settings: Row | null;
  openingHours: Row[];
  closures: Row[];
  categories: Row[];
  services: Row[];
  team: Row[];
  teamServices: Row[];
  teamHours: Row[];
  timeOff: Row[];
  /** Only what this person's role reads: a specialist's own clients, by name and note. */
  customers: Row[];
  waitlist: Row[];
  bookings: Row[];
  /** Empty for a role that reads none. */
  payments: Row[];
  messages: Row[];
  reviews: ReviewRows | null;
  /** Packs and gift cards by customer id, as the role reads Offers' tables; null without Offers or without the grant. */
  offers: Record<string, OfferLine[]> | null;
  /** By team id. A person whose calendar cannot be read here has no entry. */
  calendars: Record<string, PersonCalendar>;
  /** Null when this Adminium or this app keeps no calendar sync. */
  clashes: Clash[] | null;
  /** Minutes of the last hour in which online booking was refused at its limit; null when the server cannot say. */
  capReached: number | null;
}

/** The desk's facts that are not rows. */
export interface DeskFacts {
  zone: string;
  currency: string;
  addOns: string[];
  connectionId: string | null;
}

/** A free time on one day. */
export interface Slot {
  time: string;
  state: "free" | "full";
  resource?: string | number;
}

/** One day of a strip. */
export interface DayCount {
  date: string;
  open: number;
  state: "open" | "full" | "closed";
  lastBookable?: true;
}

/** One online payment as Adminium's Payment panel shows it to this person. */
export interface PanelPayment {
  attemptId: string | null;
  amount: string;
  method: string;
  provider: string | null;
  test: boolean;
  paidOn: string;
  refundable: string;
  refundRefusal: string | null;
}

export interface PaymentPanel {
  currency: string;
  total: string;
  due: string;
  paid: string;
  mayRefund: boolean;
  waiting: boolean;
  payments: PanelPayment[];
}

export interface NewBooking {
  service: Id;
  /** Null means Anyone: Adminium picks. */
  person: Id | null;
  startsAt: string;
  customer: { id: Id | null; name: string; email: string | null; phone: string | null };
  /** Send a deposit link: the booking is held as being paid until it is paid or let go. */
  depositLink: boolean;
  /** A retry of the same press carries the same key, so it cannot book twice (cT18). */
  key: string;
}

export interface DeskDoor {
  who(): Person;
  facts(): DeskFacts;
  /** The server's clock, as epoch ms. */
  now(): number;
  /** Adminium's console actions this person holds (`payments.manage`, `connections.manage`). Empty when it cannot be read. */
  systemActions(): Promise<readonly string[]>;
  payments(): StaffPayments | null;
  /** Whether this person may publish, hide and reply to reviews. */
  moderates(): boolean;
  signOut?(): Promise<void>;
  load(): Promise<DeskData>;

  /** The free times of one day, by the staff rules. */
  slots(input: { service: Id; person: Id | null; day: string; exclude?: Id | null }): Promise<Slot[]>;
  /** A strip of days, by the staff rules. */
  days(input: { service: Id; person: Id | null; from: string; days: number; exclude?: Id | null }): Promise<DayCount[]>;
  /** A person's busy blocks, times only, for the days shown. */
  busy(team: Id, from: string, to: string): Promise<BusyBlock[]>;

  createBooking(input: NewBooking): Promise<Row>;
  /** A booking along its states, from the one the screen saw: a row that moved on since is refused. */
  moveBooking(booking: Row, to: string, values?: Record<string, unknown>): Promise<Row>;
  /** A booking's own columns that are not its state: its time, person or staff note. */
  saveBooking(booking: Row, values: Record<string, unknown>): Promise<Row>;
  panel(booking: Row): Promise<PaymentPanel | null>;
  refund(input: { attemptId: string; amount: string; reason: string; note: string; key: string }): Promise<void>;

  createCustomer(values: { name: string; email: string | null; phone: string | null }): Promise<Row>;
  saveCustomer(customer: Row, values: Record<string, unknown>): Promise<Row>;
  createService(values: Record<string, unknown>): Promise<Row>;
  saveService(service: Row, values: Record<string, unknown>): Promise<Row>;
  addServicePerson(service: Id, team: Id): Promise<Row>;
  removeServicePerson(link: Row): Promise<void>;
  saveTeam(person: Row, values: Record<string, unknown>): Promise<Row>;
  addTimeOff(values: { team_id: Id; starts_at: string; ends_at: string; why: string | null }): Promise<Row>;
  removeTimeOff(row: Row): Promise<void>;
  /** An offer to a waiting guest: a booking that holds nothing until it is taken. */
  offerTime(input: { entry: Row; person: Id; startsAt: string; key: string }): Promise<Row>;
  closeWaiting(entry: Row): Promise<Row>;
  saveReview(review: Row, values: Record<string, unknown>): Promise<Row>;
  saveSettings(settings: Row, values: Record<string, unknown>): Promise<Row>;
  addClosure(values: { from_date: string; to_date: string; name: string }): Promise<Row>;

  keepClash(clash: Clash): Promise<void>;
  syncNow(team: Id): Promise<void>;
  saveCalendarChoices(team: Id, choices: { readCalendars?: string[] | null; countAllDay?: boolean; detail?: "first-name+initial" | "none"; resume?: true }): Promise<void>;
  /** Where to send this person's browser to connect their own calendar. */
  connectCalendar(team: Id, addOn: string): Promise<string>;
  /** E-mails a connect link to the address on the row. */
  sendConnectLink(team: Id): Promise<string | null>;
  /** A connect link to copy: only for someone who may update the row (cQ12). */
  copyConnectLink(team: Id): Promise<string>;
  disconnectCalendar(team: Id, addOn: string): Promise<void>;
  /** A person's private feed link: shown only to the person whose address is on the row; null for anyone else (A5). */
  feedLink(team: Id): Promise<{ link: string | null; own: boolean } | null>;
  renewFeed(team: Id): Promise<{ link: string | null; own: boolean }>;
  /** "Your websites" and the snippet maker's screens: null for anyone without Adminium's privacy grant (EMB-12). */
  embeds(): Promise<EmbedFacts | null>;
}
