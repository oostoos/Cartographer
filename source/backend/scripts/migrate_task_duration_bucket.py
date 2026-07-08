# @manualReviewRequested: 2026-07-06
"""One-time maintenance script: converts any Task record's legacy estimated_minutes value into
the new duration_bucket field, bucketing the old minute count into the nearest DurationBucket
rather than discarding it, then removes the old key. Safe to re-run — a record with no
estimated_minutes key left is untouched.

Run once, from source/backend, before starting the backend on code that expects every Task
record to have duration_bucket instead of estimated_minutes:
`python scripts/migrate_task_duration_bucket.py`.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.storage.field_types import decode_optional_int, encode_optional_enum
from app.tasks import task
from app.tasks.task import DurationBucket

LEGACY_FIELD_ESTIMATED_MINUTES = "estimated_minutes"

# The same boundaries DurationBucket's members represent (see app/tasks/task.py).
DURATION_BUCKET_MINUTE_BOUNDARIES = (
    (5, DurationBucket.UNDER_5_MIN),
    (10, DurationBucket.FIVE_TO_10_MIN),
    (30, DurationBucket.TEN_TO_30_MIN),
    (60, DurationBucket.THIRTY_TO_60_MIN),
)


def migrate() -> int:
    """Buckets any legacy estimated_minutes value into duration_bucket on every existing Task
    record, then removes the old key.

    Returns: the number of records actually changed.
    """
    changed_count = 0
    for record_id in task.list_ids():
        block = task.load(record_id)
        if LEGACY_FIELD_ESTIMATED_MINUTES not in block.fields:
            continue  # already migrated

        minutes = decode_optional_int(block.fields.pop(LEGACY_FIELD_ESTIMATED_MINUTES))
        block.fields[task.FIELD_DURATION_BUCKET] = encode_optional_enum(_bucket_for_minutes(minutes))
        block.is_dirty = True
        task.save(block)
        changed_count += 1
    return changed_count


def _bucket_for_minutes(minutes: int | None) -> DurationBucket | None:
    """Maps a legacy raw minute count to the DurationBucket it falls into, or None if unset."""
    if minutes is None:
        return None
    for upper_bound, bucket in DURATION_BUCKET_MINUTE_BOUNDARIES:
        if minutes < upper_bound:
            return bucket
    return DurationBucket.OVER_60_MIN


if __name__ == "__main__":
    total = migrate()
    print(f"Migrated {total} Task record(s).")
