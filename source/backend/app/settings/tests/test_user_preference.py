import pytest

from core.storage.errors import RecordNotFoundError, ValidationError
from app.settings import user_preference


def test_create_defaults_to_an_empty_display_name():
    block = user_preference.create()
    assert user_preference.get_display_name(block=block) == ""
    assert user_preference.get_created_at(block=block) != ""


def test_create_rejects_a_display_name_containing_a_control_character():
    with pytest.raises(ValidationError):
        user_preference.create("tainted\x1ename")


def test_load_raises_for_a_missing_record():
    with pytest.raises(RecordNotFoundError):
        user_preference.load("does-not-exist")


def test_load_singleton_returns_none_before_any_record_exists():
    assert user_preference.load_singleton() is None


def test_get_or_create_singleton_creates_on_first_use():
    created = user_preference.get_or_create_singleton()
    assert user_preference.list_ids() == [user_preference.get_id(block=created)]


def test_get_or_create_singleton_returns_the_same_record_on_later_calls():
    first_call = user_preference.get_or_create_singleton()
    second_call = user_preference.get_or_create_singleton()
    assert user_preference.get_id(block=first_call) == user_preference.get_id(block=second_call)
    assert len(user_preference.list_ids()) == 1


def test_set_display_name_round_trips():
    created = user_preference.create()
    user_preference.set_display_name("Austin", block=created)
    assert user_preference.get_display_name(block=created) == "Austin"
