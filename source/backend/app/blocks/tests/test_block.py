# @manualReviewRequested: 2026-07-07
from datetime import date

import pytest

from core.storage.errors import ValidationError
from app.blocks import block


def test_create_sets_every_field_to_its_given_value():
    created = block.create(
        "template-1",
        date(2026, 7, 4),
        "Morning Training",
        "06:00",
        90,
        description="Swim, bike, run",
        tags=["fitness"],
        order=2,
    )
    assert block.get_template_id(block=created) == "template-1"
    assert block.get_date(block=created) == date(2026, 7, 4)
    assert block.get_title(block=created) == "Morning Training"
    assert block.get_start_time(block=created) == "06:00"
    assert block.get_duration_minutes(block=created) == 90
    assert block.get_description(block=created) == "Swim, bike, run"
    assert block.get_tags(block=created) == ["fitness"]
    assert block.get_order(block=created) == 2


def test_create_rejects_a_title_containing_a_control_character():
    with pytest.raises(ValidationError):
        block.create("template-1", date(2026, 7, 4), "tainted\x1etitle", "06:00", 30)


def test_set_title_and_description_and_tags_round_trip():
    created = block.create("template-1", date(2026, 7, 4), "Original", "06:00", 30)
    block.set_title("Renamed", block=created)
    block.set_description("New description", block=created)
    block.set_tags(["new"], block=created)
    assert block.get_title(block=created) == "Renamed"
    assert block.get_description(block=created) == "New description"
    assert block.get_tags(block=created) == ["new"]


def test_set_start_time_and_duration_minutes_round_trip():
    created = block.create("template-1", date(2026, 7, 4), "Block", "06:00", 30)
    block.set_start_time("07:30", block=created)
    block.set_duration_minutes(60, block=created)
    assert block.get_start_time(block=created) == "07:30"
    assert block.get_duration_minutes(block=created) == 60


def test_find_matches_by_template_id_and_date():
    block.create("template-1", date(2026, 7, 4), "Block", "06:00", 30)
    matches = block.find(template_id="template-1", date="2026-07-04")
    assert len(matches) == 1
