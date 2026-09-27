"use client";

import { AnimatePresence, m, stagger } from "motion/react";
import { useRef, useState } from "react";
import { gsap, type ScrollTrigger } from "@/components/motion/gsap";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { StageLayer, StageProvider } from "@/components/motion/ProductStage";
import { useLenis } from "@/components/motion/SmoothScrollProvider";
import { scrollToProgress } from "@/components/motion/scrollToProgress";
import { snapStops } from "@/components/motion/snap";
import { moveBook, moveLight } from "@/components/motion/stage";
import { useMediaQuery } from "@/components/motion/useMotionPreferences";
import {
  holdUntilPinEnd,
  PIN_LENGTH_VH,
  pinnedTimeline,
  useScene,
} from "@/components/motion/useScene";
import {
  ARRIVE,
  arriveState,
  FLOW,
  flowAt,
  flowState,
  holdMiddle,
  holdStart,
  LEAVE,
  leaveState,
  presenceAt,
  TIMING,
} from "@/components/sections/selectorFlow";
import { ButtonLink } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons/CheckIcon";
import { ProductBook } from "@/components/ui/ProductBook";
import {
  EASE,
  GSAP_EASE,
  MEDIA,
  STAGE_TWEEN_START,
} from "@/lib/constants/motion";
import { copy } from "@/lib/content/copy";
import { type Edition, type EditionId, editions } from "@/lib/content/editions";
import { links, sectionIds } from "@/lib/content/links";
import { getPlan } from "@/lib/content/plans";
import { formatBRL, formatInstallments } from "@/lib/format/currency";
import { useSelectionActions } from "@/lib/selection/SelectionContext";

const ORDER: EditionId[] = ["traditional", "largePrint", "celebration"];
const HIGHLIGHT_CHECK_STROKE_WIDTH = 1.8;
const MOBILE_BOOK_FONT = "calc(var(--book-width) * 0.14)";
const LIGHT_ON = { yVh: -6, opacity: 0.8 } as const;
const NUMBER = { spacingVw: 30, fadePerStep: 1.2 } as const;
const SCROLL_TO_TAB = { duration: 1.4 } as const;
const DETAIL_FROM_Y = 18;
const DETAIL_EXIT_Y = -10;

const DETAIL = {
  group: {
    initial: {},
    animate: {
      transition: { delayChildren: stagger(0.06, { startDelay: 0.1 }) },
    },
    exit: { transition: { delayChildren: stagger(0.025, { from: "last" }) } },
  },
  item: {
    initial: { opacity: 0, y: DETAIL_FROM_Y },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: EASE.soft },
    },
    exit: {
      opacity: 0,
      y: DETAIL_EXIT_Y,
      transition: { duration: 0.3 },
    },
  },
} as const;

const ANNUAL_PLAN = getPlan("anual");

function HighlightCheck() {
  return (
    <CheckIcon
      className="mt-1 h-3.5 w-3.5 shrink-0 text-brand"
      strokeWidth={HIGHLIGHT_CHECK_STROKE_WIDTH}
    />
  );
}

function EditionPrice({ edition }: { edition: Edition }) {
  const { installments } = edition.price;
  return (
    <div>
      <span className="label block">
        {copy.selector.planLabel} {ANNUAL_PLAN.name.toLowerCase()}
      </span>
      <p className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-[clamp(2rem,2.8vw,2.8rem)] font-bold text-ink">
          {formatBRL(edition.price.anual)}
        </span>
        <span className="text-sm text-ink-muted">{ANNUAL_PLAN.period}</span>
      </p>
      {installments ? (
        <span className="label mt-2 block">
          {formatInstallments(installments.count, installments.value)}
        </span>
      ) : null}
    </div>
  );
}

function SubscribeButton({
  edition,
  onChoose,
}: {
  edition: Edition;
  onChoose: (id: EditionId) => void;
}) {
  return (
    <MagneticButton>
      <ButtonLink
        className="px-7 py-3.5 text-base"
        href={links.plans}
        onClick={() => onChoose(edition.id)}
        variant="brand"
      >
        {copy.selector.cta} {edition.subtitle}
      </ButtonLink>
    </MagneticButton>
  );
}

