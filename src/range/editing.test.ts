import { describe, expect, it } from "vitest";
import { describeError } from "./editing";
import { SpecError } from "./spec";

describe("describeError", () => {
  it("shows a plain error's message", () => {
    expect(describeError(new Error("Nope"))).toBe("Nope");
  });

  it("follows the cause chain", () => {
    const parser = new Error("unknown combo `ZZ`");
    const error = new SpecError("Call", { cause: parser });
    expect(describeError(error)).toBe("Call: unknown combo `ZZ`");
  });

  it("stringifies values that aren't errors", () => {
    expect(describeError("boom")).toBe("boom");
    expect(describeError(new SpecError("Call", { cause: "boom" }))).toBe(
      "Call: boom",
    );
  });
});
