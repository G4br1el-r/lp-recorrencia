import { MEDIA } from "@/lib/constants/motion";

export type RenderQuality = "high" | "low";

export type RenderProfile = {
  maxPixelRatio: number;
  antialias: boolean;
  clearcoat: boolean;
  anisotropy: number;
};

export const RENDER_PROFILES: Record<RenderQuality, RenderProfile> = {
  high: { maxPixelRatio: 2, antialias: true, clearcoat: true, anisotropy: 8 },
  low: {
    maxPixelRatio: 1.5,
    antialias: false,
    clearcoat: false,
    anisotropy: 4,
  },
};

const LOW_END_MAX_CORES = 4;
const LOW_END_MAX_MEMORY_GB = 4;

type DeviceSignals = {
  coarsePointer: boolean;
  cores: number | undefined;
  memoryGb: number | undefined;
};

export function detectRenderQuality({
  coarsePointer,
  cores,
  memoryGb,
}: DeviceSignals): RenderQuality {
  if (coarsePointer) {
    return "low";
  }
  if (cores !== undefined && cores <= LOW_END_MAX_CORES) {
    return "low";
  }
  if (memoryGb !== undefined && memoryGb <= LOW_END_MAX_MEMORY_GB) {
    return "low";
  }
  return "high";
}

type NavigatorWithMemory = Navigator & { deviceMemory?: number };

export function currentRenderProfile(): RenderProfile {
  const device: NavigatorWithMemory = navigator;
  const quality = detectRenderQuality({
    coarsePointer: window.matchMedia(MEDIA.coarsePointer).matches,
    cores: device.hardwareConcurrency,
    memoryGb: device.deviceMemory,
  });
  return RENDER_PROFILES[quality];
}
