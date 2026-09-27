"use client";

import Lenis from "lenis";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { gsap, ScrollTrigger } from "@/components/motion/gsap";
import {
  canSettle,
  gatePoints,
  landingPoint,
  pinnedRange,
  snapTarget,
} from "@/components/motion/snap";
import {
  limitTouchInertia,
  projectedInertia,
} from "@/components/motion/touchInertia";
import { createWheelGate, gateWheel } from "@/components/motion/wheelGate";
import { limitWheelLead } from "@/components/motion/wheelLead";
import { MEDIA } from "@/lib/constants/motion";

const LENIS_OPTIONS = {
  lerp: 0.085,
  wheelMultiplier: 0.95,
  touchMultiplier: 1,
  smoothWheel: true,
  syncTouch: true,
  syncTouchLerp: 0.075,
  touchInertiaExponent: 1.7,
  autoRaf: false,
} as const;

const SECONDS_TO_MILLISECONDS = 1000;

const MAX_WHEEL_LEAD_VIEWPORTS = 0.75;

const MAX_TOUCH_INERTIA_VIEWPORTS = 0.5;

const WHEEL_GATE_IDLE_MS = 220;

const SNAP = {
  idleMs: 180,
  advance: 0.12,
  secondsPerViewport: 0.5,
  minSeconds: 0.6,
  maxSeconds: 1.4,
  tolerancePx: 2,
  stillPx: 0.5,
  stillFrames: 20,
} as const;

const SNAP_CANCEL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
  "Tab",
  "Escape",
]);

const USER_INPUT_LISTENER = { capture: true, passive: true } as const;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

function headerOffset(): number {
  return -Number.parseFloat(
    getComputedStyle(document.documentElement).scrollPaddingTop,
  );
}

function hashTarget(anchor: HTMLAnchorElement): HTMLElement | null {
  const hash = anchor.getAttribute("href");
  if (!hash || hash.length < 2) {
    return null;
  }
  return document.getElementById(decodeURIComponent(hash.slice(1)));
}

function resetScrollBeforeScenesCreatePins(): void {
  if (typeof window === "undefined") {
    return;
  }
  history.scrollRestoration = "manual";
  if (!window.location.hash) {
    window.scrollTo(0, 0);
  }
}

resetScrollBeforeScenesCreatePins();

