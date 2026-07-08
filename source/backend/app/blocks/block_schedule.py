# @manualReviewRequested: 2026-07-07
"""Decides whether a BlockTemplate occurs on a given date, and if so, what its shape is for that
date — delegates to whichever BlockTemplateSegment governs the date (see
app/blocks/block_template_segment.py), not the direct per-weekday check this module used before
segments existed.
"""

from datetime import date

from app.blocks import block_template, block_template_segment
from app.blocks.block_template_segment import InstanceRow
from core.storage.record_block import RecordBlock


def occurs_on(template: RecordBlock, target_date: date) -> bool:
    """Decides whether a block template produces an occurrence on target_date.

    Inputs: template, a loaded BlockTemplate block; target_date, the date to check.
    Returns: False if target_date falls outside the template's optional [start_date, end_date]
        bounds, or no segment governs target_date, or the governing segment's own cadence doesn't
        fire on it; True otherwise.
    """
    return shape_for_date(template, target_date) is not None


def shape_for_date(template: RecordBlock, target_date: date) -> InstanceRow | None:
    """Reads the instance row (start_time/duration_minutes) governing target_date, or None if the
    template doesn't occur then at all (see occurs_on).
    """
    start_date = block_template.get_start_date(block=template)
    if start_date is not None and target_date < start_date:
        return None

    end_date = block_template.get_end_date(block=template)
    if end_date is not None and target_date > end_date:
        return None

    segment = block_template.shape_effective_on(target_date, block=template)
    if segment is None:
        return None

    return block_template_segment.matching_row(segment, target_date)
