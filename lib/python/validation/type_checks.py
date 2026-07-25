"""Generic type-check predicates. No knowledge of what's being validated or why."""


def isString(value: object) -> bool:
    """True if value is a str."""
    return isinstance(value, str)


def isDict(value: object) -> bool:
    """True if value is a dict."""
    return isinstance(value, dict)


def isList(value: object) -> bool:
    """True if value is a list."""
    return isinstance(value, list)
