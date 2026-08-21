/*
 * Service card (spec §4.4). Two variants:
 *   preview — home "Popular services": duration / price meta, full-width Book
 *   full    — services grid: duration + specialists, divider, price + Book
 */

import { data } from "../data/source.ts";
import type { Service } from "../data/types.ts";
import { useT } from "../i18n/index.tsx";
import { durationLabel, money } from "../lib/format.ts";
import { Button } from "./Button.tsx";
import { Icon } from "./Icon.tsx";
import { PlaceholderTile } from "./PlaceholderTile.tsx";

export interface ServiceCardProps {
  service: Service;
  /** Called by the Book button; wire it to `startBooking(service.id)`. */
  onBook: (serviceId: string) => void;
  variant?: "preview" | "full";
  className?: string;
}

export function ServiceCard({
  service: s,
  onBook,
  variant = "preview",
  className,
}: ServiceCardProps) {
  const t = useT();
  const cat = data.getCategory(s.cat);
  const staffNames = data.getStaffNames(s.id);

  return (
    <div className={["bk-card", "bk-svc-card", className].filter(Boolean).join(" ")}>
      <PlaceholderTile
        tint={s.tint}
        icon={s.icon}
        iconSize={44}
        minHeight={132}
        filename={s.fname}
      />
      <div className="bk-svc-card__body">
        <div className="bk-svc-card__titlerow">
          <h3 className="bk-svc-card__name">{s.name}</h3>
          <span className="bk-badge">{cat ? t(cat.nameKey) : s.cat}</span>
        </div>
        <p className="bk-svc-card__blurb">{s.blurb}</p>

        {variant === "preview" ? (
          <>
            <div className="bk-svc-card__meta">
              <span className="bk-meta">
                <Icon name="clock" size={13} />
                <span className="bk-mono">{durationLabel(s.dur)}</span>
              </span>
              <span className="bk-mono bk-svc-card__price">{money(s.price)}</span>
            </div>
            <Button icon="calendar-plus" full onClick={() => onBook(s.id)}>
              {t("chrome.serviceCard.book")}
            </Button>
          </>
        ) : (
          <>
            <div className="bk-svc-card__meta">
              <span className="bk-meta">
                <Icon name="clock" size={13} />
                <span className="bk-mono">{durationLabel(s.dur)}</span>
              </span>
              <span className="bk-meta">
                <Icon name="user" size={13} />
                <span className="bk-mono">{staffNames}</span>
              </span>
            </div>
            <div className="bk-svc-card__foot">
              <span className="bk-mono bk-svc-card__price bk-svc-card__price--lg">
                {money(s.price)}
              </span>
              <Button onClick={() => onBook(s.id)}>{t("chrome.serviceCard.book")}</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
