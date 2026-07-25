import pytest

from src.main.backend.database import profile as profile_module
from src.main.backend.database import task as task_module
from src.main.backend.database.profile import (
    DEFAULT_DISPLAY_NAME,
    deleteAllData,
    getProfile,
    setDisplayName,
)
from src.main.backend.database.task import createTask, getAllTasks


@pytest.fixture(autouse=True)
def _use_tmp_data_root(tmp_path, monkeypatch):
    monkeypatch.setattr(profile_module, "DATA_ROOT", tmp_path)
    monkeypatch.setattr(task_module, "DATA_ROOT", tmp_path)


def test_get_profile_returns_default_when_unset():
    profile = getProfile()

    assert profile.display_name == DEFAULT_DISPLAY_NAME


def test_set_display_name_persists_and_is_retrievable():
    setDisplayName("Austin")

    assert getProfile().display_name == "Austin"


def test_set_display_name_can_be_set_to_empty_string():
    setDisplayName("")

    assert getProfile().display_name == ""


def test_set_display_name_overwrites_previous_value():
    setDisplayName("Austin")
    setDisplayName("Jamie")

    assert getProfile().display_name == "Jamie"


def test_delete_all_data_resets_profile_to_default():
    setDisplayName("Austin")

    deleteAllData()

    assert getProfile().display_name == DEFAULT_DISPLAY_NAME


def test_delete_all_data_clears_tasks_too():
    createTask("Buy milk")

    deleteAllData()

    assert getAllTasks() == []
