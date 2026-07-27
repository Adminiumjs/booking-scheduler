/*
 * Booking (view: 'booking') — port spec §3.3.
 *
 * Four steps behind one stepper: Service → Staff → Date & time → Your details.
 * Every transition and every validation message lives in the store (§6.4); this
 * screen only renders and calls actions. Availability comes exclusively from
 * the `useSlots*` hooks — ruling R2 (real interval overlap) and R3 (a
 * reschedule excludes its own booking) are already baked into them.
 */

import type { ReactNode } from "react";

import {
  BackLink,
  Button,
  Card,
  Chip,
  EmptyState,
  Eyebrow,
  Field,
  Icon,
  IconTile,
  NumberStepper,
  PanelHeader,
  Segmented,
  ServiceRow,
  SlotButton,
  SlotSkeleton,
  StaffRow,
  Stepper,
  TextArea,
  TextInput,
  Toggle,
  WaitlistCard,
  WeekStrip,
} from "../components/index.ts";
import type { SegmentedOption } from "../components/index.ts";
import { data } from "../data/source.ts";
import type { RecurFreq, ReminderWhen } from "../data/types.ts";
import {
  firstName,
  formatShortDate,
  formatShortISO,
  isoOf,
  minutesToTime,
  money,
} from "../lib/format.ts";
import { isSlotSelected, recurLabel, resolveStaffId, seriesDates } from "../lib/slots.ts";
import {
  reachMax,
  STEP_LABELS,
  useDayFull,
  useDaySummaries,
  useSelectedDate,
  useSlotContext,
  useSlotGroups,
  useStore,
} from "../state/store.ts";

import "../styles/screen-booking.css";

const NOTE_MAX = 280;

const REMINDER_OPTIONS: readonly SegmentedOption<ReminderWhen>[] = [
  { value: "24h", label: "24h before" },
  { value: "2h", label: "2h before" },
  { value: "both", label: "Both" },
];

const RECUR_OPTIONS: readonly SegmentedOption<RecurFreq>[] = [
  { value: "1w", label: "Weekly" },
  { value: "2w", label: "Every 2 wks" },
  { value: "4w", label: "Every 4 wks" },
];

/* ------------------------------------------------------------------ *
 * Screen-local bits
 * ------------------------------------------------------------------ */

interface CardHeadProps {
  icon: string;
  title: string;
  sub?: string;
  aside?: ReactNode;
}

/** Icon + title (+ optional sub) band at the top of a step-3 card. */
function CardHead({ icon, title, sub, aside }: CardHeadProps) {
  return (
    <div className="sm-booking__cardhead">
      <span className="sm-booking__cardhead-icon">
        <Icon name={icon} size={16} />
      </span>
      <span className="sm-booking__cardhead-text">
        <span className="sm-booking__cardhead-title">{title}</span>
        {sub ? <span className="sm-booking__cardhead-sub">{sub}</span> : null}
      </span>
      {aside}
    </div>
  );
}

