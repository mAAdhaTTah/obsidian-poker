const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const sum = (weights: number[], indices: number[]) =>
  indices.reduce((total, i) => total + weights[i], 0);

/** Scale `indices` proportionally so they add up to `target`. */
function fill(weights: number[], indices: number[], target: number) {
  const total = sum(weights, indices);
  if (indices.length === 0) return;
  if (total <= 0) {
    indices.forEach(i => (weights[i] = 0));
    weights[indices[0]] = target;
    return;
  }
  indices.forEach(
    i => (weights[i] = Math.round((weights[i] / total) * target)),
  );
  // Rounding can leave the group a point or two off; settle it on whichever
  // member has room, largest first.
  let drift = target - sum(weights, indices);
  const byWeight = [...indices].sort((a, b) => weights[b] - weights[a]);
  for (const i of byWeight) {
    if (drift === 0) break;
    const change = Math.max(drift, -weights[i]);
    weights[i] += change;
    drift -= change;
  }
}

/**
 * Set one action's brush weight and rebalance the rest so they sum to 100.
 * The remainder (`passive`) absorbs the change first: other actions keep
 * their weights until together they would pass 100, and only then shrink,
 * proportionally. Moving the remainder itself scales the other actions to
 * fill what's left.
 */
export function rebalanceRemainderFirst(
  weights: number[],
  index: number,
  value: number,
  passive: number,
): number[] {
  const next = weights.slice();
  next[index] = clamp(value);
  const others = next
    .map((_, i) => i)
    .filter(i => i !== index && i !== passive);

  if (index === passive) {
    fill(next, others, 100 - next[index]);
    return next;
  }

  const room = 100 - next[index];
  if (sum(next, others) <= room) {
    next[passive] = room - sum(next, others);
  } else {
    next[passive] = 0;
    fill(next, others, room);
  }
  return next;
}
