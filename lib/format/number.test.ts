import { describe, expect, it } from "vitest";
import { pad } from "@/lib/format/number";

const SINGLE_DIGIT = 7;
const ZERO = 0;
const TWO_DIGITS = 42;
const THREE_DIGITS = 123;
const CUSTOM_LENGTH = 4;
const SHORTER_LENGTH = 1;

describe("pad", () => {
  it("completa com zeros até 2 dígitos por padrão", () => {
    expect(pad(SINGLE_DIGIT)).toBe("07");
    expect(pad(ZERO)).toBe("00");
  });

  it("mantém valores que já têm 2 dígitos", () => {
    expect(pad(TWO_DIGITS)).toBe("42");
  });

  it("respeita o comprimento customizado", () => {
    expect(pad(SINGLE_DIGIT, CUSTOM_LENGTH)).toBe("0007");
    expect(pad(THREE_DIGITS, CUSTOM_LENGTH)).toBe("0123");
  });

  it("não corta valores que excedem o comprimento", () => {
    expect(pad(THREE_DIGITS)).toBe("123");
    expect(pad(TWO_DIGITS, SHORTER_LENGTH)).toBe("42");
  });
});