interface ToggleRowProps {
  icon: string;
  title: string;
  sub: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

function ToggleRow({ icon, title, sub, checked, onChange }: ToggleRowProps) {
  return (
    <div className="sm-booking__togglerow">
      <span className="sm-booking__togglerow-icon">
        <Icon name={icon} size={16} />
      </span>
      <span className="sm-booking__togglerow-text">
        <span className="sm-booking__togglerow-title">{title}</span>
        <span className="sm-booking__togglerow-sub">{sub}</span>
      </span>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

interface SummaryRowProps {
  icon: string;
  label: string;
  value: string;
  mono?: boolean;
}

function SummaryRow({ icon, label, value, mono = false }: SummaryRowProps) {
  return (
    <div className="sm-booking__srow">
      <span className="sm-booking__srow-key">
        <Icon name={icon} size={15} />
        {label}
      </span>
      <span className={mono ? "sm-mono sm-booking__srow-val" : "sm-booking__srow-val"}>
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Step 0 — Service
 * ------------------------------------------------------------------ */

function StepService() {
  const bCat = useStore((s) => s.bCat);
  const setBCat = useStore((s) => s.setBCat);
  const svcId = useStore((s) => s.svcId);
  const selectSvc = useStore((s) => s.selectSvc);
  const go = useStore((s) => s.go);

  const categories = data.getCategories();
  const services = data.getServicesByCategory(bCat);

  return (
    <section className="sm-booking__step">
      <header className="sm-booking__head">
        <h2 className="sm-h2">What can we do for you?</h2>
        <p className="sm-sub">Choose a service to get started.</p>
      </header>

      <button type="button" className="sm-booking__promo" onClick={() => go("group")}>
        <span className="sm-booking__promo-tile">
          <Icon name="users" size={18} />
        </span>
        <span className="sm-booking__promo-text">
          <span className="sm-booking__promo-title">Booking for a group?</span>
          <span className="sm-booking__promo-sub">
            Set up a party of 2–8 and we’ll coordinate the timing.
          </span>
        </span>
        <Icon name="arrow-right" size={16} />
      </button>

      <div className="sm-booking__chips">
        <Chip
          label="All"
          active={bCat === "all"}
          onClick={() => setBCat("all")}
          iconSize={14}
        />
        {categories.map((c) => (
          <Chip
            key={c.slug}
            label={c.name}
            icon={c.icon}
            iconSize={14}
            active={bCat === c.slug}
            onClick={() => setBCat(c.slug)}
          />
        ))}
      </div>

      <div className="sm-booking__svcgrid" role="radiogroup" aria-label="Service">
        {services.map((s) => (
          <ServiceRow
            key={s.id}
            service={s}
            selected={svcId === s.id}
            onSelect={selectSvc}
          />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Step 1 — Staff
 * ------------------------------------------------------------------ */

function StepStaff() {
  const svcId = useStore((s) => s.svcId);
  const staffSel = useStore((s) => s.staffSel);
  const pickStaff = useStore((s) => s.pickStaff);

  const svc = data.getService(svcId);
  const staff = data.getStaff();
  if (!svc) return null;

  return (
    <section className="sm-booking__step">
      <header className="sm-booking__head">
        <h2 className="sm-h2">Who would you like to see?</h2>
        <p className="sm-sub">
          For <span className="sm-booking__svcname">{svc.name}</span>. Greyed-out
          specialists don’t offer this one.
        </p>
      </header>

      <div className="sm-booking__staffrows" role="radiogroup" aria-label="Specialist">
        <StaffRow
          icon="zap"
          title="First available"
          note="Soonest opening with any qualified specialist."
          selected={staffSel === "first"}
          onSelect={() => pickStaff("first")}
        />
        {staff.map((m) => {
          const ok = svc.staff.includes(m.id);
          return (
            <StaffRow
              key={m.id}
              staff={m}
              selected={staffSel === m.id}
              disabled={!ok}
              note={ok ? undefined : "Doesn’t offer this service"}
              onSelect={() => pickStaff(m.id)}
            />
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Step 2 — Date & time
 * ------------------------------------------------------------------ */

function StepDateTime() {
  const svcId = useStore((s) => s.svcId);
  const staffSel = useStore((s) => s.staffSel);
  const slotStaff = useStore((s) => s.slotStaff);
  const dateIdx = useStore((s) => s.dateIdx);
  const time = useStore((s) => s.time);
  const slotsLoading = useStore((s) => s.slotsLoading);
  const rescheduleCode = useStore((s) => s.rescheduleCode);
  const waitlist = useStore((s) => s.waitlist);
  const changeDay = useStore((s) => s.changeDay);
  const pickSlot = useStore((s) => s.pickSlot);
  const step2Next = useStore((s) => s.step2Next);
  const joinWaitlist = useStore((s) => s.joinWaitlist);

  const ctx = useSlotContext();
  const days = useDaySummaries();
  const groups = useSlotGroups();
  const dayFull = useDayFull();
  const date = useSelectedDate();

  const svc = data.getService(svcId);
  if (!svc) return null;

  const chosen = data.getStaffMember(staffSel);
  const staffLabel = chosen ? firstName(chosen.name) : "first available";
  const summary = days.find((d) => d.index === dateIdx) ?? days[0];
  const shortDate = formatShortDate(date);
  const iso = isoOf(date);
  const waitKey = `${iso}|${staffSel ?? "first"}`;
  const joined = Boolean(waitlist[waitKey]);

  const pickedStaff = data.getStaffMember(
    resolveStaffId(ctx, svcId, staffSel, slotStaff),
  );
  const pickLabel =
    time === null
      ? ""
      : `${shortDate} · ${minutesToTime(time)}${pickedStaff ? ` · ${pickedStaff.name}` : ""}`;

  const showWaitlist =
    !slotsLoading && summary !== undefined && !summary.isClosed && summary.hasWindows;

  let waitTitle = "Don’t see the right time?";
  let waitSub = `Join the waitlist for ${shortDate} and we’ll ping you about cancellations.`;
  if (joined) {
    waitTitle = "You’re on the waitlist";
    waitSub = `We’ll text you the moment a spot opens on ${shortDate}.`;
  } else if (dayFull) {
    waitTitle = `${shortDate} is fully booked`;
    waitSub = "Join the waitlist and we’ll text you the moment a spot opens.";
  }

  return (
    <section className="sm-booking__step">
      <header className="sm-booking__head">
        <h2 className="sm-h2">Pick a date &amp; time</h2>
        <p className="sm-sub">
          {svc.name} · {svc.dur} min with {staffLabel}
        </p>
      </header>

      <WeekStrip days={days} value={dateIdx} onSelect={changeDay} label="Pick a date" />

      {slotsLoading ? (
        <SlotSkeleton count={12} />
      ) : groups.length === 0 ? (
        <EmptyState
          icon="calendar-off"
          title="No openings that day"
          body={
            summary?.isClosed
              ? "The studio is closed on Sundays. Try another day this week."
              : "This specialist isn’t in that day. Pick another day, or choose “First available”."
          }
        />
      ) : (
        <div className="sm-booking__groups">
          {groups.map((g) => (
            <div className="sm-booking__group" key={g.key}>
              <Eyebrow icon={g.icon}>{g.label}</Eyebrow>
              <div className="sm-slot-grid">
                {g.slots.map((sl) => (
                  <SlotButton
                    key={sl.min}
                    slot={sl}
                    selected={isSlotSelected(sl, staffSel, time, slotStaff)}
                    onSelect={pickSlot}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showWaitlist ? (
        <WaitlistCard
          title={waitTitle}
          sub={waitSub}
          joined={joined}
          full={dayFull}
          onJoin={() => joinWaitlist(iso, String(staffSel ?? "first"))}
        />
      ) : null}

      <div className="sm-booking__bar">
        <div className="sm-booking__pick">
          {time === null ? (
            <span className="sm-booking__pick-none">Choose a time to continue.</span>
          ) : (
            <>
              <span className="sm-booking__pick-cap">Selected</span>
              <span className="sm-mono sm-booking__pick-label">{pickLabel}</span>
            </>
          )}
        </div>
        <Button
          size="lg"
          iconEnd="arrow-right"
          disabled={time === null}
          onClick={step2Next}
        >
          {rescheduleCode ? "Confirm new time" : "Continue"}
        </Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Step 3 — Your details
 * ------------------------------------------------------------------ */

function StepDetails() {
  const svcId = useStore((s) => s.svcId);
  const staffSel = useStore((s) => s.staffSel);
  const slotStaff = useStore((s) => s.slotStaff);
  const time = useStore((s) => s.time);
  const form = useStore((s) => s.form);
  const errs = useStore((s) => s.errs);
  const setField = useStore((s) => s.setField);
  const remEmail = useStore((s) => s.remEmail);
  const remSms = useStore((s) => s.remSms);
  const remWhen = useStore((s) => s.remWhen);
  const setRemEmail = useStore((s) => s.setRemEmail);
  const setRemSms = useStore((s) => s.setRemSms);
  const setRemWhen = useStore((s) => s.setRemWhen);
  const recurOn = useStore((s) => s.recurOn);
  const recurFreq = useStore((s) => s.recurFreq);
  const recurCount = useStore((s) => s.recurCount);
  const setRecurOn = useStore((s) => s.setRecurOn);
  const setRecurFreq = useStore((s) => s.setRecurFreq);
  const setRecurCount = useStore((s) => s.setRecurCount);
  const confirmBooking = useStore((s) => s.confirmBooking);

  const ctx = useSlotContext();
  const date = useSelectedDate();

  const svc = data.getService(svcId);
  if (!svc) return null;

  const category = data.getCategory(svc.cat)?.name ?? "";
  const chosen = data.getStaffMember(staffSel);
  const resolved = data.getStaffMember(
    resolveStaffId(ctx, svcId, staffSel, slotStaff),
  );

  let withValue = "First available";
  if (chosen) withValue = chosen.name;
  else if (resolved) withValue = `${resolved.name} (first free)`;

  const iso = isoOf(date);
  const series = seriesDates(iso, recurFreq, recurCount);
  const lastISO = series[series.length - 1];
  const recurSummary =
    time === null
      ? `Repeats ${recurLabel(recurFreq)}`
      : `Repeats ${recurLabel(recurFreq)} · through ${formatShortISO(lastISO)}`;

  return (
    <section className="sm-booking__details">
      <div className="sm-booking__form">
        <header className="sm-booking__head">
          <h2 className="sm-h2">Your details</h2>
          <p className="sm-sub">So we know who to expect.</p>
        </header>

        <Field label="Full name" error={errs.name}>
          {(c) => (
            <TextInput
              {...c}
              value={form.name}
              onChange={(v) => setField("name", v)}
              placeholder="Ava Reyes"
            />
          )}
        </Field>

        <Field label="Email" error={errs.email}>
          {(c) => (
            <TextInput
              {...c}
              value={form.email}
              onChange={(v) => setField("email", v)}
              placeholder="you@email.com"
              type="email"
              inputMode="email"
            />
          )}
        </Field>

        <Field label="Phone" error={errs.phone}>
          {(c) => (
            <TextInput
              {...c}
              value={form.phone}
              onChange={(v) => setField("phone", v)}
              placeholder="(415) 555-0100"
              type="tel"
              inputMode="tel"
            />
          )}
        </Field>

        <Field
          label="Anything we should know?"
          hint="(optional)"
          aside={
            <span className="sm-mono">
              {form.note.length} / {NOTE_MAX}
            </span>
          }
        >
          {(c) => (
            <TextArea
              {...c}
              value={form.note}
              onChange={(v) => setField("note", v)}
              rows={3}
              maxLength={NOTE_MAX}
              placeholder="Allergies, parking, or if it’s your first visit — anything helps."
              className="sm-booking__note"
            />
          )}
        </Field>

        <Card radius={16} className="sm-booking__card">
          <CardHead icon="bell" title="Appointment reminders" />
          <ToggleRow
            icon="mail"
            title="Email reminders"
            sub="A confirmation now, plus a heads-up before."
            checked={remEmail}
            onChange={setRemEmail}
          />
          <ToggleRow
            icon="message-square"
            title="SMS reminders"
            sub="A quick text so it never sneaks up on you."
            checked={remSms}
            onChange={setRemSms}
          />
          {remEmail || remSms ? (
            <div className="sm-booking__sendrow">
              <span className="sm-booking__sendlabel">Send</span>
              <Segmented
                label="Reminder timing"
                value={remWhen}
                onChange={setRemWhen}
                options={REMINDER_OPTIONS}
              />
            </div>
          ) : null}
        </Card>

        <Card radius={16} className="sm-booking__card">
          <CardHead
            icon="repeat"
            title="Make it recurring"
            sub="Keep this time on a repeat — we’ll hold it for you."
            aside={
              <Toggle
                checked={recurOn}
                onChange={setRecurOn}
                label="Make it recurring"
              />
            }
          />
          {recurOn ? (
            <div className="sm-booking__recur">
              <Segmented
                label="How often"
                value={recurFreq}
                onChange={setRecurFreq}
                options={RECUR_OPTIONS}
              />
              <div className="sm-booking__countrow">
                <span className="sm-booking__countlabel">How many visits</span>
                <NumberStepper
                  value={recurCount}
                  onChange={setRecurCount}
                  min={2}
                  max={8}
                  label="How many visits"
                  format={(v) => `${v} visits`}
                />
              </div>
              <div className="sm-booking__recursum">
                <Icon name="calendar-check" size={15} />
                {recurSummary}
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      <aside className="sm-booking__summary">
        <Card radius={18} clip className="sm-booking__summary-card">
          <PanelHeader>
            <Eyebrow>Your appointment</Eyebrow>
          </PanelHeader>
          <div className="sm-booking__summary-body">
            <div className="sm-booking__summary-svc">
              <IconTile icon={svc.icon} tint={svc.tint} size={44} iconSize={20} />
              <span className="sm-booking__summary-svctext">
                <span className="sm-booking__summary-svcname">{svc.name}</span>
                <span className="sm-booking__summary-svcmeta">
                  {svc.dur} min · {category}
                </span>
              </span>
            </div>

            <div className="sm-booking__srows">
              <SummaryRow icon="user" label="With" value={withValue} />
              <SummaryRow icon="calendar" label="Date" value={formatShortDate(date)} />
              <SummaryRow
                icon="clock"
                label="Time"
                value={time === null ? "—" : minutesToTime(time)}
                mono
              />
              {recurOn ? (
                <SummaryRow
                  icon="repeat"
                  label="Repeats"
                  value={`${recurLabel(recurFreq)} ×${recurCount}`}
                />
              ) : null}
            </div>

            <div className="sm-booking__total">
              <span className="sm-booking__total-key">Total</span>
              <span className="sm-mono sm-booking__total-val">{money(svc.price)}</span>
            </div>

            <Button
              full
              icon="check-circle-2"
              onClick={confirmBooking}
              className="sm-booking__cta"
            >
              Confirm booking
            </Button>

            <p className="sm-booking__fine">
              <Icon name="shield-check" size={14} />
              No card needed to hold your spot. This is a demo — nothing is really
              booked.
            </p>
          </div>
        </Card>
      </aside>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Screen
 * ------------------------------------------------------------------ */

export default function Booking() {
  const step = useStore((s) => s.step);
  const svcId = useStore((s) => s.svcId);
  const staffSel = useStore((s) => s.staffSel);
  const time = useStore((s) => s.time);
  const rescheduleCode = useStore((s) => s.rescheduleCode);
  const bookBack = useStore((s) => s.bookBack);
  const setStep = useStore((s) => s.setStep);

  const backLabel = rescheduleCode
    ? "Back to booking"
    : step > 0
      ? "Back"
      : "Back to services";

  return (
    <main className="sm-screen sm-page sm-booking">
      <BackLink onClick={bookBack}>{backLabel}</BackLink>

      <Stepper
        steps={STEP_LABELS}
        current={step}
        maxReachable={reachMax({ svcId, staffSel, time })}
        lockedBelow={rescheduleCode ? 2 : 0}
        onGo={setStep}
      />

      {step === 0 ? <StepService /> : null}
      {step === 1 ? <StepStaff /> : null}
      {step === 2 ? <StepDateTime /> : null}
      {step === 3 ? <StepDetails /> : null}
    </main>
  );
}
