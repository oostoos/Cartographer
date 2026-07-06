"""The @login_required decorator that gates every feature route except auth and the health
check. Single local user, session-cookie based — see app/auth/auth_routes.py for login/logout.
"""

from functools import wraps

from flask import jsonify, session

# The session key set to True once the single local user has logged in.
SESSION_KEY_IS_LOGGED_IN = "is_logged_in"


def login_required(view_function):
    """Wraps a Flask view so it returns 401 instead of running when no one is logged in."""

    @wraps(view_function)
    def wrapped_view(*args, **kwargs):
        if not session.get(SESSION_KEY_IS_LOGGED_IN, False):
            return jsonify(error="Not logged in."), 401
        return view_function(*args, **kwargs)

    return wrapped_view
