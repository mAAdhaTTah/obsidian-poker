import { syntaxTree } from "@codemirror/language";
import { Range } from "@codemirror/state";
import {
  App,
  ButtonComponent,
  Editor,
  MarkdownPostProcessor,
  MarkdownRenderChild,
  Modal,
  Plugin,
  PluginSettingTab,
  Setting,
  TextComponent,
} from "obsidian";
import {
  ViewUpdate,
  PluginValue,
  EditorView,
  ViewPlugin,
  Decoration,
  WidgetType,
  DecorationSet,
} from "@codemirror/view";
import svgXc from "./cards/Xc.svg";
import svgXd from "./cards/Xd.svg";
import svgXh from "./cards/Xh.svg";
import svgXs from "./cards/Xs.svg";
import svgXx from "./cards/Xx.svg";
import svgAx from "./cards/Ax.svg";
import svgAc from "./cards/Ac.svg";
import svgAd from "./cards/Ad.svg";
import svgAh from "./cards/Ah.svg";
import svgAs from "./cards/As.svg";
import svgKx from "./cards/Kx.svg";
import svgKc from "./cards/Kc.svg";
import svgKd from "./cards/Kd.svg";
import svgKh from "./cards/Kh.svg";
import svgKs from "./cards/Ks.svg";
import svgQx from "./cards/Qx.svg";
import svgQc from "./cards/Qc.svg";
import svgQd from "./cards/Qd.svg";
import svgQh from "./cards/Qh.svg";
import svgQs from "./cards/Qs.svg";
import svgJx from "./cards/Jx.svg";
import svgJc from "./cards/Jc.svg";
import svgJd from "./cards/Jd.svg";
import svgJh from "./cards/Jh.svg";
import svgJs from "./cards/Js.svg";
import svgTx from "./cards/Tx.svg";
import svgTc from "./cards/Tc.svg";
import svgTd from "./cards/Td.svg";
import svgTh from "./cards/Th.svg";
import svgTs from "./cards/Ts.svg";
import svg9x from "./cards/9x.svg";
import svg9c from "./cards/9c.svg";
import svg9d from "./cards/9d.svg";
import svg9h from "./cards/9h.svg";
import svg9s from "./cards/9s.svg";
import svg8x from "./cards/8x.svg";
import svg8c from "./cards/8c.svg";
import svg8d from "./cards/8d.svg";
import svg8h from "./cards/8h.svg";
import svg8s from "./cards/8s.svg";
import svg7x from "./cards/7x.svg";
import svg7c from "./cards/7c.svg";
import svg7d from "./cards/7d.svg";
import svg7h from "./cards/7h.svg";
import svg7s from "./cards/7s.svg";
import svg6x from "./cards/6x.svg";
import svg6c from "./cards/6c.svg";
import svg6d from "./cards/6d.svg";
import svg6h from "./cards/6h.svg";
import svg6s from "./cards/6s.svg";
import svg5x from "./cards/5x.svg";
import svg5c from "./cards/5c.svg";
import svg5d from "./cards/5d.svg";
import svg5h from "./cards/5h.svg";
import svg5s from "./cards/5s.svg";
import svg4x from "./cards/4x.svg";
import svg4c from "./cards/4c.svg";
import svg4d from "./cards/4d.svg";
import svg4h from "./cards/4h.svg";
import svg4s from "./cards/4s.svg";
import svg3x from "./cards/3x.svg";
import svg3c from "./cards/3c.svg";
import svg3d from "./cards/3d.svg";
import svg3h from "./cards/3h.svg";
import svg3s from "./cards/3s.svg";
import svg2x from "./cards/2x.svg";
import svg2c from "./cards/2c.svg";
import svg2d from "./cards/2d.svg";
import svg2h from "./cards/2h.svg";
import svg2s from "./cards/2s.svg";

