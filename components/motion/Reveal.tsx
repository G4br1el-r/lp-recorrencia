"use client";

import { m, stagger, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { EASE, REVEAL } from "@/lib/constants/motion";

export type RevealTrigger = "view" | "mount";

const VIEWPORT = { once: true, amount: REVEAL.viewportAmount } as const;
const NO_DELAY = 0;

const HIDDEN = { opacity: 0, y: REVEAL.offsetPx } as const;
const ITEM_TRANSITION = {
  duration: REVEAL.durationS,
  ease: EASE.soft,
} as const;

const itemVariants: Variants = {
  hidden: HIDDEN,
  visible: { opacity: 1, y: 0, transition: ITEM_TRANSITION },
};

const lineVariants: Variants = {
  hidden: { y: REVEAL.lineOffset },
  visible: {
    y: REVEAL.lineRest,
    transition: { duration: REVEAL.lineDurationS, ease: EASE.cinematic },
  },
};

function revealVariants(delay: number): Variants {
  return {
    hidden: HIDDEN,
    visible: {
      opacity: 1,
      y: 0,
      transition: { ...ITEM_TRANSITION, delay },
    },
  };
}

function groupVariants(interval: number, delay: number): Variants {
  return {
    hidden: {},
    visible: {
      transition: { delayChildren: stagger(interval, { startDelay: delay }) },
    },
  };
}

function triggerProps(trigger: RevealTrigger) {
  return trigger === "mount"
    ? { initial: "hidden", animate: "visible" }
    : { initial: "hidden", whileInView: "visible", viewport: VIEWPORT };
}

const GROUP_TAGS = { div: m.div, ul: m.ul, ol: m.ol } as const;
const ITEM_TAGS = { div: m.div, li: m.li, article: m.article } as const;
const LINE_TAGS = { h1: m.h1, h2: m.h2, h3: m.h3, p: m.p } as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  trigger?: RevealTrigger;
};

export function Reveal({
  children,
  className,
  delay = NO_DELAY,
  trigger = "view",
}: RevealProps) {
  return (
    <m.div
      className={className}
      variants={revealVariants(delay)}
      {...triggerProps(trigger)}
    >
      {children}
    </m.div>
  );
}

type RevealGroupProps = RevealProps & {
  as?: keyof typeof GROUP_TAGS;
  interval?: number;
  "aria-label"?: string;
};

export function RevealGroup({
  children,
  className,
  delay = NO_DELAY,
  trigger = "view",
  as = "div",
  interval = REVEAL.staggerS,
  "aria-label": ariaLabel,
}: RevealGroupProps) {
  const Tag = GROUP_TAGS[as];
  return (
    <Tag
      aria-label={ariaLabel}
      className={className}
      variants={groupVariants(interval, delay)}
      {...triggerProps(trigger)}
    >
      {children}
    </Tag>
  );
}

type RevealItemProps = {
  children: ReactNode;
  className?: string;
  as?: keyof typeof ITEM_TAGS;
};

export function RevealItem({
  children,
  className,
  as = "div",
}: RevealItemProps) {
  const Tag = ITEM_TAGS[as];
  return (
    <Tag className={className} variants={itemVariants}>
      {children}
    </Tag>
  );
}

type RevealLinesProps = {
  lines: readonly string[];
  as?: keyof typeof LINE_TAGS;
  className?: string;
  lineClassName?: string;
  delay?: number;
  trigger?: RevealTrigger;
};

export function RevealLines({
  lines,
  as = "p",
  className,
  lineClassName,
  delay = NO_DELAY,
  trigger = "view",
}: RevealLinesProps) {
  const Tag = LINE_TAGS[as];
  return (
    <Tag
      className={className}
      variants={groupVariants(REVEAL.lineStaggerS, delay)}
      {...triggerProps(trigger)}
    >
      {lines.map((line) => (
        <span
          className={["mask-line", lineClassName].filter(Boolean).join(" ")}
          key={line}
        >
          <m.span className="block" variants={lineVariants}>
            {line}
          </m.span>
        </span>
      ))}
    </Tag>
  );
}
