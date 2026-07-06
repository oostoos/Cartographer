"""Generic, object-type-agnostic primitives every per-object module (Task, Project, ...) builds
its create/load/save/delete/list/find functions on top of.
"""

import shutil
from pathlib import Path

from core.config.settings import SETTING_DATA_ROOT, get_setting
from core.storage.atomic_write import write_text_atomically
from core.storage.control_chars import RECORD_ID_FIELD, RECORD_TYPE_FIELD
from core.storage.errors import RecordNotFoundError
from core.storage.file_lock import hold_write_lock
from core.storage.record_block import RecordBlock, decode_fields, encode_fields
from core.utils.ids import new_id

# The repo root a relative DATA_ROOT is anchored to, so its meaning doesn't depend on whatever
# cwd the backend process happened to be started from.
REPO_ROOT = Path(__file__).resolve().parents[2]

# Extension every record file uses.
RECORD_FILE_EXTENSION = ".rec"


def get_data_root() -> Path:
    """Returns the filesystem root that every object type's directory lives under.

    Notes: reads the DATA_ROOT setting fresh on every call (rather than caching it at import
        time) so tests can point it at a temporary directory. A relative DATA_ROOT is resolved
        against REPO_ROOT rather than the process's cwd, so it means the same directory no
        matter how the backend was launched.
    """
    path = Path(get_setting(SETTING_DATA_ROOT))
    if not path.is_absolute():
        path = REPO_ROOT / path
    return path.resolve()


def purge_all_data() -> None:
    """Deletes every record of every object type, for a full local reset.

    Notes: removes each object-type directory under the data root entirely; they're recreated
        on next access by object_type_directory's mkdir.
    """
    data_root = get_data_root()
    if not data_root.exists():
        return
    for entry in data_root.iterdir():
        if entry.is_dir():
            shutil.rmtree(entry)


def object_type_directory(object_type: str) -> Path:
    """Returns (and creates, if missing) the directory a given object type's records live in.

    Inputs: object_type, e.g. "Task".
    """
    directory = get_data_root() / object_type
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def record_path(object_type: str, record_id: str) -> Path:
    """Returns the path a given record's file lives (or would live) at."""
    return object_type_directory(object_type) / f"{record_id}{RECORD_FILE_EXTENSION}"


def create_record(object_type: str, initial_fields: dict[str, str] | None = None) -> RecordBlock:
    """Creates a brand-new record with a freshly generated id, writes it to disk, and returns
    its block.

    Inputs: object_type, e.g. "Task"; initial_fields, any fields beyond __type__/id to set.
    """
    record_id = new_id()
    fields = {RECORD_TYPE_FIELD: object_type, RECORD_ID_FIELD: record_id, **(initial_fields or {})}
    block = RecordBlock(
        object_type=object_type,
        record_id=record_id,
        path=record_path(object_type, record_id),
        fields=fields,
        is_dirty=True,
    )
    save_block(block)
    return block


def load_block(object_type: str, record_id: str) -> RecordBlock:
    """Reads a record's file from disk into memory.

    Inputs: object_type, e.g. "Task"; record_id, the record to load.
    Raises: RecordNotFoundError if no matching file exists.
    """
    path = record_path(object_type, record_id)
    if not path.exists():
        raise RecordNotFoundError(f"No {object_type} record with id {record_id!r}.")
    text = path.read_text(encoding="utf-8")
    return RecordBlock(
        object_type=object_type,
        record_id=record_id,
        path=path,
        fields=decode_fields(text),
        is_dirty=False,
    )


def save_block(block: RecordBlock) -> None:
    """Writes a block to disk if (and only if) it has unsaved changes.

    Inputs: block, the record to persist.
    Notes: a no-op when block.is_dirty is False, so accumulating several set_* calls against one
        block and saving once costs a single disk write.
    """
    if not block.is_dirty:
        return
    with hold_write_lock(block.path):
        write_text_atomically(block.path, encode_fields(block.fields))
    block.is_dirty = False


def delete_record(object_type: str, record_id: str) -> None:
    """Deletes a record's file from disk. A no-op if it doesn't exist.

    Inputs: object_type, e.g. "Task"; record_id, the record to delete.
    """
    record_path(object_type, record_id).unlink(missing_ok=True)


def list_record_ids(object_type: str) -> list[str]:
    """Lists every record id for an object type without reading any file contents.

    Inputs: object_type, e.g. "Task".
    """
    directory = object_type_directory(object_type)
    return [path.stem for path in directory.glob(f"*{RECORD_FILE_EXTENSION}")]


def list_all_blocks(object_type: str) -> list[RecordBlock]:
    """Loads every record of an object type into memory.

    Inputs: object_type, e.g. "Task".
    Notes: reads every matching file — expensive relative to list_record_ids, so callers should
        prefer list_record_ids when only ids are needed.
    """
    return [load_block(object_type, record_id) for record_id in list_record_ids(object_type)]


def find_blocks(object_type: str, **raw_field_filters: str) -> list[RecordBlock]:
    """Loads every record of an object type whose raw field values match every given filter.

    Inputs: object_type, e.g. "Task"; raw_field_filters, field name -> exact raw value to match.
    Notes: compares raw (still delimiter-encoded) field strings, so callers filtering by a typed
        value (a bool, date, list, ...) must encode it the same way its setter would first.
    """
    return [
        block
        for block in list_all_blocks(object_type)
        if all(block.fields.get(key) == value for key, value in raw_field_filters.items())
    ]


def find_one_block(object_type: str, **raw_field_filters: str) -> RecordBlock | None:
    """Loads the first record of an object type matching every given filter, or None if none do.

    Inputs: same as find_blocks.
    """
    return next(iter(find_blocks(object_type, **raw_field_filters)), None)


def resolve_block(object_type: str, record_id: str | None, block: RecordBlock | None) -> RecordBlock:
    """Returns the RecordBlock a field getter/setter should operate on — this is what implements
    the "provide record_id= for a one-shot call, or block= to batch several calls" convention.

    Inputs: object_type, e.g. "Task"; record_id, the record to load if block isn't given; block,
        an already-loaded record to use directly instead of loading one.
    Raises: ValueError if neither or both of record_id/block are given.
    """
    if (record_id is None) == (block is None):
        raise ValueError("Provide exactly one of record_id or block.")
    return block if block is not None else load_block(object_type, record_id)
