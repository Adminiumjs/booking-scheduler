/*
 * HELP CENTRE (view: 'help') — a searchable FAQ with three ways to reach a
 * person above it.
 *
 * The search filters question *and* answer text, so a guest who remembers a
 * phrase rather than a heading still lands on the right row. `store.helpOpen`
 * holds the open question, which makes the accordion single-open by
 * construction.
 */

import { useMemo } from "react";

import {
  Button,
  Card,
  EmptyState,
  Icon,
  TextInput,
} from "../components/index.ts";
import { FAQS, HELP_CONTACTS } from "../data/screens/help.ts";
import { plural } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-help.css";

export default function Help() {
  const helpQ = useStore((s) => s.helpQ);
  const helpOpen = useStore((s) => s.helpOpen);
  const go = useStore((s) => s.go);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const query = helpQ.trim();
  const faqs = useMemo(() => {
    const needle = query.toLowerCase();
    if (!needle) return FAQS.slice();
    return FAQS.filter(
      (f) =>
        f.q.toLowerCase().includes(needle) || f.a.toLowerCase().includes(needle),
    );
  }, [query]);

  const countLabel = query
    ? `${plural(faqs.length, "answer")} for “${query}”`
    : "Common questions";

  return (
    <section className="bk-screen bk-page scr-help">
      <header className="scr-help__head">
        <h1 className="bk-h1 scr-help__title">How can we help?</h1>
        <p className="bk-sub scr-help__sub">
          Answers to the things guests ask us most.
        </p>
      </header>

      <div className="scr-help__search">
        <Icon name="search" size={17} className="scr-help__searchicon" />
        <TextInput
          value={helpQ}
          onChange={(v) => set({ helpQ: v })}
          placeholder="Search help articles…"
          ariaLabel="Search help articles"
          className="scr-help__searchinput"
        />
      </div>

      <div className="scr-help__contacts">
        {HELP_CONTACTS.map((c) => (
          <button
            key={c.label}
            type="button"
            className="bk-tile scr-help__contact"
            onClick={() => showToast(c.toast, "warn")}
          >
            <span className="scr-help__contacticon">
              <Icon name={c.icon} size={17} />
            </span>
            <span>
              <span className="scr-help__contactlabel">{c.label}</span>
              <span className="scr-help__contactsub">{c.sub}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Announced politely so a screen reader hears the count change as the
       * query is typed, rather than only on focus. */}
      <h2 className="bk-eyebrow scr-help__count" aria-live="polite">
        {countLabel}
      </h2>

      {faqs.length === 0 ? (
        /* The comp drew the (now empty) FAQ card under this block, leaving a
         * stray bordered box on screen — the list is dropped instead. */
        <EmptyState
          className="scr-help__empty"
          icon="search-x"
          title="No matches"
          body="Try a shorter search, or text us — a real person answers between 9 and 6."
        />
      ) : (
        <Card clip className="scr-help__faqs">
          {faqs.map((f) => {
            const open = helpOpen === f.q;
            return (
              <div
                key={f.q}
                className="scr-help__faq"
                data-open={open ? "true" : "false"}
              >
                <button
                  type="button"
                  className="scr-help__faqq"
                  aria-expanded={open}
                  onClick={() => set({ helpOpen: open ? "" : f.q })}
                >
                  <span className="scr-help__faqtext">{f.q}</span>
                  <Icon
                    name="chevron-down"
                    size={17}
                    className="scr-help__chev"
                  />
                </button>
                {open ? <p className="scr-help__faqa">{f.a}</p> : null}
              </div>
            );
          })}
        </Card>
      )}

      <div className="scr-help__stuck">
        <div>
          <div className="scr-help__stucktitle">Still stuck?</div>
          <div className="scr-help__stuckbody">
            Our cancellation policy covers most booking questions in plain
            language.
          </div>
        </div>
        <Button
          variant="ghost"
          iconEnd="arrow-right"
          iconSize={15}
          onClick={() => go("policy")}
        >
          Read the policy
        </Button>
      </div>
    </section>
  );
}
