/*
 * Every "image" in the app.
 *
 * Tiles are keyed by a `filename` like `"bond_mask.jpg"`, a convention from the
 * design comp where a tinted gradient plus a mono filename chip stood in for a
 * photo not yet chosen. `data/photos.ts` now maps most of those names to real
 * photography: when a name has a photo the tile renders it, and when it does
 * not the original procedural tile is drawn instead — so a new placeholder
 * name still works, it just looks like it used to until a photo is picked.
 *
 * The gradient stays underneath the photo as the loading backdrop, which means
 * a tile is never blank while the image is in flight.
 */

import type { CSSProperties, ReactNode } from "react";

import { photoUrl } from "../data/photos.ts";
import { hexToRgba } from "../lib/format.ts";
import { useStore } from "../state/store.ts";
import { Icon } from "./Icon.tsx";

/** The three-layer tinted gradient. */
export function placeholderBackground(
  tint: string,
  angle = "158deg",
  dark = false,
): string {
  if (dark) {
    return [
      "radial-gradient(120% 82% at 50% 0%, rgba(255,255,255,.06), transparent 55%)",
      `radial-gradient(52% 24% at 50% 82%, ${hexToRgba(tint, 0.34)}, transparent 72%)`,
      `linear-gradient(${angle}, ${hexToRgba(tint, 0.32)}, ${hexToRgba(tint, 0.14)})`,
    ].join(", ");
  }
  return [
    "radial-gradient(120% 82% at 50% 0%, rgba(255,255,255,.6), transparent 58%)",
    `radial-gradient(52% 24% at 50% 82%, ${hexToRgba(tint, 0.22)}, transparent 72%)`,
    `linear-gradient(${angle}, ${hexToRgba(tint, 0.2)}, ${hexToRgba(tint, 0.07)})`,
  ].join(", ");
}

/** Glyph colour on top of a tinted tile. */
export function placeholderInk(tint: string, dark = false): string {
  return hexToRgba(tint, dark ? 0.66 : 0.5);
}

/** `true` when the app is currently in dark mode. */
export function useIsDark(): boolean {
  return useStore((s) => s.theme) === "dark";
}

export interface PlaceholderTileProps {
  /** Entity tint (hex) — e.g. `service.tint`. */
  tint: string;
  /** Lucide icon rendered in the centre. */
  icon?: string;
  /** Icon size in px (44 on cards, 72 on the hero, 52 on the map). */
  iconSize?: number;
  /** Minimum height in px. */
  minHeight?: number;
  /** Gradient angle. */
  angle?: string;
  /** Image key — resolved against `data/photos.ts`. Falls back to being shown
   * verbatim in the bottom-start chip when no photo is mapped to it. */
  filename?: string;
  /** Intended rendered width in px, so the CDN sends a right-sized file. */
  imgWidth?: number;
  /** Border radius; omit for a square-cornered card header. */
  radius?: number | string;
  /** Draw the comp's 1px bottom border (card headers do, standalone don't). */
  borderBlockEnd?: boolean;
  /** Full 1px border (hero + map tiles). */
  bordered?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function PlaceholderTile({
  tint,
  icon,
  iconSize = 44,
  minHeight = 132,
  angle = "158deg",
  filename,
  imgWidth = 800,
  radius,
  borderBlockEnd = true,
  bordered = false,
  className,
  style,
  children,
}: PlaceholderTileProps) {
  const dark = useIsDark();
  const photo = photoUrl(filename, imgWidth);
  return (
    <div
      className={["bk-ph", className].filter(Boolean).join(" ")}
      style={{
        minHeight: `${minHeight}px`,
        background: placeholderBackground(tint, angle, dark),
        borderBlockEnd: borderBlockEnd ? "1px solid var(--border)" : undefined,
        border: bordered ? "1px solid var(--border)" : undefined,
        borderRadius: typeof radius === "number" ? `${radius}px` : radius,
        ...style,
      }}
    >
      {photo ? (
        /* Decorative: every tile sits next to the name of whatever it depicts,
           so alt text here would only repeat the adjacent heading. */
        <img className="bk-ph-img" src={photo} alt="" loading="lazy" decoding="async" />
      ) : (
        <>
          {icon ? (
            <Icon name={icon} size={iconSize} color={placeholderInk(tint, dark)} />
          ) : null}
          {filename ? <span className="bk-ph-chip">{filename}</span> : null}
        </>
      )}
      {children}
    </div>
  );
}

export interface AvatarProps {
  /** Two letters, e.g. `'SE'`. */
  initials: string;
  tint: string;
  /** Square size in px (60 team, 52 staff row, 44 review). */
  size?: number;
  /** Font size in px (20 / 17 / 15). */
  fontSize?: number;
  radius?: number;
  className?: string;
  style?: CSSProperties;
}

export function Avatar({
  initials,
  tint,
  size = 52,
  fontSize = 17,
  radius = 15,
  className,
  style,
}: AvatarProps) {
  const dark = useIsDark();
  return (
    <div
      className={["bk-avatar", className].filter(Boolean).join(" ")}
      aria-hidden="true"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${radius}px`,
        background: placeholderBackground(tint, "158deg", dark),
        fontSize: `${fontSize}px`,
        color: hexToRgba(tint, dark ? 0.95 : 0.78),
        ...style,
      }}
    >
      {initials}
    </div>
  );
}

export interface IconTileProps {
  icon: string;
  tint: string;
  size?: number;
  iconSize?: number;
  radius?: number;
  className?: string;
  style?: CSSProperties;
}

/** A tinted square with a glyph instead of initials (rewards, service rows). */
export function IconTile({
  icon,
  tint,
  size = 44,
  iconSize = 20,
  radius = 12,
  className,
  style,
}: IconTileProps) {
  const dark = useIsDark();
  return (
    <div
      className={["bk-avatar", className].filter(Boolean).join(" ")}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${radius}px`,
        background: placeholderBackground(tint, "158deg", dark),
        ...style,
      }}
    >
      <Icon name={icon} size={iconSize} color={placeholderInk(tint, dark)} />
    </div>
  );
}
