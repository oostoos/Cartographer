from lib.stack.parchment.list_store import (
    appendToList,
    createList,
    deleteList,
    readList,
)


def test_create_and_read_list_round_trips_elements(tmp_path):
    createList(tmp_path, "widget", "list-1", ["a", "b", "c"])

    assert readList(tmp_path, "widget", "list-1") == ["a", "b", "c"]


def test_read_list_missing_returns_none(tmp_path):
    assert readList(tmp_path, "widget", "does-not-exist") is None


def test_create_list_with_no_elements_round_trips_to_empty_list(tmp_path):
    createList(tmp_path, "widget", "list-1", [])

    assert readList(tmp_path, "widget", "list-1") == []


def test_create_list_overwrites_existing_list(tmp_path):
    createList(tmp_path, "widget", "list-1", ["a"])

    createList(tmp_path, "widget", "list-1", ["x", "y"])

    assert readList(tmp_path, "widget", "list-1") == ["x", "y"]


def test_list_elements_with_embedded_newlines_round_trip(tmp_path):
    createList(tmp_path, "widget", "list-1", ["line one\nline two", "second"])

    assert readList(tmp_path, "widget", "list-1") == ["line one\nline two", "second"]


def test_delete_list_removes_it(tmp_path):
    createList(tmp_path, "widget", "list-1", ["a"])

    deleteList(tmp_path, "widget", "list-1")

    assert readList(tmp_path, "widget", "list-1") is None


def test_delete_list_on_missing_list_is_noop(tmp_path):
    deleteList(tmp_path, "widget", "does-not-exist")  # should not raise


def test_append_to_list_adds_element_to_end(tmp_path):
    createList(tmp_path, "widget", "list-1", ["a", "b"])

    result = appendToList(tmp_path, "widget", "list-1", "c")

    assert result == ["a", "b", "c"]
    assert readList(tmp_path, "widget", "list-1") == ["a", "b", "c"]


def test_append_to_list_creates_list_if_it_does_not_exist(tmp_path):
    result = appendToList(tmp_path, "widget", "new-list", "first")

    assert result == ["first"]
    assert readList(tmp_path, "widget", "new-list") == ["first"]


def test_list_element_can_be_another_lists_id_for_2d_composition(tmp_path):
    # An element can itself be the id of another list, giving 2D/3D composition
    # for free without any extra graph machinery.
    createList(tmp_path, "widget", "inner-list", ["leaf-a", "leaf-b"])
    createList(tmp_path, "widget", "outer-list", ["inner-list"])

    outer = readList(tmp_path, "widget", "outer-list")
    assert outer == ["inner-list"]

    inner_id = outer[0]
    assert readList(tmp_path, "widget", inner_id) == ["leaf-a", "leaf-b"]
