import { useState } from "react";
import type { HandFrequency } from "@spotlab/range";
import type { EditorCell, PaintTool } from "@spotlab/hand-matrix";

/** An error's message followed by each of its causes', for display. */
export function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  return error.cause === undefined
    ? error.message
    : `${error.message}: ${describeError(error.cause)}`;
}

/** Total number of starting hands in hold'em, for combo-count summaries. */
export const TOTAL_HANDS = 1326;

/** "N combos · X%" for a total number of combos. */
export const formatCombos = (combos: number) =>
  `${+combos.toFixed(2)} combos · ${((combos / TOTAL_HANDS) * 100).toFixed(
    1,
  )}%`;

export const countCombos = (hands: HandFrequency[]) =>
  hands.reduce((sum, hf) => sum + hf.frequency, 0);

const sameCell = (a: EditorCell, b: EditorCell) =>
  a.avail === b.avail && a.weights.every((w, i) => w === b.weights[i]);

export const cellsChanged = (cells: EditorCell[], seed: EditorCell[]) =>
  cells.some((cell, i) => !sameCell(cell, seed[i]));

/**
 * Save state for an editor: `save` runs `write` and surfaces its error inline.
 * The editor is swapped out by the parent on success, so `saving` only resets
 * on failure.
 */
export function useSave(write: () => Promise<void>) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await write();
    } catch (e) {
      setError(describeError(e));
      setSaving(false);
    }
  };
  return { saving, error, save };
}

export type EditorToolbarProps = {
  tool: PaintTool;
  saving: boolean;
  onToolChange: (tool: PaintTool) => void;
  onClear: () => void;
  onCancel: () => void;
  onSave: () => void;
};

/** Paint tools on the left, Cancel/Save on the right, shared by both editors. */
export const EditorToolbar = ({
  tool,
  saving,
  onToolChange,
  onClear,
  onCancel,
  onSave,
}: EditorToolbarProps) => (
  <div className="pkr-range-header">
    <div className="pkr-range-tools" role="group" aria-label="Tool">
      <button
        className="pkr-range-button"
        aria-pressed={tool === "brush"}
        onClick={() => onToolChange("brush")}
      >
        Brush
      </button>
      <button
        className="pkr-range-button"
        aria-pressed={tool === "eyedropper"}
        onClick={() => onToolChange("eyedropper")}
      >
        Eyedropper
      </button>
      <button className="pkr-range-button" onClick={onClear}>
        Clear
      </button>
    </div>
    <div className="pkr-range-actions">
      <button className="pkr-range-button" onClick={onCancel} disabled={saving}>
        Cancel
      </button>
      <button
        className="pkr-range-button mod-cta"
        onClick={onSave}
        disabled={saving}
      >
        Save
      </button>
    </div>
  </div>
);

export const ErrorView = ({ message }: { message: string }) => (
  <div className="pkr-range pkr-range-error">
    <div className="pkr-range-header">
      <span className="pkr-range-title">Invalid range</span>
    </div>
    <pre className="pkr-range-error-message">{message}</pre>
  </div>
);

export type LegendEntry = {
  label: string;
  /** Swatch color; `null` draws the dead-hand hatch instead. */
  color: string | null;
  combos: number;
};

/** Swatch, label and combo count per entry, laid out in aligned columns. */
export const Legend = ({ entries }: { entries: LegendEntry[] }) => (
  <div className="pkr-range-legend" role="list">
    {entries.map(entry => (
      <div key={entry.label} className="pkr-range-legend-item" role="listitem">
        <span
          className={
            entry.color === null
              ? "pkr-range-swatch mod-dead"
              : "pkr-range-swatch"
          }
          style={entry.color === null ? undefined : { background: entry.color }}
        />
        <span className="pkr-range-legend-label">{entry.label}</span>
        <span className="pkr-range-legend-count">
          {formatCombos(entry.combos)}
        </span>
      </div>
    ))}
  </div>
);
