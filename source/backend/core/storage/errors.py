"""Every error the storage layer raises directly. Callers (routes, engines) catch these by type
rather than parsing error messages.
"""


class StorageError(Exception):
    """Base class for every error raised directly by the storage layer."""


class RecordNotFoundError(StorageError):
    """Raised when a record id has no matching file on disk."""


class ValidationError(StorageError):
    """Raised when a value would corrupt the record format (a reserved control character, or a
    list/table whose declared length doesn't match its actual item count).
    """


class MalformedRecordError(StorageError):
    """Raised when a record file on disk cannot be parsed into fields (missing delimiters,
    truncated content, or similar corruption).
    """


class LockTimeoutError(StorageError):
    """Raised when a write lock on a record could not be acquired before the timeout elapsed."""
