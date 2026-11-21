/** The small pieces several desk screens draw alike: a state chip, a person's initials, the words for a state. */
import type { CSSProperties } from "react";

import { initials, type Kind } from "../facts.ts";
import type { DeskKey, DeskT } from "../i18n/index.ts";
import { Chip, type Tone } from "../ui.tsx";
import { text, type Row } from "../wire.ts";

const KIND_TONE: Record<Kind, Tone> = {
  offered: "accent",
  paying: "warn",
  booked: "accent",
  soon: "accent",
  late: "warn",
  arrived: "info",
  done: "pos",
  no_show: "danger",
  cancelled: "neutral",
  lapsed: "neutral",
};

const KIND_WORD: Record<Kind, DeskKey> = {
  offered: "state.offered",
  paying: "state.paying",
  booked: "state.booked",
  soon: "state.booked",
  late: "state.late",
  arrived: "state.arrived",
  done: "state.done",
  no_show: "state.noShow",
  cancelled: "state.cancelled",
  lapsed: "state.letGo",
};

export const kindTone = (kind: Kind): Tone => KIND_TONE[kind];
export const kindWord = (t: DeskT, kind: Kind): string => t(KIND_WORD[kind]);

export function StateChip({ kind, t }: { kind: Kind; t: DeskT }) {
  return <Chip tone={KIND_TONE[kind]}>{t(KIND_WORD[kind])}</Chip>;
}

/** A person's round initials, in their own colour: the tint is a row's, so it is the one inline style here. */
export function Avatar({ person, size = 30 }: { person: Row | undefined; size?: number }) {
  const tint = text(person?.["tint"]) ?? "#6f8bb0";
  const style = { "--lm-tint": tint, width: size, height: size, fontSize: Math.round(size * 0.37) } as CSSProperties;
  return (
    <span className="lm-avatar" style={style} aria-hidden="true">
      {initials(person?.["name"])}
    </span>
  );
}
