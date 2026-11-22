/** What a person sees while the server has asked the desk to slow down: a sentence in their language, not an endless "Loading". */
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { I18nProvider } from "../i18n/index.tsx";
import { DeskApp } from "./DeskApp.tsx";
import type { DeskDoor } from "./door.ts";
import { DeskProvider } from "./env.tsx";
import { en } from "./i18n/en.ts";
import type { DeskState } from "./store.ts";

const shown = vi.hoisted(() => ({ state: {} as Record<string, unknown> }));
// A server render reads a store's first state, so the state under test is handed to the screen here.
vi.mock("./store.ts", async (original) => {
  const real = await original<typeof import("./store.ts")>();
  const useDesk = Object.assign((pick: (s: DeskState) => unknown) => pick({ ...real.useDesk.getState(), ...shown.state } as DeskState), real.useDesk);
  return { ...real, useDesk };
});

const drawn = (state: { slowedDown: boolean; failure: string | null }) => {
  shown.state = { data: null, ...state };
  return renderToString(
    <I18nProvider>
      <DeskProvider env={{ door: {} as DeskDoor, leave: () => undefined }}>
        <DeskApp />
      </DeskProvider>
    </I18nProvider>,
  );
};

describe("the desk before its first rows", () => {
  it("says the server asked it to slow down, with no button to press", () => {
    const html = drawn({ slowedDown: true, failure: "Too many requests." });
    expect(html).toContain(en["shell.slowDown"]);
    expect(html).not.toContain(en["common.loading"]);
    expect(html).not.toContain(en["shell.retry"]);
  });

  it("still offers a retry for any other failure", () => {
    const html = drawn({ slowedDown: false, failure: "It broke." });
    expect(html).toContain("It broke.");
    expect(html).toContain(en["shell.retry"]);
  });
});
