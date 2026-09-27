"use client";

import { m, useMotionValue, useSpring } from "motion/react";
import type { PointerEvent, ReactNode } from "react";
import { useRef } from "react";
import { useReducedMotionPreference } from "@/components/motion/useMotionPreferences";

const MAGNET_STRENGTH = 0.28;
const MAGNET_SPRING = { stiffness: 220, damping: 18, mass: 0.4 } as const;

type MagneticButtonProps = {
  children: ReactNode;
  className?: string;
  block?: boolean;
  strength?: number;
};

export function MagneticButton({
  children,
  className,
  block = false,
  strength = MAGNET_STRENGTH,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotionPreference();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, MAGNET_SPRING);
  const springY = useSpring(y, MAGNET_SPRING);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduce || !ref.current) {
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((event.clientX - centerX) * strength);
    y.set((event.clientY - centerY) * strength);
  };

  const onPointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <m.div
      className={className}
      onPointerLeave={onPointerLeave}
      onPointerMove={onPointerMove}
      ref={ref}
      style={{
        x: springX,
        y: springY,
        display: block ? "block" : "inline-block",
      }}
    >
      {children}
    </m.div>
  );
}
