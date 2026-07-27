"""Generic boolean<->string encoding. No knowledge of what the boolean represents."""

STRING_TRUE = "true"
STRING_FALSE = "false"


def encodeBoolAsString(value: bool) -> str:
    """Encode a bool as "true"/"false"."""
    return STRING_TRUE if value else STRING_FALSE


def decodeBoolFromString(value: str) -> bool:
    """Decode "true"/"false" back into a bool. Any value other than "true" decodes to False."""
    return value == STRING_TRUE