const CARDS = {
  Xc: svgXc,
  Xd: svgXd,
  Xh: svgXh,
  Xs: svgXs,
  Xx: svgXx,
  Ac: svgAc,
  Ad: svgAd,
  Ah: svgAh,
  As: svgAs,
  Ax: svgAx,
  Kc: svgKc,
  Kd: svgKd,
  Kh: svgKh,
  Ks: svgKs,
  Kx: svgKx,
  Qc: svgQc,
  Qd: svgQd,
  Qh: svgQh,
  Qs: svgQs,
  Qx: svgQx,
  Jc: svgJc,
  Jd: svgJd,
  Jh: svgJh,
  Js: svgJs,
  Jx: svgJx,
  Tc: svgTc,
  Td: svgTd,
  Th: svgTh,
  Ts: svgTs,
  Tx: svgTx,
  "9c": svg9c,
  "9d": svg9d,
  "9h": svg9h,
  "9s": svg9s,
  "9x": svg9x,
  "8c": svg8c,
  "8d": svg8d,
  "8h": svg8h,
  "8s": svg8s,
  "8x": svg8x,
  "7c": svg7c,
  "7d": svg7d,
  "7h": svg7h,
  "7s": svg7s,
  "7x": svg7x,
  "6c": svg6c,
  "6d": svg6d,
  "6h": svg6h,
  "6s": svg6s,
  "6x": svg6x,
  "5c": svg5c,
  "5d": svg5d,
  "5h": svg5h,
  "5s": svg5s,
  "5x": svg5x,
  "4c": svg4c,
  "4d": svg4d,
  "4h": svg4h,
  "4s": svg4s,
  "4x": svg4x,
  "3c": svg3c,
  "3d": svg3d,
  "3h": svg3h,
  "3s": svg3s,
  "3x": svg3x,
  "2c": svg2c,
  "2d": svg2d,
  "2h": svg2h,
  "2s": svg2s,
  "2x": svg2x,
} as const;

const CARD_REGEX = "([2-9TJQKAX][cdhsx])";

class Deck {
  cards: Array<keyof typeof CARDS>;

  constructor(cards = Object.keys(CARDS) as Deck["cards"]) {
    this.cards = cards;
  }

  /**
   * https://stackoverflow.com/a/2450976/2757940
   */
  shuffle() {
    const cards = [...this.cards];
    let currentIndex = cards.length,
      randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [cards[currentIndex], cards[randomIndex]] = [
        cards[randomIndex],
        cards[currentIndex],
      ];
    }

    return new Deck(cards);
  }

  /**
   * @param count Number of cards to draw.
   */
  draw(count: number): [Deck["cards"], Deck] {
    return [this.cards.slice(0, count), new Deck(this.cards.slice(count + 1))];
  }
}

interface PokerSettings {
  prefix: string;
}

const DEFAULT_SETTINGS: PokerSettings = {
  prefix: "pkr",
};

class CardIconsWidget extends WidgetType {
  cards: CardRenderer;
  constructor(cards: string) {
    super();
    this.cards = new CardRenderer(cards);
  }
  toDOM(view: EditorView): HTMLElement {
    return this.cards.getElement(view.dom);
  }
}

const isCursorInsideTag = (view: EditorView, start: number, end: number) => {
  const cursor = view.state.selection.main.head;
  return cursor > start - 1 && cursor < end + 1;
};

const isSelectionContainsTag = (
  view: EditorView,
  start: number,
  end: number,
) => {
  const selectionBegin = view.state.selection.main.from;
  const selectionEnd = view.state.selection.main.to;
  return selectionEnd > start - 1 && selectionBegin < end + 1;
};

class BaseCardIconsViewPlugin implements PluginValue {
  static fromPlugin(plugin: Poker) {
    return ViewPlugin.fromClass(
      class CardIconsViewPlugin extends BaseCardIconsViewPlugin {
        constructor(view: EditorView) {
          super();
          this.plugin = plugin;
          // This is the order it needs to go in.
          // Any other way to do this?
          this.decorations = this.buildDecoration(view);
        }
      },
      {
        decorations: value => value.decorations,
      },
    );
  }

  plugin: Poker;
  decorations: DecorationSet;

  update(update: ViewUpdate) {
    if (
      update.docChanged ||
      update.startState.selection.main !== update.state.selection.main
    ) {
      this.decorations = this.buildDecoration(update.view);
    }
  }

