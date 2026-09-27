export type PlanId = "bimestral" | "anual" | "semestral";

export type Plan = {
  id: PlanId;
  name: string;
  period: string;
  featured?: boolean;
  tag?: string;
};

export const plans: Plan[] = [
  { id: "bimestral", name: "Bimestral", period: "a cada 2 meses" },
  {
    id: "anual",
    name: "Anual",
    period: "por ano",
    featured: true,
    tag: "Recomendado",
  },
  { id: "semestral", name: "Semestral", period: "a cada 6 meses" },
];

export const DEFAULT_PLAN_ID: PlanId = "anual";

export function getPlan(id: PlanId): Plan {
  const found = plans.find((plan) => plan.id === id);
  if (!found) {
    throw new Error(`Plano desconhecido: ${id}`);
  }
  return found;
}
