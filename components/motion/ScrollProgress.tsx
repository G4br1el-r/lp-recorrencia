"use client";

import { m, useScroll } from "motion/react";
import { Z_INDEX } from "@/lib/constants/motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  return (
    <m.div
      aria-hidden="true"
      className="motion-only pointer-events-none fixed inset-x-0 top-0 h-[3px] origin-left bg-brand"
      style={{ scaleX: scrollYProgress, zIndex: Z_INDEX.scrollProgress }}
    />
  );
}
