import pytest

from src.main.backend.database import record_store as record_store_module
from src.main.backend.database.record_store import (
    clearObjectType,
    listRecordIds,
    readRecord,
    writeRecord,
)


@pytest.fixture(autouse=True)
def _use_tmp_data_root(tmp_path, monkeypatch):
    monkeypatch.setattr(record_store_module, "DATA_ROOT", tmp_path)


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
