from lib.python.collections.dict_utils import buildDictFromKeysAndValues


def test_build_dict_from_keys_and_values_pairs_by_position():
    assert buildDictFromKeysAndValues(["a", "b"], ["1", "2"]) == {"a": "1", "b": "2"}


def test_build_dict_from_keys_and_values_drops_extra_keys_when_values_are_shorter():
    assert buildDictFromKeysAndValues(["a", "b", "c"], ["1", "2"]) == {"a": "1", "b": "2"}


def test_build_dict_from_keys_and_values_drops_extra_values_when_keys_are_shorter():
    assert buildDictFromKeysAndValues(["a"], ["1", "2"]) == {"a": "1"}


def test_build_dict_from_keys_and_values_empty_inputs_returns_empty_dict():
    assert buildDictFromKeysAndValues([], []) == {}
