import type Lenis from "lenis";
import { ScrollTrigger } from "@/components/motion/gsap";

export type ScrollInput = "touch" | "other";

type SettleGateInput = {
  isStopped: boolean;
  isScrolling: Lenis["isScrolling"];
  touching: boolean;
  lastInput: ScrollInput;
};

export function canSettle({
  isStopped,
  isScrolling,
  touching,
  lastInput,
}: SettleGateInput): boolean {
  if (isStopped || touching) {
    return false;
  }
  return isScrolling !== "native" || lastInput === "touch";
}

export function waitsForIdle(
  isScrolling: Lenis["isScrolling"],
  lastInput: ScrollInput,
): boolean {
  return (
    isScrolling === false || (isScrolling === "native" && lastInput === "touch")
  );
}

type Stops = readonly number[] | (() => readonly number[]);

const stopsByTrigger = new WeakMap<ScrollTrigger, Stops>();

export function snapStops(timeline: gsap.core.Timeline, stops: Stops): void {
  if (timeline.scrollTrigger) {
    stopsByTrigger.set(timeline.scrollTrigger, stops);
  }
}

function restPoints(trigger: ScrollTrigger): number[] {
  const stops = stopsByTrigger.get(trigger);
  const duration = trigger.animation?.duration();
  if (!stops || !duration) {
    return [];
  }
  const range = trigger.end - trigger.start;
  return (typeof stops === "function" ? stops() : stops)
    .map((time) => trigger.start + (time / duration) * range)
    .sort((a, b) => a - b);
}

export type PinnedRange = {
  start: number;
  end: number;
  points: number[];
};

export function pinnedRange(y: number): PinnedRange | null {
  for (const trigger of ScrollTrigger.getAll()) {
    if (trigger.pin && y >= trigger.start && y <= trigger.end) {
      return {
        start: trigger.start,
        end: trigger.end,
        points: restPoints(trigger),
      };
    }
  }
  return null;
}

export function landingPoint(section: Element): number | null {
  const trigger = ScrollTrigger.getAll().find((item) => item.pin === section);
  if (!trigger) {
    return null;
  }
  return restPoints(trigger)[0] ?? trigger.start;
}

type SnapTargetInput = {
  y: number;
  direction: number;
  range: PinnedRange;
  advance: number;
  tolerancePx: number;
};

export function snapTarget({
  y,
  direction,
  range,
  advance,
  tolerancePx,
}: SnapTargetInput): number | null {
  const { points } = range;
  if (points.some((point) => Math.abs(point - y) <= tolerancePx)) {
    return null;
  }
  const before = points.filter((point) => point < y).at(-1);
  const after = points.find((point) => point > y);
  if (before !== undefined && after !== undefined) {
    const reached = (y - before) / (after - before);
    const onward = direction > 0 ? reached >= advance : reached > 1 - advance;
    return onward ? after : before;
  }
  if (after !== undefined) {
    return direction > 0 ? after : null;
  }
  if (before !== undefined) {
    return direction < 0 ? before : null;
  }
  return null;
}

export function gatePoints(): number[] {
  const points: number[] = [];
  for (const trigger of ScrollTrigger.getAll()) {
    if (trigger.pin) {
      points.push(trigger.start, ...restPoints(trigger), trigger.end);
    }
  }
  return points.sort((a, b) => a - b);
}
