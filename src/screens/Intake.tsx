/*
 * DIGITAL INTAKE FORM — view `intake` (spec §3.7, §5.12, §6.12).
 *
 * Six concern checkboxes, a free-text allergies note, a pressure segmented
 * control and the consent gate. `intakeSubmit()` owns both the consent guard
 * ("Please agree to the consent notice first") and the success toast, so this
 * screen never fires a toast of its own.
 */

import { useId } from "react";
import type { CSSProperties } from "react";

import {
  BackLink,
  Button,
  Checkbox,
  CheckboxRow,
  Field,
  Segmented,
  SuccessTile,
  TextArea,
} from "../components/index.ts";
import type { IntakePressure } from "../data/types.ts";
import { data } from "../data/source.ts";
import { useStore } from "../state/store.ts";
import "../styles/screen-intake.css";

/** `Button` writes its size geometry inline, so the overrides go there too. */
const SUBMIT_BTN: CSSProperties = {
  padding: "14px",
  borderRadius: "13px",
  fontSize: "14.5px",
};

const DONE_BTN: CSSProperties = {
  padding: "12px 20px",
  borderRadius: "12px",
  fontSize: "14px",
};

export default function Intake() {
  const intake = useStore((s) => s.intake);
  const intakeDone = useStore((s) => s.intakeDone);
  const toggleConcern = useStore((s) => s.toggleConcern);
  const setAllergies = useStore((s) => s.setAllergies);
  const setPressure = useStore((s) => s.setPressure);
  const setConsent = useStore((s) => s.setConsent);
  const intakeSubmit = useStore((s) => s.intakeSubmit);
  const intakeEdit = useStore((s) => s.intakeEdit);
  const go = useStore((s) => s.go);
  const concernsId = useId();

  const concerns = data.getIntakeConcerns();
  const pressures = data.getIntakePressures().map((p) => ({
    value: p.id,
    label: p.label,
  }));

  if (intakeDone) {
    return (
      <main className="bk-screen bk-page bk-intake">
        <div className="bk-intake-done">
          <SuccessTile icon="clipboard-check" iconSize={36} />
          <h1 className="bk-intake-done__h1">Intake form saved</h1>
          <p className="bk-intake-done__body">
            Thank you — your specialist will review this before your visit. This is
            a demo, so nothing is actually stored.
          </p>
          <div className="bk-intake-done__actions">
            <Button
              variant="ghost"
              className="bk-intake-done__btn"
              style={DONE_BTN}
              onClick={intakeEdit}
            >
              Edit answers
            </Button>
            <Button
              variant="primary"
              icon="home"
              className="bk-intake-done__btn"
              style={DONE_BTN}
              onClick={() => go("home")}
            >
              Back home
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bk-screen bk-page bk-intake">
      <BackLink onClick={() => go("home")}>Back home</BackLink>

      <div className="bk-intake__intro">
        <h1 className="bk-h1">Digital intake form</h1>
        <p className="bk-sub bk-intake__sub">
          A few quick things so your specialist can tailor the visit. Takes about a
          minute.
        </p>
      </div>

      <div className="bk-intake__block">
        <span className="bk-intake__legend" id={concernsId}>
          Anything that applies to you?
        </span>
        <div className="bk-intake__concerns" role="group" aria-labelledby={concernsId}>
          {concerns.map((c) => (
            <CheckboxRow
              key={c}
              checked={!!intake.concerns[c]}
              onChange={() => toggleConcern(c)}
            >
              {c}
            </CheckboxRow>
          ))}
        </div>
      </div>

      <Field
        className="bk-intake__block"
        label="Allergies or sensitivities"
        hint="(optional)"
      >
        {(c) => (
          <TextArea
            {...c}
            value={intake.allergies}
            onChange={setAllergies}
            rows={3}
            placeholder="Fragrances, latex, specific products…"
            className="bk-intake__allergies"
          />
        )}
      </Field>

      <div className="bk-intake__block">
        <span className="bk-intake__label">Preferred pressure / intensity</span>
        <Segmented<IntakePressure>
          label="Preferred pressure / intensity"
          options={pressures}
          value={intake.pressure}
          onChange={setPressure}
        />
      </div>

      <button
        type="button"
        role="checkbox"
        aria-checked={intake.consent}
        className="bk-intake-consent"
        onClick={() => setConsent(!intake.consent)}
      >
        <Checkbox checked={intake.consent} />
        <span className="bk-intake-consent__text">
          I confirm the above is accurate and consent to treatment. I understand I
          can update this any time before my visit.
        </span>
      </button>

      <Button
        variant="primary"
        icon="check-circle-2"
        iconSize={17}
        full
        style={SUBMIT_BTN}
        onClick={intakeSubmit}
      >
        Save intake form
      </Button>
    </main>
  );
}
