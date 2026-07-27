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
import { formatLongDate, money, spanLabel } from "../lib/format.ts";
import { simpleDaySummaries } from "../lib/slots.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-group.css";

export default function Group() {
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
    label: `${s.name} · ${money(s.price)}`,
  }));

  const partyLabel = `${guests.length} guests`;
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
      <main className="sm-screen sm-page sm-group-page">
        <div className="sm-group-done">
          <SuccessTile icon="users" iconSize={34} />
          <h1 className="sm-h1">Your group request is in!</h1>
          <p className="sm-group-done__sub">
            We&apos;ll text you within a few hours to lock in exact times for{" "}
            {formatLongDate(day)}.
          </p>
          <CodePill label="Request code" code={grpCode} codeSize={20} />

          <Card radius={20} clip className="sm-group-summary">
            <PanelHeader>Your party</PanelHeader>
            <div className="sm-group-summary__body">
              {guests.map((g, i) => {
                const svc = data.getService(g.svc);
                return (
                  <div className="sm-group-summary__row" key={`${g.svc}-${i}`}>
                    <span className="sm-group-summary__name">
                      {g.name || "Guest"}
                    </span>
                    <span className="sm-group-summary__svc">
                      {svc?.name ?? ""}
                    </span>
                    <span className="sm-mono sm-group-summary__price">
                      {money(svc?.price ?? 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Banner tone="info" className="sm-group-done__banner">
            This is a demo — no real request is sent and no times are actually
            held.
          </Banner>

          <div className="sm-group-done__actions">
            <Button
              variant="ghost"
              size="lg"
              icon="users"
              className="sm-group-done__btn"
              onClick={grpReset}
            >
              New request
            </Button>
            <Button
              size="lg"
              icon="home"
              className="sm-group-done__btn"
              onClick={() => go("home")}
            >
              Back home
            </Button>
          </div>
        </div>
      </main>
    );
  }

  /* ---------------- form ---------------- */

  return (
    <main className="sm-screen sm-page sm-group-page">
      <BackLink onClick={() => go("home")}>Back home</BackLink>

      <div className="sm-group-head">
        <h1 className="sm-h1">Group booking</h1>
        <p className="sm-sub">
          Bridal party, birthday, or a spa day with friends — tell us
          who&apos;s coming and we&apos;ll line up the timing.
        </p>
      </div>

      <section className="sm-group-section">
        <div className="sm-group-partyhead">
          <span className="sm-group-title">Your party</span>
          <span className="sm-mono sm-group-count">{partyLabel}</span>
        </div>

        <div className="sm-group-guests">
          {guests.map((g, i) => (
            <div className="sm-group-guest" key={i}>
              <span className="sm-mono sm-group-guest__num">{i + 1}</span>
              <TextInput
                className="sm-group-guest__name"
                value={g.name}
                onChange={(v) => setGroupGuest(i, { name: v })}
                placeholder="Guest name"
                ariaLabel={`Guest ${i + 1} name`}
              />
              <Select
                className="sm-group-guest__svc"
                value={g.svc}
                onChange={(v) => setGroupGuest(i, { svc: v })}
                options={options}
                ariaLabel={`Guest ${i + 1} service`}
              />
              {guests.length > 2 ? (
                <IconButton
                  icon="trash-2"
                  label={`Remove guest ${i + 1}`}
                  size={38}
                  iconSize={16}
                  className="sm-group-guest__remove"
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
            className="sm-group-add"
            onClick={addGuest}
          >
            Add guest
          </Button>
        ) : null}
      </section>

      <section className="sm-group-section">
        <span className="sm-group-title sm-group-title--block">
          Preferred date
        </span>
        <WeekStrip
          days={simpleDaySummaries(week)}
          value={grpDateIdx}
          onSelect={setGrpDateIdx}
          label="Preferred date"
        />
      </section>

      <section className="sm-group-section sm-group-section--tight">
        <span className="sm-group-title sm-group-title--block">
          Who should we confirm with?
        </span>
        <div className="sm-group-fields">
          <Field label="Your name">
            {(c) => (
              <TextInput
                {...c}
                value={grpName}
                onChange={(v) => setGrpField("grpName", v)}
                placeholder="Ava Reyes"
              />
            )}
          </Field>
          <div className="sm-group-pair">
            <Field label="Email">
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
            <Field label="Phone">
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
        <Banner tone="danger" className="sm-group-err">
          {grpErr}
        </Banner>
      ) : null}

      <div className="sm-group-bar">
        <div className="sm-group-bar__stats">
          <div>
            <div className="sm-group-stat__label">Party</div>
            <div className="sm-group-stat__value">{partyLabel}</div>
          </div>
          <div>
            <div className="sm-group-stat__label">Est. time</div>
            <div className="sm-mono sm-group-stat__value">
              {spanLabel(duration)}
            </div>
          </div>
          <div>
            <div className="sm-group-stat__label">Est. total</div>
            <div className="sm-mono sm-group-stat__value">{money(total)}</div>
          </div>
        </div>
        <Button size="lg" icon="send" className="sm-group-cta" onClick={grpSubmit}>
          Request booking
        </Button>
      </div>

      <p className="sm-group-note">
        <Icon name="info" size={14} />
        For parties of two or more we confirm exact times by text, so everyone
        flows through smoothly.
      </p>
    </main>
  );
}
