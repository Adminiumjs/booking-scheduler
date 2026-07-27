/* Staff tile (spec §4.5) — the "Meet the team" grid on the home screen. */

import type { StaffMember } from "../data/types.ts";
import { Avatar } from "./PlaceholderTile.tsx";

export interface StaffTileProps {
  staff: StaffMember;
  /** Clicking the tile filters Services by this person's category. */
  onClick: (staff: StaffMember) => void;
  className?: string;
}

export function StaffTile({ staff, onClick, className }: StaffTileProps) {
  return (
    <button
      type="button"
      className={["sm-card", "sm-staff-tile", className].filter(Boolean).join(" ")}
      onClick={() => onClick(staff)}
    >
      <Avatar initials={staff.initials} tint={staff.tint} size={60} fontSize={20} />
      <div className="sm-staff-tile__name">{staff.name}</div>
      <div className="sm-staff-tile__role">{staff.role}</div>
      <p className="sm-staff-tile__bio">{staff.bio}</p>
    </button>
  );
}
