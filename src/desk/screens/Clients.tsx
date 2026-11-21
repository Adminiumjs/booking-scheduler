/** K5 Clients (comp L2 201–230): the list with its three segments. The client opens as a panel. */
import { useEnv, useData } from "../env.tsx";
import { byId, clientFacts, startOf } from "../facts.ts";
import { useFmt } from "../format.ts";
import { useDeskT } from "../i18n/index.ts";
import { openClient, useDesk } from "../store.ts";
import { addDays, dayIn } from "../time.ts";
import { Fig } from "../ui.tsx";
import { same, text, type Row } from "../wire.ts";
import { Avatar } from "./parts.tsx";

export function ClientsScreen() {
  const { door } = useEnv();
  const data = useData();
  const t = useDeskT();
  const fmt = useFmt();
  const segment = useDesk((s) => s.clientSegment);
  const panel = useDesk((s) => s.panel);
  const { zone } = door.facts();
  const today = dayIn(door.now(), zone);
  const monthStart = `${today.slice(0, 7)}-01`;
  const cut = addDays(today, -90);
  const rows = [...data.customers]
    .filter((c) => c["forgotten_at"] === null || c["forgotten_at"] === undefined)
    .sort((a, b) => (text(a["name"]) ?? "").localeCompare(text(b["name"]) ?? ""))
    .map((customer) => ({ customer, facts: clientFacts(data.bookings, customer.id) }));
  const firstBooking = (c: Row) => data.bookings.filter((b) => same(b["customer_id"], c.id)).reduce<number | null>((min, b) => (min === null || startOf(b) < min ? startOf(b) : min), null);
  const isNew = (c: Row) => {
    const first = firstBooking(c);
    return first !== null && dayIn(first, zone) >= monthStart;
  };
  const isAway = (last: string | null) => last !== null && dayIn(last, zone) < cut;
  const counts = { all: rows.length, new: rows.filter((r) => isNew(r.customer)).length, away: rows.filter((r) => isAway(r.facts.last)).length };
  const shown = rows.filter((r) => (segment === "all" ? true : segment === "new" ? isNew(r.customer) : isAway(r.facts.last)));
  const segments = [
    { id: "all", label: t("clients.all"), n: counts.all },
    { id: "new", label: t("clients.new"), n: counts.new },
    { id: "away", label: t("clients.away"), n: counts.away },
  ] as const;
  return (
    <div className="lm-page">
      <h1 className="lm-page-title">{t("nav.clients")}</h1>
      <div role="group" aria-label={t("nav.clients")} className="lm-chip-row">
        {segments.map((s) => (
          <button key={s.id} type="button" aria-pressed={segment === s.id} className={`lm-chip${segment === s.id ? " is-on" : ""}`} onClick={() => useDesk.setState({ clientSegment: s.id })}>
            {s.label} <Fig>{s.n}</Fig>
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <div className="lm-empty-box">
          <strong>{t("clients.emptyTitle")}</strong>
          <span>{t("clients.emptySub")}</span>
        </div>
      ) : (
        <div className="lm-card lm-table-wrap">
          <table className="lm-table">
            <thead>
              <tr>
                <th scope="col">{t("clients.name")}</th>
                <th scope="col">{t("clients.lastVisit")}</th>
                <th scope="col">{t("clients.visits")}</th>
                <th scope="col">{t("clients.usually")}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(({ customer, facts }) => {
                const usual = byId(data.team, facts.usuallyWith);
                const open = panel?.kind === "client" && same(panel.id, customer.id);
                return (
                  <tr key={String(customer.id)} className={open ? "is-open" : ""}>
                    <td>
                      <button type="button" className="lm-table-name" onClick={() => openClient(customer.id)}>
                        <strong>{text(customer["name"]) ?? t("common.noName")}</strong>
                        {text(customer["email"]) !== null && <small>{text(customer["email"])}</small>}
                      </button>
                    </td>
                    <td><Fig>{facts.last === null ? "—" : fmt.day(facts.last)}</Fig></td>
                    <td><Fig>{facts.visits}</Fig></td>
                    <td>
                      {usual === undefined ? "—" : (
                        <span className="lm-with">
                          <Avatar person={usual} size={20} />
                          {text(usual["name"])}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
