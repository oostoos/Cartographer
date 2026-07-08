<!-- @manualReviewRequested: 2026-07-07 -->
# Recurrence (backend)

Just the shared cadence math now — `RecurringTaskTemplate` is gone, replaced entirely by
`app/blocks/` (a recurring block of time containing nested tasks; see `app/blocks/CLAUDE.md`).

`frequency.py` holds the `Frequency` enum (`DAILY`/`WEEKLY`/`MONTHLY`/`YEARLY`) and
`DEFAULT_INTERVAL`, split into its own module so neither `recurrence_engine.py` nor any of its
callers create an import cycle over it.

`recurrence_engine.py` (`occurs_on`, `generate_occurrences`, `clamp_day_to_month`) is the pure
date math answering "does this occur on date D," taking every cadence field (`frequency`,
`interval`, `start_date`, `end_date`, `days_of_week`, `day_of_month`, `month_of_year`) as a
primitive value rather than a loaded record — this is what lets it serve two different callers
with no duplicated logic and no coupling to either one's storage shape:

- `app/blocks/block_task_template.py`'s *optional* per-task cadence override — e.g. within a
  block, "change razor blade" weekly or "deep clean shower" monthly, layered on top of whichever
  days the block itself occurs.
- `app/blocks/block_template_segment.py`'s block-level occurrence — a block's own
  daily/weekly/monthly/yearly + "every N" shape, generalized from the old fixed per-weekday
  on/off grid. A segment calls `occurs_on` once per `InstanceRow` (translating that row's selector
  into whichever cadence field its frequency needs — `days_of_week` for weekly, `day_of_month` for
  monthly, `day_of_month`+`month_of_year` for yearly), so "simple" (one row per selected unit,
  shared time) and "advanced" (several rows, each its own time) editing modes are just different
  ways of building the same `InstanceRow` list — the engine itself doesn't know or care which mode
  produced it.

Date math uses `datetime.date` exclusively, never timezone-aware datetimes — don't introduce one,
it's what makes DST a non-issue here.
