# @manualReviewRequested: 2026-07-07
from datetime import date

import pytest

from core.storage.errors import ValidationError
from app.blocks import block_template
from app.blocks.block_template_segment import BlockTemplateSegment, InstanceRow
from app.recurrence.frequency import Frequency

_WEEKDAYS_ACTIVE_SEGMENT = BlockTemplateSegment(
    effective_from=date(2026, 1, 1),
    frequency=Frequency.WEEKLY,
    interval=1,
    is_advanced=True,
    instance_rows=[InstanceRow(str(weekday), "07:00", 30) for weekday in range(5)],
)


def test_create_defaults_to_no_segments():
    created = block_template.create("Morning Routine")
    assert block_template.get_segments(block=created) == []
    assert block_template.get_is_active(block=created) is True
    assert block_template.get_start_date(block=created) is None
    assert block_template.get_end_date(block=created) is None


def test_create_sets_every_field_to_its_given_value():
    created = block_template.create(
        "Morning Training",
        description="Swim, bike, run",
        tags=["fitness"],
        segments=[_WEEKDAYS_ACTIVE_SEGMENT],
        start_date=date(2026, 1, 1),
        end_date=date(2026, 12, 31),
    )
    assert block_template.get_title(block=created) == "Morning Training"
    assert block_template.get_description(block=created) == "Swim, bike, run"
    assert block_template.get_tags(block=created) == ["fitness"]
    assert block_template.get_segments(block=created) == [_WEEKDAYS_ACTIVE_SEGMENT]
    assert block_template.get_start_date(block=created) == date(2026, 1, 1)
    assert block_template.get_end_date(block=created) == date(2026, 12, 31)


def test_create_rejects_a_title_containing_a_control_character():
    with pytest.raises(ValidationError):
        block_template.create("tainted\x1etitle")


def test_set_segments_round_trips():
    created = block_template.create("Reschedule me")
    block_template.set_segments([_WEEKDAYS_ACTIVE_SEGMENT], block=created)
    assert block_template.get_segments(block=created) == [_WEEKDAYS_ACTIVE_SEGMENT]


def test_shape_effective_on_returns_none_before_any_segment_starts():
    created = block_template.create("Not yet configured", segments=[_WEEKDAYS_ACTIVE_SEGMENT])
    assert block_template.shape_effective_on(date(2025, 12, 31), block=created) is None


def test_shape_effective_on_returns_the_governing_segment():
    created = block_template.create("Weekdays only", segments=[_WEEKDAYS_ACTIVE_SEGMENT])
    assert block_template.shape_effective_on(date(2026, 6, 1), block=created) == _WEEKDAYS_ACTIVE_SEGMENT


def test_upsert_shape_effective_today_appends_a_new_segment_leaving_the_old_one_intact():
    created = block_template.create("Reschedule me", segments=[_WEEKDAYS_ACTIVE_SEGMENT])
    today = date(2026, 3, 1)
    block_template.upsert_shape_effective_today(
        today, Frequency.DAILY, 1, False, [InstanceRow("daily", "09:00", 15)], block=created
    )
    segments = block_template.get_segments(block=created)
    assert segments[0] == _WEEKDAYS_ACTIVE_SEGMENT
    assert segments[1].effective_from == today
    assert segments[1].frequency == Frequency.DAILY
    # The old segment still governs any date before today's new one takes effect.
    assert block_template.shape_effective_on(date(2026, 2, 1), block=created) == _WEEKDAYS_ACTIVE_SEGMENT
    assert block_template.shape_effective_on(today, block=created) == segments[1]


def test_upsert_shape_effective_today_overwrites_a_same_day_edit_instead_of_stacking():
    created = block_template.create("Same day edits")
    today = date(2026, 3, 1)
    block_template.upsert_shape_effective_today(
        today, Frequency.WEEKLY, 1, False, [InstanceRow("0", "07:00", 30)], block=created
    )
    block_template.upsert_shape_effective_today(
        today, Frequency.WEEKLY, 1, False, [InstanceRow("0", "08:00", 45)], block=created
    )
    segments = block_template.get_segments(block=created)
    assert len(segments) == 1
    assert segments[0].instance_rows == [InstanceRow("0", "08:00", 45)]


def test_upsert_shape_effective_today_accepts_a_zero_duration_instance_row():
    created = block_template.create("Unset duration")
    today = date(2026, 3, 1)
    block_template.upsert_shape_effective_today(
        today, Frequency.DAILY, 1, False, [InstanceRow("daily", "09:00", 0)], block=created
    )
    segments = block_template.get_segments(block=created)
    assert segments[0].instance_rows == [InstanceRow("daily", "09:00", 0)]


def test_upsert_shape_effective_today_rejects_a_negative_duration_instance_row():
    created = block_template.create("Bad duration")
    today = date(2026, 3, 1)
    with pytest.raises(ValueError):
        block_template.upsert_shape_effective_today(
            today, Frequency.DAILY, 1, False, [InstanceRow("daily", "09:00", -5)], block=created
        )


def test_set_title_does_not_affect_other_fields():
    created = block_template.create("Original", description="desc")
    block_template.set_title("Renamed", block=created)
    assert block_template.get_title(block=created) == "Renamed"
    assert block_template.get_description(block=created) == "desc"


def test_list_active_excludes_inactive_templates():
    active = block_template.create("Active")
    inactive = block_template.create("Inactive")
    block_template.set_is_active(False, block_template.get_id(block=inactive))

    active_ids = [block_template.get_id(block=t) for t in block_template.list_active()]
    assert block_template.get_id(block=active) in active_ids
    assert block_template.get_id(block=inactive) not in active_ids


def test_create_appends_templates_to_the_end_of_the_order():
    first = block_template.create("First")
    second = block_template.create("Second")
    assert block_template.get_order(block=first) == 0
    assert block_template.get_order(block=second) == 1


def test_set_order_round_trips():
    created = block_template.create("Reorder me")
    block_template.set_order(3, block=created)
    assert block_template.get_order(block=created) == 3


def test_set_start_date_and_end_date_round_trip_and_can_be_cleared():
    created = block_template.create("Seasonal block")
    block_template.set_start_date(date(2026, 6, 1), block=created)
    block_template.set_end_date(date(2026, 8, 31), block=created)
    assert block_template.get_start_date(block=created) == date(2026, 6, 1)
    assert block_template.get_end_date(block=created) == date(2026, 8, 31)
    block_template.set_start_date(None, block=created)
    block_template.set_end_date(None, block=created)
    assert block_template.get_start_date(block=created) is None
    assert block_template.get_end_date(block=created) is None
