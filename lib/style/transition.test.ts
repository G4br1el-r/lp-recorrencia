import { describe, expect, it } from "vitest";
import { cssTransition, cubicBezier } from "@/lib/style/transition";

const SOFT_EASE = [0.22, 1, 0.36, 1] as const;
const ZOOM_SECONDS = 1.4;

describe("cubicBezier", () => {
  it("formata os quatro pontos da curva em CSS", () => {
    expect(cubicBezier(SOFT_EASE)).toBe("cubic-bezier(0.22, 1, 0.36, 1)");
  });
});

describe("cssTransition", () => {
  it("monta a transição com propriedade, duração e curva", () => {
    expect(cssTransition("transform", ZOOM_SECONDS, SOFT_EASE)).toBe(
      "transform 1.4s cubic-bezier(0.22, 1, 0.36, 1)",
    );
  });
});
