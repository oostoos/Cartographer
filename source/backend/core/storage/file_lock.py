# @manualReviewRequested: 2026-07-06
"""Guards a record file against two writers racing each other. Reader-vs-writer safety instead
comes from atomic_write's os.replace, so only writers need to take this lock.
"""

from contextlib import contextmanager
from pathlib import Path

import portalocker

from core.storage.errors import LockTimeoutError

# How long a writer waits for another writer to release the lock before giving up.
LOCK_TIMEOUT_SECONDS = 5

# Suffix for the sidecar file that is actually locked (the record file itself is never locked
# directly, so atomic_write's temp-file swap is never blocked by a held lock).
LOCK_FILE_SUFFIX = ".lock"


@contextmanager
def hold_write_lock(record_path: Path):
    """Acquires exclusive access for writing one record, blocking any other writer targeting
    the same record until this block exits.

    Inputs: record_path, the path to the .rec file about to be written.
    Raises: LockTimeoutError if another writer still holds the lock after LOCK_TIMEOUT_SECONDS.
    """
    lock_path = record_path.with_name(record_path.name + LOCK_FILE_SUFFIX)
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        with portalocker.Lock(str(lock_path), timeout=LOCK_TIMEOUT_SECONDS):
            yield
    except portalocker.exceptions.LockException as error:
        raise LockTimeoutError(f"Timed out waiting for the write lock on {record_path}") from error
