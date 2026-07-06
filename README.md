# Cartographer

A daily-tracking and project-management app for people with ADHD, built to grow into a general
personal assistant. Single local user, runs on your own machine.

**Stack**: Vite + React + TypeScript frontend, Flask backend, and a hand-built file-based
database (no SQL, no embedded DB engine). See [CLAUDE.md](CLAUDE.md) and
[source/backend/core/storage/CLAUDE.md](source/backend/core/storage/CLAUDE.md) for how it's put
together.

## First-time setup

1. **Install Node.js LTS and Python 3.12** (skip if already installed):
   ```powershell
   winget install -e --id OpenJS.NodeJS.LTS
   winget install -e --id Python.Python.3.12
   ```

2. **Create the backend virtual environment and install its dependencies**:
   ```powershell
   cd source/backend
   python -m venv .venv
   .venv\Scripts\python.exe -m pip install -r requirements.txt
   cd ../..
   ```

3. **Install frontend dependencies**:
   ```powershell
   cd source/frontend
   npm install
   cd ../..
   ```

4. **Install root dependencies** (just `concurrently`, for the one-command dev run):
   ```powershell
   npm install
   ```

5. **Create your `.env`** from the template and fill in real values:
   ```powershell
   cp .env.example .env
   ```
   Generate a secret key and a password hash:
   ```powershell
   source/backend/.venv/Scripts/python.exe -c "import secrets; print(secrets.token_hex(32))"
   source/backend/.venv/Scripts/python.exe -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('your-password'))"
   ```
   Paste the first into `FLASK_SECRET_KEY` and the second into `ADMIN_PASSWORD_HASH` in `.env`.
   See `source/backend/core/config/settings.py` for what every other setting controls.

## Running it

**One command, no debugger**:
```powershell
npm run dev
```
Starts the Flask backend (`http://127.0.0.1:5000`) and the Vite dev server
(`http://localhost:5173`, proxying `/api` to the backend) together.

**Or with `make`**, if you have GNU Make installed (`winget install -e --id GnuWin32.Make`):
```powershell
make dev
```
Run `make help` to see every available target (`test`, `lint`, `build`, `install`, etc.) — each
one just wraps the equivalent npm script above.

**With full debugging** (breakpoints in React, Flask, and the database layer, plus hot reload on
both sides): open this folder in VSCode and press **F5**. That runs the "Cartographer (F5, Edge)"
compound launch config (pick "Cartographer (F5, Chrome)" from the debug dropdown instead if you
have Chrome installed), which starts both dev servers via `.vscode/tasks.json` and attaches a
debugger to each.

## Daily use (outside VS Code)

For everyday use you don't need VS Code open at all. Two scripts in `scripts/` wrap the same
`npm run dev` shown above:

- **`scripts/start-cartographer.vbs`** — starts the dev servers minimized (if they're not already
  running) and opens the app in your browser. If they're already running, it just opens a browser
  tab.
- **`scripts/stop-cartographer.vbs`** — force-stops both dev servers. Usually unnecessary since
  closing the minimized "npm run dev" window does the same thing, but useful as a clean sweep.

**One-time setup**: in File Explorer, right-click `scripts/start-cartographer.vbs` → *Send to* →
*Desktop (create shortcut)*. Repeat for `stop-cartographer.vbs` if you want a stop shortcut too.
The same trick works to pin either one to the taskbar or Start menu. The shortcut just points at
the `.vbs` file's path — since that file's location never changes, the shortcut never needs to be
recreated, even if what it does under the hood changes later. You can optionally give the shortcut
a nicer icon via its Properties → Change Icon.

## Testing

```powershell
# Backend
source/backend/.venv/Scripts/python.exe -m pytest source/backend

# Frontend
npm --prefix source/frontend run test
npm --prefix source/frontend run lint
npm --prefix source/frontend run build
```
Or, with `make`: `make test`, `make lint`, `make build`.

Both suites also run in GitHub Actions on every push/PR to `main` (`.github/workflows/ci.yml`).

## Project layout

`source/{frontend,backend}/{core,app}` — `core/` is infrastructure/plumbing, `app/` is feature
code grouped by domain (`tasks`, `journals`, `recurrence`, `projects`, `auth`, `settings`). Every
subdirectory has its own short `CLAUDE.md` describing what it owns and its conventions — read the
relevant one before making a change there.
