# @manualReviewRequested: 2026-07-07
"""One-time maintenance script: converts any BlockTemplate record's legacy weekly_schedule field
(7 rows, Monday..Sunday, each is_active/start_time/duration_minutes) into the new segments field
(see app/blocks/block_template_segment.py) — one segment, in "advanced" mode so no per-weekday
timing is lost, containing one instance row per weekday that was active, effective from the
template's own start_date if it has one, or a far-past sentinel date otherwise (so it's always
been effective, matching weekly_schedule's old unconditional-per-week behavior). Safe to re-run —
a record with no weekly_schedule key left is untouched. Leaves the old weekly_schedule key in
place rather than deleting it (harmless, unread by any current code) rather than risk losing data
if this script needs to be re-examined later.

Run once, from source/backend, before starting the backend on code that expects every BlockTemplate
record to have segments instead of weekly_schedule: `python scripts/migrate_block_templates_to_segments.py`.
"""

import sys
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.storage.field_types import decode_bool, decode_optional_date
from core.storage.record_block import decode_table
from app.blocks import block_template
from app.blocks.block_template_segment import BlockTemplateSegment, InstanceRow, encode_segments
from app.recurrence.frequency import DEFAULT_INTERVAL, Frequency

LEGACY_FIELD_WEEKLY_SCHEDULE = "weekly_schedule"

# weekly_schedule's fixed row order was Monday (index 0) through Sunday (index 6) — the same
# numbering a weekly segment's instance row selector already uses, so no translation beyond
# str(index) is needed below.

# Used as effective_from for a template with no start_date of its own, so the migrated segment is
# always effective — matching weekly_schedule's old unconditional-per-week behavior.
ALWAYS_EFFECTIVE_SENTINEL_DATE = date(2000, 1, 1)


def migrate() -> int:
    """Converts every existing BlockTemplate record's legacy weekly_schedule into one "advanced"
    weekly segment, then removes the old key.

    Returns: the number of records actually changed.
    """
    changed_count = 0
    for record_id in block_template.list_ids():
        record = block_template.load(record_id)
        if LEGACY_FIELD_WEEKLY_SCHEDULE not in record.fields:
            continue  # already migrated

        rows = decode_table(record.fields.pop(LEGACY_FIELD_WEEKLY_SCHEDULE))
        instance_rows = [
            InstanceRow(str(weekday), start_time, int(duration_raw))
            for weekday, (is_active_raw, start_time, duration_raw) in enumerate(rows)
            if decode_bool(is_active_raw)
        ]

        effective_from = decode_optional_date(record.fields[block_template.FIELD_START_DATE])
        if effective_from is None:
            effective_from = ALWAYS_EFFECTIVE_SENTINEL_DATE

        segment = BlockTemplateSegment(
            effective_from, Frequency.WEEKLY, DEFAULT_INTERVAL, True, instance_rows
        )
        record.fields[block_template.FIELD_SEGMENTS] = encode_segments([segment])
        record.is_dirty = True
        block_template.save(record)
        changed_count += 1
    return changed_count


if __name__ == "__main__":
    total = migrate()
    print(f"Migrated {total} BlockTemplate record(s).")
