# @manualReviewRequested: 2026-07-07
"""One-time maintenance script: adds workspace_id ("" — unassigned) to any existing Task,
Project, Note, or BlockTemplate record written before the Workspaces feature existed. Safe to
re-run — a record that already has the key is left untouched.

Run once, from source/backend, before starting the backend on code that expects every one of
these records to have workspace_id: `python scripts/backfill_workspace_id.py`.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.blocks import block_template
from app.journals import note
from app.projects import project
from app.tasks import task


def backfill() -> int:
    """Adds a missing workspace_id key ("") to every existing Task/Project/Note/BlockTemplate
    record.

    Returns: the number of records actually changed.
    """
    changed_count = 0
    for module, field_name in (
        (task, task.FIELD_WORKSPACE_ID),
        (project, project.FIELD_WORKSPACE_ID),
        (note, note.FIELD_WORKSPACE_ID),
        (block_template, block_template.FIELD_WORKSPACE_ID),
    ):
        for record_id in module.list_ids():
            record = module.load(record_id)
            if field_name in record.fields:
                continue
            record.fields[field_name] = ""
            record.is_dirty = True
            module.save(record)
            changed_count += 1
    return changed_count


if __name__ == "__main__":
    total = backfill()
    print(f"Backfilled {total} record(s).")
