/*
 * Page-local seed for the studio Marketing screen (Admin comp logic 1068–1081).
 *
 * Campaigns live here rather than in `demo.ts` because nothing else in the app
 * reads them — the booking seam has no notion of a campaign, and putting them
 * behind `DataSource` would widen that interface for one screen.
 */

import type { MessageKey } from "../../i18n/index.tsx";

export type CampaignStatus = "live" | "scheduled" | "draft";

/** A status is a machine token; this is what a reader sees instead. */
export const CAMPAIGN_STATUS_KEY: Record<CampaignStatus, MessageKey> = {
  live: "data.marketing.statusLive",
  scheduled: "data.marketing.statusScheduled",
  draft: "data.marketing.statusDraft",
};

export interface Campaign {
  id: string;
  /** The campaign's own name — the studio wrote it, so it stays as written. */
  name: string;
  /** Lucide glyph for the tinted tile — also the channel cue. */
  icon: string;
  /** Per-record tint; the one value that legitimately bypasses the tokens. */
  tint: string;
  status: CampaignStatus;
  /**
   * The grey line under the name: when it went, to whom, how many. A key plus
   * its parts — the audience size needs the reader's digits and plural, and
   * the date needs their calendar.
   */
  metaKey: MessageKey;
  /** Fills `{date}` in the meta line, when it carries one. */
  metaDateISO?: string;
  /** Fills `{count}` — the audience size — and selects the plural. */
  metaCount?: number;
  sent: number;
  /** Open rate as a fraction, or `null` before anything has gone out. */
  open: number | null;
  booked: number;
}

export const CAMPAIGNS: readonly Campaign[] = [
  {
    id: "c1",
    name: "Autumn open house",
    icon: "mail",
    tint: "#b07d9a",
    status: "live",
    metaKey: "data.marketing.metaSent",
    metaDateISO: "2026-07-21",
    metaCount: 1240,
    sent: 1240,
    open: 0.62,
    booked: 38,
  },
  {
    id: "c2",
    name: "Midweek mornings 20% off",
    icon: "message-square",
    tint: "#c08a6a",
    status: "live",
    metaKey: "data.marketing.metaDaily",
    sent: 410,
    open: 0.94,
    booked: 22,
  },
  {
    id: "c3",
    name: "Win back — not seen in 90 days",
    icon: "user-round-x",
    tint: "#6f8bb0",
    status: "draft",
    metaKey: "data.marketing.metaUnscheduled",
    metaCount: 86,
    sent: 0,
    open: null,
    booked: 0,
  },
  {
    id: "c4",
    name: "Gift cards for the holidays",
    icon: "gift",
    tint: "#7d9166",
    status: "scheduled",
    metaKey: "data.marketing.metaGoesOut",
    metaDateISO: "2026-11-14",
    sent: 0,
    open: null,
    booked: 0,
  },
];

/** How a KPI's bare `value` should be spelled. */
export type KpiFormat = "count" | "percent";

export interface MarketingKpi {
  labelKey: MessageKey;
  /** The figure itself — formatted at render, never pre-grouped here. */
  value: number;
  format: KpiFormat;
  subKey: MessageKey;
  /** Fills `{count}` in the caption, where it has one. */
  subCount?: number;
  /** Fills `{amount}` in the caption, in whole dollars. */
  subAmount?: number;
}

export const MARKETING_KPIS: readonly MarketingKpi[] = [
  {
    labelKey: "data.marketing.kpiSent",
    value: 1650,
    format: "count",
    subKey: "data.marketing.kpiSentSub",
    subCount: 2,
  },
  {
    labelKey: "data.marketing.kpiOpenRate",
    value: 0.71,
    format: "percent",
    subKey: "data.marketing.kpiOpenRateSub",
  },
  {
    labelKey: "data.marketing.kpiBooked",
    value: 60,
    format: "count",
    subKey: "data.marketing.kpiBookedSub",
    subAmount: 4980,
  },
  {
    labelKey: "data.marketing.kpiOptedIn",
    value: 0.86,
    format: "percent",
    subKey: "data.marketing.kpiOptedInSub",
  },
];
