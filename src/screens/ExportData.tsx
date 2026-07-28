/*
 * EXPORT YOUR DATA (view: 'export') — revised comp, guest half.
 *
 * The left column builds the request (range, contents, format); the right one
 * describes the resulting file and runs the fake generation. Nothing is ever
 * written to disk — the file is described, not produced.
 */

import { useEffect, useRef } from "react";

import {
  BackLink,
  Button,
  Card,
  Checkbox,
  Chip,
  Eyebrow,
  Icon,
  TextInput,
} from "../components/index.ts";
import {
  EXPORT_DELAY_MS,
  EXPORT_END_ISO,
  EXPORT_FORMATS,
  EXPORT_HISTORY,
  EXPORT_INCLUDES,
  EXPORT_RANGES,
} from "../data/screens/export.ts";
import type { ExportRange } from "../data/screens/export.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-export.css";

export default function ExportData() {
  const exRange = useStore((s) => s.exRange);
  const exFrom = useStore((s) => s.exFrom);
  const exTo = useStore((s) => s.exTo);
  const exFmt = useStore((s) => s.exFmt);
  const exInc = useStore((s) => s.exInc);
  const exEmail = useStore((s) => s.exEmail);
  const exState = useStore((s) => s.exState);
  const acctEmail = useStore((s) => s.acct.email);
  const set = useStore((s) => s.set);
  const go = useStore((s) => s.go);
  const showToast = useStore((s) => s.showToast);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Leaving mid-run would otherwise strand the panel on "Gathering…", because
   * the pending timeout is the only thing that would have cleared it. */
  useEffect(() => {
    return () => {
      if (timer.current === null) return;
      clearTimeout(timer.current);
      timer.current = null;
      set({ exState: "idle" });
    };
  }, [set]);

  const rowCount = EXPORT_INCLUDES.reduce(
    (sum, o) => sum + (exInc[o.key] ? o.count : 0),
    0,
  );
  const format =
    EXPORT_FORMATS.find((f) => f.id === exFmt) ?? EXPORT_FORMATS[0];
  const filename = `lumen-bookings-${exFrom}_${exTo}.${exFmt}`;
  const meta = `${rowCount} rows · ${format.sub.toLowerCase()} · ${
    exEmail ? "download + email" : "download only"
  }`;
  const size = `${Math.max(4, rowCount * 1.4).toFixed(0)} KB`;

  const pickRange = (r: ExportRange): void =>
    set({
      exRange: r.id,
      exFrom: r.from ?? exFrom,
      exTo: EXPORT_END_ISO,
      exState: "idle",
    });

  const toggleInclude = (key: string): void =>
    set({ exInc: { ...exInc, [key]: !exInc[key] }, exState: "idle" });

  const generate = (): void => {
    if (rowCount === 0) {
      showToast("Pick at least one thing to include", "warn");
      return;
    }
    set({ exState: "busy" });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      set({ exState: "ready" });
      showToast("Export ready", "ok");
    }, EXPORT_DELAY_MS);
  };

  return (
    <section className="bk-screen bk-page scr-export">
      <BackLink onClick={() => go("dash")}>Back to dashboard</BackLink>

      <header className="scr-export__head">
        <h1 className="bk-h1">Export your booking history</h1>
        <p className="bk-sub scr-export__lede">
          Useful for expenses, insurance claims, or just keeping your own
          records. Your data, whenever you want it.
        </p>
      </header>

      <div className="scr-export__grid">
        <Card radius={22} padding={24} className="scr-export__form">
          <div>
            <span className="bk-label">Date range</span>
            <div className="scr-export__chips">
              {EXPORT_RANGES.map((r) => (
                <Chip
                  key={r.id}
                  label={r.label}
                  active={exRange === r.id}
                  onClick={() => pickRange(r)}
                />
              ))}
            </div>
            <div className="scr-export__dates">
              <TextInput
                value={exFrom}
                onChange={(v) =>
                  set({ exFrom: v, exRange: "custom", exState: "idle" })
                }
                mono
                ariaLabel="Export start date"
                className="scr-export__date"
              />
              <span className="scr-export__to">to</span>
              <TextInput
                value={exTo}
                onChange={(v) =>
                  set({ exTo: v, exRange: "custom", exState: "idle" })
                }
                mono
                ariaLabel="Export end date"
                className="scr-export__date"
              />
            </div>
          </div>

          <div>
            <span className="bk-label">What to include</span>
            <div className="scr-export__includes">
              {EXPORT_INCLUDES.map((o, i) => {
                const on = Boolean(exInc[o.key]);
                return (
                  <button
                    key={o.key}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    className="scr-export__inc"
                    data-on={on ? "true" : "false"}
                    data-last={
                      i === EXPORT_INCLUDES.length - 1 ? "true" : "false"
                    }
                    onClick={() => toggleInclude(o.key)}
                  >
                    <Checkbox checked={on} />
                    <span className="scr-export__inctext">
                      <span className="scr-export__inclabel">{o.label}</span>
                      <span className="scr-export__incsub">{o.sub}</span>
                    </span>
                    <span className="scr-export__inccount bk-mono">
                      {o.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="bk-label">Format</span>
            <div className="scr-export__formats">
              {EXPORT_FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={exFmt === f.id}
                  className="scr-export__fmt"
                  data-active={exFmt === f.id ? "true" : "false"}
                  onClick={() => set({ exFmt: f.id, exState: "idle" })}
                >
                  <Icon name={f.icon} size={19} />
                  <span className="scr-export__fmtlabel">{f.label}</span>
                  <span className="scr-export__fmtsub">{f.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            role="checkbox"
            aria-checked={exEmail}
            className="scr-export__emailme"
            onClick={() => set({ exEmail: !exEmail })}
          >
            <Checkbox checked={exEmail} />
            <span className="scr-export__emailtext">
              Email me a copy as well
            </span>
          </button>
        </Card>

        <div className="scr-export__side">
          <Card radius={22} padding={24} className="scr-export__file">
            <Eyebrow>Your export</Eyebrow>

            <div className="scr-export__filerow">
              <span className="scr-export__filetile">
                <Icon name={format.icon} size={24} />
              </span>
              <span className="scr-export__filetext">
                <span className="scr-export__filename bk-mono">{filename}</span>
                <span className="scr-export__filemeta">{meta}</span>
              </span>
            </div>

            {exState === "idle" ? (
              <Button icon="file-down" iconSize={17} size="lg" full onClick={generate}>
                Generate export
              </Button>
            ) : null}

            {exState === "busy" ? (
              <div className="scr-export__busy" role="status">
                <Icon
                  name="loader-circle"
                  size={17}
                  className="scr-export__spinner"
                />
                <span className="scr-export__busytext">
                  Gathering {rowCount} rows…
                </span>
              </div>
            ) : null}

            {exState === "ready" ? (
              <>
                <div className="scr-export__ready" role="status">
                  <Icon name="check-circle-2" size={17} />
                  <span>
                    Ready — {rowCount} rows, {size}.
                  </span>
                </div>
                <div className="scr-export__readyrow">
                  <Button
                    icon="download"
                    size="lg"
                    className="scr-export__download"
                    onClick={() =>
                      showToast(
                        exEmail
                          ? /* The comp read a free variable that was never
                             * declared here; the copy goes to the account
                             * email, which is the address the form means. */
                            `Downloaded · copy emailed to ${acctEmail}`
                          : "Downloaded · demo only",
                        "ok",
                      )
                    }
                  >
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="scr-export__restart"
                    onClick={() => set({ exState: "idle" })}
                  >
                    Start over
                  </Button>
                </div>
              </>
            ) : null}

            <span className="scr-export__note">
              Demo export — the file is described, not actually written.
            </span>
          </Card>

          <Card radius={20} clip className="scr-export__history">
            <div className="bk-eyebrow scr-export__historyhead">
              Earlier exports
            </div>
            {EXPORT_HISTORY.map((h, i) => (
              <div
                key={h.file}
                className="scr-export__hrow"
                data-last={i === EXPORT_HISTORY.length - 1 ? "true" : "false"}
              >
                <span className="scr-export__htile">
                  <Icon name={h.icon} size={16} />
                </span>
                <span className="scr-export__htext">
                  <span className="scr-export__hfile bk-mono">{h.file}</span>
                  <span className="scr-export__hmeta">{h.meta}</span>
                </span>
                <button
                  type="button"
                  className="bk-gi scr-export__get"
                  onClick={() => showToast(`${h.file} · demo only`, "ok")}
                >
                  Get
                </button>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </section>
  );
}
