import { DOCS_EN, type DocSet } from "./docs.ts";

/** Not translated yet. */
export const DOCS_DE: DocSet = new Proxy({} as DocSet, { get: (_t, page: keyof DocSet) => DOCS_EN[page] });
