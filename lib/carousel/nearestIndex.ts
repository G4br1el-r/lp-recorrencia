export function nearestIndex(positions: readonly number[], target: number) {
  let nearest = 0;
  positions.forEach((position, index) => {
    if (Math.abs(position - target) < Math.abs(positions[nearest] - target)) {
      nearest = index;
    }
  });
  return nearest;
}
