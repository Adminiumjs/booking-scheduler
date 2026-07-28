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
import { isValidEmail } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-signin.css";

/** How many digits the demo code has. */
const CODE_LENGTH = 6;

export default function SignIn() {
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
      set({ siErr: "Enter a valid email address." });
      return;
    }
    set({ siStep: "code", siCode: "", siErr: "" });
    showToast("Code sent · any six digits work", "ok");
  };

  const verify = (): void => {
    if (siCode.length < CODE_LENGTH) {
      set({ siErr: "Enter all six digits to continue." });
      return;
    }
    set({ signedIn: true, siStep: "email", siCode: "", siErr: "" });
    go("dash");
    showToast(`Signed in as ${acctName}`, "ok");
  };

  return (
    <section className="bk-screen bk-page scr-signin">
      {siStep === "email" ? (
        <>
          <div className="scr-signin__intro">
            <span className="scr-signin__mark">{BRAND.mark}</span>
            <h1 className="bk-h1">Welcome back</h1>
            <p className="bk-sub scr-signin__lede">
              Enter your email and we’ll send a six-digit code. No passwords to
              forget.
            </p>
          </div>

          <Card radius={20} padding={22} className="scr-signin__card">
            <Field label="Email address" error={siErr || undefined}>
              {(control) => (
                <TextInput
                  {...control}
                  type="email"
                  inputMode="email"
                  value={siEmail}
                  onChange={(v) => set({ siEmail: v, siErr: "" })}
                  placeholder="you@email.com"
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
                Keep me signed in on this device
              </span>
            </button>

            <Button icon="mail" iconSize={17} size="lg" full onClick={sendCode}>
              Email me a code
            </Button>
          </Card>

          <div className="scr-signin__or">
            <span className="scr-signin__rule" />
            <span className="scr-signin__orlabel">or</span>
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
            Book without an account
          </Button>

          <p className="scr-signin__foot">
            This is a demo sign-in — any email works and no code is really sent.
          </p>
        </>
      ) : (
        <>
          <BackLink onClick={() => set({ siStep: "email", siCode: "", siErr: "" })}>
            Use a different email
          </BackLink>

          <div className="scr-signin__intro">
            <span className="scr-signin__sent">
              <Icon name="mail-check" size={26} />
            </span>
            <h1 className="bk-h1 scr-signin__h1--code">Check your inbox</h1>
            <p className="bk-sub scr-signin__lede">
              We sent a six-digit code to{" "}
              <span className="scr-signin__echo">{siEmail || "your inbox"}</span>
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
              placeholder="000000"
              maxLength={CODE_LENGTH}
              inputMode="numeric"
              mono
              ariaLabel="Six-digit sign-in code"
              className="scr-signin__code"
            />
            {siErr ? (
              <span className="scr-signin__err" role="alert">
                <Icon name="alert-circle" size={14} />
                {siErr}
              </span>
            ) : null}

            <Button icon="log-in" iconSize={17} size="lg" full onClick={verify}>
              Verify &amp; sign in
            </Button>

            <div className="scr-signin__resend">
              Didn’t get it?
              <button
                type="button"
                className="bk-nav scr-signin__resendbtn"
                onClick={() => showToast("New code on its way", "ok")}
              >
                Resend code
              </button>
            </div>
          </Card>

          <p className="scr-signin__foot">Demo hint: any six digits will do.</p>
        </>
      )}
    </section>
  );
}
