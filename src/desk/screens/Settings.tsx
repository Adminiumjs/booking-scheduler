/**
 * K10 Settings (comp L2 376–468), six tabs. Only someone who may change the
 * studio's settings row reaches it. Hours and closures are edited in the
 * console (R4), the time zone is the connection's (MOD-4), and "Your websites"
 * is one list per installation behind Adminium's own grant (EMB-12).
 */
import { CircleCheck, Copy, ExternalLink, Plus } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import type { EmbedFacts } from "../door.ts";
import { useData, useEnv, useRun } from "../env.tsx";
import { useFmt } from "../format.ts";
import { useDeskT, type DeskKey } from "../i18n/index.ts";
import { openSheet, toast, useDesk, type DeskState } from "../store.ts";
import { instantOf } from "../time.ts";
import { FieldError, Fig, Switch } from "../ui.tsx";
import { num, text, type Row } from "../wire.ts";

type Tab = DeskState["settingsTab"];
const TABS: { id: Tab; word: DeskKey }[] = [
  { id: "studio", word: "settings.studio" },
  { id: "rules", word: "settings.rules" },
  { id: "payments", word: "settings.payments" },
  { id: "requests", word: "settings.requests" },
  { id: "website", word: "settings.website" },
  { id: "emails", word: "settings.emails" },
];
const DAYS: { key: string; word: DeskKey }[] = [
  { key: "mon", word: "day.monday" },
  { key: "tue", word: "day.tuesday" },
  { key: "wed", word: "day.wednesday" },
  { key: "thu", word: "day.thursday" },
  { key: "fri", word: "day.friday" },
  { key: "sat", word: "day.saturday" },
  { key: "sun", word: "day.sunday" },
];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URLISH = /^https?:\/\/[^\s]+$/;

/** One form over the settings row: Save appears once something changed, and errors sit under their fields. */
function useSettingsForm(settings: Row, columns: readonly string[]) {
  const initial = useMemo(() => Object.fromEntries(columns.map((c) => [c, text(settings[c]) ?? ""])), [settings, columns]);
  const [form, setForm] = useState(initial);
  useEffect(() => setForm(initial), [initial]);
  const dirty = columns.some((c) => form[c] !== initial[c]);
  return { form, set: (column: string, value: string) => setForm((f) => ({ ...f, [column]: value })), dirty, reset: () => setForm(initial) };
}

function SaveBar({ dirty, busy, onSave, onReset }: { dirty: boolean; busy: boolean; onSave: () => void; onReset: () => void }) {
  const t = useDeskT();
  if (!dirty) return null;
  return (
    <div className="lm-row-gap">
      <button type="button" className="lm-btn lm-btn--primary" disabled={busy} onClick={onSave}>
        {t("common.save")}
      </button>
      <button type="button" className="lm-btn" onClick={onReset}>
        {t("common.cancel")}
      </button>
    </div>
  );
}

function Text({ id, label, value, onChange, error, type = "text" }: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string | null; type?: string }) {
  return (
    <div className="lm-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} value={value} aria-invalid={error !== null && error !== undefined} aria-describedby={error ? `${id}-err` : undefined} onChange={(e) => onChange(e.target.value)} />
      {error && <FieldError id={`${id}-err`}>{error}</FieldError>}
    </div>
  );
}

