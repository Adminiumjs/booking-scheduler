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
import { useT } from "../i18n/index.tsx";
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
  const t = useT();
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
    label: t(p.labelKey),
  }));

  if (intakeDone) {
    return (
      <main className="bk-screen bk-page bk-intake">
        <div className="bk-intake-done">
          <SuccessTile icon="clipboard-check" iconSize={36} />
          <h1 className="bk-intake-done__h1">
            {t("screensB.intake.doneTitle")}
          </h1>
          <p className="bk-intake-done__body">
            {t("screensB.intake.doneBody")}
          </p>
          <div className="bk-intake-done__actions">
            <Button
              variant="ghost"
              className="bk-intake-done__btn"
              style={DONE_BTN}
              onClick={intakeEdit}
            >
              {t("screensB.intake.editAnswers")}
            </Button>
            <Button
              variant="primary"
              icon="home"
              className="bk-intake-done__btn"
              style={DONE_BTN}
              onClick={() => go("home")}
            >
              {t("screensB.common.backHome")}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bk-screen bk-page bk-intake">
      <BackLink onClick={() => go("home")}>
        {t("screensB.common.backHome")}
      </BackLink>

      <div className="bk-intake__intro">
        <h1 className="bk-h1">{t("screensB.intake.title")}</h1>
        <p className="bk-sub bk-intake__sub">{t("screensB.intake.sub")}</p>
      </div>

      <div className="bk-intake__block">
        <span className="bk-intake__legend" id={concernsId}>
          {t("screensB.intake.concernsLegend")}
        </span>
        <div className="bk-intake__concerns" role="group" aria-labelledby={concernsId}>
          {concerns.map((c) => (
            <CheckboxRow
              key={c}
              /* The key is the identity `intake.concerns` is stored under —
               * stable across a locale switch — and the label is what it
               * resolves to, which is not. */
              checked={!!intake.concerns[c]}
              onChange={() => toggleConcern(c)}
            >
              {t(c)}
            </CheckboxRow>
          ))}
        </div>
      </div>

      <Field
        className="bk-intake__block"
        label={t("screensB.intake.allergiesLabel")}
        hint={t("screensB.common.optional")}
      >
        {(c) => (
          <TextArea
            {...c}
            value={intake.allergies}
            onChange={setAllergies}
            rows={3}
            placeholder={t("screensB.intake.allergiesPlaceholder")}
            className="bk-intake__allergies"
          />
        )}
      </Field>

      <div className="bk-intake__block">
        <span className="bk-intake__label">
          {t("screensB.intake.pressureLabel")}
        </span>
        <Segmented<IntakePressure>
          label={t("screensB.intake.pressureLabel")}
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
          {t("screensB.intake.consent")}
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
        {t("screensB.intake.submit")}
      </Button>
    </main>
  );
}
