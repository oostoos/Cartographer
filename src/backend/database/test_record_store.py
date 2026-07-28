from src.backend.database.record_store import (
    clearObjectType,
    deleteRecord,
    listRecordIds,
    readRecord,
    writeRecord,
)


def test_write_and_read_record_round_trips_fields():
    writeRecord("widget", "1", ["alpha", "beta"])

    assert readRecord("widget", "1") == ["alpha", "beta"]


def test_read_record_missing_returns_none():
    assert readRecord("widget", "does-not-exist") is None


def test_list_record_ids_returns_all_written_ids():
    writeRecord("widget", "1", ["a"])
    writeRecord("widget", "2", ["b"])

    assert set(listRecordIds("widget")) == {"1", "2"}


def test_clear_object_type_removes_all_records():
    writeRecord("widget", "1", ["a"])
    writeRecord("widget", "2", ["b"])

    clearObjectType("widget")

    assert listRecordIds("widget") == []


def test_delete_record_removes_it():
    writeRecord("widget", "1", ["a"])

    deleteRecord("widget", "1")

    assert readRecord("widget", "1") is None


def test_delete_record_leaves_other_records_unaffected():
    writeRecord("widget", "1", ["a"])
    writeRecord("widget", "2", ["b"])

    deleteRecord("widget", "1")

    assert readRecord("widget", "2") == ["b"]


def test_delete_record_on_unknown_id_is_a_no_op():
    deleteRecord("widget", "does-not-exist")

    assert listRecordIds("widget") == []
