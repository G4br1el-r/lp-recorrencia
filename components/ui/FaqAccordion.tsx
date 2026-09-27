"use client";

import { AnimatePresence, m } from "motion/react";
import { useId, useState } from "react";
import { MOTION_SPRING } from "@/lib/constants/motion";
import type { FaqItem } from "@/lib/content/faq";

const INDICATOR_ROTATION_OPEN = 45;

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  const baseId = useId();

  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((item) => {
        const expanded = open === item.id;
        const panelId = `${baseId}-${item.id}`;
        return (
          <li key={item.id}>
            <button
              aria-controls={panelId}
              aria-expanded={expanded}
              className="flex w-full items-center justify-between gap-6 py-6 text-left"
              onClick={() => setOpen(expanded ? null : item.id)}
              type="button"
            >
              <span className="text-lg font-medium text-ink lg:text-xl">
                {item.question}
              </span>
              <m.span
                animate={{ rotate: expanded ? INDICATOR_ROTATION_OPEN : 0 }}
                aria-hidden="true"
                className="relative block h-5 w-5 shrink-0"
                transition={MOTION_SPRING.accordion}
              >
                <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-brand" />
                <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-brand" />
              </m.span>
            </button>
            <AnimatePresence initial={false}>
              {expanded ? (
                <m.div
                  animate={{ height: "auto", opacity: 1 }}
                  className="overflow-hidden"
                  exit={{ height: 0, opacity: 0 }}
                  id={panelId}
                  initial={{ height: 0, opacity: 0 }}
                  transition={MOTION_SPRING.accordion}
                >
                  <p className="max-w-xl pb-8 text-base leading-relaxed text-ink-muted">
                    {item.answer}
                  </p>
                </m.div>
              ) : null}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
