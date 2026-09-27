import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JsonLd } from "@/components/seo/JsonLd";
import { copy } from "@/lib/content/copy";
import { editions } from "@/lib/content/editions";
import { links } from "@/lib/content/links";
import { absoluteUrl } from "@/lib/site";

const JSON_LD_SELECTOR = 'script[type="application/ld+json"]';
const ORGANIZATION_TYPE = "Organization";
const PRODUCT_TYPE = "Product";

type GraphNode = {
  "@type": string;
  "@id"?: string;
  name?: string;
  url?: string;
  brand?: unknown;
  manufacturer?: unknown;
};

function readGraph(): GraphNode[] {
  const { container } = render(<JsonLd />);
  const script = container.querySelector(JSON_LD_SELECTOR);
  const parsed: { "@graph": GraphNode[] } = JSON.parse(
    script?.textContent ?? "",
  );
  return parsed["@graph"];
}

describe("JsonLd", () => {
  it("inclui a editora como Organization com @id absoluto", () => {
    const organizations = readGraph().filter(
      (node) => node["@type"] === ORGANIZATION_TYPE,
    );
    expect(organizations).toEqual([
      {
        "@type": ORGANIZATION_TYPE,
        "@id": absoluteUrl("/#organization"),
        name: copy.publisher,
        url: links.publisher,
      },
    ]);
  });

  it("referencia a Organization em brand e manufacturer de cada Product", () => {
    const organizationReference = { "@id": absoluteUrl("/#organization") };
    const products = readGraph().filter(
      (node) => node["@type"] === PRODUCT_TYPE,
    );
    expect(products).toHaveLength(editions.length);
    for (const product of products) {
      expect(product.brand).toEqual(organizationReference);
      expect(product.manufacturer).toEqual(organizationReference);
    }
  });
});
