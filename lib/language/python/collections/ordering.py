"""Generic helpers for lists of records that keep a manually-orderable position.

No knowledge of what a "record" is — callers supply how to fetch and save one.
"""
from typing import Callable, TypeVar

TRecord = TypeVar("TRecord")

NO_EXISTING_ORDERS_BASE_VALUE = -1.0


def computeNextOrder(existing_orders: list[float]) -> float:
    """The order value a newly created record should get: one past the current highest."""
    return max(existing_orders, default=NO_EXISTING_ORDERS_BASE_VALUE) + 1


def reorderRecordsByIds(
    record_ids: list[str],
    get_record: Callable[[str], TRecord | None],
    save_record_at_order: Callable[[TRecord, float], None],
) -> None:
    """Reassign order so records sort in the given id sequence. Unknown ids are skipped.

    get_record(record_id) fetches a record by id, or None if it doesn't exist.
    save_record_at_order(record, order) persists the record at its new order,
    including whatever bookkeeping (e.g. stamping updated_at) the caller's
    structure needs.
    """
    for index, record_id in enumerate(record_ids):
        record = get_record(record_id)
        if record is None:
            continue
        save_record_at_order(record, float(index))
