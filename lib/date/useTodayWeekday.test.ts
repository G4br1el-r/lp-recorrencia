import { renderHook } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTodayWeekday } from "@/lib/date/useTodayWeekday";

const SUNDAY = new Date("2026-09-27T09:00:00");
const WEDNESDAY = new Date("2026-09-30T09:00:00");
const SATURDAY = new Date("2026-10-03T23:00:00");
const SUNDAY_INDEX = 0;
const WEDNESDAY_INDEX = 3;
const SATURDAY_INDEX = 6;
const SERVER_MARKER = "sem-dia";

function WeekdayProbe() {
  const weekday = useTodayWeekday();
  return createElement("span", null, weekday ?? SERVER_MARKER);
}

describe("useTodayWeekday", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    { date: SUNDAY, expected: SUNDAY_INDEX },
    { date: WEDNESDAY, expected: WEDNESDAY_INDEX },
    { date: SATURDAY, expected: SATURDAY_INDEX },
  ])("retorna $expected para $date", ({ date, expected }) => {
    vi.setSystemTime(date);
    const { result } = renderHook(() => useTodayWeekday());
    expect(result.current).toBe(expected);
  });

  it("não conhece o dia durante a renderização no servidor", () => {
    vi.setSystemTime(WEDNESDAY);
    expect(renderToString(createElement(WeekdayProbe))).toContain(
      SERVER_MARKER,
    );
  });
});
