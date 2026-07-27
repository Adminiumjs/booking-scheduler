/*
 * The one button primitive. Every CTA, ghost action and back link in the app
 * is one of these — the comp's `.sm-btn` / `.sm-gi` behaviour classes are
 * applied automatically per variant.
 */

import type { CSSProperties, ReactNode } from "react";

import { Icon } from "./Icon.tsx";

export type ButtonVariant = "primary" | "ghost" | "soft" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  children?: ReactNode;
  /** Lucide name rendered before the label. */
  icon?: string;
  /** Lucide name rendered after the label (usually `arrow-right`). */
  iconEnd?: string;
  iconSize?: number;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the container width. */
  full?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  /** Required when the button has no text (icon-only) — ruling R10. */
  ariaLabel?: string;
  title?: string;
  className?: string;
  style?: CSSProperties;
}

const SIZES: Record<ButtonSize, CSSProperties> = {
  sm: { padding: "8px 13px", borderRadius: "10px", fontSize: "13px" },
  md: { padding: "10px 16px", borderRadius: "11px", fontSize: "13.5px" },
  lg: { padding: "13px 20px", borderRadius: "13px", fontSize: "14.5px" },
};

export function Button({
  children,
  icon,
  iconEnd,
  iconSize = 16,
  variant = "primary",
  size = "md",
  full = false,
  disabled = false,
  onClick,
  type = "button",
  ariaLabel,
  title,
  className,
  style,
}: ButtonProps) {
  const behaviour = variant === "ghost" || variant === "link" ? "sm-gi" : "sm-btn";
  return (
    <button
      type={type}
      className={[behaviour, "sm-button", `sm-button--${variant}`, className]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      style={{
        ...(variant === "link" ? null : SIZES[size]),
        width: full ? "100%" : undefined,
        ...style,
      }}
    >
      {icon ? <Icon name={icon} size={iconSize} /> : null}
      {children}
      {iconEnd ? <Icon name={iconEnd} size={iconSize} /> : null}
    </button>
  );
}

export interface IconButtonProps {
  icon: string;
  /** Required — icon-only controls must have an accessible name (R10). */
  label: string;
  onClick?: () => void;
  size?: number;
  iconSize?: number;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Square, outlined, icon-only control (theme toggle, hamburger, sheet close). */
export function IconButton({
  icon,
  label,
  onClick,
  size = 40,
  iconSize = 18,
  disabled = false,
  className,
  style,
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={["sm-gi", "sm-icon-btn", className].filter(Boolean).join(" ")}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={{ width: `${size}px`, height: `${size}px`, ...style }}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
}

export interface BackLinkProps {
  children: ReactNode;
  onClick: () => void;
  /** Defaults to `arrow-left`. */
  icon?: string;
  className?: string;
}

/** The "← Back to services" link that sits above a screen heading. */
export function BackLink({
  children,
  onClick,
  icon = "arrow-left",
  className,
}: BackLinkProps) {
  return (
    <button
      type="button"
      className={["sm-nav", "sm-backlink", className].filter(Boolean).join(" ")}
      onClick={onClick}
    >
      <Icon name={icon} size={15} />
      {children}
    </button>
  );
}
