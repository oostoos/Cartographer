---
name: refactor
description: >
  Use this skill when asked to refactor, clean up, restructure, or bring
  existing code into compliance with .ajx/AustinsSweManifesto.md and
  .ajx/CodeStyle.md — modularity, single source of truth, magic
  numbers/strings, naming, library placement, and documentation — without
  changing behavior. Also invoke manually ("/refactor"). Usable directly by
  the main agent, or handed to the JuniorDeveloper subagent for mechanical,
  well-scoped passes ("run the refactor skill against <path>").
---

# refactor

Bring existing code into compliance with `.ajx/AustinsSweManifesto.md` and
`.ajx/CodeStyle.md`. This is a **pure refactor** — structure and style only,
never a behavior or feature change.

## Steps

1. **Read the ground rules.** Read `.ajx/AustinsSweManifesto.md` and
   `.ajx/CodeStyle.md`. Never edit `.ajx/AustinsSweManifesto.md` — it is
   off-limits regardless of what this skill is doing (same rule as the
   `update-library` skill).

2. **Confirm scope.** Work only within the file, directory, or feature area
   given by the caller. This skill changes structure/style, not behavior —
   if a change would alter what the code does, stop and flag it instead of
   making it.

3. **Modularity pass** (manifesto "Modularization and building blocks",
   `CodeStyle.md` "General style"):
   - Split functions with distinct logical chunks (~10-line guideline) into
     named helper functions.
   - Extract non-trivial if-bodies into a named helper.
   - When sibling definitions repeat the same scaffolding and only small
     pieces vary, extract the shared scaffold into a private helper that
     takes the varying pieces as parameters (see the before/after example
     in `CodeStyle.md`).
   - Prefer early-return/guard clauses over `else`; prefer if-chains over
     `switch`.

4. **Single-source-of-truth pass** (manifesto "One source of truth",
   "Maintaining datastructures across the stack", "Fetch requests"):
   - Consolidate duplicated constants, logic, datastructures, or payload
     shapes into one location.
   - For cross-language duplication (e.g. a datastructure mirrored in
     Python and TypeScript), consolidate if there's a real mechanism to do
     so; otherwise document in each location which other locations must be
     kept in sync.

5. **Magic numbers/raw strings pass** (manifesto "Magic numbers and raw
   strings"): give every inline numeric or string literal a name.

6. **Library placement pass** (`lib/CLAUDE.md`, `lib/language/CLAUDE.md`,
   `lib/stack/CLAUDE.md`):
   - Move code with zero business/stack knowledge to
     `lib/language/<language>/`.
   - Move code tied to a framework/package but free of business logic to
     `lib/stack/<package>/`.
   - After adding, renaming, or removing any definition under `lib/`,
     invoke the `update-library` skill to keep barrels and CLAUDE.md docs in
     sync — don't re-derive its steps here.

7. **Naming & style pass** (`.ajx/CodeStyle.md`, the relevant
   `lib/language/*/CLAUDE.md`):
   - Python: snake_case.
   - TypeScript: camelCase variables/definitions, PascalCase classes,
     kebab-case files, `I`-prefixed interfaces, `T`-prefixed types.
   - React: file name matches component name, `.ts` (not `.tsx`) for files
     with no JSX, props interfaces named `IXxxProps`.
   - Verb-led function names (`get`/`build`/`is`/...); no truncated
     identifiers; `_`- or `z`-prefixed "private" functions in languages
     without native visibility.

8. **Documentation pass** (manifesto "Documentation"): concise description,
   documented parameters, return value/type, and any errors thrown
   directly. If a definition needs a lot of doc text to explain, split it
   into smaller definitions instead of writing more docs.

9. **Organization pass** (manifesto "Code organization"): group code by
   functional area, not by file type (no catch-all `hooks/`, `utils/`,
   etc.).

10. **Verify.** No-behavior-change is the whole point — run the project's
    existing tests (`pytest`, `npm run test --workspace=src/frontend`)
    before and after touching a file to confirm nothing broke. If touched
    code has no test coverage, flag that gap in the report rather than
    silently leaving it — don't scope-creep into writing a full new test
    suite unless asked.

11. **Report.** Summarize what changed, file by file, plus any flagged
    gaps (untested code, unresolved cross-language duplication, anything
    that looked like it needed a behavior change and was left alone).

## Delegating a larger pass

For a big or multi-file pass, consider delegating to the `JuniorDeveloper`
subagent (Haiku) instead of running this inline — dispatch it by naming
this skill explicitly, e.g. "run the `refactor` skill against
`lib/stack/parchment/page_store.py`".
