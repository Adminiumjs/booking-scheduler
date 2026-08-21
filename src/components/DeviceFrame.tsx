/*
 * DeviceFrame — the phone shell the comps drew but never shipped.
 *
 * PROVENANCE. All three phone comps import their device chrome instead of
 * drawing it:
 *
 *   Mobile.dc.html       L41  <x-import component-from-global-scope="IOSDevice"
 *                               from="./ios-frame.jsx" dark="{{ dark }}"
 *                               hint-size="402px,874px">
 *   Admin Phone.dc.html  L39  the same IOSDevice import, the same hint-size
 *   Android.dc.html      L40  <x-import component-from-global-scope="AndroidDevice"
 *                               from="./android-frame.jsx" dark="{{ dark }}"
 *                               hint-size="412px,892px">
 *
 * Neither `ios-frame.jsx` nor `android-frame.jsx` was supplied with the comps.
 * They are not in the download, not on the desktop, and not in the repo. So
 * this file is a reconstruction, and the split below is the honest accounting
 * of what is ported versus what is invented. Do not let a later reader assume
 * more of it came from the comps than actually did.
 *
 * PORTED — proven by the comp markup:
 *   - Two components, not one. `IOSDevice` and `AndroidDevice` are separate
 *     imports at different sizes; they are one component here only because the
 *     showcase wants a switch, and every pixel that differs is data-driven.
 *   - The screen slot is 402x874 (iOS) and 412x892 (Android), verbatim from
 *     `hint-size`. That is the SCREEN, not the outer device — 402x874 is the
 *     iPhone 16 Pro logical viewport and 412 is the Pixel-class CSS width, so
 *     the bezel is added outside it.
 *   - The slot must have a DEFINITE block-size. The single child the frame
 *     receives is `height:'100%'` (Mobile L685, Admin L451, Android L706) over
 *     a `flex:1; overflow-y:auto` body; an indefinite height collapses it.
 *   - The slot must be POSITIONED. Mobile's booking-success sheet is
 *     `position:absolute; inset:0` (L53) while Mobile's own app root declares
 *     no `position` at all — so the containing block has to come from the
 *     frame. Admin Phone hides this by adding `position:'relative'` itself,
 *     which is exactly why the bug would survive a one-comp test.
 *   - The slot must CLIP. The scrim is `inset:0` and the bottom sheet is flush
 *     to three edges (`border-radius:26px 26px 0 0` iOS / `28px` Android), so
 *     without `overflow:hidden` they render square past the screen corners.
 *   - The safe insets, i.e. the space the app already keeps clear for chrome:
 *     top 58px (Mobile L69) / 56px (Admin L76) — budgeted to Mobile's 58, the
 *     only comp this repo renders; bottom 30px, the dead lane under the tab
 *     labels (Mobile L541, Admin L333). Android reserves 14px top (L75) and
 *     16px bottom (L554). Published here as `--bk-device-safe-start/-end` so
 *     the app content can reserve the right amount per platform.
 *   - The bottom tab bar is APP UI, not chrome — the comps draw it inside the
 *     import, with their own `--surface-header` fill. The frame draws no bar.
 *   - `dark` was the only prop passed. In this port that is not a prop at all:
 *     the frame inherits the token palette and re-resolves, which is why
 *     nothing here branches on theme in JS.
 *
 * RECONSTRUCTED — zero comp evidence, invented to a reference device:
 *   - That a status bar exists at all, its geometry, its glyph set and the
 *     9:41 clock. No comp contains a clock string or a radio glyph; no prop
 *     carries a time, a carrier or a battery level, so the values were
 *     hardcoded inside the missing .jsx.
 *   - The Dynamic Island (~125x36 at 11px) and the Android punch-hole.
 *   - The home indicator (~140x5) and the Android gesture pill (~108x4). Only
 *     the LANE they sit in is proven, not the pills themselves.
 *   - Bezel wall thickness, both corner radii and the drop shadow.
 *   - Hardware side buttons are deliberately omitted: nothing in any comp
 *     references them, and they may never have existed in the .jsx.
 *
 * THREE DELIBERATE DEVIATIONS from a literal reading of the comps:
 *   1. The bezel is token-driven and flips with the theme. The comps could not
 *      do that because their stage is near-white in BOTH themes
 *      (`dark?'#e7e7ea':'#ececed'`), so a lightening bezel would have
 *      dissolved into the page. Here the stage is `var(--surface-2)` and flips
 *      with everything else, so a pale phone in light and a graphite one in
 *      dark is the correct answer — and it keeps the no-hex rule intact.
 *   2. The cutout does NOT flip. It is a hole in the glass, not UI, so it is
 *      painted from the one token base.css declares theme-independent.
 *   3. Android's status bar overlays the app rather than reserving a strip
 *      above the screen; the app keeps the room clear via
 *      `--bk-device-safe-start`, so one set of app markup serves both frames.
 *
 *      [Corrected after review] An earlier cut of this file ordered the status
 *      bar BELOW the app so sheets would cover it, and claimed there was no
 *      comp evidence either way. There is: every comp's app root is opaque
 *      (`background: var(--bg)`, full height), so a status bar underneath it
 *      would have been invisible — the real frame must have painted its own on
 *      top. The chrome now stacks slot < status < home indicator < cutout.
 *
 * The chrome is decorative throughout: `aria-hidden` and `pointer-events:none`
 * on all four pieces, so assistive tech reads none of it. The shell itself IS
 * named (`role="group"` + a label) — inert chrome stops the fake clock being
 * announced, but only a named boundary tells someone they have walked into a
 * mockup rather than the real page.
 *
 * A NOTE ON STACKING, corrected after review: the status bar paints ABOVE the
 * app, not below. See the comment at its markup — the comps' opaque app root
 * proves the real frame must have done the same.
 */

