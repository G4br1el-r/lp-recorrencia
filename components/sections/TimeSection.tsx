"use client";

import { useRef, useState } from "react";
import { gsap } from "@/components/motion/gsap";
import { StageLayer, StageProvider } from "@/components/motion/ProductStage";
import {
  Reveal,
  RevealGroup,
  RevealItem,
  RevealLines,
} from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { snapStops } from "@/components/motion/snap";
import {
  type BookState,
  moveBook,
  moveLight,
  STAGE,
  STAGE_LIGHT,
} from "@/components/motion/stage";
import {
  holdUntilPinEnd,
  PIN_LENGTH_VH,
  pinnedTimeline,
  useScene,
} from "@/components/motion/useScene";
import {
  CHAPTER,
  COLUMN,
  COLUMN_TRAVEL_SLOTS,
  chapterBoundary,
  chapterIn,
  chapterMonths,
  chapterOut,
  chapterSide,
  INTRO,
  OUTRO,
  TIME_CHAPTERS,
  TIME_MONTHS,
  TIME_REST,
} from "@/components/sections/timeTiming";
import { GSAP_EASE, STAGE_TWEEN_START } from "@/lib/constants/motion";
import { copy } from "@/lib/content/copy";
import { sectionIds } from "@/lib/content/links";
import { pad } from "@/lib/format/number";

const MONTH_HEIGHT_VH = { desktop: 30, mobile: 18 } as const;
const COLUMN_CENTER_VH = 50;
const ARRIVE = { at: STAGE_TWEEN_START, duration: 0.1, fromYVh: 30 } as const;
const PULSE = { low: 0.45 } as const;
const FADE_Y = 16;
const LINE_OFFSET_PERCENT = 110;
const HUD = { inAt: 0.11, outAt: 0.84, duration: 0.03 } as const;
const SIDE_POSE = {
  desktop: { xVw: 20, yVh: -2, scale: 0.92, rotationY: 16 },
  mobile: { xVw: 0, yVh: -14, scale: 0.8, rotationY: 14 },
} as const;
const HALF = 0.5;
const MONTH_STROKE = {
  idle: "rgba(242, 235, 224, 0.2)",
  active: "var(--color-brand)",
  fade: "opacity 500ms ease",
} as const;
const DAY_PAD = 3;
const MONTH_STAGGER_S = 0.05;

function MonthColumn({ active }: { active: number }) {
  return (
    <div
      className="flex flex-col items-center will-change-transform"
      data-month-column=""
    >
      {TIME_MONTHS.map((month, index) => (
        <span
          className="font-display relative flex h-[18vh] items-center justify-center text-[clamp(5rem,20vw,22rem)] font-bold text-transparent [-webkit-text-stroke-width:1px] lg:h-[30vh]"
          key={month.short}
        >
          <span
            style={{
              WebkitTextStrokeColor: MONTH_STROKE.idle,
              opacity: index === active ? 0 : 1,
              transition: MONTH_STROKE.fade,
            }}
          >
            {month.short}
          </span>
          <span
            className="absolute inset-0 flex items-center justify-center"
            style={{
              WebkitTextStrokeColor: MONTH_STROKE.active,
              opacity: index === active ? 1 : 0,
              transition: MONTH_STROKE.fade,
            }}
          >
            {month.short}
          </span>
        </span>
      ))}
    </div>
  );
}

function TimeScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const dayRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(0);

  useScene(sectionRef, (context) => {
    const { isDesktop, select, books, light } = context;
    const total = TIME_MONTHS.length;
    const monthHeight = isDesktop
      ? MONTH_HEIGHT_VH.desktop
      : MONTH_HEIGHT_VH.mobile;
    const columnY = (slot: number) =>
      COLUMN_CENTER_VH - (slot + HALF) * monthHeight;
    const place = isDesktop ? SIDE_POSE.desktop : SIDE_POSE.mobile;
    const pose = (chapter: number): BookState => {
      const side = chapterSide(chapter);
      return {
        ...STAGE.timeCenter,
        xVw: place.xVw * side,
        yVh: place.yVh,
        scale: place.scale,
        rotationY: -place.rotationY * side,
      };
    };

    const timeline = pinnedTimeline(context, PIN_LENGTH_VH.time, {
      id: "time",
      onUpdate: (self) => {
        const local = gsap.utils.clamp(
          0,
          1,
          gsap.utils.mapRange(
            COLUMN.at,
            COLUMN.at + COLUMN.duration,
            0,
            1,
            self.progress,
          ),
        );
        const position = local * COLUMN_TRAVEL_SLOTS - COLUMN.slotsBefore;
        setActive(gsap.utils.clamp(0, total - 1, Math.round(position)));
        if (dayRef.current) {
          const day = Math.round(
            ((position + HALF) / total) * copy.time.yearDays,
          );
          dayRef.current.textContent = pad(
            gsap.utils.clamp(1, copy.time.yearDays, day),
            DAY_PAD,
          );
        }
      },
    });
    snapStops(timeline, TIME_REST);

    const introLines = select("[data-time-copy='0'] [data-split-line]");
    const outroLines = select("[data-time-copy='1'] [data-split-line]");
    const introFade = select("[data-time-copy='0'] [data-time-fade]");
    const outroFade = select("[data-time-copy='1'] [data-time-fade]");
    const hud = select("[data-time-hud]");
    gsap.set([introLines, outroLines], { yPercent: LINE_OFFSET_PERCENT });
    gsap.set([introFade, outroFade], { autoAlpha: 0, y: FADE_Y });
    gsap.set(hud, { autoAlpha: 0 });

    moveBook(
      timeline,
      books.traditional,
      { ...STAGE.timeCenter, yVh: ARRIVE.fromYVh, opacity: 0 },
      STAGE.timeCenter,
      ARRIVE.at,
      ARRIVE.duration,
      GSAP_EASE.reveal,
    );
    moveLight(
      timeline,
      light,
      { ...STAGE_LIGHT.timeCenter, opacity: 0 },
      STAGE_LIGHT.timeCenter,
      ARRIVE.at,
      ARRIVE.duration,
    );

    const moveTo = (from: BookState, to: BookState, at: number) => {
      moveBook(timeline, books.traditional, from, to, at, CHAPTER.travel);
      timeline.fromTo(
        light,
        { xVw: from.xVw },
        {
          xVw: to.xVw,
          duration: CHAPTER.travel,
          ease: GSAP_EASE.camera,
          immediateRender: false,
        },
        at,
      );
    };
    moveTo(STAGE.timeCenter, pose(0), INTRO.outAt);
    for (let chapter = 1; chapter < TIME_CHAPTERS.length; chapter += 1) {
      moveTo(
        pose(chapter - 1),
        pose(chapter),
        chapterBoundary(chapter) - CHAPTER.travel / 2,
      );
    }
    moveTo(pose(TIME_CHAPTERS.length - 1), STAGE.timeCenter, CHAPTER.lastOut);

    timeline.fromTo(
      select("[data-month-column]"),
      { y: `${columnY(-COLUMN.slotsBefore)}vh` },
      {
        y: `${columnY(total - 1 + COLUMN.slotsAfter)}vh`,
        duration: COLUMN.duration,
        immediateRender: false,
      },
      COLUMN.at,
    );

    const pulseDuration = COLUMN.duration / total / 2;
    for (let index = 0; index < total; index += 1) {
      const start = COLUMN.at + index * pulseDuration * 2;
      timeline
        .fromTo(
          light,
          { opacity: STAGE_LIGHT.timeCenter.opacity },
          {
            opacity: PULSE.low,
            duration: pulseDuration,
            ease: GSAP_EASE.breathe,
            immediateRender: false,
          },
          start,
        )
        .fromTo(
          light,
          { opacity: PULSE.low },
          {
            opacity: STAGE_LIGHT.timeCenter.opacity,
            duration: pulseDuration,
            ease: GSAP_EASE.breathe,
            immediateRender: false,
          },
          start + pulseDuration,
        );
    }

    TIME_CHAPTERS.forEach((_, chapter) => {
      const block = `[data-time-chapter="${chapter}"]`;
      const lines = select(`${block} [data-split-line]`);
      const fades = select(`${block} [data-time-fade]`);
      gsap.set(lines, { yPercent: LINE_OFFSET_PERCENT });
      gsap.set(fades, { autoAlpha: 0, y: FADE_Y });
      const enter = chapterIn(chapter);
      const leave = chapterOut(chapter);
      timeline
        .to(
          lines,
          { yPercent: 0, duration: CHAPTER.inDuration, ease: GSAP_EASE.reveal },
          enter,
        )
        .to(
          fades,
          {
            autoAlpha: 1,
            y: 0,
            duration: CHAPTER.inDuration,
            stagger: CHAPTER.stagger,
          },
          enter + CHAPTER.stagger,
        )
        .to(
          lines,
          { yPercent: -LINE_OFFSET_PERCENT, duration: CHAPTER.outDuration },
          leave,
        )
        .to(
          fades,
          { autoAlpha: 0, y: -FADE_Y, duration: CHAPTER.outDuration },
          leave,
        );
    });

    timeline
      .to(
        introLines,
        { yPercent: 0, duration: INTRO.duration, ease: GSAP_EASE.reveal },
        INTRO.at,
      )
      .to(
        introFade,
        {
          autoAlpha: 1,
          y: 0,
          duration: INTRO.duration,
          stagger: INTRO.stagger,
        },
        INTRO.fadeAt,
      )
      .to(
        introLines,
        { yPercent: -LINE_OFFSET_PERCENT, duration: INTRO.outDuration },
        INTRO.outAt,
      )
      .to(
        introFade,
        { autoAlpha: 0, y: -FADE_Y, duration: INTRO.outDuration },
        INTRO.outAt,
      )
      .to(hud, { autoAlpha: 1, duration: HUD.duration }, HUD.inAt)
      .to(hud, { autoAlpha: 0, duration: HUD.duration }, HUD.outAt)
      .to(
        outroLines,
        { yPercent: 0, duration: OUTRO.duration, ease: GSAP_EASE.reveal },
        OUTRO.at,
      )
      .to(
        outroFade,
        { autoAlpha: 1, y: 0, duration: OUTRO.duration },
        OUTRO.fadeAt,
      );
    holdUntilPinEnd(timeline);
  });

  return (
    <section
      aria-label="O ano inteiro"
      className="relative bg-stage"
      id={sectionIds.time}
      ref={sectionRef}
    >
      <div className="motion-only relative h-svh overflow-hidden">
        <StageLayer />
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 [mask-image:linear-gradient(180deg,transparent_24%,black_40%,black_60%,transparent_76%)] lg:[mask-image:linear-gradient(180deg,transparent_0%,black_32%,black_68%,transparent_100%)]"
        >
          <MonthColumn active={active} />
        </div>

        <div className="pointer-events-none absolute inset-0 z-30">
          <div
            aria-hidden="true"
            className="absolute inset-x-[var(--gutter)] top-[calc(var(--header-height)+3vh)] flex items-center justify-center lg:justify-between"
            data-time-hud=""
          >
            <span className="label">
              {copy.time.dayLabel}{" "}
              <span className="tabular-nums text-ink" ref={dayRef}>
                {pad(1, DAY_PAD)}
              </span>{" "}
              <span className="text-ink-dim">/ {copy.time.yearDays}</span>
            </span>
            <ol className="hidden gap-5 lg:flex">
              {TIME_MONTHS.map((month, index) => {
                const lit = index <= active;
                return (
                  <li
                    className="flex flex-col items-center gap-2"
                    key={month.short}
                  >
                    <span
                      className={[
                        "label transition-colors duration-500",
                        index === active
                          ? "text-brand"
                          : lit
                            ? "text-ink"
                            : "text-ink-muted",
                      ].join(" ")}
                    >
                      {month.short}
                    </span>
                    <span
                      className={[
                        "block h-px w-full origin-left bg-brand transition-transform duration-500",
                        lit ? "scale-x-100" : "scale-x-0",
                      ].join(" ")}
                    />
                  </li>
                );
              })}
            </ol>
          </div>

          <div
            className="absolute inset-x-[var(--gutter)] top-[calc(var(--header-height)+3vh)] text-center lg:inset-x-auto lg:left-[var(--gutter)] lg:top-1/2 lg:w-[30vw] lg:-translate-y-1/2 lg:text-left"
            data-time-copy="0"
          >
            <span className="label block text-brand" data-time-fade="">
              {copy.time.label}
            </span>
            <SplitText
              as="h2"
              className="font-display mt-3 text-[clamp(1.9rem,4vw,3.8rem)] font-bold text-ink lg:mt-5"
              lines={[copy.time.lines[0]]}
            />
            <p
              className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-muted lg:mx-0 lg:mt-6 lg:text-base"
              data-time-fade=""
            >
              {copy.time.body}
            </p>
          </div>

          {TIME_CHAPTERS.map((chapter, index) => {
            const right = chapterSide(index) === -1;
            const months = chapterMonths(index);
            return (
              <div
                className={[
                  "absolute inset-x-[var(--gutter)] bottom-[6vh] text-center lg:bottom-auto lg:top-1/2 lg:w-[32vw] lg:-translate-y-1/2",
                  right
                    ? "lg:left-auto lg:right-[var(--gutter)] lg:text-right"
                    : "lg:left-[var(--gutter)] lg:right-auto lg:text-left",
                ].join(" ")}
                data-time-chapter={index}
                key={chapter.title}
              >
                <span className="label block text-brand" data-time-fade="">
                  {months.map((month) => month.name).join(" · ")}
                </span>
                <SplitText
                  as="h3"
                  className="font-display mt-3 text-[clamp(2rem,4.4vw,4.4rem)] font-bold leading-[0.95] text-ink lg:mt-5"
                  lines={[chapter.title]}
                />
                <p
                  className={[
                    "mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted lg:mt-5 lg:text-lg",
                    right ? "lg:mr-0" : "lg:ml-0",
                  ].join(" ")}
                  data-time-fade=""
                >
                  {chapter.text}
                </p>
                <ul
                  className="mt-6 hidden space-y-2 border-t border-line pt-5 lg:block"
                  data-time-fade=""
                >
                  {months.map((month) => {
                    const current = month.index === active;
                    return (
                      <li
                        className={[
                          "flex items-baseline gap-4",
                          right ? "justify-end" : "",
                        ].join(" ")}
                        key={month.short}
                      >
                        <span
                          className={[
                            "label tabular-nums transition-colors duration-500",
                            current ? "text-brand" : "text-ink-muted",
                          ].join(" ")}
                        >
                          {month.short}
                        </span>
                        <span
                          className={[
                            "text-sm transition-colors duration-500",
                            current ? "text-ink" : "text-ink-muted",
                          ].join(" ")}
                        >
                          {month.note}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          <div
            className="absolute inset-x-[var(--gutter)] bottom-[6vh] text-center lg:inset-x-auto lg:bottom-auto lg:right-[var(--gutter)] lg:top-1/2 lg:w-[28vw] lg:-translate-y-1/2 lg:text-right"
            data-time-copy="1"
          >
            <SplitText
              as="h3"
              className="font-display text-[clamp(1.9rem,4vw,3.8rem)] font-bold text-brand"
              lines={[copy.time.lines[1]]}
            />
            <p
              className="ml-auto mr-auto mt-3 max-w-xs text-sm leading-relaxed text-ink-muted lg:mr-0 lg:mt-5 lg:text-base"
              data-time-fade=""
            >
              {copy.time.closing}
            </p>
          </div>
        </div>
      </div>
      <ConventionalTime />
    </section>
  );
}

function ConventionalTime() {
  return (
    <div className="reduced-only section-y relative overflow-hidden">
      <div className="grid gap-8 px-[var(--gutter)] lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-16">
        <div>
          <Reveal>
            <span className="label block text-brand">{copy.time.label}</span>
          </Reveal>
          <RevealLines
            as="h2"
            className="font-display mt-5 text-[clamp(2.4rem,5vw,4.8rem)] font-bold text-ink"
            lines={[copy.time.lines[0]]}
          />
        </div>
        <Reveal>
          <p className="max-w-md text-base leading-relaxed text-ink-muted lg:text-lg">
            {copy.time.body}
          </p>
        </Reveal>
      </div>

      <RevealGroup
        as="ol"
        className="mt-14 grid grid-cols-6 gap-x-3 gap-y-5 px-[var(--gutter)] md:grid-cols-12 lg:mt-20"
        interval={MONTH_STAGGER_S}
      >
        {TIME_MONTHS.map((month) => (
          <RevealItem as="li" className="flex flex-col gap-2" key={month.short}>
            <span className="label text-ink">{month.short}</span>
            <span className="block h-px w-full bg-brand" />
          </RevealItem>
        ))}
      </RevealGroup>

      <RevealGroup
        as="ol"
        className="mx-[var(--gutter)] mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2 xl:grid-cols-4"
      >
        {TIME_CHAPTERS.map((chapter, index) => {
          const months = chapterMonths(index);
          return (
            <RevealItem
              as="li"
              className="flex flex-col bg-stage p-7 transition-colors duration-500 hover:bg-stage-soft lg:p-9"
              key={chapter.title}
            >
              <span className="label block text-brand">
                {months.map((month) => month.name).join(" · ")}
              </span>
              <h3 className="font-display mt-4 text-[clamp(1.7rem,2.4vw,2.4rem)] font-bold leading-[1] text-ink">
                {chapter.title}
              </h3>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-muted lg:text-base">
                {chapter.text}
              </p>
              <ul className="mt-6 space-y-2 border-t border-line pt-5">
                {months.map((month) => (
                  <li className="flex items-baseline gap-4" key={month.short}>
                    <span className="label tabular-nums text-brand">
                      {month.short}
                    </span>
                    <span className="text-sm text-ink">{month.note}</span>
                  </li>
                ))}
              </ul>
            </RevealItem>
          );
        })}
      </RevealGroup>

      <div className="mt-16 px-[var(--gutter)] text-center lg:mt-20 lg:text-right">
        <RevealLines
          as="h3"
          className="font-display text-[clamp(2.2rem,4.4vw,4.2rem)] font-bold text-brand"
          lines={[copy.time.lines[1]]}
        />
        <Reveal>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-muted lg:mr-0 lg:text-base">
            {copy.time.closing}
          </p>
        </Reveal>
      </div>
    </div>
  );
}

export function TimeSection() {
  return (
    <StageProvider>
      <TimeScene />
    </StageProvider>
  );
}
