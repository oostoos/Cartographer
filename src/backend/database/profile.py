"""Profile records: business-facing wrapper around the common page_store engine.

Models a singleton record — there's no auth/multi-user concept yet.
"""
from lib.language.python.collections.dict_utils import buildDictFromKeysAndValues
from src.backend.database.models import Profile
from src.backend.database.record_store import clearObjectType, readRecord, writeRecord
from src.backend.database.task import TASK_OBJECT_TYPE

PROFILE_OBJECT_TYPE = "profile"
PROFILE_SINGLETON_ID = "singleton"
PROFILE_FIELD_ORDER = ["display_name"]

DEFAULT_DISPLAY_NAME = "Explorer"


def getProfile() -> Profile:
    """Fetch the profile. Never throws — returns the default profile if none is set yet."""
    fields = readRecord(PROFILE_OBJECT_TYPE, PROFILE_SINGLETON_ID)
    if fields is None:
        return Profile(display_name=DEFAULT_DISPLAY_NAME)
    return _decodeProfile(fields)


def setDisplayName(display_name: str) -> Profile:
    """Set the profile's display name and persist it."""
    profile = Profile(display_name=display_name)
    writeRecord(PROFILE_OBJECT_TYPE, PROFILE_SINGLETON_ID, _encodeProfile(profile))
    return profile


def deleteAllData() -> None:
    """Delete every task and profile record, resetting the app to a blank slate."""
    clearObjectType(TASK_OBJECT_TYPE)
    clearObjectType(PROFILE_OBJECT_TYPE)


def _encodeProfile(profile: Profile) -> list[str]:
    """Encode a Profile into the field list page_store expects, in PROFILE_FIELD_ORDER."""
    values = {"display_name": profile.display_name}
    return [values[field] for field in PROFILE_FIELD_ORDER]


def _decodeProfile(fields: list[str]) -> Profile:
    """Decode a page_store field list (in PROFILE_FIELD_ORDER) back into a Profile."""
    values = buildDictFromKeysAndValues(PROFILE_FIELD_ORDER, fields)
    return Profile(display_name=values["display_name"])
