import os
import time

import pytest

from core import shutdown

# Long enough for a timer thread to reliably fire within a test, short enough to keep the suite fast.
FAST_GRACE_PERIOD_SECONDS = 0.05


@pytest.fixture(autouse=True)
def clear_pending_shutdown():
    """Guarantees no test leaks a pending shutdown timer into the next one."""
    yield
    shutdown.cancel_pending_shutdown()


def test_schedule_shutdown_terminates_after_grace_period(monkeypatch):
    calls = []
    monkeypatch.setattr(shutdown, "GRACE_PERIOD_SECONDS", FAST_GRACE_PERIOD_SECONDS)
    monkeypatch.setattr(shutdown, "_terminate_process_tree", lambda: calls.append(1))

    shutdown.schedule_shutdown()
    time.sleep(FAST_GRACE_PERIOD_SECONDS * 4)

    assert calls == [1]


def test_cancel_pending_shutdown_prevents_termination(monkeypatch):
    calls = []
    monkeypatch.setattr(shutdown, "GRACE_PERIOD_SECONDS", FAST_GRACE_PERIOD_SECONDS)
    monkeypatch.setattr(shutdown, "_terminate_process_tree", lambda: calls.append(1))

    shutdown.schedule_shutdown()
    shutdown.cancel_pending_shutdown()
    time.sleep(FAST_GRACE_PERIOD_SECONDS * 4)

    assert calls == []


def test_cancel_pending_shutdown_without_pending_is_noop():
    shutdown.cancel_pending_shutdown()  # should not raise


def test_schedule_shutdown_is_idempotent_while_pending(monkeypatch):
    calls = []
    monkeypatch.setattr(shutdown, "GRACE_PERIOD_SECONDS", FAST_GRACE_PERIOD_SECONDS)
    monkeypatch.setattr(shutdown, "_terminate_process_tree", lambda: calls.append(1))

    shutdown.schedule_shutdown()
    shutdown.schedule_shutdown()  # second call while pending should not start a second timer
    time.sleep(FAST_GRACE_PERIOD_SECONDS * 4)

    assert calls == [1]


def test_process_tree_root_pid_targets_reloader_parent_when_inside_worker(monkeypatch):
    monkeypatch.setenv("WERKZEUG_RUN_MAIN", "true")
    assert shutdown._process_tree_root_pid() == os.getppid()


def test_process_tree_root_pid_targets_self_when_no_reloader(monkeypatch):
    monkeypatch.delenv("WERKZEUG_RUN_MAIN", raising=False)
    assert shutdown._process_tree_root_pid() == os.getpid()
