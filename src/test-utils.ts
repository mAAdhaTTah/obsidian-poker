/**
 * Template tag for multi-line test fixtures: drops the leading and trailing
 * blank lines and the indentation common to every line, so a block can be
 * written indented alongside the test code.
 */
export function dedent(strings: TemplateStringsArray, ...values: unknown[]) {
  const text = strings.reduce(
    (out, part, i) => out + part + (i < values.length ? String(values[i]) : ""),
    "",
  );
  const lines = text
    .replace(/^[ \t]*\n/, "")
    .replace(/\n[ \t]*$/, "")
    .split("\n");
  const indent = Math.min(
    ...lines
      .filter(line => line.trim())
      .map(line => line.length - line.trimStart().length),
  );
  return lines.map(line => line.slice(indent)).join("\n");
}
