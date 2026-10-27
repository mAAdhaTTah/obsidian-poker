# Changelog

## 1.4.1

### Fixes

- Inline cards in Live Preview render when scrolled into view, and in long notes the parser hadn't reached on open. Before, they stayed as raw `pkr:…` code until the cursor passed over them. (#30, #31)

### Pull requests

- Re-render inline cards on scroll and parse in Live Preview ([#31](https://github.com/mAAdhaTTah/obsidian-poker/pull/31))
- Release 1.4.1 ([#32](https://github.com/mAAdhaTTah/obsidian-poker/pull/32))

## 1.4.0

### New: strategies with several actions

A `pkr-range` block can now show several actions in one matrix. Write it as YAML, mapping each action's name to its range:

````
```pkr-range
Raise 2.5bb: QQ+,AKs,AQs:0.5
Call: JJ-99,AQs:0.5,AJs
Fold:
dead: 22-55
```
````

- **Actions** are drawn in order, each in its own color, with a legend of combo counts below the matrix. Names can be free text like `Raise 2.5bb` or `Call (1/3 pot)`.
- **Frequencies** are shares of the whole hand. A hand's actions plus `dead` can add up to at most 1.
- **The rest of the range** stays empty. To name and color it, add one action with no range, like `Fold:`.
- **`dead`** marks hands that aren't available. They're hatched and limit what actions can take.
- **Colors** default to Obsidian's palette. The long form sets one: `Raise:` followed by indented `range: QQ+` and `color: red`. A color can be a palette name, a CSS variable, or a quoted hex value.
- **Edit** paints every action, with a slider per action to mix the brush. Saving rewrites the block, so YAML comments in it aren't kept.

Existing single-range blocks keep working as before.

### Changes to range blocks

- Range blocks fill the width of the note.
- The Edit button and the editor toolbar sit at the top left, clear of Obsidian's own edit-block button in live preview.
- The combo count and legend appear below the matrix.
- Weighted cells in single ranges show their exact share; `QQ:0.333` fills 33.3%.
- The brush sliders take from the rest of the range first, so raising one action no longer pulls the others down until they'd go over 100.

### Internal

- Uses @spotlab/hand-matrix 0.5.0. `RangeMatrix` replaces `RangeGrid`.
- Unit tests (Vitest) run in CI.
- TypeScript checks against ES2022 built-ins.

### Pull requests

- Generate release notes when publishing a release ([#27](https://github.com/mAAdhaTTah/obsidian-poker/pull/27))
- Multi-action range blocks ([#28](https://github.com/mAAdhaTTah/obsidian-poker/pull/28))
- Release 1.4.0 ([#29](https://github.com/mAAdhaTTah/obsidian-poker/pull/29))

## 1.3.0

### New: `pkr-range` code blocks

Render a poker range as a 13x13 hand matrix. Use a fenced code block whose language is your prefix plus `-range` (`pkr-range` by default):

````
```pkr-range
AA,KK,QQ,JJ:0.75,TT:0.5,AKs,AQs:0.5,AKo
```
````

- Ranges are comma-separated combos (`AA`, `AKs`, `AKo`), shorthand runs (`22+`, `A2s+`, `TT-77`) or exact hands (`AhKh`), each optionally followed by `:frequency` between 0 and 1. Weighted combos render as partially filled cells. A range that can't be parsed shows the parser's error instead of the matrix.
- Click **Edit** to paint the range in place. **Brush** paints cells at the weight set by the "In range" slider (click or drag), **Eyedropper** picks up a cell's weight, **Clear** empties the matrix, **Save** writes the range back into the note and **Cancel** discards changes.
- Saving only rewrites the combos you painted. Everything else, including suit-specific hands like `AhKh:0.7`, is kept as written. Saving can compact runs, e.g. `AA,KK,QQ` becomes `QQ+`. In live preview a save is a single undoable editor change. An empty `pkr-range` block is a quick way to start a new range.
- Works in reading view and live preview, and follows Obsidian's light and dark themes.
- If you change the prefix in settings, reload the plugin for range blocks to pick it up.

### Settings and commands

- On Obsidian 1.13+, the Prefix setting appears in settings search (declarative settings API). Older versions show the same tab as before.
- The command is renamed to "Insert random cards" for sentence case. Its id is unchanged, so existing hotkeys still work.

### Minimum Obsidian version is now 1.2.3

The plugin uses `ButtonComponent.setDisabled` (Obsidian 1.2.3) and `vault.process` (1.1.0), so `minAppVersion` moves from 0.15.0 to 1.2.3.

### Fixes from Obsidian's plugin review

- Inline cards are built from parsed SVG instead of `innerHTML` (#24).
- Release assets are just `main.js`, `manifest.json` and `styles.css`, with GitHub build attestations (#25). The `poker.zip` is gone. For manual installs, download those three files into `<vault>/.obsidian/plugins/poker/`.

### Internal

- Build tooling upgraded (TypeScript 6, esbuild 0.28, typescript-eslint 8), and the plugin source moved into `src/` (#20, #22).
- Lint now uses Obsidian's own ESLint rules (`eslint-plugin-obsidianmd`, ESLint 9), so review findings are caught before release (#26).
- CI runs on Node 22 (#25).

### Pull requests

- Upgrade TypeScript, esbuild and typescript-eslint ([#20](https://github.com/mAAdhaTTah/obsidian-poker/pull/20))
- Add editable range matrix code blocks ([#19](https://github.com/mAAdhaTTah/obsidian-poker/pull/19))
- Move plugin source into src/ ([#22](https://github.com/mAAdhaTTah/obsidian-poker/pull/22))
- Fix community review findings ([#24](https://github.com/mAAdhaTTah/obsidian-poker/pull/24))
- Lint with Obsidian's ESLint plugin ([#26](https://github.com/mAAdhaTTah/obsidian-poker/pull/26))
- Release pipeline: drop zip, add attestations, update actions ([#25](https://github.com/mAAdhaTTah/obsidian-poker/pull/25))
- Release 1.3.0 ([#23](https://github.com/mAAdhaTTah/obsidian-poker/pull/23))

## 1.2.3

- Clarify ranks/suits in docs ([#16](https://github.com/mAAdhaTTah/obsidian-poker/pull/16))
- Improve performance of editor decorations ([#18](https://github.com/mAAdhaTTah/obsidian-poker/pull/18))

## 1.2.2

- Fix insert random cards prefix ([#14](https://github.com/mAAdhaTTah/obsidian-poker/pull/14)). Thanks [@jiyee](https://github.com/jiyee)!

## 1.2.1

- Add support for unknown suit or rank ([#12](https://github.com/mAAdhaTTah/obsidian-poker/pull/12))
- Fix inline code embedded in list, heading, etc. ([#13](https://github.com/mAAdhaTTah/obsidian-poker/pull/13))
- Fix description

## 1.2.0

- Fix regex ([#7](https://github.com/mAAdhaTTah/obsidian-poker/pull/7))
- Fix how plugin is injected into the view ([#8](https://github.com/mAAdhaTTah/obsidian-poker/pull/8), [#9](https://github.com/mAAdhaTTah/obsidian-poker/pull/9))
- Add Insert Random Cards command ([#10](https://github.com/mAAdhaTTah/obsidian-poker/pull/10))
- Update description ([#11](https://github.com/mAAdhaTTah/obsidian-poker/pull/11))

## 1.1.2

- Fix build path ([#6](https://github.com/mAAdhaTTah/obsidian-poker/pull/6))

## 1.1.1

- Fix release job

## 1.1.0

- Show cards in editor ([#4](https://github.com/mAAdhaTTah/obsidian-poker/pull/4))
- Add CI workflow ([#5](https://github.com/mAAdhaTTah/obsidian-poker/pull/5))

## 1.0.2

- Add license
- Move inline styles to styles.css
- Simplify plugin description
- Remove h2 from settings page

## 1.0.1

- Rename slug to just `poker` ([#3](https://github.com/mAAdhaTTah/obsidian-poker/pull/3))

## 1.0.0

- Initial implementation
