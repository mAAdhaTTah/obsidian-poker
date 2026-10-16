import { useMemo, useState } from "react";
import {
  COMBOS,
  formatRange,
  handsOfCombo,
  parseRange,
  toComboWeights,
  type HandFrequency,
} from "@spotlab/range";
import {
  ActionWeightSliders,
  RangeGrid,
  RangeMatrixEditor,
  seedCells,
  type EditorActionSpec,
  type EditorCell,
  type PaintTool,
} from "@spotlab/hand-matrix";

/** Total number of starting hands in hold'em, for the combo-count summary. */
const TOTAL_HANDS = 1326;

const IN_RANGE = 0;
const PASSIVE = 1;

const ACTIONS: EditorActionSpec[] = [
  { id: "in", label: "In range", color: "var(--interactive-accent)" },
  { id: "out", label: "Not in range", color: "var(--spotlab-hm-cell-bg)" },
];
// The passive band must be drawn too: the editor's cell gradient doesn't
// close itself, so an unpainted remainder would bleed the in-range color.
const ORDER = [IN_RANGE, PASSIVE];

type Parsed =
  | { ok: true; hands: HandFrequency[] }
  | { ok: false; message: string };

const parse = (source: string): Parsed => {
  try {
    return { ok: true, hands: parseRange(source.trim()) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
};

const sameWeights = (a: EditorCell, b: EditorCell) =>
  a.avail === b.avail && a.weights.every((w, i) => w === b.weights[i]);

/**
 * Rebuild the range from the painted cells. The editor quantizes each combo
 * to a whole percent and can't represent suit-specific hands, so only combos
 * the user actually changed are re-derived; every untouched combo keeps its
 * original hands verbatim (e.g. `AhKh:0.7` survives an edit elsewhere).
 */
const toRange = (
  original: HandFrequency[],
  seed: EditorCell[],
  cells: EditorCell[],
): string => {
  const byCombo = new Map<string, HandFrequency[]>();
  const comboOf = new Map<string, string>();
  for (const combo of COMBOS) {
    for (const hand of handsOfCombo(combo)) comboOf.set(hand, combo);
  }
  for (const hf of original) {
    const combo = comboOf.get(hf.hand);
    if (!combo) continue;
    const list = byCombo.get(combo) ?? [];
    list.push(hf);
    byCombo.set(combo, list);
  }

  const hands: HandFrequency[] = [];
  cells.forEach((cell, i) => {
    const combo = COMBOS[i];
    if (sameWeights(cell, seed[i])) {
      hands.push(...(byCombo.get(combo) ?? []));
      return;
    }
    const frequency = (cell.weights[IN_RANGE] / 100) * cell.avail;
    if (frequency <= 0) return;
    for (const hand of handsOfCombo(combo)) hands.push({ hand, frequency });
  });
  return formatRange(hands);
};

const summarize = (hands: HandFrequency[]) => {
  const combos = hands.reduce((sum, hf) => sum + hf.frequency, 0);
  const pct = (combos / TOTAL_HANDS) * 100;
  return `${+combos.toFixed(2)} combos · ${pct.toFixed(1)}%`;
};

export type RangeBlockProps = {
  source: string;
  /** Persist a new range string into the note. Rejects if the write failed. */
  onSave: (range: string) => Promise<void>;
};

export const RangeBlock = ({ source, onSave }: RangeBlockProps) => {
  const parsed = useMemo(() => parse(source), [source]);
  const [editing, setEditing] = useState(false);

  if (!parsed.ok) {
    return (
      <div className="pkr-range pkr-range-error">
        <div className="pkr-range-header">
          <span className="pkr-range-title">Invalid range</span>
        </div>
        <pre className="pkr-range-error-message">{parsed.message}</pre>
      </div>
    );
  }

  if (editing) {
    return (
      <RangeEditor
        hands={parsed.hands}
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
        <span className="pkr-range-title">{summarize(parsed.hands)}</span>
        <button className="pkr-range-button" onClick={() => setEditing(true)}>
          Edit
        </button>
      </div>
      <RangeGrid range={parsed.hands} fill="var(--interactive-accent)" />
    </div>
  );
};

type RangeEditorProps = {
  hands: HandFrequency[];
  onCancel: () => void;
  onSave: (range: string) => Promise<void>;
};

const RangeEditor = ({ hands, onCancel, onSave }: RangeEditorProps) => {
  const seed = useMemo(
    () => seedCells(null, [toComboWeights(hands), null], PASSIVE),
    [hands],
  );
  const [cells, setCells] = useState(seed);
  const [brush, setBrush] = useState([100, 0]);
  const [tool, setTool] = useState<PaintTool>("brush");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = cells.some((cell, i) => !sameWeights(cell, seed[i]));

  const save = async () => {
    if (!dirty) return onCancel();
    setSaving(true);
    setError(null);
    try {
      await onSave(toRange(hands, seed, cells));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };

  const clear = () =>
    setCells(cells.map(cell => ({ avail: cell.avail, weights: [0, 100] })));

  return (
    <div className="pkr-range pkr-range-editing">
      <div className="pkr-range-header">
        <div className="pkr-range-tools" role="group" aria-label="Tool">
          <button
            className="pkr-range-button"
            aria-pressed={tool === "brush"}
            onClick={() => setTool("brush")}
          >
            Brush
          </button>
          <button
            className="pkr-range-button"
            aria-pressed={tool === "eyedropper"}
            onClick={() => setTool("eyedropper")}
          >
            Eyedropper
          </button>
          <button className="pkr-range-button" onClick={clear}>
            Clear
          </button>
        </div>
        <div className="pkr-range-actions">
          <button
            className="pkr-range-button"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="pkr-range-button mod-cta"
            onClick={save}
            disabled={saving}
          >
            Save
          </button>
        </div>
      </div>
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
