import { describe, expect, it } from "vitest";
import { nearestIndex } from "@/lib/carousel/nearestIndex";

const SLIDE_STEP_PX = 690;
const HALF = 0.5;
const SLIDE_COUNT = 6;
const STARTS = Array.from(
  { length: SLIDE_COUNT },
  (_, index) => index * SLIDE_STEP_PX,
);
const PAST_HALF_STEP_PX = 400;
const BEFORE_HALF_STEP_PX = 300;

describe("nearestIndex", () => {
  it("retorna o índice da posição mais próxima do alvo", () => {
    expect(nearestIndex(STARTS, PAST_HALF_STEP_PX)).toBe(1);
    expect(nearestIndex(STARTS, BEFORE_HALF_STEP_PX)).toBe(0);
  });

  it("retorna 0 para lista vazia", () => {
    expect(nearestIndex([], PAST_HALF_STEP_PX)).toBe(0);
  });

  it("mantém o primeiro índice em caso de empate", () => {
    expect(nearestIndex(STARTS, SLIDE_STEP_PX * HALF)).toBe(0);
  });
});
