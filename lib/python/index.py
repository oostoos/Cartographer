"""Python library barrel: generic, stack-agnostic building blocks.

Import from here rather than reaching into individual library modules directly.
"""

# file_io — generic filesystem primitives (atomic writes, exclusive locks)
from lib.python.file_io.atomic_write import atomicWriteText
from lib.python.file_io.file_lock import (
    LockHandle,
    LockTimeoutError,
    acquireExclusiveLock,
    releaseExclusiveLock,
)

# date — generic date/time formatting helpers
from lib.python.date.utc_timestamp import currentUtcIsoTimestamp

__all__ = [
    "atomicWriteText",
    "LockHandle",
    "LockTimeoutError",
    "acquireExclusiveLock",
    "releaseExclusiveLock",
    "currentUtcIsoTimestamp",
]
