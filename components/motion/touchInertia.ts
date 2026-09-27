import { gateBoundary } from "@/components/motion/wheelGate";

type TouchInertiaInput = {
  inertia: number;
  target: number;
  maxTravel: number;
  points: readonly number[];
  tolerancePx: number;
};

export function projectedInertia(
  lastDelta: number,
  velocity: number,
  exponent: number,
): number {
  return Math.sign(lastDelta) * Math.abs(velocity) ** exponent;
}

export function limitTouchInertia({
  inertia,
  target,
  maxTravel,
  points,
  tolerancePx,
}: TouchInertiaInput): number {
  const direction = Math.sign(inertia);
  if (direction === 0) {
    return 0;
  }
  const capped = direction * Math.min(Math.abs(inertia), maxTravel);
  const boundary = gateBoundary({
    current: target,
    direction,
    points,
    tolerancePx,
  });
  if (boundary === null) {
    return capped;
  }
  const next = target + capped;
  const crosses = direction > 0 ? next > boundary : next < boundary;
  return crosses ? boundary - target : capped;
}
