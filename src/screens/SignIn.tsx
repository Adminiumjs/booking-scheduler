/*
 * SIGN IN (view: 'signin') — revised comp, guest half.
 *
 * Passwordless in two steps: ask for the email, then take a six-digit code.
 * Nothing is sent and any six digits pass — the point is the shape of the
 * flow, not the auth. Booking without an account stays one click away.
 */

import {
  BRAND,
  BackLink,
  Button,
  Card,
  Checkbox,
  Field,
  Icon,
  TextInput,
} from "../components/index.ts";
import { useT } from "../i18n/index.tsx";
import { isValidEmail } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-signin.css";

/** How many digits the demo code has. */
const CODE_LENGTH = 6;

export default function SignIn() {
  const t = useT();
  const siStep = useStore((s) => s.siStep);
  const siEmail = useStore((s) => s.siEmail);
  const siCode = useStore((s) => s.siCode);
  const siErr = useStore((s) => s.siErr);
  const siRemember = useStore((s) => s.siRemember);
  const acctName = useStore((s) => s.acct.name);
  const set = useStore((s) => s.set);
  const go = useStore((s) => s.go);
  const startBooking = useStore((s) => s.startBooking);
  const showToast = useStore((s) => s.showToast);

  const sendCode = (): void => {
    /* The comp hand-rolled a looser check; the app already ships one
     * validator and every other form on the guest half uses it. */
    if (!isValidEmail(siEmail.trim())) {
      set({ siErr: t("screensB.signin.errEmail") });
      return;
    }
    set({ siStep: "code", siCode: "", siErr: "" });
    showToast(t("screensB.signin.toastCodeSent"), "ok");
  };

  const verify = (): void => {
    if (siCode.length < CODE_LENGTH) {
      set({ siErr: t("screensB.signin.errCode") });
      return;
    }
    set({ signedIn: true, siStep: "email", siCode: "", siErr: "" });
    go("dash");
    showToast(t("screensB.signin.toastSignedIn", { name: acctName }), "ok");
  };

  /*
   * The echoed address sits inside the sentence, so the message owns the whole
   * line and the split on its placeholder is what keeps the highlight — a
   * translator can move `{email}` anywhere the sentence needs it.
   */
  const [sentBefore, sentAfter] = t("screensB.signin.sentTo").split("{email}");

  return (
    <section className="bk-screen bk-page scr-signin">
      {siStep === "email" ? (
        <>
          <div className="scr-signin__intro">
            <span className="scr-signin__mark">{BRAND.mark}</span>
            <h1 className="bk-h1">{t("screensB.signin.welcome")}</h1>
            <p className="bk-sub scr-signin__lede">
              {t("screensB.signin.lede")}
            </p>
          </div>

          <Card radius={20} padding={22} className="scr-signin__card">
            <Field
              label={t("screensB.signin.fieldEmail")}
              error={siErr || undefined}
            >
              {(control) => (
                <TextInput
                  {...control}
                  type="email"
                  inputMode="email"
                  value={siEmail}
                  onChange={(v) => set({ siEmail: v, siErr: "" })}
                  placeholder={t("screensB.common.phEmail")}
                />
              )}
            </Field>

            <button
              type="button"
              role="checkbox"
              aria-checked={siRemember}
              className="scr-signin__remember"
              onClick={() => set({ siRemember: !siRemember })}
            >
              <Checkbox checked={siRemember} />
              <span className="scr-signin__remembertext">
                {t("screensB.signin.remember")}
              </span>
            </button>

            <Button icon="mail" iconSize={17} size="lg" full onClick={sendCode}>
              {t("screensB.signin.emailCode")}
            </Button>
          </Card>

          <div className="scr-signin__or">
            <span className="scr-signin__rule" />
            <span className="scr-signin__orlabel">{t("screensB.signin.or")}</span>
            <span className="scr-signin__rule" />
          </div>

          <Button
            variant="ghost"
            icon="calendar-plus"
            size="lg"
            full
            className="scr-signin__guest"
            onClick={() => startBooking(null)}
          >
            {t("screensB.signin.bookWithoutAccount")}
          </Button>

          <p className="scr-signin__foot">{t("screensB.signin.foot")}</p>
        </>
      ) : (
        <>
          <BackLink onClick={() => set({ siStep: "email", siCode: "", siErr: "" })}>
            {t("screensB.signin.differentEmail")}
          </BackLink>

          <div className="scr-signin__intro">
            <span className="scr-signin__sent">
              <Icon name="mail-check" size={26} />
            </span>
            <h1 className="bk-h1 scr-signin__h1--code">
              {t("screensB.signin.checkInbox")}
            </h1>
            <p className="bk-sub scr-signin__lede">
              {sentBefore}
              <span className="scr-signin__echo">
                {siEmail || t("screensB.signin.yourInbox")}
              </span>
              {sentAfter ?? ""}
            </p>
          </div>

          <Card radius={20} padding={22} className="scr-signin__card">
            <TextInput
              value={siCode}
              onChange={(v) =>
                set({
                  siCode: v.replace(/\D/g, "").slice(0, CODE_LENGTH),
                  siErr: "",
                })
              }
              /* A digit mask, not a word — the same in every locale. */
              placeholder="000000"
              maxLength={CODE_LENGTH}
              inputMode="numeric"
              mono
              ariaLabel={t("screensB.signin.codeLabel")}
              className="scr-signin__code"
            />
            {siErr ? (
              <span className="scr-signin__err" role="alert">
                <Icon name="alert-circle" size={14} />
                {siErr}
              </span>
            ) : null}

            <Button icon="log-in" iconSize={17} size="lg" full onClick={verify}>
              {t("screensB.signin.verify")}
            </Button>

            <div className="scr-signin__resend">
              {t("screensB.signin.didntGet")}
              <button
                type="button"
                className="bk-nav scr-signin__resendbtn"
                onClick={() => showToast(t("screensB.signin.toastNewCode"), "ok")}
              >
                {t("screensB.signin.resend")}
              </button>
            </div>
          </Card>

          <p className="scr-signin__foot">{t("screensB.signin.demoHint")}</p>
        </>
      )}
    </section>
  );
}
