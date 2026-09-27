import { describe, expect, it } from "vitest";
import { limitWheelLead } from "@/components/motion/wheelLead";

const MAX_LEAD = 600;
const CURRENT = 1000;
const SMALL_DELTA = 100;
const HUGE_DELTA = 5000;
const PARTIAL_LEAD = 400;
const REMAINING_LEAD = MAX_LEAD - PARTIAL_LEAD;

describe("limitWheelLead", () => {
  it("mantém deltas pequenos intactos", () => {
    expect(
      limitWheelLead({
        delta: SMALL_DELTA,
        target: CURRENT,
        current: CURRENT,
        maxLead: MAX_LEAD,
      }),
    ).toBe(SMALL_DELTA);
    expect(
      limitWheelLead({
        delta: -SMALL_DELTA,
        target: CURRENT,
        current: CURRENT,
        maxLead: MAX_LEAD,
      }),
    ).toBe(-SMALL_DELTA);
  });

  it("limita um delta enorme ao avanço máximo", () => {
    expect(
      limitWheelLead({
        delta: HUGE_DELTA,
        target: CURRENT,
        current: CURRENT,
        maxLead: MAX_LEAD,
      }),
    ).toBe(MAX_LEAD);
    expect(
      limitWheelLead({
        delta: -HUGE_DELTA,
        target: CURRENT,
        current: CURRENT,
        maxLead: MAX_LEAD,
      }),
    ).toBe(-MAX_LEAD);
  });

  it("desconta o avanço já acumulado", () => {
    expect(
      limitWheelLead({
        delta: HUGE_DELTA,
        target: CURRENT + PARTIAL_LEAD,
        current: CURRENT,
        maxLead: MAX_LEAD,
      }),
    ).toBe(REMAINING_LEAD);
  });

  it("ignora o delta quando o avanço máximo já foi atingido", () => {
    expect(
      limitWheelLead({
        delta: SMALL_DELTA,
        target: CURRENT + MAX_LEAD,
        current: CURRENT,
        maxLead: MAX_LEAD,
      }),
    ).toBe(0);
  });

  it("permite inverter a direção mesmo com avanço acumulado", () => {
    expect(
      limitWheelLead({
        delta: -SMALL_DELTA,
        target: CURRENT + MAX_LEAD,
        current: CURRENT,
        maxLead: MAX_LEAD,
      }),
    ).toBe(-SMALL_DELTA);
  });
});
