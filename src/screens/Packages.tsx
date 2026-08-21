/*
 * PACKAGE DEALS (view: 'packages') — prepaid session bundles.
 *
 * Two stacks: the bundles already in the account, each with a progress bar
 * and a "book a session" shortcut, and the catalogue you can buy from.
 * Buying only ever appends to `pkgOwned` — there is no basket and no payment
 * step, which is why the buy button flips straight to "In your account".
 */

import { useMemo } from "react";

import { Button, Icon, IconTile } from "../components/index.ts";
import { data } from "../data/source.ts";
import {
  PACKAGE_VALID_KEY,
  PACKAGE_VALID_MONTHS,
} from "../data/screens/packages.ts";
import type { PackageDeal } from "../data/types.ts";
import { useI18n } from "../i18n/index.tsx";
import type { TFunction } from "../i18n/index.tsx";
import { formatMediumDate, money } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-packages.css";

/** `'5 × Signature Facial'`, or the studio-wide wording for a mixed bundle. */
function subjectOf(t: TFunction, qty: string, pkg: PackageDeal): string {
  return t("screensB.packages.subject", {
    qty,
    name: data.getService(pkg.svc)?.name ?? t("screensB.packages.studioServices"),
  });
}

export default function Packages() {
  const { t, number } = useI18n();
  const pkgOwned = useStore((s) => s.pkgOwned);
  const set = useStore((s) => s.set);
  const go = useStore((s) => s.go);
  const startBooking = useStore((s) => s.startBooking);
  const showToast = useStore((s) => s.showToast);

  /* One "today" per visit to the screen — every owned card shows the same
   * expiry, and re-deriving it per render would be pointless churn. */
  const expiryDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d;
  }, []);
  const expiry = t("screensB.packages.expires", {
    date: formatMediumDate(expiryDate),
  });

  /* An owned entry whose package has since left the catalogue is dropped
   * rather than rendered half-blank. */
  const owned = useMemo(
    () =>
      pkgOwned
        .map((o) => {
          const pkg = data.getPackages().find((p) => p.id === o.id);
          return pkg ? { used: o.used, pkg } : null;
        })
        .filter((o): o is { used: number; pkg: PackageDeal } => o !== null),
    [pkgOwned],
  );

  const book = (pkg: PackageDeal): void => {
    if (pkg.svc) startBooking(pkg.svc);
    else go("services");
  };

  const buy = (pkg: PackageDeal): void => {
    if (pkgOwned.some((o) => o.id === pkg.id)) {
      showToast(
        t("screensB.packages.toastAlready", { name: pkg.name }),
        "warn",
      );
      return;
    }
    set({ pkgOwned: [...pkgOwned, { id: pkg.id, used: 0 }] });
    showToast(t("screensB.packages.toastAdded", { name: pkg.name }));
  };

  return (
    <section className="bk-screen bk-page scr-packages">
      <header className="scr-packages__intro">
        <span className="scr-packages__eyebrow">
          <Icon name="layers" size={14} />
          {t("screensB.packages.eyebrow")}
        </span>
        <h1 className="scr-packages__h1">{t("screensB.packages.h1")}</h1>
        <p className="scr-packages__sub">{t("screensB.packages.sub")}</p>
      </header>

      {owned.length > 0 ? (
        <>
          <h2 className="scr-packages__label">
            {t("screensB.packages.yourPackages")}
          </h2>
          <div className="scr-packages__owned">
            {owned.map(({ used, pkg }) => {
              const left = pkg.qty - used;
              const pct = Math.round((used / pkg.qty) * 100);
              return (
                <article className="bk-card scr-pkg-owned" key={pkg.id}>
                  <div className="scr-pkg-owned__head">
                    <IconTile
                      icon={pkg.icon}
                      tint={pkg.tint}
                      size={46}
                      iconSize={21}
                      radius={15}
                    />
                    <div className="scr-pkg-owned__id">
                      <h3 className="scr-pkg-owned__name">{pkg.name}</h3>
                      <div className="scr-pkg-owned__sub">
                        {subjectOf(t, number(pkg.qty), pkg)}
                      </div>
                    </div>
                    <span className="scr-pkg-owned__tally">
                      <span className="bk-mono scr-pkg-owned__left">
                        {number(left)}
                      </span>
                      <span className="scr-pkg-owned__leftlabel">
                        {t("screensB.packages.left")}
                      </span>
                    </span>
                  </div>

                  <div>
                    <div
                      className="scr-pkg-owned__track"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={pkg.qty}
                      aria-valuenow={used}
                      aria-label={t("screensB.packages.sessionsUsed", {
                        name: pkg.name,
                      })}
                    >
                      <div
                        className="scr-pkg-owned__fill"
                        style={{ inlineSize: `${pct}%` }}
                      />
                    </div>
                    <div className="scr-pkg-owned__meta">
                      <span>
                        {t("screensB.packages.usedOf", {
                          used: number(used),
                          total: number(pkg.qty),
                        })}
                      </span>
                      <span>{expiry}</span>
                    </div>
                  </div>

                  <Button
                    icon="calendar-plus"
                    iconSize={15}
                    full
                    onClick={() => book(pkg)}
                  >
                    {t("screensB.packages.bookSession")}
                  </Button>
                </article>
              );
            })}
          </div>
        </>
      ) : null}

      <h2 className="scr-packages__label">
        {t("screensB.packages.available")}
      </h2>
      <div className="scr-packages__grid">
        {data.getPackages().map((pkg) => {
          const have = pkgOwned.some((o) => o.id === pkg.id);
          return (
            <article
              className="scr-pkg"
              data-featured={pkg.featured ? "true" : "false"}
              key={pkg.id}
            >
              {pkg.featured ? (
                <span className="scr-pkg__ribbon">
                  {t("screensB.packages.mostPopular")}
                </span>
              ) : null}

              <div className="scr-pkg__head">
                <IconTile
                  icon={pkg.icon}
                  tint={pkg.tint}
                  size={46}
                  iconSize={21}
                  radius={15}
                />
                <div className="scr-pkg__id">
                  <h3 className="scr-pkg__name">{pkg.name}</h3>
                  <div className="scr-pkg__qty">
                    {subjectOf(t, number(pkg.qty), pkg)}
                  </div>
                </div>
              </div>

              <p className="scr-pkg__blurb">{pkg.blurb}</p>

              <div className="scr-pkg__prices">
                <span className="bk-mono scr-pkg__now">{money(pkg.now)}</span>
                <span className="bk-mono scr-pkg__was">{money(pkg.was)}</span>
                <span className="scr-pkg__save">
                  {t("screensB.packages.save", {
                    amount: money(pkg.was - pkg.now),
                  })}
                </span>
              </div>

              <div className="bk-mono scr-pkg__terms">
                <span>
                  {t("screensB.packages.perSession", {
                    amount: money(pkg.now / pkg.qty),
                  })}
                </span>
                <span>
                  {t(
                    PACKAGE_VALID_KEY,
                    { count: number(PACKAGE_VALID_MONTHS) },
                    PACKAGE_VALID_MONTHS,
                  )}
                </span>
              </div>

              <Button
                variant={have ? "ghost" : "primary"}
                icon={have ? "check" : "shopping-bag"}
                full
                onClick={() => buy(pkg)}
              >
                {t(
                  have
                    ? "screensB.packages.inAccount"
                    : "screensB.packages.buy",
                )}
              </Button>
            </article>
          );
        })}
      </div>

      <p className="scr-packages__note">
        <Icon name="info" size={17} className="scr-packages__noteicon" />
        <span>{t("screensB.packages.note")}</span>
      </p>
    </section>
  );
}
