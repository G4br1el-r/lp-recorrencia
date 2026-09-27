import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ScrollTrigger } from "@/components/motion/gsap";
import {
  canSettle,
  gatePoints,
  landingPoint,
  type PinnedRange,
  pinnedRange,
  snapStops,
  snapTarget,
} from "@/components/motion/snap";
import { gateBoundary } from "@/components/motion/wheelGate";

const { getAll } = vi.hoisted(() => ({
  getAll: vi.fn<() => ScrollTrigger[]>(),
}));

vi.mock("@/components/motion/gsap", () => ({
  ScrollTrigger: { getAll },
}));

const FIRST_START = 100;
const FIRST_END = 500;
const SECOND_START = 800;
const SECOND_END = 1200;
const TIMELINE_DURATION = 2;
const ZERO_DURATION = 0;
const STOP_MIDDLE = 1;
const STOP_END = 2;
const FIRST_MIDDLE_POINT = 300;
const OUTSIDE_PINS = 650;
const INSIDE_FIRST = 200;
const STOPS_READS = 2;

const ADVANCE = 0.2;
const TOLERANCE_PX = 2;
const DOWN = 1;
const UP = -1;
const RANGE: PinnedRange = { start: 0, end: 1000, points: [200, 400, 600] };
const NEAR_REST = 201;
const PAST_ADVANCE = 250;
const SHORT_OF_ADVANCE = 230;
const BACK_PAST_ADVANCE = 340;
const BACK_SHORT_OF_ADVANCE = 370;
const BEFORE_FIRST_REST = 120;
const AFTER_LAST_REST = 700;

type FakeTriggerInit = {
  start: number;
  end: number;
  pin?: Element;
  duration?: number;
};

function fakeTrigger({
  start,
  end,
  pin = document.createElement("section"),
  duration,
}: FakeTriggerInit): ScrollTrigger {
  const animation =
    duration === undefined ? undefined : { duration: () => duration };
  const trigger = { start, end, pin, animation };
  return trigger as unknown as ScrollTrigger;
}

function fakeTimeline(trigger: ScrollTrigger | undefined): gsap.core.Timeline {
  return { scrollTrigger: trigger } as unknown as gsap.core.Timeline;
}

function registerTriggers(...triggers: ScrollTrigger[]): void {
  getAll.mockReturnValue(triggers);
}

function snap(y: number, direction: number) {
  return snapTarget({
    y,
    direction,
    range: RANGE,
    advance: ADVANCE,
    tolerancePx: TOLERANCE_PX,
  });
}

describe("pinnedRange", () => {
  beforeEach(() => {
    getAll.mockReset();
  });

  it("retorna null fora de qualquer seção pinada", () => {
    registerTriggers(
      fakeTrigger({ start: FIRST_START, end: FIRST_END }),
      fakeTrigger({ start: SECOND_START, end: SECOND_END }),
    );
    expect(pinnedRange(OUTSIDE_PINS)).toBeNull();
  });

  it("converte os stops da seção atual em posições ordenadas", () => {
    const trigger = fakeTrigger({
      start: FIRST_START,
      end: FIRST_END,
      duration: TIMELINE_DURATION,
    });
    snapStops(fakeTimeline(trigger), [STOP_END, STOP_MIDDLE]);
    registerTriggers(trigger);

    expect(pinnedRange(INSIDE_FIRST)).toEqual({
      start: FIRST_START,
      end: FIRST_END,
      points: [FIRST_MIDDLE_POINT, FIRST_END],
    });
  });

  it("avalia stops definidos como função a cada leitura", () => {
    const trigger = fakeTrigger({
      start: FIRST_START,
      end: FIRST_END,
      duration: TIMELINE_DURATION,
    });
    const stops = vi.fn(() => [STOP_MIDDLE]);
    snapStops(fakeTimeline(trigger), stops);
    registerTriggers(trigger);

    expect(pinnedRange(INSIDE_FIRST)?.points).toEqual([FIRST_MIDDLE_POINT]);
    stops.mockReturnValue([STOP_END]);
    expect(pinnedRange(INSIDE_FIRST)?.points).toEqual([FIRST_END]);
    expect(stops).toHaveBeenCalledTimes(STOPS_READS);
  });

  it("não tem pontos quando a animação não tem duração", () => {
    const trigger = fakeTrigger({
      start: FIRST_START,
      end: FIRST_END,
      duration: ZERO_DURATION,
    });
    snapStops(fakeTimeline(trigger), [STOP_MIDDLE]);
    registerTriggers(trigger);

    expect(pinnedRange(INSIDE_FIRST)?.points).toEqual([]);
  });

  it("ignora triggers sem pin", () => {
    const unpinned = {
      start: FIRST_START,
      end: FIRST_END,
      pin: undefined,
    } as unknown as ScrollTrigger;
    registerTriggers(unpinned);

    expect(pinnedRange(INSIDE_FIRST)).toBeNull();
  });

  it("não registra stops em timeline sem scrollTrigger", () => {
    const trigger = fakeTrigger({
      start: FIRST_START,
      end: FIRST_END,
      duration: TIMELINE_DURATION,
    });
    snapStops(fakeTimeline(undefined), [STOP_MIDDLE]);
    registerTriggers(trigger);

    expect(pinnedRange(INSIDE_FIRST)?.points).toEqual([]);
  });
});

