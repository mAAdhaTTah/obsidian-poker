import { MarkdownRenderChild } from "obsidian";
import { createRoot, type Root } from "react-dom/client";
import { RangeBlock } from "./range-block";

/**
 * Owns one React root per rendered range block. Obsidian unloads the child
 * whenever the block re-renders or the view closes, so the root is torn down
 * with it rather than leaking.
 */
export class RangeRenderChild extends MarkdownRenderChild {
  private root: Root | null = null;
  private unloaded = false;

  constructor(
    containerEl: HTMLElement,
    private source: string,
    private ready: Promise<void>,
    private save: (range: string) => Promise<void>,
  ) {
    super(containerEl);
  }

  async onload() {
    this.containerEl.addClass("pkr-range-container");
    try {
      await this.ready;
    } catch (e) {
      this.containerEl.createDiv({
        cls: "pkr-range pkr-range-error",
        text: `Poker: failed to load range parser (${e})`,
      });
      return;
    }
    // Unloaded while waiting on the wasm init.
    if (this.unloaded) return;
    this.root = createRoot(this.containerEl);
    this.root.render(<RangeBlock source={this.source} onSave={this.save} />);
  }

  onunload() {
    this.unloaded = true;
    this.root?.unmount();
    this.root = null;
  }
}
