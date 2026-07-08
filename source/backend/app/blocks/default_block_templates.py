# @manualReviewRequested: 2026-07-07
"""The "Generate basic blocks" preset (POST /api/block-templates/generate-defaults) — a starter
kit of ADHD-oriented block templates the user can immediately edit, rename, or delete. Each one
embodies established ADHD executive-function scaffolding: small discrete tasks (low activation
energy), self-care anchoring, non-skippable keystone habits, and a daily "anti-snowball" chore
reset (doing a little upkeep every day so nothing piles up into a big undifferentiated task).
"""

from core.storage.record_block import RecordBlock
from core.utils import clock
from app.blocks import block_task_template, block_template
from app.blocks.block_template_segment import BlockTemplateSegment, InstanceRow
from app.recurrence.frequency import Frequency

# Every preset occurs every day of the week, at the same time — the simplest starting shape; the
# user can immediately give any day a different shape (or turn it off) once generated.
_WEEKDAY_COUNT = 7


class _TaskBlueprint:
    """One task in a preset block: title, whether it's skippable, and its time estimate."""

    def __init__(self, title: str, is_skippable: bool, estimated_minutes: int):
        self.title = title
        self.is_skippable = is_skippable
        self.estimated_minutes = estimated_minutes


class _BlockBlueprint:
    """One preset block: title, its daily start time/duration, and its ordered task blueprints."""

    def __init__(self, title: str, start_time: str, duration_minutes: int, tasks: list[_TaskBlueprint]):
        self.title = title
        self.start_time = start_time
        self.duration_minutes = duration_minutes
        self.tasks = tasks


_PRESETS = [
    _BlockBlueprint(
        "Wake Up & Reset",
        start_time="07:00",
        duration_minutes=30,
        tasks=[
            _TaskBlueprint("Take medication", is_skippable=False, estimated_minutes=2),
            _TaskBlueprint("Drink a glass of water", is_skippable=False, estimated_minutes=1),
            _TaskBlueprint("Brush teeth", is_skippable=False, estimated_minutes=3),
            _TaskBlueprint("Shower", is_skippable=True, estimated_minutes=10),
            _TaskBlueprint("Get dressed", is_skippable=True, estimated_minutes=5),
        ],
    ),
    _BlockBlueprint(
        "Daily Tidy Sweep",
        start_time="20:00",
        duration_minutes=20,
        tasks=[
            _TaskBlueprint("Clear the sink", is_skippable=False, estimated_minutes=10),
            _TaskBlueprint("Wipe one counter", is_skippable=True, estimated_minutes=3),
            _TaskBlueprint("2-minute pickup of common areas", is_skippable=True, estimated_minutes=2),
            _TaskBlueprint("Take out trash if full", is_skippable=True, estimated_minutes=3),
        ],
    ),
    _BlockBlueprint(
        "Wind Down",
        start_time="21:30",
        duration_minutes=15,
        tasks=[
            _TaskBlueprint("Evening medication", is_skippable=False, estimated_minutes=2),
            _TaskBlueprint("Lay out tomorrow's clothes", is_skippable=True, estimated_minutes=3),
            _TaskBlueprint("Screens off", is_skippable=True, estimated_minutes=1),
        ],
    ),
]


def create_default_block_templates() -> list[RecordBlock]:
    """Creates the ADHD preset block templates (and their nested task templates), appended after
    any existing templates' order. Safe to call repeatedly — each call creates a fresh set with no
    de-duplication, since this is meant as a one-time starting point the user immediately
    customizes.

    Returns: the newly created BlockTemplate blocks, in preset order.
    """
    created_templates = []
    for preset in _PRESETS:
        segment = BlockTemplateSegment(
            effective_from=clock.today(),
            frequency=Frequency.WEEKLY,
            interval=1,
            is_advanced=False,
            instance_rows=[
                InstanceRow(str(weekday), preset.start_time, preset.duration_minutes)
                for weekday in range(_WEEKDAY_COUNT)
            ],
        )
        template = block_template.create(preset.title, segments=[segment])
        template_id = block_template.get_id(block=template)
        for order, task_blueprint in enumerate(preset.tasks):
            block_task_template.create(
                task_blueprint.title,
                block_template_id=template_id,
                order=order,
                is_skippable=task_blueprint.is_skippable,
                estimated_minutes=task_blueprint.estimated_minutes,
            )
        created_templates.append(template)
    return created_templates
