# Backend app

Feature code, one directory per domain — `auth`, `tasks`, `projects`, `recurrence`, `journals`,
`settings`. Each domain owns its object module(s) (e.g. `tasks/task.py`), its Flask blueprint
(`*_routes.py`), and a colocated `tests/` directory. Each has its own short CLAUDE.md.

Every object module follows the exact shape of `tasks/task.py` (the reference implementation):
`OBJECT_TYPE`/`FIELD_*` constants, `create`/`load`/`save`/`delete`/`list_ids`/`list_all`/`find`/
`find_one`, per-field getters/setters using the `record_id=`/`block=` convention, and an
`object_registry.register(...)` call at the bottom of the file. Use the `new-db-object-type`
skill to scaffold a new one rather than hand-rolling it.

Route modules serialize `RecordBlock`s to camelCase JSON dicts (see any `_serialize` function)
and are gated by `@login_required` from `core/auth/login_guard.py` (auth's own routes and the
health check are the only exceptions).
