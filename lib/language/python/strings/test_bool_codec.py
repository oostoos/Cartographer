from lib.language.python.strings.bool_codec import decodeBoolFromString, encodeBoolAsString


def test_encode_bool_as_string_true():
    assert encodeBoolAsString(True) == "true"


def test_encode_bool_as_string_false():
    assert encodeBoolAsString(False) == "false"


def test_decode_bool_from_string_true():
    assert decodeBoolFromString("true") is True


def test_decode_bool_from_string_false():
    assert decodeBoolFromString("false") is False


def test_decode_bool_from_string_unrecognized_value_is_false():
    assert decodeBoolFromString("garbage") is False


def test_round_trips_through_encode_and_decode():
    assert decodeBoolFromString(encodeBoolAsString(True)) is True
    assert decodeBoolFromString(encodeBoolAsString(False)) is False
