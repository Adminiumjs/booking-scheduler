/*
 * The app shell.
 *
 * Routing is a plain state-based switch over `store.view` (no react-router).
 * Ruling R1 ships every one of the 16 views, so no header, sheet, or footer
 * link can land on a route that does not exist; anything the union does not
 * cover falls through to the 404 screen.
 *
 * The chrome — Header, MobileSheet, Toast layer, CancelModal, Footer — is
 * mounted once, around the switch, so a view change never remounts it.
 */

import { useEffect } from "react";
import type { ComponentType } from "react";

import {
  CancelModal,
  DemoDock,
  Footer,
  Header,
  MobileSheet,
  StudioChrome,
  ToastLayer,
} from "../components/index.ts";
import type { View } from "../data/types.ts";
import { useI18n } from "../i18n/index.tsx";
import { setAmbient } from "../i18n/ambient.ts";
import { useStore } from "../state/store.ts";

import Booking from "../screens/Booking.tsx";
import Confirm from "../screens/Confirm.tsx";
import GiftCards from "../screens/GiftCards.tsx";
import Group from "../screens/Group.tsx";
import Home from "../screens/Home.tsx";
import Intake from "../screens/Intake.tsx";
import Loyalty from "../screens/Loyalty.tsx";
import LoyaltyHistory from "../screens/LoyaltyHistory.tsx";
import Manage from "../screens/Manage.tsx";
import MyGifts from "../screens/MyGifts.tsx";
import NotFound from "../screens/NotFound.tsx";
import Policy from "../screens/Policy.tsx";
import Refer from "../screens/Refer.tsx";
import Services from "../screens/Services.tsx";
import Visits from "../screens/Visits.tsx";
import WaitlistStatus from "../screens/WaitlistStatus.tsx";

/* --- added by the 2026-07-28 comp revision --- */
import Account from "../screens/Account.tsx";
import Blog from "../screens/Blog.tsx";
import Careers from "../screens/Careers.tsx";
import Checkout from "../screens/Checkout.tsx";
import Dash from "../screens/Dash.tsx";
import Event from "../screens/Event.tsx";
import ExportData from "../screens/ExportData.tsx";
import Help from "../screens/Help.tsx";
import Join from "../screens/Join.tsx";
import Location from "../screens/Location.tsx";
import NotifPrefs from "../screens/NotifPrefs.tsx";
import Offers from "../screens/Offers.tsx";
import Orders from "../screens/Orders.tsx";
import Packages from "../screens/Packages.tsx";
import Post from "../screens/Post.tsx";
import Reviews from "../screens/Reviews.tsx";
import Rewards from "../screens/Rewards.tsx";
import Shop from "../screens/Shop.tsx";
import SignIn from "../screens/SignIn.tsx";
import Staff from "../screens/Staff.tsx";
import Waitlist from "../screens/Waitlist.tsx";
import Mobile from "../screens/Mobile.tsx";
import AdminToday from "../screens/AdminToday.tsx";
import AdminCal from "../screens/AdminCal.tsx";
import AdminPos from "../screens/AdminPos.tsx";
import AdminClients from "../screens/AdminClients.tsx";
import AdminServices from "../screens/AdminServices.tsx";
import AdminTeam from "../screens/AdminTeam.tsx";
import AdminStock from "../screens/AdminStock.tsx";
import AdminMarketing from "../screens/AdminMarketing.tsx";
import AdminPayroll from "../screens/AdminPayroll.tsx";
import AdminReviews from "../screens/AdminReviews.tsx";
import AdminReports from "../screens/AdminReports.tsx";
import AdminSettings from "../screens/AdminSettings.tsx";

/**
 * Every routable view, mapped to its screen. Keyed by the `View` union so a
 * new view cannot be added to `types.ts` without the compiler asking for a
 * screen here — that is what keeps ruling R1 true over time.
 */
const SCREENS: Record<View, ComponentType> = {
  home: Home,
  services: Services,
  booking: Booking,
  confirm: Confirm,
  manage: Manage,
  loyalty: Loyalty,
  giftcards: GiftCards,
  group: Group,
  visits: Visits,
  waitliststatus: WaitlistStatus,
  mygifts: MyGifts,
  policy: Policy,
  refer: Refer,
  intake: Intake,
  lhistory: LoyaltyHistory,
  notfound: NotFound,

  /* --- the twenty-two guest screens the revised comp added --- */
  account: Account,
  blog: Blog,
  careers: Careers,
  checkout: Checkout,
  dash: Dash,
  event: Event,
  export: ExportData,
  help: Help,
  join: Join,
  location: Location,
  notifprefs: NotifPrefs,
  offers: Offers,
  orders: Orders,
  packages: Packages,
  post: Post,
  reviews: Reviews,
  rewards: Rewards,
  shop: Shop,
  signin: SignIn,
  staff: Staff,
  waitlist: Waitlist,
  mobile: Mobile,

  /* --- the studio half --- */
  "admin-today": AdminToday,
  "admin-cal": AdminCal,
  "admin-pos": AdminPos,
  "admin-clients": AdminClients,
  "admin-services": AdminServices,
  "admin-team": AdminTeam,
  "admin-stock": AdminStock,
  "admin-marketing": AdminMarketing,
  "admin-payroll": AdminPayroll,
  "admin-reviews": AdminReviews,
  "admin-reports": AdminReports,
  "admin-settings": AdminSettings,
};

function CurrentScreen() {
  const view = useStore((s) => s.view);
  /* Unknown values can only arrive from persisted/injected state — 404 them. */
  const Screen = SCREENS[view] ?? NotFound;
  return <Screen />;
}

export default function App() {
  const initTheme = useStore((s) => s.initTheme);
  const escape = useStore((s) => s.escape);

  /*
   * Publish the live locale to the module-level bridge before anything below
   * renders. `lib/format.ts` builds its `Intl` instances from it, and the
   * store, `data/screens/*` and `lib/slots.ts` all call those formatters from
   * outside React, where no hook can reach the provider. Assigning during
   * render rather than in an effect matters: children render after this line,
   * so the first paint after a locale switch is already in the new locale
   * instead of one frame behind.
   */
  const { locale, t, money, number } = useI18n();
  setAmbient(locale, t, money, number);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  /*
   * Document-level Escape. The modal and the mobile sheet trap Escape in the
   * capture phase and stop it there, so this bubble-phase listener only runs
   * when nothing is trapping — it is the safety net, not the primary handler.
   */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") escape();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [escape]);

  return (
    <>
      <DemoDock />
      <Shell />
      <ToastLayer />
      <CancelModal />
    </>
  );
}

/**
 * The chrome differs by persona, not by route.
 *
 * A guest gets the marketing header, the mobile sheet and the footer; the
 * studio half gets its own sidebar and topbar and none of those. Keeping the
 * split here means no screen has to know which shell it is inside.
 */
function Shell() {
  const persona = useStore((s) => s.persona);

  if (persona === "studio") {
    return (
      <StudioChrome>
        <CurrentScreen />
      </StudioChrome>
    );
  }

  return (
    <div className="bk-app">
      <Header />
      <MobileSheet />
      <CurrentScreen />
      <Footer />
    </div>
  );
}
