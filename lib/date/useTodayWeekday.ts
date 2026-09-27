"use client";

import { useSyncExternalStore } from "react";

const noopUnsubscribe = () => undefined;

function subscribe(): () => void {
  return noopUnsubscribe;
}

function readWeekday(): number {
  return new Date().getDay();
}

function readServerWeekday(): null {
  return null;
}

export function useTodayWeekday(): number | null {
  return useSyncExternalStore(subscribe, readWeekday, readServerWeekday);
}
