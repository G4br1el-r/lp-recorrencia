import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ScrollTrigger } from "@/components/motion/gsap";
import { createStageState } from "@/components/motion/stage";
import {
  holdUntilPinEnd,
  pinEnd,
  pinnedTimeline,
  type SceneContext,
  useScene,
} from "@/components/motion/useScene";
import { GSAP_EASE, MEDIA, SCRUB } from "@/lib/constants/motion";

type MatchMediaCallback = (context: gsap.Context) => unknown;

const mocks = vi.hoisted(() => ({
  timeline: vi.fn<(vars: gsap.TimelineVars) => gsap.core.Timeline>(),
  add: vi.fn<
    (conditions: gsap.Conditions, callback: MatchMediaCallback) => void
  >(),
  selector: vi.fn<(scope: Element) => gsap.utils.SelectorFunc>(),
  useStage: vi.fn(),
}));

vi.mock("@/components/motion/gsap", () => ({
  gsap: {
    timeline: mocks.timeline,
    matchMedia: () => ({ add: mocks.add }),
    utils: { selector: mocks.selector },
  },
  useGSAP: (callback: () => void) => {
    callback();
  },
}));

vi.mock("@/components/motion/ProductStage", () => ({
  useStage: mocks.useStage,
}));

const VIEWPORT_HEIGHT = 1000;
const RESIZED_VIEWPORT_HEIGHT = 500;
const PIN_LENGTH = { desktop: 240, mobile: 180 };
const DESKTOP_END = "+=2400";
const MOBILE_END = "+=1800";
const RESIZED_DESKTOP_END = "+=1200";
const PIN_DISTANCE_PX = 750;
const CUSTOM_SCRUB = 0.5;
const ANTICIPATE_PIN = 1;
const HOLD_POSITION = 1;
const TIMELINE_ID = "cena-teste";

const FAKE_TIMELINE = { id: "timeline" } as unknown as gsap.core.Timeline;
const FAKE_SELF = {} as ScrollTrigger;

function isScrollTriggerVars(value: unknown): value is ScrollTrigger.Vars {
  return (
    typeof value === "object" &&
    value !== null &&
    !(value instanceof Element) &&
    "trigger" in value
  );
}

function lastTimelineVars(): gsap.TimelineVars {
  const vars = mocks.timeline.mock.lastCall?.[0];
  if (!vars) {
    throw new Error("gsap.timeline não foi chamado");
  }
  return vars;
}

function lastScrollTrigger(): ScrollTrigger.Vars {
  const scrollTrigger = lastTimelineVars().scrollTrigger;
  if (!isScrollTriggerVars(scrollTrigger)) {
    throw new Error("scrollTrigger ausente");
  }
  return scrollTrigger;
}

function resolveEnd(vars: ScrollTrigger.Vars): string | number | undefined {
  const { end } = vars;
  return typeof end === "function" ? end(FAKE_SELF) : end;
}

function sceneContext(isDesktop: boolean) {
  return { section: document.createElement("section"), isDesktop };
}

