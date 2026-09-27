import { describe, expect, it } from "vitest";
import {
  formatBRL,
  formatInstallments,
  priceParts,
} from "@/lib/format/currency";

const ANY_WHITESPACE = /\s/g;
const PLAIN_SPACE = " ";

const ZERO_PRICE = 0;
const WHOLE_PRICE = 100;
const SMALL_PRICE_WITH_CENTS = 7.22;
const PRICE_WITH_ONE_DECIMAL = 101.9;
const LARGER_PRICE_WITH_ONE_DECIMAL = 135.9;
const PRICE_WITH_THOUSANDS = 1234.5;

const SINGLE_INSTALLMENT = 1;
const MULTIPLE_INSTALLMENTS = 3;
const INSTALLMENT_VALUE = 33.97;

function normalizeSpaces(value: string): string {
  return value.replace(ANY_WHITESPACE, PLAIN_SPACE);
}

describe("formatBRL", () => {
  it.each([
    { value: ZERO_PRICE, expected: "R$ 0,00" },
    { value: WHOLE_PRICE, expected: "R$ 100,00" },
    { value: SMALL_PRICE_WITH_CENTS, expected: "R$ 7,22" },
    { value: PRICE_WITH_ONE_DECIMAL, expected: "R$ 101,90" },
    { value: LARGER_PRICE_WITH_ONE_DECIMAL, expected: "R$ 135,90" },
    { value: PRICE_WITH_THOUSANDS, expected: "R$ 1.234,50" },
  ])("formata $value como $expected", ({ value, expected }) => {
    expect(normalizeSpaces(formatBRL(value))).toBe(expected);
  });

  it("usa o mesmo separador entre símbolo e valor que o Intl", () => {
    const reference = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(PRICE_WITH_ONE_DECIMAL);
    expect(formatBRL(PRICE_WITH_ONE_DECIMAL)).toBe(reference);
  });
});

describe("priceParts", () => {
  it.each([
    { value: ZERO_PRICE, whole: "0", fraction: ",00" },
    { value: WHOLE_PRICE, whole: "100", fraction: ",00" },
    { value: SMALL_PRICE_WITH_CENTS, whole: "7", fraction: ",22" },
    { value: PRICE_WITH_ONE_DECIMAL, whole: "101", fraction: ",90" },
    { value: LARGER_PRICE_WITH_ONE_DECIMAL, whole: "135", fraction: ",90" },
    { value: PRICE_WITH_THOUSANDS, whole: "1.234", fraction: ",50" },
  ])("separa $value em partes", ({ value, whole, fraction }) => {
    expect(priceParts(value)).toEqual({ currency: "R$", whole, fraction });
  });

  it("recompõe o valor formatado sem perder dígitos", () => {
    const parts = priceParts(PRICE_WITH_THOUSANDS);
    expect(
      normalizeSpaces(`${parts.currency} ${parts.whole}${parts.fraction}`),
    ).toBe(normalizeSpaces(formatBRL(PRICE_WITH_THOUSANDS)));
  });
});

describe("formatInstallments", () => {
  it("formata uma única parcela", () => {
    expect(
      normalizeSpaces(
        formatInstallments(SINGLE_INSTALLMENT, PRICE_WITH_ONE_DECIMAL),
      ),
    ).toBe("ou até 1x de R$ 101,90");
  });

  it("formata múltiplas parcelas", () => {
    expect(
      normalizeSpaces(
        formatInstallments(MULTIPLE_INSTALLMENTS, INSTALLMENT_VALUE),
      ),
    ).toBe("ou até 3x de R$ 33,97");
  });

  it("reaproveita formatBRL para o valor da parcela", () => {
    expect(formatInstallments(MULTIPLE_INSTALLMENTS, INSTALLMENT_VALUE)).toBe(
      `ou até ${MULTIPLE_INSTALLMENTS}x de ${formatBRL(INSTALLMENT_VALUE)}`,
    );
  });
});
