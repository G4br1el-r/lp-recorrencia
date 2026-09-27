"use client";

import { type PointerEvent, type ReactNode, useRef, useState } from "react";
import { gsap, type ScrollTrigger } from "@/components/motion/gsap";
import { StageLayer, StageProvider } from "@/components/motion/ProductStage";
import { useLenis } from "@/components/motion/SmoothScrollProvider";
import { SplitText } from "@/components/motion/SplitText";
import { snapStops } from "@/components/motion/snap";
import {
  type BookState,
  HOVER_NEUTRAL,
  type HoverState,
  moveBook,
  moveLight,
  STAGE_LIGHT,
} from "@/components/motion/stage";
import {
  holdUntilPinEnd,
  PIN_LENGTH_VH,
  pinnedTimeline,
  useScene,
} from "@/components/motion/useScene";
import { revealRowOnFocus } from "@/components/sections/editionsFocus";
import { ProductBook } from "@/components/ui/ProductBook";
import { GSAP_EASE } from "@/lib/constants/motion";
import { copy } from "@/lib/content/copy";
import { type EditionId, editions } from "@/lib/content/editions";
import { links, sectionIds } from "@/lib/content/links";
import { pad } from "@/lib/format/number";
import { useSelectionActions } from "@/lib/selection/SelectionContext";

const SEGMENT_STARTS = [0.03, 0.23, 0.43] as const;
const SEGMENT = {
  enter: 0.09,
  turnAt: 0.09,
  turn: 0.1,
  exitAt: 0.19,
  exit: 0.07,
  labelInAt: 0.045,
  labelOutAt: 0.18,
  labelDuration: 0.045,
  labelStagger: 0.015,
  fillAt: 0.09,
  fill: 0.05,
  extraDelay: 0.02,
  extraFromY: 16,
  wordSpan: 0.27,
  wordFade: 0.045,
} as const;
const GATHER = {
  at: 0.68,
  duration: 0.1,
  stagger: 0.02,
  copyAt: 0.76,
  copyDuration: 0.06,
  lineStagger: 0.03,
  labelStagger: 0.02,
  labelFromY: 12,
} as const;
const POINTER_CENTER = 0.5;
const HALF = 0.5;
const ROW_REST = GATHER.copyAt + GATHER.copyDuration;
const REST = [
  ...SEGMENT_STARTS.map(
    (start) => start + SEGMENT.turnAt + SEGMENT.turn * HALF,
  ),
  ROW_REST,
];
const SCROLL_TO_ROW = { duration: 1.4 } as const;
const HOVER = {
  from: 0.8,
  liftVh: 3,
  grow: 0.1,
  tiltX: 12,
  tiltY: 22,
  dim: 0.65,
  duration: 0.7,
  ease: GSAP_EASE.cinematic,
} as const;
const HOVER_FIELDS = [
  "liftVh",
  "grow",
  "face",
  "tiltX",
  "tiltY",
  "dim",
] as const satisfies readonly (keyof HoverState)[];
type HoverControls = {
  move: (index: number, event: PointerEvent<HTMLElement>) => void;
  focus: (index: number) => void;
  leave: () => void;
  isInteractive: () => boolean;
};
const WORD_TRAVEL = { fromXVw: 40, toXVw: -40 } as const;
const LINE_OFFSET_PERCENT = 110;
const FILL_CLIP = {
  empty: "inset(0% 100% 0% 0%)",
  full: "inset(0% 0% 0% 0%)",
} as const;

function RevealLine({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={["mask-line", className].filter(Boolean).join(" ")}>
      <span data-split-line="">{children}</span>
    </span>
  );
}

const SHOWCASE = {
  desktop: { xVw: 16, yVh: -8, scale: 1.15 },
  mobile: { xVw: 0, yVh: -16, scale: 1.25 },
  rotateFrom: -24,
  rotateTo: 14,
  enterXVw: 72,
  exitXVw: -64,
  travelRotation: 38,
  travelScale: 0.85,
  blurPx: 14,
} as const;

