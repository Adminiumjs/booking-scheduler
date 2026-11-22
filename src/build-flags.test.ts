import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { BUILD_FLAGS, buildDefine } from "./build-flags.ts";

const ALL = { VITE_ADMINIUM_API_BASE_URL: "http://localhost:4600", VITE_ADMINIUM_PUBLISHABLE_KEY: "adm_pub_dev", VITE_ADMINIUM_LINK_KEY: "adm_pub_link", VITE_ADMINIUM_SALE_KEY: "adm_pub_sale" };
const value = (define: Record<string, string>, name: string) => JSON.parse(define[`import.meta.env.${name}`]!) as string;

describe("what a build inlines", () => {
  it("names every key the customer pages read", () => {
    for (const name of Object.keys(ALL)) expect(BUILD_FLAGS).toContain(name);
  });

  it("a hosted surface carries no address or key from the machine that built it", () => {
    const define = buildDefine({ ...ALL, VITE_ADMINIUM_SURFACE_SIDE: "customer" });
    for (const name of Object.keys(ALL)) expect(value(define, name), name).toBe("");
    expect(value(define, "VITE_ADMINIUM_SURFACE_SIDE")).toBe("customer");
  });

  it("a standalone build keeps them: they are how it finds its Adminium", () => {
    const define = buildDefine(ALL);
    for (const [name, set] of Object.entries(ALL)) expect(value(define, name), name).toBe(set);
  });

  it("the customer pages read them by name, the only form a define replaces", () => {
    const source = readFileSync(new URL("./customer/CustomerApp.tsx", import.meta.url), "utf8");
    expect(source).not.toMatch(/import\.meta\.env as/);
  });
});
