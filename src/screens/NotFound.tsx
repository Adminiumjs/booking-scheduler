/*
 * 404 — view `notfound` (spec §3.7). Ruling R1 ships it as a real view so the
 * footer's links all resolve rather than falling through to a blank shell.
 */

import type { CSSProperties } from "react";

import { Button } from "../components/index.ts";
import { useT } from "../i18n/index.tsx";
import { useStore } from "../state/store.ts";
import "../styles/screen-notfound.css";

/** `Button` writes its size geometry inline, so the override goes there too. */
const HOME_CTA: CSSProperties = {
  padding: "13px 22px",
  borderRadius: "13px",
  fontSize: "14.5px",
};

export default function NotFound() {
  const t = useT();
  const go = useStore((s) => s.go);

  return (
    <main className="bk-screen bk-page bk-notfound">
      {/* The HTTP status code, not a number a reader counts with. */}
      <div className="bk-mono bk-notfound__numeral">404</div>
      <h1 className="bk-notfound__h1">{t("screensB.notfound.h1")}</h1>
      <p className="bk-notfound__body">{t("screensB.notfound.body")}</p>
      <Button
        variant="primary"
        icon="home"
        iconSize={17}
        style={HOME_CTA}
        onClick={() => go("home")}
      >
        {t("screensB.common.backHome")}
      </Button>
    </main>
  );
}
