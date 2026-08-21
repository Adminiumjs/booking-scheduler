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
import { categoryName, data } from "../data/source.ts";
import type { RecurFreq, ReminderWhen } from "../data/types.ts";
import { useI18n, useT } from "../i18n/index.tsx";
import type { MessageKey } from "../i18n/index.tsx";
import {
  durationLabel,
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

const REMINDER_KEYS: readonly { value: ReminderWhen; key: MessageKey }[] = [
  { value: "24h", key: "screensA.booking.remind24" },
  { value: "2h", key: "screensA.booking.remind2" },
  { value: "both", key: "screensA.booking.remindBoth" },
];

const RECUR_KEYS: readonly { value: RecurFreq; key: MessageKey }[] = [
  { value: "1w", key: "screensA.booking.freqWeekly" },
  { value: "2w", key: "screensA.booking.freq2w" },
  { value: "4w", key: "screensA.booking.freq4w" },
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
    <div className="bk-booking__cardhead">
      <span className="bk-booking__cardhead-icon">
        <Icon name={icon} size={16} />
      </span>
      <span className="bk-booking__cardhead-text">
        <span className="bk-booking__cardhead-title">{title}</span>
        {sub ? <span className="bk-booking__cardhead-sub">{sub}</span> : null}
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
    <div className="bk-booking__togglerow">
      <span className="bk-booking__togglerow-icon">
        <Icon name={icon} size={16} />
      </span>
      <span className="bk-booking__togglerow-text">
        <span className="bk-booking__togglerow-title">{title}</span>
        <span className="bk-booking__togglerow-sub">{sub}</span>
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
    <div className="bk-booking__srow">
      <span className="bk-booking__srow-key">
        <Icon name={icon} size={15} />
        {label}
      </span>
      <span className={mono ? "bk-mono bk-booking__srow-val" : "bk-booking__srow-val"}>
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Step 0 — Service
 * ------------------------------------------------------------------ */

function StepService() {
  const t = useT();
  const bCat = useStore((s) => s.bCat);
  const setBCat = useStore((s) => s.setBCat);
  const svcId = useStore((s) => s.svcId);
  const selectSvc = useStore((s) => s.selectSvc);
  const go = useStore((s) => s.go);

  const categories = data.getCategories();
  const services = data.getServicesByCategory(bCat);

  return (
    <section className="bk-booking__step">
      <header className="bk-booking__head">
        <h2 className="bk-h2">{t("screensA.booking.svcTitle")}</h2>
        <p className="bk-sub">{t("screensA.booking.svcSub")}</p>
      </header>

      <button type="button" className="bk-booking__promo" onClick={() => go("group")}>
        <span className="bk-booking__promo-tile">
          <Icon name="users" size={18} />
        </span>
        <span className="bk-booking__promo-text">
          <span className="bk-booking__promo-title">
            {t("screensA.booking.groupTitle")}
          </span>
          <span className="bk-booking__promo-sub">
            {t("screensA.booking.groupSub")}
          </span>
        </span>
        <Icon name="arrow-right" size={16} />
      </button>

      <div className="bk-booking__chips">
        <Chip
          label={t("screensA.common.all")}
          active={bCat === "all"}
          onClick={() => setBCat("all")}
          iconSize={14}
        />
        {categories.map((c) => (
          <Chip
            key={c.slug}
            label={t(c.nameKey)}
            icon={c.icon}
            iconSize={14}
            active={bCat === c.slug}
            onClick={() => setBCat(c.slug)}
          />
        ))}
      </div>

      <div
        className="bk-booking__svcgrid"
        role="radiogroup"
        aria-label={t("screensA.booking.svcAria")}
      >
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
  const t = useT();
  const svcId = useStore((s) => s.svcId);
  const staffSel = useStore((s) => s.staffSel);
  const pickStaff = useStore((s) => s.pickStaff);

  const svc = data.getService(svcId);
  const staff = data.getStaff();
  if (!svc) return null;

  return (
    <section className="bk-booking__step">
      <header className="bk-booking__head">
        <h2 className="bk-h2">{t("screensA.booking.staffTitle")}</h2>
        <p className="bk-sub">
          {t("screensA.booking.staffSub", { service: svc.name })}
        </p>
      </header>

      <div
        className="bk-booking__staffrows"
        role="radiogroup"
        aria-label={t("screensA.booking.staffAria")}
      >
        <StaffRow
          icon="zap"
          title={t("screensA.booking.firstAvailable")}
          note={t("screensA.booking.firstAvailableNote")}
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
              note={ok ? undefined : t("screensA.booking.notOffered")}
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
  const t = useT();
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
  const staffLabel = chosen
    ? firstName(chosen.name)
    : t("screensA.booking.firstAvailableLower");
  const summary = days.find((d) => d.index === dateIdx) ?? days[0];
  const shortDate = formatShortDate(date);
  const iso = isoOf(date);
  const waitKey = `${iso}|${staffSel ?? "first"}`;
  const joined = Boolean(waitlist[waitKey]);

  const pickedStaff = data.getStaffMember(
    resolveStaffId(ctx, svcId, staffSel, slotStaff),
  );
  let pickLabel = "";
  if (time !== null) {
    const parts = { date: shortDate, time: minutesToTime(time) };
    pickLabel = pickedStaff
      ? t("screensA.booking.pickWith", { ...parts, staff: pickedStaff.name })
      : t("screensA.booking.pick", parts);
  }

  const showWaitlist =
    !slotsLoading && summary !== undefined && !summary.isClosed && summary.hasWindows;

  let waitTitle = t("screensA.booking.waitTitle");
  let waitSub = t("screensA.booking.waitSub", { date: shortDate });
  if (joined) {
    waitTitle = t("screensA.booking.waitJoinedTitle");
    waitSub = t("screensA.booking.waitJoinedSub", { date: shortDate });
  } else if (dayFull) {
    waitTitle = t("screensA.booking.waitFullTitle", { date: shortDate });
    waitSub = t("screensA.booking.waitFullSub");
  }

  return (
    <section className="bk-booking__step">
      <header className="bk-booking__head">
        <h2 className="bk-h2">{t("screensA.booking.whenTitle")}</h2>
        <p className="bk-sub">
          {t("screensA.booking.whenSub", {
            service: svc.name,
            duration: durationLabel(svc.dur),
            staff: staffLabel,
          })}
        </p>
      </header>

      <WeekStrip
        days={days}
        value={dateIdx}
        onSelect={changeDay}
        label={t("screensA.booking.pickDate")}
      />

      {slotsLoading ? (
        <SlotSkeleton count={12} />
      ) : groups.length === 0 ? (
        <EmptyState
          icon="calendar-off"
          title={t("screensA.booking.noOpeningsTitle")}
          body={t(
            summary?.isClosed
              ? "screensA.booking.closedBody"
              : "screensA.booking.staffOffBody",
          )}
        />
      ) : (
        <div className="bk-booking__groups">
          {groups.map((g) => (
            <div className="bk-booking__group" key={g.key}>
              <Eyebrow icon={g.icon}>{g.label}</Eyebrow>
              <div className="bk-slot-grid">
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

      <div className="bk-booking__bar">
        <div className="bk-booking__pick">
          {time === null ? (
            <span className="bk-booking__pick-none">
              {t("screensA.booking.chooseTime")}
            </span>
          ) : (
            <>
              <span className="bk-booking__pick-cap">
                {t("screensA.booking.selected")}
              </span>
              <span className="bk-mono bk-booking__pick-label">{pickLabel}</span>
            </>
          )}
        </div>
        <Button
          size="lg"
          iconEnd="arrow-right"
          disabled={time === null}
          onClick={step2Next}
        >
          {t(
            rescheduleCode
              ? "screensA.booking.confirmNewTime"
              : "screensA.common.continue",
          )}
        </Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Step 3 — Your details
 * ------------------------------------------------------------------ */

function StepDetails() {
  const { t, number } = useI18n();
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

  const reminderOptions: readonly SegmentedOption<ReminderWhen>[] =
    REMINDER_KEYS.map((r) => ({ value: r.value, label: t(r.key) }));
  const recurOptions: readonly SegmentedOption<RecurFreq>[] = RECUR_KEYS.map(
    (r) => ({ value: r.value, label: t(r.key) }),
  );

  const category = categoryName(t, svc.cat);
  const chosen = data.getStaffMember(staffSel);
  const resolved = data.getStaffMember(
    resolveStaffId(ctx, svcId, staffSel, slotStaff),
  );

  let withValue = t("screensA.booking.firstAvailable");
  if (chosen) withValue = chosen.name;
  else if (resolved)
    withValue = t("screensA.booking.firstFree", { name: resolved.name });

  const iso = isoOf(date);
  const series = seriesDates(iso, recurFreq, recurCount);
  const lastISO = series[series.length - 1];
  const recurSummary =
    time === null
      ? t("screensA.booking.repeatsSummary", { frequency: recurLabel(recurFreq) })
      : t("screensA.booking.repeatsThrough", {
          frequency: recurLabel(recurFreq),
          date: formatShortISO(lastISO),
        });

  return (
    <section className="bk-booking__details">
      <div className="bk-booking__form">
        <header className="bk-booking__head">
          <h2 className="bk-h2">{t("screensA.booking.detailsTitle")}</h2>
          <p className="bk-sub">{t("screensA.booking.detailsSub")}</p>
        </header>

        <Field label={t("screensA.common.fullName")} error={errs.name}>
          {(c) => (
            <TextInput
              {...c}
              value={form.name}
              onChange={(v) => setField("name", v)}
              placeholder="Ava Reyes"
            />
          )}
        </Field>

        <Field label={t("screensA.common.email")} error={errs.email}>
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

        <Field label={t("screensA.common.phone")} error={errs.phone}>
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
          label={t("screensA.booking.noteLabel")}
          hint={t("screensA.common.optional")}
          aside={
            <span className="bk-mono">
              {t("screensA.booking.noteCount", {
                used: number(form.note.length),
                max: number(NOTE_MAX),
              })}
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
              placeholder={t("screensA.booking.notePlaceholder")}
              className="bk-booking__note"
            />
          )}
        </Field>

        <Card radius={16} className="bk-booking__card">
          <CardHead icon="bell" title={t("screensA.booking.reminders")} />
          <ToggleRow
            icon="mail"
            title={t("screensA.booking.emailReminders")}
            sub={t("screensA.booking.emailRemindersSub")}
            checked={remEmail}
            onChange={setRemEmail}
          />
          <ToggleRow
            icon="message-square"
            title={t("screensA.booking.smsReminders")}
            sub={t("screensA.booking.smsRemindersSub")}
            checked={remSms}
            onChange={setRemSms}
          />
          {remEmail || remSms ? (
            <div className="bk-booking__sendrow">
              <span className="bk-booking__sendlabel">
                {t("screensA.booking.send")}
              </span>
              <Segmented
                label={t("screensA.booking.reminderTiming")}
                value={remWhen}
                onChange={setRemWhen}
                options={reminderOptions}
              />
            </div>
          ) : null}
        </Card>

        <Card radius={16} className="bk-booking__card">
          <CardHead
            icon="repeat"
            title={t("screensA.booking.recurring")}
            sub={t("screensA.booking.recurringSub")}
            aside={
              <Toggle
                checked={recurOn}
                onChange={setRecurOn}
                label={t("screensA.booking.recurring")}
              />
            }
          />
          {recurOn ? (
            <div className="bk-booking__recur">
              <Segmented
                label={t("screensA.booking.howOften")}
                value={recurFreq}
                onChange={setRecurFreq}
                options={recurOptions}
              />
              <div className="bk-booking__countrow">
                <span className="bk-booking__countlabel">
                  {t("screensA.booking.howMany")}
                </span>
                <NumberStepper
                  value={recurCount}
                  onChange={setRecurCount}
                  min={2}
                  max={8}
                  label={t("screensA.booking.howMany")}
                  format={(v) => t("count.visit", {}, v)}
                />
              </div>
              <div className="bk-booking__recursum">
                <Icon name="calendar-check" size={15} />
                {recurSummary}
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      <aside className="bk-booking__summary">
        <Card radius={18} clip className="bk-booking__summary-card">
          <PanelHeader>
            <Eyebrow>{t("screensA.booking.yourAppointment")}</Eyebrow>
          </PanelHeader>
          <div className="bk-booking__summary-body">
            <div className="bk-booking__summary-svc">
              <IconTile icon={svc.icon} tint={svc.tint} size={44} iconSize={20} />
              <span className="bk-booking__summary-svctext">
                <span className="bk-booking__summary-svcname">{svc.name}</span>
                <span className="bk-booking__summary-svcmeta">
                  {t("screensA.booking.svcMeta", {
                    duration: durationLabel(svc.dur),
                    category,
                  })}
                </span>
              </span>
            </div>

            <div className="bk-booking__srows">
              <SummaryRow
                icon="user"
                label={t("screensA.booking.rowWith")}
                value={withValue}
              />
              <SummaryRow
                icon="calendar"
                label={t("screensA.booking.rowDate")}
                value={formatShortDate(date)}
              />
              <SummaryRow
                icon="clock"
                label={t("screensA.booking.rowTime")}
                value={time === null ? "—" : minutesToTime(time)}
                mono
              />
              {recurOn ? (
                <SummaryRow
                  icon="repeat"
                  label={t("screensA.booking.rowRepeats")}
                  value={t("screensA.booking.repeatsValue", {
                    frequency: recurLabel(recurFreq),
                    count: number(recurCount),
                  })}
                />
              ) : null}
            </div>

            <div className="bk-booking__total">
              <span className="bk-booking__total-key">
                {t("screensA.common.total")}
              </span>
              <span className="bk-mono bk-booking__total-val">{money(svc.price)}</span>
            </div>

            <Button
              full
              icon="check-circle-2"
              onClick={confirmBooking}
              className="bk-booking__cta"
            >
              {t("screensA.booking.confirm")}
            </Button>

            <p className="bk-booking__fine">
              <Icon name="shield-check" size={14} />
              {t("screensA.booking.fine")}
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
  const t = useT();
  const step = useStore((s) => s.step);
  const svcId = useStore((s) => s.svcId);
  const staffSel = useStore((s) => s.staffSel);
  const time = useStore((s) => s.time);
  const rescheduleCode = useStore((s) => s.rescheduleCode);
  const bookBack = useStore((s) => s.bookBack);
  const setStep = useStore((s) => s.setStep);

  const backLabel = t(
    rescheduleCode
      ? "screensA.booking.backToBooking"
      : step > 0
        ? "screensA.common.back"
        : "screensA.booking.backToServices",
  );

  return (
    <main className="bk-screen bk-page bk-booking">
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
