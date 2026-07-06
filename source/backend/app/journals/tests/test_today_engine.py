from datetime import date

from app.journals import today_engine
from app.recurrence import recurring_task_template
from app.tasks import subtask, task


def _set_today(monkeypatch, fake_today):
    monkeypatch.setattr("core.utils.clock.today", lambda: fake_today)


def test_ensure_todays_recurring_tasks_exist_creates_an_instance_for_a_template_due_today(
    monkeypatch,
):
    _set_today(monkeypatch, date(2026, 7, 4))  # a Saturday
    template = recurring_task_template.create(
        "Water the plants",
        recurring_task_template.FREQUENCY_DAILY,
        start_date=date(2026, 7, 1),
        description="Check the soil",
        project_id="project-123",
        tags=["chores"],
    )
    today_engine.ensure_todays_recurring_tasks_exist()

    instances = task.find(recurring_template_id=recurring_task_template.get_id(block=template))
    assert len(instances) == 1
    instance = instances[0]
    assert task.get_title(block=instance) == "Water the plants"
    assert task.get_description(block=instance) == "Check the soil"
    assert task.get_project_id(block=instance) == "project-123"
    assert task.get_tags(block=instance) == ["chores"]
    assert task.get_due_date(block=instance) == date(2026, 7, 4)
    assert task.get_is_complete(block=instance) is False


def test_ensure_todays_recurring_tasks_exist_copies_subtask_titles_onto_the_new_instance(
    monkeypatch,
):
    _set_today(monkeypatch, date(2026, 7, 4))
    template = recurring_task_template.create(
        "Morning routine",
        recurring_task_template.FREQUENCY_DAILY,
        start_date=date(2026, 7, 1),
        subtask_titles=["Stretch", "Hydrate"],
    )
    today_engine.ensure_todays_recurring_tasks_exist()

    instance = task.find_one(recurring_template_id=recurring_task_template.get_id(block=template))
    subtasks = subtask.find(task_id=task.get_id(block=instance))
    titles = sorted(subtask.get_title(block=s) for s in subtasks)
    assert titles == ["Hydrate", "Stretch"]


def test_ensure_todays_recurring_tasks_exist_is_idempotent_within_the_same_day(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    template = recurring_task_template.create(
        "Daily habit", recurring_task_template.FREQUENCY_DAILY, start_date=date(2026, 7, 1)
    )
    today_engine.ensure_todays_recurring_tasks_exist()
    today_engine.ensure_todays_recurring_tasks_exist()

    instances = task.find(recurring_template_id=recurring_task_template.get_id(block=template))
    assert len(instances) == 1


def test_ensure_todays_recurring_tasks_exist_skips_a_template_not_due_today(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    monday_only = recurring_task_template.create(
        "Monday task",
        recurring_task_template.FREQUENCY_WEEKLY,
        start_date=date(2026, 6, 1),
        days_of_week=[0],
    )
    today_engine.ensure_todays_recurring_tasks_exist()

    assert task.find(recurring_template_id=recurring_task_template.get_id(block=monday_only)) == []


def test_ensure_todays_recurring_tasks_exist_skips_an_inactive_template(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    template = recurring_task_template.create(
        "Daily habit", recurring_task_template.FREQUENCY_DAILY, start_date=date(2026, 7, 1)
    )
    recurring_task_template.set_is_active(False, recurring_task_template.get_id(block=template))
    today_engine.ensure_todays_recurring_tasks_exist()

    assert task.find(recurring_template_id=recurring_task_template.get_id(block=template)) == []


def test_get_todays_view_buckets_a_recurring_instance_under_recurring(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    recurring_task_template.create(
        "Daily habit", recurring_task_template.FREQUENCY_DAILY, start_date=date(2026, 7, 1)
    )
    view = today_engine.get_todays_view()
    assert [task.get_title(block=t) for t in view["recurring"]] == ["Daily habit"]
    assert view["due"] == []
    assert view["backburner"] == []


def test_get_todays_view_buckets_a_task_due_today_under_due(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    task.create("Pay rent", due_date=date(2026, 7, 4))
    view = today_engine.get_todays_view()
    assert [task.get_title(block=t) for t in view["due"]] == ["Pay rent"]


def test_get_todays_view_buckets_an_overdue_task_under_due(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    task.create("Overdue bill", due_date=date(2026, 7, 1))
    view = today_engine.get_todays_view()
    assert [task.get_title(block=t) for t in view["due"]] == ["Overdue bill"]


def test_get_todays_view_excludes_a_task_due_in_the_future(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    task.create("Not yet", due_date=date(2026, 7, 10))
    view = today_engine.get_todays_view()
    assert view["due"] == []
    assert view["backburner"] == []


def test_get_todays_view_buckets_a_task_with_no_due_date_under_backburner(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    task.create("Someday maybe")
    view = today_engine.get_todays_view()
    assert [task.get_title(block=t) for t in view["backburner"]] == ["Someday maybe"]


def test_get_todays_view_excludes_a_completed_ad_hoc_task(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    created = task.create("Already done", due_date=date(2026, 7, 1))
    task.set_is_complete(True, task.get_id(block=created))
    view = today_engine.get_todays_view()
    assert view["due"] == []


def test_get_todays_view_excludes_archived_tasks(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    created = task.create("Archived one")
    task.set_is_archived(True, task.get_id(block=created))
    view = today_engine.get_todays_view()
    assert view["backburner"] == []


def test_get_todays_view_does_not_carry_forward_a_missed_recurring_instance(monkeypatch):
    _set_today(monkeypatch, date(2026, 7, 4))
    recurring_task_template.create(
        "Daily habit", recurring_task_template.FREQUENCY_DAILY, start_date=date(2026, 7, 1)
    )
    today_engine.get_todays_view()  # generates + leaves incomplete for 7/4

    _set_today(monkeypatch, date(2026, 7, 5))
    view = today_engine.get_todays_view()
    assert len(view["recurring"]) == 1  # today's fresh instance only
    assert view["due"] == []  # yesterday's miss is not nagging as overdue