function StudioTab({ settings }: { settings: Row }) {
  const { door } = useEnv();
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const { busy, run } = useRun();
  const columns = useMemo(() => ["studio_name", "address_line1", "city", "region", "zip", "email", "website"], []);
  const { form, set, dirty, reset } = useSettingsForm(settings, columns);
  const [errs, setErrs] = useState<Record<string, boolean>>({});
  const { zone } = door.facts();
  const clock = (value: unknown) => instantOf("2026-01-15", String(value), zone);
  const save = () => {
    const bad: Record<string, boolean> = {};
    if ((form["studio_name"] ?? "").trim() === "") bad["studio_name"] = true;
    if (form["email"] !== "" && !EMAIL.test(form["email"] ?? "")) bad["email"] = true;
    if (form["website"] !== "" && !URLISH.test(form["website"] ?? "")) bad["website"] = true;
    setErrs(bad);
    if (Object.keys(bad).length > 0) return;
    void run(async (d) => {
      await d.saveSettings(settings, Object.fromEntries(columns.map((c) => [c, (form[c] ?? "").trim() === "" ? null : (form[c] ?? "").trim()])));
      return t("toast.saved");
    });
  };
  const holidays = door.facts().addOns.includes("holiday-calendars");
  const studioClosures = data.closures.filter((row) => (row["team_id"] === null || row["team_id"] === undefined) && row["active"] !== false);
  return (
    <>
      <section className="lm-card lm-pad lm-stack-col">
        <Text id="lm-set-name" label={t("settings.name")} value={form["studio_name"] ?? ""} onChange={(v) => set("studio_name", v)} error={errs["studio_name"] ? t("settings.errName") : null} />
        <Text id="lm-set-addr" label={t("settings.address")} value={form["address_line1"] ?? ""} onChange={(v) => set("address_line1", v)} />
        <div className="lm-row-gap">
          <div className="lm-grow"><Text id="lm-set-city" label={t("settings.city")} value={form["city"] ?? ""} onChange={(v) => set("city", v)} /></div>
          <div className="lm-grow"><Text id="lm-set-region" label={t("settings.region")} value={form["region"] ?? ""} onChange={(v) => set("region", v)} /></div>
          <div className="lm-grow"><Text id="lm-set-zip" label={t("settings.zip")} value={form["zip"] ?? ""} onChange={(v) => set("zip", v)} /></div>
        </div>
        <Text id="lm-set-email" type="email" label={t("settings.email")} value={form["email"] ?? ""} onChange={(v) => set("email", v)} error={errs["email"] ? t("settings.errEmail") : null} />
        <Text id="lm-set-web" label={t("settings.web")} value={form["website"] ?? ""} onChange={(v) => set("website", v)} error={errs["website"] ? t("settings.errWeb") : null} />
        <div className="lm-field">
          <span className="lm-label">{t("settings.zone")}</span>
          <span className="lm-with">
            <Fig>{zone}</Fig>
            <a className="lm-link" href="/settings" target="_top">{t("settings.zoneWhere")}</a>
          </span>
        </div>
        <SaveBar dirty={dirty} busy={busy} onSave={save} onReset={reset} />
      </section>
      <section className="lm-card lm-pad lm-stack-col" aria-labelledby="lm-set-hours">
        <div className="lm-page-head">
          <h2 id="lm-set-hours">{t("settings.hours")}</h2>
          <a className="lm-btn" href="/p/bookings-opening-hours" target="_top">
            <ExternalLink size={14} aria-hidden="true" />
            {t("team.editInAdminium")}
          </a>
        </div>
        <div className="lm-week">
          {DAYS.map((d) => {
            const row = data.openingHours.find((h) => h["weekday"] === d.key);
            const open = row !== undefined && row["open"] !== false;
            return (
              <div key={d.key} className="lm-week-row">
                <span>{t(d.word)}</span>
                {open ? <Fig>{fmt.range(clock(row["opens"]), clock(row["closes"]))}</Fig> : <span className="lm-muted-sm">{t("calendar.closed")}</span>}
              </div>
            );
          })}
        </div>
      </section>
      <section className="lm-card lm-pad lm-stack-col" aria-labelledby="lm-set-closures">
        <h2 id="lm-set-closures">{t("settings.closures")}</h2>
        {studioClosures.length === 0 && <p className="lm-muted-sm">{t("settings.noClosures")}</p>}
        {studioClosures.map((row) => (
          <div key={String(row.id)} className="lm-week-row">
            <span>{text(row["name"])}</span>
            <Fig>{row["from_date"] === row["to_date"] ? fmt.day(String(row["from_date"]).slice(0, 10)) : `${fmt.day(String(row["from_date"]).slice(0, 10))} – ${fmt.day(String(row["to_date"]).slice(0, 10))}`}</Fig>
          </div>
        ))}
        <div className="lm-row-gap">
          <button type="button" className="lm-btn" onClick={() => openSheet({ kind: "closure" })}>
            <Plus size={14} aria-hidden="true" />
            {t("settings.addClosure")}
          </button>
          {holidays && (
            <a className="lm-btn" href="/add-ons/holiday-calendars" target="_top">
              <ExternalLink size={14} aria-hidden="true" />
              {t("settings.addHolidays")}
            </a>
          )}
        </div>
        {holidays && <p className="lm-hint">{t("settings.holidaysNote")}</p>}
      </section>
    </>
  );
}

const RULES: { column: string; label: DeskKey; sub: DeskKey; unit: DeskKey; scale: number; min: number; max: number }[] = [
  { column: "notice_min", label: "rules.notice", sub: "rules.noticeSub", unit: "rules.hours", scale: 60, min: 0, max: 336 },
  { column: "window_days", label: "rules.ahead", sub: "rules.aheadSub", unit: "rules.workingDays", scale: 1, min: 1, max: 365 },
  { column: "cancel_hours", label: "rules.cancel", sub: "rules.cancelSub", unit: "rules.hoursBefore", scale: 1, min: 0, max: 720 },
  { column: "hold_min", label: "rules.hold", sub: "rules.holdSub", unit: "rules.minutes", scale: 1, min: 5, max: 60 },
];

