# @manualReviewRequested: 2026-07-06
from datetime import date

from core.storage.field_types import (
    decode_bool,
    decode_date,
    decode_optional_date,
    decode_optional_int,
    encode_bool,
    encode_date,
    encode_optional_date,
    encode_optional_int,
)


def test_bool_round_trip():
    assert decode_bool(encode_bool(True)) is True
    assert decode_bool(encode_bool(False)) is False


def test_date_round_trip():
    today = date(2026, 7, 4)
    assert decode_date(encode_date(today)) == today


def test_optional_date_round_trip_when_set():
    a_date = date(2026, 12, 25)
    assert decode_optional_date(encode_optional_date(a_date)) == a_date


def test_optional_date_round_trip_when_unset():
    assert encode_optional_date(None) == ""
    assert decode_optional_date("") is None


def test_optional_int_round_trip_when_set():
    assert decode_optional_int(encode_optional_int(15)) == 15


def test_optional_int_round_trip_when_unset():
    assert encode_optional_int(None) == ""
    assert decode_optional_int("") is None


def test_optional_int_round_trip_for_zero():
    # Zero is falsy in Python but must still round-trip as a set value, not as "unset".
    assert decode_optional_int(encode_optional_int(0)) == 0
