import { describe, expect, it, vi } from "vitest";
import {
  BOOK_HIDDEN,
  bookVars,
  createStageState,
  HERO_FAN,
  HOVER_NEUTRAL,
  heroFanState,
  lightVars,
  moveBook,
  moveLight,
  STAGE,
  STAGE_LIGHT,
} from "@/components/motion/stage";
import { GSAP_EASE } from "@/lib/constants/motion";
import type { EditionId } from "@/lib/content/editions";

const EDITION_IDS: readonly EditionId[] = [
  "traditional",
  "largePrint",
  "celebration",
];

const AT = 0.25;
const DURATION = 0.5;
const CUSTOM_EASE = GSAP_EASE.cinematic;
const CHANGED_VALUE = 42;

function fakeTimeline() {
  const fromTo = vi.fn();
  const timeline = { fromTo } as unknown as gsap.core.Timeline;
  return { timeline, fromTo };
}

describe("createStageState", () => {
  it("inicia livros ocultos, hover neutro e luz apagada", () => {
    const state = createStageState();

    for (const id of EDITION_IDS) {
      expect(state.books[id]).toEqual(BOOK_HIDDEN);
      expect(state.hover[id]).toEqual(HOVER_NEUTRAL);
    }
    expect(state.light).toEqual(STAGE_LIGHT.off);
  });

  it("cria objetos independentes por edição", () => {
    const state = createStageState();
    const [first, ...others] = EDITION_IDS;

    state.books[first].xVw = CHANGED_VALUE;
    state.hover[first].liftVh = CHANGED_VALUE;

    for (const id of others) {
      expect(state.books[id]).not.toBe(state.books[first]);
      expect(state.books[id].xVw).toBe(BOOK_HIDDEN.xVw);
      expect(state.hover[id].liftVh).toBe(HOVER_NEUTRAL.liftVh);
    }
  });

  it("não compartilha referências com as constantes nem entre chamadas", () => {
    const first = createStageState();
    const second = createStageState();

    first.books.traditional.opacity = CHANGED_VALUE;
    first.light.opacity = CHANGED_VALUE;

    expect(first.books.traditional).not.toBe(BOOK_HIDDEN);
    expect(first.light).not.toBe(STAGE_LIGHT.off);
    expect(second.books.traditional.opacity).toBe(BOOK_HIDDEN.opacity);
    expect(second.light.opacity).toBe(STAGE_LIGHT.off.opacity);
    expect(BOOK_HIDDEN.opacity).not.toBe(CHANGED_VALUE);
    expect(STAGE_LIGHT.off.opacity).not.toBe(CHANGED_VALUE);
  });
});

describe("bookVars e lightVars", () => {
  it("copiam o estado sem manter referência", () => {
    const book = bookVars(STAGE.heroEnd);
    const light = lightVars(STAGE_LIGHT.heroEnd);

    expect(book).toEqual(STAGE.heroEnd);
    expect(book).not.toBe(STAGE.heroEnd);
    expect(light).toEqual(STAGE_LIGHT.heroEnd);
    expect(light).not.toBe(STAGE_LIGHT.heroEnd);
  });
});

describe("moveBook", () => {
  it("chama fromTo com estados, duração, posição e ease padrão", () => {
    const { timeline, fromTo } = fakeTimeline();
    const target = {};

    moveBook(timeline, target, BOOK_HIDDEN, STAGE.heroEnd, AT, DURATION);

    expect(fromTo).toHaveBeenCalledOnce();
    expect(fromTo).toHaveBeenCalledWith(
      target,
      { ...BOOK_HIDDEN },
      {
        ...STAGE.heroEnd,
        duration: DURATION,
        ease: GSAP_EASE.camera,
        immediateRender: false,
      },
      AT,
    );
  });

  it("aceita ease customizado", () => {
    const { timeline, fromTo } = fakeTimeline();

    moveBook(
      timeline,
      {},
      STAGE.heroEnd,
      STAGE.timeCenter,
      AT,
      DURATION,
      CUSTOM_EASE,
    );

    expect(fromTo.mock.lastCall?.[2]).toMatchObject({ ease: CUSTOM_EASE });
  });
});

describe("moveLight", () => {
  it("chama fromTo com estados, duração, posição e ease padrão", () => {
    const { timeline, fromTo } = fakeTimeline();
    const target = {};

    moveLight(
      timeline,
      target,
      STAGE_LIGHT.off,
      STAGE_LIGHT.heroEnd,
      AT,
      DURATION,
    );

    expect(fromTo).toHaveBeenCalledOnce();
    expect(fromTo).toHaveBeenCalledWith(
      target,
      { ...STAGE_LIGHT.off },
      {
        ...STAGE_LIGHT.heroEnd,
        duration: DURATION,
        ease: GSAP_EASE.linear,
        immediateRender: false,
      },
      AT,
    );
  });

  it("aceita ease customizado", () => {
    const { timeline, fromTo } = fakeTimeline();

    moveLight(
      timeline,
      {},
      STAGE_LIGHT.heroEnd,
      STAGE_LIGHT.dailyEnd,
      AT,
      DURATION,
      CUSTOM_EASE,
    );

    expect(fromTo.mock.lastCall?.[2]).toMatchObject({ ease: CUSTOM_EASE });
  });
});

describe("heroFanState", () => {
  it("recolhe o livro invisível atrás do livro central", () => {
    const tucked = heroFanState(true, -1, false);

    expect(tucked.xVw).toBe(STAGE.heroEnd.xVw);
    expect(tucked.yVh).toBe(STAGE.heroEnd.yVh);
    expect(tucked.zPx).toBeLessThan(STAGE.heroEnd.zPx);
    expect(tucked.scale).toBeLessThan(STAGE.heroEnd.scale);
    expect(tucked.opacity).toBe(0);
  });

  it("recolhe os dois lados na mesma posição", () => {
    expect(heroFanState(true, -1, false)).toEqual(heroFanState(true, 1, false));
  });

  it("abre o leque espelhado, atrás e visível", () => {
    const left = heroFanState(true, -1, true);
    const right = heroFanState(true, 1, true);

    expect(left.xVw).toBe(-HERO_FAN.spreadXVw.desktop);
    expect(right.xVw).toBe(HERO_FAN.spreadXVw.desktop);
    expect(left.rotationY).toBe(-right.rotationY);
    expect(left.rotationY).toBeGreaterThan(0);
    for (const book of [left, right]) {
      expect(book.zPx).toBeLessThan(STAGE.heroEnd.zPx);
      expect(book.zPx).toBeGreaterThan(heroFanState(true, -1, false).zPx);
      expect(book.opacity).toBe(STAGE.heroEnd.opacity);
      expect(book.reflect).toBe(STAGE.heroEnd.reflect);
    }
  });

  it("usa abertura maior no mobile", () => {
    expect(heroFanState(false, 1, true).xVw).toBe(HERO_FAN.spreadXVw.mobile);
    expect(HERO_FAN.spreadXVw.mobile).toBeGreaterThan(
      HERO_FAN.spreadXVw.desktop,
    );
  });
});
