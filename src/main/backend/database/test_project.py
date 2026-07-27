import pytest

from src.main.backend.database.project import (
    EmptyProjectNameError,
    createProject,
    deleteProject,
    getAllProjects,
    getProject,
)
from src.main.backend.database.task import createTask, getTask


def test_create_project_persists_and_is_retrievable():
    project = createProject("Home renovation")

    fetched = getProject(project.id)

    assert fetched == project
    assert fetched.name == "Home renovation"


def test_create_project_with_empty_name_raises():
    with pytest.raises(EmptyProjectNameError):
        createProject("")


def test_create_project_with_whitespace_only_name_raises():
    with pytest.raises(EmptyProjectNameError):
        createProject("   ")


def test_get_project_on_unknown_id_returns_none():
    assert getProject("does-not-exist") is None


def test_create_project_assigns_increasing_order():
    first = createProject("Project one")
    second = createProject("Project two")

    assert first.order < second.order


def test_get_all_projects_sorts_by_order():
    first = createProject("Project one")
    second = createProject("Project two")

    all_projects = getAllProjects()

    assert [project.id for project in all_projects] == [first.id, second.id]


def test_get_all_projects_returns_empty_list_when_no_projects_exist():
    assert getAllProjects() == []


def test_delete_project_returns_false_for_unknown_id():
    assert deleteProject("does-not-exist") is False


def test_delete_project_removes_it():
    project = createProject("Home renovation")

    deleted = deleteProject(project.id)

    assert deleted is True
    assert getProject(project.id) is None


def test_delete_project_unassigns_its_tasks():
    project = createProject("Home renovation")
    task = createTask("Paint the fence", project_id=project.id)

    deleteProject(project.id)

    assert getTask(task.id).project_id is None


def test_delete_project_leaves_other_projects_tasks_unaffected():
    project = createProject("Home renovation")
    other_project = createProject("Other project")
    other_task = createTask("Task in other project", project_id=other_project.id)

    deleteProject(project.id)

    assert getTask(other_task.id).project_id == other_project.id
