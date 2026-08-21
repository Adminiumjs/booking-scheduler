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
import { useI18n } from "../i18n/index.tsx";
import { minutesToTime, weekdayName } from "../lib/format.ts";
import { useStore } from "../state/store.ts";

import "../styles/screen-help.css";

export default function Help() {
  const { t, number } = useI18n();
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

  /* One whole sentence per plural form — the count, the noun and the quoted
   * query are all inside the message, so word order belongs to the translator. */
  const countLabel = query
    ? t("screensB.help.results", { query, count: number(faqs.length) }, faqs.length)
    : t("screensB.help.common");

  return (
    <section className="bk-screen bk-page scr-help">
      <header className="scr-help__head">
        <h1 className="bk-h1 scr-help__title">{t("screensB.help.title")}</h1>
        <p className="bk-sub scr-help__sub">{t("screensB.help.sub")}</p>
      </header>

      <div className="scr-help__search">
        <Icon name="search" size={17} className="scr-help__searchicon" />
        <TextInput
          value={helpQ}
          onChange={(v) => set({ helpQ: v })}
          placeholder={t("screensB.help.searchPlaceholder")}
          ariaLabel={t("screensB.help.searchLabel")}
          className="scr-help__searchinput"
        />
      </div>

      <div className="scr-help__contacts">
        {HELP_CONTACTS.map((c) => (
          <button
            key={c.labelKey}
            type="button"
            className="bk-tile scr-help__contact"
            onClick={() => showToast(t(c.toastKey), "warn")}
          >
            <span className="scr-help__contacticon">
              <Icon name={c.icon} size={17} />
            </span>
            <span>
              <span className="scr-help__contactlabel">{t(c.labelKey)}</span>
              <span className="scr-help__contactsub">
                {t(c.subKey, {
                  ...(c.contact === undefined ? null : { contact: c.contact }),
                  ...(c.from === undefined ? null : { from: minutesToTime(c.from) }),
                  ...(c.to === undefined ? null : { to: minutesToTime(c.to) }),
                  ...(c.fromDay === undefined
                    ? null
                    : { fromDay: weekdayName(c.fromDay, "short") }),
                  ...(c.toDay === undefined
                    ? null
                    : { toDay: weekdayName(c.toDay, "short") }),
                })}
              </span>
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
          title={t("screensB.help.emptyTitle")}
          body={t("screensB.help.emptyBody")}
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
          <div className="scr-help__stucktitle">
            {t("screensB.help.stuckTitle")}
          </div>
          <div className="scr-help__stuckbody">
            {t("screensB.help.stuckBody")}
          </div>
        </div>
        <Button
          variant="ghost"
          iconEnd="arrow-right"
          iconSize={15}
          onClick={() => go("policy")}
        >
          {t("screensB.help.readPolicy")}
        </Button>
      </div>
    </section>
  );
}
