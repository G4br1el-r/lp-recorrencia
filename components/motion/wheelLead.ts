type WheelLeadInput = {
  delta: number;
  target: number;
  current: number;
  maxLead: number;
};

export function limitWheelLead({
  delta,
  target,
  current,
  maxLead,
}: WheelLeadInput): number {
  const lead = target - current;
  if (delta > 0) {
    return Math.min(delta, Math.max(0, maxLead - lead));
  }
  return Math.max(delta, Math.min(0, -maxLead - lead));
}
