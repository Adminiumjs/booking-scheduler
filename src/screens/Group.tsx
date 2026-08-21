/*
 * Group booking (spec §3.7, §6.11) — view `group`.
 *
 * A request form, not a booking: `grpSubmit()` validates, mints `GRP-{nextNum}`
 * and reserves nothing (no appointments are written, so no slots are held).
 * The date strip uses `simpleDaySummaries` — Closed / Today / '' — because no
 * service is chosen yet and there is nothing to count openings for.
 */

import {
  BackLink,
  Banner,
  Button,
  Card,
  CodePill,
  Field,
  Icon,
  IconButton,
  PanelHeader,
  Select,
  SuccessTile,
  TextInput,
  WeekStrip,
} from "../components/index.ts";
import { data } from "../data/source.ts";
import { useI18n } from "../i18n/index.tsx";
import { formatLongDate, money, spanLabel } from "../lib/format.ts";
import { simpleDaySummaries } from "../lib/slots.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-group.css";

export default function Group() {
  const { t, number } = useI18n();
  const guests = useStore((s) => s.groupGuests);
  const grpName = useStore((s) => s.grpName);
  const grpEmail = useStore((s) => s.grpEmail);
  const grpPhone = useStore((s) => s.grpPhone);
  const grpDateIdx = useStore((s) => s.grpDateIdx);
  const grpErr = useStore((s) => s.grpErr);
  const grpCode = useStore((s) => s.grpCode);
  const week = useStore((s) => s.week);

  const setGroupGuest = useStore((s) => s.setGroupGuest);
  const addGuest = useStore((s) => s.addGuest);
  const removeGuest = useStore((s) => s.removeGuest);
  const setGrpField = useStore((s) => s.setGrpField);
  const setGrpDateIdx = useStore((s) => s.setGrpDateIdx);
  const grpSubmit = useStore((s) => s.grpSubmit);
  const grpReset = useStore((s) => s.grpReset);
  const go = useStore((s) => s.go);

  const services = data.getServices();
  const options = services.map((s) => ({
    value: s.id,
    label: t("screensA.group.option", { name: s.name, price: money(s.price) }),
  }));

  const partyLabel = t("count.guest", {}, guests.length);
  const total = guests.reduce(
    (sum, g) => sum + (data.getService(g.svc)?.price ?? 0),
    0,
  );
  const duration = guests.reduce(
    (sum, g) => sum + (data.getService(g.svc)?.dur ?? 0),
    0,
  );

  /* ---------------- done ---------------- */

  if (grpCode) {
    const day = week[grpDateIdx] ?? week[0];
    return (
      <main className="bk-screen bk-page bk-group-page">
        <div className="bk-group-done">
          <SuccessTile icon="users" iconSize={34} />
          <h1 className="bk-h1">{t("screensA.group.doneTitle")}</h1>
          <p className="bk-group-done__sub">
            {t("screensA.group.doneSub", { date: formatLongDate(day) })}
          </p>
          <CodePill
            label={t("screensA.group.codeLabel")}
            code={grpCode}
            codeSize={20}
          />

          <Card radius={20} clip className="bk-group-summary">
            <PanelHeader>{t("screensA.group.party")}</PanelHeader>
            <div className="bk-group-summary__body">
              {guests.map((g, i) => {
                const svc = data.getService(g.svc);
                return (
                  <div className="bk-group-summary__row" key={`${g.svc}-${i}`}>
                    <span className="bk-group-summary__name">
                      {g.name || t("screensA.group.guestFallback")}
                    </span>
                    <span className="bk-group-summary__svc">
                      {svc?.name ?? ""}
                    </span>
                    <span className="bk-mono bk-group-summary__price">
                      {money(svc?.price ?? 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Banner tone="info" className="bk-group-done__banner">
            {t("screensA.group.banner")}
          </Banner>

          <div className="bk-group-done__actions">
            <Button
              variant="ghost"
              size="lg"
              icon="users"
              className="bk-group-done__btn"
              onClick={grpReset}
            >
              {t("screensA.group.newRequest")}
            </Button>
            <Button
              size="lg"
              icon="home"
              className="bk-group-done__btn"
              onClick={() => go("home")}
            >
              {t("screensA.common.backHome")}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------- form ---------------- */

  return (
    <main className="bk-screen bk-page bk-group-page">
      <BackLink onClick={() => go("home")}>
        {t("screensA.common.backHome")}
      </BackLink>

      <div className="bk-group-head">
        <h1 className="bk-h1">{t("screensA.group.title")}</h1>
        <p className="bk-sub">{t("screensA.group.sub")}</p>
      </div>

      <section className="bk-group-section">
        <div className="bk-group-partyhead">
          <span className="bk-group-title">{t("screensA.group.party")}</span>
          <span className="bk-mono bk-group-count">{partyLabel}</span>
        </div>

        <div className="bk-group-guests">
          {guests.map((g, i) => (
            <div className="bk-group-guest" key={i}>
              <span className="bk-mono bk-group-guest__num">{number(i + 1)}</span>
              <TextInput
                className="bk-group-guest__name"
                value={g.name}
                onChange={(v) => setGroupGuest(i, { name: v })}
                placeholder={t("screensA.group.guestName")}
                ariaLabel={t("screensA.group.guestNameAria", {
                  n: number(i + 1),
                })}
              />
              <Select
                className="bk-group-guest__svc"
                value={g.svc}
                onChange={(v) => setGroupGuest(i, { svc: v })}
                options={options}
                ariaLabel={t("screensA.group.guestSvcAria", {
                  n: number(i + 1),
                })}
              />
              {guests.length > 2 ? (
                <IconButton
                  icon="trash-2"
                  label={t("screensA.group.removeGuest", { n: number(i + 1) })}
                  size={38}
                  iconSize={16}
                  className="bk-group-guest__remove"
                  onClick={() => removeGuest(i)}
                />
              ) : null}
            </div>
          ))}
        </div>

        {guests.length < 8 ? (
          <Button
            variant="ghost"
            icon="plus"
            className="bk-group-add"
            onClick={addGuest}
          >
            {t("screensA.group.addGuest")}
          </Button>
        ) : null}
      </section>

      <section className="bk-group-section">
        <span className="bk-group-title bk-group-title--block">
          {t("screensA.group.preferredDate")}
        </span>
        <WeekStrip
          days={simpleDaySummaries(week)}
          value={grpDateIdx}
          onSelect={setGrpDateIdx}
          label={t("screensA.group.preferredDate")}
        />
      </section>

      <section className="bk-group-section bk-group-section--tight">
        <span className="bk-group-title bk-group-title--block">
          {t("screensA.group.confirmWith")}
        </span>
        <div className="bk-group-fields">
          <Field label={t("screensA.common.yourName")}>
            {(c) => (
              <TextInput
                {...c}
                value={grpName}
                onChange={(v) => setGrpField("grpName", v)}
                placeholder="Ava Reyes"
              />
            )}
          </Field>
          <div className="bk-group-pair">
            <Field label={t("screensA.common.email")}>
              {(c) => (
                <TextInput
                  {...c}
                  value={grpEmail}
                  onChange={(v) => setGrpField("grpEmail", v)}
                  placeholder="you@email.com"
                  type="email"
                  inputMode="email"
                />
              )}
            </Field>
            <Field label={t("screensA.common.phone")}>
              {(c) => (
                <TextInput
                  {...c}
                  value={grpPhone}
                  onChange={(v) => setGrpField("grpPhone", v)}
                  placeholder="(415) 555-0100"
                  type="tel"
                  inputMode="tel"
                />
              )}
            </Field>
          </div>
        </div>
      </section>

      {grpErr ? (
        <Banner tone="danger" className="bk-group-err">
          {grpErr}
        </Banner>
      ) : null}

      <div className="bk-group-bar">
        <div className="bk-group-bar__stats">
          <div>
            <div className="bk-group-stat__label">
              {t("screensA.group.statParty")}
            </div>
            <div className="bk-group-stat__value">{partyLabel}</div>
          </div>
          <div>
            <div className="bk-group-stat__label">
              {t("screensA.group.statTime")}
            </div>
            <div className="bk-mono bk-group-stat__value">
              {spanLabel(duration)}
            </div>
          </div>
          <div>
            <div className="bk-group-stat__label">
              {t("screensA.group.statTotal")}
            </div>
            <div className="bk-mono bk-group-stat__value">{money(total)}</div>
          </div>
        </div>
        <Button size="lg" icon="send" className="bk-group-cta" onClick={grpSubmit}>
          {t("screensA.group.submit")}
        </Button>
      </div>

      <p className="bk-group-note">
        <Icon name="info" size={14} />
        {t("screensA.group.note")}
      </p>
    </main>
  );
}
