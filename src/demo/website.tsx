/**
 * G15 in the demo: the studio's own website, standing in for wherever the owner
 * pastes the snippet, with the real framed booking page in it, in each of the
 * three modes. Inline it sits in the page; Button opens it from a button of the
 * site's; Floating is a launcher in the corner that opens it as a sheet.
 *
 * The page inside is the real one, told it is in a frame. The frame itself is a
 * stand-in: nothing is embedded across an origin here.
 *
 * DEMO BUILD ONLY: nothing in a real build imports it.
 */
import type { FrameLink } from "@adminiumjs/public-client/frame";
import { CalendarPlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { StudioRows } from "../customer/door.ts";
import { FRAMED_SCREENS, type Screen } from "../customer/route.ts";
import { Root } from "../customer/Root.tsx";
import { useI18n } from "../i18n/index.tsx";
import { BASE, useDemo, type WebMode } from "./adminium.ts";
import { cardWord } from "./card.ts";
import type { DemoGuest } from "./guest.ts";

const CSS = `
.lw-site{min-height:100vh;background:var(--surface-2);color:var(--fg);font-family:Manrope,"Noto Sans Arabic",system-ui,sans-serif}
.lw-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px clamp(16px,4vw,40px);background:var(--surface);border-block-end:1px solid var(--border)}
.lw-brand{font-size:16px;font-weight:800;letter-spacing:-.01em}
.lw-hero{padding:clamp(28px,6vw,56px) clamp(16px,4vw,40px) 22px;max-width:760px}
.lw-hero h1{margin:0 0 10px;font-size:clamp(26px,5vw,38px);font-weight:800;letter-spacing:-.03em;line-height:1.15}
.lw-hero p{margin:0;font-size:15px;line-height:1.55;color:var(--fg-muted)}
.lw-frame{margin:0 clamp(16px,4vw,40px) 40px;border:1px solid var(--border);border-radius:16px;overflow:hidden;background:var(--bg)}
.lw-frame .lm-root{min-height:0}
.lw-btn{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 18px;border:none;border-radius:12px;background:var(--accent);color:var(--accent-fg,#fff);font:inherit;font-weight:800;cursor:pointer}
.lw-scrim{position:fixed;inset:0;z-index:50;background:rgba(12,12,22,.45);display:flex;align-items:center;justify-content:center;padding:16px}
.lw-sheet{position:relative;width:min(100%,920px);max-height:calc(100dvh - 32px);overflow:auto;border-radius:18px;background:var(--bg)}
.lw-sheet .lm-root{min-height:0}
.lw-close{position:sticky;top:8px;float:inline-end;margin:8px;z-index:2;width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--border);border-radius:10px;background:var(--surface);color:var(--fg);cursor:pointer}
.lw-launcher{position:fixed;inset-block-end:20px;inset-inline-start:20px;z-index:40;box-shadow:0 10px 28px rgba(20,20,35,.22)}
`;

/** A frame link that goes nowhere: the framed page stays in this page, and what opens elsewhere is not followed. */
function frameFor(mode: WebMode): FrameLink {
  return {
    mode,
    parentOrigin: () => window.location.origin,
    allows: (screen) => FRAMED_SCREENS.includes(screen as Screen),
    outside: (path) => `${BASE}${path}`,
    linkProps: (path) => ({ href: `${BASE}${path}`, target: "_blank" as const, rel: "noopener" }),
    go: () => false,
    postHeight: () => undefined,
    size: () => undefined,
    openSheet: () => undefined,
    closeSheet: () => undefined,
    scrollIntoView: () => undefined,
    done: () => undefined,
    stop: () => undefined,
  };
}

export function Website({ door, rows, clockNow }: { door: DemoGuest; rows: StudioRows; clockNow: () => number }) {
  const mode = useDemo((s) => s.webMode);
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const frame = useMemo(() => frameFor("inline"), []);
  const studio = String(rows.settings["studio_name"] ?? "");
  const tagline = String(rows.settings["tagline"] ?? "");
  const bookWord = cardWord(locale, "web.book");

  // The sheet is the visitor's to open: it starts closed each time the mode changes.
  useEffect(() => setOpen(false), [mode]);
  // Open, the sheet is a dialog: the card steps aside.
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  const page = <Root door={door} rows={rows} base={BASE} frame={frame} clockNow={clockNow} />;
  return (
    <div className="lw-site" data-mode={mode}>
      <style>{CSS}</style>
      <header className="lw-head">
        <span className="lw-brand">{studio}</span>
        {mode === "button" ? (
          <button type="button" className="lw-btn" onClick={() => setOpen(true)}>
            <CalendarPlus size={16} aria-hidden="true" />
            {bookWord}
          </button>
        ) : null}
      </header>
      <section className="lw-hero">
        <h1>{studio}</h1>
        <p dir="auto">{tagline}</p>
      </section>
      {mode === "inline" ? <div className="lw-frame">{page}</div> : null}
      {mode === "floating" && !open ? (
        <button type="button" className="lw-btn lw-launcher" onClick={() => setOpen(true)}>
          <CalendarPlus size={17} aria-hidden="true" />
          {bookWord}
        </button>
      ) : null}
      {mode !== "inline" && open ? (
        <div className="lw-scrim">
          <div className="lw-sheet" role="dialog" aria-modal="true" aria-label={bookWord}>
            <button type="button" className="lw-close" aria-label={cardWord(locale, "web.close")} onClick={() => setOpen(false)}>
              <X size={16} aria-hidden="true" />
            </button>
            {page}
          </div>
        </div>
      ) : null}
    </div>
  );
}
