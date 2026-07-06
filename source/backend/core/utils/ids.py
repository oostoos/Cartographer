# @manualReviewRequested: 2026-07-06
"""The one place a new record id is generated, so every object type gets the same id shape."""

import uuid


def new_id() -> str:
    """Returns a new globally-unique record id."""
    return str(uuid.uuid4())
