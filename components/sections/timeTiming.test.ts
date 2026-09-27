import { describe, expect, it } from "vitest";
import {
  CHAPTER,
  COLUMN,
  chapterBoundary,
  chapterIn,
  chapterMonths,
  chapterOut,
  chapterSide,
  MONTHS_PER_CHAPTER,
  monthTime,
  TIME_CHAPTERS,
  TIME_MONTHS,
  TIME_REST,
} from "@/components/sections/timeTiming";

const LAST_MONTH = TIME_MONTHS.length - 1;
const LAST_CHAPTER = TIME_CHAPTERS.length - 1;
const SECOND_CHAPTER = 1;
const INTRO_AND_OUTRO_RESTS = 2;

describe("timeTiming", () => {
  it("distribui os meses dentro da viagem da coluna", () => {
    expect(monthTime(0)).toBeGreaterThan(COLUMN.at);
    expect(monthTime(LAST_MONTH)).toBeLessThan(COLUMN.at + COLUMN.duration);
    expect(monthTime(1)).toBeGreaterThan(monthTime(0));
  });

  it("põe a fronteira do capítulo entre o último mês anterior e o primeiro", () => {
    const first = SECOND_CHAPTER * MONTHS_PER_CHAPTER;
    const boundary = chapterBoundary(SECOND_CHAPTER);
    expect(boundary).toBeGreaterThan(monthTime(first - 1));
    expect(boundary).toBeLessThan(monthTime(first));
  });

  it("abre o primeiro e fecha o último capítulo nos tempos fixos", () => {
    expect(chapterIn(0)).toBe(CHAPTER.firstIn);
    expect(chapterOut(LAST_CHAPTER)).toBe(CHAPTER.lastOut);
  });

  it("fecha cada capítulo antes do próximo abrir", () => {
    for (let chapter = 0; chapter < LAST_CHAPTER; chapter += 1) {
      expect(chapterOut(chapter)).toBeLessThan(chapterIn(chapter + 1));
    }
  });

  it("alterna o lado do livro a cada capítulo", () => {
    expect(chapterSide(0)).toBe(1);
    expect(chapterSide(SECOND_CHAPTER)).toBe(-1);
  });

  it("devolve os meses do capítulo com o índice no ano", () => {
    const months = chapterMonths(SECOND_CHAPTER);
    expect(months).toHaveLength(MONTHS_PER_CHAPTER);
    expect(months[0].index).toBe(MONTHS_PER_CHAPTER);
    expect(months[0].short).toBe(TIME_MONTHS[MONTHS_PER_CHAPTER].short);
  });

  it("tem um repouso para intro, cada capítulo e o fechamento, em ordem", () => {
    expect(TIME_REST).toHaveLength(
      TIME_CHAPTERS.length + INTRO_AND_OUTRO_RESTS,
    );
    expect([...TIME_REST].sort((a, b) => a - b)).toEqual(TIME_REST);
  });
});
