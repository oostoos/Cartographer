from src.common.backend.responses import buildErrorResponse, buildSuccessResponse


def test_build_success_response_wraps_data():
    assert buildSuccessResponse({"a": 1}) == {"success": True, "data": {"a": 1}}


def test_build_success_response_defaults_data_to_none():
    assert buildSuccessResponse() == {"success": True, "data": None}


def test_build_error_response_wraps_message():
    assert buildErrorResponse("something broke") == {
        "success": False,
        "error": "something broke",
    }
