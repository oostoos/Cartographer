# @manualReviewRequested: 2026-07-06
"""The one place "what day is it" is read, so tests can mock a single function instead of
patching datetime.date.today() everywhere it's used.
"""

from datetime import date


def today() -> date:
    """Returns the current local calendar date."""
    return date.today()
