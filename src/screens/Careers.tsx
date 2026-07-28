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
import { SCROLL_OFFSET, useStore } from "../state/store.ts";

import "../styles/screen-careers.css";

export default function Careers() {
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
    showToast("The form below is ready for you", "ok");
    scrollToForm();
  };

  const submit = (): void => {
    if (!carName.trim() || !carEmail.trim()) {
      showToast("Name and email, then you’re done", "warn");
      return;
    }
    set({ carSent: true });
    showToast("Application sent · demo only", "ok");
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
          {ROLES.length} open roles
        </span>
        <h1 className="scr-careers__h1">Work at Lumen Studio</h1>
        <p className="scr-careers__lede">
          We’re a small team that runs on time, splits tips evenly, and closes on
          Sundays for real. If you’d rather do fewer clients properly than more of
          them badly, we’ll get on.
        </p>
      </div>

      <div className="scr-careers__perks">
        {PERKS.map((p) => (
          <div key={p.label} className="scr-careers__perk">
            <span className="scr-careers__perk-icon">
              <Icon name={p.icon} size={17} />
            </span>
            <span className="scr-careers__perk-label">{p.label}</span>
            <span className="scr-careers__perk-sub">{p.sub}</span>
          </div>
        ))}
      </div>

      <Eyebrow className="scr-careers__eyebrow">Open roles</Eyebrow>

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
                    <span className="scr-careers__tag">{r.type}</span>
                    <span className="scr-careers__tag">{r.team}</span>
                    <span className="scr-careers__tag scr-careers__tag--pay bk-mono">
                      {r.pay}
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
                    Apply for this role
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
            {selected ? `Apply · ${selected.title}` : "Send an open application"}
          </span>
          <span className="scr-careers__form-sub">
            No cover letter needed. Tell us what you’re good at and where you’ve
            worked.
          </span>
        </div>

        {carSent ? (
          <Banner tone="pos" icon="check-circle-2">
            Application received. Selma reads every one herself and usually replies
            within a week — demo only, so nothing was really sent.
          </Banner>
        ) : (
          <>
            <div className="scr-careers__fields">
              <Field label="Your name">
                {(control) => (
                  <TextInput
                    {...control}
                    value={carName}
                    onChange={(v) => set({ carName: v })}
                    placeholder="Robin Alvarez"
                  />
                )}
              </Field>
              <Field label="Email">
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

            <Field label="Anything you’d like us to know">
              {(control) => (
                <TextArea
                  {...control}
                  value={carNote}
                  onChange={(v) => set({ carNote: v })}
                  rows={4}
                  placeholder="Where you’ve worked, what you love doing, when you could start."
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
                ? `${CAREERS_ATTACHMENT} · attached`
                : "Attach a CV or portfolio (optional)"}
            </button>

            <Button
              icon="send"
              size="lg"
              onClick={submit}
              className="scr-careers__submit"
            >
              Send application
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
