# TopoGlyph

TopoGlyph is a dual-encoding language: a notation that can be read both as text and as a picture of topological information processing. It functions simultaneously as:

1. A symbolic written language with syntactic and semantic rules
2. A visual system that directly represents topological information processes

```
● ═ ◐ ↺ ◐ ─ ●
```

*"A stable concept enters a reinforced processing cycle before returning to stability."*

This repository packages TopoGlyph as a [Claude Code](https://claude.com/claude-code) plugin: the base reference (versions 1.0–8.0) and a skill for extending it to your own problems.

## Usage

```
<todo>
```

## Skill

| Skill | What it does |
| --- | --- |
| [`topoglyph-extend`](skills/topoglyph-extend/SKILL.md) | Loads the base reference and extends TopoGlyph to a new domain or problem. |

## Installation

Add the marketplace and install the plugin from inside Claude Code:

```
/plugin marketplace add zachwildd/topoglyph
/plugin install topoglyph@topoglyph
```

On Claude Code 2.1.275 or later, one step does both:

```
/plugin install topoglyph --marketplace zachwildd/topoglyph
```

To install without the plugin system, clone the repository and copy the skill folder into your personal skills directory:

```sh
git clone https://github.com/zachwildd/topoglyph.git
cp -R topoglyph/skills/* ~/.claude/skills/
```

## Limitations

TopoGlyph is not a formal system. It has no executable semantics, no type-checker, no proof rules. Two LLMs (or two humans) might render the same artifact with slightly different glyph choices, and there is no canonical answer. Its value is as a thinking tool.

## License

Released into the public domain under the [Unlicense](LICENSE).
