/*
 * The Lucide icon set the comp uses (spec §6.15), addressed by the same
 * kebab-case names the data files carry. Tree-shaken named imports — no UMD
 * script, no dynamic import.
 *
 * Icons are decorative by default (`aria-hidden`); pass `title` only when the
 * icon is the *only* content of a control, and prefer an `aria-label` on the
 * button itself.
 */

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  BellOff,
  BellPlus,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarOff,
  CalendarPlus,
  CalendarX,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Droplet,
  Flower2,
  Footprints,
  Gem,
  Gift,
  Globe,
  Hand,
  HeartHandshake,
  Home,
  Info,
  Leaf,
  Lightbulb,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Minus,
  Moon,
  Paintbrush,
  Palette,
  PersonStanding,
  Phone,
  Plus,
  Repeat,
  Scissors,
  Search,
  Send,
  Settings2,
  Share2,
  ShieldCheck,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  TicketPercent,
  TrainFront,
  Trash2,
  User,
  Users,
  Wallet,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import type { CSSProperties } from "react";

export const ICONS = {
  activity: Activity,
  "alert-circle": AlertCircle,
  "alert-triangle": AlertTriangle,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  bell: Bell,
  "bell-off": BellOff,
  "bell-plus": BellPlus,
  calendar: Calendar,
  "calendar-check": CalendarCheck,
  "calendar-clock": CalendarClock,
  "calendar-off": CalendarOff,
  "calendar-plus": CalendarPlus,
  "calendar-x": CalendarX,
  check: Check,
  "check-circle-2": CheckCircle2,
  "clipboard-check": ClipboardCheck,
  clock: Clock,
  droplet: Droplet,
  "flower-2": Flower2,
  footprints: Footprints,
  gem: Gem,
  gift: Gift,
  globe: Globe,
  hand: Hand,
  "heart-handshake": HeartHandshake,
  home: Home,
  info: Info,
  leaf: Leaf,
  lightbulb: Lightbulb,
  mail: Mail,
  "map-pin": MapPin,
  menu: Menu,
  "message-square": MessageSquare,
  minus: Minus,
  moon: Moon,
  paintbrush: Paintbrush,
  palette: Palette,
  "person-standing": PersonStanding,
  phone: Phone,
  plus: Plus,
  repeat: Repeat,
  scissors: Scissors,
  search: Search,
  send: Send,
  "settings-2": Settings2,
  "share-2": Share2,
  "shield-check": ShieldCheck,
  sparkles: Sparkles,
  sun: Sun,
  sunrise: Sunrise,
  sunset: Sunset,
  "ticket-percent": TicketPercent,
  "train-front": TrainFront,
  "trash-2": Trash2,
  user: User,
  users: Users,
  wallet: Wallet,
  x: X,
  "x-circle": XCircle,
  zap: Zap,
} as const;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  /** Kebab-case Lucide name. Unknown names render nothing. */
  name: IconName | string;
  size?: number;
  /** Defaults to `currentColor`. */
  color?: string;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
  /** Accessible label; when omitted the icon is `aria-hidden`. */
  title?: string;
}

export function Icon({
  name,
  size = 16,
  color,
  strokeWidth = 2,
  className,
  style,
  title,
}: IconProps) {
  const Cmp = ICONS[name as IconName];
  if (!Cmp) return null;
  return (
    <Cmp
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      role={title ? "img" : undefined}
    />
  );
}
