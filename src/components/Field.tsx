/*
 * Form primitives (spec §4.14): label + control + inline error, in one place
 * so every screen's fields line up and share the `.bk-fld` focus ring.
 */

import { useId } from "react";
import type { CSSProperties, ReactNode } from "react";

import { Icon } from "./Icon.tsx";

export interface FieldProps {
  label: ReactNode;
  /** Rendered muted after the label, e.g. `'(optional)'`. */
  hint?: ReactNode;
  /** Rendered at the end of the label row, e.g. a mono `0 / 280` counter. */
  aside?: ReactNode;
  /** Inline error message; shows the red text + `alert-circle`. */
  error?: string;
  /** Heavier label (the gift-card design step uses 700/10px spacing). */
  strong?: boolean;
  /**
   * Render-prop so the control can wire the generated id + `aria-invalid`.
   * Pass a plain node instead when the control provides its own labelling.
   */
  children: ReactNode | ((props: ControlProps) => ReactNode);
  className?: string;
  style?: CSSProperties;
}

export interface ControlProps {
  id: string;
  "aria-invalid": boolean | undefined;
  "aria-describedby": string | undefined;
}

export function Field({
  label,
  hint,
  aside,
  error,
  strong = false,
  children,
  className,
  style,
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-err`;
  const control: ControlProps = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
  };
  return (
    <div className={["bk-field", className].filter(Boolean).join(" ")} style={style}>
      <div className="bk-field__labelrow">
        <label
          htmlFor={id}
          className={strong ? "bk-label bk-label--strong" : "bk-label"}
        >
          {label}
          {hint ? <span className="bk-label__hint">{hint}</span> : null}
        </label>
        {aside ? <span className="bk-field__aside">{aside}</span> : null}
      </div>
      {typeof children === "function" ? children(control) : children}
      {error ? (
        <div className="bk-field__error" id={errorId}>
          <Icon name="alert-circle" size={13} />
          {error}
        </div>
      ) : null}
    </div>
  );
}

export interface TextInputProps extends Partial<ControlProps> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Render in JetBrains Mono (codes, card numbers, amounts). */
  mono?: boolean;
  type?: "text" | "email" | "tel" | "date";
  maxLength?: number;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal";
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

/** The standard `.bk-fld` input. */
export function TextInput({
  value,
  onChange,
  placeholder,
  mono = false,
  type = "text",
  maxLength,
  inputMode,
  disabled,
  className,
  style,
  ariaLabel,
  ...control
}: TextInputProps) {
  return (
    <input
      {...control}
      className={["bk-fld", "bk-input", mono ? "bk-mono" : "", className]
        .filter(Boolean)
        .join(" ")}
      type={type}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      inputMode={inputMode}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      style={style}
    />
  );
}

export interface TextAreaProps extends Partial<ControlProps> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
  className,
  style,
  ariaLabel,
  ...control
}: TextAreaProps) {
  return (
    <textarea
      {...control}
      className={["bk-fld", "bk-input", "bk-textarea", className]
        .filter(Boolean)
        .join(" ")}
      value={value}
      rows={rows}
      maxLength={maxLength}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      style={style}
    />
  );
}

export interface SelectProps extends Partial<ControlProps> {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

export function Select({
  value,
  onChange,
  options,
  disabled,
  className,
  style,
  ariaLabel,
  ...control
}: SelectProps) {
  return (
    <select
      {...control}
      className={["bk-fld", "bk-input", "bk-select", className]
        .filter(Boolean)
        .join(" ")}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      style={style}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
