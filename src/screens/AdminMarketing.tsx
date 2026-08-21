/*
 * MARKETING CAMPAIGNS (view: 'admin-marketing') — Admin comp template 329–350,
 * logic 1068–1081.
 *
 * StudioChrome supplies the sidebar, the "Marketing" heading and the body
 * padding, so this file renders the body only.
 */

import { Button, Chip, IconTile } from "../components/index.ts";
import { CAMPAIGNS, MARKETING_KPIS } from "../data/screens/admin-marketing.ts";
import type {
  Campaign,
  CampaignStatus,
  MarketingKpi,
} from "../data/screens/admin-marketing.ts";
import type { ToastKind } from "../data/types.ts";
import { useT } from "../i18n/index.tsx";
import type { MessageKey, TFunction } from "../i18n/index.tsx";
import { formatMediumISO, formatNumber, wholeMoney } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-admin-marketing.css";

const FILTER_IDS = ["all", "live", "draft"] as const;

const FILTER_KEYS: Record<(typeof FILTER_IDS)[number], MessageKey> = {
  all: "screensA.common.all",
  live: "screensA.marketing.filterLive",
  draft: "screensA.marketing.filterDraft",
};

/** A KPI tile's figure: a grouped count, or a rate spelled as a percentage. */
function kpiValue(k: MarketingKpi): string {
  return k.format === "percent"
    ? formatNumber(k.value, { style: "percent", maximumFractionDigits: 0 })
    : formatNumber(k.value);
}

/**
 * The grey line under a campaign name.
 *
 * The audience size and the send date are both holes in a keyed sentence, so
 * the word order — and whether the date leads or trails — stays the
 * translator's to decide.
 */
function campaignMeta(t: TFunction, c: Campaign): string {
  return t(
    c.metaKey,
    {
      ...(c.metaDateISO === undefined
        ? null
        : { date: formatMediumISO(c.metaDateISO) }),
      ...(c.metaCount === undefined ? null : { count: formatNumber(c.metaCount) }),
    },
    c.metaCount,
  );
}

interface StatusMeta {
  label: string;
  /** What the row's trailing button offers for a campaign in this state. */
  action: string;
  /** The toast this state's own button raises, already interpolated. */
  toastKey: MessageKey;
  kind: ToastKind;
}

/*
 * The comp derived the toast from `live ? 'paused' : 'queued'`, so pressing
 * "Edit" on a draft claimed it had been queued. Each state now reports what
 * its own button actually did — as a whole sentence per state, so a translator
 * is never handed a past participle to graft onto a name.
 */
function statusMeta(t: TFunction): Record<CampaignStatus, StatusMeta> {
  return {
    live: {
      label: t("screensA.marketing.statusLive"),
      action: t("screensA.marketing.actionPause"),
      toastKey: "screensA.marketing.toastPaused",
      kind: "warn",
    },
    scheduled: {
      label: t("screensA.marketing.statusScheduled"),
      action: t("screensA.marketing.actionSend"),
      toastKey: "screensA.marketing.toastQueued",
      kind: "ok",
    },
    draft: {
      label: t("screensA.marketing.statusDraft"),
      action: t("screensA.marketing.actionEdit"),
      toastKey: "screensA.marketing.toastOpened",
      kind: "ok",
    },
  };
}

export default function AdminMarketing() {
  const t = useT();
  const status = statusMeta(t);
  const mkFilter = useStore((s) => s.mkFilter);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  /*
   * The comp's "Drafts" chip filtered on `status !== 'live'`, which listed the
   * scheduled holiday campaign under Drafts. Drafts means drafts; the
   * scheduled one is still reachable from "All".
   */
  const shown = CAMPAIGNS.filter((c) =>
    mkFilter === "all" ? true : c.status === mkFilter,
  );

  return (
    <div className="scr-admin-marketing">
      <div className="mk-kpis">
        {MARKETING_KPIS.map((k) => (
          <div className="mk-kpi" key={k.labelKey}>
            <span className="mk-kpi__label">{t(k.labelKey)}</span>
            <span className="mk-kpi__value bk-mono">{kpiValue(k)}</span>
            <span className="mk-kpi__sub">
              {t(
                k.subKey,
                {
                  ...(k.subCount === undefined
                    ? null
                    : { count: formatNumber(k.subCount) }),
                  ...(k.subAmount === undefined
                    ? null
                    : { amount: wholeMoney(k.subAmount) }),
                },
                k.subCount,
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="mk-bar">
        {FILTER_IDS.map((id) => (
          <Chip
            key={id}
            label={t(FILTER_KEYS[id])}
            active={mkFilter === id}
            onClick={() => set({ mkFilter: id })}
          />
        ))}
        <span className="mk-bar__gap" />
        <Button
          icon="plus"
          iconSize={15}
          size="sm"
          onClick={() => showToast(t("screensA.marketing.builderToast"), "warn")}
        >
          {t("screensA.marketing.newCampaign")}
        </Button>
      </div>

      <div className="mk-list">
        {shown.map((c) => (
          <CampaignRow
            key={c.id}
            campaign={c}
            meta={status[c.status]}
            onAction={() =>
              showToast(
                t(status[c.status].toastKey, { name: c.name }),
                status[c.status].kind,
              )
            }
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * One campaign (local to this screen)
 * ------------------------------------------------------------------ */

interface CampaignRowProps {
  campaign: Campaign;
  meta: StatusMeta;
  onAction: () => void;
}

function CampaignRow({ campaign: c, meta, onAction }: CampaignRowProps) {
  const t = useT();
  const stats = [
    {
      label: t("screensA.marketing.statSent"),
      value: c.sent ? formatNumber(c.sent) : "—",
    },
    {
      label: t("screensA.marketing.statOpened"),
      /* A fraction in the seed, a percentage on screen — `Intl` picks the
       * glyph's side and the digits, which `${n * 100}%` never did. */
      value:
        c.open === null
          ? "—"
          : formatNumber(c.open, { style: "percent", maximumFractionDigits: 0 }),
    },
    {
      label: t("screensA.marketing.statBooked"),
      value: c.booked ? formatNumber(c.booked) : "—",
    },
  ];

  return (
    <article className="bk-panel mk-camp">
      <IconTile icon={c.icon} tint={c.tint} size={34} iconSize={17} radius={10} />

      <div className="mk-camp__id">
        <div className="mk-camp__titlerow">
          <h3 className="mk-camp__name">{c.name}</h3>
          <span className="mk-camp__status" data-status={c.status}>
            {meta.label}
          </span>
        </div>
        <p className="mk-camp__meta">{campaignMeta(t, c)}</p>
      </div>

      <div className="mk-camp__stats">
        {stats.map((s) => (
          <div className="mk-camp__stat" key={s.label}>
            <span className="mk-camp__statval bk-mono">{s.value}</span>
            <span className="mk-camp__statlabel">{s.label}</span>
          </div>
        ))}
      </div>

      <Button
        variant={c.status === "live" ? "ghost" : "primary"}
        size="sm"
        onClick={onAction}
        className="mk-camp__action"
      >
        {meta.action}
      </Button>
    </article>
  );
}
