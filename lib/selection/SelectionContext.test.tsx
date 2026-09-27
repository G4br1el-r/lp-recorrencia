import { act, renderHook } from "@testing-library/react";
import { type ReactNode, useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_EDITION_ID,
  type EditionId,
  editions,
  getEdition,
} from "@/lib/content/editions";
import { DEFAULT_PLAN_ID, getPlan, type PlanId } from "@/lib/content/plans";
import {
  SelectionProvider,
  useSelectedEditionId,
  useSelection,
  useSelectionActions,
} from "@/lib/selection/SelectionContext";

const OTHER_EDITION_ID: EditionId = "largePrint";
const EDITION_WITHOUT_INSTALLMENTS_ID: EditionId = "celebration";
const OTHER_PLAN_ID: PlanId = "bimestral";
const ALL_PLAN_IDS: readonly PlanId[] = ["bimestral", "anual", "semestral"];
const INITIAL_RENDER_COUNT = 1;
const RENDER_COUNT_AFTER_EDITION_CHANGE = 2;

function wrapper({ children }: { children: ReactNode }) {
  return <SelectionProvider>{children}</SelectionProvider>;
}

function useSelectionWithActions() {
  return { selection: useSelection(), actions: useSelectionActions() };
}

function renderSelection() {
  return renderHook(useSelectionWithActions, { wrapper });
}

describe("SelectionProvider", () => {
  it("inicia com a edição e o plano padrão", () => {
    const { result } = renderSelection();
    const { selection } = result.current;

    expect(selection.editionId).toBe(DEFAULT_EDITION_ID);
    expect(selection.planId).toBe(DEFAULT_PLAN_ID);
    expect(selection.edition).toBe(getEdition(DEFAULT_EDITION_ID));
    expect(selection.plan).toBe(getPlan(DEFAULT_PLAN_ID));
    expect(selection.price).toBe(
      getEdition(DEFAULT_EDITION_ID).price[DEFAULT_PLAN_ID],
    );
  });

  it("selectEdition troca o preço mantendo o plano", () => {
    const { result } = renderSelection();

    act(() => {
      result.current.actions.selectEdition(OTHER_EDITION_ID);
    });

    const { selection } = result.current;
    expect(selection.editionId).toBe(OTHER_EDITION_ID);
    expect(selection.planId).toBe(DEFAULT_PLAN_ID);
    expect(selection.edition).toBe(getEdition(OTHER_EDITION_ID));
    expect(selection.price).toBe(
      getEdition(OTHER_EDITION_ID).price[DEFAULT_PLAN_ID],
    );
  });

  it("selectPlan troca o preço mantendo a edição", () => {
    const { result } = renderSelection();

    act(() => {
      result.current.actions.selectPlan(OTHER_PLAN_ID);
    });

    const { selection } = result.current;
    expect(selection.editionId).toBe(DEFAULT_EDITION_ID);
    expect(selection.planId).toBe(OTHER_PLAN_ID);
    expect(selection.plan).toBe(getPlan(OTHER_PLAN_ID));
    expect(selection.price).toBe(
      getEdition(DEFAULT_EDITION_ID).price[OTHER_PLAN_ID],
    );
  });

  it.each(ALL_PLAN_IDS)(
    "edição sem parcelamento funciona no plano %s",
    (planId) => {
      const { result } = renderSelection();

      act(() => {
        result.current.actions.selectEdition(EDITION_WITHOUT_INSTALLMENTS_ID);
        result.current.actions.selectPlan(planId);
      });

      const { selection } = result.current;
      const edition = getEdition(EDITION_WITHOUT_INSTALLMENTS_ID);
      expect(edition.price.installments).toBeUndefined();
      expect(selection.edition).toBe(edition);
      expect(selection.price).toBe(edition.price[planId]);
    },
  );

  it("todas as combinações de edição e plano têm preço numérico", () => {
    const { result } = renderSelection();

    for (const edition of editions) {
      for (const planId of ALL_PLAN_IDS) {
        act(() => {
          result.current.actions.selectEdition(edition.id);
          result.current.actions.selectPlan(planId);
        });
        expect(result.current.selection.price).toBe(edition.price[planId]);
      }
    }
  });

  it("mantém a referência das ações estável entre renders", () => {
    const { result, rerender } = renderSelection();
    const initialActions = result.current.actions;
    const initialSelectEdition = result.current.selection.selectEdition;

    rerender();
    act(() => {
      result.current.actions.selectEdition(OTHER_EDITION_ID);
    });
    act(() => {
      result.current.actions.selectPlan(OTHER_PLAN_ID);
    });

    expect(result.current.actions).toBe(initialActions);
    expect(result.current.selection.selectEdition).toBe(initialSelectEdition);
  });
});

function useEditionIdWithRenderCount() {
  const renders = useRef(0);
  renders.current += 1;
  return {
    editionId: useSelectedEditionId(),
    actions: useSelectionActions(),
    renders: renders.current,
  };
}

describe("useSelectedEditionId", () => {
  it("retorna a edição padrão e acompanha selectEdition", () => {
    const { result } = renderHook(useEditionIdWithRenderCount, { wrapper });

    expect(result.current.editionId).toBe(DEFAULT_EDITION_ID);

    act(() => {
      result.current.actions.selectEdition(OTHER_EDITION_ID);
    });

    expect(result.current.editionId).toBe(OTHER_EDITION_ID);
    expect(result.current.renders).toBe(RENDER_COUNT_AFTER_EDITION_CHANGE);
  });

  it("não re-renderiza quando só o plano muda", () => {
    const { result } = renderHook(useEditionIdWithRenderCount, { wrapper });

    act(() => {
      result.current.actions.selectPlan(OTHER_PLAN_ID);
    });

    expect(result.current.editionId).toBe(DEFAULT_EDITION_ID);
    expect(result.current.renders).toBe(INITIAL_RENDER_COUNT);
  });
});

describe("hooks fora do provider", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("useSelection lança erro", () => {
    expect(() => renderHook(() => useSelection())).toThrowError(
      "useSelection precisa estar dentro de SelectionProvider",
    );
  });

  it("useSelectedEditionId lança erro", () => {
    expect(() => renderHook(() => useSelectedEditionId())).toThrowError(
      "useSelectedEditionId precisa estar dentro de SelectionProvider",
    );
  });

  it("useSelectionActions lança erro", () => {
    expect(() => renderHook(() => useSelectionActions())).toThrowError(
      "useSelectionActions precisa estar dentro de SelectionProvider",
    );
  });
});
