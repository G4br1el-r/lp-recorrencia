import { describe, expect, it } from "vitest";
import {
  ALLOWED_EXTERNAL_HOSTS,
  isSafeHref,
  toSafeHref,
} from "@/lib/security/safeHref";

const [ALLOWED_HOST] = ALLOWED_EXTERNAL_HOSTS;

const SAFE_HREFS = [
  "#planos",
  "#",
  "/",
  "/assinatura/planos",
  `https://${ALLOWED_HOST}`,
  `https://${ALLOWED_HOST}/assinatura?plano=anual`,
] as const;

const UNSAFE_HREFS = [
  "//evil.com",
  "/\\evil.com",
  "javascript:alert(1)",
  "JavaScript:alert(1)",
  `http://${ALLOWED_HOST}`,
  "https://evil.com",
  `https://${ALLOWED_HOST}.evil.com`,
  `https://usuario:senha@${ALLOWED_HOST}`,
  `https://usuario@${ALLOWED_HOST}`,
  "mailto:contato@evil.com",
  "",
  "caminho-relativo",
] as const;

describe("isSafeHref", () => {
  it("tem ao menos um host externo permitido", () => {
    expect(ALLOWED_HOST).toBeTruthy();
  });

  it.each(SAFE_HREFS)("aceita %s", (href) => {
    expect(isSafeHref(href)).toBe(true);
  });

  it.each(UNSAFE_HREFS)("rejeita %s", (href) => {
    expect(isSafeHref(href)).toBe(false);
  });
});

describe("toSafeHref", () => {
  it.each(SAFE_HREFS)("devolve %s intacto", (href) => {
    expect(toSafeHref(href)).toBe(href);
  });

  it.each(UNSAFE_HREFS)("devolve undefined para %s", (href) => {
    expect(toSafeHref(href)).toBeUndefined();
  });
});