describe("pinEnd", () => {
  beforeEach(() => {
    vi.stubGlobal("innerHeight", VIEWPORT_HEIGHT);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("usa o comprimento desktop", () => {
    expect(pinEnd(true, PIN_LENGTH)()).toBe(DESKTOP_END);
  });

  it("usa o comprimento mobile", () => {
    expect(pinEnd(false, PIN_LENGTH)()).toBe(MOBILE_END);
  });

  it("recalcula com a altura atual da janela", () => {
    const end = pinEnd(true, PIN_LENGTH);
    vi.stubGlobal("innerHeight", RESIZED_VIEWPORT_HEIGHT);
    expect(end()).toBe(RESIZED_DESKTOP_END);
  });
});

describe("pinnedTimeline", () => {
  beforeEach(() => {
    vi.stubGlobal("innerHeight", VIEWPORT_HEIGHT);
    mocks.timeline.mockReset();
    mocks.timeline.mockReturnValue(FAKE_TIMELINE);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("aplica os defaults de pin e scrub", () => {
    const context = sceneContext(true);

    const result = pinnedTimeline(context, PIN_LENGTH);

    expect(result).toBe(FAKE_TIMELINE);
    expect(lastTimelineVars().defaults).toEqual({
      ease: GSAP_EASE.linear,
      lazy: false,
    });
    const scrollTrigger = lastScrollTrigger();
    expect(scrollTrigger).toMatchObject({
      trigger: context.section,
      start: "top top",
      pin: true,
      anticipatePin: ANTICIPATE_PIN,
      scrub: SCRUB.immediate,
      invalidateOnRefresh: true,
    });
    expect(scrollTrigger.id).toBeUndefined();
    expect(scrollTrigger.onUpdate).toBeUndefined();
  });

  it("calcula o fim a partir do comprimento em vh no desktop", () => {
    pinnedTimeline(sceneContext(true), PIN_LENGTH);
    expect(resolveEnd(lastScrollTrigger())).toBe(DESKTOP_END);
  });

  it("calcula o fim a partir do comprimento em vh no mobile", () => {
    pinnedTimeline(sceneContext(false), PIN_LENGTH);
    expect(resolveEnd(lastScrollTrigger())).toBe(MOBILE_END);
  });

  it("aceita comprimento como função de distância em px", () => {
    const distance = vi.fn(() => PIN_DISTANCE_PX);

    pinnedTimeline(sceneContext(true), distance);

    expect(distance).not.toHaveBeenCalled();
    expect(resolveEnd(lastScrollTrigger())).toBe(`+=${PIN_DISTANCE_PX}`);
    expect(distance).toHaveBeenCalledOnce();
  });

  it("respeita as opções informadas", () => {
    const onUpdate = vi.fn();

    pinnedTimeline(sceneContext(true), PIN_LENGTH, {
      scrub: CUSTOM_SCRUB,
      pin: false,
      id: TIMELINE_ID,
      onUpdate,
    });

    expect(lastScrollTrigger()).toMatchObject({
      scrub: CUSTOM_SCRUB,
      pin: false,
      id: TIMELINE_ID,
      onUpdate,
    });
  });
});

describe("holdUntilPinEnd", () => {
  it("adiciona um set vazio no fim da timeline", () => {
    const set = vi.fn();
    const timeline = { set } as unknown as gsap.core.Timeline;

    holdUntilPinEnd(timeline);

    expect(set).toHaveBeenCalledWith({}, {}, HOLD_POSITION);
  });
});

describe("useScene", () => {
  const stage = createStageState();
  const select = vi.fn() as unknown as gsap.utils.SelectorFunc;

  beforeEach(() => {
    mocks.add.mockReset();
    mocks.selector.mockReset();
    mocks.selector.mockReturnValue(select);
    mocks.useStage.mockReturnValue(stage);
  });

  function captureMediaCallback(): MatchMediaCallback {
    const callback = mocks.add.mock.lastCall?.[1];
    if (!callback) {
      throw new Error("matchMedia.add não foi chamado");
    }
    return callback;
  }

  function runMedia(conditions: gsap.Conditions): unknown {
    return captureMediaCallback()({ conditions } as unknown as gsap.Context);
  }

  it("registra as media queries de desktop, mobile e movimento", () => {
    const section = document.createElement("section");
    renderHook(() => useScene({ current: section }, vi.fn()));

    expect(mocks.add.mock.lastCall?.[0]).toEqual({
      desktop: MEDIA.desktop,
      mobile: MEDIA.mobile,
      allow: MEDIA.allowMotion,
    });
  });

  it("chama build com o contexto da cena e devolve o cleanup", () => {
    const section = document.createElement("section");
    const cleanup = vi.fn();
    const build = vi.fn<(context: SceneContext) => unknown>(() => cleanup);
    renderHook(() => useScene({ current: section }, build));

    const result = runMedia({ desktop: true, mobile: false, allow: true });

    expect(build).toHaveBeenCalledWith({
      isDesktop: true,
      section,
      select,
      books: stage.books,
      hover: stage.hover,
      light: stage.light,
    });
    expect(mocks.selector).toHaveBeenCalledWith(section);
    expect(result).toBe(cleanup);
  });

  it("marca isDesktop falso no mobile e ignora retorno que não é função", () => {
    const section = document.createElement("section");
    const build = vi.fn<(context: SceneContext) => unknown>(
      () => FAKE_TIMELINE,
    );
    renderHook(() => useScene({ current: section }, build));

    const result = runMedia({ desktop: false, mobile: true, allow: true });

    expect(build.mock.lastCall?.[0].isDesktop).toBe(false);
    expect(result).toBeUndefined();
  });

  it("não constrói a cena com movimento reduzido", () => {
    const build = vi.fn();
    renderHook(() =>
      useScene({ current: document.createElement("section") }, build),
    );

    runMedia({ desktop: true, mobile: false, allow: false });

    expect(build).not.toHaveBeenCalled();
  });

  it("não constrói a cena sem seção montada", () => {
    const build = vi.fn();
    renderHook(() => useScene({ current: null }, build));

    runMedia({ desktop: true, mobile: false, allow: true });

    expect(build).not.toHaveBeenCalled();
  });
});
