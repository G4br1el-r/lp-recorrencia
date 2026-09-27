import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  useMediaQuery,
  useReducedMotionPreference,
} from "@/components/motion/useMotionPreferences";
import { MEDIA } from "@/lib/constants/motion";

const CHANGE_EVENT = "change";

type Listener = () => void;

function createFakeMediaQueryList(initialMatches: boolean) {
  const listeners = new Set<Listener>();
  const list = {
    matches: initialMatches,
    addEventListener: vi.fn((type: string, listener: Listener) => {
      if (type === CHANGE_EVENT) listeners.add(listener);
    }),
    removeEventListener: vi.fn((type: string, listener: Listener) => {
      if (type === CHANGE_EVENT) listeners.delete(listener);
    }),
  };
  const setMatches = (matches: boolean) => {
    list.matches = matches;
    for (const listener of listeners) listener();
  };
  const matchMedia = vi.fn((_query: string) => list);
  vi.stubGlobal("matchMedia", matchMedia);
  return { list, listeners, setMatches, matchMedia };
}

describe("useReducedMotionPreference", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("consulta a media query de movimento reduzido", () => {
    const { matchMedia } = createFakeMediaQueryList(false);

    renderHook(() => useReducedMotionPreference());

    expect(matchMedia).toHaveBeenCalledWith(MEDIA.reduceMotion);
  });

  it("retorna true quando o usuário prefere movimento reduzido", () => {
    createFakeMediaQueryList(true);

    const { result } = renderHook(() => useReducedMotionPreference());

    expect(result.current).toBe(true);
  });

  it("retorna false quando não há preferência", () => {
    createFakeMediaQueryList(false);

    const { result } = renderHook(() => useReducedMotionPreference());

    expect(result.current).toBe(false);
  });

  it("atualiza quando a media query muda", () => {
    const { setMatches } = createFakeMediaQueryList(false);
    const { result } = renderHook(() => useReducedMotionPreference());

    act(() => {
      setMatches(true);
    });
    expect(result.current).toBe(true);

    act(() => {
      setMatches(false);
    });
    expect(result.current).toBe(false);
  });

  it("remove o listener ao desmontar", () => {
    const { list, listeners } = createFakeMediaQueryList(false);
    const { unmount } = renderHook(() => useReducedMotionPreference());
    const [registered] = listeners;

    unmount();

    expect(list.removeEventListener).toHaveBeenCalledWith(
      CHANGE_EVENT,
      registered,
    );
    expect([...listeners]).toEqual([]);
  });
});

describe("useMediaQuery", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("consulta a media query recebida", () => {
    const { matchMedia } = createFakeMediaQueryList(true);

    const { result } = renderHook(() => useMediaQuery(MEDIA.desktop));

    expect(matchMedia).toHaveBeenCalledWith(MEDIA.desktop);
    expect(result.current).toBe(true);
  });

  it("atualiza quando a media query muda", () => {
    const { setMatches } = createFakeMediaQueryList(true);
    const { result } = renderHook(() => useMediaQuery(MEDIA.desktop));

    act(() => {
      setMatches(false);
    });

    expect(result.current).toBe(false);
  });
});
