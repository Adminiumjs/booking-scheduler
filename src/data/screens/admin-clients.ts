/*
 * Seed for the studio Clients screen (view: 'admin-clients').
 *
 * The client book is studio-only — the guest half never sees another guest's
 * record — so it stays page-local rather than joining the shared data seam.
 *
 * Naming: the comp's colour specialist is called "Selma". The shipped app
 * reserves that name for the owner (Selma Okonjo) and calls the stylist Elin,
 * so the "usually with" column follows `demo.ts`, not the comp.
 */

export type ClientSegment = "regular" | "new" | "lapsed";

export interface AdminClient {
  id: string;
  name: string;
  initials: string;
  email: string;
  /** Per-record avatar tint, as everywhere else in the demo data. */
  tint: string;
  visits: number;
  /** Lifetime spend, in whole dollars. */
  spend: number;
  /** Human date of the last visit. */
  last: string;
  /** Specialist they usually book with. */
  staff: string;
  seg: ClientSegment;
  tags: readonly string[];
  /** Seeded team note; `store.notes[id]` overlays this once edited. */
  note: string;
}

export const ADMIN_CLIENTS: readonly AdminClient[] = [
  {
    id: "ava",
    name: "Ava Reyes",
    initials: "AR",
    email: "ava@example.com",
    tint: "#b07d9a",
    visits: 12,
    spend: 973,
    last: "Jul 14",
    staff: "Elin",
    seg: "regular",
    tags: ["Circle member", "Prefers 2 PM"],
    note: "Sensitive scalp — no high-lift bleach.",
  },
  {
    id: "priya",
    name: "Priya Sharma",
    initials: "PS",
    email: "priya.s@example.com",
    tint: "#9a7fb0",
    visits: 8,
    spend: 1240,
    last: "Jul 12",
    staff: "Elin",
    seg: "regular",
    tags: ["Colour every 6 weeks"],
    note: "",
  },
  {
    id: "marcus",
    name: "Marcus Lund",
    initials: "ML",
    email: "m.lund@example.com",
    tint: "#6f8bb0",
    visits: 6,
    spend: 690,
    last: "Jun 28",
    staff: "Noor",
    seg: "regular",
    tags: ["Deep-tissue only"],
    note: "Left shoulder injury, 2024.",
  },
  {
    id: "dana",
    name: "Dana Rivas",
    initials: "DR",
    email: "dana.r@example.com",
    tint: "#b0836a",
    visits: 14,
    spend: 812,
    last: "Jul 8",
    staff: "Ivy",
    seg: "regular",
    tags: ["Books three ahead"],
    note: "",
  },
  {
    id: "jonah",
    name: "Jonah Pike",
    initials: "JP",
    email: "jonah@example.com",
    tint: "#7d9166",
    visits: 1,
    spend: 78,
    last: "Today",
    staff: "Elin",
    seg: "new",
    tags: ["First visit"],
    note: "Intake form not returned yet.",
  },
  {
    id: "lucia",
    name: "Lucia Moss",
    initials: "LM",
    email: "lucia.m@example.com",
    tint: "#c08a6a",
    visits: 4,
    spend: 288,
    last: "Jun 2",
    staff: "Ivy",
    seg: "regular",
    tags: [],
    note: "",
  },
  {
    id: "theo",
    name: "Theo Kim",
    initials: "TK",
    email: "theo.k@example.com",
    tint: "#6a86ab",
    visits: 22,
    spend: 940,
    last: "Jul 21",
    staff: "Marco",
    seg: "regular",
    tags: ["Ten-pack holder"],
    note: "Lower back — no loaded flexion.",
  },
  {
    id: "sam",
    name: "Sam Doyle",
    initials: "SD",
    email: "sam.d@example.com",
    tint: "#b58a6a",
    visits: 2,
    spend: 120,
    last: "Apr 4",
    staff: "Elin",
    seg: "lapsed",
    tags: ["Not seen in 3 months"],
    note: "",
  },
  {
    id: "hannah",
    name: "Hannah Wills",
    initials: "HW",
    email: "h.wills@example.com",
    tint: "#8a9a6a",
    visits: 9,
    spend: 1105,
    last: "Jul 20",
    staff: "Noor",
    seg: "regular",
    tags: ["Barrier repair plan"],
    note: "Retinol paused until September.",
  },
  {
    id: "robin",
    name: "Robin Alvarez",
    initials: "RA",
    email: "robin@example.com",
    tint: "#a8846f",
    visits: 3,
    spend: 210,
    last: "May 30",
    staff: "Ivy",
    seg: "lapsed",
    tags: ["Gift card balance $40"],
    note: "",
  },
];

export interface ClientSegmentOption {
  id: ClientSegment | "all";
  label: string;
}

export const CLIENT_SEGMENTS: readonly ClientSegmentOption[] = [
  { id: "all", label: "Everyone" },
  { id: "regular", label: "Regulars" },
  { id: "new", label: "New" },
  { id: "lapsed", label: "Lapsed" },
];

export interface ClientVisit {
  /** Service name as it should read in the record, not a service id. */
  svc: string;
  date: string;
  staff: string;
  /** Charged amount, in whole dollars. */
  amount: number;
}

/**
 * The visit history the record panel shows. The comp seeds one shared history
 * for every client rather than per-client rows — demo fiction, kept as-is.
 */
export const CLIENT_HISTORY: readonly ClientVisit[] = [
  { svc: "Gloss & Tone", date: "Jul 14", staff: "Elin", amount: 60 },
  { svc: "Signature Facial", date: "Jun 30", staff: "Noor", amount: 110 },
  { svc: "Gel Manicure", date: "Jun 2", staff: "Ivy", amount: 58 },
  { svc: "Balayage", date: "May 12", staff: "Elin", amount: 190 },
];
