/*
 * Page-local seed for the studio Marketing screen (Admin comp logic 1068–1081).
 *
 * Campaigns live here rather than in `demo.ts` because nothing else in the app
 * reads them — the booking seam has no notion of a campaign, and putting them
 * behind `DataSource` would widen that interface for one screen.
 */

export type CampaignStatus = "live" | "scheduled" | "draft";

export interface Campaign {
  id: string;
  name: string;
  /** Lucide glyph for the tinted tile — also the channel cue. */
  icon: string;
  /** Per-record tint; the one value that legitimately bypasses the tokens. */
  tint: string;
  status: CampaignStatus;
  /** The grey line under the name: when it went, to whom, how many. */
  meta: string;
  sent: number;
  /** Open rate, pre-formatted — an em dash before anything has gone out. */
  open: string;
  booked: number;
}

export const CAMPAIGNS: readonly Campaign[] = [
  {
    id: "c1",
    name: "Autumn open house",
    icon: "mail",
    tint: "#b07d9a",
    status: "live",
    meta: "Sent Jul 21 · 1,240 guests · Circle members first",
    sent: 1240,
    open: "62%",
    booked: 38,
  },
  {
    id: "c2",
    name: "Midweek mornings 20% off",
    icon: "message-square",
    tint: "#c08a6a",
    status: "live",
    meta: "Sending daily · lapsed guests only",
    sent: 410,
    open: "94%",
    booked: 22,
  },
  {
    id: "c3",
    name: "Win back — not seen in 90 days",
    icon: "user-round-x",
    tint: "#6f8bb0",
    status: "draft",
    meta: "Audience 86 guests · not scheduled",
    sent: 0,
    open: "—",
    booked: 0,
  },
  {
    id: "c4",
    name: "Gift cards for the holidays",
    icon: "gift",
    tint: "#7d9166",
    status: "scheduled",
    meta: "Goes out Nov 14 · everyone opted in",
    sent: 0,
    open: "—",
    booked: 0,
  },
];

export interface MarketingKpi {
  label: string;
  value: string;
  sub: string;
}

export const MARKETING_KPIS: readonly MarketingKpi[] = [
  { label: "Sent this month", value: "1,650", sub: "across 2 live campaigns" },
  { label: "Open rate", value: "71%", sub: "email + text combined" },
  { label: "Bookings driven", value: "60", sub: "$4,980 in revenue" },
  { label: "Opted in", value: "86%", sub: "of active guests" },
];
