import {
  formatRange,
  fullRange,
  toComboWeights,
  type HandFrequency,
} from "@spotlab/range";
import {
  cellsToRanges,
  seedCells,
  type EditorActionSpec,
  type EditorCell,
} from "@spotlab/hand-matrix";
import type { ParsedBlock } from "./spec";

/** Label for the remainder slot when the block doesn't name one. */
const UNNAMED_REMAINDER = "Rest of range";

/** A multi-action block laid out the way the matrix editor and grid expect. */
export type MatrixModel = {
  actions: EditorActionSpec[];
  /** Action indices that are drawn, in band order. */
  order: number[];
  /** The remainder action's index. */
  passive: number;
  /**
   * Whether the remainder slot was added because the block doesn't name one.
   * It is never drawn, and its range is never written back.
   */
  hiddenRemainder: boolean;
  /** Each action's parsed hands, `null` for the remainder. */
  originals: (HandFrequency[] | null)[];
  /** Each hand's live share (1 − dead), or `null` when nothing is dead. */
  avail: HandFrequency[] | null;
  seed: EditorCell[];
};

export function buildModel(parsed: ParsedBlock, colors: string[]): MatrixModel {
  const actions: EditorActionSpec[] = parsed.actions.map((action, i) => ({
    id: String(i),
    label: action.name,
    color: colors[i],
  }));
  const originals = parsed.actions.map(action => action.hands);

  let passive = parsed.actions.findIndex(action => action.hands === null);
  const hiddenRemainder = passive === -1;
  if (hiddenRemainder) {
    passive = actions.length;
    actions.push({
      id: "rest",
      label: UNNAMED_REMAINDER,
      color: "transparent",
    });
    originals.push(null);
  }
  const order = actions
    .map((_, i) => i)
    .filter(i => !(hiddenRemainder && i === passive));

  const avail = parsed.dead ? liveShares(parsed.dead) : null;
  const seed = seedCells(
    avail ? toComboWeights(avail) : null,
    originals.map(hands => (hands ? toComboWeights(hands) : null)),
    passive,
  );
  return { actions, order, passive, hiddenRemainder, originals, avail, seed };
}

/** Every hand at 1 minus its dead share, so dead hands cap the actions. */
function liveShares(dead: HandFrequency[]): HandFrequency[] {
  const deadByHand = new Map(
    dead.map(({ hand, frequency }) => [hand, frequency]),
  );
  return fullRange().map(({ hand }) => ({
    hand,
    frequency: 1 - (deadByHand.get(hand) ?? 0),
  }));
}

/**
 * Turn edited cells back into one range string per block action, in block
 * order. The remainder stays `null`: it is defined by what's left, not by a
 * range of its own.
 */
export function toActionRanges(
  model: MatrixModel,
  cells: EditorCell[],
): (string | null)[] {
  const ranges = cellsToRanges(model.originals, model.seed, cells, model.avail);
  const count = model.hiddenRemainder ? ranges.length - 1 : ranges.length;
  return ranges
    .slice(0, count)
    .map((hands, i) => (i === model.passive ? null : formatRange(hands)));
}
