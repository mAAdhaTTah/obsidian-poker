import { beforeAll, describe, expect, it } from "vitest";
import { parse } from "yaml";
import { COMBOS, initRange } from "@spotlab/range";
import type { EditorCell } from "@spotlab/hand-matrix";
import { dedent } from "../test-utils";
import { buildModel, toActionRanges } from "./model";
import { parseRanges, parseSpec, resolveColors } from "./spec";

const model = (source: string) => {
  const spec = parseSpec(source, parse);
  if (spec.kind !== "multi") throw new Error("expected a multi-action block");
  return buildModel(parseRanges(spec), resolveColors(spec.actions));
};
const withCell = (cells: EditorCell[], combo: string, cell: EditorCell) =>
  cells.map((c, i) => (COMBOS[i] === combo ? cell : c));
const cellOf = (m: ReturnType<typeof model>, combo: string) =>
  m.seed[COMBOS.indexOf(combo)];

beforeAll(async () => {
  await initRange();
});

describe("buildModel", () => {
  it("adds a hidden remainder when the block doesn't name one", () => {
    const m = model(dedent`
      Raise: QQ+
      Call: JJ
    `);
    expect(m.actions.map(a => a.label)).toEqual([
      "Raise",
      "Call",
      "Rest of range",
    ]);
    expect(m.passive).toBe(2);
    expect(m.hiddenRemainder).toBe(true);
    expect(m.order).toEqual([0, 1]);
  });

  it("draws a named remainder", () => {
    const m = model(dedent`
      Raise: QQ+
      Fold:
      Call: JJ
    `);
    expect(m.actions.map(a => a.label)).toEqual(["Raise", "Fold", "Call"]);
    expect(m.passive).toBe(1);
    expect(m.hiddenRemainder).toBe(false);
    expect(m.order).toEqual([0, 1, 2]);
    expect(m.actions[1].color).toBe("var(--color-green)");
  });

  it("splits each cell between actions and the remainder", () => {
    const m = model(dedent`
      Raise: AKs:0.5
      Call: AKs:0.25
    `);
    expect(cellOf(m, "AKs")).toEqual({ avail: 1, weights: [50, 25, 25] });
    expect(cellOf(m, "72o")).toEqual({ avail: 1, weights: [0, 0, 100] });
  });

  it("caps cells by what dead leaves alive", () => {
    const m = model(dedent`
      Raise: AKs:0.5
      dead: AKs:0.5,22
    `);
    expect(cellOf(m, "AKs")).toEqual({ avail: 0.5, weights: [100, 0] });
    expect(cellOf(m, "22").avail).toBe(0);
    expect(m.avail?.find(h => h.hand === "AhKh")?.frequency).toBe(0.5);
  });
});

describe("toActionRanges", () => {
  it("gives back the original ranges when nothing was painted", () => {
    const m = model(dedent`
      Raise: QQ+,AhKh:0.7
      Fold:
      Call: JJ-99,AQs:0.5
    `);
    expect(toActionRanges(m, m.seed)).toEqual([
      "QQ+,AhKh:0.7",
      null,
      "JJ-99,AQs:0.5",
    ]);
  });

  it("rebuilds painted combos and keeps the rest verbatim", () => {
    const m = model(dedent`
      Raise: QQ+,AhKh:0.7
      Call: JJ
    `);
    const cells = withCell(m.seed, "TT", { avail: 1, weights: [0, 100, 0] });
    expect(toActionRanges(m, cells)).toEqual(["QQ+,AhKh:0.7", "JJ-TT"]);
  });

  it("keeps painted shares within the live part of dead hands", () => {
    const m = model(dedent`
      Raise: AKs:0.25
      dead: AKs:0.5
    `);
    const cells = withCell(m.seed, "AKs", { avail: 0.5, weights: [100, 0] });
    expect(toActionRanges(m, cells)).toEqual(["AKs:0.5"]);
  });
});
