# Obsidian Poker

Easily document and view your poker hands.

## Screenshot

![Rendered Cards](rendered-editor.png)

## How to Install

In Obsidian go to `Settings > Third-party plugins > Community Plugins > Browse` and search for `Poker`.

### Manual installation

Download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/mAAdhaTTah/obsidian-poker/releases/latest) into your `<vault>/.obsidian/plugins/poker/` folder.

## How to Configure

The plugin allows you to customize the prefix you use for inline cards and range blocks. Go to `Settings -> Poker` to customize. The plugin defaults to `pkr` as the prefix.

## How to Use

### Rendering Cards

To render a card, add backticks your chosen prefix, and a colon, then write the card(s) in standard 2 letter notation, with a rank & suit pair. Ranks should be one of `AKQJT98765432X` (with X being rendered as `X` and meaning "any rank"); suits should be one of `dhscx` (with X being rendered as `x` and meaning "any suit").

#### Example

```
This is a card: `pkr:As`.

You can also do multiple cards at once: `pkr:AsAc`.
```

### Rendering Ranges

To render a hand range as a 13x13 matrix, use a fenced code block whose language is your prefix followed by `-range` (`pkr-range` by default) and put a range string in the body:

````
```pkr-range
AA,KK,QQ,JJ:0.75,TT:0.5,AKs,AQs:0.5,AKo
```
````

A range is a comma-separated list of combos (`AA`, `AKs`, `AKo`), shorthand runs (`22+`, `A2s+`, `TT-77`) or exact hands (`AhKh`), each optionally followed by `:frequency` between 0 and 1. Weighted combos render as partially filled cells. If the range can't be parsed, the block shows the parser's error instead of the matrix.

Click **Edit** on a rendered range to paint it:

- **Brush** paints cells at the weight set by the "In range" slider (100 = always in range). Click or drag across cells.
- **Eyedropper** picks up a cell's weight onto the brush.
- **Clear** empties the matrix.
- **Save** writes the range back into the code block; **Cancel** discards your changes.

Saving only rewrites the combos you painted. Everything else, including suit-specific hands like `AhKh:0.7`, is kept exactly as written. In live preview, the save is a single editor change you can undo. An empty `pkr-range` block is a quick way to start a new range.

If you change the prefix in settings, reload the plugin for range blocks to pick it up.

#### Multiple actions

To show a strategy, with several actions in one matrix, write the block as YAML. Each line maps an action's name to its range:

````
```pkr-range
Raise 2.5bb: QQ+,AKs,AQs:0.5
Call: JJ-99,AQs:0.5,AJs
Fold:
dead: 22-55
```
````

- **Actions** are drawn in the order you write them, each in its own color, with a legend showing its combo count.
- **Frequencies** are a share of the whole hand, so `Raise: AQs:0.5` and `Call: AQs:0.5` split AQs evenly. A hand's actions (plus `dead`) can add up to at most 1.
- **The rest of the range** is left empty. To name it, add one action with no range, like `Fold:` above; it then gets a color and a legend entry for everything the other actions don't cover.
- **`dead`** is a range of hands that aren't available, e.g. because of card removal. They're hatched in the matrix and limit what the actions can take.
- **Colors** default to Obsidian's palette in order. To pick one, write the action in long form:

  ````
  ```pkr-range
  Raise 2.5bb:
    range: QQ+,AKs
    color: red
  Call: JJ-99
  ```
  ````

  `color` takes an Obsidian palette name (`red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `purple`, `pink`), a CSS variable (`--interactive-accent`), or any CSS color. Quote hex colors (`color: "#e5484d"`), since `#` otherwise starts a YAML comment.

Action names can be almost anything (`Raise 2.5bb`, `3-bet`, `Call (1/3 pot)`). Quote a name that starts with a symbol, contains `#` or `: `, or is just a number. Write frequencies without a space after the colon: `AA:0.5`, not `AA: 0.5`.

**Edit** works the same way, with a slider per action to mix the brush. Saving rewrites the whole block, so YAML comments in it aren't kept.

## Roadmap

- Add support for card with no suit (e.g. `Kx`)
- Add support for unknown suited or offsuit cards or other cards (e.g. `KsXo`, `KsXs`, or `KsX`)
- Add command to generate a random number of cards (e.g. to generate a random flop)
- Add a hand replayer using markdown codeblocks & YAML to define a hand and show a replayer in preview to watch it

## Releasing

Releases are automated with [Changesets](https://github.com/changesets/changesets):

1. In each PR that changes the plugin for users, run `npx changeset`, pick the bump type, and write the release note. Commit the file it creates in `.changeset/`.
2. Merging to `main` opens or updates a "Release" PR. It bumps `package.json`, `manifest.json` and `versions.json`, and moves the notes into `CHANGELOG.md`.
3. Merging the Release PR builds the plugin and publishes the GitHub release, tagged with the bare version (e.g. `1.5.0`). The notes are that version's `CHANGELOG.md` section, followed by GitHub's generated list of PRs.

To raise the minimum Obsidian version, edit `minAppVersion` in `manifest.json` in the PR that needs it. The next release records it in `versions.json`.

The Release PR is opened by GitHub Actions, so CI doesn't run on it. To run checks there, close and reopen the PR. The release job runs the full test suite before publishing either way.
