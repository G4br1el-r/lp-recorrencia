import { seconds } from "@/lib/style/cssVariables";

export type CubicBezier = readonly [number, number, number, number];

export function cubicBezier(ease: CubicBezier): string {
  return `cubic-bezier(${ease.join(", ")})`;
}

export function cssTransition(
  property: "transform" | "opacity",
  durationS: number,
  ease: CubicBezier,
): string {
  return `${property} ${seconds(durationS)} ${cubicBezier(ease)}`;
}
