# @manualReviewRequested: 2026-07-06
"""The in-memory representation of one already-read record, plus the encode/decode functions
that translate between that representation and a record file's raw text.
"""

from dataclasses import dataclass, field
from pathlib import Path

from core.storage.control_chars import (
    FIELD_SEPARATOR,
    KEY_VALUE_SEPARATOR,
    LIST_ITEM_SEPARATOR,
    TABLE_ROW_SEPARATOR,
)
from core.storage.errors import MalformedRecordError, ValidationError


@dataclass
class RecordBlock:
    """An already-read record held in memory, so a caller can read once, make many field
    get/set calls against memory, then save once.

    Fields:
        object_type: the owning directory name, e.g. "Task".
        record_id: the record's unique id.
        path: absolute path to the backing .rec file.
        fields: field name -> raw (still delimiter-encoded, for list/table fields) string value.
        is_dirty: True once any field has changed since load (or creation) and the last save.
    """

    object_type: str
    record_id: str
    path: Path
    fields: dict[str, str] = field(default_factory=dict)
    is_dirty: bool = False


def encode_fields(fields: dict[str, str]) -> str:
    """Turns a field dict into the raw text a record file stores.

    Inputs: fields, field name -> value (values may themselves be list/table-encoded strings).
    """
    return "".join(f"{key}{KEY_VALUE_SEPARATOR}{value}{FIELD_SEPARATOR}" for key, value in fields.items())


def decode_fields(text: str) -> dict[str, str]:
    """Parses a record file's raw text back into a field dict.

    Inputs: text, the full contents of a record file.
    Raises: MalformedRecordError if any field chunk is missing its key/value separator.
    """
    fields: dict[str, str] = {}
    chunks = text.split(FIELD_SEPARATOR)[:-1]  # trailing split entry is always "" after the terminator
    for chunk in chunks:
        if KEY_VALUE_SEPARATOR not in chunk:
            raise MalformedRecordError(f"Field chunk {chunk!r} has no key/value separator.")
        key, value = chunk.split(KEY_VALUE_SEPARATOR, 1)
        fields[key] = value
    return fields


def encode_list(items: list[str]) -> str:
    """Encodes a list-shaped value with its length in position 0, per the storage format's
    length-prefix rule.

    Inputs: items, the list of strings to encode.
    """
    return LIST_ITEM_SEPARATOR.join([str(len(items)), *items])


def decode_list(raw: str) -> list[str]:
    """Decodes a length-prefixed list-shaped value.

    Inputs: raw, the encoded string produced by encode_list.
    Raises: ValidationError if the declared length (position 0) doesn't match the actual item
        count — this is the format's cheap corruption check.
    """
    parts = raw.split(LIST_ITEM_SEPARATOR)
    declared_length = int(parts[0])
    items = parts[1:]
    if len(items) != declared_length:
        raise ValidationError(f"List declares length {declared_length} but contains {len(items)} items.")
    return items


def encode_table(rows: list[list[str]]) -> str:
    """Encodes a table-shaped (2D) value: a length-prefixed list of rows, where each row is
    itself a length-prefixed list.

    Inputs: rows, the table's rows, each a list of cell strings.
    """
    encoded_rows = [encode_list(row) for row in rows]
    return TABLE_ROW_SEPARATOR.join([str(len(rows)), *encoded_rows])


def decode_table(raw: str) -> list[list[str]]:
    """Decodes a length-prefixed table-shaped value.

    Inputs: raw, the encoded string produced by encode_table.
    Raises: ValidationError if the declared row count doesn't match the actual row count, or if
        any individual row fails its own length check.
    """
    parts = raw.split(TABLE_ROW_SEPARATOR)
    declared_row_count = int(parts[0])
    row_strings = parts[1:]
    if len(row_strings) != declared_row_count:
        raise ValidationError(f"Table declares {declared_row_count} rows but contains {len(row_strings)}.")
    return [decode_list(row_string) for row_string in row_strings]
