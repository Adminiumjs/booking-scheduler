/*
 * SERVICES (spec §3.2) — category chips over a grid of full service cards.
 * Every category has at least two entries, so there is deliberately no
 * empty state here.
 */

import { Chip, ServiceCard } from "../components/index.ts";
import { data } from "../data/source.ts";
import { useStore } from "../state/store.ts";
import "../styles/screen-services.css";

export default function Services() {
  const sCat = useStore((s) => s.sCat);
  const setSCat = useStore((s) => s.setSCat);
  const startBooking = useStore((s) => s.startBooking);

  const categories = data.getCategories();
  const counts = data.getCategoryCounts();
  const services = data.getServicesByCategory(sCat);

  return (
    <main className="bk-screen bk-page bk-services">
      <div className="bk-services-head">
        <h1 className="bk-services-title">Services</h1>
        <p className="bk-services-sub">
          Pick what you're in the mood for. Every booking is confirmed instantly — pick a
          specialist and a time next.
        </p>
      </div>

      <div className="bk-services-chips" role="group" aria-label="Filter by category">
        <Chip
          label="All"
          active={sCat === "all"}
          count={counts.all}
          onClick={() => setSCat("all")}
        />
        {categories.map((c) => (
          <Chip
            key={c.slug}
            label={c.name}
            icon={c.icon}
            iconSize={15}
            count={counts[c.slug]}
            active={sCat === c.slug}
            onClick={() => setSCat(c.slug)}
          />
        ))}
      </div>

      <div className="bk-services-grid">
        {services.map((s) => (
          <ServiceCard key={s.id} service={s} variant="full" onBook={startBooking} />
        ))}
      </div>
    </main>
  );
}
