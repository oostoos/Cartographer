# lib/stack/parchment/

A bespoke flat-file record-storage engine. Barrel: `index.py`. Import
definitions from there rather than reaching into individual modules directly.

Knows this storage format (the `.page` extension, the escaping scheme, one
file per record) but nothing about what a record represents (Task, Profile,
...) — that knowledge belongs to the consuming app's own database layer
(e.g. `src/backend/database`).

## ids — record id generation

- **`generateRecordId() -> str`** — a new unique record id (a uuid4 hex
  string).

## page_store — the flat-file page storage engine

- **`buildPagePath(data_root, page_key, page_id) -> Path`** — the on-disk
  path for a page with the given key and id.
- **`writePage(data_root, page_key, page_id, fields: list[str]) -> None`**
  — write a page's fields (one per line) to disk, atomically and under an
  exclusive lock.
- **`readPage(data_root, page_key, page_id) -> list[str] | None`** — read a
  page's fields, or `None` if no page exists for that id.
- **`writePath(path, content: str) -> None`** — write raw content to a path,
  atomically and under an exclusive lock. No knowledge of page structure.
- **`readPath(path) -> str | None`** — read raw content from a path, or
  `None` if it doesn't exist.
- **`deletePage(data_root, page_key, page_id) -> None`** — delete a page if
  it exists. A no-op if it doesn't.
- **`listPageIds(data_root, page_key) -> list[str]`** — ids of every page
  currently stored under the given key.
- **`clearPageKey(data_root, page_key) -> None`** — delete every page stored
  under the given key.

## list_store — a list primitive built on page_store

Line 0 of the underlying page is the element count, lines 1..n are the
elements. Elements are plain strings, so an element can itself be another
list's record id, giving 2D/3D composition for free.

- **`createList(data_root, object_type, list_id, elements: list[str]) -> None`**
  — create (or overwrite) a list record with the given elements, in order.
- **`readList(data_root, object_type, list_id) -> list[str] | None`** — a
  list's elements in order, or `None` if no list exists with that id.
- **`deleteList(data_root, object_type, list_id) -> None`** — delete a list
  if it exists. A no-op if it doesn't.
- **`appendToList(data_root, object_type, list_id, element: str) -> list[str]`**
  — append an element to the end of a list, creating it first if needed.
