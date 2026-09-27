import { afterEach, describe, expect, it, vi } from "vitest";
import {
  currentRenderProfile,
  detectRenderQuality,
  RENDER_PROFILES,
} from "@/components/motion/book3d/renderQuality";

const STRONG_CORES = 8;
const WEAK_CORES = 4;
const STRONG_MEMORY_GB = 8;
const WEAK_MEMORY_GB = 2;

const strongDesktop = {
  coarsePointer: false,
  cores: STRONG_CORES,
  memoryGb: STRONG_MEMORY_GB,
};

describe("detectRenderQuality", () => {
  it("usa qualidade alta em desktop com mouse e hardware folgado", () => {
    expect(detectRenderQuality(strongDesktop)).toBe("high");
  });

  it("usa qualidade baixa em aparelhos de toque", () => {
    expect(detectRenderQuality({ ...strongDesktop, coarsePointer: true })).toBe(
      "low",
    );
  });

  it("usa qualidade baixa com poucos núcleos", () => {
    expect(detectRenderQuality({ ...strongDesktop, cores: WEAK_CORES })).toBe(
      "low",
    );
  });

  it("usa qualidade baixa com pouca memória", () => {
    expect(
      detectRenderQuality({ ...strongDesktop, memoryGb: WEAK_MEMORY_GB }),
    ).toBe("low");
  });

  it("mantém qualidade alta quando o navegador não informa o hardware", () => {
    expect(
      detectRenderQuality({
        coarsePointer: false,
        cores: undefined,
        memoryGb: undefined,
      }),
    ).toBe("high");
  });
});

describe("currentRenderProfile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("devolve o perfil leve quando o ponteiro é de toque", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true })),
    );

    expect(currentRenderProfile()).toBe(RENDER_PROFILES.low);
  });

  it("perfil leve reduz resolução, antialias, clearcoat e anisotropia", () => {
    const { high, low } = RENDER_PROFILES;

    expect(low.maxPixelRatio).toBeLessThan(high.maxPixelRatio);
    expect(low.antialias).toBe(false);
    expect(low.clearcoat).toBe(false);
    expect(low.anisotropy).toBeLessThan(high.anisotropy);
  });
});
