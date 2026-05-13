---
name: topoglyph-extend
description: Use when extending TopoGlyph to a new domain or problem.
---

1. Read all of `<project>/modules/core/topoglyph.md` - the file exceeds the single-read token cap, so issue **two** Read calls in sequence: one with `offset: 1, limit: 900` and one with `offset: 901, limit: 900`.
2. Extend TopoGlyph to the new domain or problem.