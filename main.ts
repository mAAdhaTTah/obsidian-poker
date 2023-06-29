import {
  App,
  MarkdownPostProcessor,
  MarkdownRenderChild,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";
import svgAc from "./cards/Ac.svg";
import svgAd from "./cards/Ad.svg";
import svgAh from "./cards/Ah.svg";
import svgAs from "./cards/As.svg";
import svgKc from "./cards/Kc.svg";
import svgKd from "./cards/Kd.svg";
import svgKh from "./cards/Kh.svg";
import svgKs from "./cards/Ks.svg";
import svgQc from "./cards/Qc.svg";
import svgQd from "./cards/Qd.svg";
import svgQh from "./cards/Qh.svg";
import svgQs from "./cards/Qs.svg";
import svgJc from "./cards/Jc.svg";
import svgJd from "./cards/Jd.svg";
import svgJh from "./cards/Jh.svg";
import svgJs from "./cards/Js.svg";
import svgTc from "./cards/Tc.svg";
import svgTd from "./cards/Td.svg";
import svgTh from "./cards/Th.svg";
import svgTs from "./cards/Ts.svg";
import svg9c from "./cards/9c.svg";
import svg9d from "./cards/9d.svg";
import svg9h from "./cards/9h.svg";
import svg9s from "./cards/9s.svg";
import svg8c from "./cards/8c.svg";
import svg8d from "./cards/8d.svg";
import svg8h from "./cards/8h.svg";
import svg8s from "./cards/8s.svg";
import svg7c from "./cards/7c.svg";
import svg7d from "./cards/7d.svg";
import svg7h from "./cards/7h.svg";
import svg7s from "./cards/7s.svg";
import svg6c from "./cards/6c.svg";
import svg6d from "./cards/6d.svg";
import svg6h from "./cards/6h.svg";
import svg6s from "./cards/6s.svg";
import svg5c from "./cards/5c.svg";
import svg5d from "./cards/5d.svg";
import svg5h from "./cards/5h.svg";
import svg5s from "./cards/5s.svg";
import svg4c from "./cards/4c.svg";
import svg4d from "./cards/4d.svg";
import svg4h from "./cards/4h.svg";
import svg4s from "./cards/4s.svg";
import svg3c from "./cards/3c.svg";
import svg3d from "./cards/3d.svg";
import svg3h from "./cards/3h.svg";
import svg3s from "./cards/3s.svg";
import svg2c from "./cards/2c.svg";
import svg2d from "./cards/2d.svg";
import svg2h from "./cards/2h.svg";
import svg2s from "./cards/2s.svg";

const CARDS = {
  Ac: svgAc,
  Ad: svgAd,
  Ah: svgAh,
  As: svgAs,
  Kc: svgKc,
  Kd: svgKd,
  Kh: svgKh,
  Ks: svgKs,
  Qc: svgQc,
  Qd: svgQd,
  Qh: svgQh,
  Qs: svgQs,
  Jc: svgJc,
  Jd: svgJd,
  Jh: svgJh,
  Js: svgJs,
  Tc: svgTc,
  Td: svgTd,
  Th: svgTh,
  Ts: svgTs,
  "9c": svg9c,
  "9d": svg9d,
  "9h": svg9h,
  "9s": svg9s,
  "8c": svg8c,
  "8d": svg8d,
  "8h": svg8h,
  "8s": svg8s,
  "7c": svg7c,
  "7d": svg7d,
  "7h": svg7h,
  "7s": svg7s,
  "6c": svg6c,
  "6d": svg6d,
  "6h": svg6h,
  "6s": svg6s,
  "5c": svg5c,
  "5d": svg5d,
  "5h": svg5h,
  "5s": svg5s,
  "4c": svg4c,
  "4d": svg4d,
  "4h": svg4h,
  "4s": svg4s,
  "3c": svg3c,
  "3d": svg3d,
  "3h": svg3h,
  "3s": svg3s,
  "2c": svg2c,
  "2d": svg2d,
  "2h": svg2h,
  "2s": svg2s,
};

const CARD_REGEX = "([2-9TKQKA][cdhs])";

interface PokerSettings {
  prefix: string;
}

const DEFAULT_SETTINGS: PokerSettings = {
  prefix: "pkr",
};

class CardIconsRenderChild extends MarkdownRenderChild {
  cards: string;

  constructor(containerEl: HTMLElement, cards: string) {
    super(containerEl);

    this.cards = cards;
  }

  onload() {
    const replacement = this.containerEl.createSpan({
      attr: {
        style: `display: inline-flex;vertical-align: top;`,
      },
    });
    let idx = 0;
    while (idx < this.cards.length) {
      const card = this.cards.substring(idx, idx + 2);
      if (this.validCard(card)) replacement.innerHTML += CARDS[card];
      idx = idx + 2;
    }
    this.containerEl.replaceWith(replacement);
  }

  validCard(card: string): card is keyof typeof CARDS {
    return card in CARDS;
  }
}

class InlinePokerCardRenderer {
  constructor(private app: App, private plugin: Poker) {}

  get boardRegex() {
    return new RegExp(`${this.plugin.settings.prefix}:(${CARD_REGEX}+)`);
  }

  process: MarkdownPostProcessor = (el, ctx) => {
    for (const codeblock of Array.from(el.querySelectorAll("code"))) {
      const text = codeblock.innerText.trim();
      const match = this.boardRegex.exec(text);

      if (match) {
        const [, cards] = match;
        ctx.addChild(new CardIconsRenderChild(codeblock, cards));
      }
    }
  };
}

export default class Poker extends Plugin {
  settings: PokerSettings;
  renderer: InlinePokerCardRenderer;

  async onload() {
    await this.loadSettings();
    this.renderer = new InlinePokerCardRenderer(this.app, this);
    this.addSettingTab(new PokerSettingTab(this.app, this));
    this.registerMarkdownPostProcessor(this.renderer.process);
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
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

    containerEl.createEl("h2", { text: "Settings for Obsidian Poker." });

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
