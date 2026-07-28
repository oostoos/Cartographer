"""Generic numeric-bound predicates. No knowledge of what's being validated or why."""


def isIntInRange(value: int, minimum: int, maximum: int) -> bool:
    """True if minimum <= value <= maximum."""
    return minimum <= value <= maximum


def isMultipleOf(value: int, step: int) -> bool:
    """True if value is an exact multiple of step."""
    return value % step == 0
