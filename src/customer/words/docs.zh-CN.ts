import { DOCS_EN, type DocSet } from "./docs.ts";

/** Not translated yet. */
export const DOCS_ZH_CN: DocSet = new Proxy({} as DocSet, { get: (_t, page: keyof DocSet) => DOCS_EN[page] });
