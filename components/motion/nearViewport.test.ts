import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  whenInteracted,
  whenNearViewport,
} from "@/components/motion/nearViewport";

const ROOT_MARGIN = "100% 0px";
const SCROLLED_Y = 480;
const TOP_Y = 0;
const INTERACTION_EVENTS = [
  "scroll",
  "wheel",
  "touchstart",
  "pointerdown",
  "keydown",
] as const;

function setScrollY(value: number): void {
  Object.defineProperty(window, "scrollY", { configurable: true, value });
}

describe("whenInteracted", () => {
  beforeEach(() => {
    setScrollY(TOP_Y);
  });

  afterEach(() => {
    setScrollY(TOP_Y);
  });

  it("não dispara antes de uma interação", () => {
    const onInteract = vi.fn();

    const stop = whenInteracted(onInteract);

    expect(onInteract).not.toHaveBeenCalled();
    stop();
  });

  it.each(INTERACTION_EVENTS)("dispara no evento %s", (type) => {
    const onInteract = vi.fn();
    whenInteracted(onInteract);

    window.dispatchEvent(new Event(type));

    expect(onInteract).toHaveBeenCalledOnce();
  });

  it("dispara uma única vez em interações seguidas", () => {
    const onInteract = vi.fn();
    whenInteracted(onInteract);

    window.dispatchEvent(new Event("wheel"));
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("touchstart"));

    expect(onInteract).toHaveBeenCalledOnce();
  });

  it("o cleanup remove os listeners antes de disparar", () => {
    const onInteract = vi.fn();
    const stop = whenInteracted(onInteract);

    stop();
    window.dispatchEvent(new Event("scroll"));

    expect(onInteract).not.toHaveBeenCalled();
  });

  it("dispara de imediato quando a página já está rolada", () => {
    setScrollY(SCROLLED_Y);
    const onInteract = vi.fn();

    whenInteracted(onInteract);

    expect(onInteract).toHaveBeenCalledOnce();
  });
});

type Callback = (
  entries: Pick<IntersectionObserverEntry, "isIntersecting">[],
) => void;

const observers: FakeIntersectionObserver[] = [];

class FakeIntersectionObserver {
  readonly observe = vi.fn();
  readonly disconnect = vi.fn();

  constructor(
    readonly callback: Callback,
    readonly options: IntersectionObserverInit,
  ) {
    observers.push(this);
  }

  emit(isIntersecting: boolean): void {
    this.callback([{ isIntersecting }]);
  }
}

function lastObserver(): FakeIntersectionObserver {
  const observer = observers.at(-1);
  if (!observer) {
    throw new Error("nenhum IntersectionObserver criado");
  }
  return observer;
}

describe("whenNearViewport", () => {
  beforeEach(() => {
    observers.length = 0;
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("observa o elemento com a margem informada sem disparar de imediato", () => {
    const element = document.createElement("div");
    const onNear = vi.fn();

    whenNearViewport(element, ROOT_MARGIN, onNear);

    const observer = lastObserver();
    expect(observer.options).toEqual({ rootMargin: ROOT_MARGIN });
    expect(observer.observe).toHaveBeenCalledWith(element);
    expect(onNear).not.toHaveBeenCalled();
  });

  it("ignora entradas que não interceptam a área expandida", () => {
    const onNear = vi.fn();
    whenNearViewport(document.createElement("div"), ROOT_MARGIN, onNear);

    lastObserver().emit(false);

    expect(onNear).not.toHaveBeenCalled();
  });

  it("dispara uma vez e desconecta ao se aproximar da viewport", () => {
    const onNear = vi.fn();
    whenNearViewport(document.createElement("div"), ROOT_MARGIN, onNear);
    const observer = lastObserver();

    observer.emit(true);

    expect(onNear).toHaveBeenCalledOnce();
    expect(observer.disconnect).toHaveBeenCalled();
  });

  it("o cleanup desconecta o observer antes de disparar", () => {
    const onNear = vi.fn();
    const stop = whenNearViewport(
      document.createElement("div"),
      ROOT_MARGIN,
      onNear,
    );

    stop();

    expect(lastObserver().disconnect).toHaveBeenCalled();
    expect(onNear).not.toHaveBeenCalled();
  });

  it("dispara de imediato quando não há IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const onNear = vi.fn();

    whenNearViewport(document.createElement("div"), ROOT_MARGIN, onNear);

    expect(onNear).toHaveBeenCalledOnce();
    expect(observers).toEqual([]);
  });
});
