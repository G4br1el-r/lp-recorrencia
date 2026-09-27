"use client";

import { m } from "motion/react";
import type { MouseEvent, ReactNode } from "react";
import { MOTION_GESTURE, MOTION_SPRING } from "@/lib/constants/motion";
import { toSafeHref } from "@/lib/security/safeHref";

type Variant = "primary" | "ghost" | "brand";

const BASE_CLASS =
  "inline-flex items-center justify-center gap-3 rounded-full px-6 py-3 text-sm font-semibold transition-colors duration-300 select-none";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-ink text-stage hover:bg-white",
  ghost: "border border-line-strong text-ink hover:border-ink",
  brand: "bg-brand-deep text-ink hover:bg-brand",
};

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
  onClick,
}: ButtonLinkProps) {
  return (
    <m.a
      className={[BASE_CLASS, VARIANT_CLASS[variant], className]
        .filter(Boolean)
        .join(" ")}
      href={toSafeHref(href)}
      onClick={onClick}
      transition={MOTION_SPRING.hover}
      whileHover={MOTION_GESTURE.hover}
      whileTap={MOTION_GESTURE.tap}
    >
      {children}
    </m.a>
  );
}

type ButtonProps = {
  variant?: Variant;
  className?: string;
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  "aria-pressed"?: boolean;
  "aria-label"?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
};

export function Button({
  variant = "primary",
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <m.button
      className={[BASE_CLASS, VARIANT_CLASS[variant], className]
        .filter(Boolean)
        .join(" ")}
      transition={MOTION_SPRING.hover}
      type={type}
      whileHover={MOTION_GESTURE.hover}
      whileTap={MOTION_GESTURE.tap}
      {...rest}
    >
      {children}
    </m.button>
  );
}
