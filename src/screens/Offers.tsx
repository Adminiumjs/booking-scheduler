/*
 * SEASONAL OFFERS (view: 'offers') — the promo-code board.
 *
 * A featured banner plus four offer cards. Each code button copies to the
 * clipboard and flips to a "copied" state for a couple of seconds; the flag
 * lives on the store (`copiedCode`) because the banner and the cards share
 * it, and the timer that clears it is owned here so it dies with the screen.
 */

import { useEffect } from "react";

import { Button, Icon, IconTile } from "../components/index.ts";
import { COPIED_MS, FEATURED_OFFER, OFFERS } from "../data/screens/offers.ts";
import { useT } from "../i18n/index.tsx";
import { formatMediumISO, formatNumber } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-offers.css";

export default function Offers() {
  const t = useT();
  const copiedCode = useStore((s) => s.copiedCode);
  const set = useStore((s) => s.set);
  const startBooking = useStore((s) => s.startBooking);
  const showToast = useStore((s) => s.showToast);

  /* The comp hung the reset timer off the component instance, where it
   * outlived the screen. Here it is torn down on unmount, and copying a
   * second code restarts the countdown instead of stacking a new one. */
  useEffect(() => {
    if (!copiedCode) return undefined;
    const timer = setTimeout(() => set({ copiedCode: "" }), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copiedCode, set]);

  const copy = (code: string): void => {
    /* The comp only toasted; the port actually writes to the clipboard, the
     * same way the Refer screen does. */
    navigator.clipboard?.writeText(code).catch(() => {
      /* clipboard denied — the demo still confirms the intent */
    });
    set({ copiedCode: code });
    showToast(t("screensB.offers.toastCopied", { code }));
  };

  return (
    <section className="bk-screen bk-page scr-offers">
      <header className="scr-offers__intro">
        <span className="scr-offers__eyebrow">
          <Icon name="tag" size={14} />
          {t("screensB.offers.eyebrow")}
        </span>
        <h1 className="scr-offers__h1">{t("screensB.offers.h1")}</h1>
        <p className="scr-offers__sub">{t("screensB.offers.sub")}</p>
      </header>

      <div className="scr-offers__feature">
        <div className="scr-offers__featbody">
          <span className="scr-offers__featends">
            {t("screensB.offers.ends", {
              date: formatMediumISO(FEATURED_OFFER.endsISO),
            })}
          </span>
          <h2 className="scr-offers__feattitle">{FEATURED_OFFER.title}</h2>
          <p className="scr-offers__featblurb">{FEATURED_OFFER.blurb}</p>
        </div>
        <div className="scr-offers__featactions">
          <button
            type="button"
            className="bk-mono scr-offers__featcode"
            onClick={() => copy(FEATURED_OFFER.code)}
            aria-label={t(
              copiedCode === FEATURED_OFFER.code
                ? "screensB.common.codeCopied"
                : "screensB.common.copyCode",
              { code: FEATURED_OFFER.code },
            )}
          >
            <Icon
              name={copiedCode === FEATURED_OFFER.code ? "check" : "copy"}
              size={16}
            />
            {FEATURED_OFFER.code}
          </button>
          <Button
            variant="ghost"
            icon="calendar-plus"
            size="lg"
            className="scr-offers__featbook"
            onClick={() => startBooking(null)}
          >
            {t("screensB.offers.bookPairing")}
          </Button>
        </div>
      </div>

      <div className="scr-offers__grid">
        {OFFERS.map((o) => {
          const copied = copiedCode === o.code;
          return (
            <article className="bk-card scr-offer" key={o.code}>
              <div className="scr-offer__head">
                <IconTile
                  icon={o.icon}
                  tint={o.tint}
                  size={46}
                  iconSize={21}
                  radius={15}
                />
                <div className="scr-offer__id">
                  <h2 className="scr-offer__title">{o.title}</h2>
                  <div className="scr-offer__deal">{o.deal}</div>
                </div>
              </div>

              <p className="scr-offer__blurb">{o.blurb}</p>

              <div className="scr-offer__meta">
                <span className="scr-offer__ends">
                  <Icon name="clock" size={13} />
                  {t("screensB.offers.ends", {
                    date: formatMediumISO(o.endsISO),
                  })}
                </span>
                <span className="bk-mono">
                  {t(
                    o.leftKey,
                    o.leftCount === undefined
                      ? undefined
                      : { count: formatNumber(o.leftCount) },
                    o.leftCount,
                  )}
                </span>
              </div>

              <div className="scr-offer__actions">
                <button
                  type="button"
                  className="bk-mono scr-offer__code"
                  data-copied={copied ? "true" : "false"}
                  onClick={() => copy(o.code)}
                  aria-label={t(
                    copied
                      ? "screensB.common.codeCopied"
                      : "screensB.common.copyCode",
                    { code: o.code },
                  )}
                >
                  <Icon name={copied ? "check" : "copy"} size={14} />
                  {o.code}
                </button>
                {/* The comp labelled this "Book" for all four; the offer title
                    carries the context, so the accessible name adds it back. */}
                <Button
                  size="sm"
                  ariaLabel={t("screensB.common.bookNamed", { name: o.title })}
                  onClick={() => startBooking(o.svc)}
                >
                  {t("screensB.common.book")}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <p className="scr-offers__note">
        <Icon name="info" size={17} className="scr-offers__noteicon" />
        <span>{t("screensB.offers.note")}</span>
      </p>
    </section>
  );
}
