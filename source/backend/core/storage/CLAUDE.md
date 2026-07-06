# Storage (the hand-built database)

Files are the database — one record = one text file, one directory per object type, under
`DATA_ROOT` (see `core/config/settings.py`). No SQL, no embedded DB engine.

**Never write a one-off file read/write.** Every object module (`app/*/*.py`, e.g. `task.py`)
must build its getters/setters/standard functions on top of `record_store.py`'s `create_record`,
`load_block`, `save_block`, `delete_record`, `list_record_ids`, `list_all_blocks` — see `task.py`
once it exists for the reference shape. Adding a new object type? Use the `new-db-object-type`
skill instead of hand-rolling this.

**Delimiters** (`control_chars.py`): `\x1f` between a field's key and value, `\x1e` terminates a
field, `\x1d` separates list items, `\x1c` separates table rows. Never hardcode these elsewhere —
import the constants. Any setter taking free text must call
`raise_if_contains_control_characters` on it first.

**Lists/tables** (`record_block.py`): `encode_list`/`decode_list` and `encode_table`/`decode_table`
always store the item/row count in position 0, so a corrupted length is caught immediately as a
`ValidationError` rather than silently misreading the structure.

**The `record_id=` / `block=` convention**: every per-field getter/setter takes *either*
`record_id=` (one-shot: loads/saves for you) *or* `block=` (batches changes in memory; caller
calls `save()` once when done) — never both, never neither. This is what avoids one disk read per
field access when a caller needs several fields from the same record.

**References**: a reference field is just the target's plain id string. `object_registry.py`
resolves it — object modules must call `register(object_type, module)` at import time.

**Locking/atomicity**: `file_lock.py` (a sidecar `.lock` file, `portalocker`) serializes writers;
`atomic_write.py` (write-then-`os.replace`) means readers never see a half-written file. Don't
add read-locking — it isn't needed and isn't part of this design.

**`DATA_ROOT` resolution**: a relative `DATA_ROOT` (the default, `./data`) is anchored to
`record_store.REPO_ROOT` (computed from this file's own location), not the process's current
working directory — so it means the same directory no matter how the backend was launched.
Never resolve it against `os.getcwd()`.

**Full reset**: `record_store.purge_all_data()` deletes every object-type directory under the
data root wholesale (used by `POST /api/settings/purge-all-data`). It's the one place bulk,
cross-object-type deletion happens — don't reimplement it per object module.
