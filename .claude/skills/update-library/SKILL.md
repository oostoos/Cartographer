---
name: update-library
description: >
  Use this skill whenever you add, rename, or remove a definition (function,
  constant, class, type, etc.) inside lib/<language>/ in this repo, or before
  finishing any edit that touches a library file. Also invoke it manually
  ("/update-library") when asked to sync library docs/barrels. Keeps each
  language's barrel file and CLAUDE.md documentation in sync with the actual
  library code, per .ajx/AustinsSweManifesto.md's "Libraries" and "One source
  of truth" sections.
---

# update-library

Run this after any change to a definition under `lib/<language>/` — a new
function, constant, class, or type; a rename; or a removal. It keeps the
language's barrel, its `CLAUDE.md`, and the root `CLAUDE.md` import list
consistent with the actual code, so the library documentation never drifts
from the library itself.

## Steps

1. **Identify the affected language directory** — `lib/<language>/` (e.g.
   `lib/python/`, `lib/typescript/`).

2. **Locate or create the barrel file** for that language. The convention is
   `index.<ext>` (e.g. `index.ts`, `index.py`) — check the language's
   `CLAUDE.md` for the exact name it points to. If no barrel exists yet,
   create it.

3. **Update the barrel** to reflect the change:
   - New definition → add an export/import line for it.
   - Renamed definition → update the export/import line.
   - Removed definition → delete its export/import line.
   Place the line under the whitespace/comment-separated section that
   matches its logical grouping (e.g. "string utilities", "http helpers").
   Create a new section if none fits. See
   `.ajx/AustinsSweManifesto.md` ("Libraries") for the grouping convention.

4. **Update `lib/<language>/CLAUDE.md`** to match:
   - If a CLAUDE.md doesn't exist yet, create it and add a `TODO: ...` placeholder at the top.
   - New definition → add a concise entry: one-line description, parameters,
     return value/type, and any errors it throws directly.
   - Renamed/changed signature → update the existing entry.
   - Removed definition → delete its entry.
   The first time a real definition is added, replace the generic
   `TODO: ...` placeholder text with real content.

5. **Ensure the root import exists.** Check `CLAUDE.md` at the repo root for
   a line `@lib/<language>/CLAUDE.md`. If it's missing, append it, matching
   the existing style — one bare `@path` per line, no leading `./`.

6. **Never edit `.ajx/AustinsSweManifesto.md`.** It is explicitly off-limits
   regardless of what this skill is doing.
