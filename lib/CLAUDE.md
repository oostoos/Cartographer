# lib/

Reusable code, split into two tiers. See `.ajx/AustinsSweManifesto.md`
("Libraries" section).

- [`language/`](language/CLAUDE.md) — one subdirectory per language, zero
  stack or business knowledge.
- [`stack/`](stack/CLAUDE.md) — one subdirectory per framework/engine/package
  (e.g. Flask, React), reusable across any repo built on that same
  package but not stack-agnostic.

Both tiers follow the same conventions: split files by what they solve, and
expose a barrel that surfaces everything the directory defines with a short
description per definition.
