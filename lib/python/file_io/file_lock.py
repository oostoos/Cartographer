"""Generic exclusive file lock via O_CREAT|O_EXCL lockfile creation. Works on any file, for any purpose."""
import os
import time
from dataclasses import dataclass
from pathlib import Path

LOCK_FILE_SUFFIX = ".lock"
DEFAULT_TIMEOUT_SECONDS = 5.0
DEFAULT_RETRY_DELAY_SECONDS = 0.05


class LockTimeoutError(TimeoutError):
    """Raised when an exclusive lock could not be acquired before the timeout elapsed."""


@dataclass
class LockHandle:
    """Handle to an acquired exclusive lock. Pass to releaseExclusiveLock to release it."""

    lock_path: Path


def acquireExclusiveLock(
    path: Path,
    timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
    retry_delay_seconds: float = DEFAULT_RETRY_DELAY_SECONDS,
) -> LockHandle:
    """Acquire an exclusive mutex for `path` by exclusively creating `<path>.lock`.

    Spin-retries until the lock file can be created or `timeout_seconds` elapses.
    Raises LockTimeoutError if the timeout elapses first.

    Retries on PermissionError as well as FileExistsError: on Windows, a
    concurrent create/delete of the same lock file can transiently surface as
    "access denied" rather than "file exists" while the OS settles the race.
    """
    lock_path = Path(f"{path}{LOCK_FILE_SUFFIX}")
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    deadline = time.monotonic() + timeout_seconds

    while True:
        try:
            file_descriptor = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.close(file_descriptor)
            return LockHandle(lock_path=lock_path)
        except (FileExistsError, PermissionError):
            if time.monotonic() >= deadline:
                raise LockTimeoutError(f"Timed out waiting for lock on {path}")
            time.sleep(retry_delay_seconds)


def releaseExclusiveLock(handle: LockHandle) -> None:
    """Release a lock acquired via acquireExclusiveLock. Safe to call even if already released."""
    handle.lock_path.unlink(missing_ok=True)
