# @manualReviewRequested: 2026-07-06
"""The delimiter scheme every record file uses, defined once so no other module hardcodes a
control character. Using non-printable ASCII separator characters (rather than commas, colons,
newlines, etc) means user-typed text can never accidentally collide with a delimiter.
"""

from core.storage.errors import ValidationError

# Separates a field's key from its value, e.g. "title<KEY_VALUE_SEPARATOR>Buy milk".
KEY_VALUE_SEPARATOR = "\x1f"

# Terminates one field within a record, so fields can be split without a trailing empty entry
# needing special handling elsewhere.
FIELD_SEPARATOR = "\x1e"

# Separates items within a list-shaped field value.
LIST_ITEM_SEPARATOR = "\x1d"

# Separates rows within a table-shaped (2D) field value.
TABLE_ROW_SEPARATOR = "\x1c"

# Every reserved delimiter, used to guard free-text input against corrupting the format.
ALL_CONTROL_CHARACTERS = (
    KEY_VALUE_SEPARATOR,
    FIELD_SEPARATOR,
    LIST_ITEM_SEPARATOR,
    TABLE_ROW_SEPARATOR,
)

# Every record's first two fields, present on every object type for self-validation.
RECORD_TYPE_FIELD = "__type__"
RECORD_ID_FIELD = "id"


def raise_if_contains_control_characters(value: str) -> None:
    """Guards free-text input against corrupting the record format.

    Inputs: value, the raw string a caller is about to store.
    Raises: ValidationError if value contains any reserved control character.
    """
    for character in ALL_CONTROL_CHARACTERS:
        if character in value:
            raise ValidationError(
                f"Value contains a reserved control character (0x{ord(character):02x}) "
                "and cannot be stored."
            )
