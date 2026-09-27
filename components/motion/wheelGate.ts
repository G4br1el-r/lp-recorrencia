type GateBoundaryInput = {
  current: number;
  direction: number;
  points: readonly number[];
  tolerancePx: number;
};

export function gateBoundary({
  current,
  direction,
  points,
  tolerancePx,
}: GateBoundaryInput): number | null {
  if (direction > 0) {
    return points.find((point) => point > current + tolerancePx) ?? null;
  }
  if (direction < 0) {
    return (
      points.filter((point) => point < current - tolerancePx).at(-1) ?? null
    );
  }
  return null;
}

const NEW_GESTURE_RISE_RATIO = 1.5;
const NEW_GESTURE_RISE_MIN_PX = 4;
const NEW_GESTURE_MIN_LOCK_MS = 350;

export type WheelGateState = {
  locked: boolean;
  direction: number;
  lastWheelMs: number;
  lockedAtMs: number;
  lastMagnitude: number;
};

type WheelGateInput = {
  state: WheelGateState;
  delta: number;
  rawDelta: number;
  target: number;
  nowMs: number;
  idleMs: number;
  points: readonly number[];
  tolerancePx: number;
};

export function createWheelGate(): WheelGateState {
  return {
    locked: false,
    direction: 0,
    lastWheelMs: 0,
    lockedAtMs: 0,
    lastMagnitude: 0,
  };
}

export function gateWheel({
  state,
  delta,
  rawDelta,
  target,
  nowMs,
  idleMs,
  points,
  tolerancePx,
}: WheelGateInput): number {
  const direction = Math.sign(rawDelta);
  const magnitude = Math.abs(rawDelta);
  const idle = nowMs - state.lastWheelMs > idleMs;
  const rising =
    nowMs - state.lockedAtMs >= NEW_GESTURE_MIN_LOCK_MS &&
    magnitude >= state.lastMagnitude * NEW_GESTURE_RISE_RATIO &&
    magnitude - state.lastMagnitude >= NEW_GESTURE_RISE_MIN_PX;
  state.lastWheelMs = nowMs;
  state.lastMagnitude = magnitude;
  if (direction === 0) {
    return 0;
  }
  if (state.locked && (idle || rising || direction !== state.direction)) {
    state.locked = false;
  }
  if (state.locked || delta === 0) {
    return 0;
  }
  const boundary = gateBoundary({
    current: target,
    direction,
    points,
    tolerancePx,
  });
  if (boundary === null) {
    return delta;
  }
  const next = target + delta;
  const crosses = direction > 0 ? next >= boundary : next <= boundary;
  if (!crosses) {
    return delta;
  }
  state.locked = true;
  state.direction = direction;
  state.lockedAtMs = nowMs;
  return boundary - target;
}
