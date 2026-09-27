import type { gsap } from "@/components/motion/gsap";
import { GSAP_EASE } from "@/lib/constants/motion";
import type { EditionId } from "@/lib/content/editions";

export type BookState = {
  xVw: number;
  yVh: number;
  zPx: number;
  scale: number;
  rotationY: number;
  opacity: number;
  blurPx: number;
  reflect: number;
};

export type LightState = {
  xVw: number;
  yVh: number;
  opacity: number;
};

export type HoverState = {
  liftVh: number;
  grow: number;
  face: number;
  tiltX: number;
  tiltY: number;
  dim: number;
};

export type StageState = {
  books: Record<EditionId, BookState>;
  hover: Record<EditionId, HoverState>;
  light: LightState;
};

export const BOOK_HIDDEN: BookState = {
  xVw: 0,
  yVh: 0,
  zPx: 0,
  scale: 1,
  rotationY: 0,
  opacity: 0,
  blurPx: 0,
  reflect: 1,
};

export const HOVER_NEUTRAL: HoverState = {
  liftVh: 0,
  grow: 0,
  face: 0,
  tiltX: 0,
  tiltY: 0,
  dim: 0,
};

export const STAGE = {
  heroEnd: {
    xVw: 0,
    yVh: -4,
    zPx: 0,
    scale: 1,
    rotationY: -12,
    opacity: 1,
    blurPx: 0,
    reflect: 0,
  },
  timeCenter: {
    xVw: 0,
    yVh: -2,
    zPx: 0,
    scale: 1,
    rotationY: -12,
    opacity: 1,
    blurPx: 0,
    reflect: 1,
  },
} as const satisfies Record<string, BookState>;

export type FanSide = -1 | 1;

export const HERO_FAN = {
  spreadXVw: { desktop: 12, mobile: 22 },
  openZPx: -260,
  tuckedZPx: -420,
  openScale: 0.9,
  tuckedScale: 0.8,
  openRotationY: 20,
} as const;

export function heroFanState(
  isDesktop: boolean,
  side: FanSide,
  open: boolean,
): BookState {
  if (!open) {
    return {
      ...STAGE.heroEnd,
      zPx: HERO_FAN.tuckedZPx,
      scale: HERO_FAN.tuckedScale,
      opacity: 0,
    };
  }
  const spread = isDesktop
    ? HERO_FAN.spreadXVw.desktop
    : HERO_FAN.spreadXVw.mobile;
  return {
    ...STAGE.heroEnd,
    xVw: side * spread,
    zPx: HERO_FAN.openZPx,
    scale: HERO_FAN.openScale,
    rotationY: -side * HERO_FAN.openRotationY,
  };
}

export const STAGE_LIGHT = {
  heroEnd: { xVw: 0, yVh: 12, opacity: 0.85 },
  dailyEnd: { xVw: 24, yVh: -6, opacity: 0.9 },
  editionsEnd: { xVw: 0, yVh: 6, opacity: 0.7 },
  timelineStart: { xVw: 0, yVh: -10, opacity: 0.5 },
  timeCenter: { xVw: 0, yVh: 8, opacity: 0.95 },
  off: { xVw: 0, yVh: 40, opacity: 0 },
} as const satisfies Record<string, LightState>;

export function createStageState(): StageState {
  return {
    books: {
      traditional: { ...BOOK_HIDDEN },
      largePrint: { ...BOOK_HIDDEN },
      celebration: { ...BOOK_HIDDEN },
    },
    hover: {
      traditional: { ...HOVER_NEUTRAL },
      largePrint: { ...HOVER_NEUTRAL },
      celebration: { ...HOVER_NEUTRAL },
    },
    light: { ...STAGE_LIGHT.off },
  };
}

export function bookVars(state: BookState): gsap.TweenVars {
  return { ...state };
}

export function lightVars(state: LightState): gsap.TweenVars {
  return { ...state };
}

type Target = gsap.TweenTarget;

export function moveBook(
  timeline: gsap.core.Timeline,
  target: Target,
  from: BookState,
  to: BookState,
  at: number,
  duration: number,
  ease: string = GSAP_EASE.camera,
): void {
  timeline.fromTo(
    target,
    bookVars(from),
    { ...bookVars(to), duration, ease, immediateRender: false },
    at,
  );
}

export function moveLight(
  timeline: gsap.core.Timeline,
  target: Target,
  from: LightState,
  to: LightState,
  at: number,
  duration: number,
  ease: string = GSAP_EASE.linear,
): void {
  timeline.fromTo(
    target,
    lightVars(from),
    { ...lightVars(to), duration, ease, immediateRender: false },
    at,
  );
}
