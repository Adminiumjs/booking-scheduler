/*
 * WORK WITH US (view: 'careers') — perks, an open-roles accordion, and one
 * application form the roles feed into.
 *
 * Two fixes on the comp:
 *  - "Apply for this role" only raised a toast reading "Scroll down"; the
 *    `id="apply"` anchor it implied was never wired to anything. It now
 *    actually moves the page to the form (honouring reduced motion), and the
 *    toast says so.
 *  - The accordion header was a bare `<button>` with a chevron; it now
 *    carries `aria-expanded` + `aria-controls` so the collapsed panels are
 *    announced as collapsed rather than simply absent.
 */

import { useRef } from "react";

import {
  Banner,
  Button,
  Eyebrow,
  Field,
  Icon,
  PlaceholderTile,
  TextArea,
  TextInput,
} from "../components/index.ts";
import {
  CAREERS_ATTACHMENT,
  CAREERS_HERO_FILENAME,
  CAREERS_HERO_TINT,
  PERKS,
  ROLES,
} from "../data/screens/careers.ts";
import { useT } from "../i18n/index.tsx";
import { formatNumber, wholeMoney } from "../lib/format.ts";
import { SCROLL_OFFSET, useStore } from "../state/store.ts";

import "../styles/screen-careers.css";

export default function Careers() {
  const t = useT();
  const carRole = useStore((s) => s.carRole);
  const carName = useStore((s) => s.carName);
  const carEmail = useStore((s) => s.carEmail);
  const carNote = useStore((s) => s.carNote);
  const carFile = useStore((s) => s.carFile);
  const carSent = useStore((s) => s.carSent);
  const set = useStore((s) => s.set);
  const showToast = useStore((s) => s.showToast);

  const formRef = useRef<HTMLDivElement | null>(null);

  const selected = ROLES.find((r) => r.id === carRole);

  const scrollToForm = (): void => {
    const el = formRef.current;
    if (!el) return;
    /* R10 — the options bag beats the CSS for programmatic scrolls. */
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
  };

  const apply = (id: string): void => {
    set({ carRole: id });
    showToast(t("screensA.careers.applyReady"), "ok");
    scrollToForm();
  };

  const submit = (): void => {
    if (!carName.trim() || !carEmail.trim()) {
      showToast(t("screensA.careers.needNameEmail"), "warn");
      return;
    }
    set({ carSent: true });
    showToast(t("screensA.careers.sent"), "ok");
  };

  return (
    <main className="bk-screen bk-page scr-careers">
      <PlaceholderTile
        tint={CAREERS_HERO_TINT}
        icon="users"
        iconSize={58}
        minHeight={240}
        angle="150deg"
        filename={CAREERS_HERO_FILENAME}
        radius={22}
        bordered
        borderBlockEnd={false}
      />

      <div className="scr-careers__intro">
        <span className="scr-careers__count">
          <Icon name="briefcase" size={14} />
          {t("screensA.careers.openRoles", {}, ROLES.length)}
        </span>
        <h1 className="scr-careers__h1">{t("screensA.careers.title")}</h1>
        <p className="scr-careers__lede">{t("screensA.careers.lede")}</p>
      </div>

      <div className="scr-careers__perks">
        {PERKS.map((p) => (
          <div key={p.labelKey} className="scr-careers__perk">
            <span className="scr-careers__perk-icon">
              <Icon name={p.icon} size={17} />
            </span>
            <span className="scr-careers__perk-label">{t(p.labelKey)}</span>
            <span className="scr-careers__perk-sub">
              {t(
                p.subKey,
                p.amount === undefined ? undefined : { amount: wholeMoney(p.amount) },
              )}
            </span>
          </div>
        ))}
      </div>

      <Eyebrow className="scr-careers__eyebrow">
        {t("screensA.careers.rolesEyebrow")}
      </Eyebrow>

      <div className="scr-careers__roles">
        {ROLES.map((r) => {
          const open = carRole === r.id;
          const panelId = `scr-careers-role-${r.id}`;
          return (
            <div key={r.id} className="scr-careers__role" data-open={open}>
              <button
                type="button"
                className="scr-careers__role-head"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => set({ carRole: open ? null : r.id })}
              >
                <span className="scr-careers__role-id">
                  <span className="scr-careers__role-title">{r.title}</span>
                  <span className="scr-careers__role-tags">
                    <span className="scr-careers__tag">
                      {t(
                        r.typeKey,
                        r.typeCount === undefined
                          ? undefined
                          : { count: formatNumber(r.typeCount) },
                        r.typeCount,
                      )}
                    </span>
                    <span className="scr-careers__tag">{t(r.teamKey)}</span>
                    <span className="scr-careers__tag scr-careers__tag--pay bk-mono">
                      {t(r.payKey, {
                        from: wholeMoney(r.payFrom),
                        ...(r.payTo === undefined
                          ? null
                          : { to: wholeMoney(r.payTo) }),
                        ...(r.payShare === undefined
                          ? null
                          : {
                              share: formatNumber(r.payShare, {
                                style: "percent",
                                maximumFractionDigits: 0,
                              }),
                            }),
                      })}
                    </span>
                  </span>
                </span>
                {/* No `chevron-up` in the registry — one glyph, rotated. */}
                <Icon name="chevron-down" size={18} className="scr-careers__chev" />
              </button>

              {open ? (
                <div className="scr-careers__role-body" id={panelId}>
                  <p className="scr-careers__role-blurb">{r.blurb}</p>
                  <div className="scr-careers__duties">
                    {r.duties.map((d) => (
                      <div key={d} className="scr-careers__duty">
                        <Icon name="check" size={15} className="scr-careers__duty-icon" />
                        {d}
                      </div>
                    ))}
                  </div>
                  <Button icon="send" size="lg" onClick={() => apply(r.id)}>
                    {t("screensA.careers.apply")}
                  </Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="scr-careers__form" ref={formRef}>
        <div>
          <span className="scr-careers__form-title">
            {selected
              ? t("screensA.careers.formTitleRole", { role: selected.title })
              : t("screensA.careers.formTitleOpen")}
          </span>
          <span className="scr-careers__form-sub">
            {t("screensA.careers.formSub")}
          </span>
        </div>

        {carSent ? (
          <Banner tone="pos" icon="check-circle-2">
            {t("screensA.careers.received")}
          </Banner>
        ) : (
          <>
            <div className="scr-careers__fields">
              <Field label={t("screensA.common.yourName")}>
                {(control) => (
                  <TextInput
                    {...control}
                    value={carName}
                    onChange={(v) => set({ carName: v })}
                    placeholder="Robin Alvarez"
                  />
                )}
              </Field>
              <Field label={t("screensA.common.email")}>
                {(control) => (
                  <TextInput
                    {...control}
                    value={carEmail}
                    onChange={(v) => set({ carEmail: v })}
                    type="email"
                    inputMode="email"
                    placeholder="you@email.com"
                  />
                )}
              </Field>
            </div>

            <Field label={t("screensA.careers.noteLabel")}>
              {(control) => (
                <TextArea
                  {...control}
                  value={carNote}
                  onChange={(v) => set({ carNote: v })}
                  rows={4}
                  placeholder={t("screensA.careers.notePlaceholder")}
                  className="scr-careers__note"
                />
              )}
            </Field>

            <button
              type="button"
              className="scr-careers__attach"
              aria-pressed={carFile}
              onClick={() => set({ carFile: !carFile })}
            >
              {/* `paperclip` / `file-check` aren't in the registry — the two
                  closest names carry the same before/after meaning. */}
              <Icon name={carFile ? "clipboard-check" : "file-text"} size={17} />
              {carFile
                ? t("screensA.careers.attached", { file: CAREERS_ATTACHMENT })
                : t("screensA.careers.attach")}
            </button>

            <Button
              icon="send"
              size="lg"
              onClick={submit}
              className="scr-careers__submit"
            >
              {t("screensA.careers.submit")}
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
