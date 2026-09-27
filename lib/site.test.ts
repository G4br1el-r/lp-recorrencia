import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const PRODUCTION_URL_ENV = "VERCEL_PROJECT_PRODUCTION_URL";
const EXPLICIT_SITE_URL_ENV = "NEXT_PUBLIC_SITE_URL";
const PRODUCTION_HOST = "deusconosco.example.com";
const EXPLICIT_HOST = "assinatura.example.com";
const EXPLICIT_SITE_URL = `https://${EXPLICIT_HOST}`;
const LOCAL_SITE_URL = "http://localhost:3000";

async function loadSite() {
  return import("@/lib/site");
}

describe("site", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv(EXPLICIT_SITE_URL_ENV, undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa localhost quando a URL de produção não está definida", async () => {
    vi.stubEnv(PRODUCTION_URL_ENV, undefined);
    const { SITE_URL } = await loadSite();
    expect(SITE_URL).toBe(LOCAL_SITE_URL);
  });

  it("usa localhost quando a URL de produção está vazia", async () => {
    vi.stubEnv(PRODUCTION_URL_ENV, "");
    const { SITE_URL } = await loadSite();
    expect(SITE_URL).toBe(LOCAL_SITE_URL);
  });

  it("usa https com o host de produção quando definido", async () => {
    vi.stubEnv(PRODUCTION_URL_ENV, PRODUCTION_HOST);
    const { SITE_URL } = await loadSite();
    expect(SITE_URL).toBe(`https://${PRODUCTION_HOST}`);
  });

  it("absoluteUrl monta URLs absolutas a partir do host de produção", async () => {
    vi.stubEnv(PRODUCTION_URL_ENV, PRODUCTION_HOST);
    const { absoluteUrl } = await loadSite();
    expect(absoluteUrl("/")).toBe(`https://${PRODUCTION_HOST}/`);
    expect(absoluteUrl("/og.png")).toBe(`https://${PRODUCTION_HOST}/og.png`);
    expect(absoluteUrl("sitemap.xml")).toBe(
      `https://${PRODUCTION_HOST}/sitemap.xml`,
    );
  });

  it("absoluteUrl monta URLs absolutas em localhost", async () => {
    vi.stubEnv(PRODUCTION_URL_ENV, undefined);
    const { absoluteUrl } = await loadSite();
    expect(absoluteUrl("/robots.txt")).toBe(`${LOCAL_SITE_URL}/robots.txt`);
  });

  it("prioriza a URL explícita sobre a URL de produção da Vercel", async () => {
    vi.stubEnv(EXPLICIT_SITE_URL_ENV, EXPLICIT_SITE_URL);
    vi.stubEnv(PRODUCTION_URL_ENV, PRODUCTION_HOST);
    const { SITE_URL } = await loadSite();
    expect(SITE_URL).toBe(EXPLICIT_SITE_URL);
  });

  it("usa a URL explícita fora da Vercel", async () => {
    vi.stubEnv(EXPLICIT_SITE_URL_ENV, EXPLICIT_SITE_URL);
    vi.stubEnv(PRODUCTION_URL_ENV, undefined);
    const { SITE_URL, absoluteUrl } = await loadSite();
    expect(SITE_URL).toBe(EXPLICIT_SITE_URL);
    expect(absoluteUrl("/sitemap.xml")).toBe(
      `${EXPLICIT_SITE_URL}/sitemap.xml`,
    );
  });

  it("normaliza a URL explícita para a origem", async () => {
    vi.stubEnv(EXPLICIT_SITE_URL_ENV, `${EXPLICIT_SITE_URL}/`);
    const { SITE_URL } = await loadSite();
    expect(SITE_URL).toBe(EXPLICIT_SITE_URL);
  });

  it("ignora a URL explícita vazia e cai para a URL de produção", async () => {
    vi.stubEnv(EXPLICIT_SITE_URL_ENV, "");
    vi.stubEnv(PRODUCTION_URL_ENV, PRODUCTION_HOST);
    const { SITE_URL } = await loadSite();
    expect(SITE_URL).toBe(`https://${PRODUCTION_HOST}`);
  });
});
