# @manualReviewRequested: 2026-07-07
"""One-time maintenance script: adds parent_task_id/is_skipped/is_skippable/order/
estimated_minutes/block_id to any existing Task record written before those fields existed, using
the same defaults task.create() computes for a new task. Safe to re-run — a record that already
has all six keys is left untouched.

A pre-blocks-rework record's old recurring_template_id (the field the Blocks rework replaced with
block_id) pointed at a RecurringTaskTemplate type that no longer exists — such a record becomes an
ordinary historical task (block_id "") rather than being remapped onto a Block, consistent with
this codebase's existing "a missed/stale recurring instance just becomes ordinary task history"
rule. That old field's value is still read here, read-only, purely to preserve its
is_skippable-defaults-true-if-it-was-recurring behavior.

Run once, from source/backend, before starting the backend on code that expects every Task record
to have these fields: `python scripts/backfill_task_fields.py`.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.storage.field_types import encode_bool, encode_optional_int
from app.tasks import task

# The field name Task used before the Blocks rework replaced it with block_id — no longer read by
# task.py itself, only here, as a one-time historical signal.
_LEGACY_RECURRING_TEMPLATE_ID_FIELD = "recurring_template_id"


def backfill() -> int:
    """Adds any missing parent_task_id/is_skipped/is_skippable/order/estimated_minutes/block_id
    keys to every existing Task record.

    Returns: the number of records actually changed.
    """
    changed_count = 0
    next_ad_hoc_order = _next_ad_hoc_order_seed()
    for record_id in task.list_ids():
        block = task.load(record_id)
        missing_keys = {
            task.FIELD_PARENT_TASK_ID,
            task.FIELD_IS_SKIPPED,
            task.FIELD_IS_SKIPPABLE,
            task.FIELD_ORDER,
            task.FIELD_ESTIMATED_MINUTES,
            task.FIELD_BLOCK_ID,
        } - block.fields.keys()
        if not missing_keys:
            continue

        if task.FIELD_PARENT_TASK_ID not in block.fields:
            block.fields[task.FIELD_PARENT_TASK_ID] = ""
        if task.FIELD_BLOCK_ID not in block.fields:
            block.fields[task.FIELD_BLOCK_ID] = ""
        if task.FIELD_IS_SKIPPED not in block.fields:
            block.fields[task.FIELD_IS_SKIPPED] = encode_bool(False)
        if task.FIELD_IS_SKIPPABLE not in block.fields:
            was_recurring = block.fields.get(_LEGACY_RECURRING_TEMPLATE_ID_FIELD, "") != ""
            block.fields[task.FIELD_IS_SKIPPABLE] = encode_bool(was_recurring)
        if task.FIELD_ESTIMATED_MINUTES not in block.fields:
            block.fields[task.FIELD_ESTIMATED_MINUTES] = "0"
        if task.FIELD_ORDER not in block.fields:
            if _is_ad_hoc_top_level(block.fields):
                order = next_ad_hoc_order
                next_ad_hoc_order += 1
            else:
                order = 0
            block.fields[task.FIELD_ORDER] = encode_optional_int(order)

        block.is_dirty = True
        task.save(block)
        changed_count += 1
    return changed_count


def _is_ad_hoc_top_level(raw_fields: dict[str, str]) -> bool:
    """Mirrors task.create's rule for which tasks get a real order: no project, not block-nested,
    not a subtask.
    """
    return (
        raw_fields.get(task.FIELD_PROJECT_ID, "") == ""
        and raw_fields.get(task.FIELD_BLOCK_ID, "") == ""
        and raw_fields.get(task.FIELD_PARENT_TASK_ID, "") == ""
    )


def _next_ad_hoc_order_seed() -> int:
    """Computes the first order value to hand out to an ad-hoc top-level Task missing `order`,
    continuing past any ad-hoc sibling that already has a real one set. Reads raw fields directly
    (rather than task.get_order) since some ad-hoc siblings may not have `order` yet either.
    """
    existing_orders = [
        int(block.fields[task.FIELD_ORDER])
        for block in task.list_all()
        if task.FIELD_ORDER in block.fields and _is_ad_hoc_top_level(block.fields)
    ]
    return max(existing_orders, default=-1) + 1


if __name__ == "__main__":
    total = backfill()
    print(f"Backfilled {total} Task record(s).")
