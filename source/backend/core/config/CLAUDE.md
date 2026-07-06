<!-- @manualReviewRequested: 2026-07-06 -->
# Config

`settings.py` is the single documented registry of every value `.env` can hold — see
`SETTINGS_REGISTRY`. Adding a new `.env`-able setting means adding one `Setting(...)` entry here
(name, description, default, required) — never reading `os.environ` directly anywhere else in
the backend. Use `get_setting`/`get_setting_bool`/`get_setting_int` for optional values,
`require_setting` for ones that must fail loudly at startup if unset (see `app_factory.create_app`
for the pattern).