  buildDecoration(view: EditorView) {
    const widgets: Range<Decoration>[] = [];
    for (const { from, to } of view.visibleRanges) {
      syntaxTree(view.state).iterate({
        from,
        to,
        enter: node => {
          if (node.type.name.includes("inline-code")) {
            const text = view.state.doc.sliceString(node.from, node.to);
            const match = this.plugin.boardRegex.exec(text);

            if (
              match &&
              !isCursorInsideTag(view, node.from - 1, node.to + 1) &&
              !isSelectionContainsTag(view, node.from - 1, node.to + 1)
            ) {
              const [, cards] = match;
              const deco = Decoration.replace({
                widget: new CardIconsWidget(cards),
              });
              widgets.push(deco.range(node.from - 1, node.to + 1));
            }
          }
        },
      });
    }
    return Decoration.set(widgets);
  }

  destroy() {
    // ...
  }
}

class CardRenderer {
  constructor(private cards: string) {}

  getElement(el: HTMLElement) {
    const replacement = el.createSpan({
      cls: "pkr-inline-cards",
    });
    let idx = 0;
    while (idx < this.cards.length) {
      const card = this.cards.substring(idx, idx + 2);
      if (this.validCard(card)) replacement.innerHTML += CARDS[card];
      idx = idx + 2;
    }
    return replacement;
  }

  validCard(card: string): card is keyof typeof CARDS {
    return card in CARDS;
  }
}

class CardIconsRenderChild extends MarkdownRenderChild {
  cards: CardRenderer;

  constructor(containerEl: HTMLElement, cards: string) {
    super(containerEl);

    this.cards = new CardRenderer(cards);
  }

  onload() {
    this.containerEl.replaceWith(this.cards.getElement(this.containerEl));
  }
}

class InlinePokerCardRenderer {
  constructor(private plugin: Poker) {}

  process: MarkdownPostProcessor = (el, ctx) => {
    for (const codeblock of Array.from(el.querySelectorAll("code"))) {
      const text = codeblock.innerText.trim();
      const match = this.plugin.boardRegex.exec(text);

      if (match) {
        const [, cards] = match;
        ctx.addChild(new CardIconsRenderChild(codeblock, cards));
      }
    }
  };
}

class InsertRandomCardsModal extends Modal {
  count = 0;

  onSubmit: (count: number) => void;
  text: TextComponent;
  btn: ButtonComponent;

  constructor(app: App, onSubmit: (count: number) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;

    new Setting(contentEl)
      .setName("How many cards do you want to insert?")
      .addText(text => {
        this.text = text;
        text.onChange(value => {
          this.count = parseInt(value, 10);
          this.btn.setDisabled(Number.isNaN(this.count));
        });
      });

    new Setting(contentEl).addButton(btn => {
      this.btn = btn;
      btn
        .setButtonText("Submit")
        .setCta()
        .onClick(() => {
          this.close();
          this.onSubmit(this.count);
        });
    });

    this.scope.register([], "Enter", (evt: KeyboardEvent) => {
      if (evt.isComposing) {
        return;
      }

      this.close();
      this.onSubmit(this.count);
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

export default class Poker extends Plugin {
  settings: PokerSettings;
  renderer: InlinePokerCardRenderer;

  async onload() {
    await this.loadSettings();
    this.renderer = new InlinePokerCardRenderer(this);
    this.addSettingTab(new PokerSettingTab(this.app, this));
    this.registerMarkdownPostProcessor(this.renderer.process);
    this.registerEditorExtension(BaseCardIconsViewPlugin.fromPlugin(this));

    this.addCommand({
      id: "insert-random-cards",
      name: "Insert Random Cards",
      editorCallback: (editor: Editor) => {
        new InsertRandomCardsModal(this.app, count =>
          this.insertRandomCards(editor, count),
        ).open();
      },
    });
  }

  insertRandomCards = (editor: Editor, count: number): void => {
    const [cards] = new Deck().shuffle().draw(count);
    editor.replaceRange(
      `\`${this.settings.prefix}:${cards.join("")}\``,
      editor.getCursor(),
    );
  };

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  get boardRegex() {
    return new RegExp(`${this.settings.prefix}:(${CARD_REGEX}+)`);
  }
}

class PokerSettingTab extends PluginSettingTab {
  plugin: Poker;

  constructor(app: App, plugin: Poker) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Prefix")
      .setDesc("Prefix to use for rendering inline playing cards.")
      .addText(text =>
        text
          .setPlaceholder("pkr")
          .setValue(this.plugin.settings.prefix)
          .onChange(async value => {
            this.plugin.settings.prefix = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
