import type Lenis from "lenis";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ScrollTrigger } from "@/components/motion/gsap";
import { scrollToProgress } from "@/components/motion/scrollToProgress";

const TRIGGER_START = 1000;
const TRIGGER_END = 3000;
const HALF_PROGRESS = 0.5;
const START_PROGRESS = 0;
const END_PROGRESS = 1;
const HALF_TARGET = 2000;
const SCROLL_DURATION = 1.2;

function fakeTrigger(): ScrollTrigger {
  return { start: TRIGGER_START, end: TRIGGER_END } as unknown as ScrollTrigger;
}

function fakeLenis() {
  const scrollTo = vi.fn();
  const lenis = { scrollTo } as unknown as Lenis;
  return { lenis, scrollTo };
}

describe("scrollToProgress", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    { progress: START_PROGRESS, target: TRIGGER_START },
    { progress: HALF_PROGRESS, target: HALF_TARGET },
    { progress: END_PROGRESS, target: TRIGGER_END },
  ])(
    "usa o lenis com alvo $target para progresso $progress",
    ({ progress, target }) => {
      const { lenis, scrollTo } = fakeLenis();
      const windowScrollTo = vi
        .spyOn(window, "scrollTo")
        .mockImplementation(() => undefined);

      scrollToProgress(fakeTrigger(), progress, lenis, SCROLL_DURATION);

      expect(scrollTo).toHaveBeenCalledWith(target, {
        duration: SCROLL_DURATION,
      });
      expect(windowScrollTo).not.toHaveBeenCalled();
    },
  );

  it("usa window.scrollTo suave quando não há lenis", () => {
    const windowScrollTo = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => undefined);

    scrollToProgress(fakeTrigger(), HALF_PROGRESS, null, SCROLL_DURATION);

    expect(windowScrollTo).toHaveBeenCalledWith({
      top: HALF_TARGET,
      behavior: "smooth",
    });
  });
});
