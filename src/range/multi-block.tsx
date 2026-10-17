import { useMemo, useState } from "react";
import { stringifyYaml } from "obsidian";
import {
  ActionWeightSliders,
  RangeMatrix,
  RangeMatrixEditor,
  type EditorCell,
  type PaintTool,
} from "@spotlab/hand-matrix";
import {
  cellsChanged,
  countCombos,
  EditorToolbar,
  ErrorView,
  Legend,
  type LegendEntry,
  TOTAL_HANDS,
  useSave,
} from "./editing";
import { buildModel, toActionRanges, type MatrixModel } from "./model";
import {
  parseRanges,
  resolveColors,
  stringifySpec,
  type BlockSpec,
  type ParsedBlock,
} from "./spec";

type MultiSpec = Extract<BlockSpec, { kind: "multi" }>;

type MultiRangeBlockProps = {
  spec: MultiSpec;
  onSave: (body: string) => Promise<void>;
};

export const MultiRangeBlock = ({ spec, onSave }: MultiRangeBlockProps) => {
  const result = useMemo(() => {
    try {
      const parsed = parseRanges(spec);
      const colors = resolveColors(spec.actions);
      return {
        ok: true as const,
        parsed,
        colors,
        model: buildModel(parsed, colors),
      };
    } catch (e) {
      return {
        ok: false as const,
        message: e instanceof Error ? e.message : String(e),
      };
    }
  }, [spec]);
  const [editing, setEditing] = useState(false);

  if (!result.ok) return <ErrorView message={result.message} />;
  const { parsed, colors, model } = result;

  if (editing) {
    return (
      <MultiRangeEditor
        model={model}
        onCancel={() => setEditing(false)}
        onSave={async cells => {
          const ranges = toActionRanges(model, cells);
          const updated: MultiSpec = {
            ...spec,
            actions: spec.actions.map((action, i) => ({
              ...action,
              range: ranges[i],
            })),
          };
          await onSave(stringifySpec(updated, stringifyYaml));
          setEditing(false);
        }}
      />
    );
  }

  return (
    <div className="pkr-range">
      <div className="pkr-range-header">
        <button className="pkr-range-button" onClick={() => setEditing(true)}>
          Edit
        </button>
      </div>
      <RangeMatrix
        cells={model.seed}
        actions={model.actions}
        order={model.order}
      />
      <Legend entries={legendEntries(parsed, colors)} />
    </div>
  );
};

/** One entry per action in block order, then dead. */
const legendEntries = (
  parsed: ParsedBlock,
  colors: string[],
): LegendEntry[] => {
  const dead = parsed.dead ? countCombos(parsed.dead) : 0;
  const assigned = parsed.actions.reduce(
    (sum, action) => sum + (action.hands ? countCombos(action.hands) : 0),
    0,
  );
  const entries: LegendEntry[] = parsed.actions.map((action, i) => ({
    label: action.name,
    color: colors[i],
    combos: action.hands
      ? countCombos(action.hands)
      : TOTAL_HANDS - dead - assigned,
  }));
  if (parsed.dead) entries.push({ label: "Dead", color: null, combos: dead });
  return entries;
};

type MultiRangeEditorProps = {
  model: MatrixModel;
  onCancel: () => void;
  onSave: (cells: EditorCell[]) => Promise<void>;
};

const MultiRangeEditor = ({
  model,
  onCancel,
  onSave,
}: MultiRangeEditorProps) => {
  const { seed, actions, order, passive } = model;
  const [cells, setCells] = useState(seed);
  // Start the brush fully on the first drawn action.
  const [brush, setBrush] = useState<number[]>(() =>
    actions.map((_, i) => (i === order[0] ? 100 : 0)),
  );
  const [tool, setTool] = useState<PaintTool>("brush");
  const { saving, error, save } = useSave(() =>
    cellsChanged(cells, seed) ? onSave(cells) : Promise.resolve(onCancel()),
  );

  const clear = () =>
    setCells(
      cells.map(cell => ({
        avail: cell.avail,
        weights: actions.map((_, i) => (i === passive ? 100 : 0)),
      })),
    );

  return (
    <div className="pkr-range pkr-range-editing">
      <EditorToolbar
        tool={tool}
        saving={saving}
        onToolChange={setTool}
        onClear={clear}
        onCancel={onCancel}
        onSave={() => void save()}
      />
      {error && <div className="pkr-range-error-message">{error}</div>}
      <RangeMatrixEditor
        cells={cells}
        actions={actions}
        order={order}
        brush={brush}
        tool={tool}
        onCellsChange={setCells}
        onBrushChange={setBrush}
        onToolChange={setTool}
      />
      <ActionWeightSliders
        actions={actions}
        order={order}
        weights={brush}
        passive={passive}
        onWeightsChange={setBrush}
      />
    </div>
  );
};
