# lib/stack/

Reusable code tied to a specific framework, engine, or package — one
directory per package. See `.ajx/AustinsSweManifesto.md` ("Libraries"
section).

- Code here may require knowledge of the framework/engine/package it wraps
  (e.g. Flask's request/response cycle, React's component model), but never
  business or app knowledge — it must be reusable in any repo that adopts
  the same package, not just this one.
- Name the directory after the real technology it wraps (`flask`, `react`).
  For a bespoke, unnamed system — like this repo's own flat-file database —
  invent a short, memorable name for it instead (`parchment`).
- Same conventions as `lib/language/`: split files by what they solve, and
  expose a barrel that surfaces everything the package defines with a short
  description per definition.
- Cartographer-specific values (port numbers, brand colors/fonts, the exact
  `/api` prefix) do not belong here — they stay in `src/` as thin glue that
  configures or calls into these packages.

Current packages:

- [`flask/`](flask/CLAUDE.md) — a bare Flask app factory + JSON response
  envelope helpers.
- [`react/`](react/CLAUDE.md) — React bootstrap, design-system components,
  generic hooks, and a JSON API client.
- [`parchment/`](parchment/CLAUDE.md) — a bespoke flat-file record-storage
  engine.
