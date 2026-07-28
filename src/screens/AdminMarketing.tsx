/*
 * MARKETING CAMPAIGNS (view: 'admin-marketing') — Admin comp template 329–350,
 * logic 1068–1081.
 *
 * StudioChrome supplies the sidebar, the "Marketing" heading and the body
 * padding, so this file renders the body only.
 */

import { Button, Chip, IconTile } from "../components/index.ts";
import { CAMPAIGNS, MARKETING_KPIS } from "../data/screens/admin-marketing.ts";
import type { Campaign, CampaignStatus } from "../data/screens/admin-marketing.ts";
import type { ToastKind } from "../data/types.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-admin-marketing.css";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "live", label: "Live" },
  { id: "draft", label: "Drafts" },
] as const;

interface StatusMeta {
  label: string;
  /** What the row's trailing button offers for a campaign in this state. */
  action: string;
  /** Past tense for the toast — "Autumn open house · paused — demo only". */
  outcome: string;
  kind: ToastKind;
}

/*
 * The comp derived the toast from `live ? 'paused' : 'queued'`, so pressing
 * "Edit" on a draft claimed it had been queued. Each state now reports what
 * its own button actually did.
 */
const STATUS: Record<CampaignStatus, StatusMeta> = {
  live: { label: "Live", action: "Pause", outcome: "paused", kind: "warn" },
  scheduled: { label: "Scheduled", action: "Send now", outcome: "queued", kind: "ok" },
  draft: {
    label: "Draft",
    action: "Edit",
    outcome: "opened in the builder",
    kind: "ok",
  },
};

export default function AdminMarketing() {
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
          <div className="mk-kpi" key={k.label}>
            <span className="mk-kpi__label">{k.label}</span>
            <span className="mk-kpi__value bk-mono">{k.value}</span>
            <span className="mk-kpi__sub">{k.sub}</span>
          </div>
        ))}
      </div>

      <div className="mk-bar">
        {FILTERS.map((f) => (
          <Chip
            key={f.id}
            label={f.label}
            active={mkFilter === f.id}
            onClick={() => set({ mkFilter: f.id })}
          />
        ))}
        <span className="mk-bar__gap" />
        <Button
          icon="plus"
          iconSize={15}
          size="sm"
          onClick={() => showToast("Campaign builder — demo only", "warn")}
        >
          New campaign
        </Button>
      </div>

      <div className="mk-list">
        {shown.map((c) => (
          <CampaignRow
            key={c.id}
            campaign={c}
            onAction={() =>
              showToast(
                `${c.name} · ${STATUS[c.status].outcome} — demo only`,
                STATUS[c.status].kind,
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
  onAction: () => void;
}

function CampaignRow({ campaign: c, onAction }: CampaignRowProps) {
  const meta = STATUS[c.status];
  const stats = [
    { label: "Sent", value: c.sent ? c.sent.toLocaleString("en-US") : "—" },
    { label: "Opened", value: c.open },
    { label: "Booked", value: c.booked ? String(c.booked) : "—" },
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
        <p className="mk-camp__meta">{c.meta}</p>
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
