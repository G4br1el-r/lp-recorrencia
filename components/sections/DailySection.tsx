"use client";

import { AnimatePresence, m } from "motion/react";
import { useId, useState } from "react";
import {
  RevealGroup,
  RevealItem,
  RevealLines,
} from "@/components/motion/Reveal";
import { PhotoBackdrop } from "@/components/ui/SceneBackdrop";
import { siteAssets } from "@/lib/assets";
import { EASE } from "@/lib/constants/motion";
import { copy } from "@/lib/content/copy";
import { sectionIds } from "@/lib/content/links";
import { useTodayWeekday } from "@/lib/date/useTodayWeekday";
import { pad } from "@/lib/format/number";

const DAYS = copy.daily.days;
const MARQUEE_COPIES = ["a", "b"] as const;
const FALLBACK_DAY = 0;
const NOTE_SWAP = { y: 20, durationS: 0.45 } as const;

export function DailySection() {
  const today = useTodayWeekday();
  const [picked, setPicked] = useState<number | null>(null);
  const noteId = useId();
  const selected = picked ?? today ?? FALLBACK_DAY;
  const day = DAYS[selected];
  const isToday = today !== null && selected === today;

  return (
    <section
      aria-label="Todos os dias"
      className="relative flex min-h-svh flex-col overflow-hidden bg-stage"
      id={sectionIds.daily}
    >
      <PhotoBackdrop asset={siteAssets.lifestyle.dawnRoom} />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[40vh] bg-[linear-gradient(180deg,rgba(0,0,0,0.75)_0%,rgba(0,0,0,0.35)_55%,rgba(0,0,0,0)_100%)]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 [mask-image:linear-gradient(90deg,transparent_0%,black_20%,black_80%,transparent_100%)]"
      >
        <div className="marquee flex w-max">
          {MARQUEE_COPIES.map((copyKey) =>
            DAYS.map((item) => (
              <span
                className="font-display pr-[8vw] text-[clamp(7rem,22vw,24rem)] font-bold text-transparent [-webkit-text-stroke:1px_rgba(242,235,224,0.22)]"
                key={`${copyKey}-${item.short}`}
              >
                {item.short}
              </span>
            )),
          )}
        </div>
      </div>

      <div className="relative z-30 px-[var(--gutter)] pt-[calc(var(--header-height)+3vh)]">
        <RevealGroup
          aria-label={copy.daily.daysLabel}
          as="ol"
          className="flex justify-between md:justify-end md:gap-7"
        >
          {DAYS.map((item, index) => {
            const current = index === selected;
            const lit = index <= selected;
            return (
              <RevealItem as="li" key={item.short}>
                <button
                  aria-controls={noteId}
                  aria-label={item.name}
                  aria-pressed={current}
                  className="group flex flex-col items-center gap-2 py-2"
                  onClick={() => setPicked(index)}
                  type="button"
                >
                  <span
                    className={[
                      "label transition-colors duration-500",
                      current
                        ? "text-brand"
                        : lit
                          ? "text-ink"
                          : "text-ink-dim group-hover:text-ink-muted",
                    ].join(" ")}
                  >
                    {item.short}
                  </span>
                  <span
                    className={[
                      "block h-px w-full origin-left bg-brand transition-transform duration-500",
                      lit ? "scale-x-100" : "scale-x-0",
                    ].join(" ")}
                  />
                </button>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>

      <div className="relative z-30 mt-auto flex flex-col gap-10 px-[var(--gutter)] pt-[30vh] pb-[clamp(4rem,12vh,8rem)] md:flex-row md:items-end md:justify-between md:gap-12">
        <div>
          <RevealLines
            as="h2"
            className="font-display text-[clamp(2.8rem,7vw,6.5rem)] font-bold text-ink"
            lines={[copy.daily.lines[0]]}
          />
          <RevealLines
            className="font-display text-[clamp(2.8rem,7vw,6.5rem)] font-bold text-brand"
            lines={[copy.daily.lines[1]]}
          />
        </div>

        <div
          aria-live="polite"
          className="relative min-h-40 w-full md:min-h-44 md:w-[min(26rem,30vw)]"
          id={noteId}
        >
          <AnimatePresence initial={false} mode="wait">
            <m.div
              animate={{ y: 0, opacity: 1 }}
              className="md:text-right"
              exit={{ y: -NOTE_SWAP.y, opacity: 0 }}
              initial={{ y: NOTE_SWAP.y, opacity: 0 }}
              key={day.short}
              transition={{ duration: NOTE_SWAP.durationS, ease: EASE.soft }}
            >
              <span className="label block">
                {isToday ? (
                  <span className="text-brand">{copy.daily.liveLabel}</span>
                ) : (
                  <>
                    {copy.daily.dayLabel}{" "}
                    <span className="tabular-nums text-ink">
                      {pad(selected + 1)} / {pad(DAYS.length)}
                    </span>
                  </>
                )}
              </span>
              <span className="font-display mt-2 block text-[clamp(1.9rem,3.2vw,3rem)] font-bold text-brand md:mt-3">
                {day.name}
              </span>
              <p className="mt-2 text-base leading-snug text-ink md:mt-3 md:text-lg">
                {day.note}
              </p>
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
