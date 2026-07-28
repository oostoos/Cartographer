# lib/language/python/

Python library barrel: `index.py`. Import definitions from there rather than
reaching into individual modules directly.

## file_io — generic filesystem primitives

- **`atomicWriteText(path, content) -> None`** — write `content` to `path`
  atomically (write to a sibling temp file, then swap it into place via
  `os.replace()`). No knowledge of what's being written or why.
- **`acquireExclusiveLock(path, timeout_seconds=5.0, retry_delay_seconds=0.05) -> LockHandle`**
  — acquire an exclusive mutex for `path` via exclusive creation of
  `<path>.lock`, spin-retrying until acquired or `timeout_seconds` elapses.
  Raises `LockTimeoutError` on timeout.
- **`releaseExclusiveLock(handle: LockHandle) -> None`** — release a lock
  acquired via `acquireExclusiveLock`. Safe to call even if already released.
- **`LockHandle`** — dataclass returned by `acquireExclusiveLock`; holds
  `lock_path`.
- **`LockTimeoutError`** — raised by `acquireExclusiveLock` when the timeout
  elapses before the lock could be acquired.

## date — generic date/time formatting helpers

- **`currentUtcIsoTimestamp() -> str`** — current UTC time as an ISO 8601
  string.

## collections — generic dict/list-building helpers

- **`buildDictFromKeysAndValues(keys, values) -> dict`** — zips `keys` and
  `values` into a dict, paired by position. If the lists differ in length,
  extra items in the longer one are dropped (same truncate-to-shorter
  behavior as the underlying `zip()`).
- **`computeNextOrder(existing_orders: list[float]) -> float`** — the order
  value a newly created record should get: one past the current highest.
- **`reorderRecordsByIds(record_ids, get_record, save_record_at_order) -> None`**
  — reassigns order so records sort in the given id sequence, via caller-
  supplied fetch/save callbacks. Unknown ids are skipped. No knowledge of
  what a "record" is.

## validation — generic type-check predicates

- **`isString(value) -> bool`** — true if `value` is a `str`.
- **`isDict(value) -> bool`** — true if `value` is a `dict`.
- **`isList(value) -> bool`** — true if `value` is a `list`.
- **`isInt(value) -> bool`** — true if `value` is an `int`. Excludes `bool`
  (a `bool` is an `int` subclass in Python, but isn't one for validation
  purposes).
- **`isIntInRange(value: int, minimum: int, maximum: int) -> bool`** — true
  if `minimum <= value <= maximum`.
- **`isMultipleOf(value: int, step: int) -> bool`** — true if `value` is an
  exact multiple of `step`.
- **`isIsoDateString(value) -> bool`** — true if `value` is a `str`
  parseable as an ISO 8601 date (`YYYY-MM-DD`).

## strings — generic string constants and encoding helpers

- **`EMPTY_STRING`** — `""`.
- **`encodeBoolAsString(value: bool) -> str`** — encodes a bool as
  `"true"`/`"false"`.
- **`decodeBoolFromString(value: str) -> bool`** — decodes `"true"`/`"false"`
  back into a bool. Any value other than `"true"` decodes to `False`.
- **`encodeOptionalIntAsString(value: int | None) -> str`** — encodes an
  optional int as a string; `None` encodes to `EMPTY_STRING`.
- **`decodeOptionalIntFromString(value: str) -> int | None`** — decodes a
  string produced by `encodeOptionalIntAsString` back into an optional int.
