from datetime import datetime, timezone

from lib.python.date.utc_timestamp import currentUtcIsoTimestamp


def test_current_utc_iso_timestamp_is_parseable_iso_string():
    result = currentUtcIsoTimestamp()

    assert datetime.fromisoformat(result) is not None


def test_current_utc_iso_timestamp_is_utc():
    result = currentUtcIsoTimestamp()

    assert datetime.fromisoformat(result).utcoffset() == timezone.utc.utcoffset(None)


def test_current_utc_iso_timestamp_reflects_current_time():
    before = datetime.now(timezone.utc)

    result = datetime.fromisoformat(currentUtcIsoTimestamp())

    after = datetime.now(timezone.utc)
    assert before <= result <= after
