/*
 * Surfaces: panels, header bands, banners, empty states, success tiles, code
 * pills and status pills (spec §4.15).
 */

import type { CSSProperties, ReactNode } from "react";

import { Icon } from "./Icon.tsx";

export interface CardProps {
  children: ReactNode;
  /** Border radius in px (16 / 18 / 20 in the comp). */
  radius?: number;
  /** Inner padding; omit when the card contains its own bands. */
  padding?: number | string;
  /** Drop `var(--shadow)` (e.g. inside another card). */
  flat?: boolean;
  /** `overflow: hidden` — needed when a placeholder tile is the first child. */
  clip?: boolean;
  className?: string;
  style?: CSSProperties;
  id?: string;
}

/** Generic panel: `--surface`, 1px border, radius, shadow. */
export function Card({
  children,
  radius = 18,
  padding,
  flat = false,
  clip = false,
  className,
  style,
  id,
}: CardProps) {
  return (
    <div
      id={id}
      className={["sm-panel", className].filter(Boolean).join(" ")}
      style={{
        borderRadius: `${radius}px`,
        padding: typeof padding === "number" ? `${padding}px` : padding,
        boxShadow: flat ? "none" : "var(--shadow)",
        overflow: clip ? "hidden" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export interface EyebrowProps {
  children: ReactNode;
  icon?: string;
  className?: string;
  style?: CSSProperties;
}

/** Uppercase 11.5px section label. */
export function Eyebrow({ children, icon, className, style }: EyebrowProps) {
  return (
    <div
      className={["sm-eyebrow", className].filter(Boolean).join(" ")}
      style={style}
    >
      {icon ? <Icon name={icon} size={14} /> : null}
      {children}
    </div>
  );
}

export interface PanelHeaderProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** `--surface-2` band with a bottom border, used at the top of a panel. */
export function PanelHeader({ children, className, style }: PanelHeaderProps) {
  return (
    <div
      className={["sm-panel-head", className].filter(Boolean).join(" ")}
      style={style}
    >
      {children}
    </div>
  );
}

export type BannerTone = "info" | "danger" | "warn" | "pos";

export interface BannerProps {
  children: ReactNode;
  tone?: BannerTone;
  /** Defaults to a sensible glyph per tone. */
  icon?: string;
  className?: string;
  style?: CSSProperties;
}

const BANNER_ICON: Record<BannerTone, string> = {
  info: "info",
  danger: "alert-circle",
  warn: "alert-triangle",
  pos: "check-circle-2",
};

/** Tinted notice block. `tone="danger"` is the form error banner (§4.14). */
export function Banner({ children, tone = "info", icon, className, style }: BannerProps) {
  return (
    <div
      className={["sm-banner", `sm-banner--${tone}`, className]
        .filter(Boolean)
        .join(" ")}
      role={tone === "danger" ? "alert" : undefined}
      style={style}
    >
      <Icon name={icon ?? BANNER_ICON[tone]} size={tone === "danger" ? 15 : 17} />
      <span>{children}</span>
    </div>
  );
}

export interface EmptyStateProps {
  icon: string;
  title: string;
  body?: ReactNode;
  /** Usually a `<Button>`. */
  action?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** Dashed placeholder block used by every "nothing here yet" screen. */
export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
  style,
}: EmptyStateProps) {
  return (
    <div
      className={["sm-empty", className].filter(Boolean).join(" ")}
      style={style}
    >
      <div className="sm-empty-tile">
        <Icon name={icon} size={25} />
      </div>
      <div className="sm-empty-title">{title}</div>
      {body ? <p className="sm-empty-body">{body}</p> : null}
      {action}
    </div>
  );
}

export interface SuccessTileProps {
  icon: string;
  size?: number;
  iconSize?: number;
  className?: string;
}

/** 78×78 `--pos-soft` square with a popped-in glyph. */
export function SuccessTile({
  icon,
  size = 78,
  iconSize = 38,
  className,
}: SuccessTileProps) {
  return (
    <div
      className={["sm-success-tile", className].filter(Boolean).join(" ")}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <Icon name={icon} size={iconSize} />
    </div>
  );
}

export interface CodePillProps {
  /** e.g. `'Booking code'`. */
  label: string;
  /** e.g. `'SLM-1043'`. */
  code: string;
  /** Mono code font size (20 or 22). */
  codeSize?: number;
  className?: string;
}

export function CodePill({ label, code, codeSize = 22, className }: CodePillProps) {
  return (
    <div className={["sm-code-pill", className].filter(Boolean).join(" ")}>
      <span className="sm-code-pill__label">{label}</span>
      <span className="sm-code-pill__code" style={{ fontSize: `${codeSize}px` }}>
        {code}
      </span>
    </div>
  );
}

export type StatusTone = "pos" | "muted" | "warn";

export interface StatusPillProps {
  children: ReactNode;
  tone?: StatusTone;
  icon?: string;
  className?: string;
}

export function StatusPill({
  children,
  tone = "pos",
  icon,
  className,
}: StatusPillProps) {
  return (
    <span
      className={["sm-status", `sm-status--${tone}`, className]
        .filter(Boolean)
        .join(" ")}
    >
      {icon ? <Icon name={icon} size={13} /> : null}
      {children}
    </span>
  );
}