function RulesTab({ settings }: { settings: Row }) {
  const t = useDeskT();
  const { busy, run } = useRun();
  const initial = useMemo(() => Object.fromEntries(RULES.map((r) => [r.column, String((num(settings[r.column]) ?? 0) / r.scale)])), [settings]);
  const [form, setForm] = useState(initial);
  const [errs, setErrs] = useState<Record<string, boolean>>({});
  useEffect(() => setForm(initial), [initial]);
  const dirty = RULES.some((r) => form[r.column] !== initial[r.column]);
  const save = () => {
    const bad: Record<string, boolean> = {};
    for (const r of RULES) {
      const n = Number(form[r.column]);
      if (form[r.column] === "" || !Number.isInteger(n * r.scale) || n < r.min || n > r.max) bad[r.column] = true;
    }
    setErrs(bad);
    if (Object.keys(bad).length > 0) return;
    void run(async (d) => {
      await d.saveSettings(settings, Object.fromEntries(RULES.map((r) => [r.column, Number(form[r.column]) * r.scale])));
      return t("toast.saved");
    });
  };
  return (
    <section className="lm-card lm-pad lm-stack-col">
      {RULES.map((r) => (
        <div key={r.column} className="lm-rule">
          <span>
            <label htmlFor={`lm-rule-${r.column}`}>{t(r.label)}</label>
            <small>{t(r.sub)}</small>
          </span>
          <span className="lm-unit">
            <input id={`lm-rule-${r.column}`} inputMode="numeric" className="lm-input-mono" value={form[r.column] ?? ""} aria-invalid={errs[r.column] === true} aria-describedby={errs[r.column] ? `lm-rule-${r.column}-err` : undefined} onChange={(e) => setForm({ ...form, [r.column]: e.target.value.replace(/[^0-9.]/g, "") })} />
            <small>{t(r.unit)}</small>
          </span>
          {errs[r.column] && <FieldError id={`lm-rule-${r.column}-err`}>{t("rules.err", { min: r.min, max: r.max })}</FieldError>}
        </div>
      ))}
      <p className="lm-hint">{t("rules.note")}</p>
      <SaveBar dirty={dirty} busy={busy} onSave={save} onReset={() => setForm(initial)} />
    </section>
  );
}

function PaymentsTab({ settings }: { settings: Row }) {
  const { door } = useEnv();
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const { busy, run } = useRun();
  const payments = door.payments();
  const on = settings["online_payments"] === "on";
  const state: DeskKey = payments === null || !payments.on ? "payments.notSetUp" : !payments.online ? "payments.paused" : payments.test ? "payments.test" : "payments.live";
  const paid = data.services.filter((s) => s["online"] !== "none" && s["online"] !== undefined);
  return (
    <section className="lm-card lm-pad lm-stack-col">
      <div className="lm-switch-row">
        <span>
          <strong id="lm-pay-on">{t("payments.ownSwitch")}</strong>
          <small>{t("payments.ownSwitchSub")}</small>
        </span>
        <Switch
          on={on}
          labelledBy="lm-pay-on"
          disabled={busy}
          onChange={(next) =>
            void run(async (d) => {
              await d.saveSettings(settings, { online_payments: next ? "on" : "off" });
              return t("toast.saved");
            })
          }
        />
      </div>
      <div className="lm-note">
        <span className="lm-note-line">
          <CircleCheck size={16} aria-hidden="true" />
          <span>{t(state)}</span>
        </span>
        <small>{t("payments.how")}</small>
        <a className="lm-link" href="/settings/payments" target="_top">{t("payments.where")}</a>
      </div>
      <h2>{t("payments.paidOnline")}</h2>
      {paid.length === 0 && <p className="lm-muted-sm">{t("payments.none")}</p>}
      {paid.map((s) => (
        <div key={String(s.id)} className="lm-week-row">
          <span>{text(s["name"])}</span>
          <Fig>{s["online"] === "full" ? t("payments.full", { amt: fmt.money(s["price"]) }) : t("service.depositChip", { amt: fmt.money(s["deposit"]) })}</Fig>
        </div>
      ))}
      <p className="lm-hint">{t("payments.rest")}</p>
    </section>
  );
}

