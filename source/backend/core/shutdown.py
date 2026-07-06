"""Tears down the whole dev process tree a short while after the browser tab closes, unless a new
page load cancels it first (so a refresh — which fires the same unload signal as a real close —
doesn't kill the backend).
"""

import os
import subprocess
import threading

# How long to wait after a shutdown request before actually killing the process, giving a page
# refresh time to load and cancel it.
GRACE_PERIOD_SECONDS = 2

_pending_shutdown_timer: threading.Timer | None = None
_pending_shutdown_lock = threading.Lock()


def schedule_shutdown() -> None:
    """Starts the grace-period shutdown timer if one isn't already pending. Safe to call more
    than once (e.g. from duplicate unload signals) — later calls while a timer is pending do
    nothing.
    """
    global _pending_shutdown_timer
    with _pending_shutdown_lock:
        if _pending_shutdown_timer is not None:
            return
        _pending_shutdown_timer = threading.Timer(GRACE_PERIOD_SECONDS, _terminate_process_tree)
        _pending_shutdown_timer.daemon = True
        _pending_shutdown_timer.start()


def cancel_pending_shutdown() -> None:
    """Cancels the pending shutdown timer, if any. A no-op when nothing is pending, so it's safe
    to call unconditionally on every page load.
    """
    global _pending_shutdown_timer
    with _pending_shutdown_lock:
        if _pending_shutdown_timer is not None:
            _pending_shutdown_timer.cancel()
            _pending_shutdown_timer = None


def _process_tree_root_pid() -> int:
    """Returns the pid to kill to bring down the whole Flask process tree.

    Werkzeug's reloader runs the actual worker in a child process (marked by WERKZEUG_RUN_MAIN)
    under a long-lived reloader parent. Killing the parent's whole tree also reaps this worker;
    with no reloader in the picture, the current process is the only one there is.
    """
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        return os.getppid()
    return os.getpid()


def _terminate_process_tree() -> None:
    """Kills the Flask process tree via taskkill (Windows-native, full-subtree kill)."""
    pid = _process_tree_root_pid()
    subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], check=False)
