import pytest

from src.main.backend.projects.schemas import InvalidPayloadError, parseProjectCreatePayload


def test_parse_project_create_payload_happy_path():
    payload = parseProjectCreatePayload({"name": "Home renovation"})

    assert payload.name == "Home renovation"


def test_parse_project_create_payload_missing_name_raises():
    with pytest.raises(InvalidPayloadError):
        parseProjectCreatePayload({})


def test_parse_project_create_payload_non_string_name_raises():
    with pytest.raises(InvalidPayloadError):
        parseProjectCreatePayload({"name": 123})


def test_parse_project_create_payload_non_dict_body_raises():
    with pytest.raises(InvalidPayloadError):
        parseProjectCreatePayload(["not", "a", "dict"])
