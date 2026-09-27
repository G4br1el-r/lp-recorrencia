"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/components/motion/gsap";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { StageLayer, StageProvider } from "@/components/motion/ProductStage";
import { SplitText } from "@/components/motion/SplitText";
import { snapStops } from "@/components/motion/snap";
import {
  type BookState,
  type FanSide,
  heroFanState,
  moveBook,
  moveLight,
  STAGE,
  STAGE_LIGHT,
} from "@/components/motion/stage";
import {
  PIN_LENGTH_VH,
  pinnedTimeline,
  useScene,
} from "@/components/motion/useScene";
import { ButtonLink } from "@/components/ui/Button";
import { PhotoBackdrop } from "@/components/ui/SceneBackdrop";
import { siteAssets } from "@/lib/assets";
import { GSAP_EASE, MEDIA } from "@/lib/constants/motion";
import { copy } from "@/lib/content/copy";
import type { EditionId } from "@/lib/content/editions";
import { links, sectionIds } from "@/lib/content/links";
import { type CssVariables, seconds } from "@/lib/style/cssVariables";

const LINE_OFFSET_PERCENT = 110;

const INTRO = {
  mediaFromScale: 1.14,
  mediaDuration: 3,
  lineAt: 0.2,
  lineDuration: 1.4,
  lineStagger: 0.12,
  fadeAt: 0.7,
  fadeDuration: 1,
  fadeStagger: 0.15,
  fadeFromY: 16,
  hintAt: 1.6,
  hintFadeDuration: 1,
  hintDrawS: 1.4,
  hintLoopDelayS: 0.9,
} as const;

const FADE_ORDER = { eyebrow: 0, actions: 1 } as const;

const INTRO_STYLE: CssVariables = {
  "--hero-media-from-scale": INTRO.mediaFromScale,
  "--hero-media-duration": seconds(INTRO.mediaDuration),
  "--hero-line-offset": `${LINE_OFFSET_PERCENT}%`,
  "--hero-line-at": seconds(INTRO.lineAt),
  "--hero-line-duration": seconds(INTRO.lineDuration),
  "--hero-line-stagger": seconds(INTRO.lineStagger),
  "--hero-fade-at": seconds(INTRO.fadeAt),
  "--hero-fade-duration": seconds(INTRO.fadeDuration),
  "--hero-fade-stagger": seconds(INTRO.fadeStagger),
  "--hero-fade-from-y": `${INTRO.fadeFromY}px`,
  "--hero-hint-at": seconds(INTRO.hintAt),
  "--hero-hint-duration": seconds(INTRO.hintFadeDuration),
};

function fadeOrderStyle(order: number): CssVariables {
  return { "--hero-fade-index": order };
}

const HINT_DRAW = {
  empty: "0% 0%",
  full: "0% 100%",
  gone: "100% 100%",
  segments: 2,
  infinite: -1,
} as const;

const HINT_ACTIVE_RANGE = {
  start: "top bottom",
  end: "top -100%",
  toggleActions: "play pause resume pause",
} as const;

const SCROLL = {
  copyOut: { at: 0, duration: 0.28, y: -80 },
  hintOut: { at: 0, duration: 0.1 },
  push: { at: 0, duration: 1, scale: 1.2 },
  dim: { at: 0.12, duration: 0.4, opacity: 0.55 },
  bookRise: { at: 0.3, duration: 0.3 },
  encounter: { at: 0.56, duration: 0.14, stagger: 0.05 },
  fanOpen: { at: 0.6, duration: 0.16, stagger: 0.03 },
  fanClose: { at: 0.84, duration: 0.1 },
  ascend: { at: 0.84, duration: 0.16 },
} as const;

const REST = [0, 0.8] as const;

const FAN_BOOKS: readonly { id: EditionId; side: FanSide }[] = [
  { id: "largePrint", side: -1 },
  { id: "celebration", side: 1 },
];

const HERO_BOOK_FROM: BookState = {
  xVw: 0,
  yVh: 28,
  zPx: 0,
  scale: 0.6,
  rotationY: -32,
  opacity: 0,
  blurPx: 14,
  reflect: 0,
};
const HERO_BOOK_ASCEND: BookState = {
  ...STAGE.heroEnd,
  yVh: -48,
  scale: 0.78,
  rotationY: 10,
  opacity: 0,
};

function HeroScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const hintPathRef = useRef<SVGPathElement>(null);

  useScene(sectionRef, (context) => {
    const { select, books, light, isDesktop } = context;
    gsap.set(select("[data-encounter] [data-split-line]"), {
      yPercent: LINE_OFFSET_PERCENT,
      visibility: "visible",
    });

    const timeline = pinnedTimeline(context, PIN_LENGTH_VH.hero, {
      id: "hero",
    });
    snapStops(timeline, REST);
    timeline
      .to(
        select("[data-hero-copy]"),
        {
          y: SCROLL.copyOut.y,
          autoAlpha: 0,
          duration: SCROLL.copyOut.duration,
        },
        SCROLL.copyOut.at,
      )
      .to(
        select("[data-hero-hint]"),
        { autoAlpha: 0, duration: SCROLL.hintOut.duration },
        SCROLL.hintOut.at,
      )
      .fromTo(
        select("[data-backdrop-media]"),
        { scale: 1 },
        {
          scale: SCROLL.push.scale,
          duration: SCROLL.push.duration,
          immediateRender: false,
        },
        SCROLL.push.at,
      )
      .fromTo(
        select("[data-backdrop-dim]"),
        { opacity: 0 },
        {
          opacity: SCROLL.dim.opacity,
          duration: SCROLL.dim.duration,
          immediateRender: false,
        },
        SCROLL.dim.at,
      )
      .to(
        select("[data-encounter] [data-split-line]"),
        {
          yPercent: 0,
          stagger: SCROLL.encounter.stagger,
          duration: SCROLL.encounter.duration,
          ease: GSAP_EASE.reveal,
        },
        SCROLL.encounter.at,
      );

    moveBook(
      timeline,
      books.traditional,
      HERO_BOOK_FROM,
      STAGE.heroEnd,
      SCROLL.bookRise.at,
      SCROLL.bookRise.duration,
      GSAP_EASE.reveal,
    );
    moveLight(
      timeline,
      light,
      STAGE_LIGHT.off,
      STAGE_LIGHT.heroEnd,
      SCROLL.bookRise.at,
      SCROLL.bookRise.duration,
    );
    moveBook(
      timeline,
      books.traditional,
      STAGE.heroEnd,
      HERO_BOOK_ASCEND,
      SCROLL.ascend.at,
      SCROLL.ascend.duration,
      GSAP_EASE.exit,
    );
    FAN_BOOKS.forEach(({ id, side }, index) => {
      const tucked = heroFanState(isDesktop, side, false);
      const open = heroFanState(isDesktop, side, true);
      moveBook(
        timeline,
        books[id],
        tucked,
        open,
        SCROLL.fanOpen.at + index * SCROLL.fanOpen.stagger,
        SCROLL.fanOpen.duration,
        GSAP_EASE.cinematic,
      );
      moveBook(
        timeline,
        books[id],
        open,
        tucked,
        SCROLL.fanClose.at,
        SCROLL.fanClose.duration,
        GSAP_EASE.exit,
      );
    });
    moveLight(
      timeline,
      light,
      STAGE_LIGHT.heroEnd,
      STAGE_LIGHT.off,
      SCROLL.ascend.at,
      SCROLL.ascend.duration,
    );
  });

  useEffect(() => {
    const section = sectionRef.current;
    const hintPath = hintPathRef.current;
    if (!section || !hintPath) {
      return;
    }
    if (window.matchMedia(MEDIA.reduceMotion).matches) {
      return;
    }
    const hintSegmentDuration = INTRO.hintDrawS / HINT_DRAW.segments;
    const hint = gsap
      .timeline({
        repeat: HINT_DRAW.infinite,
        repeatDelay: INTRO.hintLoopDelayS,
        defaults: { ease: GSAP_EASE.breathe, duration: hintSegmentDuration },
      })
      .fromTo(
        hintPath,
        { drawSVG: HINT_DRAW.empty },
        { drawSVG: HINT_DRAW.full },
      )
      .to(hintPath, { drawSVG: HINT_DRAW.gone });
    const hintTrigger = ScrollTrigger.create({
      trigger: section,
      start: HINT_ACTIVE_RANGE.start,
      end: HINT_ACTIVE_RANGE.end,
      toggleActions: HINT_ACTIVE_RANGE.toggleActions,
      animation: hint,
    });

    return () => {
      hintTrigger.kill();
      hint.kill();
    };
  }, []);

  return (
    <section
      aria-label="Abertura"
      className="relative h-svh overflow-hidden bg-stage"
      data-hero-intro=""
      id={sectionIds.hero}
      ref={sectionRef}
      style={INTRO_STYLE}
    >
      <PhotoBackdrop
        asset={siteAssets.lifestyle.churchAisle}
        controlled
        preload
        shade="center"
      />
      <StageLayer />

      <div className="relative z-30 flex h-full flex-col items-center justify-center px-[var(--gutter)] text-center">
        <div className="flex max-w-5xl flex-col items-center" data-hero-copy="">
          <span
            className="label block text-ink"
            data-hero-fade=""
            style={fadeOrderStyle(FADE_ORDER.eyebrow)}
          >
            {copy.hero.eyebrow}
          </span>
          <SplitText
            as="h1"
            className="font-display mt-6 text-[clamp(2.6rem,6.6vw,6.4rem)] font-bold leading-[0.95] text-ink"
            data-hero-headline=""
            lines={copy.hero.lines}
          />
          <div
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
            data-hero-fade=""
            style={fadeOrderStyle(FADE_ORDER.actions)}
          >
            <MagneticButton>
              <ButtonLink
                className="px-7 py-3.5 text-base"
                href={links.plans}
                variant="brand"
              >
                {copy.hero.cta}
              </ButtonLink>
            </MagneticButton>
            <ButtonLink
              className="px-7 py-3.5 text-base"
              href={`#${sectionIds.editions}`}
              variant="ghost"
            >
              {copy.hero.secondaryCta}
            </ButtonLink>
          </div>
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-[10vh] z-30 px-[var(--gutter)]"
        data-encounter=""
      >
        <SplitText
          className="font-display mx-auto max-w-4xl text-center text-[clamp(1.6rem,3.2vw,3rem)] font-bold text-ink"
          highlight={copy.encounter.highlight}
          highlightClassName="text-brand"
          lines={copy.encounter.lines}
        />
      </div>

      <div
        className="absolute bottom-[clamp(1.5rem,5vh,3rem)] left-1/2 z-30 hidden -translate-x-1/2 md:block"
        data-hero-hint=""
      >
        <div
          className="flex flex-col items-center gap-3"
          data-hero-hint-body=""
        >
          <svg
            aria-hidden="true"
            className="h-10 w-4 text-brand"
            fill="none"
            viewBox="0 0 16 40"
          >
            <path
              d="M8 2v34"
              ref={hintPathRef}
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1"
            />
          </svg>
          <span className="label">{copy.hero.scrollHint}</span>
        </div>
      </div>
    </section>
  );
}

export function HeroSection() {
  return (
    <StageProvider>
      <HeroScene />
    </StageProvider>
  );
}
