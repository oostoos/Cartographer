# @manualReviewRequested: 2026-07-06
import threading

import pytest

from core.storage.errors import MalformedRecordError, RecordNotFoundError
from core.storage.record_block import RecordBlock
from core.storage.record_store import (
    create_record,
    delete_record,
    find_blocks,
    find_one_block,
    list_all_blocks,
    list_record_ids,
    load_block,
    purge_all_data,
    record_path,
    resolve_block,
    save_block,
)

OBJECT_TYPE = "Widget"


def test_create_then_load_round_trips_fields():
    block = create_record(OBJECT_TYPE, {"title": "First widget"})
    loaded = load_block(OBJECT_TYPE, block.record_id)
    assert loaded.fields["title"] == "First widget"
    assert loaded.fields["__type__"] == OBJECT_TYPE
    assert loaded.fields["id"] == block.record_id


def test_load_raises_for_a_missing_record():
    with pytest.raises(RecordNotFoundError):
        load_block(OBJECT_TYPE, "does-not-exist")


def test_load_raises_for_a_truncated_file():
    block = create_record(OBJECT_TYPE, {"title": "Will be corrupted"})
    block.path.write_text("title\x1eBuy milk\x1e", encoding="utf-8")  # missing key/value separator
    with pytest.raises(MalformedRecordError):
        load_block(OBJECT_TYPE, block.record_id)


def test_load_on_an_empty_file_returns_no_fields():
    block = create_record(OBJECT_TYPE, {"title": "Will be emptied"})
    block.path.write_text("", encoding="utf-8")
    loaded = load_block(OBJECT_TYPE, block.record_id)
    assert loaded.fields == {}


def test_save_is_a_no_op_when_block_is_not_dirty(monkeypatch):
    block = create_record(OBJECT_TYPE, {"title": "Untouched"})
    assert block.is_dirty is False

    write_calls = []
    monkeypatch.setattr(
        "core.storage.record_store.write_text_atomically",
        lambda path, content: write_calls.append(path),
    )
    save_block(block)
    assert write_calls == []


def test_save_writes_once_when_dirty(monkeypatch):
    block = create_record(OBJECT_TYPE, {"title": "Original"})
    block.fields["title"] = "Changed"
    block.is_dirty = True

    write_calls = []
    monkeypatch.setattr(
        "core.storage.record_store.write_text_atomically",
        lambda path, content: write_calls.append(path),
    )
    save_block(block)
    assert len(write_calls) == 1
    assert block.is_dirty is False


def test_delete_removes_the_file():
    block = create_record(OBJECT_TYPE, {"title": "Temporary"})
    delete_record(OBJECT_TYPE, block.record_id)
    assert not record_path(OBJECT_TYPE, block.record_id).exists()


def test_delete_is_a_no_op_for_a_missing_record():
    delete_record(OBJECT_TYPE, "never-existed")  # must not raise


def test_list_record_ids_returns_every_created_record():
    first = create_record(OBJECT_TYPE, {"title": "One"})
    second = create_record(OBJECT_TYPE, {"title": "Two"})
    assert set(list_record_ids(OBJECT_TYPE)) == {first.record_id, second.record_id}


def test_list_record_ids_does_not_read_file_contents(monkeypatch):
    create_record(OBJECT_TYPE, {"title": "One"})
    monkeypatch.setattr(
        "core.storage.record_store.decode_fields",
        lambda text: (_ for _ in ()).throw(AssertionError("list_record_ids must not parse files")),
    )
    list_record_ids(OBJECT_TYPE)  # must not raise


def test_list_all_blocks_loads_every_record():
    create_record(OBJECT_TYPE, {"title": "One"})
    create_record(OBJECT_TYPE, {"title": "Two"})
    titles = {block.fields["title"] for block in list_all_blocks(OBJECT_TYPE)}
    assert titles == {"One", "Two"}


def test_concurrent_writers_do_not_corrupt_the_file():
    # The write lock's job is to serialize writers so the file is never left half-written, not
    # to make a separate load-then-save sequence transactional. Each thread writes its own
    # distinct, fully-formed field set many times in a row; whichever write lands last, the
    # file must always be one complete, parseable write — never a mix of two writes.
    block = create_record(OBJECT_TYPE, {"writer": "none"})
    record_id = block.record_id
    writes_per_thread = 20
    thread_count = 4

    def write_many_times(writer_name):
        for attempt in range(writes_per_thread):
            local_block = RecordBlock(
                object_type=OBJECT_TYPE,
                record_id=record_id,
                path=record_path(OBJECT_TYPE, record_id),
                fields={"__type__": OBJECT_TYPE, "id": record_id, "writer": f"{writer_name}-{attempt}"},
                is_dirty=True,
            )
            save_block(local_block)

    threads = [threading.Thread(target=write_many_times, args=(f"writer{i}",)) for i in range(thread_count)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    final = load_block(OBJECT_TYPE, record_id)
    assert final.fields["writer"].startswith("writer")


def test_find_blocks_matches_every_given_filter():
    create_record(OBJECT_TYPE, {"category": "a", "size": "small"})
    matching = create_record(OBJECT_TYPE, {"category": "a", "size": "large"})
    create_record(OBJECT_TYPE, {"category": "b", "size": "large"})

    results = find_blocks(OBJECT_TYPE, category="a", size="large")
    assert [block.record_id for block in results] == [matching.record_id]


def test_find_blocks_returns_empty_list_when_nothing_matches():
    create_record(OBJECT_TYPE, {"category": "a"})
    assert find_blocks(OBJECT_TYPE, category="never-matches") == []


def test_find_one_block_returns_none_when_nothing_matches():
    assert find_one_block(OBJECT_TYPE, category="never-matches") is None


def test_find_one_block_returns_a_match():
    match = create_record(OBJECT_TYPE, {"category": "unique-value"})
    found = find_one_block(OBJECT_TYPE, category="unique-value")
    assert found.record_id == match.record_id


def test_resolve_block_loads_by_record_id():
    block = create_record(OBJECT_TYPE, {"title": "Loaded by id"})
    resolved = resolve_block(OBJECT_TYPE, block.record_id, None)
    assert resolved.fields["title"] == "Loaded by id"


def test_resolve_block_returns_the_given_block_directly():
    block = create_record(OBJECT_TYPE, {"title": "Given directly"})
    block.fields["title"] = "Changed in memory, not saved"
    resolved = resolve_block(OBJECT_TYPE, None, block)
    assert resolved is block


def test_resolve_block_rejects_neither_argument():
    with pytest.raises(ValueError):
        resolve_block(OBJECT_TYPE, None, None)


def test_resolve_block_rejects_both_arguments():
    block = create_record(OBJECT_TYPE, {"title": "Both given"})
    with pytest.raises(ValueError):
        resolve_block(OBJECT_TYPE, block.record_id, block)


def test_purge_all_data_removes_every_object_types_records():
    create_record(OBJECT_TYPE, {"title": "One"})
    create_record("OtherWidget", {"title": "Two"})

    purge_all_data()

    assert list_record_ids(OBJECT_TYPE) == []
    assert list_record_ids("OtherWidget") == []


def test_purge_all_data_is_a_no_op_when_nothing_has_been_created_yet():
    purge_all_data()  # must not raise even before any record has ever been created
