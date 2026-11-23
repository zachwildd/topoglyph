---
name: topoglyph-extend
description: Extends TopoGlyph to a new domain or problem. Use when the user asks to extend or apply TopoGlyph to something, or to model, explain, or reason about a problem in TopoGlyph.
---

# Extend TopoGlyph

- 1. Load the base reference

Read all of `${CLAUDE_SKILL_DIR}/topoglyph.md` (TopoGlyph 1.0–8.0) before writing anything. The file exceeds the single-read token cap, so issue **two** Read calls in sequence: one with `offset: 1, limit: 900` and one with `offset: 901, limit: 900`.

If the user names existing modules to build on, read those too. Saved modules live in `~/.topoglyph/modules/` and `<project>/.topoglyph/modules/`.

- 2. Extend TopoGlyph to the new domain or problem
