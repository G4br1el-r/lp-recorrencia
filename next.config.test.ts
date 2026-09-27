import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BACKDROP_IMAGE_QUALITY,
  DEFAULT_IMAGE_QUALITY,
} from "@/lib/constants/images";

const NODE_ENV = "NODE_ENV";
const CONTENT_SECURITY_POLICY_HEADER = "Content-Security-Policy";
const STRICT_TRANSPORT_SECURITY_HEADER = "Strict-Transport-Security";
const UNSAFE_EVAL_SOURCE = "'unsafe-eval'";
const EXPECTED_STRICT_TRANSPORT_SECURITY =
  "max-age=63072000; includeSubDomains; preload";
const EXPECTED_DIRECTIVES = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
];
const DIRECTIVE_SEPARATOR = "; ";
const SCRIPT_SRC_PREFIX = "script-src ";
const EXPECTED_IMAGE_QUALITIES = [
  BACKDROP_IMAGE_QUALITY,
  DEFAULT_IMAGE_QUALITY,
];

async function loadHeaders(): Promise<Map<string, string>> {
  const { default: nextConfig } = await import("@/next.config");
  const routes = (await nextConfig.headers?.()) ?? [];
  return new Map(
    routes.flatMap((route) =>
      route.headers.map(({ key, value }) => [key, value] as const),
    ),
  );
}

function scriptSources(policy: string): string {
  const directive = policy
    .split(DIRECTIVE_SEPARATOR)
    .find((item) => item.startsWith(SCRIPT_SRC_PREFIX));
  return directive ?? "";
}

describe("next.config headers", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("envia a CSP completa em produção, sem unsafe-eval", async () => {
    vi.stubEnv(NODE_ENV, "production");
    const headers = await loadHeaders();
    const policy = headers.get(CONTENT_SECURITY_POLICY_HEADER) ?? "";
    for (const directive of EXPECTED_DIRECTIVES) {
      expect(policy).toContain(directive);
    }
    expect(scriptSources(policy)).toBe("script-src 'self' 'unsafe-inline'");
  });

  it("libera unsafe-eval na CSP apenas em desenvolvimento", async () => {
    vi.stubEnv(NODE_ENV, "development");
    const headers = await loadHeaders();
    const policy = headers.get(CONTENT_SECURITY_POLICY_HEADER) ?? "";
    expect(scriptSources(policy)).toContain(UNSAFE_EVAL_SOURCE);
  });

  it("libera a qualidade reduzida dos backdrops além da padrão", async () => {
    const { default: nextConfig } = await import("@/next.config");
    expect(nextConfig.images?.qualities).toEqual(EXPECTED_IMAGE_QUALITIES);
  });

  it("inline o CSS crítico no HTML", async () => {
    const { default: nextConfig } = await import("@/next.config");
    expect(nextConfig.experimental?.inlineCss).toBe(true);
  });

  it("envia HSTS de dois anos com includeSubDomains e preload", async () => {
    vi.stubEnv(NODE_ENV, "production");
    const headers = await loadHeaders();
    expect(headers.get(STRICT_TRANSPORT_SECURITY_HEADER)).toBe(
      EXPECTED_STRICT_TRANSPORT_SECURITY,
    );
  });
});
