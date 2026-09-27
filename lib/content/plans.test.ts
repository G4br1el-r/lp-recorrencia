import { describe, expect, it } from "vitest";
import {
  DEFAULT_PLAN_ID,
  getPlan,
  type PlanId,
  plans,
} from "@/lib/content/plans";

const VALID_PLAN_IDS: readonly PlanId[] = ["bimestral", "anual", "semestral"];

const UNKNOWN_PLAN_ID = "mensal";

function isPlanId(value: string): value is PlanId {
  return plans.some((plan) => plan.id === value);
}

function unknownPlanId(): PlanId {
  const candidate: string = UNKNOWN_PLAN_ID;
  if (isPlanId(candidate)) {
    throw new Error("O id de teste não deveria ser válido");
  }
  return candidate as PlanId;
}

describe("getPlan", () => {
  it.each(VALID_PLAN_IDS)("retorna o plano correspondente a %s", (id) => {
    const plan = getPlan(id);
    expect(plan.id).toBe(id);
    expect(plan).toBe(plans.find((item) => item.id === id));
  });

  it("retorna o plano padrão", () => {
    expect(getPlan(DEFAULT_PLAN_ID).id).toBe(DEFAULT_PLAN_ID);
  });

  it("lança erro para id desconhecido", () => {
    expect(() => getPlan(unknownPlanId())).toThrowError(
      `Plano desconhecido: ${UNKNOWN_PLAN_ID}`,
    );
  });
});
