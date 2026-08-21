/*
 * PAYROLL & TIPS (view: 'admin-payroll') — Admin comp template 353–385,
 * logic 1083–1101.
 *
 * StudioChrome owns the heading and the body padding; this file is the body.
 *
 * The comp's toolbar and table head were `position: sticky` inside their own
 * scroll pane. The shipped studio shell scrolls the whole page under a sticky
 * topbar, so a second sticky layer would collide with it — both scroll here.
 */

import { useMemo } from "react";

import { Avatar, Banner, Button, Chip } from "../components/index.ts";
import {
  PAY_PERIODS,
  PAYROLL,
  WAGE_TARGET,
} from "../data/screens/admin-payroll.ts";
import { data } from "../data/source.ts";
import { useI18n } from "../i18n/index.tsx";
import { formatISORange, wholeMoney } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-admin-payroll.css";

/*
 * Whole dollars. `money()` in lib/format is the guest-facing two-decimal
 * formatter (ruling R9); "$4,820.00" in every cell would drown the table.
 * `wholeMoney()` groups and places the symbol per the active locale — the
 * `toLocaleString("en-US")` this used to pin was a promise to one reader.
 */
const dollars = wholeMoney;

export default function AdminPayroll() {
  const { locale, t, number } = useI18n();
  const payPeriod = useStore((s) => s.payPeriod);
  const payRun = useStore((s) => s.payRun);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const period =
    PAY_PERIODS.find((p) => p.id === payPeriod) ?? PAY_PERIODS[0];
  const periodRange = formatISORange(period.fromISO, period.toISO);

  const { rows, kpis } = useMemo(() => {
    let payTotal = 0;
    let tipTotal = 0;
    let hoursTotal = 0;
    let svcTotal = 0;

    /* `flatMap` rather than `map`: a seeded row whose specialist is no longer
     * in the staff seam is dropped instead of rendered nameless. */
    const built = PAYROLL.flatMap((p) => {
      const staff = data.getStaffMember(p.staffId);
      if (!staff) return [];

      const hours = Math.round(p.hours * period.multiplier);
      const services = Math.round(p.services * period.multiplier);
      const tips = Math.round(p.tips * period.multiplier);
      const commission = Math.round(services * p.pct);
      const total = commission + tips;

      payTotal += total;
      tipTotal += tips;
      hoursTotal += hours;
      svcTotal += services;

      return [
        {
          id: p.staffId,
          name: staff.name,
          initials: staff.initials,
          tint: staff.tint,
          rate: t(p.rateKey, {
            share:
              p.share === undefined
                ? ""
                : number(p.share, { style: "percent", maximumFractionDigits: 0 }),
            hourly: p.hourly === undefined ? "" : dollars(p.hourly),
          }),
          hours: number(hours),
          services: dollars(services),
          commission: dollars(commission),
          tips: dollars(tips),
          total: dollars(total),
        },
      ];
    });

    return {
      rows: built,
      kpis: [
        {
          label: t("screensA.payroll.kpiTotal"),
          value: dollars(payTotal),
          sub: t("screensA.payroll.kpiTotalSub"),
        },
        {
          label: t("screensA.payroll.kpiTips"),
          value: dollars(tipTotal),
          sub: t("screensA.payroll.kpiTipsSub"),
        },
        {
          label: t("screensA.payroll.kpiHours"),
          value: number(hoursTotal),
          sub: t("screensA.payroll.kpiHoursSub", {}, built.length),
        },
        {
          label: t("screensA.payroll.kpiWage"),
          value: number(payTotal / Math.max(1, svcTotal), {
            style: "percent",
            maximumFractionDigits: 0,
          }),
          sub: t("screensA.payroll.kpiWageSub", {
            target: number(WAGE_TARGET, {
              style: "percent",
              maximumFractionDigits: 0,
            }),
          }),
        },
      ],
    };
  /* `locale` is a dependency of every memo that formats: the formatters
   * read it from the ambient bridge, so a switch that did not invalidate
   * these would leave the last locale’s text cached on screen. */
  }, [period, locale, t, number]);

  return (
    <div className="scr-admin-payroll">
      <div className="pay-bar">
        {PAY_PERIODS.map((p) => (
          <Chip
            key={p.id}
            label={t(p.labelKey)}
            active={payPeriod === p.id}
            /* Approving one period says nothing about the next, so switching
             * periods drops the approved state — as the comp did. */
            onClick={() => set({ payPeriod: p.id, payRun: false })}
          />
        ))}
        <span className="pay-bar__gap" />
        <span className="pay-bar__period">{periodRange}</span>
        <Button
          /* No `play` glyph in the registry; `send` is the closest run-it-now
           * affordance it carries. */
          icon={payRun ? "check" : "send"}
          iconSize={15}
          size="sm"
          variant={payRun ? "ghost" : "primary"}
          disabled={payRun}
          className="pay-run"
          onClick={() => {
            set({ payRun: true });
            showToast(t("screensA.payroll.approvedToast"), "ok");
          }}
        >
          {t(payRun ? "screensA.payroll.approved" : "screensA.payroll.run")}
        </Button>
      </div>

      <div className="pay-kpis">
        {kpis.map((k) => (
          <div className="pay-kpi" key={k.label}>
            <span className="pay-kpi__label">{k.label}</span>
            <span className="pay-kpi__value bk-mono">{k.value}</span>
            <span className="pay-kpi__sub">{k.sub}</span>
          </div>
        ))}
      </div>

      {/* A real table: six aligned numeric columns with a header row is
        * exactly what one is for, and it scrolls sideways on a phone rather
        * than crushing the figures. */}
      <div className="pay-tablewrap bk-panel">
        <table className="pay-table">
          <caption className="pay-table__caption">
            {t("screensA.payroll.caption", {
              period: t(period.labelKey),
              range: periodRange,
            })}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="pay-table__whocol">
                {t("screensA.payroll.colStaff")}
              </th>
              <th scope="col">{t("screensA.payroll.colHours")}</th>
              <th scope="col">{t("screensA.payroll.colServices")}</th>
              <th scope="col">{t("screensA.payroll.colCommission")}</th>
              <th scope="col">{t("screensA.payroll.colTips")}</th>
              <th scope="col">{t("screensA.payroll.colTotal")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <th scope="row" className="pay-table__whocol">
                  <span className="pay-who">
                    <Avatar
                      initials={r.initials}
                      tint={r.tint}
                      size={32}
                      fontSize={11}
                      radius={16}
                    />
                    <span className="pay-who__text">
                      <span className="pay-who__name">{r.name}</span>
                      <span className="pay-who__rate">{r.rate}</span>
                    </span>
                  </span>
                </th>
                <td className="bk-mono">{r.hours}</td>
                <td className="bk-mono">{r.services}</td>
                <td className="bk-mono pay-table__muted">{r.commission}</td>
                <td className="bk-mono pay-table__tips">{r.tips}</td>
                <td className="bk-mono pay-table__total">{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Banner tone="info" icon="info" className="pay-note">
        {t("screensA.payroll.note")}
      </Banner>
    </div>
  );
}
