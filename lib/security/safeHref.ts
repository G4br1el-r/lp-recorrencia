const INTERNAL_ANCHOR_PREFIX = "#";
const RELATIVE_PATH_PREFIX = "/";
const UNSAFE_RELATIVE_PREFIXES = ["//", "/\\"] as const;
const ALLOWED_EXTERNAL_PROTOCOL = "https:";

export const ALLOWED_EXTERNAL_HOSTS: readonly string[] = [
  "www.editorasantuario.com.br",
];

function isInternalAnchor(href: string): boolean {
  return href.startsWith(INTERNAL_ANCHOR_PREFIX);
}

function isRelativePath(href: string): boolean {
  return (
    href.startsWith(RELATIVE_PATH_PREFIX) &&
    !UNSAFE_RELATIVE_PREFIXES.some((prefix) => href.startsWith(prefix))
  );
}

function parseUrl(href: string): URL | null {
  try {
    return new URL(href);
  } catch {
    return null;
  }
}

function isAllowedExternalUrl(href: string): boolean {
  const url = parseUrl(href);
  if (!url) return false;
  return (
    url.protocol === ALLOWED_EXTERNAL_PROTOCOL &&
    url.username === "" &&
    url.password === "" &&
    ALLOWED_EXTERNAL_HOSTS.includes(url.host)
  );
}

export function isSafeHref(href: string): boolean {
  return (
    isInternalAnchor(href) || isRelativePath(href) || isAllowedExternalUrl(href)
  );
}

export function toSafeHref(href: string): string | undefined {
  return isSafeHref(href) ? href : undefined;
}
