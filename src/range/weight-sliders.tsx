import type { CSSProperties } from "react";
import type { EditorActionSpec } from "@spotlab/hand-matrix";
import { rebalanceRemainderFirst } from "./rebalance";

export type WeightSlidersProps = {
  actions: EditorActionSpec[];
  /** Indices into `actions`/`weights`, in the order rows render. */
  order: number[];
  /** The brush: each action's share, index-aligned with `actions`. */
  weights: number[];
  passive: number;
  onWeightsChange: (weights: number[]) => void;
};

/**
 * One slider and number input per action for mixing the brush. Changes come
 * out of the remainder first, so actions don't pull each other down until
 * together they'd pass 100.
 */
export const WeightSliders = ({
  actions,
  order,
  weights,
  passive,
  onWeightsChange,
}: WeightSlidersProps) => {
  const set = (index: number, value: number) => {
    if (Number.isNaN(value)) return;
    onWeightsChange(rebalanceRemainderFirst(weights, index, value, passive));
  };
  return (
    <div className="pkr-range-sliders">
      {order.map(i => (
        <label key={actions[i].id} className="pkr-range-slider">
          <span className="pkr-range-slider-label">
            <span
              className="pkr-range-swatch"
              style={{ background: actions[i].color }}
            />
            {actions[i].label}
            {i === passive && (
              <span className="pkr-range-slider-note">remainder</span>
            )}
          </span>
          <input
            type="range"
            className="slider"
            // Obsidian's .slider draws its fill from these variables.
            style={
              {
                "--slider-fill-ratio": weights[i] / 100,
                "--slider-fill-background": actions[i].color,
              } as CSSProperties
            }
            min={0}
            max={100}
            step={1}
            value={weights[i]}
            aria-label={`${actions[i].label} brush weight`}
            onChange={e => set(i, e.currentTarget.valueAsNumber)}
          />
          <input
            type="number"
            className="pkr-range-slider-value"
            min={0}
            max={100}
            step={1}
            value={weights[i]}
            aria-label={`${actions[i].label} brush weight`}
            onChange={e => set(i, e.currentTarget.valueAsNumber)}
          />
        </label>
      ))}
    </div>
  );
};