function RequestsTab({ settings }: { settings: Row }) {
  const t = useDeskT();
  const { busy, run } = useRun();
  const on = settings["reviews_on"] !== false;
  const savedDays = String(num(settings["review_reminder_days"]) ?? 4);
  const [days, setDays] = useState(savedDays);
  const [err, setErr] = useState(false);
  useEffect(() => setDays(savedDays), [savedDays]);
  const save = () => {
    const n = Number(days);
    if (!Number.isInteger(n) || n < 1 || n > 14) {
      setErr(true);
      return;
    }
    setErr(false);
    void run(async (d) => {
      await d.saveSettings(settings, { review_reminder_days: n });
      return t("toast.saved");
    });
  };
  return (
    <section className="lm-card lm-pad lm-stack-col">
      <div className="lm-switch-row">
        <strong id="lm-req-on">{t("requests.send")}</strong>
        <Switch
          on={on}
          labelledBy="lm-req-on"
          disabled={busy}
          onChange={(next) =>
            void run(async (d) => {
              await d.saveSettings(settings, { reviews_on: next });
              return t("toast.saved");
            })
          }
        />
      </div>
      <div className="lm-week-row">
        <span>{t("requests.when")}</span>
        <strong>{t("requests.morning")}</strong>
      </div>
      <div className="lm-rule">
        <span>
          <label htmlFor="lm-req-days">{t("requests.reminder")}</label>
          <small>{t("requests.reminderSub")}</small>
        </span>
        <span className="lm-unit">
          <input id="lm-req-days" inputMode="numeric" className="lm-input-mono" value={days} aria-invalid={err} aria-describedby={err ? "lm-req-days-err" : undefined} onChange={(e) => { setDays(e.target.value.replace(/[^0-9]/g, "")); setErr(false); }} />
          <small>{t("requests.days")}</small>
        </span>
        {err && <FieldError id="lm-req-days-err">{t("rules.err", { min: 1, max: 14 })}</FieldError>}
      </div>
      <SaveBar dirty={days !== savedDays} busy={busy} onSave={save} onReset={() => setDays(savedDays)} />
      <p className="lm-hint">{t("requests.note")}</p>
    </section>
  );
}

/** The engine's snippet (`apps/dashboard/src/studio/privacy/snippet.ts`), the same on the desk and in the console (BN-20). */
export function snippetOf(input: { origin: string; app: string; mount: string; path: string; choice: { query: string; value: string } | null; mode: "inline" | "button" | "floating"; words: string }): string {
  const escaped = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const path = input.choice === null ? input.path : `${input.path}?${input.choice.query}=${encodeURIComponent(input.choice.value)}`;
  const words = escaped(input.words.trim().slice(0, 28));
  const href = escaped(`${input.origin}${input.mount}${path === "/" ? "/" : path}`);
  const data = `data-adminium-app="${escaped(input.app)}" data-path="${escaped(path)}" data-mode="${input.mode}"`;
  const loader = `<script src="${escaped(input.origin)}/x/embed.js" async></script>`;
  if (input.mode === "button") return `${loader}\n<a ${data} data-label="${words}" href="${href}">${words}</a>`;
  const label = input.mode === "floating" ? ` data-label="${words}"` : "";
  return `${loader}\n<div ${data}${label}><a href="${href}">${words}</a></div>`;
}

