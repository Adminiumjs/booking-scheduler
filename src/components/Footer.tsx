/*
 * Footer (spec §4.2). Links to every routable view — ruling R1 ships all 16,
 * so nothing here is a dead route.
 */

import { data } from "../data/source.ts";
import type { View } from "../data/types.ts";
import { useStore } from "../state/store.ts";
import { Icon } from "./Icon.tsx";

interface FooterLink {
  label: string;
  view?: View;
  /** Starts the booking flow instead of navigating. */
  book?: boolean;
}

const STUDIO_LINKS: FooterLink[] = [
  { label: "Services", view: "services" },
  { label: "Book an appointment", book: true },
  { label: "Group bookings", view: "group" },
  { label: "Membership & rewards", view: "loyalty" },
  { label: "Gift cards", view: "giftcards" },
  { label: "Cancellation policy", view: "policy" },
];

const ACCOUNT_LINKS: FooterLink[] = [
  { label: "My upcoming visits", view: "visits" },
  { label: "Manage booking", view: "manage" },
  { label: "Waitlist status", view: "waitliststatus" },
  { label: "Purchased gift cards", view: "mygifts" },
  { label: "Loyalty history", view: "lhistory" },
  { label: "Digital intake form", view: "intake" },
  { label: "Refer a friend", view: "refer" },
];

export function Footer() {
  const go = useStore((s) => s.go);
  const startBooking = useStore((s) => s.startBooking);
  const loc = data.getLocation();

  const renderColumn = (heading: string, links: FooterLink[]) => (
    <nav className="sm-footer__col" aria-label={heading}>
      <div className="sm-footer__head">{heading}</div>
      {links.map((l) => (
        <button
          key={l.label}
          type="button"
          className="sm-nav sm-footer__link"
          onClick={() => (l.book ? startBooking(null) : go(l.view as View))}
        >
          {l.label}
        </button>
      ))}
    </nav>
  );

  return (
    <footer className="sm-footer">
      <div className="sm-footer__inner">
        <div className="sm-footer__brand">
          <div className="sm-footer__brandrow">
            <span className="sm-logo sm-logo--sm" aria-hidden="true">
              {loc.shortName.charAt(0)}
            </span>
            <span className="sm-footer__name">{loc.name}</span>
          </div>
          <p className="sm-footer__blurb">
            Hair, spa, nails &amp; movement in one calm downtown space. Book
            online, day or night.
          </p>
        </div>
        <div className="sm-footer__cols">
          {renderColumn("Studio", STUDIO_LINKS)}
          {renderColumn("Your account", ACCOUNT_LINKS)}
        </div>
      </div>
      <div className="sm-footer__bar">
        <span>© 2026 {loc.name}. A demo booking site shipped with Adminium.</span>
        <span className="sm-mono sm-footer__url">
          <Icon name="globe" size={13} />
          {loc.url}
        </span>
      </div>
    </footer>
  );
}
