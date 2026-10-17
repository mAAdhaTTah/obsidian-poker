import { describe, expect, it } from "vitest";
import { rebalanceRemainderFirst as rebalance } from "./rebalance";

// Weights are [3-bet, Call, remainder] unless noted.
const PASSIVE = 2;
const total = (weights: number[]) => weights.reduce((a, b) => a + b, 0);

describe("rebalanceRemainderFirst", () => {
  it("takes from the remainder while the actions fit", () => {
    const after3bet = rebalance([100, 0, 0], 0, 65, PASSIVE);
    expect(after3bet).toEqual([65, 0, 35]);
    expect(rebalance(after3bet, 1, 15, PASSIVE)).toEqual([65, 15, 20]);
  });

  it("gives back to the remainder when an action drops", () => {
    expect(rebalance([65, 15, 20], 0, 40, PASSIVE)).toEqual([40, 15, 45]);
  });

  it("shrinks the other actions only once they'd pass 100", () => {
    expect(rebalance([65, 15, 20], 1, 50, PASSIVE)).toEqual([50, 50, 0]);
    expect(rebalance([65, 15, 20], 1, 100, PASSIVE)).toEqual([0, 100, 0]);
  });

  it("shrinks several other actions proportionally", () => {
    // [Raise, Call, Limp, remainder]
    expect(rebalance([40, 20, 20, 20], 0, 80, 3)).toEqual([80, 10, 10, 0]);
  });

  it("scales the actions when the remainder itself moves", () => {
    expect(rebalance([60, 20, 20], PASSIVE, 60, PASSIVE)).toEqual([30, 10, 60]);
    expect(rebalance([0, 0, 100], PASSIVE, 40, PASSIVE)).toEqual([60, 0, 40]);
  });

  it("clamps and rounds the value", () => {
    expect(rebalance([50, 0, 50], 0, 140, PASSIVE)).toEqual([100, 0, 0]);
    expect(rebalance([50, 0, 50], 0, -5, PASSIVE)).toEqual([0, 0, 100]);
    expect(rebalance([50, 0, 50], 0, 33.6, PASSIVE)).toEqual([34, 0, 66]);
  });

  it("always sums to 100 despite rounding", () => {
    for (const value of [1, 7, 33, 50, 67, 99]) {
      expect(total(rebalance([34, 33, 33, 0], 3, value, 3))).toBe(100);
      expect(total(rebalance([10, 45, 45, 0], 0, value, 3))).toBe(100);
    }
  });

  it("works with a remainder that isn't the last action", () => {
    // [Raise, Fold (remainder), Call]
    expect(rebalance([50, 50, 0], 2, 30, 1)).toEqual([50, 20, 30]);
  });
});
