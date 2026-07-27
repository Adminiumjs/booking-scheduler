/* Review card (spec §4.6) — "Loved by regulars" on the home screen. */

import type { Review } from "../data/types.ts";
import { Avatar } from "./PlaceholderTile.tsx";
import { StarBar } from "./StarBar.tsx";

export interface ReviewCardProps {
  review: Review;
  className?: string;
}

export function ReviewCard({ review: r, className }: ReviewCardProps) {
  return (
    <article
      className={["bk-card", "bk-review", className].filter(Boolean).join(" ")}
    >
      <header className="bk-review__head">
        <Avatar initials={r.initials} tint={r.tint} size={44} fontSize={15} />
        <div className="bk-review__who">
          <div className="bk-review__name">{r.name}</div>
          <div className="bk-review__date">{r.date}</div>
        </div>
        <StarBar value={r.rating} size={13} gap={1} />
      </header>
      <p className="bk-review__quote">{`“${r.quote}”`}</p>
      <div>
        <span className="bk-badge">{r.svc}</span>
      </div>
    </article>
  );
}
