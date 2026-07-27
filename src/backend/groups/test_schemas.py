import pytest

from src.backend.groups.schemas import (
    InvalidPayloadError,
    parseGroupCreatePayload,
    parseGroupReorderPayload,
    parseGroupUpdatePayload,
)


def test_parse_group_create_payload_happy_path():
    payload = parseGroupCreatePayload({"name": "Home renovation"})

    assert payload.name == "Home renovation"


def test_parse_group_create_payload_missing_name_raises():
    with pytest.raises(InvalidPayloadError):
        parseGroupCreatePayload({})


def test_parse_group_create_payload_non_string_name_raises():
    with pytest.raises(InvalidPayloadError):
        parseGroupCreatePayload({"name": 123})


def test_parse_group_create_payload_non_dict_body_raises():
    with pytest.raises(InvalidPayloadError):
        parseGroupCreatePayload(["not", "a", "dict"])


def test_parse_group_update_payload_happy_path():
    payload = parseGroupUpdatePayload({"name": "Home projects"})

    assert payload.name == "Home projects"


def test_parse_group_update_payload_missing_name_raises():
    with pytest.raises(InvalidPayloadError):
        parseGroupUpdatePayload({})


def test_parse_group_update_payload_non_string_name_raises():
    with pytest.raises(InvalidPayloadError):
        parseGroupUpdatePayload({"name": 123})


def test_parse_group_update_payload_non_dict_body_raises():
    with pytest.raises(InvalidPayloadError):
        parseGroupUpdatePayload(None)


def test_parse_group_reorder_payload_happy_path():
    payload = parseGroupReorderPayload({"group_ids": ["b", "a"]})

    assert payload.group_ids == ["b", "a"]


def test_parse_group_reorder_payload_missing_group_ids_raises():
    with pytest.raises(InvalidPayloadError):
        parseGroupReorderPayload({})


def test_parse_group_reorder_payload_non_list_group_ids_raises():
    with pytest.raises(InvalidPayloadError):
        parseGroupReorderPayload({"group_ids": "a"})


def test_parse_group_reorder_payload_non_dict_body_raises():
    with pytest.raises(InvalidPayloadError):
        parseGroupReorderPayload(["not", "a", "dict"])
