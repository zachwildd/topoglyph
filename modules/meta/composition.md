---
module: meta/composition
extends: [core]
introduces:
  submodules: [Module Composition]
  glyphs: [ℰ, ⊵, ⊴, ⊶, ⊷, ⋐, ⋑, ⊻, ⇉, ⇇]
---

# TopoGlyph: Module Composition & Resolution

## Limitation being addressed

TopoGlyph has grown as a linear bundle in `modules/core/topoglyph.md`
(extensions 1.0–8.0 stacked inside one file) plus parallel
domain-specific modules in `examples/`. There is no formal way to:
(a) name a module, (b) compose modules into ordered reading lists,
(c) resolve an invocation like `TopoGlyph/<id>` to a corpus, or
(d) declare which modules extend which. The word "module" had also
been overloaded across nested levels of TopoGlyph's own prose.

## Vocabulary

- **Module** (L1) — a TopoGlyph module file. One `.md` file = one
  module. The unit the composition system tracks. Examples: `core`,
  `comics/character-anchored`, `math/persistent-homology`.
- **Extension** (ℰ, L2) — a sequential, additive layer within a
  module. Captures temporal evolution (e.g., extensions 1.0–8.0
  inside `core`). New modules typically contain one extension at
  creation time; only `core` is a multi-extension module today.
- **Submodule** (L3) — a thematic cluster inside an extension
  (e.g., "Temporal Evolution Submodule"). Disambiguates from L1 in
  prose; equivalent to the legacy "Module" used historically inside
  TopoGlyph 4.0+ section headers.
- **Glyph set** (L4) — a categorical sub-grouping inside a submodule.
- **Glyph** (L5) — an individual symbol.
- **Corpus** (⋐) — an ordered sequence of modules; the reading list
  returned by the resolver for a given invocation.

A module is composed of extensions. An extension is composed of
submodules. A submodule is composed of glyph sets. A glyph set is
composed of glyphs. The composition system at L1 never inspects
anything below L1.

## Submodule: Module Composition

### Composition Elements
- ℰ — Extension (L2: sequential additive layer within a module)
- ⊵ — extends-relation: M_B ⊵ M_A means module B extends module A
- ⊴ — extended-by (inverse of ⊵)
- ⊶ — ancestor chain (transitive closure of ⊵)
- ⊷ — sibling modules (shared parent, no ⊵ between them)

### Resolution Operators
- ⋐ — Corpus (ordered reading list of modules)
- ⋑ — Resolver: id ⋑ ⋐(id)
- ⊻ — Topological sort of the module DAG

### Invocation Operators
- ⇉ — Extend-invocation: ⋐ ⇉ ℰ_new
- ⇇ — Apply-invocation:  ⋐ ⇇ ⦗■Model⦘

## Resolution rule

```
M_id → ⋑ → ⋐ = ⊻( transitive-closure( M_id ⊶ M_ancestors ) )
⋐ → ⇉ → ℰ_new          extend mode: emit a new extension that ⊵ corpus
⋐ → ⇇ → ⦗■Model⦘       apply mode: model target using corpus glyphs only
```

Concretely, for an invocation `TopoGlyph/<id>`:

1. Locate the module whose frontmatter has `module: <id>` (canonical),
   or whose path matches (fallback).
2. Recursively expand `extends:` to collect ancestors.
3. Topologically sort, preserving the left-to-right order each
   `extends:` list declares (oldest → newest).
4. Deduplicate, keeping the first occurrence.
5. Read each module file in order; the concatenation is the corpus.

If a module's `extends:` is missing or empty, the module stands alone.
Strict validation of the DAG (cycle detection, required ancestors) is
a future concern; today the resolver trusts what frontmatter declares.

## Storage convention

```
modules/
  core/
    topoglyph.md            # the core module (legacy; 8 extensions inside)
  meta/
    composition.md          # this module
  <domain>/
    <name>.md               # one module per file going forward
```

Each module file carries YAML frontmatter:

```yaml
---
module: <canonical id, path-shaped>
extends: [<id>, ...]         # DAG edges, oldest → newest
introduces:                   # optional inventory
  submodules: [...]
  glyphs:  [...]
---
```

Frontmatter is the authoritative DAG; the file's path is informational
and conventionally mirrors `module:`.

## Invocation syntax

| Form                       | Resolution        | Action                              |
|----------------------------|-------------------|-------------------------------------|
| `Extend TopoGlyph …`       | `TopoGlyph/core`  | develop a new extension             |
| `Extend TopoGlyph/<id> …`  | corpus(id)        | new extension that ⊵ id             |
| `Apply TopoGlyph/<id> …`   | corpus(id)        | model target using existing glyphs  |

**Extend** = output is *additions to TopoGlyph itself* (new submodules,
new glyphs, a new module file).

**Apply** = output is *an analysis using existing TopoGlyph* (modeling
a target problem with the current glyph inventory; no new glyphs).

A new module produced by `Extend` typically lives in a new file at
`modules/<domain>/<name>.md` with frontmatter declaring its `extends:`
chain. Appending a new extension to an existing module file is also
allowed (this is how `core` accumulated 1.0–8.0), but
one-extension-per-file is the recommended convention going forward.

## Self-application

This module extends `core`:

```
module: meta/composition
extends: [core]
⋐(meta/composition) = [core, meta/composition]
```

`Apply TopoGlyph/meta/composition "audit the module DAG"` would read
`[modules/core/topoglyph.md, modules/meta/composition.md]` and produce
a topology of the existing modules using ℰ/⊵/⊶/⊷ — without introducing
new glyphs.

## Meta-insight

A module extending a corpus is a `⨳` (self-improvement cycle) at the
representation layer: each module is both a `⟝` (modification) of the
prior corpus and an artifact `⥶`-accumulated for future modules to
`⥵`-inherit. The Module Composition submodule is the `⫏` (implementation
of improved process) that closes the loop. TopoGlyph thereby becomes a
system that can codify its own evolution in its own vocabulary.
