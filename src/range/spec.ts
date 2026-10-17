import { parseRange, type HandFrequency } from "@spotlab/range";

/**
 * A `pkr-range` block body. A YAML mapping is a multi-action block; anything
 * else is a single range string, as before multi-action support.
 */
export type BlockSpec =
  | { kind: "single"; source: string }
  | {
      kind: "multi";
      actions: ActionSpec[];
      dead: string | null;
      keys: string[];
    };

export type ActionSpec = {
  name: string;
  /** `null` marks the remainder: whatever no other action covers. */
  range: string | null;
  color: string | null;
  /** Written in the long `{range, color}` form rather than `name: range`. */
  long: boolean;
};

/** A multi-action block with every range parsed and validated. */
export type ParsedBlock = {
  actions: (ActionSpec & { hands: HandFrequency[] | null })[];
  dead: HandFrequency[] | null;
};

type YamlParse = (source: string) => unknown;
type YamlStringify = (value: unknown) => string;

const LONG_KEYS = new Set(["range", "color"]);

export class SpecError extends Error {}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function parseSpec(source: string, parseYaml: YamlParse): BlockSpec {
  const trimmed = source.trim();
  if (!trimmed) return { kind: "single", source: trimmed };

  let data: unknown;
  try {
    data = parseYaml(trimmed);
  } catch (e) {
    throw new SpecError(
      `Couldn't read this block as YAML: ${
        e instanceof Error ? e.message : String(e)
      }`,
    );
  }
  if (!isPlainObject(data)) return { kind: "single", source: trimmed };

  const actions: ActionSpec[] = [];
  let dead: string | null = null;
  for (const [name, value] of Object.entries(data)) {
    if (name === "parent") {
      throw new SpecError("`parent` isn't supported yet.");
    }
    if (name === "dead") {
      if (value !== null && typeof value !== "string") {
        throw new SpecError("`dead` must be a range string.");
      }
      dead = value;
      continue;
    }
    actions.push(parseAction(name, value));
  }

  if (actions.length === 0) {
    throw new SpecError("Add at least one action, e.g. `Raise: QQ+,AKs`.");
  }
  if (actions.filter(a => a.range === null).length > 1) {
    throw new SpecError(
      "Only one action can be left empty to stand for the rest of the range.",
    );
  }
  return { kind: "multi", actions, dead, keys: Object.keys(data) };
}

function parseAction(name: string, value: unknown): ActionSpec {
  if (value === null) return { name, range: null, color: null, long: false };
  if (typeof value === "string") {
    return { name, range: value, color: null, long: false };
  }
  if (typeof value === "number") {
    throw new SpecError(
      `"${name}" has a number, not a range. If you meant the range \`${name}:${value}\`, remove the space after the colon.`,
    );
  }
  if (!isPlainObject(value)) {
    throw new SpecError(
      `"${name}" must be a range string or have a \`range\`.`,
    );
  }
  for (const key of Object.keys(value)) {
    if (!LONG_KEYS.has(key)) {
      throw new SpecError(`"${name}" has an unknown setting \`${key}\`.`);
    }
  }
  const { range = null, color = null } = value;
  if (range !== null && typeof range !== "string") {
    throw new SpecError(`"${name}": \`range\` must be a range string.`);
  }
  if (color !== null && typeof color !== "string") {
    throw new SpecError(`"${name}": \`color\` must be a string.`);
  }
  return { name, range, color, long: true };
}

/** Floating-point slack when checking that a hand's shares sum to at most 1. */
const EPSILON = 1e-9;
const MAX_LISTED = 5;

/**
 * Parse every range in a multi-action spec and check that, for each hand, the
 * actions plus `dead` sum to at most 1.
 */
export function parseRanges(
  spec: Extract<BlockSpec, { kind: "multi" }>,
): ParsedBlock {
  const parse = (label: string, range: string) => {
    try {
      return parseRange(range.trim());
    } catch (e) {
      throw new SpecError(
        `${label}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  const dead = spec.dead ? parse("dead", spec.dead) : null;
  const actions = spec.actions.map(action => ({
    ...action,
    hands: action.range === null ? null : parse(action.name, action.range),
  }));

  const totals = new Map<string, number>();
  for (const hands of [dead, ...actions.map(a => a.hands)]) {
    for (const { hand, frequency } of hands ?? []) {
      totals.set(hand, (totals.get(hand) ?? 0) + frequency);
    }
  }
  const over = [...totals].filter(([, total]) => total > 1 + EPSILON);
  if (over.length > 0) {
    const listed = over
      .slice(0, MAX_LISTED)
      .map(([hand, total]) => `${hand} (${+total.toFixed(3)})`)
      .join(", ");
    const more =
      over.length > MAX_LISTED ? ` and ${over.length - MAX_LISTED} more` : "";
    throw new SpecError(
      `These hands add up to more than 1 across actions and dead: ${listed}${more}.`,
    );
  }
  return { actions, dead };
}

/**
 * Write a multi-action spec back out, keeping each key's original position
 * and each action's short or long form.
 */
export function stringifySpec(
  spec: Extract<BlockSpec, { kind: "multi" }>,
  stringifyYaml: YamlStringify,
): string {
  const byName = new Map(spec.actions.map(a => [a.name, a]));
  const data: Record<string, unknown> = {};
  for (const key of spec.keys) {
    if (key === "dead") {
      data.dead = spec.dead;
      continue;
    }
    const action = byName.get(key);
    if (!action) continue;
    if (!action.long) {
      data[key] = action.range;
      continue;
    }
    const entry: Record<string, string> = {};
    if (action.range !== null) entry.range = action.range;
    if (action.color !== null) entry.color = action.color;
    data[key] = entry;
  }
  // An empty value marks the remainder; write it as `Fold:`, not `Fold: null`.
  return stringifyYaml(data)
    .replace(/: null$/gm, ":")
    .replace(/\s+$/, "");
}

/** Obsidian's palette, in the order actions without a color receive them. */
export const PALETTE = [
  "red",
  "green",
  "blue",
  "orange",
  "purple",
  "cyan",
  "yellow",
  "pink",
] as const;

const PALETTE_NAMES = new Set<string>(PALETTE);

/**
 * Resolve a configured color to CSS. Palette names map to Obsidian's
 * `--color-*` variables and `--x` to `var(--x)`; anything else is used as-is.
 */
export function resolveColor(
  color: string | null,
  fallbackIndex: number,
): string {
  if (color === null) {
    return `var(--color-${PALETTE[fallbackIndex % PALETTE.length]})`;
  }
  const value = color.trim();
  if (PALETTE_NAMES.has(value)) return `var(--color-${value})`;
  if (value.startsWith("--")) return `var(${value})`;
  return value;
}

/** Resolve every action's color, handing out palette colors in order. */
export function resolveColors(actions: ActionSpec[]): string[] {
  let next = 0;
  return actions.map(action =>
    resolveColor(action.color, action.color === null ? next++ : 0),
  );
}
