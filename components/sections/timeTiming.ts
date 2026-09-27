import { copy } from "@/lib/content/copy";

export const TIME_MONTHS = copy.time.months;
export const TIME_CHAPTERS = copy.time.chapters;
export const MONTHS_PER_CHAPTER = TIME_MONTHS.length / TIME_CHAPTERS.length;

export const COLUMN = {
  at: 0.1,
  duration: 0.74,
  slotsBefore: 1,
  slotsAfter: 1,
} as const;
export const COLUMN_TRAVEL_SLOTS =
  TIME_MONTHS.length - 1 + COLUMN.slotsBefore + COLUMN.slotsAfter;
export const INTRO = {
  at: 0.02,
  duration: 0.05,
  fadeAt: 0.04,
  outAt: 0.1,
  outDuration: 0.025,
  stagger: 0.01,
} as const;
export const OUTRO = { at: 0.86, duration: 0.07, fadeAt: 0.89 } as const;
export const CHAPTER = {
  firstIn: 0.125,
  lastOut: 0.8,
  inDuration: 0.04,
  outDuration: 0.03,
  inLag: 0.005,
  outLead: 0.035,
  travel: 0.07,
  stagger: 0.01,
} as const;

export function monthTime(index: number): number {
  return (
    COLUMN.at +
    ((index + COLUMN.slotsBefore) / COLUMN_TRAVEL_SLOTS) * COLUMN.duration
  );
}

export function chapterBoundary(chapter: number): number {
  const first = chapter * MONTHS_PER_CHAPTER;
  return (monthTime(first - 1) + monthTime(first)) / 2;
}

export function chapterIn(chapter: number): number {
  return chapter === 0
    ? CHAPTER.firstIn
    : chapterBoundary(chapter) + CHAPTER.inLag;
}

export function chapterOut(chapter: number): number {
  return chapter === TIME_CHAPTERS.length - 1
    ? CHAPTER.lastOut
    : chapterBoundary(chapter + 1) - CHAPTER.outLead;
}

export function chapterSide(chapter: number): 1 | -1 {
  return chapter % 2 === 0 ? 1 : -1;
}

export function chapterMonths(chapter: number) {
  const first = chapter * MONTHS_PER_CHAPTER;
  return TIME_MONTHS.slice(first, first + MONTHS_PER_CHAPTER).map(
    (month, offset) => ({ ...month, index: first + offset }),
  );
}

export const TIME_REST = [
  INTRO.fadeAt + INTRO.duration,
  ...TIME_CHAPTERS.map((_, chapter) =>
    monthTime(chapter * MONTHS_PER_CHAPTER + 1),
  ),
  OUTRO.fadeAt + OUTRO.duration,
];
