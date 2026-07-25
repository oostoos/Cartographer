"""Shared backend configuration, loaded from the repo-root .env file.

The root .env.example / .env is the single source of truth for these values;
vite.config.ts reads the same file for the frontend side of this config.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[3]
ENV_FILE_PATH = REPO_ROOT / ".env"

BACKEND_PORT_ENV_VAR = "CARTOGRAPHER_BACKEND_PORT"
FRONTEND_PORT_ENV_VAR = "CARTOGRAPHER_FRONTEND_PORT"

# Fallback defaults only — the .env file is the real source of truth, these
# just keep the app resilient if it's ever missing.
DEFAULT_BACKEND_PORT = 5000
DEFAULT_FRONTEND_PORT = 5173


class SharedConfig:
    """Backend configuration values shared across the app."""

    def __init__(self, backend_port: int, frontend_port: int):
        self.backend_port = backend_port
        self.frontend_port = frontend_port


def loadSharedConfig() -> SharedConfig:
    """Load shared config from the repo-root .env file (falls back to defaults for unset values)."""
    load_dotenv(ENV_FILE_PATH)
    backend_port = int(os.environ.get(BACKEND_PORT_ENV_VAR, DEFAULT_BACKEND_PORT))
    frontend_port = int(os.environ.get(FRONTEND_PORT_ENV_VAR, DEFAULT_FRONTEND_PORT))
    return SharedConfig(backend_port=backend_port, frontend_port=frontend_port)
