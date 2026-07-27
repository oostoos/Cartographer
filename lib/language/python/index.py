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

# collections — generic dict/list-building helpers
from lib.python.collections.dict_utils import buildDictFromKeysAndValues

# validation — generic type-check predicates
from lib.python.validation.type_checks import isDict, isList, isString

# strings — generic string constants and encoding helpers
from lib.python.strings.constants import EMPTY_STRING
from lib.python.strings.bool_codec import decodeBoolFromString, encodeBoolAsString

__all__ = [
    "atomicWriteText",
    "LockHandle",
    "LockTimeoutError",
    "acquireExclusiveLock",
    "releaseExclusiveLock",
    "currentUtcIsoTimestamp",
    "buildDictFromKeysAndValues",
    "isDict",
    "isList",
    "isString",
    "EMPTY_STRING",
    "encodeBoolAsString",
    "decodeBoolFromString",
]
