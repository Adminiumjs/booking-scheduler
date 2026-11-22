/**
 * The small pieces the comp repeats: an icon, stars, a service's tile, the
 * rows of a card, and the one confirm sheet.
 */
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  BellRing,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarOff,
  CalendarPlus,
  CalendarX,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  CloudOff,
  Coffee,
  ExternalLink,
  Flower2,
  Gift,
  Hand,
  Heart,
  Hourglass,
  Info,
  Link2Off,
  LoaderCircle,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Package,
  RotateCcw,
  Scissors,
  Sparkles,
  Star,
  Sun,
  Sunrise,
  Sunset,
  TimerOff,
  Trash2,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { useApp } from "./app.tsx";

const ICONS: Record<string, LucideIcon> = {
  activity: Activity,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "badge-check": BadgeCheck,
  bell: Bell,
  "bell-ring": BellRing,
  "calendar-check": CalendarCheck,
  "calendar-clock": CalendarClock,
  "calendar-days": CalendarDays,
  "calendar-off": CalendarOff,
  "calendar-plus": CalendarPlus,
  "calendar-x": CalendarX,
  check: Check,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "circle-alert": CircleAlert,
  "circle-check": CircleCheck,
  "circle-x": CircleX,
  clock: Clock,
  "cloud-off": CloudOff,
  coffee: Coffee,
  "external-link": ExternalLink,
  "flower-2": Flower2,
  gift: Gift,
  hand: Hand,
  heart: Heart,
  hourglass: Hourglass,
  info: Info,
  "link-2-off": Link2Off,
  "loader-circle": LoaderCircle,
  lock: Lock,
  "log-in": LogIn,
  "log-out": LogOut,
  "map-pin": MapPin,
  menu: Menu,
  moon: Moon,
  package: Package,
  "rotate-ccw": RotateCcw,
  scissors: Scissors,
  sparkles: Sparkles,
  star: Star,
  sun: Sun,
  sunrise: Sunrise,
  sunset: Sunset,
  "timer-off": TimerOff,
  "trash-2": Trash2,
  user: User,
  users: Users,
  x: X,
};

/** Arrows and the like point the other way in a right-to-left page. */
const MIRRORED = new Set(["arrow-left", "arrow-right", "chevron-left", "chevron-right", "log-out", "log-in", "external-link"]);

export function Icon({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  const Glyph = ICONS[name] ?? Sparkles;
  const classes = [MIRRORED.has(name) ? "lm-flip" : "", className ?? ""].filter((c) => c !== "").join(" ");
  return <Glyph size={size} strokeWidth={2} aria-hidden="true" style={{ flexShrink: 0 }} {...(classes === "" ? {} : { className: classes })} />;
}

/** Stars filled to a fraction of five, named for a screen reader. */
export function Stars({ value, label }: { value: number; label: string }) {
  return (
    <span role="img" aria-label={label} className="lm-stars">
      <span aria-hidden="true">★★★★★</span>
      <span aria-hidden="true" className="lm-stars-on" style={{ width: `${String((value / 5) * 100)}%` }}>
        ★★★★★
      </span>
    </span>
  );
}

export function Tile({ icon, tint, size = 64, iconSize = 26 }: { icon: string; tint?: string; size?: number; iconSize?: number }) {
  return (
    <span aria-hidden="true" className="lm-tile" style={{ width: size, height: size, ...(tint === undefined ? {} : ({ "--tint": tint } as Record<string, string>)) }}>
      <Icon name={icon} size={iconSize} />
    </span>
  );
}

export function Rows({ rows, className = "lm-dl" }: { rows: { label: string; value: ReactNode; mono?: 5 | 6 }[]; className?: string }) {
  return (
    <dl className={className}>
      {rows.map((r) => (
        <div key={r.label}>
          <dt>{r.label}</dt>
          <dd {...(r.mono === undefined ? {} : { className: r.mono === 6 ? "lm-mono6" : "lm-mono" })}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Err({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <div {...(id === undefined ? {} : { id })} className="lm-err">
      <Icon name="circle-alert" size={14} />
      {children}
    </div>
  );
}

/** Tab stays inside, Escape closes, the page behind is out of reach, and focus goes back to what opened it (BN-23). */
export function useTrap(onClose: () => void) {
  const box = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = box.current;
    const page = document.querySelector<HTMLElement>(".lm-shell");
    page?.setAttribute("inert", "");
    root?.querySelector<HTMLElement>("button, a[href], input")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || root === null) return;
      const items = [...root.querySelectorAll<HTMLElement>("button:not(:disabled), a[href], input:not(:disabled)")];
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      page?.removeAttribute("inert");
      opener?.focus?.();
    };
  }, [onClose]);
  return box;
}

export function ConfirmSheet() {
  const { sheet, closeSheet } = useApp();
  if (sheet === null) return null;
  return <SheetBody key={sheet.title} onClose={closeSheet} />;
}

function SheetBody({ onClose }: { onClose: () => void }) {
  const { sheet } = useApp();
  const box = useTrap(onClose);
  if (sheet === null) return null;
  return (
    <div className="lm-sheet-scrim" onClick={onClose}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby="lm-sheet-title" className="lm-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="lm-sheet-body">
          <div className="lm-sheet-mark">
            <Icon name={sheet.icon} size={22} />
          </div>
          <h2 id="lm-sheet-title">{sheet.title}</h2>
          {sheet.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="lm-sheet-actions">
          <button type="button" className="lm-btn" onClick={onClose}>
            {sheet.keep}
          </button>
          <button
            type="button"
            className="lm-btn danger"
            onClick={() => {
              onClose();
              void sheet.onGo();
            }}
          >
            {sheet.go}
          </button>
        </div>
      </div>
    </div>
  );
}

/** A centred message with one way on: the expired link, a lost page, a page that needs something else. */
export function Blank({ icon, title, sub, children }: { icon: string; title: string; sub?: string; children?: ReactNode }) {
  return (
    <main id="lm-main" className="lm-narrow-page" style={{ maxWidth: 520, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, paddingBlock: "clamp(48px,8cqi,96px)" }}>
      <div className="lm-badge mute" style={{ width: 72, height: 72, borderRadius: 22 }}>
        <Icon name={icon} size={32} />
      </div>
      <h1 style={{ fontSize: "clamp(24px,4cqi,30px)", fontWeight: 800, letterSpacing: "-.03em", textWrap: "balance" }}>{title}</h1>
      {sub === undefined ? null : <p style={{ fontSize: 14.5, color: "var(--fg-muted)", lineHeight: 1.55 }}>{sub}</p>}
      {children}
    </main>
  );
}
