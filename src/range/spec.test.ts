import { beforeAll, describe, expect, it } from "vitest";
import { parse, stringify } from "yaml";
import { initRange } from "@spotlab/range";
import { dedent } from "../test-utils";
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
    const result = multi(dedent`
      Raise 2.5bb:
        range: QQ+,AKs,AQs:0.5
        color: red
      Call: JJ-99,AQs:0.5,AJs
      Fold:
      dead: 22-55
    `);
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
    const result = multi(dedent`
      Raise: QQ+
      Fold:
        color: blue
    `);
    expect(result.actions[1]).toEqual({
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
    [
      dedent`
        Raise:
          range: QQ+
          size: 2.5
      `,
      /unknown setting `size`/,
    ],
    [
      dedent`
        Raise:
          range: 5
      `,
      /`range` must be a range string/,
    ],
    [
      dedent`
        Raise:
          range: QQ+
          color: 5
      `,
      /`color` must be a string/,
    ],
    [
      dedent`
        Raise: QQ+
        Call:
        Fold:
      `,
      /Only one action can be left empty/,
    ],
    ["dead: 22-55", /at least one action/],
    [
      dedent`
        Raise: QQ+
        dead: [22]
      `,
      /`dead` must be a range string/,
    ],
    [
      dedent`
        Raise: QQ+
        parent: AA
      `,
      /`parent` isn't supported yet/,
    ],
    [
      dedent`
        Raise: QQ+
          bad: indent
      `,
      /Couldn't read this block as YAML/,
    ],
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
    const parsed = parseRanges(
      multi(dedent`
        Raise: AKs:0.5
        Fold:
        dead: AKs:0.5
      `),
    );
    expect(parsed.actions[0].hands).toHaveLength(4);
    expect(parsed.actions[1].hands).toBeNull();
    expect(parsed.dead).toHaveLength(4);
  });

  it("allows actions and dead to fill a hand exactly", () => {
    const source = dedent`
      Raise: AKs:0.5
      Call: AKs:0.25
      dead: AKs:0.25
    `;
    expect(() => parseRanges(multi(source))).not.toThrow();
  });

  it("rejects hands whose actions and dead add up to more than 1", () => {
    const source = dedent`
      Raise: AKs:0.5
      Call: AKs:0.25
      dead: AKs:0.5
    `;
    expect(() => parseRanges(multi(source))).toThrow(/AhKh \(1\.25\)/);
  });

  it("lists at most five hands that go over", () => {
    const source = dedent`
      Raise: AKo
      Call: AKo
    `;
    expect(() => parseRanges(multi(source))).toThrow(/and 7 more\.$/);
  });

  it("names the action whose range is invalid", () => {
    const badCall = dedent`
      Raise: QQ+
      Call: ZZ
    `;
    const badDead = dedent`
      Raise: QQ+
      dead: ZZ
    `;
    expect(() => parseRanges(multi(badCall))).toThrow(/^Call: /);
    expect(() => parseRanges(multi(badDead))).toThrow(/^dead: /);
  });
});

describe("stringifySpec", () => {
  const roundTrip = (source: string) => stringifySpec(multi(source), stringify);

  it("keeps key order and each action's form", () => {
    const source = dedent`
      Raise 2.5bb:
        range: QQ+,AKs,AQs:0.5
        color: red
      Call: JJ-99,AQs:0.5,AJs
      dead: 22-55
      Fold:
    `;
    expect(roundTrip(source)).toBe(source);
  });

  it("quotes values YAML would otherwise misread", () => {
    const out = roundTrip(dedent`
      Raise:
        range: QQ+
        color: "#e5484d"
    `);
    expect(out).toContain('color: "#e5484d"');
    expect(multi(out).actions[0].color).toBe("#e5484d");
  });

  it("writes updated ranges", () => {
    const spec: BlockSpec = multi(dedent`
      Raise: QQ+
      Call: JJ
    `);
    if (spec.kind !== "multi") throw new Error();
    spec.actions[0].range = "KK+";
    expect(stringifySpec(spec, stringify)).toBe(dedent`
      Raise: KK+
      Call: JJ
    `);
  });
});

describe("colors", () => {
  it.each([
    ["red", "var(--color-red)"],
    ["--interactive-accent", "var(--interactive-accent)"],
    ["#abc", "#abc"],
    ["rgb(1, 2, 3)", "rgb(1, 2, 3)"],
  ])("resolves %j to %j", (color, css) => {
    expect(resolveColor(color)).toBe(css);
  });

  it("skips palette colors the block already names", () => {
    const source = dedent`
      Raise:
        range: QQ+
        color: red
      Call: JJ
      Fold:
    `;
    expect(resolveColors(multi(source).actions)).toEqual([
      "var(--color-red)",
      "var(--color-green)",
      "var(--color-blue)",
    ]);
  });

  it("reuses the palette once every color is named", () => {
    const source = dedent`
      A0: { range: AA, color: red }
      A1: { range: AA, color: green }
      A2: { range: AA, color: blue }
      A3: { range: AA, color: orange }
      A4: { range: AA, color: purple }
      A5: { range: AA, color: cyan }
      A6: { range: AA, color: yellow }
      A7: { range: AA, color: pink }
      Rest:
    `;
    const colors = resolveColors(multi(source).actions);
    expect(colors[colors.length - 1]).toBe("var(--color-red)");
  });

  it("hands out palette colors in order to actions without one", () => {
    const source = dedent`
      A: AA
      B:
        range: KK
        color: pink
      C: QQ
    `;
    expect(resolveColors(multi(source).actions)).toEqual([
      "var(--color-red)",
      "var(--color-pink)",
      "var(--color-green)",
    ]);
  });
});
