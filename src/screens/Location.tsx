/*
 * FIND US (view: 'location') — address, travel, opening hours.
 *
 * The address, phone, email and hours all come from the data seam, so this
 * screen and the home page's "visit us" block can never drift apart. Only the
 * how-you-get-here and before-you-arrive copy is page-local.
 *
 * Comp defect fixed: the open/closed pill hardcoded "open unless it is
 * Sunday" rather than reading the row for today, so any future closure in the
 * hours table would still have said "Open today". It now follows the data.
 */

import { Button, Icon, PlaceholderTile } from "../components/index.ts";
import { data } from "../data/source.ts";
import {
  ARRIVAL_NOTES,
  DOOR_NOTE_KEY,
  LOCATION_MAP_FILENAME,
  LOCATION_MAP_TINT,
  TRAVEL,
} from "../data/screens/location.ts";
import { useT } from "../i18n/index.tsx";
import { hoursLabel, weekdayName } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-location.css";

export default function Location() {
  const t = useT();
  const showToast = useStore((s) => s.showToast);

  const loc = data.getLocation();
  const hours = data.getStudioHours();
  const todayIdx = data.getTodayHoursIndex();
  const openToday = !hours[todayIdx]?.closed;

  const rows = [
    {
      icon: "map-pin",
      label: t("screensB.location.rowAddress"),
      value: t("screensB.location.addressValue", {
        line1: loc.addressLine1,
        line2: loc.addressLine2,
      }),
    },
    { icon: "phone", label: t("screensB.common.phone"), value: loc.phone },
    { icon: "mail", label: t("screensB.common.email"), value: loc.email },
    {
      icon: "door-open",
      label: t("screensB.location.rowGettingIn"),
      value: t(DOOR_NOTE_KEY),
    },
  ];

  return (
    <main className="bk-screen bk-page scr-location">
      <div className="scr-location__head">
        <h1 className="bk-h1">{t("screensB.location.title")}</h1>
        <p className="bk-sub scr-location__lede">
          {t("screensB.location.lede")}
        </p>
      </div>

      <PlaceholderTile
        tint={LOCATION_MAP_TINT}
        icon="map-pin"
        iconSize={52}
        minHeight={300}
        angle="150deg"
        filename={LOCATION_MAP_FILENAME}
        radius={22}
        bordered
        borderBlockEnd={false}
      />

      <div className="scr-location__cols">
        <div className="scr-location__col">
          <div className="scr-location__contact">
            {rows.map((r) => (
              <div key={r.label} className="scr-location__row">
                <span className="scr-location__row-icon">
                  <Icon name={r.icon} size={16} />
                </span>
                <span className="scr-location__row-copy">
                  <span className="scr-location__row-label">{r.label}</span>
                  <span className="scr-location__row-value">{r.value}</span>
                </span>
              </div>
            ))}

            <div className="scr-location__actions">
              <Button
                icon="navigation"
                onClick={() => showToast(t("screensB.common.toastMaps"), "warn")}
              >
                {t("screensB.location.getDirections")}
              </Button>
              <Button
                variant="ghost"
                icon="phone"
                onClick={() =>
                  showToast(
                    t("screensB.location.toastDial", { phone: loc.phone }),
                    "warn",
                  )
                }
              >
                {t("screensB.location.callStudio")}
              </Button>
            </div>
          </div>

          <div className="scr-location__travel">
            {TRAVEL.map((row) => (
              <div key={row.labelKey} className="scr-location__travel-card">
                <span className="scr-location__travel-icon">
                  <Icon name={row.icon} size={16} />
                </span>
                <span className="scr-location__travel-label">{t(row.labelKey)}</span>
                <span className="scr-location__travel-sub">{t(row.subKey)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="scr-location__col">
          <div className="scr-location__hours">
            <div className="scr-location__hours-head">
              <span className="bk-eyebrow scr-location__hours-title">
                {t("screensB.location.openingHours")}
              </span>
              <span className="scr-location__open" data-open={openToday}>
                {t(
                  openToday
                    ? "screensB.location.openToday"
                    : "screensB.location.closedToday",
                )}
              </span>
            </div>
            {hours.map((h, i) => (
              <div
                key={h.day}
                className="scr-location__hours-row"
                data-today={i === todayIdx}
              >
                <span className="scr-location__day">{weekdayName(h.day)}</span>
                <span className="scr-location__time bk-mono" data-closed={h.closed}>
                  {hoursLabel(h)}
                </span>
              </div>
            ))}
          </div>

          <div className="scr-location__notes">
            <span className="scr-location__notes-title">
              {t("screensB.location.beforeYouArrive")}
            </span>
            {ARRIVAL_NOTES.map((n) => (
              <span key={n.textKey} className="scr-location__note">
                <Icon name={n.icon} size={15} className="scr-location__note-icon" />
                {t(n.textKey)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
