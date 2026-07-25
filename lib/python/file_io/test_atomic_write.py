import os

import pytest

from lib.python.file_io.atomic_write import atomicWriteText


def test_atomic_write_creates_file_with_content(tmp_path):
    target = tmp_path / "file.txt"

    atomicWriteText(target, "hello")

    assert target.read_text(encoding="utf-8") == "hello"


def test_atomic_write_overwrites_existing_file(tmp_path):
    target = tmp_path / "file.txt"
    target.write_text("old", encoding="utf-8")

    atomicWriteText(target, "new")

    assert target.read_text(encoding="utf-8") == "new"


def test_atomic_write_creates_parent_directories(tmp_path):
    target = tmp_path / "nested" / "dir" / "file.txt"

    atomicWriteText(target, "hello")

    assert target.read_text(encoding="utf-8") == "hello"


def test_atomic_write_leaves_no_temp_files_behind_on_success(tmp_path):
    target = tmp_path / "file.txt"

    atomicWriteText(target, "hello")

    assert list(tmp_path.iterdir()) == [target]


def test_atomic_write_cleans_up_temp_file_on_failure(tmp_path, monkeypatch):
    target = tmp_path / "file.txt"

    def _raise_replace(*_args, **_kwargs):
        raise OSError("simulated failure")

    monkeypatch.setattr(os, "replace", _raise_replace)

    with pytest.raises(OSError):
        atomicWriteText(target, "hello")

    assert not target.exists()
    assert list(tmp_path.iterdir()) == []
