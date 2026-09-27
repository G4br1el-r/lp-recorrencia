import type Lenis from "lenis";
import type { ScrollTrigger } from "@/components/motion/gsap";
import { scrollToProgress } from "@/components/motion/scrollToProgress";

type RevealRowInput = {
  interactive: boolean;
  trigger: ScrollTrigger | null;
  lenis: Lenis | null;
  progress: number;
  duration: number;
};

export function revealRowOnFocus({
  interactive,
  trigger,
  lenis,
  progress,
  duration,
}: RevealRowInput): boolean {
  if (interactive || !trigger) {
    return false;
  }
  scrollToProgress(trigger, progress, lenis, duration);
  return true;
}
