"use client";

import { m, type Variants } from "motion/react";
import { Reveal, RevealLines } from "@/components/motion/Reveal";
import { stopDelay, TRACK } from "@/components/sections/timelineTiming";
import { CoverPair } from "@/components/ui/CoverPair";
import { EASE, REVEAL } from "@/lib/constants/motion";
import { copy } from "@/lib/content/copy";
import { sectionIds } from "@/lib/content/links";
import { useSelectedEditionId } from "@/lib/selection/SelectionContext";

const STOPS = copy.timeline.stops;
const TOTAL_STOPS = STOPS.length;
const VIEWPORT = { once: true, amount: REVEAL.viewportAmount } as const;
const NO_TILT = 0;

const MARKER_SPRING = { type: "spring", stiffness: 420, damping: 18 } as const;
const RING = { toScale: 5, fromOpacity: 0.9, durationS: 0.9 } as const;
const LABEL = { lagS: 0.05, fromY: 8, durationS: 0.5 } as const;
const COVER = {
  lagS: 0.12,
  fromY: 24,
  fromRotate: -12,
  fromScale: 0.6,
  tilt: [-4, 3, -2, 4],
  spring: { type: "spring", stiffness: 260, damping: 16 },
} as const;

const trackVariants: Variants = { hidden: {}, visible: {} };

const drawTransition = {
  delay: TRACK.startDelayS,
  duration: TRACK.drawS,
  ease: "linear",
} as const;

const lineXVariants: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: drawTransition },
};

const lineYVariants: Variants = {
  hidden: { scaleY: 0 },
  visible: { scaleY: 1, transition: drawTransition },
};

const markerVariants: Variants = {
  hidden: { scale: 0 },
  visible: (index: number) => ({
    scale: 1,
    transition: { ...MARKER_SPRING, delay: stopDelay(index, TOTAL_STOPS) },
  }),
};

const ringVariants: Variants = {
  hidden: { scale: 1, opacity: 0 },
  visible: (index: number) => ({
    scale: [1, RING.toScale],
    opacity: [RING.fromOpacity, 0],
    transition: {
      delay: stopDelay(index, TOTAL_STOPS),
      duration: RING.durationS,
      ease: EASE.soft,
    },
  }),
};

const labelVariants: Variants = {
  hidden: { opacity: 0, y: LABEL.fromY },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: stopDelay(index, TOTAL_STOPS) + LABEL.lagS,
      duration: LABEL.durationS,
      ease: EASE.soft,
    },
  }),
};

const coverVariants: Variants = {
  hidden: {
    opacity: 0,
    y: COVER.fromY,
    rotate: COVER.fromRotate,
    scale: COVER.fromScale,
  },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    rotate: COVER.tilt[index] ?? NO_TILT,
    scale: 1,
    transition: {
      ...COVER.spring,
      delay: stopDelay(index, TOTAL_STOPS) + COVER.lagS,
    },
  }),
};

export function SubscriptionTimelineSection() {
  const editionId = useSelectedEditionId();

  return (
    <section
      aria-label="Assinar sem precisar lembrar"
      className="section-y relative overflow-hidden bg-stage"
      id={sectionIds.timeline}
    >
      <div className="px-[var(--gutter)] text-center">
        <RevealLines
          as="h2"
          className="font-display text-[clamp(2.2rem,4.4vw,4.2rem)] font-bold text-ink"
          lines={[copy.timeline.lines[0]]}
        />
      </div>

      <div className="mx-auto mt-16 max-w-6xl px-[var(--gutter)] md:mt-24">
        <m.div
          className="relative"
          initial="hidden"
          variants={trackVariants}
          viewport={VIEWPORT}
          whileInView="visible"
        >
          <span
            aria-hidden="true"
            className="absolute inset-x-[12.5%] top-5 hidden h-px bg-line-strong md:block"
          />
          <m.span
            aria-hidden="true"
            className="absolute inset-x-[12.5%] top-5 hidden h-0.5 -translate-y-px origin-left bg-brand md:block"
            variants={lineXVariants}
          />
          <span
            aria-hidden="true"
            className="absolute inset-y-9 left-5 w-px bg-line-strong md:hidden"
          />
          <m.span
            aria-hidden="true"
            className="absolute inset-y-9 left-5 w-0.5 -translate-x-px origin-top bg-brand md:hidden"
            variants={lineYVariants}
          />

          <ol className="relative grid gap-10 md:grid-cols-4 md:gap-0">
            {STOPS.map((stop, index) => (
              <li
                className="relative flex items-center gap-5 md:flex-col md:gap-0 md:text-center"
                key={stop.when}
              >
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                  <m.span
                    aria-hidden="true"
                    className="absolute h-2.5 w-2.5 rounded-full border border-brand"
                    custom={index}
                    variants={ringVariants}
                  />
                  <m.span
                    aria-hidden="true"
                    className="relative block h-2.5 w-2.5 rounded-full bg-brand"
                    custom={index}
                    variants={markerVariants}
                  />
                </span>
                <m.div
                  className="md:mt-4"
                  custom={index}
                  variants={labelVariants}
                >
                  <span className="label block text-ink">{stop.when}</span>
                  <span className="mt-1 block text-sm text-ink-muted">
                    {stop.what}
                  </span>
                </m.div>
                <m.div
                  className="ml-auto md:ml-0 md:mt-8"
                  custom={index}
                  variants={coverVariants}
                >
                  <CoverPair className="w-12 lg:w-16" editionId={editionId} />
                </m.div>
              </li>
            ))}
          </ol>
        </m.div>
      </div>

      <div className="mt-16 px-[var(--gutter)] text-center md:mt-24">
        <RevealLines
          className="font-display text-[clamp(2.2rem,4.4vw,4.2rem)] font-bold text-brand"
          lines={[copy.timeline.lines[1]]}
        />
        <Reveal>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-ink-muted lg:text-base">
            {copy.timeline.note}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
