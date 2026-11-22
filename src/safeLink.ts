/**
 * A link somebody typed, as it may become an `href`: https, to a real host, or nothing. The column's own `url` rule accepts
 * any scheme a browser can parse, `javascript:` among them.
 */
export function webLink(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!/^https:\/\//i.test(text) || !URL.canParse(text)) return null;
  const url = new URL(text);
  return url.protocol === "https:" && url.hostname !== "" ? text : null;
}
