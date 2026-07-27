# Cartographer

A task and profile management app with a Flask backend and a React frontend.

## Stack

- Backend: Python 3.12, Flask
- Frontend: TypeScript, React, Vite
- Dev tooling: PowerShell (see [lib/language/powershell/CLAUDE.md](lib/language/powershell/CLAUDE.md))

## Project layout

- [lib/](lib/CLAUDE.md) — reusable code, split into two tiers:
  - `lib/language/` — stack-agnostic library code, one subdirectory per
    language, each with its own barrel file.
  - `lib/stack/` — reusable code tied to a specific framework/engine/package
    (Flask, React, the bespoke `parchment` flat-file database), but not to
    Cartographer's business logic.
- [src/](src/CLAUDE.md) — Cartographer's actual app logic (tasks, profile,
  groups) plus the thin, non-reusable glue that doesn't belong in `lib/stack`
  (port config, brand colors/fonts):
  - `src/backend/`
  - `src/frontend/`

## Getting started

1. Install frontend dependencies: `npm install`
2. Install backend dependencies: `pip install -r src/backend/requirements.txt`
3. Copy `.env.example` to `.env` and adjust values if needed.

## Running the app

In VS Code, press F5 and pick **F5: Cartographer (Flask + Vite + Edge)** — this
starts the backend, the frontend, and an attached Edge debug session together.

Without VS Code, run each side manually:

```
python -m src.backend.app
npm run dev --workspace=src/frontend
```

The backend reads/writes `src/backend/database/.data/prod` by default.
To point it at a disposable sandbox instead (`.data/test`) — safe to freely
create, break, and reset — set `CARTOGRAPHER_DATA_ENV=test` before launching
it.

## Running tests

```
pytest
npm run test --workspace=src/frontend
```
