import type { CSSProperties } from "react";

export type CssVariables = CSSProperties &
  Record<`--${string}`, string | number>;

export function seconds(value: number): string {
  return `${value}s`;
}
