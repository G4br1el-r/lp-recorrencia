import { describe, expect, it } from "vitest";
import {
  ARRIVE,
  arriveState,
  FLOW,
  flowAt,
  flowState,
  holdMiddle,
  holdStart,
  LEAVE,
  leaveState,
  presenceAt,
  SELECTOR_STEPS,
  TIMING,
} from "@/components/sections/selectorFlow";

const LAST_STEP = SELECTOR_STEPS - 1;
const CENTER = 0;
const RIGHT = 1;
const LEFT = -1;
const FAR_RIGHT = 3;
const NO_SWAY = 0;
const HALF = 0.5;

describe("selectorFlow", () => {
  it("encadeia os repousos com hold e movimento", () => {
    expect(holdStart(0)).toBe(TIMING.start);
    expect(holdStart(1)).toBeCloseTo(TIMING.start + TIMING.hold + TIMING.move);
    expect(holdMiddle(0)).toBeCloseTo(TIMING.start + TIMING.hold * HALF);
  });

  it("deixa todos os repousos antes da saída", () => {
    expect(holdStart(LAST_STEP) + TIMING.hold).toBeLessThanOrEqual(LEAVE.at);
  });

  it("centraliza o livro ativo sem blur e com opacidade total", () => {
    const state = flowState(CENTER, NO_SWAY);
    expect(state.xVw).toBe(FLOW.centerXVw);
    expect(state.scale).toBe(1);
    expect(state.opacity).toBe(1);
    expect(state.blurPx).toBe(0);
  });

  it("espelha os vizinhos dos dois lados", () => {
    const right = flowState(RIGHT, NO_SWAY);
    const left = flowState(LEFT, NO_SWAY);
    expect(right.xVw - FLOW.centerXVw).toBeCloseTo(FLOW.spacingVw);
    expect(left.xVw - FLOW.centerXVw).toBeCloseTo(-FLOW.spacingVw);
    expect(right.rotationY).toBeCloseTo(-left.rotationY);
    expect(right.scale).toBeCloseTo(FLOW.sideScale);
  });

  it("esconde livros além da distância máxima", () => {
    expect(flowState(FAR_RIGHT, NO_SWAY).opacity).toBe(0);
  });

  it("avança um passo inteiro por movimento", () => {
    expect(flowAt(0)).toBe(0);
    expect(flowAt(holdMiddle(1))).toBeCloseTo(1);
    expect(flowAt(holdMiddle(LAST_STEP))).toBeCloseTo(LAST_STEP);
  });

  it("aparece na chegada e some na saída", () => {
    expect(presenceAt(0)).toBe(0);
    expect(presenceAt(holdMiddle(1))).toBe(1);
    expect(presenceAt(1)).toBe(0);
  });

  it("entra por baixo invisível e sai encolhendo", () => {
    expect(arriveState(RIGHT)).toMatchObject({
      yVh: ARRIVE.fromYVh,
      opacity: 0,
    });
    expect(leaveState(CENTER)).toMatchObject({
      yVh: LEAVE.yVh,
      scale: LEAVE.scale,
      opacity: 0,
    });
  });
});
