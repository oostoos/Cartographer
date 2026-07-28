from lib.language.python.strings.optional_int_codec import (
    decodeOptionalIntFromString,
    encodeOptionalIntAsString,
)


def test_encode_optional_int_as_string_encodes_value():
    assert encodeOptionalIntAsString(5) == "5"
    assert encodeOptionalIntAsString(0) == "0"
    assert encodeOptionalIntAsString(-3) == "-3"


def test_encode_optional_int_as_string_encodes_none_as_empty_string():
    assert encodeOptionalIntAsString(None) == ""


def test_decode_optional_int_from_string_decodes_value():
    assert decodeOptionalIntFromString("5") == 5
    assert decodeOptionalIntFromString("-3") == -3


def test_decode_optional_int_from_string_decodes_empty_string_as_none():
    assert decodeOptionalIntFromString("") is None


def test_round_trips_through_encode_and_decode():
    assert decodeOptionalIntFromString(encodeOptionalIntAsString(42)) == 42
    assert decodeOptionalIntFromString(encodeOptionalIntAsString(None)) is None
