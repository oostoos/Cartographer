"""Generic dict-building helpers. No knowledge of what the keys/values represent."""


def buildDictFromKeysAndValues(keys: list[str], values: list[str]) -> dict[str, str]:
    """Zip keys and values into a dict, paired by position.

    If the lists differ in length, extra items in the longer one are dropped —
    the same truncate-to-shorter behavior as the underlying zip().
    """
    return dict(zip(keys, values))
