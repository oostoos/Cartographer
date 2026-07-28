"""Generic optional-int<->string encoding. No knowledge of what the int represents."""
from lib.language.python.strings.constants import EMPTY_STRING


def encodeOptionalIntAsString(value: int | None) -> str:
    """Encode an optional int as a string. None encodes to EMPTY_STRING."""
    return str(value) if value is not None else EMPTY_STRING


def decodeOptionalIntFromString(value: str) -> int | None:
    """Decode a string produced by encodeOptionalIntAsString back into an optional int."""
    return int(value) if value != EMPTY_STRING else None
