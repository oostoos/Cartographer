import threading

from src.common.backend.database.page_store import (
    PAGE_FILE_EXTENSION,
    buildPagePath,
    clearPageKey,
    deletePage,
    listPageIds,
    readPage,
    readPath,
    writePage,
    writePath,
)


def test_build_page_path_includes_extension(tmp_path):
    path = buildPagePath(tmp_path, "widget", "abc123")

    assert path == tmp_path / "widget" / f"abc123{PAGE_FILE_EXTENSION}"


def test_write_and_read_page_round_trips_fields(tmp_path):
    writePage(tmp_path, "widget", "1", ["alpha", "beta", "gamma"])

    assert readPage(tmp_path, "widget", "1") == ["alpha", "beta", "gamma"]


def test_read_page_missing_returns_none(tmp_path):
    assert readPage(tmp_path, "widget", "does-not-exist") is None


def test_read_page_with_embedded_real_newline_round_trips(tmp_path):
    writePage(tmp_path, "widget", "1", ["line one\nline two", "second field"])

    assert readPage(tmp_path, "widget", "1") == ["line one\nline two", "second field"]


def test_read_page_with_embedded_backslash_round_trips(tmp_path):
    writePage(tmp_path, "widget", "1", ["C:\\Users\\austi", "n"])

    assert readPage(tmp_path, "widget", "1") == ["C:\\Users\\austi", "n"]


def test_read_page_with_single_empty_string_field_round_trips(tmp_path):
    # Single-field pages (e.g. Profile's display_name) can legitimately be "" —
    # must not be misread as a zero-field page.
    writePage(tmp_path, "widget", "1", [""])

    assert readPage(tmp_path, "widget", "1") == [""]


def test_delete_page_removes_file(tmp_path):
    writePage(tmp_path, "widget", "1", ["value"])

    deletePage(tmp_path, "widget", "1")

    assert readPage(tmp_path, "widget", "1") is None


def test_delete_page_on_missing_page_is_noop(tmp_path):
    deletePage(tmp_path, "widget", "does-not-exist")  # should not raise


def test_list_page_ids_returns_all_written_ids(tmp_path):
    writePage(tmp_path, "widget", "1", ["a"])
    writePage(tmp_path, "widget", "2", ["b"])

    assert set(listPageIds(tmp_path, "widget")) == {"1", "2"}


def test_list_page_ids_returns_empty_list_when_page_key_directory_missing(tmp_path):
    assert listPageIds(tmp_path, "widget") == []


def test_clear_page_key_removes_all_pages(tmp_path):
    writePage(tmp_path, "widget", "1", ["a"])
    writePage(tmp_path, "widget", "2", ["b"])

    clearPageKey(tmp_path, "widget")

    assert listPageIds(tmp_path, "widget") == []


def test_write_and_read_path_round_trips_raw_content(tmp_path):
    path = tmp_path / "widget" / "1.page"

    writePath(path, "raw content")

    assert readPath(path) == "raw content"


def test_read_path_missing_returns_none(tmp_path):
    assert readPath(tmp_path / "does-not-exist.page") is None


def test_write_path_creates_parent_directories(tmp_path):
    path = tmp_path / "nested" / "dir" / "1.page"

    writePath(path, "content")

    assert readPath(path) == "content"


def test_write_page_serializes_concurrent_writers(tmp_path):
    def _write(value: str) -> None:
        writePage(tmp_path, "widget", "1", [value])

    threads = [threading.Thread(target=_write, args=(f"value-{i}",)) for i in range(20)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    result = readPage(tmp_path, "widget", "1")
    assert result is not None
    assert len(result) == 1
    assert result[0].startswith("value-")
