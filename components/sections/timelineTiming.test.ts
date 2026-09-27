import { describe, expect, it } from "vitest";
import { stopDelay, TRACK } from "@/components/sections/timelineTiming";

const STOPS = 4;
const LAST_STOP = STOPS - 1;
const PRECISION_DIGITS = 6;

describe("stopDelay", () => {
  it("acende o primeiro marco quando a linha começa a ser desenhada", () => {
    expect(stopDelay(0, STOPS)).toBe(TRACK.startDelayS);
  });

  it("acende o último marco quando a linha termina", () => {
    expect(stopDelay(LAST_STOP, STOPS)).toBeCloseTo(
      TRACK.startDelayS + TRACK.drawS,
      PRECISION_DIGITS,
    );
  });

  it("distribui os marcos intermediários de forma proporcional", () => {
    const step = TRACK.drawS / LAST_STOP;
    expect(stopDelay(1, STOPS)).toBeCloseTo(
      TRACK.startDelayS + step,
      PRECISION_DIGITS,
    );
  });

  it("não divide por zero com um único marco", () => {
    expect(stopDelay(0, 1)).toBe(TRACK.startDelayS);
  });
});
