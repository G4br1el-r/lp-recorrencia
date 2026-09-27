"use client";

import type { RefObject } from "react";
import { gsap, type ScrollTrigger, useGSAP } from "@/components/motion/gsap";
import { useStage } from "@/components/motion/ProductStage";
import type { LightState, StageState } from "@/components/motion/stage";
import { GSAP_EASE, MEDIA, PIN_LENGTH_VH, SCRUB } from "@/lib/constants/motion";

export type SceneContext = {
  isDesktop: boolean;
  section: HTMLElement;
  select: gsap.utils.SelectorFunc;
  books: StageState["books"];
  hover: StageState["hover"];
  light: LightState;
};

type PinLength = { desktop: number; mobile: number };
type PinDistancePx = () => number;

const VH_TO_FRACTION = 100;

export function pinEnd(isDesktop: boolean, length: PinLength): () => string {
  const vh = isDesktop ? length.desktop : length.mobile;
  return () => `+=${(window.innerHeight * vh) / VH_TO_FRACTION}`;
}

type PinnedTimelineOptions = {
  scrub?: number | boolean;
  pin?: boolean;
  id?: string;
  onUpdate?: (self: ScrollTrigger) => void;
};

export function pinnedTimeline(
  context: Pick<SceneContext, "section" | "isDesktop">,
  length: PinLength | PinDistancePx,
  options: PinnedTimelineOptions = {},
): gsap.core.Timeline {
  const end =
    typeof length === "function"
      ? () => `+=${length()}`
      : pinEnd(context.isDesktop, length);
  return gsap.timeline({
    defaults: { ease: GSAP_EASE.linear, lazy: false },
    scrollTrigger: {
      id: options.id,
      trigger: context.section,
      start: "top top",
      end,
      pin: options.pin ?? true,
      anticipatePin: 1,
      scrub: options.scrub ?? SCRUB.immediate,
      invalidateOnRefresh: true,
      onUpdate: options.onUpdate,
    },
  });
}

export function holdUntilPinEnd(timeline: gsap.core.Timeline): void {
  timeline.set({}, {}, 1);
}

export function useScene(
  ref: RefObject<HTMLElement | null>,
  build: (context: SceneContext) => unknown,
  dependencies: unknown[] = [],
): void {
  const stage = useStage();

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add(
        {
          desktop: MEDIA.desktop,
          mobile: MEDIA.mobile,
          allow: MEDIA.allowMotion,
        },
        (context) => {
          const conditions: gsap.Conditions = context.conditions ?? {};
          const section = ref.current;
          if (!conditions.allow || !section) {
            return;
          }
          const cleanup = build({
            isDesktop: Boolean(conditions.desktop),
            section,
            select: gsap.utils.selector(section),
            books: stage.books,
            hover: stage.hover,
            light: stage.light,
          });
          return typeof cleanup === "function" ? cleanup : undefined;
        },
      );
    },
    { scope: ref, dependencies },
  );
}

export { PIN_LENGTH_VH };
