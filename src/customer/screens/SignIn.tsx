/**
 * G6 Find your booking and G7 Sign in are one thing: the e-mail sign-in (cT9).
 * The booking code on Find is kept in the page only, to land on that visit. It
 * is never looked up, so a wrong e-mail learns nothing about any booking.
 */
import { PublicApiError } from "@adminiumjs/public-client";
import { linkFromFragment } from "@adminiumjs/public-client";
import { useEffect, useState, type FormEvent } from "react";

import { A, useApp } from "../app.tsx";
import { Icon } from "../parts.tsx";
import { looksLikeCode, looksLikeEmail } from "../rules.ts";
import type { Word } from "../words/index.ts";

const CODE_MINUTES = 10;

export default function SignIn({ find = false }: { find?: boolean }) {
  const { t, door, go, locale, refreshMe, studio } = useApp();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [booking, setBooking] = useState("");
  const [otp, setOtp] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState(false);

  /** Signed in: to that visit if the code on Find is theirs, else to all of them. */
  const land = async () => {
    await refreshMe();
    if (find && booking.trim() !== "") {
      const wanted = booking.trim().toUpperCase();
      const mine = await door.myBookings().catch(() => []);
      const row = mine.find((b) => String(b["code"] ?? "").toUpperCase() === wanted);
      if (row !== undefined) {
        go(`/b?id=${String(row["id"])}`, { replace: true });
        return;
      }
    }
    go("/account", { replace: true });
  };

  // The link in the sign-in mail lands here, with its code in the fragment.
  useEffect(() => {
    const link = linkFromFragment(window.location.hash);
    if (link === null) return;
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    setOpening(true);
    door
      .openSignInLink(link.token)
      .then(async (ok) => {
        if (ok) await land();
        else {
          setOpening(false);
          setErr(t("errOtpExpired"));
        }
      })
      .catch(() => {
        setOpening(false);
        setErr(t("somethingWrong"));
      });
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async () => {
    setBusy(true);
    setErr(null);
    try {
      const sent = await door.requestSignIn(email.trim(), locale);
      setSentTo(sent.sentTo ?? email.trim());
      setStep("code");
      setOtp("");
    } catch (error) {
      setErr(wordFor(error, t));
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (step === "email") {
      if (!looksLikeEmail(email)) {
        setErr(t("errEmail"));
        document.getElementById("lm-si-email")?.focus();
        return;
      }
      await send();
      return;
    }
    if (!looksLikeCode(otp)) {
      setErr(t("errOtp"));
      return;
    }
    setBusy(true);
    try {
      const result = await door.verifySignIn(email.trim(), otp.trim());
      if (result.ok) {
        await land();
        return;
      }
      setErr(result.triesLeft > 0 ? t("errOtpWrong", { n: result.triesLeft }) : t("errOtpLocked"));
      if (result.triesLeft <= 0) setLocked(true);
    } catch (error) {
      if (error instanceof PublicApiError && (error.code === "PUBLIC_CLAIM_LOCKED" || error.code === "PUBLIC_CODE_LOCKED")) setLocked(true);
      setErr(wordFor(error, t));
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setStep("email");
    setOtp("");
    setErr(null);
    setLocked(false);
  };

  if (opening) {
    return (
      <main id="lm-main" className="lm-narrow-page" style={{ maxWidth: 480, textAlign: "center" }} aria-busy="true">
        <Icon name="loader-circle" size={24} className="lm-spin" />
        <p className="lm-muted" style={{ marginTop: 12 }}>
          {t("linkOpening")}
        </p>
      </main>
    );
  }

  const errId = "lm-si-err";
  const described = err === null ? {} : { "aria-describedby": errId };
  const prefix = String(studio.rows.settings["code_prefix"] ?? "");
  return (
    <main id="lm-main" className="lm-narrow-page" style={{ maxWidth: find ? 520 : 480 }}>
      <h1 className="lm-title" style={{ fontSize: "clamp(26px,4cqi,32px)" }}>
        {find ? t("findTitle2") : t("signInTitle")}
      </h1>
      <p className="lm-sub">{find ? t("findIntro") : t("signInIntro")}</p>
      <form noValidate onSubmit={(e) => void submit(e)} className="lm-card lm-col" style={{ padding: "clamp(20px,3cqi,26px)", gap: 16 }}>
        {step === "email" ? (
          <>
            {find ? (
              <div className="lm-field">
                <label htmlFor="lm-fd-code">{t("fdCode")}</label>
                <input id="lm-fd-code" className="lm-input" dir="ltr" placeholder={prefix} maxLength={20} value={booking} onChange={(e) => setBooking(e.target.value)} />
              </div>
            ) : null}
            <div className="lm-field">
              <label htmlFor="lm-si-email">{find ? t("fdEmail") : t("fEmail")}</label>
              <input id="lm-si-email" className="lm-input" type="email" dir="ltr" autoComplete="email" value={email} aria-invalid={err !== null} {...described} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, lineHeight: 1.55 }}>{find ? t("sentCode", { email: sentTo, n: CODE_MINUTES }) : t("sentCodeShort", { email: sentTo, n: CODE_MINUTES })}</p>
            <div className="lm-field">
              <label htmlFor="lm-si-otp">{t("otp")}</label>
              <input id="lm-si-otp" className="lm-input lm-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} dir="ltr" value={otp} aria-invalid={err !== null} {...described} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
            </div>
          </>
        )}
        {err === null ? null : (
          <div id={errId} role="alert" className="lm-note danger">
            <Icon name="circle-alert" size={16} />
            {err}
          </div>
        )}
        <button type="submit" className="lm-btn primary large" disabled={busy || locked}>
          {step === "email" ? t(find ? "emailMeCode" : "signInBtn") : t(find ? "openBooking" : "signInCodeBtn")}
        </button>
        {step === "code" ? (
          <>
            <button type="button" className="lm-link quiet" style={{ justifyContent: "center" }} disabled={busy} onClick={() => void send()}>
              {t("sendNew")}
            </button>
            <button type="button" className="lm-link quiet" style={{ justifyContent: "center" }} onClick={restart}>
              {find ? t("useDifferent") : t("useDifferentEmail")}
            </button>
          </>
        ) : null}
      </form>
      {find ? (
        <p className="lm-muted" style={{ marginTop: 18, fontSize: 13, lineHeight: 1.5 }}>
          {t("haveAccount")} <A to="/sign-in">{t("signIn")}</A> {t("toSeeVisits")}
        </p>
      ) : (
        <p className="lm-muted" style={{ marginTop: 18, fontSize: 13, lineHeight: 1.5 }}>
          {t("noAccount")}
        </p>
      )}
    </main>
  );
}

function wordFor(error: unknown, t: (w: Word, p?: Record<string, string | number>) => string): string {
  if (!(error instanceof PublicApiError)) return t("somethingWrong");
  switch (error.code) {
    case "PUBLIC_CODE_TOO_SOON":
      return t("errTooSoon");
    case "PUBLIC_CODE_UNAVAILABLE":
      return t("errMail");
    case "PUBLIC_CODE_LOCKED":
    case "PUBLIC_CLAIM_LOCKED":
    case "PUBLIC_CODE_LIMIT":
    case "PUBLIC_RATE_LIMITED":
      return t("errOtpLocked");
    case "PUBLIC_CODE_EXPIRED":
      return t("errOtpExpired");
    case "PUBLIC_CODE_WRONG":
      return t("errOtp");
    case "PUBLIC_NETWORK_UNAVAILABLE":
      return t("offline");
    default:
      return t("somethingWrong");
  }
}
