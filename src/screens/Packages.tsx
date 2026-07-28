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
import { PACKAGE_VALID_LABEL } from "../data/screens/packages.ts";
import type { PackageDeal } from "../data/types.ts";
import { MONTH_SHORT, money } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-packages.css";

/** `'5 × Signature Facial'`, or the studio-wide wording for a mixed bundle. */
function subjectOf(pkg: PackageDeal): string {
  return `${pkg.qty} × ${data.getService(pkg.svc)?.name ?? "studio services"}`;
}

/** Twelve months from today, phrased the way the card shows it. */
function expiryLabel(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return `Expires ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function Packages() {
  const pkgOwned = useStore((s) => s.pkgOwned);
  const set = useStore((s) => s.set);
  const go = useStore((s) => s.go);
  const startBooking = useStore((s) => s.startBooking);
  const showToast = useStore((s) => s.showToast);

  /* One "today" per visit to the screen — every owned card shows the same
   * expiry, and re-deriving it per render would be pointless churn. */
  const expiry = useMemo(expiryLabel, []);

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
      showToast(`${pkg.name} is already in your account`, "warn");
      return;
    }
    set({ pkgOwned: [...pkgOwned, { id: pkg.id, used: 0 }] });
    showToast(`${pkg.name} added — demo only, no charge`);
  };

  return (
    <section className="bk-screen bk-page scr-packages">
      <header className="scr-packages__intro">
        <span className="scr-packages__eyebrow">
          <Icon name="layers" size={14} />
          Prepaid bundles
        </span>
        <h1 className="scr-packages__h1">Package deals</h1>
        <p className="scr-packages__sub">
          Buy a few visits at once and pay less per session. Sessions sit in your
          account until you book them — no monthly fee, no expiry games.
        </p>
      </header>

      {owned.length > 0 ? (
        <>
          <h2 className="scr-packages__label">Your packages</h2>
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
                      <div className="scr-pkg-owned__sub">{subjectOf(pkg)}</div>
                    </div>
                    <span className="scr-pkg-owned__tally">
                      <span className="bk-mono scr-pkg-owned__left">{left}</span>
                      <span className="scr-pkg-owned__leftlabel">left</span>
                    </span>
                  </div>

                  <div>
                    <div
                      className="scr-pkg-owned__track"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={pkg.qty}
                      aria-valuenow={used}
                      aria-label={`${pkg.name} sessions used`}
                    >
                      <div
                        className="scr-pkg-owned__fill"
                        style={{ inlineSize: `${pct}%` }}
                      />
                    </div>
                    <div className="scr-pkg-owned__meta">
                      <span>
                        {used} of {pkg.qty} used
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
                    Book a session
                  </Button>
                </article>
              );
            })}
          </div>
        </>
      ) : null}

      <h2 className="scr-packages__label">Available packages</h2>
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
                <span className="scr-pkg__ribbon">Most popular</span>
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
                  <div className="scr-pkg__qty">{subjectOf(pkg)}</div>
                </div>
              </div>

              <p className="scr-pkg__blurb">{pkg.blurb}</p>

              <div className="scr-pkg__prices">
                <span className="bk-mono scr-pkg__now">{money(pkg.now)}</span>
                <span className="bk-mono scr-pkg__was">{money(pkg.was)}</span>
                <span className="scr-pkg__save">
                  Save {money(pkg.was - pkg.now)}
                </span>
              </div>

              <div className="bk-mono scr-pkg__terms">
                <span>{money(pkg.now / pkg.qty)} / session</span>
                <span>{PACKAGE_VALID_LABEL}</span>
              </div>

              <Button
                variant={have ? "ghost" : "primary"}
                icon={have ? "check" : "shopping-bag"}
                full
                onClick={() => buy(pkg)}
              >
                {have ? "In your account" : "Buy package"}
              </Button>
            </article>
          );
        })}
      </div>

      <p className="scr-packages__note">
        <Icon name="info" size={17} className="scr-packages__noteicon" />
        <span>
          Sessions stay valid for 12 months, can be gifted to a friend once, and
          are refundable pro-rata. This is a demo — nothing is charged.
        </span>
      </p>
    </section>
  );
}
