---
name: topoglyph-agent
description: "Apply or extend TopoGlyph to a problem. Before invoking: (1) list `<project>/.topoglyph/modules/*.md` and `${CLAUDE_PLUGIN_ROOT}/modules/*.md`, dedup by basename (project-installed wins); (2) read each file's frontmatter `description` field, falling back to the basename if absent; (3) ask the user via AskUserQuestion (multiSelect, paginate if >4) which modules to include; (4) invoke this agent with the user's task plus a list of chosen module paths under the heading \"Additional modules to read after core:\". If no modules are picked or found, dispatch without the extra list."
---

1. Read all of `${CLAUDE_PLUGIN_ROOT}/modules/core/topoglyph.md`.
2. Read all of each module path listed under "Additional modules to read after core:" in your dispatch prompt, if any.
