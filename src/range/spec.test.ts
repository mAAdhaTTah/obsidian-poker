import { beforeAll, describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import { initRange } from "@spotlab/range";
import {
  parseRanges,
  parseSpec,
  resolveColor,
  resolveColors,
  SpecError,
  stringifySpec,
  type BlockSpec,
} from "./spec";

// Obsidian's parseYaml/stringifyYaml are backed by the same `yaml` library.
const spec = (source: string) => parseSpec(source, parse);
const multi = (source: string) => {
  const result = spec(source);
  if (result.kind !== "multi") throw new Error("expected a multi-action block");
  return result;
};

beforeAll(async () => {
  await initRange();
});

describe("parseSpec", () => {
  it.each([
    "",
    "AA,KK,QQ",
    "AA:0.5",
    "AhKh,AsKs:0.5,QQ",
    "22+, A2s+",
    "AA,KK,ZZ",
  ])("treats %j as a single range", source => {
    expect(spec(source)).toEqual({ kind: "single", source });
  });

  it("reads short and long actions in order", () => {
    const result = multi(
      [
        "Raise 2.5bb:",
        "  range: QQ+,AKs,AQs:0.5",
        "  color: red",
        "Call: JJ-99,AQs:0.5,AJs",
        "Fold:",
        "dead: 22-55",
      ].join("\n"),
    );
    expect(result.actions).toEqual([
      {
        name: "Raise 2.5bb",
        range: "QQ+,AKs,AQs:0.5",
        color: "red",
        long: true,
      },
      { name: "Call", range: "JJ-99,AQs:0.5,AJs", color: null, long: false },
      { name: "Fold", range: null, color: null, long: false },
    ]);
    expect(result.dead).toBe("22-55");
    expect(result.keys).toEqual(["Raise 2.5bb", "Call", "Fold", "dead"]);
  });

  it.each([
    "Raise to 2.5x",
    "3bet",
    "3-bet 9bb",
    "All-in",
    "Bet 50%",
    "Call (1/3 pot)",
    "Limp/Call",
    "Check-raise",
  ])("accepts %j as an action name", name => {
    expect(multi(`${name}: QQ+`).actions[0].name).toBe(name);
  });

  it("accepts a long-form remainder with only a color", () => {
    expect(multi("Raise: QQ+\nFold:\n  color: blue").actions[1]).toEqual({
      name: "Fold",
      range: null,
      color: "blue",
      long: true,
    });
  });

  it("keeps an empty range string as an action, not the remainder", () => {
    expect(multi('Raise: ""').actions[0].range).toBe("");
  });

  it.each([
    ["Raise: [QQ, KK]", /must be a range string/],
    ["Raise:\n  range: QQ+\n  size: 2.5", /unknown setting `size`/],
    ["Raise:\n  range: 5", /`range` must be a range string/],
    ["Raise:\n  range: QQ+\n  color: 5", /`color` must be a string/],
    ["Raise: QQ+\nCall:\nFold:", /Only one action can be left empty/],
    ["dead: 22-55", /at least one action/],
    ["Raise: QQ+\ndead: [22]", /`dead` must be a range string/],
    ["Raise: QQ+\nparent: AA", /`parent` isn't supported yet/],
    ["Raise: QQ+\n  bad: indent", /Couldn't read this block as YAML/],
  ])("rejects %j", (source, message) => {
    expect(() => spec(source)).toThrow(SpecError);
    expect(() => spec(source)).toThrow(message);
  });

  it("explains the `AA: 0.5` space trap", () => {
    expect(() => spec("AA: 0.5")).toThrow(
      /If you meant the range `AA:0.5`, remove the space after the colon/,
    );
  });
});

describe("parseRanges", () => {
  it("parses every action and dead", () => {
    const parsed = parseRanges(multi("Raise: AKs:0.5\nFold:\ndead: AKs:0.5"));
    expect(parsed.actions[0].hands).toHaveLength(4);
    expect(parsed.actions[1].hands).toBeNull();
    expect(parsed.dead).toHaveLength(4);
  });

  it("allows actions and dead to fill a hand exactly", () => {
    expect(() =>
      parseRanges(multi("Raise: AKs:0.5\nCall: AKs:0.25\ndead: AKs:0.25")),
    ).not.toThrow();
  });

  it("rejects hands whose actions and dead add up to more than 1", () => {
    expect(() =>
      parseRanges(multi("Raise: AKs:0.5\nCall: AKs:0.25\ndead: AKs:0.5")),
    ).toThrow(/AhKh \(1\.25\)/);
  });

  it("lists at most five hands that go over", () => {
    expect(() => parseRanges(multi("Raise: AKo\nCall: AKo"))).toThrow(
      /and 7 more\.$/,
    );
  });

  it("names the action whose range is invalid", () => {
    expect(() => parseRanges(multi("Raise: QQ+\nCall: ZZ"))).toThrow(/^Call: /);
    expect(() => parseRanges(multi("Raise: QQ+\ndead: ZZ"))).toThrow(/^dead: /);
  });
});

describe("stringifySpec", () => {
  const roundTrip = (source: string) => stringifySpec(multi(source), stringify);

  it("keeps key order and each action's form", () => {
    const source = [
      "Raise 2.5bb:",
      "  range: QQ+,AKs,AQs:0.5",
      "  color: red",
      "Call: JJ-99,AQs:0.5,AJs",
      "dead: 22-55",
      "Fold:",
    ].join("\n");
    expect(roundTrip(source)).toBe(source);
  });

  it("quotes values YAML would otherwise misread", () => {
    const out = roundTrip('Raise:\n  range: QQ+\n  color: "#e5484d"');
    expect(out).toContain('color: "#e5484d"');
    expect(multi(out).actions[0].color).toBe("#e5484d");
  });

  it("writes updated ranges", () => {
    const spec: BlockSpec = multi("Raise: QQ+\nCall: JJ");
    if (spec.kind !== "multi") throw new Error();
    spec.actions[0].range = "KK+";
    expect(stringifySpec(spec, stringify)).toBe("Raise: KK+\nCall: JJ");
  });
});

describe("colors", () => {
  it.each([
    ["red", "var(--color-red)"],
    ["--interactive-accent", "var(--interactive-accent)"],
    ["#abc", "#abc"],
    ["rgb(1, 2, 3)", "rgb(1, 2, 3)"],
  ])("resolves %j to %j", (color, css) => {
    expect(resolveColor(color, 0)).toBe(css);
  });

  it("hands out palette colors in order to actions without one", () => {
    expect(
      resolveColors(
        multi("A: AA\nB:\n  range: KK\n  color: pink\nC: QQ").actions,
      ),
    ).toEqual(["var(--color-red)", "var(--color-pink)", "var(--color-green)"]);
  });
});
