"""Single source of truth for where Cartographer's flat-file data lives on disk."""
import os
from pathlib import Path

from dotenv import load_dotenv

from src.backend.config import ENV_FILE_PATH

DATA_ENV_VAR = "CARTOGRAPHER_DATA_ENV"
PROD_DATA_ENV = "prod"
TEST_DATA_ENV = "test"
DEFAULT_DATA_ENV = PROD_DATA_ENV

_DATA_BASE = Path(__file__).resolve().parent / ".data"


def resolveDataRoot(data_env: str) -> Path:
    """Build the data root for the given environment name ("prod" or "test")."""
    if data_env not in (PROD_DATA_ENV, TEST_DATA_ENV):
        raise ValueError(f"Unknown {DATA_ENV_VAR} value: {data_env!r}")
    return _DATA_BASE / data_env


load_dotenv(ENV_FILE_PATH)
DATA_ROOT = resolveDataRoot(os.environ.get(DATA_ENV_VAR, DEFAULT_DATA_ENV))
