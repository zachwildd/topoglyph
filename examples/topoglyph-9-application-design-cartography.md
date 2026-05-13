---
muid: topoglyph-9-application-design-cartography
refs:
  - modules/core/topoglyph.md
---

# TopoGlyph 9: Application Design Cartography

A module for the cognitive task of *understanding the design of an existing application*. Distinct from TopoGlyph's cognitive-process modules (which model how insight forms) and from MechGlyph/CuisineGlyph (which model physical and culinary substrates). This module treats software design as a topological substrate to be *read*, and treats the reader's traversal as a first-class object.

## Why application design needs its own module

Base TopoGlyph through 8.0 models insight, breakthrough, and collective cognition. Reading an existing codebase to understand its design is a different task: it is structured archaeology, not invention. Five things base TopoGlyph does not handle well:

1. **Architectural strata with directional dependencies.** Generic domain enclosures `⦗ ⦘` cannot express "data depends on nothing, service depends on data, ui depends on service" — directionality is structural, not decorative.
2. **Typed contracts crossing process boundaries.** A WebSocket bridge with shared schemas authoring both sides is the load-bearing artifact in many modern apps. Generic relations `─` / `═` flatten this into "two things connected."
3. **Artifact vs. intent.** Code is evidence, not ground truth. The README claims X, the schema says Y, the running code does Z. A single `■` cannot represent the triangulation that disciplined readers actually perform.
4. **Read paths.** Understanding a codebase is a traversal *over time*: where you start, what you skip, what you flag as confusing-return-later, what you mark as verified. This is a cognitive process distinct from the structure being studied, and it has its own topology.
5. **Change-locality as the comprehension test.** The litmus test of design understanding is "if I changed X, where would I have to edit?" Generic cognitive symbols cannot encode blast radius, pinch points, or decoupling seams.

The axioms of this module:

```
Dependency is directional. ⇊ allowed, ⇈ is a smell.
Boundaries are real. Code on either side of ⫾⫾⫾ runs in different processes.
Intent and artifact are distinct sources. Triangulate; do not assume.
Reading order is part of the design. The package you read first shapes the model you build.
```

## Core elements

### 1. Architectural Stratum

- `⌜ ⌟` — Stratum boundary (a layer of the architecture)
- `⇊` — Downward dependency (allowed: outer depends on inner)
- `⇈` — Upward dependency (forbidden / smell: inner reaches outer)
- `⫶` — Cross-stratum injection (utility used by multiple strata, e.g. logger)
- `⊪` — Vendored stratum (formerly external, now owned and adapted)

### 2. Contract & Process Boundary

- `⫾⫾⫾` — Process boundary (separate runtime — daemon vs. SPA, server vs. client)
- `⊸` — Typed contract (schema authoring both sides of a boundary)
- `⤳` — Wire message (event/request crossing the boundary)
- `⟜ ⟞` — Bridge endpoints (matched pair: server-side handler ↔ client-side caller)
- `⊰ ⊱` — Ownership claim (who owns the data of record — e.g. who writes the DB)

### 3. Read-Path

- `① ② ③ …` — Read-order steps (the sequence a reader follows)
- `⤚` — Entry point (where execution begins — main, dev script, route root)
- `⤙` — Re-entry point (where you loop back after a side-trip)
- `⥱` — Breadcrumb (a name that, once known, unlocks the next location)
- `⊝` — Confusion marker (read but not yet understood — return later)
- `⊜` — Verified understanding (read + traced + can predict behavior)

### 4. Artifact–Intent

- `▭` — Artifact (a file, function, schema as it exists)
- `▱` — Stated intent (README, comment, PR description, naming)
- `▰` — Inferred intent (what the artifact implies about the designer's goal)
- `≜` — Triangulation match (artifact agrees with stated intent — high confidence)
- `≢` — Drift (artifact disagrees with stated intent — investigation needed)
- `⊻` — Convention signal (naming/structure that hints at intent without stating it)

### 5. Change-Locality

- `◈` — Change locus (single point a change would land)
- `◇⋯◇` — Distributed change (ripples across multiple loci)
- `◆` — Pinch point (change here forces change everywhere — high coupling)
- `⊡⌗⊡` — Decoupling seam (change on one side does not propagate — the contract absorbs it)
- `⥊` — Co-change axis (artifacts that always move together)

## The six-step process

```
①⤚ ⫾⫾⫾                       Locate perimeter: entry points + process boundaries
②⌜⌟ ⇊ ⌜⌟                     Identify strata + dependency direction
③⊸ ⟜⟞ across ⫾⫾⫾             Trace typed contracts that cross boundaries
④⊻ → ▰                       Collapse repetition into archetypes (the conventions)
⑤▭ ≜/≢ ▱                     Triangulate artifacts against stated intent
⑥"if X changes" → ◈/◇⋯◇/◆    Test understanding via change-locality probes
```

Each step's stopping condition: every `⊝` raised in the prior step has become `⊜` (or been deliberately deferred with rationale).

## Meta-insight: understanding ≠ reading

A reader who walks files alphabetically never builds a design model. The cognitive economy of this process comes from treating the codebase as a graph with **distinguished entry points**, where:

- Boundaries (`⫾⫾⫾`) compress the system into a small number of runtimes
- Contracts (`⊸`) identify the load-bearing packages — the ones that author both sides of a boundary
- Conventions (`⊻`) compress N files into one archetype
- Triangulation (`≜`/`≢`) lets a reader trust README claims provisionally and then audit
- Change-locality probes (`◈`/`◇⋯◇`/`◆`) are the *exit exam*: if you cannot predict where change lands, you do not yet understand the design

A well-applied pass builds a model in O(boundaries + contracts) reads rather than O(files). For most monorepos this is a 10–50× reduction in cognitive load.

## When to reach for this module

Use this module when you need to:

- Onboard to a codebase you did not write
- Audit whether implementation matches stated architectural intent
- Decide where a feature should live before writing it
- Identify the load-bearing package in a system (the one to read first, change most carefully, test most thoroughly)
- Review an architectural proposal by asking: "where do contracts live, and what does each side own?"

Do not use it for:

- Single-file algorithmic reasoning (use base TopoGlyph cognitive symbols)
- Performance analysis (no symbols for time/space cost)
- Runtime debugging (no symbols for execution traces — that is a different module)