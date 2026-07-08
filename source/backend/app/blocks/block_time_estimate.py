# @manualReviewRequested: 2026-07-07
"""Computes a block template's possible total task time — the smallest-to-largest range shown on
the block editor sidebar next to its configured duration (see app/blocks/block_template_segment.py),
since which task templates actually generate on any given occurrence varies with each one's own
optional cadence override (see app/blocks/block_task_template.py).
"""

from typing import NamedTuple

from app.blocks import block_task_template
from core.storage.record_block import RecordBlock


class TaskTimeRange(NamedTuple):
    """The possible range of total task time a block template's nested tasks could occupy on any
    given day it occurs.
    """

    min_minutes: int
    max_minutes: int


def compute_task_time_range(task_templates: list[RecordBlock]) -> TaskTimeRange:
    """Computes the smallest-to-largest possible total estimated_minutes across a block
    template's task templates.

    Inputs: task_templates, every BlockTaskTemplate belonging to one BlockTemplate.
    Returns: min_minutes, the sum of estimated_minutes across only the task templates with no
        cadence override (frequency is None) — the ones guaranteed every time the block occurs;
        max_minutes, the sum across every task template — the day everything coincides. This is a
        static sum, not a calendar simulation.
    """
    min_minutes = sum(
        block_task_template.get_estimated_minutes(block=template)
        for template in task_templates
        if block_task_template.get_frequency(block=template) is None
    )
    max_minutes = sum(
        block_task_template.get_estimated_minutes(block=template) for template in task_templates
    )
    return TaskTimeRange(min_minutes=min_minutes, max_minutes=max_minutes)
