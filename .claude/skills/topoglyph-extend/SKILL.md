---
name: topoglyph-extend
description: Use when extending TopoGlyph to a new domain or problem. Accepts an optional module identifier (e.g. /comics/character-anchored); defaults to /core.
---

# Extending TopoGlyph

This skill resolves a module identifier to an ordered **corpus** (a reading list of TopoGlyph modules), reads the corpus in order, then develops a new **extension** for the user's domain or problem.

The composition system itself is defined in `<project>/modules/meta/composition.md`. Read it if anything below is unclear.

## Arguments

- `<id>` (optional): a canonical module identifier, e.g. `core`, `comics/character-anchored`, `math/persistent-homology`. If omitted or absent, defaults to `core`.

## Procedure

### 1. Resolve the module identifier

- If no `<id>` was provided, use `core`.
- Locate the module file:
  - First, search `<project>/modules/**/*.md` for a file whose YAML frontmatter declares `module: <id>`.
  - As a fallback, check the path `<project>/modules/<id>.md`.

### 2. Build the ordered corpus

- Read the resolved module's YAML frontmatter `extends:` list.
- For each ancestor in `extends:` (oldest → newest), recursively repeat steps 1–2 to collect its ancestors.
- Topologically sort the collected modules so each module appears after all of its ancestors. Preserve the oldest→newest order declared in each `extends:` list.
- Deduplicate, keeping the first occurrence.
- The result is the **corpus**: an ordered list of module file paths.

### 3. Read every module in the corpus

- Read each module file in order.
- For files that exceed the single-read token cap (today: `modules/core/topoglyph.md`), issue **two** Read calls in sequence: one with `offset: 1, limit: 900` and one with `offset: 901, limit: 900`.

### 4. Extend TopoGlyph

- Develop a new extension addressing the user's domain or problem.
- Follow the patterns established by the corpus: identify limitations of the current vocabulary, introduce new submodules, define new glyphs with clear mnemonic structure, give worked examples.
- The new extension's `extends:` is `[<id>]` — the identifier the user invoked.

### 5. Saving (out of scope here)

Persisting the new extension as a module file with frontmatter is handled by the `topoglyph-save` skill, not this one. After producing the extension, offer to save it via `topoglyph-save`.
