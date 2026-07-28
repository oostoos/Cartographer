from lib.language.python.validation.numeric_checks import isIntInRange, isMultipleOf


def test_is_int_in_range_true_within_bounds():
    assert isIntInRange(3, 1, 5) is True


def test_is_int_in_range_true_at_bounds():
    assert isIntInRange(1, 1, 5) is True
    assert isIntInRange(5, 1, 5) is True


def test_is_int_in_range_false_one_below_minimum():
    assert isIntInRange(0, 1, 5) is False


def test_is_int_in_range_false_one_above_maximum():
    assert isIntInRange(6, 1, 5) is False


def test_is_multiple_of_true_for_exact_multiples():
    assert isMultipleOf(30, 15) is True
    assert isMultipleOf(0, 15) is True


def test_is_multiple_of_false_for_non_multiples():
    assert isMultipleOf(20, 15) is False
