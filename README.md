# Cartographer

A task and profile management app with a Flask backend and a React frontend.

## Stack

- Backend: Python 3.12, Flask
- Frontend: TypeScript, React, Vite
- Dev tooling: PowerShell (see [lib/powershell/CLAUDE.md](lib/powershell/CLAUDE.md))

## Project layout

- [lib/](lib/CLAUDE.md) — stack-agnostic library code, one subdirectory per
  language, each with its own barrel file.
- [src/](src/CLAUDE.md) — stack- and business-specific code:
  - `src/common/` — shared logic specific to the Flask + React stack, but not
    to Cartographer's business logic.
  - `src/main/` — Cartographer's actual app logic (tasks, profile).

## Getting started

1. Install frontend dependencies: `npm install`
2. Install backend dependencies: `pip install -r src/main/backend/requirements.txt`
3. Copy `.env.example` to `.env` and adjust values if needed.

## Running the app

In VS Code, press F5 and pick **F5: Cartographer (Flask + Vite + Edge)** — this
starts the backend, the frontend, and an attached Edge debug session together.

Without VS Code, run each side manually:

```
python -m src.main.backend.app
npm run dev --workspace=src/main/frontend
```

## Running tests

```
pytest
npm run test --workspace=src/main/frontend
```
