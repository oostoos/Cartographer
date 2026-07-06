# @manualReviewRequested: 2026-07-06
import pytest

from core.storage.control_chars import ALL_CONTROL_CHARACTERS, raise_if_contains_control_characters
from core.storage.errors import ValidationError


def test_ordinary_text_passes():
    raise_if_contains_control_characters("Buy birthday gift for Sam")


@pytest.mark.parametrize("character", ALL_CONTROL_CHARACTERS)
def test_each_control_character_is_rejected(character):
    with pytest.raises(ValidationError):
        raise_if_contains_control_characters(f"tainted{character}value")


def test_empty_string_passes():
    raise_if_contains_control_characters("")
