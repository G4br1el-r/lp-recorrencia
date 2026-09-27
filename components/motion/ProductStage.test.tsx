import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  StageLayer,
  StageProvider,
  styleWriter,
} from "@/components/motion/ProductStage";
import { editions } from "@/lib/content/editions";

const mocks = vi.hoisted(() => ({
  createBookScene: vi.fn(),
  renderQuality: vi.fn<() => "high" | "low">(),
  tickerAdd: vi.fn(),
  tickerRemove: vi.fn(),
}));

vi.mock("@/components/motion/gsap", () => ({
  gsap: { ticker: { add: mocks.tickerAdd, remove: mocks.tickerRemove } },
}));

vi.mock("@/components/motion/book3d/renderQuality", () => ({
  currentRenderQuality: mocks.renderQuality,
}));

vi.mock("@/components/motion/book3d/createBookScene", () => ({
  createBookScene: mocks.createBookScene,
}));

const STAGE_PRELOAD_MARGIN = "100% 0px";
const BASE_STYLE = {
  transform: "translate3d(0vw, 0vh, 0px)",
  opacity: "1",
  filter: "none",
  zIndex: "0",
};
const MOVED_TRANSFORM = "translate3d(10vw, 0vh, 0px)";
const BLURRED_FILTER = "blur(4px)";
const UNTOUCHED_MARKER = "blur(99px)";

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

class FakeResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
}

function stageObserver(): FakeIntersectionObserver {
  const observer = observers.at(-1);
  if (!observer) {
    throw new Error("StageLayer não criou IntersectionObserver");
  }
  return observer;
}

function interact(): void {
  window.dispatchEvent(new Event("wheel"));
}

function renderStage() {
  return render(
    <StageProvider>
      <StageLayer />
    </StageProvider>,
  );
}

describe("StageLayer", () => {
  const scene = { resize: vi.fn(), render: vi.fn(), dispose: vi.fn() };

  beforeEach(() => {
    observers.length = 0;
    mocks.createBookScene.mockReset();
    mocks.createBookScene.mockResolvedValue(scene);
    mocks.renderQuality.mockReset();
    mocks.renderQuality.mockReturnValue("high");
    scene.dispose.mockReset();
    mocks.tickerAdd.mockClear();
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("aparelho de toque ou fraco usa o livro em CSS sem criar cena WebGL", async () => {
    mocks.renderQuality.mockReturnValue("low");
    const { container } = renderStage();
    interact();

    await waitFor(() => {
      expect(container.querySelectorAll(".book")).toHaveLength(editions.length);
    });
    expect(observers).toEqual([]);
    expect(mocks.createBookScene).not.toHaveBeenCalled();
  });

  it("não observa nem cria a cena antes da primeira interação", async () => {
    renderStage();

    await Promise.resolve();
    expect(observers).toEqual([]);
    expect(mocks.createBookScene).not.toHaveBeenCalled();
  });

  it("desmontar antes da primeira interação não cria a cena", async () => {
    const { unmount } = renderStage();

    unmount();
    interact();

    await Promise.resolve();
    expect(observers).toEqual([]);
    expect(mocks.createBookScene).not.toHaveBeenCalled();
  });

  it("só cria a cena WebGL quando o palco se aproxima da viewport", async () => {
    renderStage();
    interact();

    expect(stageObserver().options).toEqual({
      rootMargin: STAGE_PRELOAD_MARGIN,
    });
    expect(mocks.createBookScene).not.toHaveBeenCalled();

    stageObserver().emit(true);

    await waitFor(() => {
      expect(mocks.createBookScene).toHaveBeenCalledOnce();
    });
    expect(stageObserver().disconnect).toHaveBeenCalled();
  });

  it("desmontar antes de se aproximar não cria a cena", async () => {
    const { unmount } = renderStage();
    interact();
    const observer = stageObserver();

    unmount();

    expect(observer.disconnect).toHaveBeenCalled();
    await Promise.resolve();
    expect(mocks.createBookScene).not.toHaveBeenCalled();
  });

  it("descarta a cena criada ao desmontar", async () => {
    const { unmount } = renderStage();
    interact();
    stageObserver().emit(true);
    await waitFor(() => {
      expect(mocks.tickerAdd).toHaveBeenCalled();
    });

    unmount();

    expect(scene.dispose).toHaveBeenCalledOnce();
  });
});

describe("styleWriter", () => {
  it("não reescreve o filter quando só o transform muda", () => {
    const element = document.createElement("div");
    const write = styleWriter(element);

    write(BASE_STYLE);
    element.style.filter = UNTOUCHED_MARKER;
    write({ ...BASE_STYLE, transform: MOVED_TRANSFORM });

    expect(element.style.transform).toBe(MOVED_TRANSFORM);
    expect(element.style.filter).toBe(UNTOUCHED_MARKER);
  });

  it("escreve o filter quando o blur muda", () => {
    const element = document.createElement("div");
    const write = styleWriter(element);

    write(BASE_STYLE);
    write({ ...BASE_STYLE, filter: BLURRED_FILTER });

    expect(element.style.filter).toBe(BLURRED_FILTER);
  });
});
