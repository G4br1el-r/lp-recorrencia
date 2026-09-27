import { describe, expect, it } from "vitest";
import { splitHighlight } from "@/lib/text/splitHighlight";

describe("splitHighlight", () => {
  it("devolve o texto inteiro sem destaque quando não há palavra", () => {
    expect(splitHighlight("E se começassem?")).toEqual([
      { text: "E se começassem?", highlighted: false, start: 0 },
    ]);
  });

  it("separa a palavra destacada do resto da frase", () => {
    expect(splitHighlight("com a Palavra?", "Palavra")).toEqual([
      { text: "com a ", highlighted: false, start: 0 },
      { text: "Palavra", highlighted: true, start: "com a ".length },
      { text: "?", highlighted: false, start: "com a Palavra".length },
    ]);
  });

  it("destaca todas as ocorrências", () => {
    expect(splitHighlight("Palavra e Palavra", "Palavra")).toEqual([
      { text: "Palavra", highlighted: true, start: 0 },
      { text: " e ", highlighted: false, start: "Palavra".length },
      { text: "Palavra", highlighted: true, start: "Palavra e ".length },
    ]);
  });

  it("não destaca nada quando a palavra não aparece", () => {
    expect(splitHighlight("Todos os dias.", "Palavra")).toEqual([
      { text: "Todos os dias.", highlighted: false, start: 0 },
    ]);
  });
});
