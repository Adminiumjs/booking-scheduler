/**
 * G14, the four text pages (the comp's lines 809–824). Every promise reads the
 * studio's own settings, so a page can never say something the booking rules
 * don't do.
 */
import { useApp } from "../app.tsx";
import { fmtMoney } from "../format.ts";
import type { Screen } from "../route.ts";
import { doorFor } from "../rules.ts";
import { docWords } from "../words/docs.ts";

export default function Docs({ page }: { page: Extract<Screen, "help" | "policy" | "privacy" | "terms"> }) {
  const { t, locale, clock, studio } = useApp();
  const takes = studio.services.filter((s) => doorFor(s, studio.ownerSwitch, studio.rows.paymentsOnline) === "money");
  const deposits = takes.map((s) => `${s.name} (${fmtMoney(clock, s.online === "full" ? s.price : s.deposit)})`).join(", ");
  const doc = docWords(locale)[page]({
    hours: studio.cancelHours,
    hold: studio.holdMin,
    notice: Math.round(studio.noticeMin / 60),
    window: studio.windowDays,
    deposits,
    hasDeposits: takes.length > 0,
    currency: clock.currency,
  });
  return (
    <main id="lm-main" className="lm-narrow-page" style={{ maxWidth: 720, paddingBlock: "clamp(24px,4cqi,44px)" }}>
      <h1 className="lm-title">{doc.title}</h1>
      <p className="lm-sub">{doc.intro}</p>
      <div className="lm-col" style={{ gap: 12 }}>
        {doc.items.map(([h, p]) => (
          <section key={h} className="lm-card" style={{ padding: "18px 20px", borderRadius: 18 }}>
            <h2 style={{ marginBottom: 6, fontSize: 15.5, fontWeight: 800 }}>{h}</h2>
            <p className="lm-muted" style={{ fontSize: 14, lineHeight: 1.6, textWrap: "pretty" }}>
              {p}
            </p>
          </section>
        ))}
      </div>
      <p className="lm-muted" style={{ marginTop: 22, fontSize: 13.5 }}>
        {t("questions")}{" "}
        <a href={`mailto:${studio.email}`} dir="ltr" style={{ fontWeight: 700 }}>
          {studio.email}
        </a>
      </p>
    </main>
  );
}
