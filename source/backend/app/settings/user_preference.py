"""UserPreference: the single local user's in-app preferences (as opposed to the .env-backed
settings in core/config/settings.py, which are deployment/secret configuration). Since there is
only ever one local user, this is a singleton — see get_or_create_singleton.
"""

import sys
from datetime import datetime

from core.storage import object_registry, record_store
from core.storage.control_chars import raise_if_contains_control_characters
from core.storage.record_block import RecordBlock

OBJECT_TYPE = "UserPreference"

FIELD_DISPLAY_NAME = "display_name"
FIELD_CREATED_AT = "created_at"

# The display name shown before the user has ever set one.
DEFAULT_DISPLAY_NAME = ""


# --- --- --- ---
# Standard functions


def create(display_name: str = DEFAULT_DISPLAY_NAME) -> RecordBlock:
    """Creates the user preference record and saves it immediately.

    Inputs: display_name, optional.
    Raises: ValidationError if display_name contains a reserved control character.
    """
    raise_if_contains_control_characters(display_name)
    initial_fields = {
        FIELD_DISPLAY_NAME: display_name,
        FIELD_CREATED_AT: datetime.now().isoformat(),
    }
    return record_store.create_record(OBJECT_TYPE, initial_fields)


def load(user_preference_id: str) -> RecordBlock:
    """Reads a user preference record from disk.

    Raises: RecordNotFoundError if no matching record exists.
    """
    return record_store.load_block(OBJECT_TYPE, user_preference_id)


def save(block: RecordBlock) -> None:
    """Writes a user preference block to disk if it has unsaved changes."""
    record_store.save_block(block)


def delete(user_preference_id: str) -> None:
    """Deletes a user preference record. A no-op if it doesn't exist."""
    record_store.delete_record(OBJECT_TYPE, user_preference_id)


def list_ids() -> list[str]:
    """Lists every user preference record's id without reading its contents."""
    return record_store.list_record_ids(OBJECT_TYPE)


def list_all() -> list[RecordBlock]:
    """Loads every user preference record. In practice there is ever only one — see
    load_singleton.
    """
    return record_store.list_all_blocks(OBJECT_TYPE)


def find(**raw_field_filters: str) -> list[RecordBlock]:
    """Loads every user preference record whose raw field values match every given filter."""
    return record_store.find_blocks(OBJECT_TYPE, **raw_field_filters)


def find_one(**raw_field_filters: str) -> RecordBlock | None:
    """Loads the first user preference record matching every given filter, or None."""
    return record_store.find_one_block(OBJECT_TYPE, **raw_field_filters)


def load_singleton() -> RecordBlock | None:
    """Loads the single local user's preference record, or None if it hasn't been created yet."""
    all_records = list_all()
    return all_records[0] if all_records else None


def get_or_create_singleton() -> RecordBlock:
    """Loads the single local user's preference record, creating it with defaults on first use."""
    existing = load_singleton()
    return existing if existing is not None else create()


# --- --- --- ---
# Field getters and setters
#
# Every function below accepts exactly one of user_preference_id= (one-shot) or block=
# (batched) — see core/storage/CLAUDE.md.


def get_id(user_preference_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads a user preference record's id."""
    return record_store.resolve_block(OBJECT_TYPE, user_preference_id, block).record_id


def get_display_name(user_preference_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the user's display name."""
    return record_store.resolve_block(OBJECT_TYPE, user_preference_id, block).fields[FIELD_DISPLAY_NAME]


def set_display_name(
    value: str, user_preference_id: str | None = None, *, block: RecordBlock | None = None
) -> RecordBlock:
    """Sets the user's display name.

    Raises: ValidationError if value contains a reserved control character.
    """
    raise_if_contains_control_characters(value)
    return _set_field(FIELD_DISPLAY_NAME, value, user_preference_id, block)


def get_created_at(user_preference_id: str | None = None, *, block: RecordBlock | None = None) -> str:
    """Reads the ISO-8601 timestamp this record was created at. Immutable — there is no setter."""
    return record_store.resolve_block(OBJECT_TYPE, user_preference_id, block).fields[FIELD_CREATED_AT]


# --- --- --- ---
# Internal helpers


def _set_field(
    field_name: str, raw_value: str, user_preference_id: str | None, block: RecordBlock | None
) -> RecordBlock:
    """Applies one field change, saving immediately unless the caller is batching via block=."""
    target_block = record_store.resolve_block(OBJECT_TYPE, user_preference_id, block)
    target_block.fields[field_name] = raw_value
    target_block.is_dirty = True
    if block is None:
        save(target_block)
    return target_block


object_registry.register(OBJECT_TYPE, sys.modules[__name__])
