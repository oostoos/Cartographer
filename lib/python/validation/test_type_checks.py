from lib.python.validation.type_checks import isDict, isString


def test_is_string_true_for_str():
    assert isString("hello") is True


def test_is_string_false_for_non_str():
    assert isString(123) is False
    assert isString(None) is False
    assert isString({}) is False


def test_is_dict_true_for_dict():
    assert isDict({"a": 1}) is True


def test_is_dict_false_for_non_dict():
    assert isDict("hello") is False
    assert isDict(None) is False
    assert isDict([]) is False
