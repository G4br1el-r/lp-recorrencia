import { siteAssets } from "@/lib/assets";
import { copy } from "@/lib/content/copy";
import { editions } from "@/lib/content/editions";
import { faq } from "@/lib/content/faq";
import { links } from "@/lib/content/links";
import { plans } from "@/lib/content/plans";
import { serializeJsonLd } from "@/lib/security/jsonLd";
import { absoluteUrl } from "@/lib/site";

const SCHEMA_CONTEXT = "https://schema.org";
const PRICE_CURRENCY = "BRL";
const ORGANIZATION_ID = absoluteUrl("/#organization");
const organizationReference = { "@id": ORGANIZATION_ID };

const organization = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: copy.publisher,
  url: links.publisher,
};

const faqPage = {
  "@type": "FAQPage",
  mainEntity: faq.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

const products = editions.map((edition) => {
  const prices = plans.map((plan) => edition.price[plan.id]);
  return {
    "@type": "Product",
    name: `${edition.name} — ${edition.subtitle}`,
    description: edition.tagline,
    image: absoluteUrl(siteAssets.products[edition.id]),
    url: absoluteUrl("/"),
    brand: organizationReference,
    manufacturer: organizationReference,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: PRICE_CURRENCY,
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: plans.length,
      offers: plans.map((plan) => ({
        "@type": "Offer",
        name: `${plan.name} (${plan.period})`,
        price: edition.price[plan.id],
        priceCurrency: PRICE_CURRENCY,
        url: absoluteUrl(links.plans),
      })),
    },
  };
});

const graph = {
  "@context": SCHEMA_CONTEXT,
  "@graph": [organization, faqPage, ...products],
};

export function JsonLd() {
  return <script type="application/ld+json">{serializeJsonLd(graph)}</script>;
}
