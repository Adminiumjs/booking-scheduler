/*
 * SERVICES & PRICING (view: 'admin-services') — the studio's price list.
 *
 * The catalogue is the seam's, not a copy: this is the same list the booking
 * flow offers, which is the point — an owner editing a price here is editing
 * what a guest is quoted. Edits are held in `prices` (id → raw string) rather
 * than written back over the service, so a half-typed "1" never becomes a $1
 * balayage; "Save changes" is where a real backend would commit them.
 *
 * "Booked 30d" is derived from the service id so the number is stable across
 * renders — demo fiction, but never a figure that flickers.
 */

import { Chip, Icon, IconTile, Toggle } from "../components/index.ts";
import { categoryName, data } from "../data/source.ts";
import { useI18n } from "../i18n/index.tsx";
import { hash } from "../lib/codes.ts";
import { durationLabel } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-admin-services.css";

/** Bookings in the last 30 days — deterministic per service. */
function bookedCount(id: string): number {
  return 6 + (hash(id) % 22);
}

export default function AdminServices() {
  const { t, number } = useI18n();
  const svcCat = useStore((s) => s.svcCat);
  const prices = useStore((s) => s.prices);
  const svcOff = useStore((s) => s.svcOff);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const categories = data.getCategories();
  const rows = data
    .getServices()
    .filter((s) => svcCat === "all" || s.cat === svcCat);

  const setPrice = (id: string, raw: string): void => {
    set({ prices: { ...prices, [id]: raw.replace(/[^0-9.]/g, "") } });
  };

  const toggleBookable = (id: string, name: string, off: boolean): void => {
    set({ svcOff: { ...svcOff, [id]: !off } });
    showToast(
      t(off ? "screensA.services.backOn" : "screensA.services.hidden", { name }),
      off ? "ok" : "warn",
    );
  };

  return (
    <div className="scr-admin-services">
      <div className="bk-panel scr-admin-services__panel">
        <div className="scr-admin-services__bar">
          <Chip
            label={t("screensA.common.all")}
            active={svcCat === "all"}
            onClick={() => set({ svcCat: "all" })}
          />
          {categories.map((c) => (
            <Chip
              key={c.slug}
              label={t(c.nameKey)}
              active={svcCat === c.slug}
              onClick={() => set({ svcCat: c.slug })}
            />
          ))}
          <button
            type="button"
            className="bk-btn scr-admin-services__new"
            onClick={() => showToast(t("screensA.services.newToast"), "warn")}
          >
            <Icon name="plus" size={15} />
            {t("screensA.services.new")}
          </button>
        </div>

        <div className="scr-admin-services__scroll">
          <div className="scr-admin-services__track">
            <div className="scr-admin-services__head">
              <span />
              <span>{t("screensA.services.colService")}</span>
              <span>{t("screensA.services.colDuration")}</span>
              <span className="scr-admin-services__end">
                {t("screensA.services.colPrice")}
              </span>
              <span className="scr-admin-services__end scr-admin-services__booked">
                {t("screensA.services.colBooked")}
              </span>
              <span className="scr-admin-services__end">
                {t("screensA.services.colBookable")}
              </span>
            </div>

            {rows.map((s) => {
              const off = Boolean(svcOff[s.id]);
              const price = prices[s.id] ?? String(s.price);
              return (
                <div
                  key={s.id}
                  className="scr-admin-services__row"
                  data-off={off ? "true" : "false"}
                >
                  <IconTile
                    icon={s.icon}
                    tint={s.tint}
                    size={30}
                    iconSize={15}
                    radius={10}
                  />
                  <span className="scr-admin-services__name">
                    <span className="scr-admin-services__title">{s.name}</span>
                    <span className="scr-admin-services__meta">
                      {categoryName(t, s.cat)} ·{" "}
                      {data.getStaffNames(s.id)}
                    </span>
                  </span>
                  <span className="bk-mono scr-admin-services__dur">
                    {durationLabel(s.dur)}
                  </span>
                  <span className="scr-admin-services__pricecell">
                    <input
                      className="bk-mono scr-admin-services__price"
                      value={price}
                      inputMode="decimal"
                      aria-label={t("screensA.services.priceAria", {
                        name: s.name,
                      })}
                      onChange={(e) => setPrice(s.id, e.target.value)}
                    />
                  </span>
                  <span className="bk-mono scr-admin-services__end scr-admin-services__booked">
                    {number(bookedCount(s.id))}
                  </span>
                  <span className="scr-admin-services__livecell">
                    <Toggle
                      checked={!off}
                      onChange={() => toggleBookable(s.id, s.name, off)}
                      label={t("screensA.services.bookableAria", { name: s.name })}
                    />
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="scr-admin-services__foot">
          <Icon name="info" size={15} className="scr-admin-services__footicon" />
          <span className="scr-admin-services__footnote">
            {t("screensA.services.footnote")}
          </span>
          <button
            type="button"
            className="bk-gi scr-admin-services__save"
            onClick={() =>
              showToast(t("screensA.services.saved"), "ok")
            }
          >
            {t("screensA.common.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}
