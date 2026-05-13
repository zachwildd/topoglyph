---
name: topoglyph-apply
description: Use when modeling a problem with TopoGlyph WITHOUT introducing new glyphs or submodules. Accepts an optional module identifier (e.g. /math/persistent-homology); defaults to /core.
---

# Applying TopoGlyph

This skill resolves a module identifier to an ordered **corpus**, reads the corpus, then uses the existing TopoGlyph vocabulary to model the user's target problem. Unlike `topoglyph-extend`, this skill does **not** introduce new glyphs or submodules — it works strictly within the vocabulary of the corpus.

The composition system itself is defined in `<project>/modules/meta/composition.md`. Read it if anything below is unclear.

## Arguments

- `<id>` (optional): a canonical module identifier, e.g. `core`, `comics/character-anchored`. If omitted, defaults to `core`.

## Procedure

### 1. Resolve and read the corpus

Follow the same resolution and reading procedure as `topoglyph-extend`:

- If no `<id>` was provided, use `core`.
- Locate the module by frontmatter `module: <id>` (canonical) or path `<project>/modules/<id>.md` (fallback).
- Recursively expand `extends:` and topologically sort to get the ordered corpus.
- Read each module file in order. For files exceeding the single-read token cap (today: `modules/core/topoglyph.md`), issue two Read calls: `offset: 1, limit: 900` then `offset: 901, limit: 900`.

### 2. Model the target problem

- Use only glyphs and submodules present in the corpus. Do not introduce new symbols, do not coin new submodule names.
- Produce a TopoGlyph representation of the user's problem: identify the relevant nodes, connectors, transformers, submodule patterns, etc. from the corpus.
- Pair the glyph rendering with prose interpretation so the model is legible.

### 3. Flag gaps honestly

- Where existing glyphs feel insufficient, explicitly flag the gap (e.g. "the corpus lacks vocabulary for X") rather than silently inventing new ones.
- If extension is genuinely needed, recommend the user switch to `topoglyph-extend` rather than mixing modes.

### 4. Output

- A TopoGlyph rendering of the problem, with prose interpretation alongside the glyphs.
- Any flagged corpus gaps.
- No new glyphs, submodules, or `Module:`/`Glyph:` definitions — those belong to `topoglyph-extend`.
