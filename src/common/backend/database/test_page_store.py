import threading

from src.common.backend.database.page_store import (
    PAGE_FILE_EXTENSION,
    buildRecordPath,
    clearObjectType,
    deleteRecord,
    listRecordIds,
    readRecord,
    writeRecord,
)


def test_build_record_path_includes_extension(tmp_path):
    path = buildRecordPath(tmp_path, "widget", "abc123")

    assert path == tmp_path / "widget" / f"abc123{PAGE_FILE_EXTENSION}"


def test_write_and_read_record_round_trips_fields(tmp_path):
    writeRecord(tmp_path, "widget", "1", ["alpha", "beta", "gamma"])

    assert readRecord(tmp_path, "widget", "1") == ["alpha", "beta", "gamma"]


def test_read_record_missing_returns_none(tmp_path):
    assert readRecord(tmp_path, "widget", "does-not-exist") is None


def test_read_record_with_embedded_real_newline_round_trips(tmp_path):
    writeRecord(tmp_path, "widget", "1", ["line one\nline two", "second field"])

    assert readRecord(tmp_path, "widget", "1") == ["line one\nline two", "second field"]


def test_read_record_with_embedded_backslash_round_trips(tmp_path):
    writeRecord(tmp_path, "widget", "1", ["C:\\Users\\austi", "n"])

    assert readRecord(tmp_path, "widget", "1") == ["C:\\Users\\austi", "n"]


def test_read_record_with_single_empty_string_field_round_trips(tmp_path):
    # Single-field records (e.g. Profile's display_name) can legitimately be "" —
    # must not be misread as a zero-field record.
    writeRecord(tmp_path, "widget", "1", [""])

    assert readRecord(tmp_path, "widget", "1") == [""]


def test_delete_record_removes_file(tmp_path):
    writeRecord(tmp_path, "widget", "1", ["value"])

    deleteRecord(tmp_path, "widget", "1")

    assert readRecord(tmp_path, "widget", "1") is None


def test_delete_record_on_missing_record_is_noop(tmp_path):
    deleteRecord(tmp_path, "widget", "does-not-exist")  # should not raise


def test_list_record_ids_returns_all_written_ids(tmp_path):
    writeRecord(tmp_path, "widget", "1", ["a"])
    writeRecord(tmp_path, "widget", "2", ["b"])

    assert set(listRecordIds(tmp_path, "widget")) == {"1", "2"}


def test_list_record_ids_returns_empty_list_when_object_type_directory_missing(tmp_path):
    assert listRecordIds(tmp_path, "widget") == []


def test_clear_object_type_removes_all_records(tmp_path):
    writeRecord(tmp_path, "widget", "1", ["a"])
    writeRecord(tmp_path, "widget", "2", ["b"])

    clearObjectType(tmp_path, "widget")

    assert listRecordIds(tmp_path, "widget") == []


def test_write_record_serializes_concurrent_writers(tmp_path):
    def _write(value: str) -> None:
        writeRecord(tmp_path, "widget", "1", [value])

    threads = [threading.Thread(target=_write, args=(f"value-{i}",)) for i in range(20)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    result = readRecord(tmp_path, "widget", "1")
    assert result is not None
    assert len(result) == 1
    assert result[0].startswith("value-")
