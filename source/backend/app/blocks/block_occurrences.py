# @manualReviewRequested: 2026-07-07
"""Computes block occurrences across a date range for the calendar view: real generated Block
instances (app/blocks/block.py) for today, the past, and any future date a user has already
materialized by editing that one occurrence directly (see PATCH /api/blocks/<id>), and projected
occurrences — computed directly from each active BlockTemplate's segments via
app/blocks/block_schedule.shape_for_date, without persisting anything — for every other future
date (a Block is otherwise only ever generated once its day arrives; see
app/journals/today_engine.py).
"""

from datetime import date, timedelta
from typing import NamedTuple

from core.utils import clock
from app.blocks import block, block_schedule, block_template

# The prefix (plus templateId:date) a not-yet-generated occurrence's synthetic id always has —
# app/blocks/block_routes.py's PATCH route parses this back apart to know which template+date to
# materialize a real Block for.
PROJECTED_ID_PREFIX = "projected"


class BlockOccurrence(NamedTuple):
    """One block's occurrence on one calendar day — either a real generated Block instance, or a
    projected (not-yet-generated) occurrence computed live from its template's segments.
    """

    id: str
    template_id: str
    occurrence_date: date
    title: str
    description: str
    tags: list[str]
    start_time: str
    duration_minutes: int
    is_projected: bool


def get_occurrences(start_date: date, end_date: date) -> list[BlockOccurrence]:
    """Computes every block occurrence in [start_date, end_date] inclusive.

    Inputs: start_date/end_date, the inclusive range to compute over.
    Returns: real Block instances for every date <= today in range, plus — for every date after
        today — a real instance if that one occurrence was already materialized by a direct edit
        (see PATCH /api/blocks/<id>), or otherwise a projected occurrence (computed from each
        active template's segments, not persisted). Callers wanting today's real instances to be
        up to date first should call app/journals/today_engine.ensure_todays_blocks_exist() before
        this.
    Raises: ValueError if end_date is before start_date.
    """
    if end_date < start_date:
        raise ValueError(f"end_date ({end_date}) must not be before start_date ({start_date}).")

    today = clock.today()
    occurrences: list[BlockOccurrence] = []
    all_instances = block.list_all()

    real_range_end = min(end_date, today)
    if start_date <= real_range_end:
        for instance in all_instances:
            occurrence_date = block.get_date(block=instance)
            if start_date <= occurrence_date <= real_range_end:
                occurrences.append(_from_real_instance(instance))

    projected_range_start = max(start_date, today + timedelta(days=1))
    if projected_range_start <= end_date:
        materialized_future = [
            instance
            for instance in all_instances
            if projected_range_start <= block.get_date(block=instance) <= end_date
        ]
        materialized_keys = {
            (block.get_template_id(block=instance), block.get_date(block=instance))
            for instance in materialized_future
        }
        occurrences.extend(_from_real_instance(instance) for instance in materialized_future)

        templates = block_template.list_active()
        current_date = projected_range_start
        while current_date <= end_date:
            for template in templates:
                template_id = block_template.get_id(block=template)
                if (template_id, current_date) in materialized_keys:
                    continue
                if block_schedule.occurs_on(template, current_date):
                    occurrences.append(_from_template(template, current_date))
            current_date += timedelta(days=1)

    return occurrences


def _from_real_instance(instance) -> BlockOccurrence:
    """Builds a BlockOccurrence from an already-generated Block instance."""
    return BlockOccurrence(
        id=block.get_id(block=instance),
        template_id=block.get_template_id(block=instance),
        occurrence_date=block.get_date(block=instance),
        title=block.get_title(block=instance),
        description=block.get_description(block=instance),
        tags=block.get_tags(block=instance),
        start_time=block.get_start_time(block=instance),
        duration_minutes=block.get_duration_minutes(block=instance),
        is_projected=False,
    )


def _from_template(template, occurrence_date: date) -> BlockOccurrence:
    """Builds a projected BlockOccurrence directly from a template and a future date, using
    whichever segment/instance row governs that date (see block_schedule.shape_for_date) — no
    Block record is created.
    """
    template_id = block_template.get_id(block=template)
    shape = block_schedule.shape_for_date(template, occurrence_date)
    return BlockOccurrence(
        id=f"{PROJECTED_ID_PREFIX}:{template_id}:{occurrence_date.isoformat()}",
        template_id=template_id,
        occurrence_date=occurrence_date,
        title=block_template.get_title(block=template),
        description=block_template.get_description(block=template),
        tags=block_template.get_tags(block=template),
        start_time=shape.start_time,
        duration_minutes=shape.duration_minutes,
        is_projected=True,
    )
