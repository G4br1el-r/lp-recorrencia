import { describe, expect, it } from "vitest";
import {
  limitTouchInertia,
  projectedInertia,
} from "@/components/motion/touchInertia";

const TARGET = 1000;
const MAX_TRAVEL = 400;
const TOLERANCE_PX = 2;
const SHORT_FLING = 150;
const STRONG_FLING = 5000;
const NEXT_POINT = 1200;
const PREVIOUS_POINT = 850;
const FAR_POINT = 3000;
const INERTIA_EXPONENT = 1.7;
const VELOCITY = 20;
const DOWNWARD_DELTA = 8;
const UPWARD_DELTA = -8;

function limit(inertia: number, points: readonly number[] = []) {
  return limitTouchInertia({
    inertia,
    target: TARGET,
    maxTravel: MAX_TRAVEL,
    points,
    tolerancePx: TOLERANCE_PX,
  });
}

describe("projectedInertia", () => {
  it("segue a fórmula de inércia do Lenis na direção do gesto", () => {
    const expected = VELOCITY ** INERTIA_EXPONENT;

    expect(
      projectedInertia(DOWNWARD_DELTA, VELOCITY, INERTIA_EXPONENT),
    ).toBeCloseTo(expected);
    expect(
      projectedInertia(UPWARD_DELTA, -VELOCITY, INERTIA_EXPONENT),
    ).toBeCloseTo(-expected);
  });
});

describe("limitTouchInertia", () => {
  it("mantém uma inércia curta intacta", () => {
    expect(limit(SHORT_FLING)).toBe(SHORT_FLING);
    expect(limit(-SHORT_FLING)).toBe(-SHORT_FLING);
  });

  it("limita um arrasto forte à distância máxima fora das cenas", () => {
    expect(limit(STRONG_FLING)).toBe(MAX_TRAVEL);
    expect(limit(-STRONG_FLING)).toBe(-MAX_TRAVEL);
  });

  it("para no próximo ponto da cena na direção do gesto", () => {
    expect(limit(STRONG_FLING, [PREVIOUS_POINT, NEXT_POINT])).toBe(
      NEXT_POINT - TARGET,
    );
    expect(limit(-STRONG_FLING, [PREVIOUS_POINT, NEXT_POINT])).toBe(
      PREVIOUS_POINT - TARGET,
    );
  });

  it("usa a distância máxima quando o próximo ponto está mais longe", () => {
    expect(limit(STRONG_FLING, [FAR_POINT])).toBe(MAX_TRAVEL);
  });

  it("não se move sem inércia", () => {
    expect(limit(0, [NEXT_POINT])).toBe(0);
  });
});
