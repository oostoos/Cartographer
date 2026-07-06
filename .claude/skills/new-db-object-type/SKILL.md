---
name: new-db-object-type
description: Scaffolds a new file-based database object type (module + tests) matching Cartographer's standard shape, using app/tasks/task.py as the reference implementation. Use whenever a new kind of record needs to be persisted in the custom database, instead of hand-writing the module.
---

# New DB object type

Cartographer's file-based database (see `source/backend/core/storage/CLAUDE.md`) requires every
object type's Python module to have an identical shape, so nothing drifts between them. This
skill scaffolds that shape exactly.

## When to use

The user (or a task) needs a new kind of record persisted in the database — e.g. "add a Note
object type" or "we need to store X." Don't hand-roll a new module; follow these steps.

## Steps

1. **Pick the object type name** (PascalCase, e.g. `Note`) and its **domain directory** under
   `source/backend/app/<domain>/` — reuse an existing domain (`tasks`, `projects`, `recurrence`,
   `journals`, `settings`, `auth`) if the type conceptually belongs there; only create a new
   domain directory if it truly doesn't fit anywhere existing.

2. **List the fields** the user needs, and their types (string, bool, date, optional date,
   optional int, list of strings). Map each to the right encode/decode pair from
   `core/storage/field_types.py` (`encode_bool`/`decode_bool`, `encode_date`/`decode_date`,
   `encode_optional_date`/`decode_optional_date`, `encode_optional_int`/`decode_optional_int`) or
   `core/storage/record_block.py` (`encode_list`/`decode_list` for list-shaped fields). Plain
   strings need no encoding.

3. **Create `source/backend/app/<domain>/<object_type_snake_case>.py`** by copying the exact
   shape of `source/backend/app/tasks/task.py`:
   - `OBJECT_TYPE = "<ObjectType>"` and one `FIELD_<NAME> = "<name>"` constant per field.
   - `create(...)` — validates any free-text fields with `raise_if_contains_control_characters`,
     builds `initial_fields`, calls `record_store.create_record(OBJECT_TYPE, initial_fields)`.
   - `load`, `save`, `delete`, `list_ids`, `list_all`, `find`, `find_one` — thin wrappers around
     the matching `record_store` function, exactly like `task.py`'s.
   - One `get_<field>`/`set_<field>` pair per field, each accepting exactly one of
     `<object_type_snake_case>_id=` or `block=` (never both, never neither) via
     `record_store.resolve_block`. Setters on free-text fields validate with
     `raise_if_contains_control_characters` before writing. Fields with no setter (e.g.
     `created_at`) are intentionally immutable — say so in the docstring, don't write one.
   - A private `_set_field(field_name, raw_value, <id>, block)` helper identical in shape to
     `task.py`'s, if there's more than one simple setter.
   - `object_registry.register(OBJECT_TYPE, sys.modules[__name__])` as the very last line.

4. **Create `source/backend/app/<domain>/tests/test_<object_type_snake_case>.py`** (add a
   `tests/__init__.py` too if the domain doesn't already have a tests directory) covering, at
   minimum: `create` sets every field to its given-or-default value; `load` raises
   `RecordNotFoundError` for a missing record; a one-shot setter saves immediately; a setter
   rejects a value containing a reserved control character (if any field is free text);
   `find` filters correctly. Match the test style and naming in `app/tasks/tests/test_task.py`.

5. **Run the new tests** before wiring up anything else:
   `source/backend/.venv/Scripts/python.exe -m pytest source/backend/app/<domain>/tests/test_<object_type_snake_case>.py -q`
   — the object module should be fully correct on its own before any route or UI touches it.

6. Routes and frontend UI are a separate, explicit step — this skill only scaffolds the object
   module and its tests. Don't add a `*_routes.py` or frontend files unless asked to.
