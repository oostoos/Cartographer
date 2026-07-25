"""Single source of truth for where Cartographer's flat-file data lives on disk."""
from pathlib import Path

DATA_ROOT = Path(__file__).resolve().parent / ".data"
