import { describe, expect, it } from "vitest";
import { editions } from "@/lib/content/editions";
import { faq } from "@/lib/content/faq";
import { formatBRL, formatInstallments } from "@/lib/format/currency";

const PRICES_ITEM_ID = "valores";
const INSTALLMENTS_OPENING = " (";
const INSTALLMENTS_OPENING_PATTERN = / \(/g;

function pricesAnswer(): string {
  const item = faq.find(({ id }) => id === PRICES_ITEM_ID);
  if (!item) {
    throw new Error(`Item de FAQ ausente: ${PRICES_ITEM_ID}`);
  }
  return item.answer;
}

describe("faq", () => {
  describe("resposta sobre valores", () => {
    it.each(editions)(
      "inclui o preço anual da edição $subtitle em BRL",
      ({ subtitle, price }) => {
        expect(pricesAnswer()).toContain(
          `${subtitle}, ${formatBRL(price.anual)}`,
        );
      },
    );

    it.each(editions)(
      "mostra parcelas da edição $subtitle apenas quando existem",
      ({ subtitle, price }) => {
        const annual = `${subtitle}, ${formatBRL(price.anual)}`;
        const answer = pricesAnswer();

        if (price.installments) {
          expect(answer).toContain(
            `${annual}${INSTALLMENTS_OPENING}${formatInstallments(
              price.installments.count,
              price.installments.value,
            )})`,
          );
        } else {
          expect(answer).not.toContain(`${annual}${INSTALLMENTS_OPENING}`);
        }
      },
    );

    it("não menciona mais parcelamentos do que as edições oferecem", () => {
      const withInstallments = editions.filter(({ price }) =>
        Boolean(price.installments),
      );
      const mentions = [
        ...pricesAnswer().matchAll(INSTALLMENTS_OPENING_PATTERN),
      ].length;

      expect(mentions).toBe(withInstallments.length);
    });
  });
});
