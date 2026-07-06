import pytest

from core.storage.errors import MalformedRecordError, ValidationError
from core.storage.record_block import (
    decode_fields,
    decode_list,
    decode_table,
    encode_fields,
    encode_list,
    encode_table,
)


def test_fields_round_trip():
    fields = {"__type__": "Task", "id": "abc123", "title": "Buy milk"}
    assert decode_fields(encode_fields(fields)) == fields


def test_decode_fields_rejects_a_chunk_missing_its_separator():
    # Simulates a truncated/corrupted record file.
    with pytest.raises(MalformedRecordError):
        decode_fields("title\x1eBuy milk\x1e")


def test_decode_fields_on_empty_text_returns_no_fields():
    assert decode_fields("") == {}


def test_list_round_trip():
    items = ["errands", "gifts"]
    assert decode_list(encode_list(items)) == items


def test_empty_list_round_trip():
    assert decode_list(encode_list([])) == []


def test_list_layout_matches_the_documented_format():
    assert encode_list(["errands", "gifts"]) == "2\x1derrands\x1dgifts"


def test_decode_list_rejects_a_length_mismatch():
    # Declares 3 items but only supplies 2 — simulates a corrupted/hand-edited file.
    with pytest.raises(ValidationError):
        decode_list("3\x1derrands\x1dgifts")


def test_table_round_trip():
    rows = [["a1", "a2"], ["b1", "b2", "b3"]]
    assert decode_table(encode_table(rows)) == rows


def test_empty_table_round_trip():
    assert decode_table(encode_table([])) == []


def test_decode_table_rejects_a_row_count_mismatch():
    with pytest.raises(ValidationError):
        decode_table("2\x1c1\x1donly-row")


def test_decode_table_rejects_a_malformed_row():
    malformed_row = "3\x1donly\x1dtwo"  # declares 3 cells, supplies 2
    with pytest.raises(ValidationError):
        decode_table(f"1\x1c{malformed_row}")
