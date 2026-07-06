<!-- @manualReviewRequested: 2026-07-06 -->
# Settings (backend)

`user_preference.py` is a singleton object type — there is only ever one local user, so use
`get_or_create_singleton()` rather than tracking an id anywhere. Don't confuse this with
`core/config/settings.py`: that module is `.env`-backed deployment/secret configuration; this
one is in-app user preferences (currently just `display_name`) stored in the regular file
database like any other object type.

`POST /api/settings/purge-all-data` wipes every object type under `DATA_ROOT` via
`core.storage.record_store.purge_all_data()` — a full local reset. It doesn't touch auth
(username/password live in `.env`, not the file database), so it can't lock the user out.
