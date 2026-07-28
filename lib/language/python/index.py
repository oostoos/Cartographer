"""Python library barrel: generic, stack-agnostic building blocks.

Import from here rather than reaching into individual library modules directly.
"""

# file_io — generic filesystem primitives (atomic writes, exclusive locks)
from lib.language.python.file_io.atomic_write import atomicWriteText
from lib.language.python.file_io.file_lock import (
    LockHandle,
    LockTimeoutError,
    acquireExclusiveLock,
    releaseExclusiveLock,
)

# date — generic date/time formatting helpers
from lib.language.python.date.utc_timestamp import currentUtcIsoTimestamp

# collections — generic dict/list-building helpers
from lib.language.python.collections.dict_utils import buildDictFromKeysAndValues
from lib.language.python.collections.ordering import computeNextOrder, reorderRecordsByIds

# validation — generic type-check predicates
from lib.language.python.validation.type_checks import isDict, isInt, isList, isString
from lib.language.python.validation.numeric_checks import isIntInRange, isMultipleOf
from lib.language.python.validation.date_checks import isIsoDateString

# strings — generic string constants and encoding helpers
from lib.language.python.strings.constants import EMPTY_STRING
from lib.language.python.strings.bool_codec import decodeBoolFromString, encodeBoolAsString
from lib.language.python.strings.optional_int_codec import (
    decodeOptionalIntFromString,
    encodeOptionalIntAsString,
)

__all__ = [
    "atomicWriteText",
    "LockHandle",
    "LockTimeoutError",
    "acquireExclusiveLock",
    "releaseExclusiveLock",
    "currentUtcIsoTimestamp",
    "buildDictFromKeysAndValues",
    "computeNextOrder",
    "reorderRecordsByIds",
    "isDict",
    "isList",
    "isString",
    "isInt",
    "isIntInRange",
    "isMultipleOf",
    "isIsoDateString",
    "EMPTY_STRING",
    "encodeBoolAsString",
    "decodeBoolFromString",
    "encodeOptionalIntAsString",
    "decodeOptionalIntFromString",
]
