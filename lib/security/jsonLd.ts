const LESS_THAN_PATTERN = /</g;
const ESCAPED_LESS_THAN = "\\u003c";

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(LESS_THAN_PATTERN, ESCAPED_LESS_THAN);
}
