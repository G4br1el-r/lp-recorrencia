import { MEDIA } from "@/lib/constants/motion";

export type RenderQuality = "high" | "low";

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

export function currentRenderQuality(): RenderQuality {
  const device: NavigatorWithMemory = navigator;
  return detectRenderQuality({
    coarsePointer: window.matchMedia(MEDIA.coarsePointer).matches,
    cores: device.hardwareConcurrency,
    memoryGb: device.deviceMemory,
  });
}
