# @manualReviewRequested: 2026-07-06
from core.storage.atomic_write import write_text_atomically


def test_writes_content_to_the_target_path(tmp_path):
    target = tmp_path / "record.rec"
    write_text_atomically(target, "hello world")
    assert target.read_text(encoding="utf-8") == "hello world"


def test_overwrites_existing_content(tmp_path):
    target = tmp_path / "record.rec"
    write_text_atomically(target, "first")
    write_text_atomically(target, "second")
    assert target.read_text(encoding="utf-8") == "second"


def test_creates_parent_directories(tmp_path):
    target = tmp_path / "nested" / "dir" / "record.rec"
    write_text_atomically(target, "hello")
    assert target.read_text(encoding="utf-8") == "hello"


def test_no_leftover_temp_file(tmp_path):
    target = tmp_path / "record.rec"
    write_text_atomically(target, "hello")
    leftovers = list(tmp_path.glob("*.tmp"))
    assert leftovers == []
