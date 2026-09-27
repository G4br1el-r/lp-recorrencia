"use client";

import type { ReactNode } from "react";
import { Z_INDEX } from "@/lib/constants/motion";

const SKIP_LINK_CLASS =
  "fixed left-[var(--gutter)] top-4 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-stage not-focus:sr-only";

type SkipLinkProps = {
  targetId: string;
  children: ReactNode;
};

function focusTarget(targetId: string): void {
  const target = document.getElementById(targetId);
  if (!target) {
    return;
  }
  if (!target.hasAttribute("tabindex")) {
    target.tabIndex = -1;
  }
  target.focus({ preventScroll: true });
}

export function SkipLink({ targetId, children }: SkipLinkProps) {
  return (
    <a
      className={SKIP_LINK_CLASS}
      href={`#${targetId}`}
      onClick={() => focusTarget(targetId)}
      style={{ zIndex: Z_INDEX.skipLink }}
    >
      {children}
    </a>
  );
}
