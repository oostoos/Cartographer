import types

import pytest

from core.storage.object_registry import dereference, register
from core.storage.record_block import RecordBlock


def _make_fake_module(loaded_by_id):
    fake_module = types.ModuleType("fake_project_module")
    fake_module.load = lambda record_id: RecordBlock(
        object_type="Project", record_id=record_id, path=loaded_by_id, fields={}
    )
    return fake_module


def test_dereference_returns_none_for_an_empty_record_id():
    assert dereference("Project", "") is None


def test_dereference_loads_via_the_registered_module(tmp_path):
    register("Project", _make_fake_module(tmp_path / "project.rec"))
    block = dereference("Project", "some-id")
    assert block.record_id == "some-id"
    assert block.object_type == "Project"


def test_dereference_raises_for_an_unregistered_type():
    with pytest.raises(KeyError):
        dereference("NeverRegistered", "some-id")
