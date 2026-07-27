import os

import pytest

from lib.language.python.file_io.file_lock import (
    LockTimeoutError,
    acquireExclusiveLock,
    releaseExclusiveLock,
)


def test_acquire_and_release_lock(tmp_path):
    target = tmp_path / "record.page"

    handle = acquireExclusiveLock(target)
    assert handle.lock_path.exists()

    releaseExclusiveLock(handle)
    assert not handle.lock_path.exists()


def test_acquire_lock_times_out_on_contention(tmp_path):
    target = tmp_path / "record.page"
    first_handle = acquireExclusiveLock(target)

    try:
        with pytest.raises(LockTimeoutError):
            acquireExclusiveLock(target, timeout_seconds=0.1, retry_delay_seconds=0.02)
    finally:
        releaseExclusiveLock(first_handle)


def test_release_lock_is_safe_when_already_released(tmp_path):
    target = tmp_path / "record.page"
    handle = acquireExclusiveLock(target)

    releaseExclusiveLock(handle)
    releaseExclusiveLock(handle)


def test_acquire_lock_succeeds_again_after_release(tmp_path):
    target = tmp_path / "record.page"
    first_handle = acquireExclusiveLock(target)
    releaseExclusiveLock(first_handle)

    second_handle = acquireExclusiveLock(target)

    releaseExclusiveLock(second_handle)


def test_acquire_lock_retries_through_transient_permission_error(tmp_path, monkeypatch):
    # On Windows, a lock file being concurrently created/deleted can transiently
    # surface as PermissionError instead of FileExistsError. acquireExclusiveLock
    # must retry through that rather than propagating it immediately.
    target = tmp_path / "record.page"
    real_open = os.open
    calls = {"count": 0}

    def _flaky_open(path, flags):
        calls["count"] += 1
        if calls["count"] <= 2:
            raise PermissionError("simulated transient Windows lock race")
        return real_open(path, flags)

    monkeypatch.setattr(os, "open", _flaky_open)

    handle = acquireExclusiveLock(target, timeout_seconds=1.0, retry_delay_seconds=0.01)

    assert calls["count"] == 3
    releaseExclusiveLock(handle)
