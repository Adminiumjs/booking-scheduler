/*
 * STUDIO SETTINGS (view: 'admin-settings') — Admin comp template 388–423,
 * logic 1103–1124.
 *
 * StudioChrome owns the heading and the body padding; this file is the body.
 * Every value edited here already lives on the store, so the screen stays a
 * pure view over `setName` / `setClosed` / `setWindow` / `setFee` / `setMsg`.
 */

import { Button, Chip, Field, TextInput, Toggle } from "../components/index.ts";
import {
  AUTO_MESSAGES,
  CANCEL_WINDOWS,
  LATE_FEES,
  OPENING_HOURS,
  STUDIO_FIELDS,
  studioFieldPatch,
} from "../data/screens/admin-settings.ts";
import type { StudioFieldKey } from "../data/screens/admin-settings.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-admin-settings.css";

export default function AdminSettings() {
  const setName = useStore((s) => s.setName);
  const setAddr = useStore((s) => s.setAddr);
  const setPhone = useStore((s) => s.setPhone);
  const setEmail = useStore((s) => s.setEmail);
  const setClosed = useStore((s) => s.setClosed);
  const setWindow = useStore((s) => s.setWindow);
  const setFee = useStore((s) => s.setFee);
  const setMsg = useStore((s) => s.setMsg);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const values: Record<StudioFieldKey, string> = {
    setName,
    setAddr,
    setPhone,
    setEmail,
  };

  return (
    <div className="scr-admin-settings">
      <div className="set-grid">
        <div className="set-col">
          <section className="bk-panel set-card">
            <h2 className="set-card__title">Studio details</h2>
            <div className="set-fields">
              {STUDIO_FIELDS.map((f) => (
                <Field
                  key={f.key}
                  label={f.label}
                  className={f.wide ? "set-field--wide" : undefined}
                >
                  {(control) => (
                    <TextInput
                      {...control}
                      value={values[f.key]}
                      onChange={(v) => set(studioFieldPatch(f.key, v))}
                    />
                  )}
                </Field>
              ))}
            </div>
          </section>

          <section className="bk-panel set-card set-card--banded">
            <h2 className="set-band">Opening hours</h2>
            <ul className="set-hours">
              {OPENING_HOURS.map((h) => {
                const open = !setClosed[h.day];
                return (
                  <li className="set-hour" key={h.day}>
                    <span className="set-hour__day">{h.label}</span>
                    <span
                      className="set-hour__time bk-mono"
                      data-open={open ? "true" : "false"}
                    >
                      {open ? h.hours : "Closed"}
                    </span>
                    <Toggle
                      checked={open}
                      label={`${h.label} — open`}
                      onChange={() =>
                        set({ setClosed: { ...setClosed, [h.day]: open } })
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <div className="set-col">
          <section className="bk-panel set-card set-card--banded">
            <h2 className="set-band">Booking policy</h2>
            <div className="set-policy">
              <fieldset className="set-policy__group">
                <legend className="set-policy__label">
                  Free cancellation window
                </legend>
                <div className="set-chips">
                  {CANCEL_WINDOWS.map((o) => (
                    <Chip
                      key={o.id}
                      label={o.label}
                      active={setWindow === o.id}
                      onClick={() => set({ setWindow: o.id })}
                    />
                  ))}
                </div>
              </fieldset>

              <fieldset className="set-policy__group">
                <legend className="set-policy__label">Late-cancel fee</legend>
                <div className="set-chips">
                  {LATE_FEES.map((o) => (
                    <Chip
                      key={o.id}
                      label={o.label}
                      active={setFee === o.id}
                      onClick={() => set({ setFee: o.id })}
                    />
                  ))}
                </div>
              </fieldset>
            </div>
          </section>

          <section className="bk-panel set-card set-card--banded">
            <h2 className="set-band">Automatic messages</h2>
            {/* The comp made each row one big <button> with a switch-shaped
              * span inside it — a control nested in a control. The switch is
              * the control; the row is just its label. */}
            <ul className="set-msgs">
              {AUTO_MESSAGES.map((m) => {
                const on = Boolean(setMsg[m.key]);
                return (
                  <li className="set-msg" key={m.key}>
                    <span className="set-msg__text">
                      <span className="set-msg__label">{m.label}</span>
                      <span className="set-msg__sub">{m.sub}</span>
                    </span>
                    <Toggle
                      checked={on}
                      label={m.label}
                      onChange={() => set({ setMsg: { ...setMsg, [m.key]: !on } })}
                    />
                  </li>
                );
              })}
            </ul>
          </section>

          <Button
            icon="check"
            className="set-save"
            onClick={() => showToast("Studio settings saved", "ok")}
          >
            Save settings
          </Button>
        </div>
      </div>
    </div>
  );
}
