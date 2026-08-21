/*
 * REPORTS (view: 'admin-reports') — Admin comp template 609–654,
 * logic 1235–1260.
 *
 * StudioChrome owns the heading and the body padding; this file is the body.
 * Every figure is derived from the seed for the selected range, so switching
 * the range moves the whole page at once.
 */

import { useMemo } from "react";
import type { CSSProperties } from "react";

import { Avatar, Button, Chip } from "../components/index.ts";
import {
  REPORT_KPIS,
  REPORT_RANGES,
  REVENUE_MIX,
  REVENUE_SERIES,
  TOP_CLIENTS,
} from "../data/screens/admin-reports.ts";
import { useI18n } from "../i18n/index.tsx";
import { formatISORange, weekdayName, wholeMoney } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-admin-reports.css";

/* Whole dollars — see the note in AdminPayroll; `money()` is the guest-facing
 * two-decimal formatter and reads as noise on a reporting page. */
const dollars = wholeMoney;

export default function AdminReports() {
  const { locale, t, number } = useI18n();
  const repRange = useStore((s) => s.repRange);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const range = REPORT_RANGES.find((r) => r.id === repRange) ?? REPORT_RANGES[0];

  const kpis = useMemo(
    () =>
      REPORT_KPIS.map((k) => {
        const scaled = (k.base ?? 0) * range.multiplier;
        const figure = k.fixed ?? scaled;
        return {
          label: t(k.labelKey),
          value: k.money
            ? dollars(figure)
            : k.fixed !== undefined
              ? /* A bare `fixed` that is not money is a rate, e.g. the 72%
                 * rebook figure — a fraction in the seed, a percentage here. */
                number(figure, { style: "percent", maximumFractionDigits: 0 })
              : number(Math.round(figure)),
          /* The sign is `Intl`'s to draw: `signDisplay` puts it on the side the
           * locale writes it, which `'+' + n` only ever got right in English. */
          delta: number(k.delta, {
            style: "percent",
            maximumFractionDigits: 0,
            signDisplay: "exceptZero",
          }),
          up: k.delta >= 0,
        };
      }),
    [range, locale, t, number],
  );

  /*
   * The comp sized each bar in px against a fixed 140px scale, which overflowed
   * the 170px chart once a longer range multiplied the series. Sizing every bar
   * as a share of the tallest bar in the *current* range keeps the shape and
   * can never outgrow the track.
   */
  const bars = useMemo(() => {
    const scaled = REVENUE_SERIES.map((d) => Math.round(d.value * range.chartScale));
    const max = Math.max(...scaled, 1);
    return REVENUE_SERIES.map((d, i) => ({
      day: d.day,
      pct: Math.max(4, Math.round((scaled[i] / max) * 100)),
      /* Taller days read as stronger: 35% accent at the floor, 85% at the top. */
      alpha: Math.round((0.35 + 0.5 * (scaled[i] / max)) * 100),
      /* The range always ends on the day in progress — drawn flat and grey. */
      inProgress: i === REVENUE_SERIES.length - 1,
    }));
  }, [range]);

  const mix = useMemo(() => {
    const max = Math.max(...REVENUE_MIX.map((m) => m.value), 1);
    return REVENUE_MIX.map((m) => ({
      label: t(m.labelKey),
      tint: m.tint,
      amount: dollars(m.value * range.multiplier),
      pct: Math.round((m.value / max) * 100),
    }));
    /* `locale` is a dependency of every memo that formats: the formatters read
     * it from the ambient bridge, so a switch that did not invalidate these
     * would leave the last locale’s text cached on screen. */
  }, [range, locale, t]);

  return (
    <div className="scr-admin-reports">
      <div className="rep-bar">
        {REPORT_RANGES.map((r) => (
          <Chip
            key={r.id}
            label={t(r.labelKey, r.days === undefined ? undefined : { count: number(r.days) }, r.days)}
            active={repRange === r.id}
            onClick={() => set({ repRange: r.id })}
          />
        ))}
        <span className="rep-bar__gap" />
        <Button
          variant="ghost"
          icon="file-down"
          iconSize={15}
          size="sm"
          onClick={() =>
            showToast(
              t("screensA.reports.downloaded", {
                file: `lumen-report-${range.id}.csv`,
              }),
              "ok",
            )
          }
        >
          {t("screensA.reports.exportCsv")}
        </Button>
      </div>

      <div className="rep-kpis">
        {kpis.map((k) => (
          <div className="rep-kpi" key={k.label}>
            <span className="rep-kpi__label">{k.label}</span>
            <span className="rep-kpi__figure">
              <span className="rep-kpi__value bk-mono">{k.value}</span>
              <span className="rep-kpi__delta" data-up={k.up ? "true" : "false"}>
                {k.delta}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="rep-grid">
        <section className="bk-panel rep-card rep-chart">
          <div className="rep-chart__head">
            <h2 className="rep-card__title">
              {t("screensA.reports.revenueByDay")}
            </h2>
            <span className="rep-chart__range">
              {formatISORange(range.fromISO, range.toISO)}
            </span>
          </div>
          <div className="rep-chart__plot">
            {bars.map((b) => (
              <div className="rep-bar-col" key={b.day}>
                <span className="rep-bar-col__track">
                  <span
                    className="rep-bar-col__fill"
                    data-progress={b.inProgress ? "true" : "false"}
                    style={
                      {
                        blockSize: `${b.pct}%`,
                        "--bar-alpha": `${b.alpha}%`,
                      } as CSSProperties
                    }
                  />
                </span>
                {/* `day` is a `Date.getDay()` index, not a label — printing it
                  * raw put "1 2 3 4 5 6 0" under the chart. */}
                <span className="rep-bar-col__day">
                  {weekdayName(b.day, "short")}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="rep-col">
          <section className="bk-panel rep-card">
            <h2 className="rep-card__title rep-card__title--spaced">
              {t("screensA.reports.mixTitle")}
            </h2>
            <div className="rep-mix">
              {mix.map((m) => (
                <div className="rep-mix__row" key={m.label}>
                  <div className="rep-mix__head">
                    <span
                      className="rep-mix__dot"
                      style={{ "--tint": m.tint } as CSSProperties}
                    />
                    <span className="rep-mix__label">{m.label}</span>
                    <span className="rep-mix__amount bk-mono">{m.amount}</span>
                  </div>
                  <div className="rep-mix__track">
                    <div
                      className="rep-mix__fill"
                      style={
                        {
                          inlineSize: `${m.pct}%`,
                          "--tint": m.tint,
                        } as CSSProperties
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bk-panel rep-card rep-card--banded">
            <h2 className="rep-band">{t("screensA.reports.topTitle")}</h2>
            <ul className="rep-top">
              {TOP_CLIENTS.map((c) => (
                <li className="rep-top__row" key={c.name}>
                  <Avatar
                    initials={c.initials}
                    tint={c.tint}
                    size={30}
                    fontSize={11}
                    radius={15}
                  />
                  <span className="rep-top__id">
                    <span className="rep-top__name">{c.name}</span>
                    <span className="rep-top__sub">
                      {t("screensA.reports.topSub", { staff: c.staff }, c.visits)}
                    </span>
                  </span>
                  <span className="rep-top__amount bk-mono">
                    {dollars(c.spend)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
