import pytest

from src.backend.database.paths import (
    DATA_ROOT,
    PROD_DATA_ENV,
    TEST_DATA_ENV,
    resolveDataRoot,
)


def test_resolve_data_root_prod_is_a_prod_subdirectory_of_data():
    root = resolveDataRoot(PROD_DATA_ENV)
    assert root.name == PROD_DATA_ENV
    assert root.parent.name == ".data"


def test_resolve_data_root_test_is_a_test_subdirectory_of_data():
    root = resolveDataRoot(TEST_DATA_ENV)
    assert root.name == TEST_DATA_ENV
    assert root.parent.name == ".data"


def test_resolve_data_root_rejects_unknown_env():
    with pytest.raises(ValueError):
        resolveDataRoot("staging")


def test_data_root_resolves_to_one_of_the_known_environments():
    # DATA_ROOT is fixed at import time from whatever CARTOGRAPHER_DATA_ENV
    # was set to (falling back to DEFAULT_DATA_ENV); assert it landed on a
    # valid resolution rather than assuming a specific developer's env.
    assert DATA_ROOT in (resolveDataRoot(PROD_DATA_ENV), resolveDataRoot(TEST_DATA_ENV))
