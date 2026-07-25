import pytest

from src.common.backend.responses import buildErrorResponse, buildSuccessResponse


@pytest.fixture(autouse=True)
def _app_context():
    from flask import Flask

    with Flask(__name__).app_context():
        yield


def test_build_success_response_wraps_data_and_defaults_to_200():
    response, status_code = buildSuccessResponse({"a": 1})

    assert response.get_json() == {"success": True, "data": {"a": 1}}
    assert status_code == 200


def test_build_success_response_defaults_data_to_none():
    response, _ = buildSuccessResponse()

    assert response.get_json() == {"success": True, "data": None}


def test_build_success_response_uses_given_status_code():
    _, status_code = buildSuccessResponse({"a": 1}, status_code=201)

    assert status_code == 201


def test_build_error_response_wraps_message_and_defaults_to_400():
    response, status_code = buildErrorResponse("something broke")

    assert response.get_json() == {"success": False, "error": "something broke"}
    assert status_code == 400


def test_build_error_response_uses_given_status_code():
    _, status_code = buildErrorResponse("not found", status_code=404)

    assert status_code == 404
