import { ScrollTrigger } from "@/components/motion/gsap";

export type RefreshCache<T> = {
  read: () => T;
  dispose: () => void;
};

export function refreshCache<T>(measure: () => T): RefreshCache<T> {
  let cached: { value: T } | null = null;
  const invalidate = () => {
    cached = null;
  };
  ScrollTrigger.addEventListener("refreshInit", invalidate);
  return {
    read: () => {
      if (!cached) {
        cached = { value: measure() };
      }
      return cached.value;
    },
    dispose: () => ScrollTrigger.removeEventListener("refreshInit", invalidate),
  };
}
