"""Entry point: builds the Flask app and starts the dev server.

VS Code debugging is wired entirely through .vscode/launch.json's "Backend: Flask (debugpy
launch)" configuration (debugpy, request: launch, subProcess: true) — VS Code spawns this file
directly as the debuggee, and debugpy auto-attaches to the Werkzeug-reloader-forked child process
that actually serves requests. No manual debugpy wiring is needed here.
"""

import threading

from core.app_factory import create_app
from core.config.settings import (
    SETTING_BACKEND_PORT,
    SETTING_FLASK_DEBUG,
    get_setting_bool,
    get_setting_int,
)

# WinError code for "An operation was attempted on something that is not a socket".
WINDOWS_SOCKET_TEARDOWN_ERROR = 10038


def _ignore_windows_socket_teardown_race(args: threading.ExceptHookArgs) -> None:
    """Suppresses a known Werkzeug/Windows race: Ctrl+C closes the reloader's listening socket
    while its serve_forever thread is still polling it, raising WinError 10038 during teardown
    after shutdown has already begun. Harmless noise — every other thread exception still goes
    through the default handler.
    """
    if (
        isinstance(args.exc_value, OSError)
        and getattr(args.exc_value, "winerror", None) == WINDOWS_SOCKET_TEARDOWN_ERROR
    ):
        return
    threading.__excepthook__(args)


def main() -> None:
    """Starts the Flask dev server."""
    threading.excepthook = _ignore_windows_socket_teardown_race
    app = create_app()
    app.run(
        host="127.0.0.1",
        port=get_setting_int(SETTING_BACKEND_PORT),
        debug=get_setting_bool(SETTING_FLASK_DEBUG),
        exclude_patterns=["*/tests/*", "*/__pycache__/*"],
        reloader_type="stat",
    )


if __name__ == "__main__":
    main()
