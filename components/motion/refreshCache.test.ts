import { beforeEach, describe, expect, it, vi } from "vitest";
import { refreshCache } from "@/components/motion/refreshCache";

type Listener = () => void;

const REFRESH_INIT_EVENT = "refreshInit";
const FIRST_MEASURE = 100;
const SECOND_MEASURE = 200;
const MEASURES_AFTER_ONE_REFRESH = 2;

const { listeners, addEventListener, removeEventListener } = vi.hoisted(() => {
  const registry = new Map<string, Set<() => void>>();
  return {
    listeners: registry,
    addEventListener: vi.fn((type: string, listener: () => void) => {
      const set = registry.get(type) ?? new Set();
      set.add(listener);
      registry.set(type, set);
    }),
    removeEventListener: vi.fn((type: string, listener: () => void) => {
      registry.get(type)?.delete(listener);
    }),
  };
});

vi.mock("@/components/motion/gsap", () => ({
  ScrollTrigger: { addEventListener, removeEventListener },
}));

function emit(type: string): void {
  for (const listener of listeners.get(type) ?? []) listener();
}

function registered(type: string): Listener[] {
  return [...(listeners.get(type) ?? [])];
}

describe("refreshCache", () => {
  beforeEach(() => {
    listeners.clear();
    addEventListener.mockClear();
    removeEventListener.mockClear();
  });

  it("não mede antes da primeira leitura", () => {
    const measure = vi.fn(() => FIRST_MEASURE);

    refreshCache(measure);

    expect(measure).not.toHaveBeenCalled();
  });

  it("mede uma vez e reaproveita o valor em cache", () => {
    const measure = vi.fn(() => FIRST_MEASURE);
    const cache = refreshCache(measure);

    expect(cache.read()).toBe(FIRST_MEASURE);
    expect(cache.read()).toBe(FIRST_MEASURE);
    expect(measure).toHaveBeenCalledOnce();
  });

  it("reaproveita valores falsy sem medir de novo", () => {
    const measure = vi.fn(() => null);
    const cache = refreshCache(measure);

    cache.read();
    cache.read();

    expect(measure).toHaveBeenCalledOnce();
  });

  it("mede de novo após o refreshInit do ScrollTrigger", () => {
    const measure = vi
      .fn<() => number>()
      .mockReturnValueOnce(FIRST_MEASURE)
      .mockReturnValueOnce(SECOND_MEASURE);
    const cache = refreshCache(measure);

    expect(cache.read()).toBe(FIRST_MEASURE);
    emit(REFRESH_INIT_EVENT);
    expect(cache.read()).toBe(SECOND_MEASURE);
    expect(cache.read()).toBe(SECOND_MEASURE);
    expect(measure).toHaveBeenCalledTimes(MEASURES_AFTER_ONE_REFRESH);
  });

  it("dispose remove o listener registrado", () => {
    const cache = refreshCache(() => FIRST_MEASURE);
    const [invalidate] = registered(REFRESH_INIT_EVENT);

    expect(addEventListener).toHaveBeenCalledWith(
      REFRESH_INIT_EVENT,
      invalidate,
    );

    cache.dispose();

    expect(removeEventListener).toHaveBeenCalledWith(
      REFRESH_INIT_EVENT,
      invalidate,
    );
    expect(registered(REFRESH_INIT_EVENT)).toEqual([]);
  });

  it("após dispose o refresh não invalida mais o cache", () => {
    const measure = vi.fn(() => FIRST_MEASURE);
    const cache = refreshCache(measure);

    cache.read();
    cache.dispose();
    emit(REFRESH_INIT_EVENT);
    cache.read();

    expect(measure).toHaveBeenCalledOnce();
  });
});