const LenisContext = createContext<Lenis | null>(null);

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia(MEDIA.reduceMotion).matches) {
      return;
    }

    const desktop = window.matchMedia(MEDIA.desktop);
    const gate = createWheelGate();
    const instance = new Lenis({
      ...LENIS_OPTIONS,
      virtualScroll: (data) => {
        if (data.event.type === "touchend") {
          const limited = limitTouchInertia({
            inertia: projectedInertia(
              data.deltaY,
              instance.velocity,
              LENIS_OPTIONS.touchInertiaExponent,
            ),
            target: instance.targetScroll,
            maxTravel: window.innerHeight * MAX_TOUCH_INERTIA_VIEWPORTS,
            points: gatePoints(),
            tolerancePx: SNAP.tolerancePx,
          });
          if (limited !== 0) {
            instance.scrollTo(instance.targetScroll + limited, {
              programmatic: false,
              lerp: LENIS_OPTIONS.syncTouchLerp,
            });
          }
          return false;
        }
        if (data.event.type === "wheel") {
          const limited = limitWheelLead({
            delta: data.deltaY,
            target: instance.targetScroll,
            current: instance.animatedScroll,
            maxLead: window.innerHeight * MAX_WHEEL_LEAD_VIEWPORTS,
          });
          const delta = desktop.matches
            ? gateWheel({
                state: gate,
                delta: limited,
                rawDelta: data.deltaY,
                target: instance.targetScroll,
                nowMs: performance.now(),
                idleMs: WHEEL_GATE_IDLE_MS,
                points: gatePoints(),
                tolerancePx: SNAP.tolerancePx,
              })
            : limited;
          if (delta === 0) {
            if (data.event.cancelable) {
              data.event.preventDefault();
            }
            return false;
          }
          data.deltaY = delta;
        }
        return true;
      },
    });
    let idleTimer: number | undefined;
    let direction = 1;
    let lastY = instance.scroll;
    let stillFrames = 0;
    let snapping = false;
    let cancelling = false;
    let touching = false;

    const settle = () => {
      if (
        !canSettle({
          isStopped: instance.isStopped,
          isScrolling: instance.isScrolling,
          touching,
        })
      ) {
        return;
      }
      const y = instance.scroll;
      const range = pinnedRange(y);
      const target = range
        ? snapTarget({
            y,
            direction,
            range,
            advance: SNAP.advance,
            tolerancePx: SNAP.tolerancePx,
          })
        : null;
      if (target === null) {
        return;
      }
      const viewports = Math.abs(target - y) / window.innerHeight;
      snapping = true;
      instance.scrollTo(target, {
        duration: gsap.utils.clamp(
          SNAP.minSeconds,
          SNAP.maxSeconds,
          viewports * SNAP.secondsPerViewport,
        ),
        easing: easeInOutCubic,
        onComplete: () => {
          snapping = false;
        },
      });
    };

    const cancelSnap = () => {
      window.clearTimeout(idleTimer);
      if (!snapping || instance.isStopped) {
        return;
      }
      snapping = false;
      cancelling = true;
      instance.stop();
      instance.start();
      cancelling = false;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (SNAP_CANCEL_KEYS.has(event.key)) {
        cancelSnap();
      }
    };

    const onTouchStart = () => {
      touching = true;
      cancelSnap();
    };

    const settleWhenIdle = () => {
      if (instance.isScrolling === false) {
        settle();
      }
    };

    const onTouchEnd = () => {
      touching = false;
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(settleWhenIdle, SNAP.idleMs);
    };

    const onScroll = () => {
      if (cancelling) {
        return;
      }
      ScrollTrigger.update();
      const y = instance.scroll;
      window.clearTimeout(idleTimer);
      if (Math.abs(y - lastY) >= SNAP.stillPx) {
        lastY = y;
        stillFrames = 0;
        if (instance.direction !== 0) {
          direction = instance.direction;
        }
      } else {
        stillFrames += 1;
      }
      if (instance.isScrolling === false) {
        idleTimer = window.setTimeout(settle, SNAP.idleMs);
      } else if (stillFrames >= SNAP.stillFrames) {
        stillFrames = 0;
        settle();
      }
    };

    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }
      const anchor = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
      const target = anchor ? hashTarget(anchor) : null;
      if (!anchor || !target) {
        return;
      }
      event.preventDefault();
      snapping = false;
      const landing = landingPoint(target);
      instance.scrollTo(landing ?? target, {
        offset: landing === null ? headerOffset() : 0,
      });
    };

    const onTick = (time: number) =>
      instance.raf(time * SECONDS_TO_MILLISECONDS);

    instance.on("scroll", onScroll);
    document.addEventListener("click", onClick);
    window.addEventListener("wheel", cancelSnap, USER_INPUT_LISTENER);
    window.addEventListener("touchstart", onTouchStart, USER_INPUT_LISTENER);
    window.addEventListener("touchend", onTouchEnd, USER_INPUT_LISTENER);
    window.addEventListener("touchcancel", onTouchEnd, USER_INPUT_LISTENER);
    window.addEventListener("pointerdown", cancelSnap, USER_INPUT_LISTENER);
    window.addEventListener("keydown", onKeyDown, USER_INPUT_LISTENER);
    gsap.ticker.add(onTick, false, true);
    gsap.ticker.lagSmoothing(0);
    setLenis(instance);

    return () => {
      window.clearTimeout(idleTimer);
      instance.off("scroll", onScroll);
      document.removeEventListener("click", onClick);
      window.removeEventListener("wheel", cancelSnap, USER_INPUT_LISTENER);
      window.removeEventListener(
        "touchstart",
        onTouchStart,
        USER_INPUT_LISTENER,
      );
      window.removeEventListener("touchend", onTouchEnd, USER_INPUT_LISTENER);
      window.removeEventListener(
        "touchcancel",
        onTouchEnd,
        USER_INPUT_LISTENER,
      );
      window.removeEventListener(
        "pointerdown",
        cancelSnap,
        USER_INPUT_LISTENER,
      );
      window.removeEventListener("keydown", onKeyDown, USER_INPUT_LISTENER);
      gsap.ticker.remove(onTick);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
  );
}

export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}
