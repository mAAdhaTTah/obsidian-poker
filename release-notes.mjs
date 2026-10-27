import { readFileSync } from "fs";

// print the CHANGELOG.md section for the given version, used as the GitHub release notes
const [version] = process.argv.slice(2);

if (!version) {
  console.error("Usage: node release-notes.mjs <version>");
  process.exit(1);
}

const lines = readFileSync("CHANGELOG.md", "utf8").split("\n");
const start = lines.findIndex(line => line.trim() === `## ${version}`);

if (start === -1) {
  console.error(`CHANGELOG.md has no section for ${version}`);
  process.exit(1);
}

let end = lines.findIndex(
  (line, index) => index > start && /^## \d/.test(line),
);
if (end === -1) end = lines.length;

process.stdout.write(
  `${lines
    .slice(start + 1, end)
    .join("\n")
    .trim()}\n`,
);
