/* Service row (spec §4.7) — booking step 0. Selecting one advances the flow. */

import type { Service } from "../data/types.ts";
import { durationLabel, money } from "../lib/format.ts";
import { IconTile } from "./PlaceholderTile.tsx";
import { Radio } from "./Radio.tsx";

export interface ServiceRowProps {
  service: Service;
  selected: boolean;
  onSelect: (serviceId: string) => void;
  className?: string;
}

export function ServiceRow({
  service: s,
  selected,
  onSelect,
  className,
}: ServiceRowProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={["bk-svc-row", className].filter(Boolean).join(" ")}
      data-selected={selected ? "true" : "false"}
      onClick={() => onSelect(s.id)}
    >
      <IconTile icon={s.icon} tint={s.tint} size={44} iconSize={20} radius={12} />
      <span className="bk-svc-row__text">
        <span className="bk-svc-row__name">{s.name}</span>
        <span className="bk-svc-row__meta">
          <span className="bk-mono bk-svc-row__dur">{durationLabel(s.dur)}</span>
          <span className="bk-mono bk-svc-row__price">{money(s.price)}</span>
        </span>
      </span>
      <Radio selected={selected} />
    </button>
  );
}
