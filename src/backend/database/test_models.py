from src.backend.database.models import Profile, Task


def test_task_holds_all_expected_fields():
    task = Task(
        id="abc",
        title="Buy milk",
        description="2%",
        completed=False,
        created_at="2026-01-01T00:00:00+00:00",
        updated_at="2026-01-01T00:00:00+00:00",
    )

    assert task.id == "abc"
    assert task.title == "Buy milk"
    assert task.description == "2%"
    assert task.completed is False


def test_profile_holds_display_name():
    profile = Profile(display_name="Austin")

    assert profile.display_name == "Austin"
