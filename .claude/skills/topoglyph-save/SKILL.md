---
name: topoglyph-save
description: Use to save a TopoGlyph module — developed in the current conversation or written to a file outside `modules/` — into a properly-frontmatter'd file at `modules/<id>.md`.
---

# Saving a TopoGlyph module

This skill canonicalizes a TopoGlyph module by writing it to `<project>/modules/<id>.md` with the YAML frontmatter required by the composition system. See `<project>/modules/meta/composition.md` for the convention this skill implements.

The module content may come from:
- the current conversation (e.g., drafted with `topoglyph-extend` or by hand)
- an existing file at any path outside `<project>/modules/`

## Inputs to determine

Gather these from the user (or infer when unambiguous):

1. **Source** — either:
   - chat content (which section of the conversation), or
   - a file path (anywhere on the filesystem)
2. **Module identifier** (`<id>`) — path-shaped, e.g. `comics/character-anchored`, `math/persistent-homology`. Determines the final file location at `modules/<id>.md`.
3. **`extends:` chain** — the ordered list of parent module ids, oldest → newest. Defaults to `[core]` if the module is a domain extension of base TopoGlyph.

Don't ask for fields you can infer cheaply:
- If the source already declares `extends:` (or the older `refs:`/`muid:` style) in its frontmatter, reuse it.
- If the source content references specific parent modules by name, propose those as `extends:`.
- If the source content is clearly a domain extension and no other parent is mentioned, default to `[core]`.

Use `AskUserQuestion` only for things you genuinely cannot infer.

## Procedure

### 1. Resolve source content
- **Chat**: collect the full module text from the conversation (the body of the extension, not chat commentary around it).
- **File**: Read the source file in full.

### 2. Decide target path
- Target: `<project>/modules/<id>.md`.
- If the file already exists, ask the user before overwriting.
- Create parent directories as needed (`mkdir -p`).

### 3. Strip pre-existing frontmatter
- Remove any leading YAML block (`---` … `---`) from the source content, including legacy keys like `muid:` and `refs:`.
- The body begins at the first non-frontmatter line.

### 4. Prepend canonical frontmatter

```yaml
---
module: <id>
extends: [<parent_id>, ...]
---
```

Followed by a blank line, then the stripped body.

If you have additional inventory information (submodules introduced, glyphs introduced), include an `introduces:` block — but this is optional, not required by the resolver.

### 5. Write the file

Use the Write tool. If overwriting an existing module, confirm with the user first.

### 6. Confirm
Report:
- The saved path.
- The resolved `module:` and `extends:` values.
- One sentence summarizing what was saved.
- If the source was an external file, note that the original is untouched — this skill does not delete or move sources.

## Out of scope

- **DAG validation** (cycle detection, ancestor existence) — the resolver in `topoglyph-extend` / `topoglyph-apply` operates on what's declared; integrity checks are a future concern.
- **Bulk migration** — invoke this skill per-module rather than batch-processing a directory.
- **Editing existing modules in place** — for that, just use Edit/Write directly on the target file.
