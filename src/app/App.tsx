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
  Footer,
  Header,
  MobileSheet,
  ToastLayer,
} from "../components/index.ts";
import type { View } from "../data/types.ts";
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
    <div className="bk-app">
      <Header />
      <MobileSheet />
      <CurrentScreen />
      <Footer />
      <ToastLayer />
      <CancelModal />
    </div>
  );
}
