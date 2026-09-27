"use client";

import { useRef, useState } from "react";
import { gsap, type ScrollTrigger } from "@/components/motion/gsap";
import { StageProvider } from "@/components/motion/ProductStage";
import { refreshCache } from "@/components/motion/refreshCache";
import { useLenis } from "@/components/motion/SmoothScrollProvider";
import { scrollToProgress } from "@/components/motion/scrollToProgress";
import { snapStops } from "@/components/motion/snap";
import { useReducedMotionPreference } from "@/components/motion/useMotionPreferences";
import { pinnedTimeline, useScene } from "@/components/motion/useScene";
import { ExperiencePanel } from "@/components/ui/ExperiencePanel";
import { nearestIndex } from "@/lib/carousel/nearestIndex";
import { copy } from "@/lib/content/copy";
import { experiences } from "@/lib/content/experiences";
import { sectionIds } from "@/lib/content/links";
import { pad } from "@/lib/format/number";

const TRAVEL = { at: 0.08, duration: 1, holdAfter: 0.12 } as const;
const TRAVEL_TOTAL = TRAVEL.at + TRAVEL.duration + TRAVEL.holdAfter;
const PARALLAX_PERCENT = 6;
const SCROLL_TO_CARD = { duration: 1.4 } as const;

function DiscoveryScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const cardTimesRef = useRef<(() => number[]) | null>(null);
  const [active, setActive] = useState(0);
  const reduce = useReducedMotionPreference();
  const lenis = useLenis();

  useScene(sectionRef, (context) => {
    const { section, select } = context;
    const track = trackRef.current;
    if (!track) {
      return;
    }
    const cards = Array.from(track.children).filter(
      (element): element is HTMLElement => element instanceof HTMLElement,
    );
    const distance = () => Math.max(0, track.scrollWidth - section.clientWidth);
    const images = select("[data-discovery-image]");
    gsap.set(images, { xPercent: -PARALLAX_PERCENT });
    const cardShifts = () => {
      const total = distance();
      return cards.map((card) =>
        gsap.utils.clamp(
          0,
          total,
          card.offsetLeft + card.offsetWidth / 2 - section.clientWidth / 2,
        ),
      );
    };
    const layout = refreshCache(() => ({
      total: distance(),
      shifts: cardShifts(),
    }));
    const travelStart = TRAVEL.at / TRAVEL_TOTAL;
    const travelEnd = (TRAVEL.at + TRAVEL.duration) / TRAVEL_TOTAL;

    const timeline = pinnedTimeline(
      context,
      () => (distance() * TRAVEL_TOTAL) / TRAVEL.duration,
      {
        id: "discovery",
        onUpdate: (self) => {
          const { total, shifts } = layout.read();
          const shift =
            gsap.utils.clamp(
              0,
              1,
              gsap.utils.mapRange(travelStart, travelEnd, 0, 1, self.progress),
            ) * total;
          setActive(nearestIndex(shifts, shift));
        },
      },
    );

    const cardTimes = () => {
      const total = distance();
      if (!total) {
        return [];
      }
      return [0, ...cardShifts()].map(
        (shift) => TRAVEL.at + (shift / total) * TRAVEL.duration,
      );
    };
    const cardTimesCache = refreshCache(cardTimes);
    snapStops(timeline, cardTimesCache.read);
    triggerRef.current = timeline.scrollTrigger ?? null;
    cardTimesRef.current = cardTimesCache.read;

    timeline
      .fromTo(
        track,
        { x: 0 },
        {
          x: () => -distance(),
          duration: TRAVEL.duration,
          immediateRender: false,
        },
        TRAVEL.at,
      )
      .fromTo(
        images,
        { xPercent: -PARALLAX_PERCENT },
        {
          xPercent: PARALLAX_PERCENT,
          duration: TRAVEL.duration,
          immediateRender: false,
        },
        TRAVEL.at,
      )
      .to({}, { duration: TRAVEL.holdAfter });

    return () => {
      layout.dispose();
      cardTimesCache.dispose();
      triggerRef.current = null;
      cardTimesRef.current = null;
    };
  });

  const goTo = (index: number) => {
    const trigger = triggerRef.current;
    const time = cardTimesRef.current?.()[index + 1];
    if (!trigger || time === undefined) {
      trackRef.current?.children[index]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
      return;
    }
    scrollToProgress(
      trigger,
      time / TRAVEL_TOTAL,
      lenis,
      SCROLL_TO_CARD.duration,
    );
  };

  return (
    <section
      aria-label={copy.discovery.title}
      className="relative flex h-svh flex-col overflow-hidden bg-stage pt-[calc(var(--header-height)+4vh)] pb-[clamp(4.5rem,11vh,6.5rem)]"
      id={sectionIds.discovery}
      ref={sectionRef}
    >
      <header className="flex flex-col gap-3 px-[var(--gutter)] lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div>
          <span className="label text-brand">{copy.discovery.label}</span>
          <h2 className="font-display mt-3 text-[clamp(2rem,3.6vw,3.8rem)] font-bold leading-[0.98] text-ink lg:mt-4">
            {copy.discovery.title}
          </h2>
        </div>
        <p className="max-w-sm text-sm text-ink-muted lg:pb-1 lg:text-right lg:text-base">
          {copy.discovery.intro}
        </p>
      </header>

      <section
        aria-label={copy.discovery.scrollLabel}
        className="relative mt-6 min-h-0 flex-1 overflow-hidden motion-reduce:overflow-x-auto lg:mt-10"
        tabIndex={reduce ? 0 : undefined}
      >
        <ul
          aria-label={copy.discovery.listLabel}
          className="relative flex h-full w-max gap-4 px-[var(--gutter)] will-change-transform lg:gap-5"
          ref={trackRef}
        >
          {experiences.map((item, index) => (
            <ExperiencePanel
              active={reduce || index === active}
              item={item}
              key={item.id}
            />
          ))}
        </ul>
      </section>

      <ol className="absolute inset-x-[var(--gutter)] bottom-[clamp(1.25rem,4vh,2.5rem)] z-20 grid grid-cols-6 gap-3 lg:gap-5">
        {experiences.map((item, index) => {
          const lit = index <= active;
          const current = index === active;
          return (
            <li key={item.id}>
              <button
                aria-current={current ? "step" : undefined}
                className="group flex w-full flex-col gap-2.5 text-left"
                onClick={() => goTo(index)}
                type="button"
              >
                <span className="relative block h-px w-full bg-line-strong">
                  <span
                    className={[
                      "absolute inset-0 origin-left bg-brand transition-transform duration-500",
                      lit ? "scale-x-100" : "scale-x-0",
                    ].join(" ")}
                  />
                </span>
                <span className="flex items-baseline gap-2">
                  <span
                    className={[
                      "label tabular-nums transition-colors duration-500",
                      current ? "text-brand" : "text-ink-muted",
                    ].join(" ")}
                  >
                    {pad(index + 1)}
                  </span>
                  <span
                    className={[
                      "label hidden truncate transition-colors duration-500 md:inline",
                      current
                        ? "text-ink"
                        : "text-ink-muted group-hover:text-ink",
                    ].join(" ")}
                  >
                    {item.moment}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function DiscoverySection() {
  return (
    <StageProvider>
      <DiscoveryScene />
    </StageProvider>
  );
}
