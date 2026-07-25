# lib/python/

Python library barrel: `index.py`. Import definitions from there rather than
reaching into individual modules directly.

## file_io — generic filesystem primitives

- **`atomicWriteText(path, content) -> None`** — write `content` to `path`
  atomically (write to a sibling temp file, then swap it into place via
  `os.replace()`). No knowledge of what's being written or why.
- **`acquireExclusiveLock(path, timeout_seconds=5.0, retry_delay_seconds=0.05) -> LockHandle`**
  — acquire an exclusive mutex for `path` via exclusive creation of
  `<path>.lock`, spin-retrying until acquired or `timeout_seconds` elapses.
  Raises `LockTimeoutError` on timeout.
- **`releaseExclusiveLock(handle: LockHandle) -> None`** — release a lock
  acquired via `acquireExclusiveLock`. Safe to call even if already released.
- **`LockHandle`** — dataclass returned by `acquireExclusiveLock`; holds
  `lock_path`.
- **`LockTimeoutError`** — raised by `acquireExclusiveLock` when the timeout
  elapses before the lock could be acquired.

## date — generic date/time formatting helpers

- **`currentUtcIsoTimestamp() -> str`** — current UTC time as an ISO 8601
  string.
