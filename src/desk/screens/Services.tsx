/**
 * K6 Services (comp L2 232–267): one table per category. Whoever may change a
 * service opens the editor; the front desk reads prices and changes none (cQ24).
 */
import { Plus } from "lucide-react";

import { useData, useEnv } from "../env.tsx";
import { useFmt } from "../format.ts";
import { useDeskT } from "../i18n/index.ts";
import { openSheet } from "../store.ts";
import { Chip, Fig } from "../ui.tsx";
import { num, same, text, type Row } from "../wire.ts";
import { Avatar } from "./parts.tsx";
import { firstName } from "../facts.ts";

export function ServicesScreen() {
  const { door } = useEnv();
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const who = door.who();
  const mayEdit = who.can("services", "update");
  const seesMoney = data.services.some((s) => "price" in s);
  const payOf = (s: Row) =>
    s["online"] === "full" ? <Chip tone="accent">{t("service.payFull")}</Chip> : s["online"] === "deposit" ? <Chip tone="accent">{t("service.depositChip", { amt: fmt.money(s["deposit"]) })}</Chip> : <Chip>{t("service.payStudio")}</Chip>;
  return (
    <div className="lm-page">
      <div className="lm-page-head">
        <h1 className="lm-page-title">{t("nav.services")}</h1>
        {who.can("services", "create") && (
          <button type="button" className="lm-btn lm-btn--primary" onClick={() => openSheet({ kind: "service", serviceId: null })}>
            <Plus size={15} aria-hidden="true" />
            {t("service.new")}
          </button>
        )}
      </div>
      {data.categories.map((category) => {
        const rows = data.services.filter((s) => same(s["category_id"], category.id));
        if (rows.length === 0) return null;
        return (
          <section key={String(category.id)} className="lm-card lm-table-wrap" aria-labelledby={`lm-cat-${String(category.id)}`}>
            <div className="lm-card-head">
              <h2 id={`lm-cat-${String(category.id)}`}>{text(category["name"])}</h2>
            </div>
            <table className="lm-table lm-table--services">
              <thead>
                <tr>
                  <th scope="col">{t("service.name")}</th>
                  <th scope="col">{t("service.length")}</th>
                  <th scope="col">{t("service.cleanup")}</th>
                  {seesMoney && <th scope="col">{t("service.price")}</th>}
                  {seesMoney && <th scope="col">{t("service.online")}</th>}
                  {seesMoney && <th scope="col">{t("service.bookable")}</th>}
                  <th scope="col">{t("service.who")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((service) => {
                  const people = data.team.filter((p) => data.teamServices.some((l) => same(l["team_id"], p.id) && same(l["service_id"], service.id)));
                  const buffer = num(service["buffer_min"]) ?? 0;
                  return (
                    <tr key={String(service.id)}>
                      <td>
                        {mayEdit ? (
                          <button type="button" className="lm-table-name" onClick={() => openSheet({ kind: "service", serviceId: service.id })}>
                            <strong>{text(service["name"])}</strong>
                          </button>
                        ) : (
                          <strong>{text(service["name"])}</strong>
                        )}
                      </td>
                      <td><Fig>{t("common.minutes", {}, num(service["minutes"]) ?? 0)}</Fig></td>
                      <td><Fig>{buffer > 0 ? t("common.minutes", {}, buffer) : t("service.none")}</Fig></td>
                      {seesMoney && <td><Fig strong>{fmt.money(service["price"])}</Fig></td>}
                      {seesMoney && <td>{payOf(service)}</td>}
                      {seesMoney && <td>{service["bookable_online"] === false ? t("common.no") : t("common.yes")}</td>}
                      <td>
                        <span className="lm-with">
                          <span className="lm-stack">
                            {people.map((p) => (
                              <Avatar key={String(p.id)} person={p} size={24} />
                            ))}
                          </span>
                          {people.map((p) => firstName(p["name"])).join(", ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}
      <p className="lm-hint">{t("service.priceNote")}</p>
    </div>
  );
}
