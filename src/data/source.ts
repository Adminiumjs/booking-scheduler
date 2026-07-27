/*
 * The DataSource seam.
 *
 * Every screen and every component reads data through this interface, never
 * from `demo.ts`. Swapping the demo implementation for a real API later is a
 * one-file change: implement `DataSource` and hand the new instance to
 * `setDataSource()` before the app mounts.
 */

import type {
  Appointment,
  Booking,
  Category,
  CategoryFilter,
  CategorySlug,
  GiftCard,
  GiftTheme,
  IntakeOption,
  LoyaltyLedgerRow,
  LoyaltyReward,
  MembershipPlan,
  ReferralData,
  Review,
  ReviewSummary,
  Service,
  StaffMember,
  StudioHoursRow,
  StudioLocation,
  WaitlistEntry,
} from "./types.ts";

import {
  buildSeedAppointments,
  buildSeedBookings,
  buildSeedWaitlist,
  buildWeek,
  CATEGORIES,
  GIFT_AMOUNTS,
  GIFT_THEMES,
  INTAKE_CONCERNS,
  INTAKE_PRESSURES,
  LOYALTY_HISTORY,
  LOYALTY_HOW_IT_WORKS,
  LOYALTY_START_POINTS,
  LOYALTY_THRESHOLD,
  PLANS,
  POPULAR_SERVICE_IDS,
  REFERRAL,
  REVIEW_COUNT_LABEL,
  REVIEWS,
  REWARDS,
  SEEDED_GIFT_CARDS,
  seedDateISO,
  SERVICES,
  STAFF,
  STUDIO_HOURS,
  STUDIO_LOCATION,
} from "./demo.ts";
import { FIRST_CODE_NUMBER } from "../lib/codes.ts";

/** Counts for the services-screen chip row, keyed by filter value. */
export type CategoryCounts = Record<CategoryFilter, number>;

export interface DataSource {
  /* catalogue */
  getCategories(): readonly Category[];
  getCategory(slug: string): Category | undefined;
  getServices(): readonly Service[];
  getService(id: string | null | undefined): Service | undefined;
  getServicesByCategory(filter: CategoryFilter): Service[];
  getCategoryCounts(): CategoryCounts;
  getPopularServices(): Service[];

  /* people */
  getStaff(): readonly StaffMember[];
  getStaffMember(id: string | null | undefined): StaffMember | undefined;
  /** Staff who perform a service, in the service's declared order. */
  getStaffForService(serviceId: string): StaffMember[];
  /** `'Selma / Noor'` — the meta line on a full service card. */
  getStaffNames(serviceId: string): string;

  /* social proof */
  getReviews(): readonly Review[];
  getReviewSummary(): ReviewSummary;
  getReferral(): ReferralData;

  /* loyalty */
  getRewards(): readonly LoyaltyReward[];
  getPlans(): readonly MembershipPlan[];
  /** Newest first, each row carrying the balance *after* it was applied. */
  getLoyaltyLedger(): LoyaltyLedgerRow[];
  getLoyaltyStartPoints(): number;
  getLoyaltyThreshold(): number;
  getLoyaltyHowItWorks(): readonly string[];

  /* intake */
  getIntakeConcerns(): readonly string[];
  getIntakePressures(): readonly IntakeOption[];

  /* gift cards */
  getGiftThemes(): readonly GiftTheme[];
  getGiftTheme(id: string): GiftTheme | undefined;
  getGiftAmounts(): readonly number[];

  /* studio */
  getStudioHours(): readonly StudioHoursRow[];
  /** Index into `getStudioHours()` for today (Monday-first). */
  getTodayHoursIndex(): number;
  getLocation(): StudioLocation;

  /* seeded session state */
  getWeek(): Date[];
  getSeedDateISO(): string;
  getSeedAppointments(): Appointment[];
  getSeedBookings(): Booking[];
  getSeedWaitlist(): WaitlistEntry[];
  getSeedGiftCards(): GiftCard[];
  /** First code the in-session counter hands out (1043). */
  getFirstCodeNumber(): number;
}

/* ------------------------------------------------------------------ *
 * Demo implementation
 * ------------------------------------------------------------------ */

class DemoDataSource implements DataSource {
  private readonly week: Date[];

  constructor(today?: Date) {
    this.week = buildWeek(today);
  }

  getCategories(): readonly Category[] {
    return CATEGORIES;
  }

  getCategory(slug: string): Category | undefined {
    return CATEGORIES.find((c) => c.slug === slug);
  }

  getServices(): readonly Service[] {
    return SERVICES;
  }

  getService(id: string | null | undefined): Service | undefined {
    if (!id) return undefined;
    return SERVICES.find((s) => s.id === id);
  }

  getServicesByCategory(filter: CategoryFilter): Service[] {
    return filter === "all"
      ? SERVICES.slice()
      : SERVICES.filter((s) => s.cat === filter);
  }

