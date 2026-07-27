"""Group records: business-facing wrapper around the common page_store engine."""
from lib.python.collections.dict_utils import buildDictFromKeysAndValues
from lib.python.date.utc_timestamp import currentUtcIsoTimestamp
from src.common.backend.database.ids import generateRecordId
from src.main.backend.database.models import Group
from src.main.backend.database.record_store import (
    deleteRecord,
    listRecordIds,
    readRecord,
    writeRecord,
)
from src.main.backend.database.task import unassignTasksFromGroup

GROUP_OBJECT_TYPE = "group"
GROUP_FIELD_ORDER = ["id", "name", "created_at", "updated_at", "order"]


class EmptyGroupNameError(ValueError):
    """Raised when creating a group with a blank name."""


def createGroup(name: str) -> Group:
    """Create and persist a new group. Raises EmptyGroupNameError if name is blank."""
    _requireNonEmptyName(name)
    now = currentUtcIsoTimestamp()
    group = Group(
        id=generateRecordId(),
        name=name,
        created_at=now,
        updated_at=now,
        order=_nextGroupOrder(),
    )
    writeRecord(GROUP_OBJECT_TYPE, group.id, _encodeGroup(group))
    return group


def getGroup(group_id: str) -> Group | None:
    """Fetch a group by id, or None if no group with that id exists."""
    fields = readRecord(GROUP_OBJECT_TYPE, group_id)
    if fields is None:
        return None
    return _decodeGroup(fields)


def getAllGroups() -> list[Group]:
    """Fetch every group, ordered by its persisted position (ascending)."""
    groups = []
    for group_id in listRecordIds(GROUP_OBJECT_TYPE):
        group = getGroup(group_id)
        if group is not None:
            groups.append(group)
    groups.sort(key=lambda group: group.order)
    return groups


def updateGroup(group_id: str, name: str) -> Group | None:
    """Rename a group. Returns None if the group doesn't exist. Raises EmptyGroupNameError if name is blank."""
    group = getGroup(group_id)
    if group is None:
        return None
    _requireNonEmptyName(name)
    group.name = name
    group.updated_at = currentUtcIsoTimestamp()
    writeRecord(GROUP_OBJECT_TYPE, group.id, _encodeGroup(group))
    return group


def reorderGroups(group_ids: list[str]) -> list[Group]:
    """Reassign order so groups sort in the given id sequence. Unknown ids are skipped.

    Returns every group, freshly sorted by order.
    """
    for index, group_id in enumerate(group_ids):
        group = getGroup(group_id)
        if group is None:
            continue
        group.order = float(index)
        group.updated_at = currentUtcIsoTimestamp()
        writeRecord(GROUP_OBJECT_TYPE, group.id, _encodeGroup(group))
    return getAllGroups()


def deleteGroup(group_id: str) -> bool:
    """Delete a group, unassigning every task in it first. Returns False if it doesn't exist."""
    group = getGroup(group_id)
    if group is None:
        return False
    unassignTasksFromGroup(group_id)
    deleteRecord(GROUP_OBJECT_TYPE, group_id)
    return True


def _requireNonEmptyName(name: str) -> None:
    """Raise EmptyGroupNameError if name is blank (empty or whitespace-only)."""
    if not name.strip():
        raise EmptyGroupNameError("Group name must not be empty")


def _nextGroupOrder() -> float:
    """The order value a newly created group should get: one past the current highest."""
    existing_orders = [group.order for group in getAllGroups()]
    return max(existing_orders, default=-1.0) + 1


def _encodeGroup(group: Group) -> list[str]:
    """Encode a Group into the field list page_store expects, in GROUP_FIELD_ORDER."""
    values = {
        "id": group.id,
        "name": group.name,
        "created_at": group.created_at,
        "updated_at": group.updated_at,
        "order": str(group.order),
    }
    return [values[field] for field in GROUP_FIELD_ORDER]


def _decodeGroup(fields: list[str]) -> Group:
    """Decode a page_store field list (in GROUP_FIELD_ORDER) back into a Group."""
    values = buildDictFromKeysAndValues(GROUP_FIELD_ORDER, fields)
    return Group(
        id=values["id"],
        name=values["name"],
        created_at=values["created_at"],
        updated_at=values["updated_at"],
        order=float(values.get("order") or 0.0),
    )
