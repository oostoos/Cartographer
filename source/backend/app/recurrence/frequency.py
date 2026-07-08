# @manualReviewRequested: 2026-07-07
"""The Frequency value type shared by recurrence_engine.py's cadence math and
app/blocks/block_task_template.py's per-task cadence override. Split out from
recurrence_engine.py itself so the two modules don't import each other in a cycle
(recurrence_engine reads a BlockTaskTemplate's fields; a BlockTaskTemplate stores a Frequency).
"""

from enum import IntEnum


class Frequency(IntEnum):
    """How often a per-task cadence override repeats. Stored on disk as this member's ordinal
    (see encode_optional_enum/decode_optional_enum).
    """

    DAILY = 0
    WEEKLY = 1
    MONTHLY = 2
    YEARLY = 3


FREQUENCY_DAILY = Frequency.DAILY
FREQUENCY_WEEKLY = Frequency.WEEKLY
FREQUENCY_MONTHLY = Frequency.MONTHLY
FREQUENCY_YEARLY = Frequency.YEARLY

# Default "every-X" interval: repeats every single unit of the frequency.
DEFAULT_INTERVAL = 1
