export const EASE = {
  soft: [0.22, 1, 0.36, 1],
  cinematic: [0.16, 1, 0.3, 1],
} as const;

export const GSAP_EASE = {
  cinematic: "power3.out",
  camera: "power2.inOut",
  soft: "power1.out",
  linear: "none",
  reveal: "power2.out",
  exit: "power2.in",
  breathe: "sine.inOut",
  wipe: "power1.inOut",
  headline: "power4.out",
} as const;

export const SCRUB = {
  immediate: true,
} as const;

export const PIN_LENGTH_VH = {
  hero: { desktop: 240, mobile: 180 },
  editions: { desktop: 420, mobile: 330 },
  time: { desktop: 380, mobile: 280 },
  selector: { desktop: 380, mobile: 0 },
} as const;

export const STAGE_TWEEN_START = 0.001;

export const STAGE_PERSPECTIVE_PX = 1400;

export const REVEAL = {
  offsetPx: 28,
  durationS: 0.9,
  staggerS: 0.09,
  viewportAmount: 0.25,
  lineOffset: "110%",
  lineRest: "0%",
  lineDurationS: 1.1,
  lineStaggerS: 0.1,
} as const;

export const BREAKPOINT = {
  desktopMin: 1024,
  tabletMin: 768,
} as const;

export const MEDIA = {
  desktop: `(min-width: ${BREAKPOINT.desktopMin}px)`,
  mobile: `(max-width: ${BREAKPOINT.desktopMin - 1}px)`,
  reduceMotion: "(prefers-reduced-motion: reduce)",
  allowMotion: "(prefers-reduced-motion: no-preference)",
} as const;

export const Z_INDEX = {
  background: 0,
  decoration: 10,
  stage: 20,
  foreground: 30,
  header: 50,
  scrollProgress: 55,
  skipLink: 70,
} as const;

export const MOTION_SPRING = {
  hover: { type: "spring", stiffness: 260, damping: 26, mass: 0.6 },
  tap: { type: "spring", stiffness: 500, damping: 30 },
  accordion: { duration: 0.5, ease: EASE.soft },
} as const;

export const MOTION_GESTURE = {
  hover: { scale: 1.03 },
  tap: { scale: 0.97 },
} as const;
