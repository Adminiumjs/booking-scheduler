/**
 * The build-time flags, each defined in every build so that it folds (see `vite.config.ts`).
 *
 * A hosted surface is served by Adminium, which tells the page its address and keys at run time. So a hosted build takes none of
 * these from the machine that built it: a developer's `.env` or shell must never end up in a released bundle.
 */
export const BUILD_FLAGS = [
  "VITE_ADMINIUM_SURFACE_SIDE",
  "VITE_ADMINIUM_API_BASE_URL",
  "VITE_ADMINIUM_PUBLISHABLE_KEY",
  "VITE_ADMINIUM_LINK_KEY",
  "VITE_ADMINIUM_SALE_KEY",
  "VITE_LUMEN_CUSTOMER",
] as const;

const NEVER_IN_A_HOSTED_BUILD: readonly string[] = ["VITE_ADMINIUM_API_BASE_URL", "VITE_ADMINIUM_PUBLISHABLE_KEY", "VITE_ADMINIUM_LINK_KEY", "VITE_ADMINIUM_SALE_KEY"];

export function buildDefine(env: Record<string, string | undefined>): Record<string, string> {
  const hosted = (env["VITE_ADMINIUM_SURFACE_SIDE"] ?? "") !== "";
  return Object.fromEntries(BUILD_FLAGS.map((name) => [`import.meta.env.${name}`, JSON.stringify(hosted && NEVER_IN_A_HOSTED_BUILD.includes(name) ? "" : (env[name] ?? ""))]));
}
