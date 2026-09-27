import { describe, expect, it } from "vitest";
import { createWheelGate, gateWheel } from "@/components/motion/wheelGate";

const POINTS = [0, 1000, 2000] as const;
const IDLE_MS = 200;
const TOLERANCE_PX = 2;
const STEP = 300;
const STRONG = 1500;
const TICK_MS = 16;
const PAUSE_MS = 400;
const START_MS = 10_000;
const MID_SCROLL = 500;
const INERTIA_START = 60;
const INERTIA_DECAY = 0.9;
const INERTIA_FRAMES = 40;
const FRESH_SWIPE = 45;
const INERTIA_TAIL = 1;
const MIN_LOCK_MS = 350;
const EARLY_MS = 100;

function wheel(
  state: ReturnType<typeof createWheelGate>,
  delta: number,
  target: number,
  nowMs: number,
  rawDelta = delta,
) {
  return gateWheel({
    state,
    delta,
    rawDelta,
    target,
    nowMs,
    idleMs: IDLE_MS,
    points: POINTS,
    tolerancePx: TOLERANCE_PX,
  });
}

describe("gateWheel", () => {
  it("deixa passar o scroll que não alcança o próximo ponto", () => {
    const state = createWheelGate();
    expect(wheel(state, STEP, 0, START_MS)).toBe(STEP);
    expect(state.locked).toBe(false);
  });

  it("corta um scroll forte no próximo ponto e trava o gesto", () => {
    const state = createWheelGate();
    expect(wheel(state, STRONG, MID_SCROLL, START_MS)).toBe(
      POINTS[1] - MID_SCROLL,
    );
    expect(state.locked).toBe(true);
  });

  it("ignora o resto do mesmo gesto, inclusive a inércia", () => {
    const state = createWheelGate();
    wheel(state, STRONG, MID_SCROLL, START_MS);
    expect(wheel(state, STRONG, POINTS[1], START_MS + TICK_MS)).toBe(0);
    expect(wheel(state, STEP, POINTS[1], START_MS + TICK_MS * 2)).toBe(0);
  });

  it("mantém a trava quando o limitador zera o delta no meio do gesto", () => {
    const state = createWheelGate();
    wheel(state, STRONG, MID_SCROLL, START_MS);
    expect(wheel(state, 0, POINTS[1], START_MS + TICK_MS, STRONG)).toBe(0);
    expect(state.locked).toBe(true);
    expect(wheel(state, STRONG, POINTS[1], START_MS + TICK_MS * 2)).toBe(0);
  });

  it("libera um novo gesto depois de uma pausa", () => {
    const state = createWheelGate();
    wheel(state, STRONG, MID_SCROLL, START_MS);
    expect(wheel(state, STEP, POINTS[1], START_MS + PAUSE_MS)).toBe(STEP);
    expect(state.locked).toBe(false);
  });

  it("libera imediatamente quando o gesto muda de direção", () => {
    const state = createWheelGate();
    wheel(state, STRONG, MID_SCROLL, START_MS);
    expect(wheel(state, -STEP, POINTS[1], START_MS + TICK_MS)).toBe(-STEP);
  });

  it("mantém a trava durante toda a inércia decrescente do trackpad", () => {
    const state = createWheelGate();
    wheel(state, STRONG, MID_SCROLL, START_MS);
    for (let frame = 1; frame <= INERTIA_FRAMES; frame += 1) {
      const delta = Math.max(
        1,
        Math.round(INERTIA_START * INERTIA_DECAY ** frame),
      );
      expect(wheel(state, delta, POINTS[1], START_MS + TICK_MS * frame)).toBe(
        0,
      );
    }
    expect(state.locked).toBe(true);
  });

  it("libera um novo swipe que chega antes da inércia acabar", () => {
    const state = createWheelGate();
    wheel(state, STRONG, MID_SCROLL, START_MS);
    const late = START_MS + MIN_LOCK_MS;
    wheel(state, INERTIA_TAIL, POINTS[1], late);
    expect(wheel(state, FRESH_SWIPE, POINTS[1], late + TICK_MS)).toBe(
      FRESH_SWIPE,
    );
    expect(state.locked).toBe(false);
  });

  it("não libera um aumento de força logo depois de travar", () => {
    const state = createWheelGate();
    wheel(state, STEP, MID_SCROLL + STEP, START_MS);
    wheel(state, INERTIA_TAIL, POINTS[1], START_MS + TICK_MS);
    expect(wheel(state, FRESH_SWIPE, POINTS[1], START_MS + EARLY_MS)).toBe(0);
    expect(state.locked).toBe(true);
  });

  it("corta também subindo", () => {
    const state = createWheelGate();
    expect(wheel(state, -STRONG, MID_SCROLL, START_MS)).toBe(
      POINTS[0] - MID_SCROLL,
    );
    expect(state.locked).toBe(true);
  });

  it("deixa passar livre quando não há ponto adiante", () => {
    const state = createWheelGate();
    expect(wheel(state, STRONG, POINTS[2], START_MS)).toBe(STRONG);
  });
});
