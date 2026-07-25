import pytest

from src.main.backend.tasks.schemas import (
    InvalidPayloadError,
    parseTaskCreatePayload,
    parseTaskUpdatePayload,
)


def test_parse_task_create_payload_happy_path():
    payload = parseTaskCreatePayload({"title": "Buy milk", "description": "2%"})

    assert payload.title == "Buy milk"
    assert payload.description == "2%"


def test_parse_task_create_payload_defaults_description_to_empty_string():
    payload = parseTaskCreatePayload({"title": "Buy milk"})

    assert payload.description == ""


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