describe("landingPoint", () => {
  beforeEach(() => {
    getAll.mockReset();
  });

  it("retorna null quando nenhum trigger fixa a seção", () => {
    registerTriggers(fakeTrigger({ start: FIRST_START, end: FIRST_END }));
    expect(landingPoint(document.createElement("section"))).toBeNull();
  });

  it("retorna o primeiro ponto de descanso da seção", () => {
    const section = document.createElement("section");
    const trigger = fakeTrigger({
      start: FIRST_START,
      end: FIRST_END,
      pin: section,
      duration: TIMELINE_DURATION,
    });
    snapStops(fakeTimeline(trigger), [STOP_END, STOP_MIDDLE]);
    registerTriggers(
      fakeTrigger({ start: SECOND_START, end: SECOND_END }),
      trigger,
    );

    expect(landingPoint(section)).toBe(FIRST_MIDDLE_POINT);
  });

  it("cai para trigger.start quando não há stops", () => {
    const section = document.createElement("section");
    registerTriggers(
      fakeTrigger({
        start: SECOND_START,
        end: SECOND_END,
        pin: section,
        duration: TIMELINE_DURATION,
      }),
    );

    expect(landingPoint(section)).toBe(SECOND_START);
  });
});

describe("snapTarget", () => {
  it("não encaixa quando já está num ponto de descanso", () => {
    expect(snap(NEAR_REST, DOWN)).toBeNull();
  });

  it("avança para o próximo ponto depois de um toque para baixo", () => {
    expect(snap(PAST_ADVANCE, DOWN)).toBe(RANGE.points[1]);
  });

  it("volta ao ponto anterior se o toque para baixo foi curto demais", () => {
    expect(snap(SHORT_OF_ADVANCE, DOWN)).toBe(RANGE.points[0]);
  });

  it("recua para o ponto anterior depois de um toque para cima", () => {
    expect(snap(BACK_PAST_ADVANCE, UP)).toBe(RANGE.points[0]);
  });

  it("volta ao ponto seguinte se o toque para cima foi curto demais", () => {
    expect(snap(BACK_SHORT_OF_ADVANCE, UP)).toBe(RANGE.points[1]);
  });

  it("pousa no primeiro ponto ao entrar na cena descendo", () => {
    expect(snap(BEFORE_FIRST_REST, DOWN)).toBe(RANGE.points[0]);
  });

  it("deixa sair da cena por cima livremente", () => {
    expect(snap(BEFORE_FIRST_REST, UP)).toBeNull();
  });

  it("deixa sair da cena por baixo livremente", () => {
    expect(snap(AFTER_LAST_REST, DOWN)).toBeNull();
  });

  it("pousa no último ponto ao entrar na cena subindo", () => {
    expect(snap(AFTER_LAST_REST, UP)).toBe(RANGE.points[2]);
  });

  it("não encaixa numa cena sem pontos de descanso", () => {
    expect(
      snapTarget({
        y: PAST_ADVANCE,
        direction: DOWN,
        range: { ...RANGE, points: [] },
        advance: ADVANCE,
        tolerancePx: TOLERANCE_PX,
      }),
    ).toBeNull();
  });
});

describe("gatePoints", () => {
  beforeEach(() => {
    getAll.mockReset();
  });

  it("junta início, repousos e fim de cada seção pinada em ordem", () => {
    const second = fakeTrigger({
      start: SECOND_START,
      end: SECOND_END,
      duration: TIMELINE_DURATION,
    });
    const first = fakeTrigger({
      start: FIRST_START,
      end: FIRST_END,
      duration: TIMELINE_DURATION,
    });
    snapStops(fakeTimeline(first), [STOP_MIDDLE]);
    registerTriggers(second, first);

    expect(gatePoints()).toEqual([
      FIRST_START,
      FIRST_MIDDLE_POINT,
      FIRST_END,
      SECOND_START,
      SECOND_END,
    ]);
  });

  it("ignora triggers sem pin", () => {
    registerTriggers({
      start: FIRST_START,
      end: FIRST_END,
      pin: undefined,
    } as unknown as ScrollTrigger);
    expect(gatePoints()).toEqual([]);
  });
});

describe("gateBoundary", () => {
  const points = RANGE.points;

  it("acha o próximo ponto descendo", () => {
    expect(
      gateBoundary({
        current: PAST_ADVANCE,
        direction: DOWN,
        points,
        tolerancePx: TOLERANCE_PX,
      }),
    ).toBe(points[1]);
  });

  it("acha o ponto anterior subindo", () => {
    expect(
      gateBoundary({
        current: PAST_ADVANCE,
        direction: UP,
        points,
        tolerancePx: TOLERANCE_PX,
      }),
    ).toBe(points[0]);
  });

  it("pula o ponto em que já está parado", () => {
    expect(
      gateBoundary({
        current: NEAR_REST,
        direction: DOWN,
        points,
        tolerancePx: TOLERANCE_PX,
      }),
    ).toBe(points[1]);
  });

  it("retorna null sem ponto na direção ou sem direção", () => {
    expect(
      gateBoundary({
        current: AFTER_LAST_REST,
        direction: DOWN,
        points,
        tolerancePx: TOLERANCE_PX,
      }),
    ).toBeNull();
    expect(
      gateBoundary({
        current: PAST_ADVANCE,
        direction: 0,
        points,
        tolerancePx: TOLERANCE_PX,
      }),
    ).toBeNull();
  });
});

describe("canSettle", () => {
  const released = {
    isStopped: false,
    isScrolling: false,
    touching: false,
  } as const;

  it("encaixa depois que a rolagem suave parou", () => {
    expect(canSettle(released)).toBe(true);
  });

  it("não encaixa com o scroll parado pelo Lenis", () => {
    expect(canSettle({ ...released, isStopped: true })).toBe(false);
  });

  it("não encaixa enquanto o dedo está na tela", () => {
    expect(canSettle({ ...released, touching: true })).toBe(false);
  });

  it("não encaixa rolagem nativa, como arrastar a barra de rolagem", () => {
    expect(canSettle({ ...released, isScrolling: "native" })).toBe(false);
  });
});
