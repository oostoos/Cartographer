"""Generic atomic text file write. No knowledge of what's being written or why."""
import os
import tempfile
from pathlib import Path


def atomicWriteText(path: Path, content: str) -> None:
    """Write content to path atomically: write to a sibling temp file, then swap it into place.

    Uses os.replace() rather than os.rename() because os.rename() raises on Windows
    when the destination already exists, while os.replace() succeeds there too.
    """
    path = Path(path)
    directory = path.parent
    directory.mkdir(parents=True, exist_ok=True)

    file_descriptor, temp_path_str = tempfile.mkstemp(
        dir=directory, prefix=f".{path.name}.", suffix=".tmp"
    )
    temp_path = Path(temp_path_str)
    try:
        with os.fdopen(file_descriptor, "w", encoding="utf-8") as temp_file:
            temp_file.write(content)
        os.replace(temp_path, path)
    except BaseException:
        temp_path.unlink(missing_ok=True)
        raise
