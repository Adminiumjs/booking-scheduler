/*
 * CLIENTS (view: 'admin-clients') — Admin comp, template lines 426–493.
 *
 * A filterable client book beside a record panel. The topbar search feeds the
 * same `query` field the comp used, so typing up there narrows this list.
 *
 * Two translations from the comp:
 *  - it hid the middle columns by branching on `S.vw`; ruling R8 forbids
 *    reading the viewport in JS, so the markup always renders and CSS decides
 *    (a media query for the width half of the condition, `[data-detail]` for
 *    the "record panel is open" half);
 *  - it drew rows as unlabelled buttons full of bare numbers. Each row now
 *    carries an `aria-label` that reads the record out in full.
 */

import { useMemo } from "react";

import { Avatar, Chip, EmptyState, Icon, TextArea } from "../components/index.ts";
import {
  ADMIN_CLIENTS,
  CLIENT_HISTORY,
  CLIENT_SEGMENTS,
} from "../data/screens/admin-clients.ts";
import type { AdminClient } from "../data/screens/admin-clients.ts";
import { firstName, money } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-admin-clients.css";

export default function AdminClients() {
  const clientFilter = useStore((s) => s.clientFilter);
  const clientSel = useStore((s) => s.clientSel);
  const query = useStore((s) => s.query);
  const set = useStore((s) => s.set);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ADMIN_CLIENTS.filter((c) => {
      const segOk = clientFilter === "all" || c.seg === clientFilter;
      const hit =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q);
      return segOk && hit;
    });
  }, [clientFilter, query]);

  const selected = ADMIN_CLIENTS.find((c) => c.id === clientSel) ?? null;

  return (
    <div className="scr-admin-clients" data-detail={selected ? "open" : "closed"}>
      <section className="scr-admin-clients__list">
        <div className="scr-admin-clients__bar">
          {CLIENT_SEGMENTS.map((seg) => (
            <Chip
              key={seg.id}
              label={seg.label}
              active={clientFilter === seg.id}
              onClick={() => set({ clientFilter: seg.id })}
            />
          ))}
          <span className="scr-admin-clients__count">
            {rows.length} of {ADMIN_CLIENTS.length} shown
          </span>
        </div>

        <div className="scr-admin-clients__head" aria-hidden="true">
          <span className="scr-admin-clients__headav" />
          <span className="scr-admin-clients__headwho">Client</span>
          <span className="scr-admin-clients__cell scr-admin-clients__cell--last">
            Last visit
          </span>
          <span className="scr-admin-clients__cell scr-admin-clients__cell--visits">
            Visits
          </span>
          <span className="scr-admin-clients__cell scr-admin-clients__cell--spend">
            Spend
          </span>
          <span className="scr-admin-clients__cell scr-admin-clients__cell--staff">
            Usually with
          </span>
        </div>

        {rows.map((c) => (
          <ClientRow
            key={c.id}
            client={c}
            selected={c.id === clientSel}
            onSelect={() => set({ clientSel: c.id })}
          />
        ))}

        {rows.length === 0 ? (
          <EmptyState
            icon="search-x"
            title="No clients match"
            body="Try another filter or clear the search."
            className="scr-admin-clients__empty"
          />
        ) : null}
      </section>

      {selected ? <ClientRecord client={selected} /> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * One row
 * ------------------------------------------------------------------ */

interface ClientRowProps {
  client: AdminClient;
  selected: boolean;
  onSelect: () => void;
}

function ClientRow({ client, selected, onSelect }: ClientRowProps) {
  const summary =
    `${client.name}, ${client.visits} visits, ${money(client.spend)} lifetime, ` +
    `last in ${client.last}, usually with ${client.staff}`;

  return (
    <button
      type="button"
      className="scr-admin-clients__row"
      data-selected={selected ? "true" : "false"}
      aria-pressed={selected}
      aria-label={summary}
      onClick={onSelect}
    >
      <Avatar
        initials={client.initials}
        tint={client.tint}
        size={32}
        fontSize={11}
        radius={999}
      />
      <span className="scr-admin-clients__who">
        <span className="scr-admin-clients__name">{client.name}</span>
        <span className="scr-admin-clients__email">{client.email}</span>
      </span>
      <span className="scr-admin-clients__cell scr-admin-clients__cell--last">
        {client.last}
      </span>
      <span className="scr-admin-clients__cell scr-admin-clients__cell--visits bk-mono">
        {client.visits}
      </span>
      <span className="scr-admin-clients__cell scr-admin-clients__cell--spend bk-mono">
        {money(client.spend)}
      </span>
      <span className="scr-admin-clients__cell scr-admin-clients__cell--staff">
        <span className="scr-admin-clients__tag">{client.staff}</span>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * The record panel
 * ------------------------------------------------------------------ */

function ClientRecord({ client }: { client: AdminClient }) {
  const notes = useStore((s) => s.notes);
  const set = useStore((s) => s.set);
  const go = useStore((s) => s.go);
  const showToast = useStore((s) => s.showToast);

  /* `??` rather than `||` so a note the team has deliberately cleared stays
   * cleared instead of falling back to the seeded text. */
  const note = notes[client.id] ?? client.note;
  const first = firstName(client.name);

  const stats = [
    { label: "Visits", value: String(client.visits) },
    { label: "Lifetime", value: money(client.spend) },
    { label: "Last in", value: client.last },
  ];

  return (
    <aside className="scr-admin-clients__record" aria-label="Client record">
      <div className="scr-admin-clients__rechead">
        <span className="scr-admin-clients__rectitle">Client record</span>
        <button
          type="button"
          className="bk-gi scr-admin-clients__close"
          onClick={() => set({ clientSel: null })}
          aria-label="Close client record"
        >
          <Icon name="x" size={15} />
        </button>
      </div>

      <div className="scr-admin-clients__recbody">
        <div className="scr-admin-clients__recwho">
          <Avatar
            initials={client.initials}
            tint={client.tint}
            size={44}
            fontSize={15}
            radius={999}
          />
          <span className="scr-admin-clients__recid">
            <span className="scr-admin-clients__recname">{client.name}</span>
            <span className="scr-admin-clients__recmail">{client.email}</span>
          </span>
        </div>

        <div className="scr-admin-clients__stats">
          {stats.map((s) => (
            <div key={s.label} className="scr-admin-clients__stat">
              <span className="scr-admin-clients__statval bk-mono">{s.value}</span>
              <span className="scr-admin-clients__statlabel">{s.label}</span>
            </div>
          ))}
        </div>

        {client.tags.length > 0 ? (
          <div className="scr-admin-clients__tags">
            {client.tags.map((t) => (
              <span key={t} className="scr-admin-clients__flag">
                {t}
              </span>
            ))}
          </div>
        ) : null}

        <div>
          <span className="scr-admin-clients__label">Notes for the team</span>
          <TextArea
            value={note}
            /* Merged against the live store rather than this render's copy —
             * see the same note on the studio Team screen. */
            onChange={(v) =>
              set({ notes: { ...useStore.getState().notes, [client.id]: v } })
            }
            placeholder="Allergies, preferences, anything worth knowing."
            rows={3}
            ariaLabel={`Notes for the team about ${client.name}`}
          />
          <button
            type="button"
            className="bk-gi scr-admin-clients__save"
            onClick={() => showToast(`Note saved to ${first}’s record`)}
          >
            Save note
          </button>
        </div>

        <div>
          <span className="scr-admin-clients__label">Visit history</span>
          <div className="scr-admin-clients__history">
            {CLIENT_HISTORY.map((h) => (
              <div key={h.svc} className="scr-admin-clients__visit">
                <span className="scr-admin-clients__visitid">
                  <span className="scr-admin-clients__visitsvc">{h.svc}</span>
                  <span className="scr-admin-clients__visitmeta">
                    {h.date} · {h.staff}
                  </span>
                </span>
                <span className="scr-admin-clients__visitamt bk-mono">
                  {money(h.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="bk-btn scr-admin-clients__book"
          onClick={() => {
            go("admin-cal");
            showToast(`Diary open — pick a slot for ${first}`);
          }}
        >
          <Icon name="calendar-plus" size={16} />
          Book {first} in
        </button>
      </div>
    </aside>
  );
}
