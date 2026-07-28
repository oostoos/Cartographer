import pytest

from src.backend.tasks.schemas import (
    InvalidPayloadError,
    parseTaskCreatePayload,
    parseTaskDueDatePayload,
    parseTaskEnergyRequirementPayload,
    parseTaskImpactPayload,
    parseTaskReorderPayload,
    parseTaskTimeEstimateMinutesPayload,
    parseTaskUpdatePayload,
)


def test_parse_task_create_payload_happy_path():
    payload = parseTaskCreatePayload({"title": "Buy milk", "description": "2%"})

    assert payload.title == "Buy milk"
    assert payload.description == "2%"


def test_parse_task_create_payload_defaults_description_to_empty_string():
    payload = parseTaskCreatePayload({"title": "Buy milk"})

    assert payload.description == ""


def test_parse_task_create_payload_defaults_group_id_to_none():
    payload = parseTaskCreatePayload({"title": "Buy milk"})

    assert payload.group_id is None


def test_parse_task_create_payload_accepts_group_id():
    payload = parseTaskCreatePayload({"title": "Buy milk", "group_id": "group-1"})

    assert payload.group_id == "group-1"


def test_parse_task_create_payload_non_string_group_id_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskCreatePayload({"title": "Buy milk", "group_id": 123})


def test_parse_task_create_payload_missing_title_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskCreatePayload({})


def test_parse_task_create_payload_non_string_title_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskCreatePayload({"title": 123})


def test_parse_task_create_payload_non_string_description_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskCreatePayload({"title": "Buy milk", "description": 123})


def test_parse_task_create_payload_non_dict_body_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskCreatePayload(["not", "a", "dict"])


def test_parse_task_update_payload_allows_all_fields_omitted():
    payload = parseTaskUpdatePayload({})

    assert payload.title is None
    assert payload.description is None


def test_parse_task_update_payload_happy_path():
    payload = parseTaskUpdatePayload({"title": "New title", "description": "New desc"})

    assert payload.title == "New title"
    assert payload.description == "New desc"


def test_parse_task_update_payload_non_string_title_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskUpdatePayload({"title": 123})


def test_parse_task_update_payload_non_dict_body_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskUpdatePayload(None)


def test_parse_task_reorder_payload_happy_path():
    payload = parseTaskReorderPayload({"task_ids": ["b", "a"]})

    assert payload.task_ids == ["b", "a"]


def test_parse_task_reorder_payload_allows_empty_list():
    payload = parseTaskReorderPayload({"task_ids": []})

    assert payload.task_ids == []


def test_parse_task_reorder_payload_missing_task_ids_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskReorderPayload({})


def test_parse_task_reorder_payload_non_list_task_ids_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskReorderPayload({"task_ids": "a"})


def test_parse_task_reorder_payload_non_string_item_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskReorderPayload({"task_ids": ["a", 123]})


def test_parse_task_reorder_payload_non_dict_body_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskReorderPayload(["not", "a", "dict"])


def test_parse_task_energy_requirement_payload_happy_path():
    payload = parseTaskEnergyRequirementPayload({"energy_requirement": 3})

    assert payload.energy_requirement == 3


def test_parse_task_energy_requirement_payload_accepts_null():
    payload = parseTaskEnergyRequirementPayload({"energy_requirement": None})

    assert payload.energy_requirement is None


def test_parse_task_energy_requirement_payload_defaults_omitted_to_none():
    payload = parseTaskEnergyRequirementPayload({})

    assert payload.energy_requirement is None


def test_parse_task_energy_requirement_payload_out_of_range_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskEnergyRequirementPayload({"energy_requirement": 0})
    with pytest.raises(InvalidPayloadError):
        parseTaskEnergyRequirementPayload({"energy_requirement": 6})


def test_parse_task_energy_requirement_payload_non_int_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskEnergyRequirementPayload({"energy_requirement": "3"})
    with pytest.raises(InvalidPayloadError):
        parseTaskEnergyRequirementPayload({"energy_requirement": 3.5})


def test_parse_task_energy_requirement_payload_non_dict_body_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskEnergyRequirementPayload(["not", "a", "dict"])


def test_parse_task_impact_payload_happy_path():
    payload = parseTaskImpactPayload({"impact": 5})

    assert payload.impact == 5


def test_parse_task_impact_payload_accepts_null():
    payload = parseTaskImpactPayload({"impact": None})

    assert payload.impact is None


def test_parse_task_impact_payload_out_of_range_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskImpactPayload({"impact": 0})
    with pytest.raises(InvalidPayloadError):
        parseTaskImpactPayload({"impact": 6})


def test_parse_task_impact_payload_non_int_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskImpactPayload({"impact": "5"})


def test_parse_task_impact_payload_non_dict_body_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskImpactPayload(["not", "a", "dict"])


def test_parse_task_due_date_payload_happy_path():
    payload = parseTaskDueDatePayload({"due_date": "2026-08-01"})

    assert payload.due_date == "2026-08-01"


def test_parse_task_due_date_payload_accepts_null():
    payload = parseTaskDueDatePayload({"due_date": None})

    assert payload.due_date is None


def test_parse_task_due_date_payload_defaults_omitted_to_none():
    payload = parseTaskDueDatePayload({})

    assert payload.due_date is None


def test_parse_task_due_date_payload_malformed_date_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskDueDatePayload({"due_date": "08/01/2026"})


def test_parse_task_due_date_payload_non_string_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskDueDatePayload({"due_date": 20260801})


def test_parse_task_due_date_payload_non_dict_body_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskDueDatePayload(["not", "a", "dict"])


def test_parse_task_time_estimate_minutes_payload_happy_path():
    payload = parseTaskTimeEstimateMinutesPayload({"time_estimate_minutes": 45})

    assert payload.time_estimate_minutes == 45


def test_parse_task_time_estimate_minutes_payload_accepts_null():
    payload = parseTaskTimeEstimateMinutesPayload({"time_estimate_minutes": None})

    assert payload.time_estimate_minutes is None


def test_parse_task_time_estimate_minutes_payload_defaults_omitted_to_none():
    payload = parseTaskTimeEstimateMinutesPayload({})

    assert payload.time_estimate_minutes is None


def test_parse_task_time_estimate_minutes_payload_non_multiple_of_15_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskTimeEstimateMinutesPayload({"time_estimate_minutes": 20})


def test_parse_task_time_estimate_minutes_payload_zero_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskTimeEstimateMinutesPayload({"time_estimate_minutes": 0})


def test_parse_task_time_estimate_minutes_payload_negative_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskTimeEstimateMinutesPayload({"time_estimate_minutes": -15})


def test_parse_task_time_estimate_minutes_payload_non_int_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskTimeEstimateMinutesPayload({"time_estimate_minutes": "45"})


def test_parse_task_time_estimate_minutes_payload_non_dict_body_raises():
    with pytest.raises(InvalidPayloadError):
        parseTaskTimeEstimateMinutesPayload(["not", "a", "dict"])
