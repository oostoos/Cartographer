from lib.language.python.validation.date_checks import isIsoDateString


def test_is_iso_date_string_true_for_valid_date():
    assert isIsoDateString("2026-07-27") is True


def test_is_iso_date_string_false_for_invalid_format():
    assert isIsoDateString("07/27/2026") is False
    assert isIsoDateString("2026-13-01") is False


def test_is_iso_date_string_false_for_non_string():
    assert isIsoDateString(None) is False
    assert isIsoDateString(20260727) is False


def test_is_iso_date_string_false_for_empty_string():
    assert isIsoDateString("") is False
