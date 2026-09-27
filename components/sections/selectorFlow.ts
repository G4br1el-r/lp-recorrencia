import { gsap } from "gsap";
import type { BookState } from "@/components/motion/stage";
import { GSAP_EASE } from "@/lib/constants/motion";

export const SELECTOR_STEPS = 3;

export const FLOW = {
  centerXVw: 16,
  spacingVw: 24,
  farSpacingFactor: 0.6,
  yVh: -4,
  baseAlignVh: 24,
  sideScale: 0.6,
  sideRotation: 34,
  sideOpacity: 0.55,
  farFadePerStep: 2,
  blurPerStep: 2.5,
  swayDeg: 8,
  maxDistance: 1.6,
} as const;

export const TIMING = { start: 0.08, hold: 0.16, move: 0.16 } as const;
export const ARRIVE = { duration: 0.08, fromYVh: 30 } as const;
export const LEAVE = { at: 0.9, duration: 0.1, yVh: 40, scale: 0.5 } as const;

export function holdStart(step: number): number {
  return TIMING.start + step * (TIMING.hold + TIMING.move);
}

export function holdMiddle(step: number): number {
  return holdStart(step) + TIMING.hold / 2;
}

export function flowState(offset: number, sway: number): BookState {
  const distance = Math.min(Math.abs(offset), FLOW.maxDistance);
  const side = Math.sign(offset);
  const near = Math.min(distance, 1);
  const far = Math.max(0, distance - 1);
  const scale = 1 - near * (1 - FLOW.sideScale);
  return {
    xVw:
      FLOW.centerXVw +
      side * (near + far * FLOW.farSpacingFactor) * FLOW.spacingVw,
    yVh: FLOW.yVh + (1 - scale) * FLOW.baseAlignVh,
    zPx: 0,
    scale,
    rotationY:
      -side * near * FLOW.sideRotation + sway * FLOW.swayDeg * (1 - near),
    opacity:
      (1 - near * (1 - FLOW.sideOpacity)) *
      Math.max(0, 1 - far * FLOW.farFadePerStep),
    blurPx: distance * FLOW.blurPerStep,
    reflect: 1,
  };
}

const moveEase = gsap.parseEase(GSAP_EASE.camera);

export function flowAt(progress: number): number {
  let t = 0;
  for (let step = 0; step < SELECTOR_STEPS - 1; step += 1) {
    const start = holdStart(step) + TIMING.hold;
    t += moveEase(gsap.utils.clamp(0, 1, (progress - start) / TIMING.move));
  }
  return t;
}

export function presenceAt(progress: number): number {
  const arriving = progress / TIMING.start;
  const leaving = (1 - progress) / (1 - LEAVE.at);
  return gsap.utils.clamp(0, 1, Math.min(arriving, leaving));
}

export function arriveState(index: number): BookState {
  return { ...flowState(index, -1), yVh: ARRIVE.fromYVh, opacity: 0 };
}

export function leaveState(offset: number): BookState {
  return {
    ...flowState(offset, 1),
    yVh: LEAVE.yVh,
    scale: LEAVE.scale,
    opacity: 0,
  };
}
