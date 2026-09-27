"use client";

import { useSyncExternalStore } from "react";
import { MEDIA } from "@/lib/constants/motion";

function subscribe(query: string, callback: () => void): () => void {
  const list = window.matchMedia(query);
  list.addEventListener("change", callback);
  return () => list.removeEventListener("change", callback);
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => subscribe(query, callback),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function useReducedMotionPreference(): boolean {
  return useMediaQuery(MEDIA.reduceMotion);
}
