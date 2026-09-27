"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_EDITION_ID,
  type Edition,
  type EditionId,
  getEdition,
} from "@/lib/content/editions";
import {
  DEFAULT_PLAN_ID,
  getPlan,
  type Plan,
  type PlanId,
} from "@/lib/content/plans";

type SelectionState = {
  editionId: EditionId;
  planId: PlanId;
};

type SelectionActions = {
  selectEdition: (id: EditionId) => void;
  selectPlan: (id: PlanId) => void;
};

type SelectionContextValue = SelectionState &
  SelectionActions & {
    edition: Edition;
    plan: Plan;
    price: number;
  };

const SelectionContext = createContext<SelectionContextValue | null>(null);
const SelectionActionsContext = createContext<SelectionActions | null>(null);
const SelectedEditionIdContext = createContext<EditionId | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SelectionState>({
    editionId: DEFAULT_EDITION_ID,
    planId: DEFAULT_PLAN_ID,
  });

  const actions = useMemo<SelectionActions>(
    () => ({
      selectEdition: (id) =>
        setState((previous) => ({ ...previous, editionId: id })),
      selectPlan: (id) => setState((previous) => ({ ...previous, planId: id })),
    }),
    [],
  );

  const value = useMemo<SelectionContextValue>(() => {
    const edition = getEdition(state.editionId);
    return {
      ...state,
      ...actions,
      edition,
      plan: getPlan(state.planId),
      price: edition.price[state.planId],
    };
  }, [state, actions]);

  return (
    <SelectionActionsContext.Provider value={actions}>
      <SelectedEditionIdContext.Provider value={state.editionId}>
        <SelectionContext.Provider value={value}>
          {children}
        </SelectionContext.Provider>
      </SelectedEditionIdContext.Provider>
    </SelectionActionsContext.Provider>
  );
}

export function useSelection(): SelectionContextValue {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error("useSelection precisa estar dentro de SelectionProvider");
  }
  return context;
}

export function useSelectionActions(): SelectionActions {
  const context = useContext(SelectionActionsContext);
  if (!context) {
    throw new Error(
      "useSelectionActions precisa estar dentro de SelectionProvider",
    );
  }
  return context;
}

export function useSelectedEditionId(): EditionId {
  const context = useContext(SelectedEditionIdContext);
  if (!context) {
    throw new Error(
      "useSelectedEditionId precisa estar dentro de SelectionProvider",
    );
  }
  return context;
}