function showcaseState(isDesktop: boolean, turned: boolean): BookState {
  const place = isDesktop ? SHOWCASE.desktop : SHOWCASE.mobile;
  return {
    xVw: place.xVw,
    yVh: place.yVh,
    zPx: 0,
    scale: place.scale,
    rotationY: turned ? SHOWCASE.rotateTo : SHOWCASE.rotateFrom,
    opacity: 1,
    blurPx: 0,
    reflect: 1,
  };
}

function travelState(isDesktop: boolean, entering: boolean): BookState {
  const showcase = showcaseState(isDesktop, !entering);
  return {
    ...showcase,
    xVw: entering ? SHOWCASE.enterXVw : SHOWCASE.exitXVw,
    rotationY: entering ? SHOWCASE.travelRotation : -SHOWCASE.travelRotation,
    scale: showcase.scale * SHOWCASE.travelScale,
    opacity: 0,
    blurPx: SHOWCASE.blurPx,
  };
}

const EDITION_ROW = {
  desktop: { xVw: [-28, 0, 28], scale: 0.72, rotationY: [14, 0, -14] },
  mobile: { xVw: [-28, 0, 28], scale: 0.52, rotationY: [10, 0, -10] },
} as const;

const ROW_Y_VH = 5;
const ROW_RISE_VH = 36;

function rowState(isDesktop: boolean, index: number): BookState {
  const row = isDesktop ? EDITION_ROW.desktop : EDITION_ROW.mobile;
  return {
    xVw: row.xVw[index],
    yVh: ROW_Y_VH,
    zPx: 0,
    scale: row.scale,
    rotationY: row.rotationY[index],
    opacity: 1,
    blurPx: 0,
    reflect: 1,
  };
}

function rowRiseState(isDesktop: boolean, index: number): BookState {
  return {
    ...rowState(isDesktop, index),
    yVh: ROW_Y_VH + ROW_RISE_VH,
    opacity: 0,
  };
}

const ROW_LABEL_CLASS = [
  "left-[calc(50%-28vw)]",
  "left-1/2",
  "left-[calc(50%+28vw)]",
] as const;

const EDITION_ORDER: EditionId[] = ["traditional", "largePrint", "celebration"];

function EditionsScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const hoverRef = useRef<HoverControls | null>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const { selectEdition } = useSelectionActions();
  const lenis = useLenis();

  useScene(sectionRef, (context) => {
    const { isDesktop, select, books, hover, light } = context;
    const row = isDesktop ? EDITION_ROW.desktop : EDITION_ROW.mobile;
    const hits = select("[data-row-hit]");
    const setters = EDITION_ORDER.map((id) =>
      HOVER_FIELDS.map((field) =>
        gsap.quickTo(hover[id], field, {
          duration: HOVER.duration,
          ease: HOVER.ease,
        }),
      ),
    );
    const aim = (
      focus: number | null,
      pointerX = POINTER_CENTER,
      pointerY = POINTER_CENTER,
    ) => {
      setters.forEach((fieldSetters, index) => {
        const target: HoverState =
          index === focus
            ? {
                liftVh: HOVER.liftVh,
                grow: HOVER.grow,
                face: 1,
                tiltX: (pointerY - POINTER_CENTER) * HOVER.tiltX,
                tiltY: (pointerX - POINTER_CENTER) * HOVER.tiltY,
                dim: 0,
              }
            : { ...HOVER_NEUTRAL, dim: focus === null ? 0 : HOVER.dim };
        HOVER_FIELDS.forEach((field, fieldIndex) => {
          fieldSetters[fieldIndex](target[field]);
        });
      });
      setFocused(focus);
    };
    let interactive = false;
    hoverRef.current = {
      move: (index, event) => {
        if (event.pointerType !== "mouse") {
          return;
        }
        const rect = event.currentTarget.getBoundingClientRect();
        aim(
          index,
          (event.clientX - rect.left) / rect.width,
          (event.clientY - rect.top) / rect.height,
        );
      },
      focus: (index) => aim(index),
      leave: () => aim(null),
      isInteractive: () => interactive,
    };
    hits.forEach((hit, index) => {
      gsap.set(hit, {
        left: `calc(50% + ${row.xVw[index]}vw)`,
        width: `calc(var(--book-width) * ${row.scale})`,
      });
    });

    const setInteractive = (next: boolean) => {
      if (next === interactive) {
        return;
      }
      interactive = next;
      gsap.set(hits, { pointerEvents: next ? "auto" : "none" });
      if (!next) {
        aim(null);
      }
    };

    const timeline = pinnedTimeline(context, PIN_LENGTH_VH.editions, {
      id: "editions",
      onUpdate: (self) =>
        setInteractive(self.isActive && self.progress >= HOVER.from),
    });
    snapStops(timeline, REST);
    triggerRef.current = timeline.scrollTrigger ?? null;
    const gatherLines = select("[data-editions-gather] [data-split-line]");
    const rowLabels = select("[data-row-label]");
    gsap.set(select("[data-edition-label] [data-split-line]"), {
      yPercent: LINE_OFFSET_PERCENT,
    });
    gsap.set(select("[data-edition-extra]"), {
      autoAlpha: 0,
      y: SEGMENT.extraFromY,
    });
    gsap.set(select("[data-edition-word]"), { autoAlpha: 0 });
    gsap.set(select("[data-edition-fill]"), { clipPath: FILL_CLIP.empty });
    gsap.set(gatherLines, { yPercent: LINE_OFFSET_PERCENT });
    gsap.set(rowLabels, { autoAlpha: 0, y: GATHER.labelFromY });

    moveLight(
      timeline,
      light,
      STAGE_LIGHT.off,
      STAGE_LIGHT.dailyEnd,
      SEGMENT_STARTS[0],
      SEGMENT.enter,
    );

    EDITION_ORDER.forEach((id, index) => {
      const start = SEGMENT_STARTS[index];
      const isLast = index === EDITION_ORDER.length - 1;
      const showcase = showcaseState(isDesktop, false);
      const turned = showcaseState(isDesktop, true);

      moveBook(
        timeline,
        books[id],
        travelState(isDesktop, true),
        showcase,
        start,
        SEGMENT.enter,
        GSAP_EASE.cinematic,
      );
      moveBook(
        timeline,
        books[id],
        showcase,
        turned,
        start + SEGMENT.turnAt,
        SEGMENT.turn,
        GSAP_EASE.breathe,
      );
      if (!isLast) {
        moveBook(
          timeline,
          books[id],
          turned,
          travelState(isDesktop, false),
          start + SEGMENT.exitAt,
          SEGMENT.exit,
          GSAP_EASE.exit,
        );
      }

      const word = select(`[data-edition-word="${index}"]`);
      timeline
        .fromTo(
          word,
          { x: `${WORD_TRAVEL.fromXVw}vw` },
          {
            x: `${WORD_TRAVEL.toXVw}vw`,
            duration: SEGMENT.wordSpan,
            immediateRender: false,
          },
          start,
        )
        .to(word, { autoAlpha: 1, duration: SEGMENT.wordFade }, start)
        .to(
          word,
          { autoAlpha: 0, duration: SEGMENT.wordFade },
          start + SEGMENT.wordSpan - SEGMENT.wordFade,
        );

      const label = `[data-edition-label="${index}"]`;
      const lines = select(`${label} [data-split-line]`);
      const extra = select(`${label} [data-edition-extra]`);
      const labelOut = isLast ? GATHER.at : start + SEGMENT.labelOutAt;
      timeline
        .fromTo(
          select(`${label} [data-edition-fill]`),
          { clipPath: FILL_CLIP.empty },
          {
            clipPath: FILL_CLIP.full,
            duration: SEGMENT.fill,
            ease: GSAP_EASE.wipe,
            immediateRender: false,
          },
          start + SEGMENT.fillAt,
        )
        .to(
          lines,
          {
            yPercent: 0,
            stagger: SEGMENT.labelStagger,
            duration: SEGMENT.labelDuration,
            ease: GSAP_EASE.reveal,
          },
          start + SEGMENT.labelInAt,
        )
        .to(
          extra,
          { autoAlpha: 1, y: 0, duration: SEGMENT.labelDuration },
          start + SEGMENT.labelInAt + SEGMENT.extraDelay,
        )
        .to(
          lines,
          {
            yPercent: -LINE_OFFSET_PERCENT,
            stagger: SEGMENT.labelStagger,
            duration: SEGMENT.labelDuration,
          },
          labelOut,
        )
        .to(
          extra,
          {
            autoAlpha: 0,
            y: -SEGMENT.extraFromY,
            duration: SEGMENT.labelDuration,
          },
          labelOut,
        );
    });

    moveBook(
      timeline,
      books.traditional,
      rowRiseState(isDesktop, 0),
      rowState(isDesktop, 0),
      GATHER.at,
      GATHER.duration,
      GSAP_EASE.cinematic,
    );
    moveBook(
      timeline,
      books.largePrint,
      rowRiseState(isDesktop, 1),
      rowState(isDesktop, 1),
      GATHER.at + GATHER.stagger,
      GATHER.duration,
      GSAP_EASE.cinematic,
    );
    moveBook(
      timeline,
      books.celebration,
      showcaseState(isDesktop, true),
      rowState(isDesktop, 2),
      GATHER.at,
      GATHER.duration,
    );
    moveLight(
      timeline,
      light,
      STAGE_LIGHT.dailyEnd,
      STAGE_LIGHT.editionsEnd,
      GATHER.at,
      GATHER.duration,
    );

    timeline
      .to(
        gatherLines,
        {
          yPercent: 0,
          duration: GATHER.copyDuration,
          stagger: GATHER.lineStagger,
          ease: GSAP_EASE.reveal,
        },
        GATHER.copyAt,
      )
      .to(
        rowLabels,
        {
          autoAlpha: 1,
          y: 0,
          duration: GATHER.copyDuration,
          stagger: GATHER.labelStagger,
        },
        GATHER.copyAt,
      );
    holdUntilPinEnd(timeline);

    return () => {
      hoverRef.current = null;
      triggerRef.current = null;
      for (const id of EDITION_ORDER) {
        Object.assign(hover[id], HOVER_NEUTRAL);
      }
    };
  });

  const focusHit = (index: number) => {
    const controls = hoverRef.current;
    revealRowOnFocus({
      interactive: controls?.isInteractive() ?? true,
      trigger: triggerRef.current,
      lenis,
      progress: ROW_REST,
      duration: SCROLL_TO_ROW.duration,
    });
    controls?.focus(index);
  };

  return (
    <section
      aria-label="Três formas de viver a experiência"
      className="relative h-svh overflow-hidden bg-stage"
      id={sectionIds.editions}
      ref={sectionRef}
    >
      <StageLayer />
      {editions.map((edition, index) => (
        <div
          aria-hidden="true"
          className="motion-only absolute inset-0 z-0 flex items-center justify-center whitespace-nowrap will-change-transform lg:[mask-image:linear-gradient(90deg,transparent_34%,black_52%)]"
          data-edition-word={index}
          key={edition.id}
        >
          <span className="font-display text-[clamp(6rem,17vw,20rem)] font-bold uppercase text-transparent [-webkit-text-stroke:1px_rgba(242,235,224,0.16)]">
            {edition.subtitle}
          </span>
        </div>
      ))}

      <div className="pointer-events-none absolute inset-0 z-30">
        <div className="absolute left-[var(--gutter)] top-[calc(var(--header-height)+2vh)]">
          <h2 className="label">{copy.editions.intro}</h2>
        </div>

        {editions.map((edition, index) => (
          <div
            className="motion-only absolute inset-x-[var(--gutter)] bottom-[7vh] lg:bottom-auto lg:left-[var(--gutter)] lg:right-auto lg:top-1/2 lg:w-[40vw] lg:-translate-y-1/2"
            data-edition-label={index}
            key={edition.id}
          >
            <RevealLine className="label">
              <span className="text-brand">{edition.index}</span>
              <span className="text-ink-dim"> / {pad(editions.length)}</span>
              <span className="ml-3">{edition.name}</span>
            </RevealLine>
            <h3 className="font-display mt-4 text-balance text-[clamp(3rem,5.4vw,6rem)] font-bold leading-[0.92] lg:mt-5">
              <RevealLine>
                <span className="relative block">
                  <span className="block text-transparent [-webkit-text-stroke:1px_rgba(242,235,224,0.45)]">
                    {edition.subtitle}
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 text-ink"
                    data-edition-fill=""
                  >
                    {edition.subtitle}
                  </span>
                </span>
              </RevealLine>
            </h3>
            <SplitText
              className="font-display mt-4 text-[clamp(1.4rem,2.2vw,2.2rem)] font-bold leading-tight text-brand lg:mt-5"
              lines={edition.hook}
            />
            <p
              className="mt-5 hidden max-w-md text-base leading-relaxed text-ink-muted lg:block lg:text-lg"
              data-edition-extra=""
            >
              {edition.tagline} {edition.audience}
            </p>
            <ul
              className="mt-7 hidden grid-cols-3 gap-6 border-t border-line pt-6 lg:grid"
              data-edition-extra=""
            >
              {edition.highlights.map((item, itemIndex) => (
                <li key={item}>
                  <span className="label block text-brand">
                    {pad(itemIndex + 1)}
                  </span>
                  <span className="mt-2 block text-sm leading-snug text-ink">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div
          className="absolute inset-x-[var(--gutter)] top-[calc(var(--header-height)+6vh)] text-center"
          data-editions-gather=""
        >
          <SplitText
            className="font-display text-[clamp(2rem,4.4vw,4.2rem)] font-bold text-ink"
            lines={copy.editions.lines}
          />
        </div>

        {EDITION_ORDER.map((id, index) => (
          <div
            className={[
              "absolute bottom-[8vh] w-[26vw] -translate-x-1/2 text-center lg:w-[22vw]",
              ROW_LABEL_CLASS[index],
            ].join(" ")}
            data-row-label=""
            key={id}
          >
            <span
              className={[
                "label block text-[0.62rem] transition-colors duration-500 lg:text-[0.74rem]",
                focused === index
                  ? "text-brand"
                  : focused === null
                    ? "text-ink"
                    : "text-ink-muted",
              ].join(" ")}
            >
              {editions[index].subtitle}
            </span>
            <span
              className={[
                "absolute inset-x-0 top-full mt-2 hidden text-sm text-ink-muted transition-all duration-500 lg:block",
                focused === index
                  ? "translate-y-0 opacity-100"
                  : "translate-y-2 opacity-0",
              ].join(" ")}
            >
              {editions[index].tagline}
            </span>
          </div>
        ))}
      </div>

      <div className="motion-only pointer-events-none absolute inset-0 z-40">
        {EDITION_ORDER.map((id, index) => (
          <a
            className="pointer-events-none absolute top-1/2 aspect-[2/3] -translate-x-1/2 -translate-y-1/2 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-brand"
            data-row-hit={index}
            href={links.plans}
            key={id}
            onBlur={() => hoverRef.current?.leave()}
            onClick={() => selectEdition(id)}
            onFocus={() => focusHit(index)}
            onPointerLeave={() => hoverRef.current?.leave()}
            onPointerMove={(event) => hoverRef.current?.move(index, event)}
          >
            <span className="sr-only">
              Assinar {editions[index].name} — {editions[index].subtitle}
            </span>
          </a>
        ))}
      </div>

      <div className="reduced-only absolute inset-0 z-20">
        <div className="flex h-full items-center justify-center gap-[6vw]">
          {editions.map((edition) => (
            <ProductBook
              edition={edition}
              key={edition.id}
              style={{
                fontSize: "calc(var(--book-width) * 0.13)",
                width: "calc(var(--book-width) * 0.7)",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function EditionsSection() {
  return (
    <StageProvider>
      <EditionsScene />
    </StageProvider>
  );
}
