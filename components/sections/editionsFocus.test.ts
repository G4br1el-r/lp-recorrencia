import type Lenis from "lenis";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ScrollTrigger } from "@/components/motion/gsap";
import { revealRowOnFocus } from "@/components/sections/editionsFocus";

const mocks = vi.hoisted(() => ({
  scrollToProgress: vi.fn(),
}));

vi.mock("@/components/motion/scrollToProgress", () => ({
  scrollToProgress: mocks.scrollToProgress,
}));

const TRIGGER_START = 1000;
const TRIGGER_END = 3000;
const ROW_PROGRESS = 0.82;
const SCROLL_DURATION = 1.4;

const FAKE_TRIGGER = {
  start: TRIGGER_START,
  end: TRIGGER_END,
} as unknown as ScrollTrigger;
const FAKE_LENIS = { scrollTo: vi.fn() } as unknown as Lenis;

describe("revealRowOnFocus", () => {
  afterEach(() => {
    mocks.scrollToProgress.mockReset();
  });

  it("rola até a fileira de edições quando o foco chega fora da janela interativa", () => {
    const revealed = revealRowOnFocus({
      interactive: false,
      trigger: FAKE_TRIGGER,
      lenis: FAKE_LENIS,
      progress: ROW_PROGRESS,
      duration: SCROLL_DURATION,
    });

    expect(revealed).toBe(true);
    expect(mocks.scrollToProgress).toHaveBeenCalledWith(
      FAKE_TRIGGER,
      ROW_PROGRESS,
      FAKE_LENIS,
      SCROLL_DURATION,
    );
  });

  it("não rola quando a fileira já está interativa", () => {
    const revealed = revealRowOnFocus({
      interactive: true,
      trigger: FAKE_TRIGGER,
      lenis: FAKE_LENIS,
      progress: ROW_PROGRESS,
      duration: SCROLL_DURATION,
    });

    expect(revealed).toBe(false);
    expect(mocks.scrollToProgress).not.toHaveBeenCalled();
  });

  it("não rola quando a cena ainda não criou o gatilho de scroll", () => {
    const revealed = revealRowOnFocus({
      interactive: false,
      trigger: null,
      lenis: null,
      progress: ROW_PROGRESS,
      duration: SCROLL_DURATION,
    });

    expect(revealed).toBe(false);
    expect(mocks.scrollToProgress).not.toHaveBeenCalled();
  });
});
