import type Lenis from "lenis";
import type { ScrollTrigger } from "@/components/motion/gsap";

export function scrollToProgress(
  trigger: ScrollTrigger,
  progress: number,
  lenis: Lenis | null,
  duration: number,
): void {
  const target = trigger.start + (trigger.end - trigger.start) * progress;
  if (lenis) {
    lenis.scrollTo(target, { duration });
    return;
  }
  window.scrollTo({ top: target, behavior: "smooth" });
}
