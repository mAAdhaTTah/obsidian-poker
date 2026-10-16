import {
  App,
  EditorPosition,
  MarkdownPostProcessorContext,
  MarkdownView,
  TFile,
} from "obsidian";

const FENCE = /^\s*(`{3,}|~{3,})\s*(\S+)/;

/**
 * Replace the body of the fenced code block that rendered into `el` with
 * `body`. Writes through an open source/live-preview editor when there is one
 * (a single undoable change that leaves the cursor alone), otherwise through
 * `vault.process`. Throws if the block can't be located or has changed since
 * it was rendered.
 */
export async function replaceCodeBlockBody(
  app: App,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
  language: string,
  source: string,
  body: string,
): Promise<void> {
  const info = ctx.getSectionInfo(el);
  if (!info) throw new Error("Couldn't locate this block in the note.");
  // `lineStart` is the opening fence, `lineEnd` the closing fence.
  const { lineStart, lineEnd } = info;

  const file = app.vault.getAbstractFileByPath(ctx.sourcePath);
  if (!(file instanceof TFile)) {
    throw new Error(`Couldn't find ${ctx.sourcePath}.`);
  }

  const assertUnchanged = (lines: string[]) => {
    const open = FENCE.exec(lines[lineStart] ?? "");
    const current = lines.slice(lineStart + 1, lineEnd).join("\n");
    if (!open || open[2] !== language || current.trim() !== source.trim()) {
      throw new Error("This block changed since it was rendered; try again.");
    }
  };

  const view = app.workspace
    .getLeavesOfType("markdown")
    .map(leaf => leaf.view)
    .find(
      (v): v is MarkdownView =>
        v instanceof MarkdownView &&
        v.file?.path === file.path &&
        v.getMode() === "source",
    );

  if (view) {
    const { editor } = view;
    assertUnchanged(editor.getValue().split("\n"));
    // Swap whole body lines (newline included) so the edit is one undo step
    // and a cursor outside the block stays put.
    const from: EditorPosition = { line: lineStart + 1, ch: 0 };
    const to: EditorPosition = { line: lineEnd, ch: 0 };
    editor.replaceRange(body ? `${body}\n` : "", from, to);
    return;
  }

  await app.vault.process(file, data => {
    const lines = data.split("\n");
    assertUnchanged(lines);
    lines.splice(
      lineStart + 1,
      lineEnd - lineStart - 1,
      ...(body ? [body] : []),
    );
    return lines.join("\n");
  });
}
