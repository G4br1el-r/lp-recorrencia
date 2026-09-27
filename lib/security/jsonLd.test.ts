import { describe, expect, it } from "vitest";
import { serializeJsonLd } from "@/lib/security/jsonLd";

const ESCAPED_LESS_THAN = "\\u003c";
const ESCAPED_LESS_THAN_PATTERN = /\\u003c/g;
const LESS_THAN = "<";
const EDITIONS_COUNT = 3;
const SCRIPT_BREAKOUT = "</script><script>alert(1)</script>";

describe("serializeJsonLd", () => {
  it("escapa < para impedir o fechamento da tag script", () => {
    const output = serializeJsonLd({ name: SCRIPT_BREAKOUT });

    expect(output).not.toContain(LESS_THAN);
    expect(output).not.toContain("</script>");
    expect(output).toContain(`${ESCAPED_LESS_THAN}/script>`);
  });

  it("produz JSON válido com o mesmo conteúdo", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: SCRIPT_BREAKOUT,
      offers: [{ price: "101.90", priceCurrency: "BRL" }],
    };

    const output = serializeJsonLd(data);

    expect(JSON.parse(output)).toEqual(data);
    expect(
      JSON.parse(output.replace(ESCAPED_LESS_THAN_PATTERN, LESS_THAN)),
    ).toEqual(data);
  });

  it("não altera dados sem <", () => {
    const data = { name: "Deus Conosco", count: EDITIONS_COUNT };
    expect(serializeJsonLd(data)).toBe(JSON.stringify(data));
  });
});