  getCategoryCounts(): CategoryCounts {
    const counts = { all: SERVICES.length } as CategoryCounts;
    for (const c of CATEGORIES) {
      counts[c.slug] = SERVICES.filter((s) => s.cat === c.slug).length;
    }
    return counts;
  }

  getPopularServices(): Service[] {
    return POPULAR_SERVICE_IDS.map((id) => this.getService(id)).filter(
      (s): s is Service => Boolean(s),
    );
  }

  getStaff(): readonly StaffMember[] {
    return STAFF;
  }

  getStaffMember(id: string | null | undefined): StaffMember | undefined {
    if (!id || id === "first") return undefined;
    return STAFF.find((s) => s.id === id);
  }

  getStaffForService(serviceId: string): StaffMember[] {
    const svc = this.getService(serviceId);
    if (!svc) return [];
    return svc.staff
      .map((id) => this.getStaffMember(id))
      .filter((s): s is StaffMember => Boolean(s));
  }

  getStaffNames(serviceId: string): string {
    return this.getStaffForService(serviceId)
      .map((s) => s.name)
      .join(" / ");
  }

  getReviews(): readonly Review[] {
    return REVIEWS;
  }

  /** R6 — computed from the seeded ratings rather than hardcoded "4.9". */
  getReviewSummary(): ReviewSummary {
    const total = REVIEWS.reduce((sum, r) => sum + r.rating, 0);
    const average = REVIEWS.length ? total / REVIEWS.length : 0;
    return {
      average,
      averageLabel: average.toFixed(1),
      count: REVIEWS.length,
      countLabel: REVIEW_COUNT_LABEL,
    };
  }

  getReferral(): ReferralData {
    return REFERRAL;
  }

  getRewards(): readonly LoyaltyReward[] {
    return REWARDS;
  }

  getPlans(): readonly MembershipPlan[] {
    return PLANS;
  }

  getLoyaltyLedger(): LoyaltyLedgerRow[] {
    const oldestFirst = LOYALTY_HISTORY.slice().reverse();
    let balance = 0;
    const rows = oldestFirst.map((row) => {
      balance += row.delta;
      return { ...row, balance };
    });
    return rows.reverse();
  }

  getLoyaltyStartPoints(): number {
    return LOYALTY_START_POINTS;
  }

  getLoyaltyThreshold(): number {
    return LOYALTY_THRESHOLD;
  }

  getLoyaltyHowItWorks(): readonly string[] {
    return LOYALTY_HOW_IT_WORKS;
  }

  getIntakeConcerns(): readonly string[] {
    return INTAKE_CONCERNS;
  }

  getIntakePressures(): readonly IntakeOption[] {
    return INTAKE_PRESSURES;
  }

  getGiftThemes(): readonly GiftTheme[] {
    return GIFT_THEMES;
  }

  getGiftTheme(id: string): GiftTheme | undefined {
    return GIFT_THEMES.find((t) => t.id === id);
  }

  getGiftAmounts(): readonly number[] {
    return GIFT_AMOUNTS;
  }

  getStudioHours(): readonly StudioHoursRow[] {
    return STUDIO_HOURS;
  }

  getTodayHoursIndex(): number {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  }

  getLocation(): StudioLocation {
    return STUDIO_LOCATION;
  }

  getWeek(): Date[] {
    return this.week.map((d) => new Date(d));
  }

  getSeedDateISO(): string {
    return seedDateISO(this.week);
  }

  getSeedAppointments(): Appointment[] {
    return buildSeedAppointments(this.week);
  }

  getSeedBookings(): Booking[] {
    return buildSeedBookings(this.week);
  }

  getSeedWaitlist(): WaitlistEntry[] {
    return buildSeedWaitlist(this.week);
  }

  getSeedGiftCards(): GiftCard[] {
    return SEEDED_GIFT_CARDS.map((g) => ({ ...g }));
  }

  getFirstCodeNumber(): number {
    return FIRST_CODE_NUMBER;
  }
}

/** Factory — handy for tests that need a fixed "today". */
export function createDemoDataSource(today?: Date): DataSource {
  return new DemoDataSource(today);
}

let current: DataSource = createDemoDataSource();

/** The active data source. Screens should call this, not import `demo.ts`. */
export function getDataSource(): DataSource {
  return current;
}

/** Swap the implementation (tests, or a future real backend). */
export function setDataSource(next: DataSource): void {
  current = next;
}

/**
 * Convenience alias for the common read-only case:
 * `import { data } from '../data/source.ts'; data.getServices()`.
 *
 * It proxies `getDataSource()` lazily, so `setDataSource()` still wins.
 */
export const data: DataSource = new Proxy({} as DataSource, {
  get(_target, prop: string) {
    const src = getDataSource() as unknown as Record<string, unknown>;
    const value = src[prop];
    return typeof value === "function" ? value.bind(src) : value;
  },
});

/** Re-exported for screens that render a category chip row. */
export type { CategoryFilter, CategorySlug };
