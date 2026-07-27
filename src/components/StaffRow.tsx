/*
 * Staff row (spec §4.12) — booking step 1.
 *
 * The same row renders the "First available" option: pass no `staff`, an
 * `icon` of `'zap'`, and the title/note copy.
 */

import type { StaffMember } from "../data/types.ts";
import { Icon } from "./Icon.tsx";
import { Avatar } from "./PlaceholderTile.tsx";
import { Radio } from "./Radio.tsx";

export interface StaffRowProps {
  /** Omit for the "First available" row. */
  staff?: StaffMember;
  /** Defaults to `staff.name`. */
  title?: string;
  /** Accent sub-line; defaults to `staff.role`. */
  role?: string;
  /** Muted note; defaults to `staff.bio`. */
  note?: string;
  /** Leading glyph in an accent-soft tile instead of an avatar. */
  icon?: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  className?: string;
}

export function StaffRow({
  staff,
  title,
  role,
  note,
  icon,
  selected,
  disabled = false,
  onSelect,
  className,
}: StaffRowProps) {
  const name = title ?? staff?.name ?? "";
  const roleText = role ?? staff?.role;
  const noteText = note ?? staff?.bio;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={["sm-staff-row", className].filter(Boolean).join(" ")}
      data-selected={selected ? "true" : "false"}
    >
      {staff && !icon ? (
        <Avatar initials={staff.initials} tint={staff.tint} size={52} fontSize={17} />
      ) : (
        <span className="sm-staff-row__glyph">
          <Icon name={icon ?? "zap"} size={22} />
        </span>
      )}
      <span className="sm-staff-row__text">
        <span className="sm-staff-row__name">{name}</span>
        {roleText ? <span className="sm-staff-row__role">{roleText}</span> : null}
        {noteText ? <span className="sm-staff-row__note">{noteText}</span> : null}
      </span>
      <Radio selected={selected} />
    </button>
  );
}
