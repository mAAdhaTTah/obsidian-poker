import { useMemo, useState } from "react";
import { parseYaml } from "obsidian";
import {
  formatRange,
  parseRange,
  toComboWeights,
  type HandFrequency,
} from "@spotlab/range";
import {
  ActionWeightSliders,
  cellsToRanges,
  RangeMatrix,
  RangeMatrixEditor,
  rangeToMatrix,
  seedCells,
  type EditorActionSpec,
  type PaintTool,
} from "@spotlab/hand-matrix";
import {
  cellsChanged,
  countCombos,
  EditorToolbar,
  ErrorView,
  formatCombos,
  useSave,
} from "./editing";
import { MultiRangeBlock } from "./multi-block";
import { parseSpec, type BlockSpec } from "./spec";

const IN_RANGE = 0;
const PASSIVE = 1;

const ACTIONS: EditorActionSpec[] = [
  { id: "in", label: "In range", color: "var(--interactive-accent)" },
  { id: "out", label: "Not in range", color: "var(--spotlab-hm-cell-bg)" },
];
const ORDER = [IN_RANGE];

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : String(e);

type Parsed<T> = { ok: true; value: T } | { ok: false; message: string };

const attempt = <T,>(fn: () => T): Parsed<T> => {
  try {
    return { ok: true, value: fn() };
  } catch (e) {
    return { ok: false, message: errorMessage(e) };
  }
};

export type RangeBlockProps = {
  source: string;
  /** Persist a new block body into the note. Rejects if the write failed. */
  onSave: (body: string) => Promise<void>;
};

export const RangeBlock = ({ source, onSave }: RangeBlockProps) => {
  const spec = useMemo(
    () => attempt(() => parseSpec(source, parseYaml)),
    [source],
  );
  if (!spec.ok) return <ErrorView message={spec.message} />;
  return spec.value.kind === "multi" ? (
    <MultiRangeBlock spec={spec.value} onSave={onSave} />
  ) : (
    <SingleRangeBlock spec={spec.value} onSave={onSave} />
  );
};

type SingleRangeBlockProps = {
  spec: Extract<BlockSpec, { kind: "single" }>;
  onSave: (body: string) => Promise<void>;
};

const SingleRangeBlock = ({ spec, onSave }: SingleRangeBlockProps) => {
  // rangeToMatrix makes wasm calls, so build the grid once per range.
  const parsed = useMemo(
    () =>
      attempt(() => {
        const hands = parseRange(spec.source);
        const matrix = rangeToMatrix(hands, {
          color: "var(--interactive-accent)",
        });
        return { hands, matrix };
      }),
    [spec],
  );
  const [editing, setEditing] = useState(false);

  if (!parsed.ok) return <ErrorView message={parsed.message} />;
  const { hands, matrix } = parsed.value;

  if (editing) {
    return (
      <SingleRangeEditor
        hands={hands}
        onCancel={() => setEditing(false)}
        onSave={async range => {
          await onSave(range);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <div className="pkr-range">
      <div className="pkr-range-header">
        <span className="pkr-range-title">
          {formatCombos(countCombos(hands))}
        </span>
        <button className="pkr-range-button" onClick={() => setEditing(true)}>
          Edit
        </button>
      </div>
      <RangeMatrix {...matrix} />
    </div>
  );
};

type SingleRangeEditorProps = {
  hands: HandFrequency[];
  onCancel: () => void;
  onSave: (range: string) => Promise<void>;
};

const SingleRangeEditor = ({
  hands,
  onCancel,
  onSave,
}: SingleRangeEditorProps) => {
  const seed = useMemo(
    () => seedCells(null, [toComboWeights(hands), null], PASSIVE),
    [hands],
  );
  const [cells, setCells] = useState(seed);
  const [brush, setBrush] = useState([100, 0]);
  const [tool, setTool] = useState<PaintTool>("brush");
  // Combos the user didn't touch keep their original hands verbatim (e.g.
  // `AhKh:0.7` survives an edit elsewhere).
  const { saving, error, save } = useSave(() =>
    cellsChanged(cells, seed)
      ? onSave(formatRange(cellsToRanges([hands, null], seed, cells)[IN_RANGE]))
      : Promise.resolve(onCancel()),
  );

  return (
    <div className="pkr-range pkr-range-editing">
      <EditorToolbar
        tool={tool}
        saving={saving}
        onToolChange={setTool}
        onClear={() =>
          setCells(
            cells.map(cell => ({ avail: cell.avail, weights: [0, 100] })),
          )
        }
        onCancel={onCancel}
        onSave={() => void save()}
      />
      {error && <div className="pkr-range-error-message">{error}</div>}
      <RangeMatrixEditor
        cells={cells}
        actions={ACTIONS}
        order={ORDER}
        brush={brush}
        tool={tool}
        onCellsChange={setCells}
        onBrushChange={setBrush}
        onToolChange={setTool}
      />
      <ActionWeightSliders
        actions={ACTIONS}
        order={ORDER}
        weights={brush}
        passive={PASSIVE}
        onWeightsChange={setBrush}
      />
    </div>
  );
};
