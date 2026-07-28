import pytest
from flask import Flask

from src.backend.request_validation import InvalidPayloadError, requireJsonObjectBody


def test_require_json_object_body_returns_the_parsed_dict():
    app = Flask(__name__)
    with app.test_request_context("/", json={"title": "Buy milk"}):
        assert requireJsonObjectBody() == {"title": "Buy milk"}


def test_require_json_object_body_raises_when_body_is_a_json_list():
    app = Flask(__name__)
    with app.test_request_context("/", json=["not", "a", "dict"]):
        with pytest.raises(InvalidPayloadError):
            requireJsonObjectBody()
