/*
 * The procedural placeholder system (spec §4.3) — every "image" in the app.
 * No bitmaps ship: a tinted three-layer gradient, a centred Lucide glyph, and
 * an optional mono filename chip in the corner.
 */

import type { CSSProperties, ReactNode } from "react";

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
  /** Fake filename shown in the bottom-start chip. */
  filename?: string;
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
  radius,
  borderBlockEnd = true,
  bordered = false,
  className,
  style,
  children,
}: PlaceholderTileProps) {
  const dark = useIsDark();
  return (
    <div
      className={["sm-ph", className].filter(Boolean).join(" ")}
      style={{
        minHeight: `${minHeight}px`,
        background: placeholderBackground(tint, angle, dark),
        borderBlockEnd: borderBlockEnd ? "1px solid var(--border)" : undefined,
        border: bordered ? "1px solid var(--border)" : undefined,
        borderRadius: typeof radius === "number" ? `${radius}px` : radius,
        ...style,
      }}
    >
      {icon ? (
        <Icon name={icon} size={iconSize} color={placeholderInk(tint, dark)} />
      ) : null}
      {children}
      {filename ? <span className="sm-ph-chip">{filename}</span> : null}
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
      className={["sm-avatar", className].filter(Boolean).join(" ")}
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
      className={["sm-avatar", className].filter(Boolean).join(" ")}
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
