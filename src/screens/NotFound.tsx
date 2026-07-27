/*
 * 404 — view `notfound` (spec §3.7). Ruling R1 ships it as a real view so the
 * footer's links all resolve rather than falling through to a blank shell.
 */

import type { CSSProperties } from "react";

import { Button } from "../components/index.ts";
import { useStore } from "../state/store.ts";
import "../styles/screen-notfound.css";

/** `Button` writes its size geometry inline, so the override goes there too. */
const HOME_CTA: CSSProperties = {
  padding: "13px 22px",
  borderRadius: "13px",
  fontSize: "14.5px",
};

export default function NotFound() {
  const go = useStore((s) => s.go);

  return (
    <main className="sm-screen sm-page sm-notfound">
      <div className="sm-mono sm-notfound__numeral">404</div>
      <h1 className="sm-notfound__h1">This page took a day off.</h1>
      <p className="sm-notfound__body">
        We couldn't find what you were looking for — but there's always a fresh
        look or a little calm waiting on the home page.
      </p>
      <Button
        variant="primary"
        icon="home"
        iconSize={17}
        style={HOME_CTA}
        onClick={() => go("home")}
      >
        Back home
      </Button>
    </main>
  );
}
