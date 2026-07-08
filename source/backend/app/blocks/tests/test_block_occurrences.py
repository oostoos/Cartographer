# @manualReviewRequested: 2026-07-07
from datetime import date

import pytest

from app.blocks import block, block_occurrences, block_template
from app.blocks.block_template_segment import BlockTemplateSegment, InstanceRow
from app.journals import today_engine
from app.recurrence.frequency import Frequency


def _set_today(monkeypatch, fake_today):
    monkeypatch.setattr("core.utils.clock.today", lambda: fake_today)


def _all_days_active(start_time="07:00", duration_minutes=30):
    return BlockTemplateSegment(
        effective_from=date(2000, 1, 1),
        frequency=Frequency.WEEKLY,
        interval=1,
        is_advanced=True,
        instance_rows=[InstanceRow(str(weekday), start_time, duration_minutes) for weekday in range(7)],
    )


def _weekdays_only(start_time="07:00", duration_minutes=30):
    return BlockTemplateSegment(
        effective_from=date(2000, 1, 1),
        frequency=Frequency.WEEKLY,
        interval=1,
        is_advanced=True,
        instance_rows=[InstanceRow(str(weekday), start_time, duration_minutes) for weekday in range(5)],
    )


def test_get_occurrences_includes_a_real_instance_for_today(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))  # a Monday
    template = block_template.create("Morning Routine", segments=[_all_days_active()])
    today_engine.ensure_todays_blocks_exist()

    occurrences = block_occurrences.get_occurrences(date(2026, 7, 6), date(2026, 7, 6))

    assert len(occurrences) == 1
    occurrence = occurrences[0]
    assert occurrence.title == "Morning Routine"
    assert occurrence.template_id == block_template.get_id(block=template)
    assert occurrence.is_projected is False
    assert occurrence.id == block.get_id(block=block.find_one(template_id=occurrence.template_id))


def test_get_occurrences_does_not_project_a_past_date_with_no_generated_instance(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    block_template.create("Morning Routine", segments=[_all_days_active()])

    occurrences = block_occurrences.get_occurrences(date(2026, 7, 1), date(2026, 7, 1))

    assert occurrences == []  # never generated for that day, and it's in the past — no projection


def test_get_occurrences_projects_a_future_date_from_an_active_templates_segment(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))  # a Monday
    template = block_template.create(
        "Weekday Routine", segments=[_weekdays_only(start_time="08:00", duration_minutes=45)]
    )

    occurrences = block_occurrences.get_occurrences(date(2026, 7, 8), date(2026, 7, 8))  # next Wednesday

    assert len(occurrences) == 1
    occurrence = occurrences[0]
    assert occurrence.template_id == block_template.get_id(block=template)
    assert occurrence.is_projected is True
    assert occurrence.start_time == "08:00"
    assert occurrence.duration_minutes == 45
    assert occurrence.id.startswith("projected:")


def test_get_occurrences_skips_a_future_date_the_template_does_not_occur_on(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))  # a Monday
    block_template.create("Weekday Routine", segments=[_weekdays_only()])

    occurrences = block_occurrences.get_occurrences(date(2026, 7, 11), date(2026, 7, 11))  # next Saturday

    assert occurrences == []


def test_get_occurrences_ignores_an_inactive_template_when_projecting(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    template = block_template.create("Daily block", segments=[_all_days_active()])
    block_template.set_is_active(False, block_template.get_id(block=template))

    occurrences = block_occurrences.get_occurrences(date(2026, 7, 10), date(2026, 7, 10))

    assert occurrences == []


def test_get_occurrences_spans_both_real_and_projected_within_one_range(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    block_template.create("Daily block", segments=[_all_days_active()])
    today_engine.ensure_todays_blocks_exist()

    occurrences = block_occurrences.get_occurrences(date(2026, 7, 6), date(2026, 7, 8))

    assert len(occurrences) == 3
    by_projected = {o.is_projected for o in occurrences}
    assert by_projected == {False, True}


def test_get_occurrences_rejects_an_end_date_before_the_start_date():
    with pytest.raises(ValueError):
        block_occurrences.get_occurrences(date(2026, 7, 10), date(2026, 7, 1))


def test_get_occurrences_returns_a_materialized_override_instead_of_a_projection(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))  # a Monday
    template = block_template.create("Weekday Routine", segments=[_weekdays_only()])
    template_id = block_template.get_id(block=template)
    future_date = date(2026, 7, 8)  # a Wednesday, still governed by the weekday segment

    materialized = today_engine.materialize_occurrence(template_id, future_date)
    block.set_title("Overridden title", block=materialized)
    block.set_is_template_synced(False, block=materialized)
    block.save(materialized)

    occurrences = block_occurrences.get_occurrences(future_date, future_date)

    assert len(occurrences) == 1
    assert occurrences[0].is_projected is False
    assert occurrences[0].title == "Overridden title"
    assert occurrences[0].id == block.get_id(block=materialized)


def test_get_occurrences_shows_a_materialized_override_even_for_a_now_inactive_template(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 6))
    template = block_template.create("Weekday Routine", segments=[_weekdays_only()])
    template_id = block_template.get_id(block=template)
    future_date = date(2026, 7, 8)
    today_engine.materialize_occurrence(template_id, future_date)

    block_template.set_is_active(False, template_id)
    occurrences = block_occurrences.get_occurrences(future_date, future_date)

    assert len(occurrences) == 1
    assert occurrences[0].is_projected is False