function EditionDetail({
  edition,
  onChoose,
}: {
  edition: Edition;
  onChoose: (id: EditionId) => void;
}) {
  return (
    <m.div
      animate="animate"
      className="[grid-area:1/1]"
      exit="exit"
      initial="initial"
      variants={DETAIL.group}
    >
      <m.p className="flex items-baseline gap-3" variants={DETAIL.item}>
        <span className="font-mono text-sm text-brand">{edition.index}</span>
        <span className="label">{edition.name}</span>
      </m.p>
      <m.h3
        className="font-display mt-4 text-balance text-[clamp(2.4rem,3.8vw,4rem)] font-bold text-ink"
        variants={DETAIL.item}
      >
        {edition.subtitle}
      </m.h3>
      <m.p
        className="mt-4 text-lg leading-snug text-ink-muted"
        variants={DETAIL.item}
      >
        {edition.audience}
      </m.p>
      <m.ul className="mt-6 space-y-2.5" variants={DETAIL.item}>
        {edition.highlights.map((item) => (
          <li className="flex gap-3 text-sm text-ink" key={item}>
            <HighlightCheck />
            {item}
          </li>
        ))}
      </m.ul>
      <m.div className="mt-8 border-t border-line pt-6" variants={DETAIL.item}>
        <EditionPrice edition={edition} />
      </m.div>
      <m.div className="mt-6" variants={DETAIL.item}>
        <SubscribeButton edition={edition} onChoose={onChoose} />
      </m.div>
      <m.p className="mt-4 text-xs text-ink-dim" variants={DETAIL.item}>
        {edition.format} · {copy.selector.trust}
      </m.p>
    </m.div>
  );
}

function EditionSelectorScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const [active, setActive] = useState(0);
  const { selectEdition } = useSelectionActions();
  const lenis = useLenis();
  const showsStage = useMediaQuery(MEDIA.desktop);

  useScene(sectionRef, (context) => {
    const { isDesktop, select, books, light } = context;
    if (!isDesktop) {
      return;
    }

    const numbers = select("[data-selector-number]");
    const tabBars = select("[data-selector-tab-bar]");
    const numberSetters = numbers.map((element) => ({
      x: gsap.quickSetter(element, "x", "vw"),
      opacity: gsap.quickSetter(element, "opacity"),
    }));
    const tabBarSetters = tabBars.map((element) =>
      gsap.quickSetter(element, "scaleX"),
    );
    const writeUi = (t: number, presence: number) => {
      numberSetters.forEach((setter, index) => {
        const offset = index - t;
        setter.x(offset * NUMBER.spacingVw);
        setter.opacity(
          presence * Math.max(0, 1 - Math.abs(offset) * NUMBER.fadePerStep),
        );
      });
      tabBarSetters.forEach((setScaleX, index) => {
        setScaleX(Math.max(0, 1 - Math.abs(index - t)));
      });
    };
    writeUi(0, 0);

    const timeline = pinnedTimeline(context, PIN_LENGTH_VH.selector, {
      id: "selector",
      onUpdate: (self) => {
        const t = flowAt(self.progress);
        writeUi(t, presenceAt(self.progress));
        setActive(Math.round(t));
      },
    });
    snapStops(
      timeline,
      ORDER.map((_, step) => holdMiddle(step)),
    );
    triggerRef.current = timeline.scrollTrigger ?? null;

    ORDER.forEach((id, index) => {
      moveBook(
        timeline,
        books[id],
        arriveState(index),
        flowState(index, -1),
        STAGE_TWEEN_START,
        ARRIVE.duration,
        GSAP_EASE.reveal,
      );
    });
    moveLight(
      timeline,
      light,
      { xVw: FLOW.centerXVw, yVh: LIGHT_ON.yVh, opacity: 0 },
      { xVw: FLOW.centerXVw, ...LIGHT_ON },
      STAGE_TWEEN_START,
      ARRIVE.duration,
    );

    ORDER.forEach((_, step) => {
      const at = holdStart(step);
      moveBook(
        timeline,
        books[ORDER[step]],
        flowState(0, -1),
        flowState(0, 1),
        at,
        TIMING.hold,
        GSAP_EASE.breathe,
      );
      if (step === ORDER.length - 1) {
        return;
      }
      ORDER.forEach((id, index) => {
        const offset = index - step;
        moveBook(
          timeline,
          books[id],
          flowState(offset, 1),
          flowState(offset - 1, -1),
          at + TIMING.hold,
          TIMING.move,
          GSAP_EASE.camera,
        );
      });
    });

    const lastStep = ORDER.length - 1;
    ORDER.forEach((id, index) => {
      moveBook(
        timeline,
        books[id],
        flowState(index - lastStep, 1),
        leaveState(index - lastStep),
        LEAVE.at,
        LEAVE.duration,
        GSAP_EASE.exit,
      );
    });
    moveLight(
      timeline,
      light,
      { xVw: FLOW.centerXVw, ...LIGHT_ON },
      { xVw: FLOW.centerXVw, yVh: LIGHT_ON.yVh, opacity: 0 },
      LEAVE.at,
      LEAVE.duration,
    );
    timeline.to(
      select("[data-selector-ui]"),
      { autoAlpha: 0, duration: LEAVE.duration },
      LEAVE.at,
    );
    holdUntilPinEnd(timeline);

    return () => {
      triggerRef.current = null;
    };
  });

  const goTo = (step: number) => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }
    scrollToProgress(trigger, holdMiddle(step), lenis, SCROLL_TO_TAB.duration);
  };

  const edition = editions[active];

  return (
    <section
      aria-label={copy.selector.title}
      className="relative bg-stage"
      id={sectionIds.selector}
      ref={sectionRef}
    >
      <div className="motion-only relative hidden h-svh overflow-hidden lg:block">
        {showsStage ? <StageLayer /> : null}
        <div
          aria-hidden="true"
          className="absolute top-[44%] z-0"
          style={{ left: `calc(50% + ${FLOW.centerXVw}vw)` }}
        >
          {editions.map((item) => (
            <span
              className="font-display absolute left-0 top-0 block -translate-x-1/2 -translate-y-1/2 text-[clamp(14rem,30vw,34rem)] font-bold leading-none text-transparent opacity-0 [-webkit-text-stroke:1px_rgba(242,235,224,0.16)]"
              data-selector-number=""
              key={item.id}
            >
              {item.index}
            </span>
          ))}
        </div>

        <div className="absolute inset-0 z-30" data-selector-ui="">
          <div className="absolute left-[var(--gutter)] top-[calc(var(--header-height)+2vh)]">
            <p aria-hidden="true" className="label text-brand">
              {copy.selector.title}
            </p>
          </div>

          <div className="absolute left-[var(--gutter)] top-1/2 grid w-[28vw] -translate-y-1/2">
            <AnimatePresence initial={false}>
              <EditionDetail
                edition={edition}
                key={edition.id}
                onChoose={selectEdition}
              />
            </AnimatePresence>
          </div>

          <div
            className="absolute bottom-[5vh] flex -translate-x-1/2 gap-8"
            style={{ left: `calc(50% + ${FLOW.centerXVw}vw)` }}
          >
            {editions.map((item, index) => (
              <button
                aria-current={index === active ? "true" : undefined}
                className={[
                  "label relative pb-3 transition-colors duration-500",
                  index === active ? "text-ink" : "text-ink-dim hover:text-ink",
                ].join(" ")}
                key={item.id}
                onClick={() => goTo(index)}
                type="button"
              >
                {item.subtitle}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 block h-px origin-center bg-brand"
                  data-selector-tab-bar=""
                  style={{ transform: "scaleX(0)" }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-[var(--gutter)] py-[12vh] lg:motion-safe:hidden">
        <h2 className="label text-brand">{copy.selector.title}</h2>
        <div className="mt-10 space-y-16 lg:grid lg:grid-cols-3 lg:gap-10 lg:space-y-0">
          {editions.map((item) => (
            <article key={item.id}>
              <div className="grid grid-cols-[38%_1fr] items-center gap-6">
                <ProductBook
                  edition={item}
                  style={{ width: "100%", fontSize: MOBILE_BOOK_FONT }}
                />
                <div>
                  <span className="font-mono text-sm text-brand">
                    {item.index}
                  </span>
                  <h3 className="font-display mt-2 text-3xl font-bold text-ink">
                    {item.subtitle}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    {item.audience}
                  </p>
                </div>
              </div>
              <ul className="mt-6 space-y-2">
                {item.highlights.map((highlight) => (
                  <li className="flex gap-3 text-sm text-ink" key={highlight}>
                    <HighlightCheck />
                    {highlight}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap items-end justify-between gap-5 border-t border-line pt-5">
                <EditionPrice edition={item} />
                <SubscribeButton edition={item} onChoose={selectEdition} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EditionSelectorSection() {
  return (
    <StageProvider>
      <EditionSelectorScene />
    </StageProvider>
  );
}
