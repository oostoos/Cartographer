# @manualReviewRequested: 2026-07-06
# Thin wrapper around the npm scripts in package.json and source/frontend/package.json.
# Keep those scripts as the source of truth; add targets here, not new command logic.

.PHONY: help dev dev-backend dev-frontend test test-backend test-frontend lint build install

help:
	@echo Available targets:
	@echo   make dev            Run backend + frontend together (http://localhost:5173)
	@echo   make dev-backend    Run only the Flask backend
	@echo   make dev-frontend   Run only the Vite frontend
	@echo   make test           Run backend and frontend test suites
	@echo   make test-backend   Run backend tests (pytest)
	@echo   make test-frontend  Run frontend tests (vitest)
	@echo   make lint           Lint the frontend (eslint)
	@echo   make build          Type-check and build the frontend
	@echo   make install        Install root, backend, and frontend dependencies

dev:
	npm run dev

dev-backend:
	npm run dev:backend

dev-frontend:
	npm run dev:frontend

test: test-backend test-frontend

test-backend:
	npm run test:backend

test-frontend:
	npm run test:frontend

lint:
	npm --prefix source/frontend run lint

build:
	npm --prefix source/frontend run build

install:
	npm install
	source/backend/.venv/Scripts/python.exe -m pip install -r source/backend/requirements.txt
	npm --prefix source/frontend install
