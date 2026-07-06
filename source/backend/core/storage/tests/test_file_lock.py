import threading
import time

import pytest

from core.storage.errors import LockTimeoutError
from core.storage.file_lock import hold_write_lock


def test_lock_can_be_acquired_and_released(tmp_path):
    record_path = tmp_path / "record.rec"
    with hold_write_lock(record_path):
        pass
    # A second, independent acquisition must succeed once the first has exited.
    with hold_write_lock(record_path):
        pass


def test_second_writer_waits_for_the_first(tmp_path):
    record_path = tmp_path / "record.rec"
    order = []

    def hold_briefly():
        with hold_write_lock(record_path):
            order.append("first-acquired")
            time.sleep(0.2)
            order.append("first-released")

    first_thread = threading.Thread(target=hold_briefly)
    first_thread.start()
    time.sleep(0.05)  # let the first thread acquire the lock before we try
    with hold_write_lock(record_path):
        order.append("second-acquired")
    first_thread.join()

    assert order == ["first-acquired", "first-released", "second-acquired"]


def test_raises_lock_timeout_when_another_writer_holds_it_too_long(tmp_path, monkeypatch):
    monkeypatch.setattr("core.storage.file_lock.LOCK_TIMEOUT_SECONDS", 0.1)
    record_path = tmp_path / "record.rec"
    release_event = threading.Event()

    def hold_until_released():
        with hold_write_lock(record_path):
            release_event.wait(timeout=2)

    holder_thread = threading.Thread(target=hold_until_released)
    holder_thread.start()
    time.sleep(0.05)
    try:
        with pytest.raises(LockTimeoutError):
            with hold_write_lock(record_path):
                pass
    finally:
        release_event.set()
        holder_thread.join()