function WebsiteTab() {
  const { door } = useEnv();
  const t = useDeskT();
  const [facts, setFacts] = useState<EmbedFacts | null | undefined>(undefined);
  const [mode, setMode] = useState<"inline" | "button" | "floating">("button");
  const [service, setService] = useState("");
  useEffect(() => {
    let live = true;
    void door.embeds().then((got) => live && setFacts(got), () => live && setFacts(null));
    return () => {
      live = false;
    };
  }, [door]);
  if (facts === undefined) return <p className="lm-muted-sm">{t("common.loading")}</p>;
  if (facts === null) {
    return (
      <section className="lm-card lm-pad lm-stack-col">
        <p>{t("website.noGrant")}</p>
      </section>
    );
  }
  const modes: { id: "inline" | "button" | "floating"; label: DeskKey; sub: DeskKey }[] = [
    { id: "inline", label: "website.inline", sub: "website.inlineSub" },
    { id: "button", label: "website.button", sub: "website.buttonSub" },
    { id: "floating", label: "website.floating", sub: "website.floatingSub" },
  ];
  const offered = facts.modes.length === 0 ? modes : modes.filter((m) => facts.modes.includes(m.id));
  const code = snippetOf({ origin: facts.origin, app: facts.app, mount: facts.mount, path: facts.path, choice: service !== "" && facts.query !== null ? { query: facts.query, value: service } : null, mode, words: t("website.bookWords") });
  return (
    <>
      <section className="lm-card lm-pad lm-stack-col" aria-labelledby="lm-web-sites">
        <div className="lm-page-head">
          <h2 id="lm-web-sites">{t("website.yours")}</h2>
          <a className="lm-btn" href="/settings/privacy" target="_top">
            <ExternalLink size={14} aria-hidden="true" />
            {t("website.manage")}
          </a>
        </div>
        {facts.sites.length === 0 && <p className="lm-muted-sm">{t("website.none")}</p>}
        {facts.sites.map((site) => (
          <div key={site} className="lm-week-row">
            <Fig>{site}</Fig>
            <span className="lm-allowed"><CircleCheck size={14} aria-hidden="true" /> {t("website.allowed")}</span>
          </div>
        ))}
        <p className="lm-hint">{t("website.oneList")}</p>
      </section>
      <section className="lm-card lm-pad lm-stack-col">
        <div role="radiogroup" aria-label={t("settings.website")} className="lm-modes">
          {offered.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} className={`lm-mode${mode === m.id ? " is-on" : ""}`} onClick={() => setMode(m.id)}>
              <span className={`lm-mode-prev is-${m.id}`} aria-hidden="true"><i /></span>
              <strong>{t(m.label)}</strong>
              <small>{t(m.sub)}</small>
            </button>
          ))}
        </div>
        {facts.services.length > 0 && (
          <div className="lm-field">
            <label htmlFor="lm-web-svc">{t("website.service")}</label>
            <select id="lm-web-svc" value={service} onChange={(e) => setService(e.target.value)}>
              <option value="">{t("website.anyService")}</option>
              {facts.services.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        )}
        <div className="lm-field">
          <span className="lm-label">{t("website.paste")}</span>
          <pre className="lm-code" dir="ltr">{code}</pre>
        </div>
        <button type="button" className="lm-btn lm-self-start" onClick={() => void navigator.clipboard.writeText(code).then(() => toast(t("toast.snippet")))}>
          <Copy size={14} aria-hidden="true" />
          {t("website.copy")}
        </button>
      </section>
    </>
  );
}

function EmailsTab({ settings }: { settings: Row }) {
  const t = useDeskT();
  const { busy, run } = useRun();
  const columns = useMemo(() => ["email"], []);
  const { form, set, dirty, reset } = useSettingsForm(settings, columns);
  const [err, setErr] = useState(false);
  const save = () => {
    const value = (form["email"] ?? "").trim();
    if (value !== "" && !EMAIL.test(value)) {
      setErr(true);
      return;
    }
    setErr(false);
    void run(async (d) => {
      await d.saveSettings(settings, { email: value === "" ? null : value });
      return t("toast.saved");
    });
  };
  return (
    <section className="lm-card lm-pad lm-stack-col">
      <Text id="lm-mail-reply" type="email" label={t("emails.replyTo")} value={form["email"] ?? ""} onChange={(v) => { set("email", v); setErr(false); }} error={err ? t("settings.errEmail") : null} />
      <p className="lm-hint">{t("emails.replyHint")}</p>
      <div className="lm-week-row">
        <span>{t("emails.reminder")}</span>
        <strong>{t("emails.reminderWhen")}</strong>
      </div>
      <SaveBar dirty={dirty} busy={busy} onSave={save} onReset={reset} />
    </section>
  );
}

export function SettingsScreen() {
  const data = useData();
  const t = useDeskT();
  const tab = useDesk((s) => s.settingsTab);
  const settings = data.settings;
  let body: ReactNode = null;
  if (settings !== null) {
    if (tab === "studio") body = <StudioTab settings={settings} />;
    if (tab === "rules") body = <RulesTab settings={settings} />;
    if (tab === "payments") body = <PaymentsTab settings={settings} />;
    if (tab === "requests") body = <RequestsTab settings={settings} />;
    if (tab === "website") body = <WebsiteTab />;
    if (tab === "emails") body = <EmailsTab settings={settings} />;
  }
  return (
    <div className="lm-page lm-page--narrow">
      <h1 className="lm-page-title">{t("nav.settings")}</h1>
      <div role="tablist" aria-label={t("nav.settings")} className="lm-chip-row">
        {TABS.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} className={`lm-chip${tab === x.id ? " is-on" : ""}`} onClick={() => useDesk.setState({ settingsTab: x.id })}>
            {t(x.word)}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="lm-stack-col">
        {body}
      </div>
    </div>
  );
}
