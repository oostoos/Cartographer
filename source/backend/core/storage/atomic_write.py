"""Writing a record file so a concurrent reader never observes a half-written file."""

import os
from pathlib import Path

# Suffix used for the temporary file a write lands in before it's swapped into place.
TEMP_FILE_SUFFIX = ".tmp"


def write_text_atomically(path: Path, content: str) -> None:
    """Writes content to path such that any reader either sees the old content or the new
    content in full, never a partial write.

    Inputs: path, the final destination file; content, the full text to write.
    Notes: writes to a sibling "<path>.tmp" file first, then uses os.replace, which is atomic
        on the same NTFS volume.
    """
    temp_path = path.with_name(path.name + TEMP_FILE_SUFFIX)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path.write_text(content, encoding="utf-8")
    os.replace(temp_path, path)
