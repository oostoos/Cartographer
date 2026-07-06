"""Scalar value encoders/decoders shared by every object module's field getters and setters, so
a bool/date/optional-int field is represented identically no matter which object type holds it.
"""

from datetime import date

# The two raw string values a bool field is ever stored as.
BOOL_TRUE_RAW = "1"
BOOL_FALSE_RAW = "0"


def encode_bool(value: bool) -> str:
    """Encodes a boolean as a record field value."""
    return BOOL_TRUE_RAW if value else BOOL_FALSE_RAW


def decode_bool(raw: str) -> bool:
    """Decodes a boolean previously written by encode_bool."""
    return raw == BOOL_TRUE_RAW


def encode_date(value: date) -> str:
    """Encodes a required date as a record field value."""
    return value.isoformat()


def decode_date(raw: str) -> date:
    """Decodes a required date previously written by encode_date."""
    return date.fromisoformat(raw)


def encode_optional_date(value: date | None) -> str:
    """Encodes a date field that may be unset (an empty string means unset)."""
    return value.isoformat() if value is not None else ""


def decode_optional_date(raw: str) -> date | None:
    """Decodes a date field previously written by encode_optional_date."""
    return date.fromisoformat(raw) if raw else None


def encode_optional_int(value: int | None) -> str:
    """Encodes an integer field that may be unset (an empty string means unset)."""
    return str(value) if value is not None else ""


def decode_optional_int(raw: str) -> int | None:
    """Decodes an integer field previously written by encode_optional_int."""
    return int(raw) if raw else None