import type { ReactNode } from "react";

import { useT } from "../i18n/index.tsx";

export type DevicePlatform = "ios" | "android";

export interface DeviceFrameProps {
  /** Which handset to draw. Changes the slot size and the chrome, nothing else. */
  platform: DevicePlatform;
  /** The app UI. Rendered verbatim into the screen slot. */
  children: ReactNode;
  className?: string;
  /**
   * Accessible name for the mockup region. Defaults to naming the handset,
   * so the boundary is announced even when a caller forgets.
   */
  label?: string;
}

/** Invented, and hardcoded exactly as the missing .jsx must have hardcoded it. */
const CLOCK = "9:41";

export function DeviceFrame({ platform, children, className, label }: DeviceFrameProps) {
  const t = useT();
  /* Two whole messages, not one with the handset spliced in: "iPhone" and
     "Android" are product names that some locales place differently. */
  const name =
    label ?? t(platform === "ios" ? "chrome.device.ios" : "chrome.device.android");

  return (
    <div
      className={["bk-device", className].filter(Boolean).join(" ")}
      data-platform={platform}
      /*
       * Named, not just inert. Making the chrome aria-hidden stops it being
       * read out, but it does not tell anyone where they are — and the app
       * inside is a mockup with two dozen focusable controls. Without a
       * boundary a screen-reader user walks out of the real page straight
       * into a fake booking flow, which is the confusion the surrounding
       * copy exists to prevent for sighted users.
       */
      role="group"
      aria-label={name}
    >
      <div className="bk-device__screen">
        {/*
         * Above the slot, not below it.
         *
         * All three comps give their app root `background: var(--bg)` at full
         * height (Mobile L685, Admin Phone L451, Android L706) — an opaque
         * element filling the whole screen. A status bar painted underneath
         * that would never have been visible, so the missing ios-frame.jsx
         * must have painted its own above the app. Ordering it below only
         * appeared to work here because the port had dropped that background,
         * which quietly made the app markup frame-dependent; with a sheet open
         * the clock then survived as a half-blurred smudge beside a crisp
         * island. On a real handset an in-app sheet never hides the system
         * status bar either.
         */}
        <div className="bk-device__status" aria-hidden="true">
          <span className="bk-device__clock">{CLOCK}</span>
          <span className="bk-device__radios">
            <span className="bk-device__bars">
              <i />
              <i />
              <i />
              <i />
            </span>
            <svg
              className="bk-device__wifi"
              viewBox="0 0 20 15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              focusable="false"
              aria-hidden="true"
            >
              <path d="M2 5.2a12 12 0 0 1 16 0" />
              <path d="M5.2 8.7a7.4 7.4 0 0 1 9.6 0" />
              <path d="M9.6 12.3h.8" strokeWidth="3" />
            </svg>
            <span className="bk-device__battery" />
          </span>
        </div>

        <div className="bk-device__slot">{children}</div>

        {/* Above the slot: the gesture hint and the physical cutout survive
            anything the app paints over the screen. */}
        <span className="bk-device__home" aria-hidden="true" />
        <span className="bk-device__cutout" aria-hidden="true" />
      </div>
    </div>
  );
}
